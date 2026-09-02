import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, channelId, taskId } = body;

    if (!userId || !channelId) {
      return NextResponse.json(
        { error: "Missing required parameters: userId or channelId" },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // If bot token is not yet configured, gracefully provide demo simulation
    if (!botToken || botToken.includes("YourTelegramBotTokenHere")) {
      return NextResponse.json({
        success: true,
        isMember: true,
        mode: "simulation_demo",
        message: "Demo verification successful. Add TELEGRAM_BOT_TOKEN in .env for live Telegram API checks.",
      });
    }

    // Call official Telegram Bot API: getChatMember
    const tgUrl = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(
      channelId
    )}&user_id=${encodeURIComponent(userId)}`;

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
