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
  target_members: number;
  joined_count: number;
  verified?: boolean;
  is_pinned?: boolean; // When true, pinned to the very top as guaranteed by promotional package
  badge_label?: string; // e.g. "TOP SPONSOR", "FEATURED"
  status: "active" | "completed" | "paused";
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

export interface GlobalConfig {
  min_withdrawal_coins: number;
  coins_per_inr: number;
  coins_per_ton: number;
  default_task_reward: number;
  channel_tasks_enabled: boolean;
  offerwalls_enabled: boolean;
  maintenance_mode: boolean;
}
