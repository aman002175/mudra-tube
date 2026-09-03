import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { TelegramUser } from "@/types";

// ==========================================
// 1. IP & CLIENT IDENTIFICATION
// ==========================================
export function getClientIp(req: NextRequest): string {
  // Prioritize Cloudflare / trusted edge proxy headers over spoofable X-Forwarded-For
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    return parts[0].trim();
  }
  return "127.0.0.1";
}

// ==========================================
// 2. IN-MEMORY SLIDING WINDOW RATE LIMITER
// ==========================================
interface RateLimitRecord {
  timestamps: number[];
  lockedUntil?: number;
}

class RateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Periodically clean up records older than 30 minutes to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const expirationThreshold = now - 30 * 60 * 1000;
      this.store.forEach((record, key) => {
        record.timestamps = record.timestamps.filter((ts) => ts > expirationThreshold);
        if (record.timestamps.length === 0 && (!record.lockedUntil || record.lockedUntil < now)) {
          this.store.delete(key);
        }
      });
    }, 5 * 60 * 1000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Check rate limit for a key
   * @param key Unique identifier (IP, userId, or action combo)
   * @param limit Maximum allowed requests in window
   * @param windowMs Window duration in milliseconds
   * @param lockDurationMs Optional lock penalty duration if exceeded
   */
  public check(
    key: string,
    limit: number,
    windowMs: number,
    lockDurationMs: number = 0
  ): {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
    total: number;
  } {
    const now = Date.now();
    let record = this.store.get(key);

    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Check if key is temporarily locked
    if (record.lockedUntil && record.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
        total: record.timestamps.length,
      };
    }

    // Filter out timestamps outside the window
    const windowStart = now - windowMs;
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= limit) {
      if (lockDurationMs > 0) {
        record.lockedUntil = now + lockDurationMs;
      }
      const oldestInWindow = record.timestamps[0] || now;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldestInWindow + windowMs - now) / 1000)
      );

      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
        total: record.timestamps.length,
      };
    }

    // Record this valid request
    record.timestamps.push(now);
    const remaining = Math.max(0, limit - record.timestamps.length);

    return {
      allowed: true,
      remaining,
      retryAfterSeconds: 0,
      total: record.timestamps.length,
    };
  }

  /**
   * Reset rate limit for a key (e.g. after successful auth)
   */
  public reset(key: string): void {
    this.store.delete(key);
  }
}

// Global Singleton Rate Limiter
declare global {
  var __mudratube_rate_limiter: RateLimiter | undefined;
}

export const rateLimiter: RateLimiter =
  global.__mudratube_rate_limiter || (global.__mudratube_rate_limiter = new RateLimiter());

// Pre-defined Rate Limiting Policies
export const RATE_LIMIT_RULES = {
  // General public API calls
  SYNC_GET: { limit: 60, windowMs: 60 * 1000 },       // 60 req/min
  SYNC_POST: { limit: 30, windowMs: 60 * 1000 },      // 30 req/min
  // High-risk or sensitive endpoints
  ADMIN_AUTH: { limit: 5, windowMs: 15 * 60 * 1000, lockMs: 15 * 60 * 1000 }, // 5 failed logins / 15 min -> 15 min lock
  WITHDRAWAL_SUBMIT: { limit: 2, windowMs: 60 * 1000 },  // 2 withdrawals / min
  TASK_COMPLETE: { limit: 15, windowMs: 60 * 1000 },     // 15 tasks / min
  SUPPORT_MESSAGE: { limit: 6, windowMs: 60 * 1000 },    // 6 messages / min
  PROMOTION_SUBMIT: { limit: 3, windowMs: 5 * 60 * 1000 }, // 3 promotions / 5 min
  CHANNEL_VERIFY: { limit: 10, windowMs: 60 * 1000 },    // 10 channel verifications / min
  BOT_ADMIN_VERIFY: { limit: 10, windowMs: 60 * 1000 },  // 10 bot checks / min
};

// ==========================================
// 3. INPUT VALIDATION & SANITIZATION
// ==========================================

/**
 * Remove HTML tags, script tags, control chars, and trim whitespace
 */
export function sanitizeString(val: any, maxLength = 255): string {
  if (val === null || val === undefined) return "";
  let str = String(val);
  // Remove NULL bytes and dangerous control characters
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // Strip HTML / XML tags to prevent XSS
  str = str.replace(/<[^>]*>?/gm, "");
  // Trim and enforce length limit
  return str.trim().slice(0, maxLength);
}

/**
 * Detect malicious injection patterns (SQLi, NoSQLi, XSS, Path Traversal, Proto Pollution)
 */
