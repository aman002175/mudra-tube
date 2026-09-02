# 📋 Product Requirements Document (PRD): Mudra Tube

**Product Name:** Mudra Tube (29 Devs)  
**Version:** 1.0  
**Target Platform:** Telegram WebApp (Mini App) & Protected Administrative Portal  
**Primary Language/Framework:** TypeScript / Next.js / Vite React + Tailwind CSS + Firebase  

---

## 1. Executive Summary & Vision

Mudra Tube solves user fatigue with traditional invasive video ads by replacing them with high-intent, rewarded actions:
1. **Telegram Channel Join Tasks**: Users join sponsor channels and receive instant verified coin rewards.
2. **CPA Offerwalls**: Users install verified partner apps and complete short surveys.
3. **Transparent Redemptions**: Coins convert directly into Indian Rupee (INR) via UPI or Web3 Crypto (TON/USDT).
4. **Channel Promotion Marketplace**: Telegram community admins buy targeted members through pre-configured packages or custom campaigns.
5. **Stealth Admin Dashboard**: A centralized management interface secured at `/admin-penel-29devs`.

---

## 2. Core Functional Requirements: User Mini App

### 2.1 Telegram Context & Onboarding
- Automatically detect Telegram user parameters (`window.Telegram.WebApp.initDataUnsafe`):
  - `user_id`: Unique numeric ID string.
  - `username` / `first_name`: Display name.
- Real-time profile synchronization with Cloud Firestore.
- In desktop/browser preview mode, fallback to simulation credentials (`test_user_01`).

### 2.2 Earning Engine: Channel Join Tasks
- Displays available channel tasks with channel logo, title, and reward (+50 Coins).
- **Two-Step Verification Action**:
  - Step 1: Click "Join" $\rightarrow$ opens Telegram channel via `tg.openTelegramLink()` or `https://t.me/channel_name`.
  - Step 2: User returns and clicks "Verify".
  - Backend queries Telegram Bot API:
    `GET https://api.telegram.org/bot<TOKEN>/getChatMember?chat_id=@channel&user_id=<ID>`
  - If status is `member`, `administrator`, or `creator`:
    - Credit balance with +50 coins.
    - Append channel ID to `completed_tasks` list.
    - Animate button state to **✓ Done**.

### 2.3 Earning Engine: CPA Offerwalls
- Dynamic integration with external CPA networks (e.g., Wannads, OfferToro, CPALead, AdGate).
- Dynamic SubID URL formatting:
  `https://offerwall-provider.com/feed?app_id=XXXX&subid={user_id}`
- Postback webhook receiver credits coins to user document when offer is completed.

### 2.4 Withdrawal System
- **Minimum Withdrawal Threshold**: Configured globally (Default: 300 Coins = ₹1.00).
- **Supported Payout Rails**:
  - **UPI (Fiat INR)**: Accepts valid VPA format (`[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}`).
  - **TON / USDT (Web3)**: Accepts standard TON wallet address or connects via TonKeeper.
- **Deduction Lifecycle**:
  - When withdrawal is submitted, coins are deducted immediately from `balance` to avoid double-spend.
  - A new document in `withdrawals` collection is created with status `pending`.
  - If admin rejects the request, an optional toggle restores the deducted coins.

---

## 3. Core Functional Requirements: Channel Promotion Marketplace

### 3.1 Sponsor Campaign Submission
External channel owners can apply to promote their channels:
- Form fields:
  - Channel Username / Link (e.g., `@cryptotraders` or `https://t.me/cryptotraders`).
  - Required Members count (e.g., 500, 1000, 5000).
  - Sponsor Contact Handle (for payment confirmation).
  - Selected Package OR Custom Member Budget.

### 3.2 Pre-Packaged Bundles
The platform offers fixed promotion tiers:
- **Starter Bundle**: 500 Members — ₹1,000
- **Growth Bundle**: 2,000 Members — ₹3,500
- **Pro Bundle**: 5,000 Members — ₹8,000

---

## 4. Stealth Administrative Portal (`/admin-penel-29devs`)

### 4.1 Route Security & Access Control
- **URL**: Dedicated obfuscated route `/admin-penel-29devs`.
- **Search Engine Blocking**: `noindex, nofollow` meta tags and `robots.txt` exclusion.
- **Authentication Gate**: Single-credential master password / username combination, validated against hashed environment variables.
- **Session Lifespan**: Secure session token with automatic expiration after 8 hours.

### 4.2 Module 1: Platform Global Config
- Adjust minimum coin withdrawal limit (e.g., 300, 500, 1000).
- Adjust Coin-to-Fiat conversion formula (e.g., 300 Coins = ₹1.00).
- Adjust Coin-to-TON conversion rate.
- Feature kill-switches:
  - Toggle CPA Offerwalls ON/OFF.
  - Toggle Channel Tasks ON/OFF.
  - Maintenance mode banner toggle.

### 4.3 Module 2: User Management
- Searchable user data grid:
  - Search by `user_id` or `username`.
  - Display coin balance, completed tasks count, join date.
- Actions:
  - Manual Credit/Debit (+/- Coins) with reason logging.
  - Reset tasks array if user requests support.
  - Ban / Unban malicious users.

### 4.4 Module 3: Withdrawal Hub
- Filter requests by status: `pending`, `completed`, `rejected`.
- Detailed modal:
  - User ID, Username, Join Date.
  - Requested Amount (Coins & INR/TON equivalent).
  - Target UPI ID or TON Address with 1-click Copy button.
- Actions:
  - **Mark as Paid / Completed**: Input reference/UTR number; updates status.
  - **Reject**: Admin notes reason (e.g. invalid UPI, spoofing) with checkbox "Refund coins to user balance".

### 4.5 Module 4: Campaign Moderation & Package Builder
- **Pending Channel Approvals**:
  - Review submitted channel link and target members.
  - Click "Approve" $\rightarrow$ channel is automatically published to active tasks in the user app.
  - Click "Reject" with notes.
- **Package Builder CRUD**:
  - Create new packages, set pricing, adjust member count, and toggle active status.

---

## 5. Non-Functional & Quality Requirements

| Dimension | Specification |
| :--- | :--- |
| **Response Latency** | Task verification < 1.2s; balance refresh instant via Firestore snapshot |
| **Mobile Form Factor** | Responsive width strictly constrained to mobile view (max-w-md 480px centered on desktop) |
| **Styling Standard** | Liquid Glassmorphic Light Sky (`backdrop-blur-xl`, `bg-white/50`, sky gradients) |
| **Browser Compatibility** | Telegram In-App Browser (iOS Safari WebKit & Android Chromium WebView) |
| **Security** | Zero client-side bot tokens; all verification proxied through backend API |
