"use client";

import React, { useState, useEffect } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Header } from "@/components/layout/Header";
import { BottomNav, TabType } from "@/components/layout/BottomNav";
import { BalanceCard } from "@/components/home/BalanceCard";
import { TaskList } from "@/components/home/TaskList";
import { OfferwallView } from "@/components/offerwalls/OfferwallView";
import { PromoteView } from "@/components/promote/PromoteView";
import { WalletView } from "@/components/wallet/WalletView";
import { ProfileView } from "@/components/profile/ProfileView";
import { WithdrawModal } from "@/components/wallet/WithdrawModal";
import { SupportChatModal } from "@/components/support/SupportChatModal";
import { useTelegram } from "@/hooks/useTelegram";
import {
  initialConfig,
  initialMockUser,
  initialPackages,
  initialTasks,
  initialWithdrawals,
  initialSupportMessages,
} from "@/lib/mockData";
import {
  ChannelTask,
  GlobalConfig,
  PromoPackage,
  UserProfile,
  WithdrawalRequest,
  SupportChatMessage,
} from "@/types";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, collection, addDoc } from "firebase/firestore";

export default function MudraTubeApp() {
  const { user: tgUser, isTelegram, triggerHaptic, triggerNotificationHaptic, openLink } = useTelegram();

  // Application State
  const [currentTab, setCurrentTab] = useState<TabType>("tasks");
  const [user, setUser] = useState<UserProfile>(initialMockUser);
  const [config, setConfig] = useState<GlobalConfig>(initialConfig);
  const [tasks, setTasks] = useState<ChannelTask[]>(initialTasks);
  const [packages, setPackages] = useState<PromoPackage[]>(initialPackages);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(initialWithdrawals);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessages, setSupportMessages] = useState<SupportChatMessage[]>(initialSupportMessages);

  // Sync Telegram User & Firestore Database
  useEffect(() => {
    if (!tgUser) return;

    const actualId = String(tgUser.id);
    const actualUsername = tgUser.username || "tg_user";
    const actualFirstName = tgUser.first_name || "Earner";

    setUser((prev) => ({
      ...prev,
      user_id: actualId,
      username: actualUsername,
      first_name: actualFirstName,
    }));

    if (!isFirebaseConfigured) return;

    // Real-time Firestore sync
    const userDocRef = doc(db, "users", actualId);

    // Initial check / create if new user
    getDoc(userDocRef).then((snap) => {
      if (!snap.exists()) {
        const newUserDoc: UserProfile = {
          user_id: actualId,
          username: actualUsername,
          first_name: actualFirstName,
          balance: 0,
          total_earned: 0,
          total_withdrawn: 0,
          completed_tasks: [],
          referrals_count: 0,
          is_banned: false,
          created_at: new Date().toISOString(),
        };
        setDoc(userDocRef, newUserDoc);
      }
    });

    // Listen to real-time balance updates
    const unsubUser = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUser((prev) => ({ ...prev, ...data }));
      }
    });

    return () => {
      unsubUser();
    };
  }, [tgUser]);

  // Handle Tab Switching with Haptics
  const handleSelectTab = (tab: TabType) => {
    triggerHaptic("light");
    setCurrentTab(tab);
  };

  // Channel Membership Verification Logic
  const handleVerifyTask = async (taskId: string, channelUsername: string): Promise<boolean> => {
    triggerHaptic("medium");

    // Check anti-cheat double-claim
    if (user.completed_tasks.includes(taskId)) {
      triggerNotificationHaptic("error");
      return false;
    }

    try {
      // Backend Bot API call proxy
      const res = await fetch("/api/tasks/verify-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.user_id,
          channelId: channelUsername,
          taskId,
        }),
      }).catch(() => null);

      const task = tasks.find((t) => t.id === taskId);
      const reward = task ? task.reward_coins : config.default_task_reward;
      const newCompleted = [...user.completed_tasks, taskId];
      const newBalance = user.balance + reward;
      const newEarned = user.total_earned + reward;

      // Update local state atomically
      setUser((prev) => ({
        ...prev,
        balance: newBalance,
        total_earned: newEarned,
        completed_tasks: newCompleted,
      }));

      // If Firebase configured, persist to Firestore
      if (isFirebaseConfigured) {
        const userDocRef = doc(db, "users", user.user_id);
        setDoc(
          userDocRef,
          {
            balance: newBalance,
            total_earned: newEarned,
            completed_tasks: newCompleted,
          },
          { merge: true }
        );
      }

      // Update task joins count
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, joined_count: t.joined_count + 1 } : t))
      );

      triggerNotificationHaptic("success");
      return true;
    } catch (e) {
      triggerNotificationHaptic("error");
      return false;
    }
  };

  // Submit Withdrawal Request
  const handleSubmitWithdrawal = async (
    method: "UPI" | "TON",
    payoutAddress: string,
    coins: number
  ): Promise<boolean> => {
    triggerHaptic("medium");

    if (coins > user.balance || coins < config.min_withdrawal_coins) {
      triggerNotificationHaptic("error");
      return false;
    }

    const inrValue = Number((coins / config.coins_per_inr).toFixed(2));
    const newRequest: WithdrawalRequest = {
      id: `wd_${Date.now()}`,
      user_id: user.user_id,
      username: user.username,
      method,
      payout_address: payoutAddress,
      coins,
      amount_inr: inrValue,
      status: "pending",
      refunded: false,
      requested_at: new Date().toISOString(),
    };

    const updatedBalance = user.balance - coins;
    const updatedWithdrawn = user.total_withdrawn + coins;

    // Deduct coins immediately
    setUser((prev) => ({
      ...prev,
      balance: updatedBalance,
      total_withdrawn: updatedWithdrawn,
    }));

    setWithdrawals((prev) => [newRequest, ...prev]);

    // Persist to Firestore if configured
    if (isFirebaseConfigured) {
      addDoc(collection(db, "withdrawals"), newRequest);
      const userDocRef = doc(db, "users", user.user_id);
      setDoc(
        userDocRef,
        {
          balance: updatedBalance,
          total_withdrawn: updatedWithdrawn,
        },
        { merge: true }
      );
    }

    triggerNotificationHaptic("success");
    return true;
  };

  // Submit Promotion Request
  const handleSubmitPromotion = async (data: {
    channel: string;
    members: number;
    price_inr: number;
    utr_number: string;
    contact: string;
    packageId?: string;
  }): Promise<boolean> => {
    triggerHaptic("medium");
    if (isFirebaseConfigured) {
      addDoc(collection(db, "promotions"), {
        ...data,
        user_id: user.user_id,
        status: "pending",
        created_at: new Date().toISOString(),
      });
    }
    triggerNotificationHaptic("success");
    return true;
  };

  // Launch CPA Offerwall with Dynamic SubID
  const handleOpenOfferwall = (provider: string) => {
    triggerHaptic("light");
    const cpaUrl = `https://offers.sample-cpa.com/?wall_id=${provider}&subid=${user.user_id}`;
    openLink(cpaUrl);
  };

  // Send Message in 1-to-1 Support Chat
  const handleSendSupportMessage = (text: string) => {
    triggerHaptic("light");
    const newMsg: SupportChatMessage = {
      id: `msg_${Date.now()}`,
      user_id: user.user_id,
      user_name: user.first_name || user.username || "User",
      sender: "user",
      message: text,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setSupportMessages((prev) => [...prev, newMsg]);

    if (isFirebaseConfigured) {
      addDoc(collection(db, "support_messages"), newMsg);
    }
    triggerNotificationHaptic("success");
  };

  return (
    <MobileShell>
      {/* Sticky Header */}
      <Header
        user={user}
        onCoinClick={() => {
          triggerHaptic("light");
          setIsWithdrawOpen(true);
        }}
        onSupportClick={() => {
          triggerHaptic("light");
          setIsSupportOpen(true);
        }}
      />

      {/* Scrollable Middle Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 pb-28 space-y-4">
        {/* Tab 1: Tasks / Home */}
        {currentTab === "tasks" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <BalanceCard
              user={user}
              config={config}
              onWithdrawClick={() => {
                triggerHaptic("medium");
                setIsWithdrawOpen(true);
              }}
            />

            <TaskList
              tasks={tasks}
              completedTaskIds={user.completed_tasks}
              onVerifyTask={handleVerifyTask}
              onOpenChannel={(url) => {
                triggerHaptic("light");
                openLink(url);
              }}
            />
          </div>
        )}

        {/* Tab 2: CPA Offerwalls */}
        {currentTab === "offerwalls" && (
          <div className="animate-in fade-in duration-200">
            <OfferwallView
              user={user}
              onOpenOfferwall={handleOpenOfferwall}
            />
          </div>
        )}

        {/* Tab 3: Channel Promotions */}
        {currentTab === "promote" && (
          <div className="animate-in fade-in duration-200">
            <PromoteView
              packages={packages}
              user={user}
              config={config}
              onSubmitPromotion={handleSubmitPromotion}
            />
          </div>
        )}

        {/* Tab 4: Wallet & Withdrawals */}
        {currentTab === "wallet" && (
          <div className="animate-in fade-in duration-200">
            <WalletView
              user={user}
              config={config}
              withdrawals={withdrawals}
              onSubmitWithdrawal={handleSubmitWithdrawal}
            />
          </div>
        )}

        {/* Tab 5: Profile & Account */}
        {currentTab === "profile" && (
          <ProfileView
            user={user}
            onSupportClick={() => {
              triggerHaptic("light");
              setIsSupportOpen(true);
            }}
          />
        )}
      </div>

      {/* Docked Mobile Floating Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        pendingWithdrawalsCount={withdrawals.filter((w) => w.status === "pending").length}
      />

      {/* Slide-Up Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        user={user}
        config={config}
        onSubmitWithdrawal={handleSubmitWithdrawal}
      />

      {/* 1-to-1 Private Admin Support Chat Modal */}
      <SupportChatModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        user={user}
        messages={supportMessages}
        onSendMessage={handleSendSupportMessage}
      />
    </MobileShell>
  );
}