export function detectSuspiciousPatterns(data: any): { isSuspicious: boolean; reason?: string } {
  if (!data) return { isSuspicious: false };

  const str = typeof data === "string" ? data : JSON.stringify(data);

  // Prototype Pollution
  if (str.includes("__proto__") || str.includes("constructor.prototype")) {
    return { isSuspicious: true, reason: "Prototype pollution attempt detected" };
  }

  // Cross-Site Scripting (XSS)
  const xssPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|javascript:|onerror\s*=|onload\s*=|document\.cookie|window\.location/i;
  if (xssPattern.test(str)) {
    return { isSuspicious: true, reason: "XSS script execution pattern detected" };
  }

  // SQL Injection keywords
  const sqliPattern = /(\bUNION\b\s+\bSELECT\b|\bDROP\b\s+\bTABLE\b|--\s*$|';|\bOR\b\s+['"\d]+\s*=\s*['"\d]+)/i;
  if (sqliPattern.test(str)) {
    return { isSuspicious: true, reason: "SQL injection pattern detected" };
  }

  // Path Traversal
  if (str.includes("../") || str.includes("..\\")) {
    return { isSuspicious: true, reason: "Path traversal attempt detected" };
  }

  return { isSuspicious: false };
}

/**
 * Validates a positive integer strictly (prevents NaN, decimals, negatives, overflow)
 */
export function validateInteger(
  val: any,
  min: number = 1,
  max: number = 10_000_000
): { valid: boolean; value: number; error?: string } {
  const num = Number(val);
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return { valid: false, value: 0, error: "Must be a valid integer" };
  }
  if (num < min) {
    return { valid: false, value: num, error: `Value must be at least ${min}` };
  }
  if (num > max) {
    return { valid: false, value: num, error: `Value cannot exceed ${max}` };
  }
  return { valid: true, value: num };
}

/**
 * Validate User ID format
 */
export function validateUserId(id: any): { valid: boolean; value: string; error?: string } {
  if (!id || typeof id !== "string") {
    return { valid: false, value: "", error: "Missing user ID" };
  }
  const cleanId = id.trim();
  // Valid user ID: 3 to 64 alphanumeric characters, underscores, hyphens
  if (!/^[a-zA-Z0-9_\-]{3,64}$/.test(cleanId)) {
    return { valid: false, value: "", error: "Invalid user ID format" };
  }
  // Reject browser demo users from polluting the database
  if (cleanId.startsWith("demo_") || cleanId.startsWith("browser_")) {
    return { valid: false, value: "", error: "Demo users are not allowed in the database" };
  }
  return { valid: true, value: cleanId };
}

/**
 * Validate UPI ID format (e.g. name@bank, phone@upi)
 */
export function validateUpiId(upi: string): boolean {
  if (!upi || typeof upi !== "string") return false;
  const cleanUpi = upi.trim();
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(cleanUpi);
}

/**
 * Validate TON Address (EQ/UQ/kQ/0Q format or raw hex)
 */
export function validateTonAddress(ton: string): boolean {
  if (!ton || typeof ton !== "string") return false;
  const cleanTon = ton.trim();
  // TON userfriendly base64url addresses start with EQ, UQ, kQ, 0Q and are 48 chars
  // Raw addresses format: 0:... or -1:... with 64 hex chars
  const friendlyRegex = /^(EQ|UQ|kQ|0Q)[a-zA-Z0-9_\-]{46}$/;
  const rawRegex = /^(-1|0):[a-fA-F0-9]{64}$/;
  return friendlyRegex.test(cleanTon) || rawRegex.test(cleanTon);
}

/**
 * Validate Telegram channel link or username
 */
export function validateTelegramChannel(channel: string): { valid: boolean; formatted: string; error?: string } {
  if (!channel || typeof channel !== "string") {
    return { valid: false, formatted: "", error: "Channel username or link is required" };
  }
  let clean = channel.trim().replace("https://t.me/", "").replace("http://t.me/", "").replace("t.me/", "");
  clean = clean.replace("@", "");

  if (!/^[a-zA-Z0-9_]{4,32}$/.test(clean)) {
    return {
      valid: false,
      formatted: "",
      error: "Invalid Telegram channel username (must be 4-32 characters, letters, numbers, and underscores)",
    };
  }

  return { valid: true, formatted: `@${clean}` };
}

// ==========================================
// 4. TELEGRAM MINI APP INITDATA HMAC VALIDATION
// ==========================================
export interface TelegramAuthValidationResult {
  valid: boolean;
  user?: TelegramUser;
  authDate?: number;
  isSimulated?: boolean;
  error?: string;
}

