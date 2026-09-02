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
  min_withdrawal_coins: 300,
  coins_per_inr: 300,
  coins_per_ton: 50000,
  default_task_reward: 50,
  admin_profit_cut_percent: 60, // 60% Admin, 40% User Pool
  admin_upi_id: "admin@paytm",
  admin_telegram_handle: "@admin_mudratube",
  bot_username: "@MudraTube_bot",
  channel_tasks_enabled: true,
  offerwalls_enabled: true,
  maintenance_mode: false,
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

export const initialWithdrawals: WithdrawalRequest[] = [
  {
    id: "wd_101",
    user_id: "88291024",
    username: "rahul_verma",
    method: "UPI",
    payout_address: "rahul@paytm",
    coins: 900,
    amount_inr: 3.0,
    status: "completed",
    refunded: false,
    utr_number: "UTR4920194821",
    requested_at: "2026-09-01T14:30:00Z",
    processed_at: "2026-09-01T15:00:00Z",
  },
  {
    id: "wd_102",
    user_id: "77491204",
    username: "crypto_sam",
    method: "TON",
    payout_address: "UQDa4Vfvy2qPkW_x09yJ6V19nQW-29eL13098",
    coins: 1500,
    amount_inr: 5.0,
    status: "pending",
    refunded: false,
    requested_at: "2026-09-02T19:20:00Z",
  },
  {
    id: "wd_103",
    user_id: "55194012",
    username: "priya_sharma",
    method: "UPI",
    payout_address: "priya@okaxis",
    coins: 600,
    amount_inr: 2.0,
    status: "pending",
    refunded: false,
    requested_at: "2026-09-02T21:45:00Z",
  },
];

export const initialMockUser: UserProfile = {
  user_id: "92837461",
  username: "crypto_tiger",
  first_name: "Tiger",
  balance: 150,
  total_earned: 250,
  total_withdrawn: 100,
  completed_tasks: [],
  referrals_count: 3,
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

export const initialSupportMessages: SupportChatMessage[] = [
  {
    id: "msg_1",
    user_id: "88291024",
    user_name: "Rahul Verma",
    sender: "user",
    message: "Namaste Admin sir! Mera withdrawal kab approve hoga?",
    timestamp: "2026-09-02T22:30:00Z",
    read: false,
  },
  {
    id: "msg_2",
    user_id: "88291024",
    user_name: "Rahul Verma",
    sender: "admin",
    message: "Namaste Rahul! Aapka UPI UTR verify ho gaya hai, agle 30 minute me credit ho jayega.",
    timestamp: "2026-09-02T22:35:00Z",
    read: true,
  },
  {
    id: "msg_3",
    user_id: "77491204",
    user_name: "Sam Crypto",
    sender: "user",
    message: "Sir promotion bundle buy kiya tha, live kab hoga?",
    timestamp: "2026-09-02T23:10:00Z",
    read: false,
  },
];
