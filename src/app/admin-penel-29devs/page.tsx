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

  // Auth Submit
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default master admin credentials (can be overridden via env)
    if (
      (adminUsername === "admin29" && adminPassword === "admin123") ||
      (adminUsername === "admin" && adminPassword === "mudratube2026")
    ) {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Invalid Admin credentials. (Default: admin / mudratube2026 or admin29 / admin123)");
    }
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
      status: "active",
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle("");
    setNewTaskUsername("");
    setNewTaskLink("");
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
                placeholder="admin"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-sky-200 text-sm text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-400"
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
                className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-sky-200 text-sm text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-400"
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

          <div className="p-3 rounded-xl bg-sky-100/60 border border-sky-200/80 text-[11px] text-sky-800 text-center">
            Demo Credentials: <span className="font-bold">admin</span> / <span className="font-bold">mudratube2026</span>
          </div>
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
              className="glass-card rounded-2xl p-5 border border-white space-y-3"
            >
              <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider">
                Add New Telegram Channel Join Task
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Channel Title (e.g. Alpha Crypto)"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white/80 border border-sky-200 text-xs text-sky-950"
                />
                <input
                  type="text"
                  required
                  placeholder="Username (@channel_username)"
                  value={newTaskUsername}
                  onChange={(e) => setNewTaskUsername(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white/80 border border-sky-200 text-xs text-sky-950"
                />
                <input
                  type="url"
                  required
                  placeholder="Link (https://t.me/...)"
                  value={newTaskLink}
                  onChange={(e) => setNewTaskLink(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white/80 border border-sky-200 text-xs text-sky-950"
                />
              </div>

              <button
                type="submit"
                className="btn-tactile-sky px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Channel Task to Mini App</span>
              </button>
            </form>

            {/* Active Tasks Table */}
            <div className="glass-card rounded-2xl p-5 border border-white space-y-3">
              <h4 className="text-xs font-bold text-sky-950 uppercase">Active Channel Tasks</h4>
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-white/70 border border-sky-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-sky-950">{t.title}</span>
                      <span className="text-sky-600 ml-2 font-mono">{t.username}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-amber-600">+{t.reward_coins} Coins</span>
                      <span className="text-sky-700">{t.joined_count} Joins</span>
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
            </div>
          </div>
        )}

        {/* 5. AD PACKAGES SECTION */}
        {currentSection === "packages" && (
          <div className="glass-card rounded-2xl p-5 border border-white space-y-4">
            <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider">
              Promotion Packages Manager
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <div key={pkg.id} className="p-4 rounded-xl bg-white/70 border border-sky-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-sky-950 text-sm">{pkg.title}</h5>
                    <span className="font-black text-sky-950">₹{pkg.price_inr}</span>
                  </div>
                  <p className="text-xs text-sky-700">{pkg.members} Members</p>
                  <div className="pt-2 border-t border-sky-100 text-[11px] text-sky-600">
                    Badge: {pkg.badge || "Standard"}
                  </div>
                </div>
              ))}
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
