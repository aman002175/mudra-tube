import { NextRequest, NextResponse } from "next/server";
import {
  getClientIp,
  rateLimiter,
  RATE_LIMIT_RULES,
  validateUserId,
  sanitizeString,
  detectSuspiciousPatterns,
  logSecurityIncident,
} from "@/lib/security";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // 1. IP Rate Limiting
  const rateCheck = rateLimiter.check(
    `verify_chan_${ip}`,
    RATE_LIMIT_RULES.CHANNEL_VERIFY.limit,
    RATE_LIMIT_RULES.CHANNEL_VERIFY.windowMs
  );

  if (!rateCheck.allowed) {
    logSecurityIncident({
      type: "RATE_LIMIT",
      ip,
      details: "Rate limit exceeded on verify-channel endpoint",
    });
    return NextResponse.json(
      {
        error: `Too many verification requests. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        retryAfter: rateCheck.retryAfterSeconds,
      },
      { status: 429 }
    );
  }

  try {
    const rawBody = await req.json();

    // 2. Suspicious payload check
    const suspicious = detectSuspiciousPatterns(rawBody);
    if (suspicious.isSuspicious) {
      logSecurityIncident({
        type: "SUSPICIOUS_PAYLOAD",
        ip,
        details: `Suspicious payload in verify-channel: ${suspicious.reason}`,
      });
      return NextResponse.json({ error: "Invalid or suspicious request" }, { status: 400 });
    }

    const { userId, channelId, taskId } = rawBody;

    // 3. Input Validation
    const userVal = validateUserId(userId);
    if (!userVal.valid) {
      return NextResponse.json({ error: "Invalid userId provided" }, { status: 400 });
    }

    const cleanChannel = sanitizeString(channelId, 128);
    if (!cleanChannel) {
      return NextResponse.json(
        { error: "Missing required parameters: userId or channelId" },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // If bot token is not yet configured, gracefully provide demo simulation
    if (!botToken || botToken.includes("YourTelegramBotTokenHere") || botToken.includes("YOUR_BOT_TOKEN")) {
      return NextResponse.json({
        success: true,
        isMember: true,
        mode: "simulation_demo",
        message: "Demo verification successful. Add TELEGRAM_BOT_TOKEN in .env for live Telegram API checks.",
      });
    }

    // Call official Telegram Bot API: getChatMember
    const tgUrl = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(
      cleanChannel
    )}&user_id=${encodeURIComponent(userVal.value)}`;

    const response = await fetch(tgUrl, { cache: "no-store" });
    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json(
        {
          success: false,
          isMember: false,
          error: data.description || "Failed to verify membership with Telegram Bot API",
        },
        { status: 400 }
      );
    }

    const status = data.result?.status;
    const validStatuses = ["creator", "administrator", "member"];

    if (validStatuses.includes(status) || (status === "restricted" && data.result?.is_member)) {
      return NextResponse.json({
        success: true,
        isMember: true,
        status,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          isMember: false,
          status,
          message: "User is not a member of the channel yet. Please join and try again.",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error during verification" },
      { status: 500 }
    );
  }
}
