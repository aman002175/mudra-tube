"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Lock,
  Users,
  CreditCard,
  Settings,
  Megaphone,
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Plus,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  LogOut,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  Save,
  Crown,
  Star,
  ShieldCheck,
  Percent,
  ArrowRight,
  MessageSquare,
  Wallet,
  History,
  Eye,
  ShieldAlert,
} from "lucide-react";
import {
  ChannelTask,
  GlobalConfig,
  PromoPackage,
  UserProfile,
  WithdrawalRequest,
  PromotionRequest,
  AdminPaymentMethod,
  SupportChatMessage,
} from "@/types";
import {
  initialConfig,
  initialMockUser,
  initialPackages,
  initialTasks,
  initialWithdrawals,
  initialPaymentMethods,
  initialSupportMessages,
} from "@/lib/mockData";

export default function AdminPortalPage() {
  // Authentication Gate State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [adminToken, setAdminToken] = useState<string>("");
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);

  // Navigation Sub-tab
  const [currentSection, setCurrentSection] = useState<
    "overview" | "users" | "withdrawals" | "promotions" | "approvals" | "packages" | "payments" | "support" | "settings" | "security"
  >("overview");

  // State Stores
  const [config, setConfig] = useState<GlobalConfig>(initialConfig);
  const [tasks, setTasks] = useState<ChannelTask[]>(initialTasks);
  const [packages, setPackages] = useState<PromoPackage[]>(initialPackages);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(initialWithdrawals);
  const [promotionRequests, setPromotionRequests] = useState<PromotionRequest[]>([]);
  const [adminProfitCut, setAdminProfitCut] = useState<number>(initialConfig.admin_profit_cut_percent || 60);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);

  // UI helpers
  const [userSearch, setUserSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [coinAdjustment, setCoinAdjustment] = useState<number>(100);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskUsername, setNewTaskUsername] = useState("");
  const [newTaskLink, setNewTaskLink] = useState("");
  const [newTaskReward, setNewTaskReward] = useState<number | string>(50);
  const [newTaskIsPinned, setNewTaskIsPinned] = useState(false);
  const [newTaskBadgeLabel, setNewTaskBadgeLabel] = useState("TOP #1 SPONSOR");
  // Package form & edit state
  const [isPackageFormOpen, setIsPackageFormOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [pkgTitle, setPkgTitle] = useState("");
  const [pkgMembers, setPkgMembers] = useState<number | string>(1000);
  const [pkgPrice, setPkgPrice] = useState<number | string>(1500);
  const [pkgBadge, setPkgBadge] = useState("");
  const [pkgPopular, setPkgPopular] = useState(false);
  const [pkgFeatures, setPkgFeatures] = useState("Real Telegram Users, Fast Delivery, 24/7 Support");

  // Admin Payment Methods Manager state
  const [paymentMethods, setPaymentMethods] = useState<AdminPaymentMethod[]>(initialPaymentMethods);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [pmType, setPmType] = useState<"UPI" | "TON" | "CRYPTO">("UPI");
  const [pmLabel, setPmLabel] = useState("");
  const [pmAddress, setPmAddress] = useState("");
  const [pmActive, setPmActive] = useState(true);

  // 1-to-1 Support Desk state
  const [supportMessages, setSupportMessages] = useState<SupportChatMessage[]>(initialSupportMessages);
  const [selectedChatUserId, setSelectedChatUserId] = useState<string>("");
  const [adminReplyText, setAdminReplyText] = useState("");
  const [inspectedUser, setInspectedUser] = useState<UserProfile | null>(null);

  // Check for saved session token
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = sessionStorage.getItem("mudratube_admin_token");
      if (savedToken) {
        setAdminToken(savedToken);
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Secure admin fetch helper with Bearer token authentication
  const adminFetch = (url: string, options: RequestInit = {}) => {
    const token = adminToken || (typeof window !== "undefined" ? sessionStorage.getItem("mudratube_admin_token") : "");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };
    return fetch(url, { ...options, headers });
  };

  // Auth Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        setAdminToken(data.token);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("mudratube_admin_token", data.token);
        }
        setIsAuthenticated(true);
        setAuthError("");
        return;
      }
      setAuthError(data.error || "Galat Username ya Password! Kripya sahi credentials dalein.");
      return;
    } catch {
      setAuthError("Server connection error during authentication.");
      return;
    }
  };

  const handleLogout = () => {
    setAdminToken("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("mudratube_admin_token");
    }
    setIsAuthenticated(false);
  };

  // Sync real data from /api/sync
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchLiveSync = () => {
      adminFetch("/api/sync")
        .then((res) => {
          if (res.status === 401 || res.status === 403) {
            handleLogout();
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data && data.success) {
            if (data.users) setUsersList(data.users);
            if (data.withdrawals) setWithdrawals(data.withdrawals);
            if (data.promotions) setPromotionRequests(data.promotions);
            if (data.supportMessages) setSupportMessages(data.supportMessages);
            if (data.tasks && data.tasks.length > 0) setTasks(data.tasks);
            if (data.config) setConfig(data.config);
            if (data.securityLogs) setSecurityLogs(data.securityLogs);
          }
        })
        .catch(() => {});
    };

    fetchLiveSync();
    const interval = setInterval(fetchLiveSync, 3000);
    return () => clearInterval(interval);
  }, [isAuthenticated, adminToken]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleBan = (userId: string) => {
    adminFetch("/api/sync", {
      method: "POST",
      body: JSON.stringify({
        action: "admin_toggle_user_ban",
        payload: { user_id: userId },
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUsersList((prev) =>
            prev.map((u) => (u.user_id === userId ? { ...u, is_banned: data.user.is_banned } : u))
          );
        }
      })
      .catch(() => {});
  };

  const handleResolveWithdrawal = (
    id: string,
    newStatus: "completed" | "rejected",
    refund: boolean = false
  ) => {
    setWithdrawals((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          return {
            ...w,
            status: newStatus,
            refunded: refund,
            processed_at: new Date().toISOString(),
          };
        }
        return w;
      })
    );

    // Sync with server
    adminFetch("/api/sync", {
      method: "POST",
      body: JSON.stringify({
        action: "admin_resolve_withdrawal",
        payload: { id, status: newStatus, refund },
      }),
    }).catch(() => {});

    // If refund requested, restore user balance
    if (refund) {
      const targetWithdrawal = withdrawals.find((w) => w.id === id);
      if (targetWithdrawal) {
        setUsersList((prev) =>
          prev.map((u) =>
            u.user_id === targetWithdrawal.user_id
              ? { ...u, balance: u.balance + targetWithdrawal.coins }
              : u
          )
        );
      }
    }
  };

  const handleAdjustBalance = (userId: string, delta: number) => {
    setUsersList((prev) =>
      prev.map((u) =>
        u.user_id === userId
          ? {
              ...u,
              balance: Math.max(0, u.balance + delta),
              total_earned: delta > 0 ? u.total_earned + delta : u.total_earned,
            }
          : u
      )
    );

    // Sync with server
    adminFetch("/api/sync", {
      method: "POST",
      body: JSON.stringify({
        action: "admin_adjust_balance",
        payload: { user_id: userId, delta },
      }),
    }).catch(() => {});

    setSelectedUserForEdit(null);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskLink) return;

    const newTask: ChannelTask = {
      id: `task_${Date.now()}`,
      title: newTaskTitle,
      username: newTaskUsername.startsWith("@") ? newTaskUsername : `@${newTaskUsername}`,
      channel_link: newTaskLink,
      reward_coins: Number(newTaskReward) || 50,
      target_members: 1000,
      joined_count: 0,
      is_pinned: newTaskIsPinned,
      badge_label: newTaskBadgeLabel,
      status: "active",
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle("");
    setNewTaskUsername("");
    setNewTaskLink("");
    setNewTaskReward(50);
    setNewTaskIsPinned(false);
    setNewTaskBadgeLabel("TOP #1 SPONSOR");
  };

  const handleTogglePinTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, is_pinned: !t.is_pinned } : t
      )
    );
  };

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgTitle || !pkgPrice) return;

    const featArr = pkgFeatures
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingPackageId) {
      setPackages((prev) =>
        prev.map((p) =>
          p.id === editingPackageId
            ? {
                ...p,
                title: pkgTitle,
                members: Number(pkgMembers) || 1000,
                price_inr: Number(pkgPrice) || 1500,
                badge: pkgBadge,
                popular: pkgPopular,
                features: featArr,
              }
            : p
        )
      );
      setEditingPackageId(null);
    } else {
      const newPkg: PromoPackage = {
        id: `pkg_${Date.now()}`,
        title: pkgTitle,
        members: Number(pkgMembers) || 1000,
        price_inr: Number(pkgPrice) || 1500,
        badge: pkgBadge,
        popular: pkgPopular,
        features: featArr,
      };
      setPackages((prev) => [...prev, newPkg]);
    }

    setPkgTitle("");
    setPkgMembers(1000);
    setPkgPrice(1500);
    setPkgBadge("");
    setPkgPopular(false);
    setPkgFeatures("Real Telegram Users, Fast Delivery, 24/7 Support");
    setIsPackageFormOpen(false);
  };

  const handleStartEditPackage = (pkg: PromoPackage) => {
    setEditingPackageId(pkg.id);
    setPkgTitle(pkg.title);
    setPkgMembers(pkg.members);
    setPkgPrice(pkg.price_inr);
    setPkgBadge(pkg.badge || "");
    setPkgPopular(Boolean(pkg.popular));
    setPkgFeatures(pkg.features.join(", "));
    setIsPackageFormOpen(true);
  };

  const handleDeletePackage = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleApprovePromotion = (req: PromotionRequest) => {
    // Profit Calculation Formula:
    // adminProfit = price_inr * (adminProfitCut / 100)
    // userPool = price_inr - adminProfit
    // coinsPerUser = (userPool / target_members) * coins_per_inr
    const userPoolInr = req.price_inr * (1 - adminProfitCut / 100);
    const coinsPerUser = Math.max(
      10,
      Math.round((userPoolInr / req.target_members) * config.coins_per_inr)
    );

    const isTopSpot = req.package_id?.includes("growth") || req.package_id?.includes("pro");

    const newLiveTask: ChannelTask = {
      id: `task_${Date.now()}`,
      title: req.channel_title || req.channel_username,
      username: req.channel_username.startsWith("@") ? req.channel_username : `@${req.channel_username}`,
      channel_link: req.channel_link,
      reward_coins: coinsPerUser,
      target_members: req.target_members,
      joined_count: 0,
      is_pinned: isTopSpot,
      badge_label: isTopSpot ? "👑 TOP SPONSOR" : undefined,
      total_pool_inr: userPoolInr,
      status: "active",
    };

    setTasks((prev) => [newLiveTask, ...prev]);
    setPromotionRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: "approved" } : r))
    );

    // Sync with server
    adminFetch("/api/sync", {
      method: "POST",
      body: JSON.stringify({
        action: "admin_approve_promotion",
        payload: { id: req.id },
      }),
    }).catch(() => {});
  };

  const handleRejectPromotion = (id: string, reason?: string) => {
    setPromotionRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "rejected",
              rejection_reason: reason || "Payment or bot administrator verification failed",
            }
          : r
      )
    );
  };

  // Payment methods handlers
  const handleSavePaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmLabel || !pmAddress) return;

    if (editingPaymentId) {
      setPaymentMethods((prev) =>
        prev.map((pm) =>
          pm.id === editingPaymentId
            ? { ...pm, type: pmType, label: pmLabel, address_or_vpa: pmAddress, is_active: pmActive }
            : pm
        )
      );
      setEditingPaymentId(null);
    } else {
      const newMethod: AdminPaymentMethod = {
        id: `pm_${Date.now()}`,
        type: pmType,
        label: pmLabel,
        address_or_vpa: pmAddress,
        is_active: pmActive,
      };
      setPaymentMethods((prev) => [...prev, newMethod]);
    }

    setPmLabel("");
    setPmAddress("");
    setPmActive(true);
    setIsPaymentFormOpen(false);
  };

  const handleStartEditPayment = (pm: AdminPaymentMethod) => {
    setEditingPaymentId(pm.id);
    setPmType(pm.type);
    setPmLabel(pm.label);
    setPmAddress(pm.address_or_vpa);
    setPmActive(pm.is_active);
    setIsPaymentFormOpen(true);
  };

  const handleDeletePaymentMethod = (id: string) => {
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
  };

  const handleTogglePaymentMethod = (id: string) => {
    setPaymentMethods((prev) =>
      prev.map((pm) => (pm.id === id ? { ...pm, is_active: !pm.is_active } : pm))
    );
  };

  // Support Reply Handler
  const handleAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedChatUserId) return;

    const chatTargetUser = usersList.find((u) => u.user_id === selectedChatUserId);
    const newReply: SupportChatMessage = {
      id: `reply_${Date.now()}`,
      user_id: selectedChatUserId,
      user_name: chatTargetUser?.first_name || chatTargetUser?.username || "User",
      sender: "admin",
      message: adminReplyText.trim(),
      timestamp: new Date().toISOString(),
      read: true,
    };

    setSupportMessages((prev) => [...prev, newReply]);

    // Sync with server
    adminFetch("/api/sync", {
      method: "POST",
      body: JSON.stringify({
        action: "send_support_message",
        payload: {
          user_id: selectedChatUserId,
          user_name: chatTargetUser?.first_name || chatTargetUser?.username || "User",
          sender: "admin",
          message: adminReplyText.trim(),
        },
      }),
    }).catch(() => {});

    setAdminReplyText("");
  };

  // 1. Unauthenticated Login Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen liquid-sky-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-elevated rounded-squircle p-8 border border-white shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white mx-auto shadow-md border border-white">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-sky-950 tracking-tight">
              Mudra Tube Admin Portal
            </h1>
            <p className="text-xs text-sky-800 font-medium">
              Obfuscated Administrative Route: <code className="bg-white/80 px-1.5 py-0.5 rounded text-[11px] font-mono">/admin-penel-29devs</code>
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-sky-900 uppercase tracking-wide mb-1">
                Admin Username
              </label>
              <input
                type="text"
                required
                placeholder="Enter admin username"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-sky-200 text-sm text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-sky-900 uppercase tracking-wide mb-1">
                Security Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-sky-200 text-sm text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-400 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full btn-tactile-sky py-3 rounded-xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-tactile-btn"
            >
              <Lock className="w-4 h-4" />
              <span>Enter Secure Dashboard</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Authenticated Admin Dashboard
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");
  const pendingApprovals = promotionRequests.filter((p) => p.status === "pending");
  const unreadSupportCount = supportMessages.filter((m) => m.sender === "user" && !m.read).length;
  const filteredUsers = usersList.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.user_id.includes(userSearch)
  );

  return (
    <div className="min-h-screen liquid-sky-bg flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 px-6 py-3.5 glass-elevated border-b border-white/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white font-black text-sm shadow-sm border border-white">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-sky-950">Mudra Tube Control Center</h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                Live Admin
              </span>
            </div>
            <p className="text-[11px] text-sky-700 font-mono">/admin-penel-29devs</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-pill text-xs font-bold text-rose-700 hover:bg-rose-50 active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Lock Out</span>
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 glass-card rounded-2xl border border-white/90">
          {[
            { id: "overview", label: "Overview", icon: TrendingUp },
            { id: "security", label: "Security & Anti-Hack", icon: ShieldAlert, count: securityLogs.length },
            { id: "support", label: "Support Desk", icon: MessageSquare, count: unreadSupportCount },
            { id: "payments", label: "UPI & Wallets", icon: Wallet },
            { id: "approvals", label: "Sponsor Orders", icon: ShieldCheck, count: pendingApprovals.length },
            { id: "withdrawals", label: "Withdrawals", icon: CreditCard, count: pendingWithdrawals.length },
            { id: "users", label: "Users & Balances", icon: Users },
            { id: "promotions", label: "Channel Tasks", icon: Megaphone },
            { id: "packages", label: "Ad Packages", icon: Layers },
            { id: "settings", label: "Economics & Settings", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentSection === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setCurrentSection(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
                  isActive
                    ? "btn-tactile-sky text-white shadow-sm"
                    : "text-sky-800 hover:bg-white/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 1. OVERVIEW SECTION */}
        {currentSection === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="glass-card rounded-2xl p-4 border border-white">
                <span className="text-xs font-semibold text-sky-700">Total Users</span>
                <div className="text-2xl font-black text-sky-950 mt-1">{usersList.length}</div>
                <span className="text-[11px] text-emerald-600 font-bold">● Active in real-time</span>
              </div>

              <div className="glass-card rounded-2xl p-4 border border-white">
                <span className="text-xs font-semibold text-sky-700">Pending Payouts</span>
                <div className="text-2xl font-black text-amber-600 mt-1">{pendingWithdrawals.length}</div>
                <span className="text-[11px] text-sky-700">Requires manual/auto transfer</span>
              </div>

              <div className="glass-card rounded-2xl p-4 border border-white">
                <span className="text-xs font-semibold text-sky-700">Circulating Coins</span>
                <div className="text-2xl font-black text-sky-950 mt-1">
                  {usersList.reduce((acc, u) => acc + u.balance, 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-sky-700">
                  ≈ ₹{(usersList.reduce((acc, u) => acc + u.balance, 0) / config.coins_per_inr).toFixed(2)} INR
                </span>
              </div>

              <div className="glass-card rounded-2xl p-4 border border-white">
                <span className="text-xs font-semibold text-sky-700">Active Channel Tasks</span>
                <div className="text-2xl font-black text-sky-950 mt-1">{tasks.length}</div>
                <span className="text-[11px] text-emerald-600 font-bold">+50 Coins / Join</span>
              </div>
            </div>

            {/* Quick Action pending withdrawals preview */}
            <div className="glass-card rounded-2xl p-5 border border-white space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider">
                  Pending Payout Queue
                </h3>
                <button
                  onClick={() => setCurrentSection("withdrawals")}
                  className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                >
                  <span>View All ({withdrawals.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {pendingWithdrawals.length === 0 ? (
                <div className="text-center py-6 text-xs text-sky-700 font-medium">
                  🎉 All withdrawal requests are processed!
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingWithdrawals.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-white/70 border border-sky-200/70 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-sky-950 flex items-center gap-2">
                          <span>@{item.username}</span>
                          <span className="font-black text-emerald-700">₹{item.amount_inr}</span>
                          <span className="text-[10px] text-sky-600">({item.coins} Coins)</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 font-mono text-sky-800">
                          <span>{item.payout_address}</span>
                          <button
                            onClick={() => handleCopy(item.payout_address, item.id)}
                            className="p-1 rounded hover:bg-sky-100 text-sky-600"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {copiedId === item.id && (
                            <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolveWithdrawal(item.id, "completed")}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 active:scale-95 shadow-sm"
                        >
                          Mark as Paid
                        </button>
                        <button
                          onClick={() => handleResolveWithdrawal(item.id, "rejected", true)}
                          className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs hover:bg-rose-200 active:scale-95"
                        >
                          Reject & Refund
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUPPORT DESK SECTION */}
        {currentSection === "support" && (
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-5 border border-white space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-sky-600" />
                    <span>1-to-1 User Support Desk & Private Messaging</span>
                  </h3>
                  <p className="text-xs text-sky-700 mt-0.5">
                    Live individual chat with users. Tap user profile to inspect full withdrawal & deposit history.
                  </p>
                </div>

                <span className="text-xs font-black px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                  Unread Messages: {unreadSupportCount}
                </span>
              </div>

              {/* Two Column Layout: Left user threads, Right active chat */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-h-[480px]">
                {/* Left: User Thread List */}
                <div className="sm:col-span-1 rounded-2xl bg-white/70 border border-sky-200/80 p-3 space-y-2 overflow-y-auto max-h-[500px]">
                  <h4 className="text-[11px] font-bold text-sky-900 uppercase tracking-wider px-1 pb-1 border-b border-sky-100">
                    Conversations
                  </h4>

                  {supportMessages.length === 0 ? (
                    <div className="p-4 text-center text-xs text-sky-600 bg-white/50 rounded-xl border border-sky-100 italic">
                      No support chats yet. Messages sent from the user app will appear here.
                    </div>
                  ) : (
                    Array.from(new Set(supportMessages.map((m) => m.user_id))).map((uid) => {
                      const threadMsgs = supportMessages.filter((m) => m.user_id === uid);
                      const lastMsg = threadMsgs[threadMsgs.length - 1];
                      const threadUser = usersList.find((u) => u.user_id === uid) || {
                        user_id: uid,
                        username: lastMsg?.user_name || "user",
                        first_name: lastMsg?.user_name || "User",
                        balance: 0,
                      };
                      const isSelected = selectedChatUserId === uid;
                      const hasUnread = threadMsgs.some((m) => m.sender === "user" && !m.read);

                      return (
                        <div
                          key={uid}
                          onClick={() => {
                            setSelectedChatUserId(uid);
                            // Mark as read
                            setSupportMessages((prev) =>
                              prev.map((m) => (m.user_id === uid ? { ...m, read: true } : m))
                            );
                          }}
                          className={`p-3 rounded-xl cursor-pointer transition-all border text-xs space-y-1 ${
                            isSelected
                              ? "bg-sky-500 text-white border-sky-600 shadow-sm"
                              : "bg-white/80 hover:bg-white text-sky-950 border-sky-100"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isSelected ? "bg-white text-sky-600" : "bg-sky-100 text-sky-800"
                                }`}
                              >
                                {threadUser.first_name ? threadUser.first_name[0].toUpperCase() : "U"}
                              </div>
                              <div className="min-w-0">
                                <span className="font-black truncate block">
                                  {threadUser.first_name || threadUser.username}
                                </span>
                                <span
                                  className={`text-[10px] font-mono block ${
                                    isSelected ? "text-sky-100" : "text-sky-600"
                                  }`}
                                >
                                  #{uid}
                                </span>
                              </div>
                            </div>

                            {hasUnread && (
                              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full shrink-0" />
                            )}
                          </div>

                          <p
                            className={`text-[11px] truncate pt-1 ${
                              isSelected ? "text-sky-100" : "text-sky-700"
                            }`}
                          >
                            {lastMsg ? lastMsg.message : "No messages yet"}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Right: Active Chat Window */}
                <div className="sm:col-span-2 rounded-2xl bg-white/80 border border-sky-200/80 flex flex-col justify-between overflow-hidden">
                  {/* Chat Header with User Balance & Inspect Button */}
                  {(() => {
                    if (!selectedChatUserId) {
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2 text-xs text-sky-600 min-h-[300px]">
                          <MessageSquare className="w-10 h-10 text-sky-300 mx-auto" />
                          <h5 className="font-bold text-sky-900 text-sm">Support Desk Active</h5>
                          <p className="max-w-xs text-[11px] text-sky-600">
                            No conversation selected. When users send a support inquiry from the Mini App, select their name on the left to read and reply.
                          </p>
                        </div>
                      );
                    }

                    const activeUser =
                      usersList.find((u) => u.user_id === selectedChatUserId) ||
                      ({
                        user_id: selectedChatUserId,
                        username: "user",
                        first_name: "User",
                        balance: 0,
                        total_earned: 0,
                        total_withdrawn: 0,
                        completed_tasks: [],
                        referrals_count: 0,
                        is_banned: false,
                        created_at: new Date().toISOString(),
                      } as UserProfile);

                    const activeThreadMsgs = supportMessages.filter(
                      (m) => m.user_id === selectedChatUserId
                    );

                    return (
                      <>
                        <div className="p-3.5 border-b border-sky-100 bg-sky-50/60 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white flex items-center justify-center font-bold text-sm">
                              {activeUser.first_name ? activeUser.first_name[0].toUpperCase() : "U"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sky-950 text-xs">
                                  {activeUser.first_name || activeUser.username}
                                </span>
                                <span className="text-[10px] font-mono text-sky-600">
                                  ID: #{activeUser.user_id}
                                </span>
                              </div>
                              <div className="text-[11px] text-sky-800 font-semibold mt-0.5">
                                Balance: <span className="font-black text-emerald-700">{activeUser.balance.toLocaleString()} Coins</span> (≈ ₹{((activeUser.balance || 0) / config.coins_per_inr).toFixed(2)})
                              </div>
                            </div>
                          </div>

                          {/* Inspect Full User History Trigger */}
                          <button
                            onClick={() => setInspectedUser(activeUser)}
                            className="px-3 py-1.5 rounded-xl bg-sky-600 text-white font-extrabold text-xs flex items-center gap-1.5 active:scale-95 shadow-xs hover:bg-sky-700 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect Full History</span>
                          </button>
                        </div>

                        {/* Messages Stream */}
                        <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[350px]">
                          {activeThreadMsgs.length === 0 ? (
                            <div className="p-8 text-center text-xs text-sky-600">
                              No messages in this conversation yet.
                            </div>
                          ) : (
                            activeThreadMsgs.map((m) => {
                              const isAdmin = m.sender === "admin";
                              return (
                                <div
                                  key={m.id}
                                  className={`flex flex-col ${
                                    isAdmin ? "items-end" : "items-start"
                                  }`}
                                >
                                  <div className="text-[10px] text-sky-600 font-bold mb-0.5 px-1">
                                    {isAdmin ? "👑 Admin Team" : `@${activeUser.username || activeUser.user_id}`}
                                  </div>
                                  <div
                                    className={`max-w-[80%] p-3 rounded-2xl text-xs shadow-xs break-words ${
                                      isAdmin
                                        ? "btn-tactile-sky text-white rounded-tr-sm"
                                        : "bg-white text-sky-950 border border-sky-200 rounded-tl-sm"
                                    }`}
                                  >
                                    {m.message}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Admin Reply Input Bar */}
                        <form
                          onSubmit={handleAdminReply}
                          className="p-3 border-t border-sky-100 bg-white flex items-center gap-2"
                        >
                          <input
                            type="text"
                            required
                            placeholder={`Type private reply to @${activeUser.username || activeUser.user_id}...`}
                            value={adminReplyText}
                            onChange={(e) => setAdminReplyText(e.target.value)}
                            className="flex-1 px-3.5 py-2 rounded-xl bg-sky-50/70 border border-sky-200 text-xs text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-400 font-medium"
                          />
                          <button
                            type="submit"
                            className="btn-tactile-sky px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
                          >
                            <span>Send Reply</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT METHODS (UPI & WALLETS) SECTION */}
        {currentSection === "payments" && (
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-5 border border-white space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-sky-600" />
                    <span>Official Receiving UPI & Crypto Wallets Manager</span>
                  </h3>
                  <p className="text-xs text-sky-700 mt-0.5">
                    Add, edit, or delete UPI IDs and TON/Crypto wallet addresses shown to channel advertisers
                  </p>
                </div>

                {!isPaymentFormOpen && (
                  <button
                    onClick={() => {
                      setEditingPaymentId(null);
                      setPmType("UPI");
                      setPmLabel("");
                      setPmAddress("");
                      setPmActive(true);
                      setIsPaymentFormOpen(true);
                    }}
                    className="btn-tactile-sky px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Payment Method</span>
                  </button>
                )}
              </div>

              {/* Add / Edit Payment Method Form */}
              {isPaymentFormOpen && (
                <form
                  onSubmit={handleSavePaymentMethod}
                  className="p-4 rounded-2xl bg-white/80 border border-sky-200 shadow-sm space-y-3 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-sky-100">
                    <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider">
                      {editingPaymentId ? "Edit Payment Method" : "Add New Payment Method"}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsPaymentFormOpen(false)}
                      className="text-sky-600 hover:text-sky-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-sky-900 mb-1">Method Type</label>
                      <select
                        value={pmType}
                        onChange={(e) => setPmType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-sky-950 font-bold"
                      >
                        <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                        <option value="TON">TON (The Open Network Wallet)</option>
                        <option value="CRYPTO">Crypto (USDT TRC20 / Other)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-sky-900 mb-1">Label Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Primary GPay UPI, TON Official"
                        value={pmLabel}
                        onChange={(e) => setPmLabel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-sky-950 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-sky-900 mb-1">
                        UPI ID / Wallet Address
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. mudratube@paytm or EQDa4..."
                        value={pmAddress}
                        onChange={(e) => setPmAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-sky-950 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <input
                      type="checkbox"
                      id="pmActive"
                      checked={pmActive}
                      onChange={(e) => setPmActive(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-400"
                    />
                    <label htmlFor="pmActive" className="font-bold text-sky-900 cursor-pointer">
                      Mark as Active (Display to sponsors in Mini App)
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="btn-tactile-sky px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingPaymentId ? "Save Changes" : "Save & Publish Method"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPaymentFormOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Payment Methods Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className="p-4 rounded-2xl bg-white/70 border border-sky-200 flex flex-col justify-between space-y-3 relative hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                            pm.type === "UPI"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : pm.type === "TON"
                              ? "bg-sky-100 text-sky-800 border border-sky-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {pm.type}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                            pm.is_active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {pm.is_active ? "● Active" : "○ Disabled"}
                        </span>
                      </div>

                      <h5 className="font-bold text-sky-950 text-sm mt-2">{pm.label}</h5>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="text-xs font-mono font-bold text-sky-800 bg-white/90 px-2 py-1 rounded-lg border border-sky-100 truncate flex-1">
                          {pm.address_or_vpa}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(pm.address_or_vpa);
                            setCopiedId(pm.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="text-[11px] font-bold text-sky-600 hover:text-sky-900 shrink-0"
                        >
                          {copiedId === pm.id ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>

                    {/* Actions: Toggle Active, Edit, Delete */}
                    <div className="pt-3 border-t border-sky-100 flex items-center justify-between">
                      <button
                        onClick={() => handleTogglePaymentMethod(pm.id)}
                        className={`text-xs font-bold ${
                          pm.is_active ? "text-amber-700 hover:underline" : "text-emerald-700 hover:underline"
                        }`}
                      >
                        {pm.is_active ? "Disable Method" : "Activate Method"}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEditPayment(pm)}
                          className="px-2.5 py-1.5 rounded-lg bg-sky-100 text-sky-800 hover:bg-sky-200 font-bold text-xs flex items-center gap-1 active:scale-95"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeletePaymentMethod(pm.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold text-xs flex items-center gap-1 active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SPONSOR ORDERS & REVENUE SPLIT SECTION */}
        {currentSection === "approvals" && (
          <div className="space-y-6">
            {/* Split Engine Header & Controller */}
            <div className="glass-card rounded-2xl p-5 border border-white space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Sponsor Campaigns & Profit Split Controller</span>
                  </h3>
                  <p className="text-xs text-sky-700 mt-0.5">
                    Control your profit margin and review incoming channel promotion payments
                  </p>
                </div>

                <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Pending Review: {pendingApprovals.length}
                </span>
              </div>

              {/* Dynamic Revenue Split Slider */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-amber-50 border border-sky-200/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                  <span className="font-bold text-sky-950 flex items-center gap-1">
                    <Percent className="w-4 h-4 text-sky-600" />
                    <span>Revenue Split (Admin Profit vs. User Reward Pool):</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-extrabold text-xs">
                      Admin Cut: {adminProfitCut}%
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-sky-600 text-white font-extrabold text-xs">
                      Users Pool: {100 - adminProfitCut}%
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min={20}
                  max={90}
                  step={5}
                  value={adminProfitCut}
                  onChange={(e) => setAdminProfitCut(parseInt(e.target.value) || 60)}
                  className="w-full accent-sky-600 h-2 bg-sky-200 rounded-lg cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-sky-700 font-semibold">
                  <span>20% (Low Profit)</span>
                  <span>50% - 60% (Recommended Standard)</span>
                  <span>90% (Max Profit)</span>
                </div>
              </div>
            </div>

            {/* Orders List */}
            <div className="glass-card rounded-2xl p-5 border border-white space-y-4">
              <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider">
                Pending Promotion Orders ({pendingApprovals.length})
              </h4>

              {pendingApprovals.length === 0 ? (
                <div className="p-8 text-center text-xs text-sky-700 bg-white/50 rounded-xl border border-sky-100">
                  🎉 No pending campaigns. All sponsor orders have been processed!
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((req) => {
                    const adminRevenue = Math.round(req.price_inr * (adminProfitCut / 100));
                    const userPool = req.price_inr - adminRevenue;
                    const calculatedCoins = Math.max(
                      10,
                      Math.round((userPool / req.target_members) * config.coins_per_inr)
                    );

                    return (
                      <div
                        key={req.id}
                        className="p-4 rounded-2xl bg-white/80 border border-sky-200 shadow-sm space-y-3 text-xs"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-black text-sky-950 text-sm">
                                {req.channel_title || req.channel_username}
                              </h5>
                              <a
                                href={req.channel_link || `https://t.me/${req.channel_username.replace("@", "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-600 font-mono text-[11px] hover:underline"
                              >
                                {req.channel_username}
                              </a>
                            </div>
                            <p className="text-sky-700 mt-0.5">
                              Package: <strong>{req.package_title}</strong> • Target:{" "}
                              <strong>{req.target_members.toLocaleString()} Members</strong>
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-black text-sky-950">₹{req.price_inr}</span>
                            <span className="block text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mt-0.5">
                              Pending Approval
                            </span>
                          </div>
                        </div>

                        {/* Payment Verification Proof */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-sky-50/70 border border-sky-100">
                          <div>
                            <span className="text-[10px] text-sky-700 font-bold uppercase block">
                              UTR / Bank Ref Number:
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <code className="font-mono font-bold text-sky-950 text-xs bg-white px-2 py-0.5 rounded border border-sky-200">
                                {req.utr_number || "Direct Transfer"}
                              </code>
                              <button
                                onClick={() => {
                                  if (req.utr_number) {
                                    navigator.clipboard.writeText(req.utr_number);
                                    setCopiedId(req.id);
                                    setTimeout(() => setCopiedId(null), 2000);
                                  }
                                }}
                                className="text-[11px] text-sky-600 font-bold hover:underline"
                              >
                                {copiedId === req.id ? "Copied!" : "Copy UTR"}
                              </button>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-sky-700 font-bold uppercase block">
                              Sponsor Contact & Bot Status:
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-bold text-sky-900">{req.sponsor_contact}</span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                ✓ Bot Admin
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Live Revenue Split Breakdown */}
                        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex flex-wrap items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="text-[11px] font-bold text-amber-950">
                              💰 Admin Profit: <span className="text-emerald-700 font-black">₹{adminRevenue}</span> ({adminProfitCut}%) • User Pool: <span className="text-sky-700 font-black">₹{userPool}</span>
                            </div>
                            <div className="text-[10px] text-amber-900">
                              Each verified user join will receive: <strong>+{calculatedCoins} Coins</strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprovePromotion(req)}
                              className="btn-tactile-sky px-4 py-2 rounded-xl text-white font-black text-xs flex items-center gap-1.5 shadow-sm"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approve & Launch Live Task</span>
                            </button>

                            <button
                              onClick={() => handleRejectPromotion(req.id)}
                              className="px-3 py-2 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold text-xs active:scale-95"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. WITHDRAWALS SECTION */}
        {currentSection === "withdrawals" && (
          <div className="glass-card rounded-2xl p-5 border border-white space-y-4">
            <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider">
              All Withdrawal Requests
            </h3>

            {withdrawals.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-white/50 border border-dashed border-sky-200 space-y-2">
                <CreditCard className="w-8 h-8 text-sky-400 mx-auto" />
                <h4 className="text-xs font-black text-sky-950 uppercase tracking-wider">
                  No Pending Withdrawal Requests
                </h4>
                <p className="text-[11px] text-sky-600 max-w-sm mx-auto">
                  When users request coin payouts to their UPI or TON address, they will appear here in real-time for verification and 1-click approval.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 rounded-xl bg-white/70 border border-sky-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sky-950">User: @{w.username}</span>
                        <span className="text-sky-600 font-mono text-[11px]">ID: {w.user_id}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            w.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : w.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {w.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sky-900 font-medium">
                        <span className="font-bold">{w.method}:</span>
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-sky-200">
                          {w.payout_address}
                        </span>
                        <button
                          onClick={() => handleCopy(w.payout_address, w.id)}
                          className="p-1 text-sky-600 hover:text-sky-800"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-sky-700">
                        Amount: <strong>{w.coins} Coins</strong> (₹{w.amount_inr} INR) • Requested:{" "}
                        {new Date(w.requested_at).toLocaleString()}
                      </div>
                    </div>

                    {w.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolveWithdrawal(w.id, "completed")}
                          className="btn-tactile-sky px-3.5 py-1.5 rounded-xl text-white font-bold text-xs"
                        >
                          Approve (Paid)
                        </button>
                        <button
                          onClick={() => handleResolveWithdrawal(w.id, "rejected", true)}
                          className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 font-bold text-xs"
                        >
                          Reject & Refund
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. USERS & BALANCES SECTION */}
        {currentSection === "users" && (
          <div className="glass-card rounded-2xl p-5 border border-white space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider">
                User Directory & Balances
              </h3>

              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-sky-400" />
                <input
                  type="text"
                  placeholder="Search user or ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/80 border border-sky-200 text-xs text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-sky-200 text-sky-800 font-bold">
                    <th className="pb-2">User ID</th>
                    <th className="pb-2">Username</th>
                    <th className="pb-2">Coin Balance</th>
                    <th className="pb-2">Completed Tasks</th>
                    <th className="pb-2">Total Paid</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sky-600 italic">
                        No registered users yet. When users launch the Telegram Mini App, they will automatically be recorded here.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                    <tr key={u.user_id} className="hover:bg-white/40">
                      <td className="py-2.5 font-mono text-sky-700">{u.user_id}</td>
                      <td className="py-2.5 font-bold text-sky-950">@{u.username}</td>
                      <td className="py-2.5 font-black text-sky-950">
                        {u.balance} Coins (₹{(u.balance / config.coins_per_inr).toFixed(2)})
                      </td>
                      <td className="py-2.5 text-sky-700">{u.completed_tasks.length} tasks</td>
                      <td className="py-2.5 text-emerald-700 font-bold">{u.total_withdrawn} Coins</td>
                      <td className="py-2.5 text-right space-x-2">
                        <button
                          onClick={() => setSelectedUserForEdit(u)}
                          className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 font-bold hover:bg-sky-200 active:scale-95"
                        >
                          Adjust Balance
                        </button>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Balance Adjustment Dialog */}
            {selectedUserForEdit && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                <div className="w-full max-w-sm glass-elevated rounded-2xl p-5 border border-white space-y-4">
                  <h4 className="text-sm font-bold text-sky-950">
                    Adjust Balance: @{selectedUserForEdit.username}
                  </h4>
                  <p className="text-xs text-sky-700">
                    Current Balance: <strong>{selectedUserForEdit.balance} Coins</strong>
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAdjustBalance(selectedUserForEdit.user_id, coinAdjustment)}
                      className="flex-1 btn-tactile-sky py-2 rounded-xl text-white font-bold text-xs"
                    >
                      + Add {coinAdjustment} Coins
                    </button>
                    <button
                      onClick={() => handleAdjustBalance(selectedUserForEdit.user_id, -coinAdjustment)}
                      className="flex-1 py-2 rounded-xl bg-rose-100 text-rose-700 font-bold text-xs hover:bg-rose-200"
                    >
                      - Deduct {coinAdjustment} Coins
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedUserForEdit(null)}
                    className="w-full py-1.5 text-xs text-sky-600 font-bold hover:underline text-center"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. CHANNEL TASKS SECTION */}
        {currentSection === "promotions" && (
          <div className="space-y-6">
            {/* Create Task Form */}
            <form
              onSubmit={handleCreateTask}
              className="glass-card rounded-2xl p-5 border border-white space-y-4"
            >
              <div>
                <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider">
                  Add New Telegram Channel Join Task
                </h3>
                <p className="text-xs text-sky-700 mt-0.5">
                  Promote verified channels and control top placement promises
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <input
                  type="text"
                  required
                  placeholder="Channel Title (e.g. Alpha Crypto)"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white/80 border border-sky-200 text-sky-950 font-medium"
                />
                <input
                  type="text"
                  required
                  placeholder="Username (@channel_username)"
                  value={newTaskUsername}
                  onChange={(e) => setNewTaskUsername(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white/80 border border-sky-200 text-sky-950 font-mono"
                />
                <input
                  type="url"
                  required
                  placeholder="Link (https://t.me/...)"
                  value={newTaskLink}
                  onChange={(e) => setNewTaskLink(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white/80 border border-sky-200 text-sky-950"
                />
                <input
                  type="number"
                  required
                  min={10}
                  placeholder="Reward Coins (Default 50)"
                  value={newTaskReward === 0 ? "" : newTaskReward}
                  onChange={(e) =>
                    setNewTaskReward(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="px-3 py-2 rounded-xl bg-white/80 border border-sky-200 text-sky-950 font-bold"
                />
              </div>

              {/* Pin to Top Controls */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="taskIsPinned"
                    checked={newTaskIsPinned}
                    onChange={(e) => setNewTaskIsPinned(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-400"
                  />
                  <label htmlFor="taskIsPinned" className="font-bold text-amber-950 cursor-pointer flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pin to Top #1 Spot (Promised in Growth / Empire Bundle)</span>
                  </label>
                </div>

                {newTaskIsPinned && (
                  <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                    <label className="font-bold text-amber-900 shrink-0">Top Badge Text:</label>
                    <input
                      type="text"
                      placeholder="e.g. TOP #1 SPONSOR, EMPIRE VIP"
                      value={newTaskBadgeLabel}
                      onChange={(e) => setNewTaskBadgeLabel(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs text-amber-950 font-bold flex-1"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn-tactile-sky px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Channel Task to Mini App</span>
              </button>
            </form>

            {/* Active Tasks Table */}
            <div className="glass-card rounded-2xl p-5 border border-white space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-sky-950 uppercase">
                  Active Channel Tasks ({tasks.length})
                </h4>
                <span className="text-[11px] text-sky-700 font-semibold">
                  Pinned channels appear at the top in user app
                </span>
              </div>

              {tasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-sky-700 bg-white/50 rounded-xl border border-sky-100">
                  No active channels yet. Add your first sponsor channel above!
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs transition-all ${
                        t.is_pinned
                          ? "bg-amber-50/80 border-amber-300 shadow-sm"
                          : "bg-white/70 border-sky-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {t.is_pinned && (
                          <span className="flex items-center gap-1 bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                            <Crown className="w-3 h-3" />
                            <span>{t.badge_label || "TOP #1"}</span>
                          </span>
                        )}
                        <span className="font-bold text-sky-950">{t.title}</span>
                        <span className="text-sky-600 font-mono text-[11px]">{t.username}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-amber-600">+{t.reward_coins} Coins</span>
                        <span className="text-sky-700">{t.joined_count} Joins</span>

                        {/* 1-Click Pin / Unpin Toggle */}
                        <button
                          onClick={() => handleTogglePinTask(t.id)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 active:scale-95 transition-all ${
                            t.is_pinned
                              ? "bg-amber-200 text-amber-950 hover:bg-amber-300"
                              : "bg-sky-100 text-sky-800 hover:bg-sky-200"
                          }`}
                        >
                          <Star className={`w-3 h-3 ${t.is_pinned ? "fill-amber-600 text-amber-600" : ""}`} />
                          <span>{t.is_pinned ? "Unpin" : "Pin to Top"}</span>
                        </button>

                        <button
                          onClick={() => setTasks((prev) => prev.filter((x) => x.id !== t.id))}
                          className="text-rose-600 font-bold hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. AD PACKAGES SECTION */}
        {currentSection === "packages" && (
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-5 border border-white space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider">
                    Promotion Packages & Plan Bundles Manager
                  </h3>
                  <p className="text-xs text-sky-700 mt-0.5">
                    Create, edit, or remove promotional tiers shown to channel owners in the app
                  </p>
                </div>

                {!isPackageFormOpen && (
                  <button
                    onClick={() => {
                      setEditingPackageId(null);
                      setPkgTitle("");
                      setPkgMembers(1000);
                      setPkgPrice(1500);
                      setPkgBadge("");
                      setPkgPopular(false);
                      setPkgFeatures("Real Telegram Users, Fast Delivery, 24/7 Support");
                      setIsPackageFormOpen(true);
                    }}
                    className="btn-tactile-sky px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Plan Bundle</span>
                  </button>
                )}
              </div>

              {/* Add / Edit Package Form */}
              {isPackageFormOpen && (
                <form
                  onSubmit={handleSavePackage}
                  className="p-4 rounded-2xl bg-white/80 border border-sky-200 shadow-sm space-y-3 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-sky-100">
                    <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider">
                      {editingPackageId ? "Edit Plan Bundle" : "Create New Plan Bundle"}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsPackageFormOpen(false)}
                      className="text-sky-600 hover:text-sky-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-sky-900 mb-1">Bundle Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Starter Boost, Mega Growth"
                        value={pkgTitle}
                        onChange={(e) => setPkgTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-sky-950 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-sky-900 mb-1">Member Count</label>
                      <input
                        type="number"
                        required
                        min={50}
                        placeholder="1000"
                        value={pkgMembers === 0 ? "" : pkgMembers}
                        onChange={(e) =>
                          setPkgMembers(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-sky-950 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-sky-900 mb-1">Price in INR (₹)</label>
                      <input
                        type="number"
                        required
                        min={10}
                        placeholder="1500"
                        value={pkgPrice === 0 ? "" : pkgPrice}
                        onChange={(e) =>
                          setPkgPrice(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-sky-950 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-sky-900 mb-1">
                        Badge / Label (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Most Popular, Best Value, Hot"
                        value={pkgBadge}
                        onChange={(e) => setPkgBadge(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-sky-950"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-sky-900 mb-1">
                        Features List (Comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="Feature 1, Feature 2, Feature 3"
                        value={pkgFeatures}
                        onChange={(e) => setPkgFeatures(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-sky-950"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <input
                      type="checkbox"
                      id="pkgPopular"
                      checked={pkgPopular}
                      onChange={(e) => setPkgPopular(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-400"
                    />
                    <label htmlFor="pkgPopular" className="font-bold text-sky-900 cursor-pointer">
                      Highlight as "Most Popular" Plan
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="btn-tactile-sky px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingPackageId ? "Save Changes" : "Create & Publish Bundle"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPackageFormOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Packages Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="p-4 rounded-2xl bg-white/70 border border-sky-200 flex flex-col justify-between space-y-3 relative hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-bold text-sky-950 text-sm">{pkg.title}</h5>
                          <span className="text-xs font-semibold text-sky-700">
                            {pkg.members.toLocaleString()} Members
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-sky-950 text-base">₹{pkg.price_inr}</span>
                          {pkg.badge && (
                            <span className="block text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.2 rounded-full mt-0.5">
                              {pkg.badge}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-sky-100 space-y-1">
                        {pkg.features.map((feat, idx) => (
                          <div key={idx} className="text-[11px] text-sky-800 flex items-center gap-1">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions: Edit and Delete */}
                    <div className="pt-3 border-t border-sky-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleStartEditPackage(pkg)}
                        className="px-2.5 py-1.5 rounded-lg bg-sky-100 text-sky-800 hover:bg-sky-200 font-bold text-xs flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold text-xs flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. SETTINGS & ECONOMICS SECTION */}
        {currentSection === "settings" && (
          <div className="glass-card rounded-2xl p-5 border border-white space-y-4 max-w-xl">
            <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider">
              Global Platform Controls
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-sky-900 mb-1">
                  Minimum Withdrawal Threshold (Coins)
                </label>
                <input
                  type="number"
                  value={config.min_withdrawal_coins === 0 ? "" : config.min_withdrawal_coins}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      min_withdrawal_coins: e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/80 border border-sky-200 font-bold text-sky-950"
                />
              </div>

              <div>
                <label className="block font-bold text-sky-900 mb-1">
                  Coins per 1 INR (Conversion Rate)
                </label>
                <input
                  type="number"
                  value={config.coins_per_inr === 0 ? "" : config.coins_per_inr}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      coins_per_inr: e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/80 border border-sky-200 font-bold text-sky-950"
                />
              </div>

              <div>
                <label className="block font-bold text-sky-900 mb-1">
                  Default Task Reward (Coins)
                </label>
                <input
                  type="number"
                  value={config.default_task_reward === 0 ? "" : config.default_task_reward}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      default_task_reward: e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/80 border border-sky-200 font-bold text-sky-950"
                />
              </div>

              <div>
                <label className="block font-bold text-sky-900 mb-1">
                  Minimum Rate Per Member Floor (₹ INR per custom member)
                </label>
                <input
                  type="number"
                  step={0.1}
                  min={0.1}
                  value={config.min_rate_per_member_inr === 0 ? "" : config.min_rate_per_member_inr}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      min_rate_per_member_inr: e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/80 border border-sky-200 font-bold text-sky-950"
                />
                <span className="text-[10px] text-sky-600 block mt-0.5">
                  Sponsors asking for custom member counts cannot pay less than this rate per user.
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-sky-900">
                    Default Admin Revenue Cut (% from Sponsor Packages)
                  </label>
                  <span className="font-black text-sky-950 bg-sky-100 px-2 py-0.5 rounded-md">
                    {config.admin_profit_cut_percent}% Admin / {100 - config.admin_profit_cut_percent}% Users Pool
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={5}
                  value={config.admin_profit_cut_percent}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 60;
                    setConfig({ ...config, admin_profit_cut_percent: val });
                    setAdminProfitCut(val);
                  }}
                  className="w-full accent-sky-600 h-2 bg-sky-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-sky-900 mb-1">
                  Official Admin Receiving UPI ID (Shown to Sponsors)
                </label>
                <input
                  type="text"
                  value={config.admin_upi_id}
                  onChange={(e) => setConfig({ ...config, admin_upi_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/80 border border-sky-200 font-mono font-bold text-sky-950"
                  placeholder="e.g. yourname@paytm"
                />
              </div>

              <div>
                <label className="block font-bold text-sky-900 mb-1">
                  Admin Telegram Handle for Screenshot DMs
                </label>
                <input
                  type="text"
                  value={config.admin_telegram_handle}
                  onChange={(e) => setConfig({ ...config, admin_telegram_handle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/80 border border-sky-200 font-mono font-bold text-sky-950"
                  placeholder="e.g. @MudraAdmin"
                />
              </div>

              <div>
                <label className="block font-bold text-sky-900 mb-1">
                  Official Verification Bot Username
                </label>
                <input
                  type="text"
                  value={config.bot_username}
                  onChange={(e) => setConfig({ ...config, bot_username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/80 border border-sky-200 font-mono font-bold text-sky-950"
                  placeholder="e.g. @MudraTube_bot"
                />
              </div>

              <div className="pt-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.channel_tasks_enabled}
                    onChange={(e) =>
                      setConfig({ ...config, channel_tasks_enabled: e.target.checked })
                    }
                    className="rounded text-sky-600"
                  />
                  <span className="font-bold text-sky-900">Enable Channel Join Tasks</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.offerwalls_enabled}
                    onChange={(e) =>
                      setConfig({ ...config, offerwalls_enabled: e.target.checked })
                    }
                    className="rounded text-sky-600"
                  />
                  <span className="font-bold text-sky-900">Enable CPA Offerwalls</span>
                </label>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                ✓ Changes take effect immediately across all connected Telegram WebApp clients.
              </div>
            </div>
          </div>
        )}

        {/* 10. SECURITY & ANTI-HACK SENTINEL */}
        {currentSection === "security" && (
          <div className="space-y-6">
            {/* Top Header Card */}
            <div className="glass-elevated p-6 rounded-squircle border border-white/90 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-sky-950 flex items-center gap-2">
                      <span>Security & Anti-Abuse Sentinel</span>
                      <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Shield Active
                      </span>
                    </h2>
                    <p className="text-xs text-sky-700 font-medium">
                      Live protection against rate limit abuse, data tampering, brute force logins, and fake requests
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      adminFetch("/api/sync")
                        .then((res) => res.json())
                        .then((d) => {
                          if (d.securityLogs) setSecurityLogs(d.securityLogs);
                        });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-pill text-xs font-bold text-sky-800 hover:bg-white active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Log</span>
                  </button>
                </div>
              </div>

              {/* Security Shield Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <div className="glass-card p-3 rounded-2xl border border-sky-100">
                  <div className="text-[10px] font-bold text-sky-700 uppercase">Rate Limiter</div>
                  <div className="text-sm font-black text-sky-950 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Sliding Window</span>
                  </div>
                  <div className="text-[10px] text-sky-600 font-medium mt-0.5">IP & User Quotas</div>
                </div>

                <div className="glass-card p-3 rounded-2xl border border-sky-100">
                  <div className="text-[10px] font-bold text-sky-700 uppercase">Auth Tokens</div>
                  <div className="text-sm font-black text-sky-950 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>HMAC-SHA256</span>
                  </div>
                  <div className="text-[10px] text-sky-600 font-medium mt-0.5">12h Signed Sessions</div>
                </div>

                <div className="glass-card p-3 rounded-2xl border border-sky-100">
                  <div className="text-[10px] font-bold text-sky-700 uppercase">Anti-Tampering</div>
                  <div className="text-sm font-black text-sky-950 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Server Calculations</span>
                  </div>
                  <div className="text-[10px] text-sky-600 font-medium mt-0.5">Client Coins Ignored</div>
                </div>

                <div className="glass-card p-3 rounded-2xl border border-sky-100">
                  <div className="text-[10px] font-bold text-sky-700 uppercase">Anti-Double Spend</div>
                  <div className="text-sm font-black text-sky-950 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>15s Cooldown</span>
                  </div>
                  <div className="text-[10px] text-sky-600 font-medium mt-0.5">Atomic Balance Lock</div>
                </div>
              </div>
            </div>

            {/* Real-time Security Incident Audit Log */}
            <div className="glass-elevated p-6 rounded-squircle border border-white/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-sky-950 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Real-Time Security Incident Audit Log</span>
                  </h3>
                  <p className="text-xs text-sky-700 font-medium">
                    Auto-intercepted malicious attempts, rate limit locks, and tampering requests
                  </p>
                </div>
                <span className="text-xs font-black text-sky-900 bg-sky-100/80 px-2.5 py-1 rounded-full border border-sky-200">
                  {securityLogs.length} Events Logged
                </span>
              </div>

              {securityLogs.length === 0 ? (
                <div className="p-8 text-center glass-card rounded-2xl border border-dashed border-emerald-300 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-emerald-900">Zero Security Threats Detected</div>
                  <div className="text-xs text-sky-700 max-w-sm mx-auto">
                    All incoming traffic and Mini App calls are clean and conforming to strict validation policies.
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-sky-100 text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Incident Type</th>
                        <th className="py-2.5 px-3">Client IP</th>
                        <th className="py-2.5 px-3">User ID</th>
                        <th className="py-2.5 px-3">Audit Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-100/70">
                      {securityLogs.map((log) => {
                        const typeColors: Record<string, string> = {
                          FAILED_LOGIN: "bg-rose-100 text-rose-800 border-rose-200",
                          TAMPERING_ATTEMPT: "bg-purple-100 text-purple-800 border-purple-200",
                          SUSPICIOUS_PAYLOAD: "bg-orange-100 text-orange-800 border-orange-200",
                          RATE_LIMIT: "bg-amber-100 text-amber-800 border-amber-200",
                          UNAUTHORIZED_ADMIN: "bg-rose-200 text-rose-950 border-rose-300",
                        };

                        return (
                          <tr key={log.id} className="hover:bg-white/60 transition-colors">
                            <td className="py-2.5 px-3 text-sky-700 font-mono text-[11px] whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                                  typeColors[log.type] || "bg-slate-100 text-slate-800"
                                }`}
                              >
                                {log.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-sky-900 font-bold whitespace-nowrap">
                              {log.ip}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-sky-800 whitespace-nowrap">
                              {log.userId ? log.userId : "—"}
                            </td>
                            <td className="py-2.5 px-3 text-sky-900 font-medium">
                              {log.details}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* User Access & Instant Ban Desk */}
            <div className="glass-elevated p-6 rounded-squircle border border-white/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-sky-950 flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-600" />
                    <span>Instant User Suspension Desk</span>
                  </h3>
                  <p className="text-xs text-sky-700 font-medium">
                    Immediately block or unblock malicious users or abusers from claiming coins or withdrawing
                  </p>
                </div>
                <div className="text-xs font-black text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  {usersList.filter((u) => u.is_banned).length} Suspended Users
                </div>
              </div>

              <div className="space-y-2">
                {usersList.length === 0 ? (
                  <div className="p-4 text-center text-xs text-sky-600 font-medium">
                    No users registered yet.
                  </div>
                ) : (
                  usersList.map((u) => (
                    <div
                      key={u.user_id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        u.is_banned
                          ? "bg-rose-50/70 border-rose-200"
                          : "glass-card border-sky-100 hover:bg-white/80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            u.is_banned
                              ? "bg-rose-200 text-rose-800"
                              : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {u.first_name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                            <span>{u.first_name}</span>
                            <span className="font-mono text-sky-600 text-[11px]">(@{u.username})</span>
                            {u.is_banned && (
                              <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                                BANNED
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-sky-700">
                            ID: {u.user_id} • Balance: {u.balance} Coins
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleBan(u.user_id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                          u.is_banned
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                            : "bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                        }`}
                      >
                        {u.is_banned ? "Unban Account" : "Suspend & Ban"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* USER HISTORY INSPECTOR MODAL */}
      {inspectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-sky-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[85vh] glass-elevated rounded-squircle border border-white/90 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/80 glass-elevated flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white font-black text-sm flex items-center justify-center border border-white">
                  {inspectedUser.first_name ? inspectedUser.first_name[0].toUpperCase() : "U"}
                </div>
                <div>
                  <h3 className="text-sm font-black text-sky-950">
                    User Account Inspector: {inspectedUser.first_name || inspectedUser.username}
                  </h3>
                  <p className="text-[11px] text-sky-700 font-mono">
                    Telegram ID: #{inspectedUser.user_id} • Joined: {new Date(inspectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectedUser(null)}
                className="w-8 h-8 rounded-xl bg-white/70 hover:bg-white text-sky-800 flex items-center justify-center active:scale-95 transition-all border border-sky-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inspector Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Balance Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
                  <span className="text-[11px] font-bold text-sky-700 block">Current Balance</span>
                  <span className="text-base font-black text-sky-950">
                    {inspectedUser.balance.toLocaleString()} Coins
                  </span>
                  <span className="text-[10px] text-sky-600 block">
                    ≈ ₹{(inspectedUser.balance / config.coins_per_inr).toFixed(2)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-700 block">Lifetime Earned</span>
                  <span className="text-base font-black text-emerald-950">
                    {inspectedUser.total_earned.toLocaleString()} Coins
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="text-[11px] font-bold text-purple-700 block">Total Withdrawn</span>
                  <span className="text-base font-black text-purple-950">
                    {inspectedUser.total_withdrawn.toLocaleString()} Coins
                  </span>
                </div>
              </div>

              {/* User Withdrawal Requests History */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-sky-950 uppercase tracking-wider text-[11px]">
                  Withdrawal Requests History ({withdrawals.filter((w) => w.user_id === inspectedUser.user_id).length})
                </h4>

                {withdrawals.filter((w) => w.user_id === inspectedUser.user_id).length === 0 ? (
                  <p className="text-sky-600 text-[11px] italic">No withdrawal requests from this user yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {withdrawals
                      .filter((w) => w.user_id === inspectedUser.user_id)
                      .map((w) => (
                        <div
                          key={w.id}
                          className="p-3 rounded-xl bg-white/70 border border-sky-100 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-sky-950">₹{w.amount_inr}</span>
                            <span className="text-sky-700 ml-2 font-mono">({w.coins} Coins)</span>
                            <span className="text-[10px] text-sky-600 block">{w.method}: {w.payout_address}</span>
                          </div>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                              w.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : w.status === "rejected"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {w.status}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* User Promotion Orders / Deposit History */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-sky-950 uppercase tracking-wider text-[11px]">
                  Promotion Campaigns Ordered ({promotionRequests.filter((p) => p.user_id === inspectedUser.user_id).length})
                </h4>

                {promotionRequests.filter((p) => p.user_id === inspectedUser.user_id).length === 0 ? (
                  <p className="text-sky-600 text-[11px] italic">No channel promotion campaigns ordered by this user.</p>
                ) : (
                  <div className="space-y-1.5">
                    {promotionRequests
                      .filter((p) => p.user_id === inspectedUser.user_id)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-xl bg-white/70 border border-sky-100 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-sky-950">{p.channel_title || p.channel_username}</span>
                            <span className="text-sky-700 ml-2">₹{p.price_inr} ({p.target_members} Members)</span>
                            <span className="text-[10px] text-sky-600 block font-mono">UTR: {p.utr_number || "Direct"}</span>
                          </div>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                              p.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : p.status === "rejected"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
