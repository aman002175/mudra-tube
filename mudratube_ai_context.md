# MudraTube - AI Agent Context & Codebase Guide

## 1. Project Overview
**MudraTube** is a Telegram Mini App built with **Next.js 14 (App Router)**, **React**, **Tailwind CSS**, and **TypeScript**. It is hosted on **Vercel** and uses **Firebase Firestore** as its database.
The app allows users to earn coins by completing tasks (like joining Telegram channels or completing offerwalls) and withdraw their earnings via UPI or TON. It also has a promotion system where users can pay to promote their own channels.

## 2. Architecture & Data Flow
**Crucial Architectural Decision:**
The frontend **never** connects directly to Firebase. All database operations happen entirely in the Next.js serverless backend (`src/app/api/sync/route.ts`).
- **In-Memory Store:** Because Vercel is serverless, the backend keeps the database state in RAM (`store`).
- **Cold Boot Recovery:** When a Vercel container spins up, `getLiveStore()` calls `pullFromFirestore()` (in `src/lib/db.ts`) to asynchronously download all collections from Firebase and rebuild the memory store.
- **Background Sync:** When data is modified, it updates the memory store immediately and calls `saveDatabase()`. This triggers `syncToFirestore()`, which selectively uploads only the modified documents to Firebase (tracked via `lastSyncedStateHash`) to prevent timeout/latency issues.
- **Await Requirements:** For critical admin actions (like approving promotions), the backend `awaits` the Firebase sync before returning the response. This prevents Vercel from suspending the serverless container and causing data loss.

## 3. Core Features & Implementations
- **Authentication:** Relies on Telegram's `initData` from the Mini App. The backend validates the cryptographic signature using the Telegram Bot Token to prevent spoofing.
- **Task Verification:** Custom API routes (`/api/tasks/verify-channel` and `/api/tasks/verify-bot-admin`) communicate with the Telegram Bot API to check if a user is actually a member of a channel before awarding coins.
- **Offerwalls:** Integrated with standard offerwall callbacks (BitLabs, CPX, etc.). Uses secure API routes to credit users.
- **Referral System:** Generates unique invite links. Includes a glassmorphism share popup with a QR Code. Admin can configure rewards as either a flat signup bonus or a percentage cut during withdrawals.
- **Admin Panel:** A protected route (`/admin-penel-29devs`) for the owner to manage users, approve withdrawals, approve promotional tasks, and configure global settings (conversion rates, minimum thresholds, etc.).

## 4. Security Measures & Hardening
- **Demo User Watermarking:** If the app is accessed in a standard web browser (outside of Telegram), the frontend watermarks the user ID with a `demo_` prefix. The backend API explicitly blocks any user ID starting with `demo_` or `browser_` from being saved to the database, preventing fake traffic from polluting the analytics.
- **Task Deduplication:** When pulling from Firebase, the backend filters and merges channel tasks to ensure that the same promotional request cannot create duplicate active tasks due to UI glitches or double-clicks.
- **Strict Firestore Rules:** Firestore security rules are open (`allow read, write: if true;`) **ONLY** because all business logic and security are handled by the Vercel backend. The Firebase API keys are deliberately kept off the frontend.

## 5. Key Files Directory
- `src/app/page.tsx`: The main frontend SPA. Handles Telegram initialization, UI state, and API polling.
- `src/app/api/sync/route.ts`: The monolithic backend controller. Handles all GET and POST requests for data synchronization, user connection, and admin operations.
- `src/lib/db.ts`: Contains the `pullFromFirestore`, `saveDatabase`, and `syncToFirestore` functions handling the complex Firebase-to-Vercel bridge.
- `src/lib/security.ts`: Input validation, rate limiting, and ID verification logic.
- `src/components/*`: Reusable UI components (BottomNav, WalletView, TaskList, ReferralView, etc.).

## 6. Known Edge Cases Addressed
- **"0 Users" Vercel Wipeout:** Fixed by implementing the async `pullFromFirestore` bootloader.
- **Duplicate Tasks on Reload:** Fixed by awaiting Firebase syncs on admin mutations and adding deduplication logic to the bootloader.
- **Browser User Pollution:** Fixed by applying the `demo_` watermark and backend rejection logic.
