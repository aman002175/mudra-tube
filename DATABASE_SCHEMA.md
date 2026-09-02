# 🗄️ Database Schema Specification: Cloud Firestore

**Project:** Mudra Tube  
**Database Engine:** Google Cloud Firestore (NoSQL Document Store)  
**Access Model:** Client-side read/listen (`onSnapshot`) + Server-side validated writes & atomic transactions  

---

## 1. Schema Overview

```
Firestore Root
├── users / {userId}                     # Registered Telegram mini app users
├── withdrawals / {withdrawalId}         # UPI & TON payout tickets
├── promotions / {promotionId}           # Channel join campaigns (Tasks)
├── packages / {packageId}               # Pre-packaged ad bundles
├── global_config / platform_settings    # Economic limits and feature toggles
└── transactions / {txId}                # Immutable coin ledger / audit trail
```

---

## 2. Detailed Collections & Document Models

### 2.1 Collection: `users`
Each document is keyed by the Telegram user's numeric string ID (`user_id`).

```typescript
interface UserDocument {
  user_id: string;               // Telegram ID, e.g. "987654321" (Document ID)
  username: string;              // e.g. "alex_crypto" or "" if hidden
  first_name: string;            // e.g. "Alex"
  balance: number;               // Current spendable coins (Default: 0)
  total_earned: number;          // Lifetime earned coins
  total_withdrawn: number;       // Lifetime cashed-out coins
  completed_tasks: string[];     // Array of completed task IDs (anti-duplicate)
  referral_code?: string;        // User's own ref code
  referred_by?: string;          // Referrer user_id
  is_banned: boolean;            // Administrative ban flag (Default: false)
  created_at: FirebaseFirestore.Timestamp;
  last_active_at: FirebaseFirestore.Timestamp;
}
```

### 2.2 Collection: `withdrawals`
Generated every time a user requests a payout.

```typescript
interface WithdrawalDocument {
  withdrawal_id: string;         // Unique withdrawal ID (e.g. "wd_1725301294_987654321")
  user_id: string;               // Associated Telegram user_id
  username: string;              // Telegram username or first name
  payout_method: "UPI" | "TON";  // Payment channel
  payout_address: string;        // UPI ID (e.g. "user@okhdfcbank") or TON Wallet Address
  coins: number;                 // Coins deducted (e.g. 300, 1500)
  amount_fiat: number;           // INR equivalent (e.g. 1.00, 5.00)
  amount_crypto?: number;        // TON equivalent if method === "TON"
  status: "pending" | "completed" | "rejected";
  rejection_reason?: string;     // Optional message shown to user if rejected
  refunded: boolean;             // True if coins were restored upon rejection
  transaction_ref?: string;      // Admin-entered bank UTR or TON transaction hash
  requested_at: FirebaseFirestore.Timestamp;
  processed_at?: FirebaseFirestore.Timestamp;
}
```

### 2.3 Collection: `promotions`
Contains all Telegram channel join tasks published for users to complete.

```typescript
interface PromotionDocument {
  promotion_id: string;          // Document ID
  channel_title: string;         // e.g. "Alpha Crypto Signals"
  channel_username: string;      // e.g. "@alphacrypto"
  channel_id: string;            // Numeric or string Telegram channel ID
  channel_link: string;          // Direct join link: "https://t.me/alphacrypto"
  channel_avatar?: string;       // URL to channel icon/logo
  reward_coins: number;          // Coins given to user upon verification (Default: 50)
  target_members: number;        // Total members requested (e.g. 1000)
  current_members: number;       // Validated joins count completed so far
  cost_per_member: number;       // Amount charged per member in INR
  sponsor_contact: string;       // Telegram username of buyer/sponsor
  status: "pending" | "active" | "paused" | "completed" | "rejected";
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}
```

### 2.4 Collection: `packages`
Admin-curated promotional tiers shown to advertisers.

```typescript
interface PackageDocument {
  package_id: string;            // e.g. "starter-500", "growth-2000"
  title: string;                 // e.g. "Starter Boost"
  member_count: number;          // 500
  price_inr: number;             // 1000
  badge?: string;                // "Most Popular" | "Best Value"
  is_active: boolean;            // Available for purchase
  features: string[];            // ["Real Telegram Users", "Verified Membership", "24/7 Delivery"]
  sort_order: number;            // Display order
}
```

### 2.5 Collection: `global_config` / Document: `platform_settings`
Singleton document controlling economics and feature switches.

```typescript
interface PlatformSettingsDocument {
  min_withdrawal_coins: number;  // Default: 300 (₹1.00)
  coins_per_inr: number;         // Default: 300 coins = 1 INR
  coins_per_ton: number;         // Default: 50,000 coins = 1 TON
  default_task_reward: number;   // Default: 50 coins
  channel_tasks_enabled: boolean;// Master switch for Telegram Join tasks
  offerwalls_enabled: boolean;   // Master switch for CPA Offerwalls
  maintenance_mode: boolean;     // Puts user app in graceful maintenance state
  maintenance_message: string;   // Optional user announcement banner
  updated_at: FirebaseFirestore.Timestamp;
}
```

### 2.6 Collection: `transactions`
Immutable audit log recording every balance modification.

```typescript
interface TransactionDocument {
  tx_id: string;                 // Auto-ID
  user_id: string;               // Target user
  type: "task_reward" | "cpa_reward" | "withdrawal_debit" | "withdrawal_refund" | "admin_adjustment";
  amount: number;                // Positive for credits, negative for debits
  balance_before: number;
  balance_after: number;
  reference_id: string;          // e.g. promotion_id or withdrawal_id
  note: string;                  // e.g. "Channel join reward: @alphacrypto"
  created_at: FirebaseFirestore.Timestamp;
}
```

---

## 3. Database Indexes (firestore.indexes.json)

```json
{
  "indexes": [
    {
      "collectionGroup": "withdrawals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "requested_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "withdrawals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "requested_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "promotions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 4. Firestore Security Rules Blueprint (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User Collection: Users can read their own profile, only server/admin modifies balance
    match /users/{userId} {
      allow read: if true; 
      allow create: if request.resource.data.user_id == userId;
      allow update: if request.auth != null || request.resource.data.diff(resource.data).affectedKeys().hasOnly(['last_active_at']);
    }

    // Withdrawals: Users can create their own withdrawal request with status "pending"
    match /withdrawals/{withdrawalId} {
      allow read: if true;
      allow create: if request.resource.data.status == "pending" && request.resource.data.coins >= 300;
      allow update, delete: if false; // Only Admin backend can process
    }

    // Promotions & Packages: Public read, write protected
    match /promotions/{promotionId} {
      allow read: if true;
      allow write: if false; // Only backend or admin route
    }

    match /packages/{packageId} {
      allow read: if true;
      allow write: if false;
    }

    // Global Config: Public read
    match /global_config/{docId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```
