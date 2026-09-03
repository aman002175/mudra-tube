import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  getClientIp,
  rateLimiter,
  RATE_LIMIT_RULES,
  sanitizeString,
  validateUserId,
  logSecurityIncident,
} from "@/lib/security";
import { loadDatabase, saveDatabase, addTransaction } from "@/lib/db";

/**
 * CPA Offerwall Postback Webhook
 * 
 * Called by CPA providers (Monlix, Wannads, CPALead, etc.) when a user completes an offer.
 * Credits coins/INR to the user's balance based on the offer reward.
 * 
 * Expected query params:
 *   - subid: Telegram user ID
 *   - reward: Reward amount in INR
 *   - campaign_id: Campaign reference (optional)
 *   - sig: HMAC-SHA256 signature for verification (optional but recommended)
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit: 30 postbacks per minute per IP
  const rateCheck = rateLimiter.check(
    `cpa_postback_${ip}`,
    30,
    60 * 1000
  );
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  try {
    const params = req.nextUrl.searchParams;

    const userId = sanitizeString(params.get("subid"), 64);
    const rewardStr = sanitizeString(params.get("reward"), 20);
    const campaignId = sanitizeString(params.get("campaign_id"), 64);
    const signature = params.get("sig");

    // Validate user ID
    const userVal = validateUserId(userId);
    if (!userVal.valid) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing user ID (subid)" },
        { status: 400 }
      );
    }

    // Validate reward amount
    const reward = parseFloat(rewardStr);
    if (isNaN(reward) || reward <= 0 || reward > 1000) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing reward amount" },
        { status: 400 }
      );
    }

    // Verify HMAC signature if CPA_POSTBACK_SECRET is configured
    const secretKey = process.env.CPA_POSTBACK_SECRET;
    if (secretKey && signature) {
      const expectedHash = crypto
        .createHmac("sha256", secretKey)
        .update(`${userId}:${reward}`)
        .digest("hex");

      if (!crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedHash, "hex"))) {
        logSecurityIncident({
          type: "TAMPERING_ATTEMPT",
          ip,
          userId: userVal.value,
          details: "CPA postback signature verification failed",
        });
        return NextResponse.json(
          { success: false, error: "Invalid signature" },
          { status: 403 }
        );
      }
    }

    // Load database and credit user
    const dbState = loadDatabase();
    const user = dbState.users[userVal.value];

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.is_banned) {
      return NextResponse.json(
        { success: false, error: "User is banned" },
        { status: 403 }
      );
    }

    // Credit the reward
    const balanceBefore = user.balance;
    const roundedReward = Math.round(reward * 100) / 100;
    user.balance = Math.round((user.balance + roundedReward) * 100) / 100;
    user.total_earned = Math.round((user.total_earned + roundedReward) * 100) / 100;

    // Log transaction
    addTransaction({
      user_id: userVal.value,
      type: "task_reward",
      amount_inr: roundedReward,
      balance_before: balanceBefore,
      balance_after: user.balance,
      reference_id: campaignId || "cpa_postback",
      note: `CPA offer completion${campaignId ? ` (campaign: ${campaignId})` : ""}`,
    });

    // Save updated user
    dbState.users[userVal.value] = user;
    await saveDatabase(dbState);

    return NextResponse.json({
      success: true,
      message: `Credited ₹${roundedReward} to user ${userVal.value}`,
      new_balance: user.balance,
    });
  } catch (error: any) {
    console.error("CPA postback error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support POST for some CPA providers
export async function POST(req: NextRequest) {
  return GET(req);
}
