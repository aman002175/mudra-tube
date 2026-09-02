export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface UserProfile {
  user_id: string;
  username: string;
  first_name: string;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  completed_tasks: string[];
  referrals_count: number;
  is_banned: boolean;
  created_at: string;
}

export interface ChannelTask {
  id: string;
  title: string;
  username: string;
  channel_link: string;
  avatar_url?: string;
  reward_coins: number;
  target_members: number; // e.g. 1000
  joined_count: number;   // e.g. 420
  verified?: boolean;
  is_pinned?: boolean;    // When true, pinned to the top as guaranteed in package
  badge_label?: string;   // e.g. "TOP #1 SPONSOR", "VIP"
  total_pool_inr?: number; // User reward budget
  status: "active" | "completed" | "paused";
}

export interface PromotionRequest {
  id: string;
  user_id: string;
  channel_title: string;
  channel_username: string;
  channel_link: string;
  package_id: string;
  package_title: string;
  target_members: number;
  price_inr: number;
  utr_number: string;
  sponsor_contact: string;
  bot_verified: boolean;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  username: string;
  method: "UPI" | "TON";
  payout_address: string;
  coins: number;
  amount_inr: number;
  status: "pending" | "completed" | "rejected";
  rejection_reason?: string;
  refunded: boolean;
  utr_number?: string;
  requested_at: string;
  processed_at?: string;
}

export interface PromoPackage {
  id: string;
  title: string;
  members: number;
  price_inr: number;
  badge?: string;
  popular?: boolean;
  features: string[];
}

export interface AdminPaymentMethod {
  id: string;
  type: "UPI" | "TON" | "CRYPTO";
  label: string;
  address_or_vpa: string;
  is_active: boolean;
}

export interface SupportChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  sender: "user" | "admin";
  message: string;
  timestamp: string;
  read: boolean;
}

export interface GlobalConfig {
  min_withdrawal_coins: number;
  coins_per_inr: number;
  coins_per_ton: number;
  default_task_reward: number;
  admin_profit_cut_percent: number; // e.g. 60% Admin, 40% User Pool
  admin_upi_id: string;             // e.g. yourname@paytm
  admin_telegram_handle: string;    // e.g. @MudraAdmin
  bot_username: string;             // e.g. @MudraTube_bot
  channel_tasks_enabled: boolean;
  offerwalls_enabled: boolean;
  maintenance_mode: boolean;
}
