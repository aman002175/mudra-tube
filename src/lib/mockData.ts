import {
  ChannelTask,
  GlobalConfig,
  PromoPackage,
  UserProfile,
  WithdrawalRequest,
  AdminPaymentMethod,
  SupportChatMessage,
} from "@/types";

export const initialConfig: GlobalConfig = {
  min_withdrawal_inr: 10,        // Minimum ₹10 threshold for withdrawal
  default_task_reward_inr: 1.50, // Direct ₹1.50 per channel task
  ton_rate_inr: 500,             // ₹500 = 1 TON
  admin_profit_cut_percent: 60,  // 60% Admin, 40% User Pool
  min_rate_per_member_inr: 2.0,  // ₹2.00 per member minimum floor
  admin_upi_id: "admin@paytm",
  admin_telegram_handle: "@admin_mudratube",
  bot_username: "@MudraTube_bot",
  channel_tasks_enabled: true,
  offerwalls_enabled: true,
  maintenance_mode: false,
  custom_service_enabled: true,
  custom_service_title: "need custom solution telegram bot,web,App?? contect here..🚀💰",
  custom_service_telegram: "@amxnbixnoe",
  custom_total_users_count: 0,
  help_desk_url: "https://t.me/mudratubehelpdesk",
  referral_system_enabled: false,
  referral_reward_type: "withdrawal_percentage",
  referral_reward_amount: 2, // e.g., 2%

  // Backward compatibility aliases
  min_withdrawal_coins: 10,
  coins_per_inr: 1,
  coins_per_ton: 500,
  default_task_reward: 1.50,
};

export const initialTasks: ChannelTask[] = [];

export const initialPackages: PromoPackage[] = [
  {
    id: "pkg_starter",
    title: "Starter Boost",
    members: 500,
    price_inr: 1000,
    badge: "Fast Start",
    popular: false,
    features: [
      "500 Real Telegram Users",
      "Live Membership Verification",
      "Delivery within 24 Hours",
      "Real-time Dashboard Analytics",
    ],
  },
  {
    id: "pkg_growth",
    title: "Growth Pack",
    members: 2000,
    price_inr: 3500,
    badge: "Most Popular",
    popular: true,
    features: [
      "2,000 Real Telegram Users",
      "Priority Channel Placement",
      "Live Anti-Cheat Filtering",
      "Delivery within 48 Hours",
      "Dedicated Admin Support",
    ],
  },
  {
    id: "pkg_pro",
    title: "Empire Scale",
    members: 5000,
    price_inr: 8000,
    badge: "Best Value",
    popular: false,
    features: [
      "5,000 High-Intent Members",
      "Top #1 Banner Spot in App",
      "Zero Drop Guaranteed Refill",
      "Comprehensive Retention Report",
      "Custom Campaign Pacing",
    ],
  },
];

export const initialWithdrawals: WithdrawalRequest[] = [];

export const initialMockUser: UserProfile = {
  user_id: "",
  username: "",
  first_name: "Loading...",
  balance: 0,
  total_earned: 0,
  total_withdrawn: 0,
  completed_tasks: [],
  referrals_count: 0,
  is_banned: false,
  created_at: new Date().toISOString(),
};

export const initialPaymentMethods: AdminPaymentMethod[] = [
  {
    id: "pm_upi_1",
    type: "UPI",
    label: "Primary PhonePe / GPay UPI",
    address_or_vpa: "mudratube@paytm",
    is_active: true,
  },
  {
    id: "pm_ton_1",
    type: "TON",
    label: "Official TON Treasury",
    address_or_vpa: "EQDa4Vfvy2qPkW_x09yJ6V19nQW-29eL13098",
    is_active: true,
  },
];

export const initialSupportMessages: SupportChatMessage[] = [];
