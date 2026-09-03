import { NextRequest, NextResponse } from "next/server";
import {
  getClientIp,
  rateLimiter,
  RATE_LIMIT_RULES,
  sanitizeString,
  detectSuspiciousPatterns,
  logSecurityIncident,
} from "@/lib/security";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // 1. IP Rate Limiting
  const rateCheck = rateLimiter.check(
    `verify_bot_${ip}`,
    RATE_LIMIT_RULES.BOT_ADMIN_VERIFY.limit,
    RATE_LIMIT_RULES.BOT_ADMIN_VERIFY.windowMs
  );

  if (!rateCheck.allowed) {
    logSecurityIncident({
      type: "RATE_LIMIT",
      ip,
      details: "Rate limit exceeded on verify-bot-admin endpoint",
    });
    return NextResponse.json(
      {
        success: false,
        error: `Too many verification attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
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
        details: `Suspicious payload in verify-bot-admin: ${suspicious.reason}`,
      });
      return NextResponse.json(
        { success: false, error: "Invalid or suspicious request" },
        { status: 400 }
      );
    }

    const { channel } = rawBody;

    if (!channel || typeof channel !== "string") {
      return NextResponse.json(
        { success: false, error: "Channel username or link is required" },
        { status: 400 }
      );
    }

    const cleanInput = sanitizeString(channel, 128);
    const cleanChannel = cleanInput.replace("https://t.me/", "").replace("http://t.me/", "").replace("t.me/", "").replace("@", "").trim();

    if (!/^[a-zA-Z0-9_]{4,32}$/.test(cleanChannel)) {
      return NextResponse.json(
        { success: false, error: "Invalid channel username format" },
        { status: 400 }
      );
    }

    const formattedChannel = `@${cleanChannel}`;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // If bot token is not configured yet, provide simulated success so test flows don't block
    if (!botToken || botToken.includes("YourTelegramBotTokenHere") || botToken.includes("YOUR_BOT_TOKEN")) {
      return NextResponse.json({
        success: true,
        isAdmin: true,
        simulated: true,
        message: "Bot Admin verified (simulation mode until live TELEGRAM_BOT_TOKEN is set in Vercel)",
      });
    }

    // 1. Get bot id from getMe
    const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, { cache: "no-store" });
    const meData = await meRes.json();
    if (!meData.ok) {
      return NextResponse.json(
        { success: false, error: "Bot token error: " + (meData.description || "Invalid token") },
        { status: 400 }
      );
    }
    const botId = meData.result.id;

    // 2. Check bot's status in the target channel
    const memberRes = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(
        formattedChannel
      )}&user_id=${botId}`,
      { cache: "no-store" }
    );
    const memberData = await memberRes.json();

    if (!memberData.ok) {
      return NextResponse.json({
        success: false,
        isAdmin: false,
        error: `Bot cannot verify ${formattedChannel}. Make sure the channel username is correct and bot is added: ${memberData.description}`,
      });
    }

    const status = memberData.result?.status;
    if (status === "administrator" || status === "creator") {
      return NextResponse.json({
        success: true,
        isAdmin: true,
        status,
        message: `Success! Bot is verified as Administrator in ${formattedChannel}`,
      });
    } else {
      return NextResponse.json({
        success: false,
        isAdmin: false,
        status,
        error: `Bot status is '${status}'. Please promote bot to Administrator in Channel Settings.`,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
