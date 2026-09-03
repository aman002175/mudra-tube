import { NextRequest, NextResponse } from "next/server";
import {
  UserProfile,
  WithdrawalRequest,
  PromotionRequest,
  SupportChatMessage,
  ChannelTask,
  GlobalConfig,
  AdminPaymentMethod,
  PromoPackage,
} from "@/types";
import { initialConfig, initialPackages, initialPaymentMethods, initialTasks } from "@/lib/mockData";
import {
  getClientIp,
  rateLimiter,
  RATE_LIMIT_RULES,
  sanitizeString,
  detectSuspiciousPatterns,
  validateInteger,
  validateUserId,
  validateUpiId,
  validateTonAddress,
  validateTelegramChannel,
  verifyTelegramInitData,
  verifyAdminSessionToken,
  logSecurityIncident,
} from "@/lib/security";
import { loadDatabase, saveDatabase } from "@/lib/db";

// ==========================================
// PERSISTENT SERVER STORE
// ==========================================
interface LiveStore {
  users: Map<string, UserProfile>;
  withdrawals: WithdrawalRequest[];
  promotions: PromotionRequest[];
  supportMessages: SupportChatMessage[];
  tasks: ChannelTask[];
  paymentMethods: AdminPaymentMethod[];
  packages: PromoPackage[];
  config: GlobalConfig;
  userTaskCooldown: Map<string, number>;
  userWithdrawCooldown: Map<string, number>;
}

declare global {
  var __mudratube_live_store: LiveStore | undefined;
}

function getLiveStore(): LiveStore {
  if (!global.__mudratube_live_store) {
    const dbState = loadDatabase();
    const userMap = new Map<string, UserProfile>();
    for (const [uid, u] of Object.entries(dbState.users || {})) {
      userMap.set(uid, u);
    }
    global.__mudratube_live_store = {
      users: userMap,
      withdrawals: dbState.withdrawals || [],
      promotions: dbState.promotions || [],
      supportMessages: dbState.supportMessages || [],
      tasks: dbState.tasks?.length > 0 ? dbState.tasks : [...initialTasks],
      paymentMethods: dbState.paymentMethods?.length > 0 ? dbState.paymentMethods : [...initialPaymentMethods],
      packages: dbState.packages?.length > 0 ? dbState.packages : [...initialPackages],
      config: { ...initialConfig, ...(dbState.config || {}) },
      userTaskCooldown: new Map<string, number>(),
      userWithdrawCooldown: new Map<string, number>(),
    };
  }
  return global.__mudratube_live_store;
}

function persistStore(store: LiveStore): void {
  const usersRecord: Record<string, UserProfile> = {};
  for (const [uid, u] of store.users.entries()) {
    usersRecord[uid] = u;
  }
  saveDatabase({
    users: usersRecord,
    withdrawals: store.withdrawals,
    promotions: store.promotions,
    supportMessages: store.supportMessages,
    tasks: store.tasks,
    paymentMethods: store.paymentMethods,
    packages: store.packages,
    config: store.config,
  });
}

// ==========================================
// GET /api/sync
// ==========================================
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);

  // 1. IP Rate Limiting for GET
  const rateCheck = rateLimiter.check(
    `sync_get_${ip}`,
    RATE_LIMIT_RULES.SYNC_GET.limit,
    RATE_LIMIT_RULES.SYNC_GET.windowMs
  );
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please slow down.", retryAfter: rateCheck.retryAfterSeconds },
      { status: 429 }
    );
  }

  const store = getLiveStore();
  const searchParams = request.nextUrl.searchParams;
  const rawUserId = searchParams.get("user_id");
  const userId = rawUserId ? sanitizeString(rawUserId, 64) : null;

  // Check if request is made by authenticated admin
  const authHeader = request.headers.get("authorization") || request.headers.get("x-admin-token");
  const adminCheck = verifyAdminSessionToken(authHeader);

  const actualUsersCount = store.users.size;
  const customUsersCount = store.config.custom_total_users_count || 0;
  const totalUsers = Math.max(actualUsersCount, customUsersCount);

  if (adminCheck.valid) {
    // Admin has full visibility of database state & security incidents
    const allUsers = Array.from(store.users.values());
    return NextResponse.json({
      success: true,
      isAdmin: true,
      user: userId ? store.users.get(userId) || null : null,
      users: allUsers,
      total_users: totalUsers,
      withdrawals: store.withdrawals,
      promotions: store.promotions,
      supportMessages: store.supportMessages,
      tasks: store.tasks,
      packages: store.packages,
      paymentMethods: store.paymentMethods,
      config: store.config,
    });
  }

  // Regular users & guests: Privacy-guarded view
  // NEVER leak all users, all payouts, or other users' support messages
  const currentUser = userId ? store.users.get(userId) || null : null;
  const userWithdrawals = userId
    ? store.withdrawals.filter((w) => w.user_id === userId)
    : [];
  const userMessages = userId
    ? store.supportMessages.filter((m) => m.user_id === userId)
    : [];

  return NextResponse.json({
    success: true,
    isAdmin: false,
    user: currentUser,
    total_users: totalUsers,
    withdrawals: userWithdrawals,
    promotions: [], // Hidden from public GET
    supportMessages: userMessages,
    tasks: store.tasks,
    packages: store.packages,
    paymentMethods: store.paymentMethods.filter((pm) => pm.is_active),
    config: store.config,
  });
}

