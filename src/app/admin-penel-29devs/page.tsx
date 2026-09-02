"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { ChannelTask, GlobalConfig, PromoPackage, UserProfile, WithdrawalRequest } from "@/types";
import { initialConfig, initialMockUser, initialPackages, initialTasks, initialWithdrawals } from "@/lib/mockData";

export default function AdminPortalPage() {
  // Authentication Gate State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Navigation Sub-tab
  const [currentSection, setCurrentSection] = useState<
    "overview" | "users" | "withdrawals" | "promotions" | "settings" | "packages"
  >("overview");

  // State Stores
  const [config, setConfig] = useState<GlobalConfig>(initialConfig);
  const [tasks, setTasks] = useState<ChannelTask[]>(initialTasks);
  const [packages, setPackages] = useState<PromoPackage[]>(initialPackages);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(initialWithdrawals);
  const [usersList, setUsersList] = useState<UserProfile[]>([
    initialMockUser,
    {
      user_id: "88291024",
      username: "rahul_verma",
      first_name: "Rahul",
      balance: 450,
      total_earned: 1350,
      total_withdrawn: 900,
      completed_tasks: ["task_mudra_main", "task_crypto_hub"],
      referrals_count: 5,
      is_banned: false,
      created_at: "2026-08-20T10:00:00Z",
    },
    {
      user_id: "77491204",
      username: "crypto_sam",
      first_name: "Sam",
      balance: 1500,
      total_earned: 2500,
      total_withdrawn: 0,
      completed_tasks: ["task_mudra_main"],
      referrals_count: 12,
      is_banned: false,
      created_at: "2026-08-28T16:20:00Z",
    },
  ]);

  // UI helpers
  const [userSearch, setUserSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [coinAdjustment, setCoinAdjustment] = useState<number>(100);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskUsername, setNewTaskUsername] = useState("");
  const [newTaskLink, setNewTaskLink] = useState("");
  const [newTaskReward, setNewTaskReward] = useState(50);
  const [newTaskIsPinned, setNewTaskIsPinned] = useState(false);
  const [newTaskBadgeLabel, setNewTaskBadgeLabel] = useState("TOP #1 SPONSOR");
  // Package form & edit state
  const [isPackageFormOpen, setIsPackageFormOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [pkgTitle, setPkgTitle] = useState("");
  const [pkgMembers, setPkgMembers] = useState(1000);
  const [pkgPrice, setPkgPrice] = useState(1500);
  const [pkgBadge, setPkgBadge] = useState("");
  const [pkgPopular, setPkgPopular] = useState(false);
  const [pkgFeatures, setPkgFeatures] = useState("Real Telegram Users, Fast Delivery, 24/7 Support");

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
      if (data.success) {
        setIsAuthenticated(true);
        setAuthError("");
        return;
      }
    } catch {
      setAuthError("Server connection error during authentication.");
      return;
    }

    setAuthError("Galat Username ya Password! Kripya sahi credentials dalein.");
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
      reward_coins: newTaskReward,
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
                members: pkgMembers,
                price_inr: pkgPrice,
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
        members: pkgMembers,
        price_inr: pkgPrice,
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
          onClick={() => setIsAuthenticated(false)}
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

        {/* 2. WITHDRAWALS SECTION */}
        {currentSection === "withdrawals" && (
          <div className="glass-card rounded-2xl p-5 border border-white space-y-4">
            <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider">
              All Withdrawal Requests
            </h3>

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
                  {filteredUsers.map((u) => (
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
                  ))}
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
                  value={newTaskReward}
                  onChange={(e) => setNewTaskReward(parseInt(e.target.value) || 50)}
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
                        value={pkgMembers}
                        onChange={(e) => setPkgMembers(parseInt(e.target.value) || 0)}
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
                        value={pkgPrice}
                        onChange={(e) => setPkgPrice(parseInt(e.target.value) || 0)}
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
                  value={config.min_withdrawal_coins}
                  onChange={(e) =>
                    setConfig({ ...config, min_withdrawal_coins: parseInt(e.target.value) || 0 })
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
                  value={config.coins_per_inr}
                  onChange={(e) =>
                    setConfig({ ...config, coins_per_inr: parseInt(e.target.value) || 1 })
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
                  value={config.default_task_reward}
                  onChange={(e) =>
                    setConfig({ ...config, default_task_reward: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/80 border border-sky-200 font-bold text-sky-950"
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
      </div>
    </div>
  );
}
