import { NextRequest, NextResponse } from "next/server";
import {
  UserProfile,
  WithdrawalRequest,
  PromotionRequest,
  SupportChatMessage,
  ChannelTask,
  GlobalConfig,
} from "@/types";
import { initialConfig, initialPackages, initialPaymentMethods } from "@/lib/mockData";

// Shared In-Memory Server Store
interface LiveStore {
  users: Map<string, UserProfile>;
  withdrawals: WithdrawalRequest[];
  promotions: PromotionRequest[];
  supportMessages: SupportChatMessage[];
  tasks: ChannelTask[];
  config: GlobalConfig;
}

declare global {
  var __mudratube_live_store: LiveStore | undefined;
}

function getLiveStore(): LiveStore {
  if (!global.__mudratube_live_store) {
    global.__mudratube_live_store = {
      users: new Map<string, UserProfile>(),
      withdrawals: [],
      promotions: [],
      supportMessages: [],
      tasks: [],
      config: { ...initialConfig },
    };
  }
  return global.__mudratube_live_store;
}

// GET /api/sync
export async function GET(request: NextRequest) {
  const store = getLiveStore();
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("user_id");

  const allUsers = Array.from(store.users.values());
  const user = userId ? store.users.get(userId) || null : null;

  return NextResponse.json({
    success: true,
    user,
    users: allUsers,
    withdrawals: store.withdrawals,
    promotions: store.promotions,
    supportMessages: store.supportMessages,
    tasks: store.tasks,
    config: store.config,
  });
}

// POST /api/sync
export async function POST(request: NextRequest) {
  const store = getLiveStore();

  try {
    const body = await request.json();
    const { action, payload } = body;

    switch (action) {
      // 1. User Connects via Telegram or Browser
      case "connect_user": {
        const { user_id, username, first_name } = payload;
        if (!user_id) {
          return NextResponse.json({ success: false, error: "Missing user_id" }, { status: 400 });
        }

        let existingUser = store.users.get(user_id);
        if (!existingUser) {
          existingUser = {
            user_id: String(user_id),
            username: username || `user_${user_id}`,
            first_name: first_name || "Earner",
            balance: 0,
            total_earned: 0,
            total_withdrawn: 0,
            completed_tasks: [],
            referrals_count: 0,
            is_banned: false,
            created_at: new Date().toISOString(),
          };
          store.users.set(user_id, existingUser);
        } else {
          // Update username/name if changed
          if (username) existingUser.username = username;
          if (first_name) existingUser.first_name = first_name;
        }

        return NextResponse.json({ success: true, user: existingUser });
      }

      // 2. User Completes a Channel Task
      case "complete_task": {
        const { user_id, task_id, reward_coins } = payload;
        const user = store.users.get(user_id);
        if (!user) {
          return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        if (!user.completed_tasks.includes(task_id)) {
          user.completed_tasks.push(task_id);
          user.balance += Number(reward_coins) || 50;
          user.total_earned += Number(reward_coins) || 50;
        }

        // Increment joined count for task
        const task = store.tasks.find((t) => t.id === task_id);
        if (task) {
          task.joined_count = (task.joined_count || 0) + 1;
          if (task.joined_count >= task.target_members) {
            task.status = "completed";
          }
        }

        return NextResponse.json({ success: true, user });
      }

      // 3. User Requests Withdrawal
      case "request_withdrawal": {
        const { user_id, coins, amount_inr, method, payout_address } = payload;
        const user = store.users.get(user_id);
        if (!user || user.balance < coins) {
          return NextResponse.json({ success: false, error: "Insufficient balance" }, { status: 400 });
        }

        user.balance -= coins;
        const newWithdrawal: WithdrawalRequest = {
          id: `wd_${Date.now()}`,
          user_id,
          username: user.username || user_id,
          method,
          payout_address,
          coins,
          amount_inr,
          status: "pending",
          refunded: false,
          requested_at: new Date().toISOString(),
        };

        store.withdrawals.unshift(newWithdrawal);
        return NextResponse.json({ success: true, withdrawal: newWithdrawal, user });
      }

      // 4. User Submits Channel Promotion
      case "submit_promotion": {
        const newPromo: PromotionRequest = {
          id: `promo_${Date.now()}`,
          user_id: payload.user_id,
          channel_title: payload.channel,
          channel_username: payload.channel.startsWith("@") ? payload.channel : `@${payload.channel}`,
          channel_link: payload.channel.startsWith("http") ? payload.channel : `https://t.me/${payload.channel.replace("@", "")}`,
          package_id: payload.packageId,
          package_title: payload.packageId === "custom_plan" ? "Custom Promotion" : "Ad Package",
          target_members: payload.members,
          price_inr: payload.price_inr,
          utr_number: payload.utr_number,
          sponsor_contact: payload.contact,
          bot_verified: true,
          status: "pending",
          created_at: new Date().toISOString(),
        };

        store.promotions.unshift(newPromo);
        return NextResponse.json({ success: true, promotion: newPromo });
      }

      // 5. Send Support Message (User or Admin)
      case "send_support_message": {
        const newMsg: SupportChatMessage = {
          id: `msg_${Date.now()}`,
          user_id: payload.user_id,
          user_name: payload.user_name || "User",
          sender: payload.sender || "user",
          message: payload.message,
          timestamp: new Date().toISOString(),
          read: payload.sender === "admin",
        };

        store.supportMessages.push(newMsg);
        return NextResponse.json({ success: true, message: newMsg });
      }

      // 6. Admin Resolves Withdrawal (Approve or Reject/Refund)
      case "admin_resolve_withdrawal": {
        const { id, status, refund, utr_number } = payload;
        const withdrawal = store.withdrawals.find((w) => w.id === id);
        if (!withdrawal) {
          return NextResponse.json({ success: false, error: "Withdrawal not found" }, { status: 404 });
        }

        withdrawal.status = status;
        if (utr_number) withdrawal.utr_number = utr_number;
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

        return NextResponse.json({ success: true, withdrawal });
      }

      // 7. Admin Adjusts User Balance
      case "admin_adjust_balance": {
        const { user_id, delta } = payload;
        const user = store.users.get(user_id);
        if (!user) {
          return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        user.balance = Math.max(0, user.balance + delta);
        if (delta > 0) {
          user.total_earned += delta;
        }
        return NextResponse.json({ success: true, user });
      }

      // 8. Admin Approves Channel Promotion Order
      case "admin_approve_promotion": {
        const { id } = payload;
        const promo = store.promotions.find((p) => p.id === id);
        if (!promo) {
          return NextResponse.json({ success: false, error: "Promotion not found" }, { status: 404 });
        }

        promo.status = "approved";

        // Create active channel task
        const adminRevenue = Math.round(promo.price_inr * (store.config.admin_profit_cut_percent / 100));
        const userPool = promo.price_inr - adminRevenue;
        const rewardCoins = Math.max(
          10,
          Math.round((userPool / promo.target_members) * store.config.coins_per_inr)
        );

        const liveTask: ChannelTask = {
          id: `task_${Date.now()}`,
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
        return NextResponse.json({ success: true, task: liveTask, promotion: promo });
      }

      // 9. Admin Updates Config
      case "admin_update_config": {
        store.config = { ...store.config, ...payload };
        return NextResponse.json({ success: true, config: store.config });
      }

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