/**
 * Validates Telegram WebApp initData using HMAC-SHA256
 * Conforms to the official Telegram Mini Apps authentication spec:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramInitData(
  initData: string | null | undefined,
  botToken: string | undefined
): TelegramAuthValidationResult {
  // If bot token is not configured or in development/simulation
  if (!botToken || botToken.includes("YOUR_BOT_TOKEN") || botToken.includes("YourTelegramBotTokenHere")) {
    // Graceful fallback for local development or demo testing
    return { valid: true, isSimulated: true };
  }

  if (!initData || typeof initData !== "string") {
    return { valid: false, error: "Missing Telegram initData header" };
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");

    if (!hash) {
      return { valid: false, error: "Missing hash parameter in initData" };
    }

    // Collect and sort all parameters except "hash"
    const dataCheckArr: string[] = [];
    params.delete("hash");

    const paramMap: Record<string, string> = {};
    params.forEach((val, key) => {
      paramMap[key] = val;
    });

    const sortedKeys = Object.keys(paramMap).sort();
    for (let i = 0; i < sortedKeys.length; i++) {
      const key = sortedKeys[i];
      dataCheckArr.push(`${key}=${paramMap[key]}`);
    }
    const dataCheckString = dataCheckArr.join("\n");

    // secret_key = HMAC-SHA-256("WebAppData", botToken)
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();

    // calculated_hash = HMAC-SHA-256(secret_key, dataCheckString)
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    // Constant-time comparison to prevent timing attacks
    const hashBuf = Buffer.from(hash, "hex");
    const calcBuf = Buffer.from(calculatedHash, "hex");

    // Constant-time comparison using fixed-length SHA-256 digests to prevent timing attacks
    const hashDigest = crypto.createHash("sha256").update(Buffer.from(hash, "hex")).digest();
    const calcDigest = crypto.createHash("sha256").update(Buffer.from(calculatedHash, "hex")).digest();

    if (hash.length !== calculatedHash.length || !crypto.timingSafeEqual(hashDigest, calcDigest)) {
      return { valid: false, error: "Invalid signature: data tampering detected" };
    }

    // Check expiration (auth_date): Reject data older than 24 hours or in future > 60s
    const authDateStr = params.get("auth_date");
    const authDate = authDateStr ? parseInt(authDateStr, 10) : 0;
    const now = Math.floor(Date.now() / 1000);

    if (!authDate || Number.isNaN(authDate)) {
      return { valid: false, error: "Missing or invalid auth_date in initData" };
    }
    if (now - authDate > 86400) {
      return { valid: false, error: "InitData has expired (replay attack protection)" };
    }
    if (authDate > now + 60) {
      return { valid: false, error: "InitData timestamp is in the future" };
    }

    // Extract user profile
    const userJson = params.get("user");
    let user: TelegramUser | undefined = undefined;
    if (userJson) {
      user = JSON.parse(userJson);
    }

    return { valid: true, user, authDate };
  } catch (err: any) {
    return { valid: false, error: `InitData verification failed: ${err.message}` };
  }
}

// ==========================================
// 5. SIGNED ADMIN SESSION TOKENS (HMAC-SHA256)
// ==========================================
const ADMIN_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_PASSWORD ||
  "mudratube_super_secret_admin_salt_2026_x89!";

export function generateAdminSessionToken(username: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      user: username,
      role: "admin",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 12 * 3600, // 12 hours validity
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", ADMIN_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

export function verifyAdminSessionToken(token: string | null | undefined): {
  valid: boolean;
  username?: string;
  error?: string;
} {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Missing admin authorization token" };
  }

  const cleanToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
  const parts = cleanToken.split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "Malformed admin session token" };
  }

  const [header, payload, signature] = parts;

  // Verify HMAC signature with constant-time digest comparison
  const expectedSignature = crypto
    .createHmac("sha256", ADMIN_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");

  const sigDigest = crypto.createHash("sha256").update(Buffer.from(signature)).digest();
  const expDigest = crypto.createHash("sha256").update(Buffer.from(expectedSignature)).digest();

  if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(sigDigest, expDigest)) {
    return { valid: false, error: "Invalid admin token signature" };
  }

  try {
    const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);

    if (typeof decodedPayload.exp !== "number" || decodedPayload.exp < now) {
      return { valid: false, error: "Admin session has expired" };
    }

    if (decodedPayload.role !== "admin") {
      return { valid: false, error: "Unauthorized role in token" };
    }

    return { valid: true, username: decodedPayload.user };
  } catch {
    return { valid: false, error: "Failed to decode admin token payload" };
  }
}

// ==========================================
// 6. AUDIT & SECURITY INCIDENT LOGGING
// ==========================================
export interface SecurityIncident {
  id: string;
  timestamp: string;
  type: "RATE_LIMIT" | "TAMPERING_ATTEMPT" | "UNAUTHORIZED_ADMIN" | "SUSPICIOUS_PAYLOAD" | "FAILED_LOGIN";
  ip: string;
  userId?: string;
  details: string;
}

declare global {
  var __mudratube_security_logs: SecurityIncident[] | undefined;
}

export function logSecurityIncident(incident: Omit<SecurityIncident, "id" | "timestamp">) {
  if (!global.__mudratube_security_logs) {
    global.__mudratube_security_logs = [];
  }
  const entry: SecurityIncident = {
    id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...incident,
  };
  global.__mudratube_security_logs.unshift(entry);
  // Keep latest 200 incidents in memory
  if (global.__mudratube_security_logs.length > 200) {
    global.__mudratube_security_logs.pop();
  }
}

export function getSecurityIncidents(): SecurityIncident[] {
  return global.__mudratube_security_logs || [];
}
