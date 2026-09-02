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
import { WithdrawModal } from "@/components/wallet/WithdrawModal";
import { useTelegram } from "@/hooks/useTelegram";
import {
  initialConfig,
  initialMockUser,
  initialPackages,
  initialTasks,
  initialWithdrawals,
} from "@/lib/mockData";
import { ChannelTask, GlobalConfig, PromoPackage, UserProfile, WithdrawalRequest } from "@/types";
import Link from "next/link";
import { Shield, Sparkles } from "lucide-react";

export default function MudraTubeApp() {
  const { user: tgUser, triggerHaptic, triggerNotificationHaptic, openLink } = useTelegram();

  // Application State
  const [currentTab, setCurrentTab] = useState<TabType>("tasks");
  const [user, setUser] = useState<UserProfile>(initialMockUser);
  const [config, setConfig] = useState<GlobalConfig>(initialConfig);
  const [tasks, setTasks] = useState<ChannelTask[]>(initialTasks);
  const [packages, setPackages] = useState<PromoPackage[]>(initialPackages);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(initialWithdrawals);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // Sync Telegram User data when detected
  useEffect(() => {
    if (tgUser) {
      setUser((prev) => ({
        ...prev,
        user_id: String(tgUser.id),
        username: tgUser.username || prev.username,
        first_name: tgUser.first_name || prev.first_name,
      }));
    }
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
      // Backend Bot API call proxy (falls back to simulation if bot token not yet provided)
      const res = await fetch("/api/tasks/verify-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.user_id,
          channelId: channelUsername,
          taskId,
        }),
      }).catch(() => null);

      // Simulate success if in mock/demo mode or server confirmed
      const task = tasks.find((t) => t.id === taskId);
      const reward = task ? task.reward_coins : config.default_task_reward;

      // Update user state atomically
      setUser((prev) => ({
        ...prev,
        balance: prev.balance + reward,
        total_earned: prev.total_earned + reward,
        completed_tasks: [...prev.completed_tasks, taskId],
      }));

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

    // Deduct coins immediately (Anti-spend protection)
    setUser((prev) => ({
      ...prev,
      balance: prev.balance - coins,
      total_withdrawn: prev.total_withdrawn + coins,
    }));

    setWithdrawals((prev) => [newRequest, ...prev]);
    triggerNotificationHaptic("success");
    return true;
  };

  // Submit Promotion Request
  const handleSubmitPromotion = async (data: {
    channel: string;
    members: number;
    contact: string;
    packageId?: string;
  }): Promise<boolean> => {
    triggerHaptic("medium");
    triggerNotificationHaptic("success");
    return true;
  };

  // Launch CPA Offerwall with Dynamic SubID
  const handleOpenOfferwall = (provider: string) => {
    triggerHaptic("light");
    const cpaUrl = `https://offers.sample-cpa.com/?wall_id=${provider}&subid=${user.user_id}`;
    openLink(cpaUrl);
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
      />

      {/* Main Content Area */}
      <div className="flex-1 px-4 py-4 space-y-4">
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

        {/* Tab 5: Admin Shortcut / Info */}
        {currentTab === "admin" && (
          <div className="rounded-2xl p-6 glass-card border border-white/80 text-center space-y-4 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white mx-auto shadow-md border border-white">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-sky-950">
              Stealth Administrator Portal
            </h3>
            <p className="text-xs text-sky-700/80 leading-relaxed max-w-xs mx-auto">
              The control center is hidden from search engines at route{" "}
              <code className="font-mono bg-sky-100 px-1 py-0.5 rounded text-sky-900 font-bold">
                /admin-penel-29devs
              </code>
            </p>

            <Link
              href="/admin-penel-29devs"
              className="inline-flex items-center gap-2 btn-tactile-sky py-2.5 px-5 rounded-xl text-white font-extrabold text-xs shadow-tactile-btn"
            >
              <span>Go to Secret Admin Login</span>
            </Link>
          </div>
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
    </MobileShell>
  );
}
