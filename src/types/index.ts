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
  saved_upi_id?: string;
  saved_ton_address?: string;
}

export interface ChannelTask {
  id: string;
  promo_id?: string;      // Links to PromotionRequest if originated from sponsor order
  title: string;
  username: string;
  channel_link: string;
  avatar_url?: string;
  reward_inr: number;     // Direct payout in ₹ INR (e.g. 1.50)
  reward_coins?: number;  // Backward compatibility alias
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
  status: "pending" | "approved" | "rejected" | "completed";
  rejection_reason?: string;
  created_at: string;
  task_id?: string;
  joined_count?: number; // Real-time subscribers gained from tasks
  live_status?: "pending" | "live" | "completed" | "rejected";
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  username: string;
  method: "UPI" | "TON";
  payout_address: string;
  amount_inr: number;     // Direct withdrawal amount in ₹ INR
  coins?: number;         // Backward compatibility
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
  min_withdrawal_inr: number;      // Direct ₹ INR threshold (e.g. ₹10)
  default_task_reward_inr: number; // Direct ₹ INR task reward (e.g. ₹1.50)
  ton_rate_inr?: number;           // ₹ INR per 1 TON (e.g. 500)
  admin_profit_cut_percent: number; // e.g. 60% Admin, 40% User Pool
  min_rate_per_member_inr: number;  // e.g. ₹2.00 or ₹1.50 per member minimum floor
  admin_upi_id: string;             // e.g. yourname@paytm
  admin_telegram_handle: string;    // e.g. @MudraAdmin
  bot_username: string;             // e.g. @MudraTube_bot
  channel_tasks_enabled: boolean;
  offerwalls_enabled: boolean;
  maintenance_mode: boolean;
  custom_service_enabled: boolean;
  custom_service_title: string;
  custom_service_telegram: string;
  custom_total_users_count?: number;

  // Backward compatibility aliases
  min_withdrawal_coins?: number;
  coins_per_inr?: number;
  coins_per_ton?: number;
  default_task_reward?: number;
}
