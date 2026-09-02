import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { channel } = await req.json();

    if (!channel) {
      return NextResponse.json(
        { success: false, error: "Channel username or link is required" },
        { status: 400 }
      );
    }

    const cleanChannel = channel.trim().replace("https://t.me/", "@");
    const formattedChannel = cleanChannel.startsWith("@") ? cleanChannel : `@${cleanChannel}`;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // If bot token is not configured yet, provide simulated success so test flows don't block
    if (!botToken || botToken.includes("YourTelegramBotTokenHere")) {
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