// ==========================================
// POST /api/sync
// ==========================================
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const store = getLiveStore();

  // 1. General IP Rate Limit for POST
  const generalRate = rateLimiter.check(
    `sync_post_${ip}`,
    RATE_LIMIT_RULES.SYNC_POST.limit,
    RATE_LIMIT_RULES.SYNC_POST.windowMs
  );
  if (!generalRate.allowed) {
    logSecurityIncident({
      type: "RATE_LIMIT",
      ip,
      details: "POST /api/sync general rate limit exceeded",
    });
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Please wait before retrying.", retryAfter: generalRate.retryAfterSeconds },
      { status: 429 }
    );
  }

  try {
    const rawBody = await request.json();

    // 2. Suspicious Payload & Attack Pattern Detection
    const suspicious = detectSuspiciousPatterns(rawBody);
    if (suspicious.isSuspicious) {
      logSecurityIncident({
        type: "SUSPICIOUS_PAYLOAD",
        ip,
        details: `Blocked malicious payload in POST /api/sync: ${suspicious.reason}`,
      });
      return NextResponse.json(
        { success: false, error: "Forbidden: Malicious request pattern detected." },
        { status: 400 }
      );
    }

    const { action, payload } = rawBody;
    if (!action || typeof action !== "string" || !payload || typeof payload !== "object") {
      return NextResponse.json({ success: false, error: "Malformed request format" }, { status: 400 });
    }

    // 3. ADMIN ACTION GUARDS (Prevent Unauthorized Admin Manipulation)
    if (action.startsWith("admin_")) {
      const authHeader = request.headers.get("authorization") || request.headers.get("x-admin-token");
      const adminAuth = verifyAdminSessionToken(authHeader);

      if (!adminAuth.valid) {
        logSecurityIncident({
          type: "UNAUTHORIZED_ADMIN",
          ip,
          details: `Blocked unauthorized call to '${action}' without valid admin token. Error: ${adminAuth.error}`,
        });
        return NextResponse.json(
          { success: false, error: "Unauthorized: Valid Admin token required." },
          { status: 403 }
        );
      }
    }

    // 4. ACTION ROUTING WITH STRICT VALIDATION
    switch (action) {
      // ----------------------------------------------------
      // 1. User Connects via Telegram or Browser
      // ----------------------------------------------------
      case "connect_user": {
        const userVal = validateUserId(payload.user_id);
        if (!userVal.valid) {
          return NextResponse.json({ success: false, error: userVal.error }, { status: 400 });
        }
        const userId = userVal.value;

        // Verify Telegram initData if supplied
        const tgInitData = request.headers.get("x-telegram-init-data");
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        if (tgInitData && tgInitData.trim() !== "") {
          const tgAuth = verifyTelegramInitData(tgInitData, botToken);
          if (!tgAuth.valid) {
            logSecurityIncident({
              type: "TAMPERING_ATTEMPT",
              ip,
              userId,
              details: `Telegram initData validation failed: ${tgAuth.error}`,
            });
            return NextResponse.json(
              { success: false, error: "Telegram authentication signature verification failed." },
              { status: 401 }
            );
          }

          // Anti-impersonation: If valid Telegram user is decoded, verify ID match
          if (tgAuth.user && String(tgAuth.user.id) !== userId) {
            logSecurityIncident({
              type: "TAMPERING_ATTEMPT",
              ip,
              userId,
              details: `User ID impersonation mismatch: payload=${userId}, verifiedTelegram=${tgAuth.user.id}`,
            });
            return NextResponse.json(
              { success: false, error: "User identity mismatch. Request rejected." },
              { status: 403 }
            );
          }
        }

        const cleanUsername = sanitizeString(payload.username || `user_${userId}`, 40);
        const cleanFirstName = sanitizeString(payload.first_name || "Earner", 50);

        let existingUser = store.users.get(userId);
        if (!existingUser) {
          existingUser = {
            user_id: userId,
            username: cleanUsername,
            first_name: cleanFirstName,
            balance: 0,
            total_earned: 0,
            total_withdrawn: 0,
            completed_tasks: [],
            referrals_count: 0,
            is_banned: false,
            created_at: new Date().toISOString(),
          };
          store.users.set(userId, existingUser);
        } else {
          // If banned, block access
          if (existingUser.is_banned) {
            return NextResponse.json({ success: false, error: "Account suspended due to policy violation." }, { status: 403 });
          }
          if (cleanUsername) existingUser.username = cleanUsername;
          if (cleanFirstName) existingUser.first_name = cleanFirstName;
        }

        // Optional saved payout addresses validation
        if (payload.saved_upi_id !== undefined) {
          const upiStr = sanitizeString(payload.saved_upi_id, 100);
          if (upiStr === "" || validateUpiId(upiStr)) {
            existingUser.saved_upi_id = upiStr;
          }
        }
        if (payload.saved_ton_address !== undefined) {
          const tonStr = sanitizeString(payload.saved_ton_address, 100);
          if (tonStr === "" || validateTonAddress(tonStr)) {
            existingUser.saved_ton_address = tonStr;
          }
        }

        persistStore(store);
        return NextResponse.json({ success: true, user: existingUser });
      }

      // ----------------------------------------------------
      // 2. User Completes a Channel Task (Anti-Cheat & Authoritative Reward)
      // ----------------------------------------------------
      case "complete_task": {
        const userVal = validateUserId(payload.user_id);
        const taskId = sanitizeString(payload.task_id, 64);

        if (!userVal.valid || !taskId) {
          return NextResponse.json({ success: false, error: "Invalid user_id or task_id" }, { status: 400 });
        }
        const userId = userVal.value;

        // Rate limit: User cannot complete tasks faster than allowed
        const userRate = rateLimiter.check(
          `task_rate_${userId}`,
          RATE_LIMIT_RULES.TASK_COMPLETE.limit,
          RATE_LIMIT_RULES.TASK_COMPLETE.windowMs
        );
        if (!userRate.allowed) {
          logSecurityIncident({
            type: "RATE_LIMIT",
            ip,
            userId,
            details: "User task completion rate limit exceeded (possible auto-clicker bot)",
          });
          return NextResponse.json(
            { success: false, error: `Rate limit: Please wait ${userRate.retryAfterSeconds}s before claiming next task.` },
            { status: 429 }
          );
        }

        // Anti-clicker cooldown: Minimum 3 seconds between task completes
        const now = Date.now();
        const lastTaskTime = store.userTaskCooldown.get(userId) || 0;
        if (now - lastTaskTime < 3000) {
          return NextResponse.json(
            { success: false, error: "Cooldown active. Please wait at least 3 seconds between tasks." },
            { status: 429 }
          );
        }
        store.userTaskCooldown.set(userId, now);

        const user = store.users.get(userId);
        if (!user) {
          return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }
        if (user.is_banned) {
          return NextResponse.json({ success: false, error: "Account suspended." }, { status: 403 });
        }

        // Anti Double-Claim Check
        if (user.completed_tasks.includes(taskId)) {
          return NextResponse.json({ success: false, error: "Task already claimed." }, { status: 400 });
        }

        // CRITICAL SECURITY: SERVER-AUTHORITATIVE REWARD CALCULATION
        // NEVER trust payload.reward_coins from client!
        const task = store.tasks.find((t) => t.id === taskId);
        let rewardCoins = store.config.default_task_reward || 50;

        if (task) {
          if (task.status !== "active") {
            return NextResponse.json({ success: false, error: "This task is no longer active." }, { status: 400 });
          }
          rewardCoins = task.reward_coins;
          task.joined_count = (task.joined_count || 0) + 1;
          if (task.joined_count >= task.target_members) {
            task.status = "completed";
          }
        }

        // Atomically update user balance
        user.completed_tasks.push(taskId);
        user.balance += rewardCoins;
        user.total_earned += rewardCoins;
        persistStore(store);

        return NextResponse.json({ success: true, user, rewardAwarded: rewardCoins });
      }

      // ----------------------------------------------------
      // 3. User Requests Withdrawal (Anti-Double-Spend & Strict Validation)
      // ----------------------------------------------------
      case "request_withdrawal": {
        const userVal = validateUserId(payload.user_id);
        if (!userVal.valid) {
          return NextResponse.json({ success: false, error: "Invalid user_id" }, { status: 400 });
        }
        const userId = userVal.value;

        // Rate limit: Max 2 withdrawals per minute
        const wdRate = rateLimiter.check(
          `wd_rate_${userId}`,
          RATE_LIMIT_RULES.WITHDRAWAL_SUBMIT.limit,
          RATE_LIMIT_RULES.WITHDRAWAL_SUBMIT.windowMs
        );
        if (!wdRate.allowed) {
          logSecurityIncident({
            type: "RATE_LIMIT",
            ip,
            userId,
            details: "Excessive withdrawal requests triggered",
          });
          return NextResponse.json(
            { success: false, error: `Withdrawal rate limit: Try again in ${wdRate.retryAfterSeconds}s.` },
            { status: 429 }
          );
        }

        // Cooldown: 15 seconds cooldown between withdrawal requests
        const now = Date.now();
        const lastWdTime = store.userWithdrawCooldown.get(userId) || 0;
        if (now - lastWdTime < 15000) {
          return NextResponse.json(
            { success: false, error: "Please wait 15 seconds before submitting another withdrawal." },
            { status: 429 }
          );
        }
        store.userWithdrawCooldown.set(userId, now);

        const user = store.users.get(userId);
        if (!user) {
          return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }
        if (user.is_banned) {
          return NextResponse.json({ success: false, error: "Account suspended." }, { status: 403 });
        }

        // STRICT COIN VALIDATION (Prevents negative numbers, NaN, floating point exploits)
        const coinVal = validateInteger(payload.coins, store.config.min_withdrawal_coins, 10_000_000);
        if (!coinVal.valid) {
          logSecurityIncident({
            type: "TAMPERING_ATTEMPT",
            ip,
            userId,
            details: `Invalid or negative coins in withdrawal attempt: ${payload.coins}`,
          });
          return NextResponse.json({ success: false, error: coinVal.error }, { status: 400 });
        }
        const coins = coinVal.value;

        // Balance Check on Server
        if (user.balance < coins) {
          return NextResponse.json({ success: false, error: "Insufficient coin balance" }, { status: 400 });
        }

        // Method & Payout Address Validation
        const method = payload.method;
        if (method !== "UPI" && method !== "TON") {
          return NextResponse.json({ success: false, error: "Invalid payout method. Choose UPI or TON." }, { status: 400 });
        }

        const cleanAddress = sanitizeString(payload.payout_address, 128);
        if (method === "UPI" && !validateUpiId(cleanAddress)) {
          return NextResponse.json(
            { success: false, error: "Invalid UPI ID format. Example: user@okhdfcbank or 9876543210@paytm" },
            { status: 400 }
          );
        }
        if (method === "TON" && !validateTonAddress(cleanAddress)) {
          return NextResponse.json(
            { success: false, error: "Invalid TON wallet address format (EQ... or UQ...)." },
            { status: 400 }
          );
        }

        // CRITICAL: CALCULATE INR VALUE ON SERVER (NEVER TRUST CLIENT AMOUNT, PREVENT ZERO DIVISION)
        const coinsPerInr = Math.max(1, store.config.coins_per_inr || 300);
        const amountInr = Number((coins / coinsPerInr).toFixed(2));

        // Deduct balance atomically
        user.balance -= coins;

        const newWithdrawal: WithdrawalRequest = {
          id: `wd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          user_id: userId,
          username: user.username || userId,
          method,
          payout_address: cleanAddress,
          coins,
          amount_inr: amountInr,
          status: "pending",
          refunded: false,
          requested_at: new Date().toISOString(),
        };

        store.withdrawals.unshift(newWithdrawal);
        persistStore(store);
        return NextResponse.json({ success: true, withdrawal: newWithdrawal, user });
      }

      // ----------------------------------------------------
      // 4. User Submits Channel Promotion
      // ----------------------------------------------------
      case "submit_promotion": {
        const userVal = validateUserId(payload.user_id);
        if (!userVal.valid) {
          return NextResponse.json({ success: false, error: "Invalid user_id" }, { status: 400 });
        }
        const userId = userVal.value;

        // Rate Limit: 3 promotions / 5 mins
        const promoRate = rateLimiter.check(
          `promo_rate_${userId}`,
          RATE_LIMIT_RULES.PROMOTION_SUBMIT.limit,
          RATE_LIMIT_RULES.PROMOTION_SUBMIT.windowMs
        );
        if (!promoRate.allowed) {
          return NextResponse.json(
            { success: false, error: "Promotion submission limit reached. Please wait a few minutes." },
            { status: 429 }
          );
        }

        // Validate channel
        const chanVal = validateTelegramChannel(payload.channel);
        if (!chanVal.valid) {
          return NextResponse.json({ success: false, error: chanVal.error }, { status: 400 });
        }

        // Validate members & price
        const membersVal = validateInteger(payload.members, 50, 500_000);
        if (!membersVal.valid) {
          return NextResponse.json({ success: false, error: "Invalid target members count" }, { status: 400 });
        }

        const priceVal = validateInteger(payload.price_inr, 50, 1_000_000);
        if (!priceVal.valid) {
          return NextResponse.json({ success: false, error: "Invalid price amount" }, { status: 400 });
        }

        const cleanUtr = sanitizeString(payload.utr_number, 64);
        const cleanContact = sanitizeString(payload.contact, 64);
        const cleanPackageId = sanitizeString(payload.packageId || "custom_plan", 64);

        if (!cleanUtr || cleanUtr.length < 6) {
          return NextResponse.json({ success: false, error: "Please enter a valid 12-digit UTR or Transaction ID." }, { status: 400 });
        }

        const newPromo: PromotionRequest = {
          id: `promo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          user_id: userId,
          channel_title: chanVal.formatted,
          channel_username: chanVal.formatted,
          channel_link: `https://t.me/${chanVal.formatted.replace("@", "")}`,
          package_id: cleanPackageId,
          package_title: cleanPackageId === "custom_plan" ? "Custom Promotion" : "Ad Package",
          target_members: membersVal.value,
          price_inr: priceVal.value,
          utr_number: cleanUtr,
          sponsor_contact: cleanContact,
          bot_verified: true,
          status: "pending",
          created_at: new Date().toISOString(),
        };

        store.promotions.unshift(newPromo);
        persistStore(store);
        return NextResponse.json({ success: true, promotion: newPromo });
      }

      // ----------------------------------------------------
      // 5. Support Message (Anti-Spam & Sanitized)
      // ----------------------------------------------------
      case "send_support_message": {
        const userVal = validateUserId(payload.user_id);
        if (!userVal.valid) {
          return NextResponse.json({ success: false, error: "Invalid user_id" }, { status: 400 });
        }
        const userId = userVal.value;
        const sender = payload.sender === "admin" ? "admin" : "user";

        if (sender === "admin") {
          const authHeader = request.headers.get("authorization") || request.headers.get("x-admin-token");
          const adminCheck = verifyAdminSessionToken(authHeader);
          if (!adminCheck.valid) {
            logSecurityIncident({
              type: "UNAUTHORIZED_ADMIN",
              ip,
              userId,
              details: "Unauthorized attempt to send support message as admin",
            });
            return NextResponse.json({ success: false, error: "Unauthorized: Admin verification required." }, { status: 403 });
          }
        } else {
          const msgRate = rateLimiter.check(
            `msg_rate_${userId}`,
            RATE_LIMIT_RULES.SUPPORT_MESSAGE.limit,
            RATE_LIMIT_RULES.SUPPORT_MESSAGE.windowMs
          );
          if (!msgRate.allowed) {
            return NextResponse.json(
              { success: false, error: "You are sending messages too fast. Please wait a moment." },
              { status: 429 }
            );
          }
        }

        const cleanMsg = sanitizeString(payload.message, 1000);
        if (!cleanMsg || cleanMsg.length === 0) {
          return NextResponse.json({ success: false, error: "Message cannot be empty." }, { status: 400 });
        }

        const newMsg: SupportChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          user_id: userId,
          user_name: sanitizeString(payload.user_name || "User", 50),
          sender,
          message: cleanMsg,
          timestamp: new Date().toISOString(),
          read: sender === "admin",
        };

        store.supportMessages.push(newMsg);
        persistStore(store);
        return NextResponse.json({ success: true, message: newMsg });
      }

      // ====================================================
      // ADMIN-PROTECTED ACTIONS (Guarded by token verification above)
      // ====================================================

      // 6. Admin Resolves Withdrawal
      case "admin_resolve_withdrawal": {
        const { id, status, refund, utr_number } = payload;
        const cleanId = sanitizeString(id, 64);
        const withdrawal = store.withdrawals.find((w) => w.id === cleanId);
        if (!withdrawal) {
          return NextResponse.json({ success: false, error: "Withdrawal not found" }, { status: 404 });
        }

        if (status !== "completed" && status !== "rejected" && status !== "pending") {
          return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
        }

        // Prevent double-processing completed or rejected requests
        if (withdrawal.status !== "pending" && status !== "pending") {
          return NextResponse.json({ success: false, error: `Withdrawal has already been marked as ${withdrawal.status}.` }, { status: 400 });
        }

        withdrawal.status = status;
        if (utr_number) withdrawal.utr_number = sanitizeString(utr_number, 64);
        withdrawal.processed_at = new Date().toISOString();

        if (status === "completed") {
          const user = store.users.get(withdrawal.user_id);
          if (user) {
            user.total_withdrawn += withdrawal.coins;
          }
        } else if (status === "rejected" && refund && !withdrawal.refunded) {
          const user = store.users.get(withdrawal.user_id);
          if (user) {
            user.balance += withdrawal.coins;
            withdrawal.refunded = true;
          }
        }

        persistStore(store);
        return NextResponse.json({ success: true, withdrawal });
      }

      // 7. Admin Adjusts User Balance
      case "admin_adjust_balance": {
        const userVal = validateUserId(payload.user_id);
        if (!userVal.valid) {
          return NextResponse.json({ success: false, error: "Invalid user_id" }, { status: 400 });
        }
        const delta = Number(payload.delta);
        if (!Number.isFinite(delta) || !Number.isInteger(delta)) {
          return NextResponse.json({ success: false, error: "Delta must be an integer" }, { status: 400 });
        }

        const user = store.users.get(userVal.value);
        if (!user) {
          return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        user.balance = Math.max(0, user.balance + delta);
        if (delta > 0) {
          user.total_earned += delta;
        }
        persistStore(store);
        return NextResponse.json({ success: true, user });
      }

      // 8. Admin Approves Channel Promotion Order
      case "admin_approve_promotion": {
        const cleanId = sanitizeString(payload.id, 64);
        const promo = store.promotions.find((p) => p.id === cleanId);
        if (!promo) {
          return NextResponse.json({ success: false, error: "Promotion not found" }, { status: 404 });
        }

        promo.status = "approved";

        const adminRevenue = Math.round(promo.price_inr * (store.config.admin_profit_cut_percent / 100));
        const userPool = promo.price_inr - adminRevenue;
        const rewardCoins = Math.max(
          10,
          Math.round((userPool / promo.target_members) * store.config.coins_per_inr)
        );

        const liveTask: ChannelTask = {
          id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: promo.channel_title || promo.channel_username,
          username: promo.channel_username,
          channel_link: promo.channel_link,
          reward_coins: rewardCoins,
          target_members: promo.target_members,
          joined_count: 0,
          is_pinned: promo.package_id === "pkg_growth" || promo.package_id === "pkg_vip",
          badge_label: promo.package_id === "pkg_vip" ? "👑 VIP SPONSOR" : "TOP #1 SPONSOR",
          status: "active",
        };

        store.tasks.unshift(liveTask);
        persistStore(store);
        return NextResponse.json({ success: true, task: liveTask, promotion: promo });
      }

      // 9. Admin Updates Config
      case "admin_update_config": {
        const allowedKeys = [
          "min_withdrawal_coins",
          "coins_per_inr",
          "coins_per_ton",
          "default_task_reward",
          "admin_profit_cut_percent",
          "min_rate_per_member_inr",
          "admin_upi_id",
          "admin_telegram_handle",
          "bot_username",
          "channel_tasks_enabled",
          "offerwalls_enabled",
          "maintenance_mode",
          "custom_service_enabled",
          "custom_service_title",
          "custom_service_telegram",
          "custom_total_users_count",
        ];

        for (const key of Object.keys(payload)) {
          if (allowedKeys.includes(key)) {
            if (key === "coins_per_inr" || key === "min_withdrawal_coins" || key === "default_task_reward") {
              const num = Number(payload[key]);
              if (Number.isFinite(num) && num >= 1) {
                (store.config as any)[key] = num;
              }
            } else if (key === "admin_profit_cut_percent") {
              const cut = Number(payload[key]);
              if (Number.isFinite(cut) && cut >= 5 && cut <= 95) {
                (store.config as any)[key] = cut;
              }
            } else if (key === "min_rate_per_member_inr") {
              const rate = Number(payload[key]);
              if (Number.isFinite(rate) && rate > 0) {
                (store.config as any)[key] = rate;
              }
            } else if (key === "custom_total_users_count") {
              const count = Number(payload[key]);
              (store.config as any)[key] = Number.isFinite(count) ? Math.max(0, count) : 0;
            } else {
              (store.config as any)[key] = payload[key];
            }
          }
        }

        persistStore(store);
        return NextResponse.json({ success: true, config: store.config });
      }

      // 10. Admin Toggles User Ban (Block / Unblock Malicious Actors)
      case "admin_toggle_user_ban": {
        const userVal = validateUserId(payload.user_id);
        if (!userVal.valid) {
          return NextResponse.json({ success: false, error: "Invalid user_id" }, { status: 400 });
        }
        const user = store.users.get(userVal.value);
        if (!user) {
          return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }
        user.is_banned = !user.is_banned;
        persistStore(store);
        return NextResponse.json({ success: true, user });
      }

      // 11. Admin Updates Payment Methods (UPI, TON, Wallets)
      case "admin_update_payment_methods": {
        if (Array.isArray(payload.paymentMethods)) {
          store.paymentMethods = payload.paymentMethods;
          persistStore(store);
          return NextResponse.json({ success: true, paymentMethods: store.paymentMethods });
        }
        return NextResponse.json({ success: false, error: "Invalid paymentMethods array" }, { status: 400 });
      }

      // 12. Admin Updates Channel Tasks
      case "admin_update_tasks": {
        if (Array.isArray(payload.tasks)) {
          store.tasks = payload.tasks;
          persistStore(store);
          return NextResponse.json({ success: true, tasks: store.tasks });
        }
        return NextResponse.json({ success: false, error: "Invalid tasks array" }, { status: 400 });
      }

      // 13. Admin Updates Ad Packages
      case "admin_update_packages": {
        if (Array.isArray(payload.packages)) {
          store.packages = payload.packages;
          persistStore(store);
          return NextResponse.json({ success: true, packages: store.packages });
        }
        return NextResponse.json({ success: false, error: "Invalid packages array" }, { status: 400 });
      }

      // 14. User Updates Saved Payout Addresses (Persistent)
      case "update_saved_addresses": {
        const userVal = validateUserId(payload.user_id);
        if (!userVal.valid) {
          return NextResponse.json({ success: false, error: "Invalid user_id" }, { status: 400 });
        }
        let user = store.users.get(userVal.value);
        if (!user) {
          user = {
            user_id: userVal.value,
            username: payload.username || `user_${userVal.value}`,
            first_name: payload.first_name || "Earner",
            balance: 0,
            total_earned: 0,
            total_withdrawn: 0,
            completed_tasks: [],
            referrals_count: 0,
            is_banned: false,
            created_at: new Date().toISOString(),
          };
          store.users.set(userVal.value, user);
        }
        if (payload.saved_upi_id !== undefined) {
          user.saved_upi_id = sanitizeString(payload.saved_upi_id, 100);
        }
        if (payload.saved_ton_address !== undefined) {
          user.saved_ton_address = sanitizeString(payload.saved_ton_address, 100);
        }
        persistStore(store);
        return NextResponse.json({ success: true, user });
      }

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Server processing error" }, { status: 500 });
  }
}
