import { NextRequest, NextResponse } from "next/server";
import {
  getClientIp,
  rateLimiter,
  RATE_LIMIT_RULES,
  sanitizeString,
  detectSuspiciousPatterns,
  generateAdminSessionToken,
  logSecurityIncident,
} from "@/lib/security";

import crypto from "crypto";

function safeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimitKey = `admin_auth_${ip}`;

  // 1. Check Brute-Force Rate Limit
  const rateCheck = rateLimiter.check(
    rateLimitKey,
    RATE_LIMIT_RULES.ADMIN_AUTH.limit,
    RATE_LIMIT_RULES.ADMIN_AUTH.windowMs,
    RATE_LIMIT_RULES.ADMIN_AUTH.lockMs
  );

  if (!rateCheck.allowed) {
    logSecurityIncident({
      type: "FAILED_LOGIN",
      ip,
      details: `Admin login locked due to too many failed attempts. Retry after ${rateCheck.retryAfterSeconds}s`,
    });
    return NextResponse.json(
      {
        success: false,
        error: `Too many failed login attempts. This IP is temporarily locked for security. Please try again in ${Math.ceil(
          rateCheck.retryAfterSeconds / 60
        )} minutes.`,
      },
      { status: 429 }
    );
  }

  try {
    const rawBody = await req.json();

    // 2. Suspicious Username Payload Detection (prevent SQLi / injection while allowing special chars in password)
    const suspicious = detectSuspiciousPatterns({ username: rawBody.username });
    if (suspicious.isSuspicious) {
      logSecurityIncident({
        type: "SUSPICIOUS_PAYLOAD",
        ip,
        details: `Malicious payload detected in admin username: ${suspicious.reason}`,
      });
      return NextResponse.json(
        { success: false, error: "Suspicious request payload detected and blocked." },
        { status: 400 }
      );
    }

    const username = sanitizeString(rawBody.username, 64);
    const password = String(rawBody.password || "");

    const envUser = process.env.ADMIN_USERNAME;
    const envPass = process.env.ADMIN_PASSWORD;

    let isValid = false;

    if (envUser && envPass) {
      isValid = safeCompare(username, envUser) && safeCompare(password, envPass);
    } else if (process.env.NODE_ENV !== "production") {
      // Development-only safe fallbacks
      isValid =
        (safeCompare(username, "admin29") && safeCompare(password, "admin123")) ||
        (safeCompare(username, "admin") && safeCompare(password, "mudratube2026"));
    } else {
      return NextResponse.json(
        { success: false, error: "Admin authentication is not configured in environment variables." },
        { status: 500 }
      );
    }

    if (isValid) {
      // Clear failed login attempts counter on success
      rateLimiter.reset(rateLimitKey);

      // Generate HMAC-SHA256 signed admin session token
      const adminToken = generateAdminSessionToken(username);

      return NextResponse.json({
        success: true,
        token: adminToken,
        message: "Admin authentication successful.",
      });
    } else {
      logSecurityIncident({
        type: "FAILED_LOGIN",
        ip,
        details: `Failed admin login attempt with username: '${username}' (${rateCheck.remaining} attempts remaining before lockout)`,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Invalid Admin Username or Password.",
          remainingAttempts: rateCheck.remaining,
        },
        { status: 401 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Authentication error" },
      { status: 500 }
    );
  }
}
