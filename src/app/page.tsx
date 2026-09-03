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
  initialPaymentMethods,
} from "@/lib/mockData";
import {
  ChannelTask,
  GlobalConfig,
  PromoPackage,
  UserProfile,
  WithdrawalRequest,
  SupportChatMessage,
  AdminPaymentMethod,
  PromotionRequest,
} from "@/types";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, collection, addDoc } from "firebase/firestore";

export default function MudraTubeApp() {
  const { user: tgUser, initData, isTelegram, isReady, triggerHaptic, triggerNotificationHaptic, openLink } = useTelegram();

  // Application State
  const [currentTab, setCurrentTab] = useState<TabType>("tasks");
  const [user, setUser] = useState<UserProfile>(initialMockUser);
  const [config, setConfig] = useState<GlobalConfig>(initialConfig);
  const [tasks, setTasks] = useState<ChannelTask[]>(initialTasks);
  const [packages, setPackages] = useState<PromoPackage[]>(initialPackages);
  const [paymentMethods, setPaymentMethods] = useState<AdminPaymentMethod[]>(initialPaymentMethods);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(initialWithdrawals);
  const [promotions, setPromotions] = useState<PromotionRequest[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessages, setSupportMessages] = useState<SupportChatMessage[]>(initialSupportMessages);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);

  // Secure API fetch helper with Telegram InitData signature
  const apiFetch = (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(initData ? { "x-telegram-init-data": initData } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };
    return fetch(url, { ...options, headers });
  };

  // Sync Telegram User or Persistent Browser ID with Server & Firestore
  useEffect(() => {
    if (!isReady) return;

    if (tgUser && tgUser.id) {
      const actualId = String(tgUser.id);
      const actualUsername = tgUser.username || `tg_${actualId}`;
      const actualFirstName = tgUser.first_name || "Earner";

      // Connect to Server /api/sync
      apiFetch("/api/sync", {
        method: "POST",
        body: JSON.stringify({
          action: "connect_user",
          payload: {
            user_id: actualId,
            username: actualUsername,
            first_name: actualFirstName,
          },
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
          }
        })
        .catch(() => {});

      // Fetch initial state for tasks, withdrawals, support messages
      const fetchUserData = () => {
        apiFetch(`/api/sync?user_id=${actualId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              if (data.config) setConfig(data.config);
              if (data.user) setUser(data.user);
              if (data.tasks) setTasks(data.tasks);
              if (data.packages) setPackages(data.packages);
              if (data.paymentMethods) setPaymentMethods(data.paymentMethods);
              if (data.withdrawals) setWithdrawals(data.withdrawals);
              if (data.promotions) setPromotions(data.promotions);
              if (data.supportMessages) setSupportMessages(data.supportMessages);
              if (typeof data.total_users === "number") setTotalUsersCount(data.total_users);
              else if (typeof data.totalUsersCount === "number") setTotalUsersCount(data.totalUsersCount);
            }
          })
          .catch(() => {});
      };

      fetchUserData();
      const interval = setInterval(fetchUserData, 4000);

      if (isFirebaseConfigured) {
        const userDocRef = doc(db, "users", actualId);
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

        const unsubUser = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUser((prev) => ({ ...prev, ...data }));
          }
        });

        return () => {
          clearInterval(interval);
          unsubUser();
        };
      }

      return () => {
        clearInterval(interval);
      };
    } else {
      // Browser testing mode: persist consistent ID across refreshes but DO NOT save to DB
      let storedId = typeof window !== "undefined" ? localStorage.getItem("mudratube_user_id") : null;
      if (!storedId) {
        storedId = `demo_${Math.floor(100000 + Math.random() * 900000)}`;
        if (typeof window !== "undefined") localStorage.setItem("mudratube_user_id", storedId);
      }
      const actualId = storedId;
      setUser({
        ...initialMockUser,
        user_id: actualId,
        username: `viewer_${actualId.slice(-4)}`,
        first_name: "Web Viewer",
      });

      // Poll only global data to avoid creating the user
      const fetchGlobalData = () => {
        apiFetch(`/api/sync`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              if (data.config) setConfig(data.config);
              if (data.tasks) setTasks(data.tasks);
              if (data.packages) setPackages(data.packages);
              if (data.paymentMethods) setPaymentMethods(data.paymentMethods);
              if (typeof data.total_users === "number") setTotalUsersCount(data.total_users);
              else if (typeof data.totalUsersCount === "number") setTotalUsersCount(data.totalUsersCount);
            }
          })
          .catch(() => {});
      };

      fetchGlobalData();
      const interval = setInterval(fetchGlobalData, 4000);
      return () => clearInterval(interval);
    }
  }, [isReady, tgUser]);

  // Handle Tab Switching with Haptics
  const handleSelectTab = (tab: TabType) => {
    triggerHaptic("light");
    setCurrentTab(tab);
  };

  // Channel Membership Verification Logic
  const handleVerifyTask = async (taskId: string, channelUsername: string): Promise<boolean> => {
    triggerHaptic("medium");

    // Check anti-cheat double-claim locally first
    if (user.completed_tasks.includes(taskId)) {
      triggerNotificationHaptic("error");
      return false;
    }

    try {
      // 1. Verify membership with Telegram Bot API
      const res = await apiFetch("/api/tasks/verify-channel", {
        method: "POST",
        body: JSON.stringify({
          userId: user.user_id,
          channelId: channelUsername,
          taskId,
        }),
      });
      const verifyData = await res.json();

      if (!verifyData.success || !verifyData.isMember) {
        alert(verifyData.message || verifyData.error || "Please join the channel first to earn coins!");
        triggerNotificationHaptic("error");
        return false;
      }

      // 2. Authoritatively claim reward on server with anti-cheat checks
      const syncRes = await apiFetch("/api/sync", {
        method: "POST",
        body: JSON.stringify({
          action: "complete_task",
          payload: {
            user_id: user.user_id,
            task_id: taskId,
          },
        }),
      });
      const syncData = await syncRes.json();

      if (!syncData.success) {
        alert(syncData.error || "Failed to claim task reward.");
        triggerNotificationHaptic("error");
        return false;
      }

      // Update state with server's authoritative user balance & completed tasks
      if (syncData.user) {
        setUser(syncData.user);
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, joined_count: (t.joined_count || 0) + 1 } : t))
      );

      // If Firebase configured, persist to Firestore
      if (isFirebaseConfigured && syncData.user) {
        // Backend handles syncToFirestore now
      }

      triggerNotificationHaptic("success");
      return true;
    } catch (e) {
      triggerNotificationHaptic("error");
      return false;
    }
  };

  // Submit Withdrawal Request (in ₹ INR)
  const handleSubmitWithdrawal = async (
    method: "UPI" | "TON",
    payoutAddress: string,
    amount: number
  ): Promise<boolean> => {
    triggerHaptic("medium");

    const minWdInr = config.min_withdrawal_inr ?? config.min_withdrawal_coins ?? 10;
    if (amount > user.balance || amount < minWdInr) {
      triggerNotificationHaptic("error");
      return false;
    }

    try {
      // Authoritatively submit withdrawal to server with anti-tampering verification
      const res = await apiFetch("/api/sync", {
        method: "POST",
        body: JSON.stringify({
          action: "request_withdrawal",
          payload: {
            user_id: user.user_id,
            amount_inr: amount,
            coins: amount,
            method,
            payout_address: payoutAddress,
          },
        }),
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Withdrawal request failed. Please check details.");
        triggerNotificationHaptic("error");
        return false;
      }

      // Update state authoritatively from server response
      if (data.user) {
        setUser(data.user);
      }
      if (data.withdrawal) {
        setWithdrawals((prev) => [data.withdrawal, ...prev]);
        // Backend handles syncToFirestore now
      }

      triggerNotificationHaptic("success");
      return true;
    } catch {
      triggerNotificationHaptic("error");
      return false;
    }
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

    try {
      const res = await apiFetch("/api/sync", {
        method: "POST",
        body: JSON.stringify({
          action: "submit_promotion",
          payload: {
            ...data,
            user_id: user.user_id,
          },
        }),
      });
      const resData = await res.json();

      if (!resData.success) {
        alert(resData.error || "Failed to submit promotion request.");
        triggerNotificationHaptic("error");
        return false;
      }

      if (resData.promotion) {
        setPromotions((prev) => [resData.promotion, ...prev]);
        // Backend handles syncToFirestore now
      }
      triggerNotificationHaptic("success");
      return true;
    } catch {
      triggerNotificationHaptic("error");
      return false;
    }
  };

  // Manual Threat Radar / Liquid Cloud Sync Handler
  const handleManualSync = async () => {
    triggerHaptic("medium");
    setIsSyncing(true);
    try {
      const res = await apiFetch(`/api/sync?user_id=${user.user_id}`);
      const data = await res.json();
      if (data.success) {
        if (data.config) setConfig(data.config);
        if (data.user) setUser(data.user);
        if (data.tasks) setTasks(data.tasks);
        if (data.packages) setPackages(data.packages);
        if (data.paymentMethods) setPaymentMethods(data.paymentMethods);
        if (data.withdrawals) setWithdrawals(data.withdrawals);
        if (data.promotions) setPromotions(data.promotions);
        if (data.supportMessages) setSupportMessages(data.supportMessages);
        if (typeof data.total_users === "number") setTotalUsersCount(data.total_users);
        else if (typeof data.totalUsersCount === "number") setTotalUsersCount(data.totalUsersCount);
      }
      triggerNotificationHaptic("success");
    } catch {
      triggerNotificationHaptic("error");
    } finally {
      setTimeout(() => setIsSyncing(false), 700);
    }
  };

  // Launch CPA Offerwall with Dynamic SubID
  const handleOpenOfferwall = (provider: string) => {
    triggerHaptic("light");
    const cpaUrl = `https://offers.sample-cpa.com/?wall_id=${provider}&subid=${user.user_id}`;
    openLink(cpaUrl);
  };

  // Send Message in 1-to-1 Support Chat
  const handleSendSupportMessage = async (text: string) => {
    triggerHaptic("light");
    try {
      const res = await apiFetch("/api/sync", {
        method: "POST",
        body: JSON.stringify({
          action: "send_support_message",
          payload: {
            user_id: user.user_id,
            user_name: user.first_name || user.username || "User",
            sender: "user",
            message: text,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to send message.");
        triggerNotificationHaptic("error");
        return;
      }

      if (data.message) {
        setSupportMessages((prev) => [...prev, data.message]);
        // Backend handles syncToFirestore now
      }
      triggerNotificationHaptic("success");
    } catch {
      triggerNotificationHaptic("error");
    }
  };

  // Save user's personal UPI ID & TON Address
  const handleUpdateSavedAddresses = (upi?: string, ton?: string) => {
    triggerHaptic("medium");
    const updatedUpi = upi !== undefined ? upi : user.saved_upi_id;
    const updatedTon = ton !== undefined ? ton : user.saved_ton_address;

    setUser((prev) => ({
      ...prev,
      saved_upi_id: updatedUpi,
      saved_ton_address: updatedTon,
    }));

    if (typeof window !== "undefined") {
      if (upi !== undefined) localStorage.setItem("mudratube_saved_upi", upi);
      if (ton !== undefined) localStorage.setItem("mudratube_saved_ton", ton);
    }

    // Persist to Server database
    apiFetch("/api/sync", {
      method: "POST",
      body: JSON.stringify({
        action: "update_saved_addresses",
        payload: {
          user_id: user.user_id,
          username: user.username,
          first_name: user.first_name,
          saved_upi_id: updatedUpi,
          saved_ton_address: updatedTon,
        },
      }),
    }).catch(() => {});

    // Backend handles syncToFirestore now

    triggerNotificationHaptic("success");
  };

  return (
    <MobileShell>
      {/* Sticky Header */}
      <Header
        user={user}
        totalUsers={totalUsersCount}
        isSyncing={isSyncing}
        onSyncClick={handleManualSync}
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
              promotions={promotions}
              tasks={tasks}
              isSyncing={isSyncing}
              onRefresh={handleManualSync}
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
              paymentMethods={paymentMethods}
              withdrawals={withdrawals}
              onSubmitWithdrawal={handleSubmitWithdrawal}
              onSaveAddress={(method, addr) => {
                if (method === "UPI") {
                  handleUpdateSavedAddresses(addr, undefined);
                } else {
                  handleUpdateSavedAddresses(undefined, addr);
                }
              }}
            />
          </div>
        )}

        {/* Tab 5: Profile & Account */}
        {currentTab === "profile" && (
          <ProfileView
            user={user}
            config={config}
            promotions={promotions}
            isSyncing={isSyncing}
            onRefresh={handleManualSync}
            onNavigateToPromote={() => {
              triggerHaptic("light");
              setCurrentTab("promote");
            }}
            onSupportClick={() => {
              triggerHaptic("light");
              setIsSupportOpen(true);
            }}
            onUpdateSavedAddresses={handleUpdateSavedAddresses}
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
        paymentMethods={paymentMethods}
        onSubmitWithdrawal={handleSubmitWithdrawal}
        onSaveAddress={(method, addr) => {
          if (method === "UPI") {
            handleUpdateSavedAddresses(addr, undefined);
          } else {
            handleUpdateSavedAddresses(undefined, addr);
          }
        }}
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
