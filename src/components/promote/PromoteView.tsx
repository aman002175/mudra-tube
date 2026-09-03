"use client";

import React, { useState } from "react";
import {
  Megaphone,
  Check,
  Sparkles,
  Send,
  ShieldCheck,
  ArrowRight,
  Copy,
  CheckCircle,
  ExternalLink,
  Camera,
  AlertTriangle,
  Layers,
  Sliders,
  TrendingUp,
  Users,
  RefreshCw,
  Clock,
  Radio,
} from "lucide-react";
import { PromoPackage, GlobalConfig, UserProfile, PromotionRequest, ChannelTask } from "@/types";

interface PromoteViewProps {
  packages: PromoPackage[];
  user: UserProfile;
  config: GlobalConfig;
  promotions?: PromotionRequest[];
  tasks?: ChannelTask[];
  onRefresh?: () => Promise<void>;
  isSyncing?: boolean;
  onSubmitPromotion: (data: {
    channel: string;
    members: number;
    price_inr: number;
    utr_number: string;
    contact: string;
    packageId?: string;
  }) => Promise<boolean>;
}

export const PromoteView: React.FC<PromoteViewProps> = ({
  packages,
  user,
  config,
  promotions = [],
  tasks = [],
  onRefresh,
  isSyncing = false,
  onSubmitPromotion,
}) => {
  // Top view tab: "order" (new promotion) vs "campaigns" (my active/past campaigns)
  const [activeView, setActiveView] = useState<"order" | "campaigns">("order");
  const [campaignFilter, setCampaignFilter] = useState<"all" | "live" | "pending" | "completed">("all");
  // Plan Mode: "bundle" or "custom"
  const [planMode, setPlanMode] = useState<"bundle" | "custom">("bundle");
  const [selectedPkgId, setSelectedPkgId] = useState<string>(packages[0]?.id || "");
  const [customMembers, setCustomMembers] = useState<number | string>(500);

  // Form inputs
  const [channelInput, setChannelInput] = useState("");
  const [contactInput, setContactInput] = useState(user.username ? `@${user.username}` : "");
  const [utrInput, setUtrInput] = useState("");
  const [botAdminConfirmed, setBotAdminConfirmed] = useState(false);
  const [isVerifyingBotAdmin, setIsVerifyingBotAdmin] = useState(false);
  const [botAdminVerified, setBotAdminVerified] = useState(false);
  const [botAdminError, setBotAdminError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Minimum rate per member set by admin (e.g. ₹2.00 or ₹1.50)
  const minRatePerMember = config.min_rate_per_member_inr || 2.0;

  // Calculate members & price based on mode
  const selectedPkg = packages.find((p) => p.id === selectedPkgId) || packages[0];
  
  const parsedCustomMembers = Math.max(50, Number(customMembers) || 0);
  const calculatedCustomPrice = Math.max(100, Math.round(parsedCustomMembers * minRatePerMember));

  const effectiveMembers = planMode === "bundle" ? (selectedPkg?.members || 500) : parsedCustomMembers;
  const effectivePrice = planMode === "bundle" ? (selectedPkg?.price_inr || 1000) : calculatedCustomPrice;
  const effectiveTitle = planMode === "bundle" ? (selectedPkg?.title || "Standard Bundle") : `Custom Plan (${effectiveMembers} Members)`;

  const adminUpi = config.admin_upi_id || "admin@paytm";
  const adminTgHandle = (config.admin_telegram_handle || "@admin_mudratube").replace("@", "");
  const botHandle = config.bot_username || "@MudraTube_bot";

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(adminUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleDmAdminScreenshot = () => {
    const text = encodeURIComponent(
      `Hello Admin! I have paid ₹${effectivePrice} for Channel Promotion.\n\nChannel: ${channelInput || "N/A"}\nPlan: ${effectiveTitle}\nMembers: ${effectiveMembers}\nUser ID: ${user.user_id}\nUTR: ${utrInput || "Sending screenshot..."}`
    );
    window.open(`https://t.me/${adminTgHandle}?text=${text}`, "_blank");
  };

  const handleVerifyBotAdmin = async () => {
    if (!channelInput.trim()) {
      setBotAdminError("Kripya pehle apne channel ka @username ya link dalein.");
      return;
    }

    setIsVerifyingBotAdmin(true);
    setBotAdminError(null);

    try {
      const res = await fetch("/api/tasks/verify-bot-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: channelInput.trim() }),
      });
      const data = await res.json();
      if (data.success && data.isAdmin) {
        setBotAdminVerified(true);
        setBotAdminConfirmed(true);
        setBotAdminError(null);
      } else {
        setBotAdminVerified(false);
        setBotAdminConfirmed(false);
        setBotAdminError(data.error || `Bot ${botHandle} abhi channel me admin nahi hai. Kripya use admin banayein.`);
      }
    } catch {
      setBotAdminError("Telegram API connection error. Kripya check karein ki bot admin bana diya gaya hai.");
    } finally {
      setIsVerifyingBotAdmin(false);
    }
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelInput.trim() || !contactInput.trim() || !utrInput.trim()) return;

    setIsSubmitting(true);
    const ok = await onSubmitPromotion({
      channel: channelInput.trim(),
      members: effectiveMembers,
      price_inr: effectivePrice,
      utr_number: utrInput.trim(),
      contact: contactInput.trim(),
      packageId: planMode === "bundle" ? selectedPkg?.id : "custom_plan",
    });
    setIsSubmitting(false);

    if (ok) {
      setSuccess(true);
      setChannelInput("");
      setUtrInput("");
      setBotAdminConfirmed(false);
      if (onRefresh) onRefresh();
      setActiveView("campaigns");
      setTimeout(() => setSuccess(false), 5000);
    }
  };

  // Promoter Lifetime Stats
  const userPromos = promotions || [];
  const totalSpent = userPromos.reduce((sum, p) => sum + (Number(p.price_inr) || 0), 0);
  const totalCampaigns = userPromos.length;
  const totalSubsDelivered = userPromos.reduce((sum, p) => {
    return sum + (Number(p.joined_count) || (p.status === "completed" ? p.target_members : 0));
  }, 0);
  const liveCount = userPromos.filter(
    (p) => p.live_status === "live" || (p.status === "approved" && p.live_status !== "completed")
  ).length;
  const pendingCount = userPromos.filter((p) => p.status === "pending").length;
  const completedCount = userPromos.filter(
    (p) => p.status === "completed" || p.live_status === "completed"
  ).length;

  const filteredPromos = userPromos.filter((p) => {
    if (campaignFilter === "live") return p.live_status === "live" || (p.status === "approved" && p.live_status !== "completed");
    if (campaignFilter === "pending") return p.status === "pending";
    if (campaignFilter === "completed") return p.status === "completed" || p.live_status === "completed";
    return true;
  });

  return (
    <div className="space-y-4 px-1 pb-6 animate-in fade-in duration-200">
      {/* View Switcher: New Order vs My Campaigns */}
      <div className="p-1 rounded-2xl glass-card border border-white/90 flex gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveView("order")}
          className={`flex-1 py-2 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
            activeView === "order"
              ? "btn-tactile-sky text-white shadow-sm"
              : "text-sky-800 hover:bg-white/60"
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Launch Promotion</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView("campaigns")}
          className={`flex-1 py-2 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
            activeView === "campaigns"
              ? "btn-tactile-sky text-white shadow-sm"
              : "text-sky-800 hover:bg-white/60"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>My Campaigns ({userPromos.length})</span>
          {liveCount > 0 && (
            <span className="flex h-2 w-2 relative ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: MY CAMPAIGNS & PROMOTER HISTORY */}
      {activeView === "campaigns" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Promoter Lifetime Performance Dashboard */}
          <div className="rounded-2xl glass-card p-4 border border-white space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                  Promoter Channel Performance
                </span>
                <h4 className="text-sm font-black text-sky-950">Growth & Investment Tracker</h4>
              </div>

              {onRefresh && (
                <button
                  type="button"
                  onClick={() => onRefresh()}
                  disabled={isSyncing}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-90 ${
                    isSyncing
                      ? "bg-sky-200 text-sky-900 sync-threat-pulse"
                      : "bg-sky-100 text-sky-800 hover:bg-sky-200"
                  }`}
                  title="Live Database Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "sync-threat-spin" : ""}`} />
                  <span>{isSyncing ? "Syncing..." : "Live Sync"}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-3 rounded-xl bg-white/75 border border-sky-100 shadow-xs">
                <span className="block text-[10px] font-bold text-sky-700">Total Spent</span>
                <span className="text-sm font-black text-sky-950 block mt-0.5">
                  ₹{totalSpent.toLocaleString()}
                </span>
                <span className="text-[9px] text-sky-600">INR Paid</span>
              </div>

              <div className="p-3 rounded-xl bg-white/75 border border-sky-100 shadow-xs">
                <span className="block text-[10px] font-bold text-sky-700">Channels</span>
                <span className="text-sm font-black text-sky-950 block mt-0.5">
                  {totalCampaigns}
                </span>
                <span className="text-[9px] text-sky-600">Promoted</span>
              </div>

              <div className="p-3 rounded-xl bg-white/75 border border-emerald-100 shadow-xs">
                <span className="block text-[10px] font-bold text-emerald-700">Subscribers</span>
                <span className="text-sm font-black text-emerald-700 block mt-0.5">
                  +{totalSubsDelivered.toLocaleString()}
                </span>
                <span className="text-[9px] text-emerald-600">Gained</span>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setCampaignFilter("all")}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                campaignFilter === "all"
                  ? "bg-sky-500 text-white shadow-xs"
                  : "bg-white/70 text-sky-800 hover:bg-white"
              }`}
            >
              All ({userPromos.length})
            </button>
            <button
              onClick={() => setCampaignFilter("live")}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                campaignFilter === "live"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white/70 text-sky-800 hover:bg-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live in Tasks ({liveCount})</span>
            </button>
            <button
              onClick={() => setCampaignFilter("pending")}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                campaignFilter === "pending"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-white/70 text-sky-800 hover:bg-white"
              }`}
            >
              Pending Approval ({pendingCount})
            </button>
            <button
              onClick={() => setCampaignFilter("completed")}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                campaignFilter === "completed"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-white/70 text-sky-800 hover:bg-white"
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* Campaigns List */}
          {filteredPromos.length === 0 ? (
            <div className="rounded-2xl glass-card p-6 border border-white text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 mx-auto">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-extrabold text-sky-950 text-sm">No promotions in this category</h5>
                <p className="text-xs text-sky-700 mt-1 max-w-xs mx-auto">
                  {campaignFilter === "all"
                    ? "You have not promoted any Telegram channels yet. Launch your first campaign now to gain genuine members!"
                    : "No channel campaigns currently match this status filter."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveView("order")}
                className="btn-tactile-sky px-4 py-2 rounded-xl text-white font-extrabold text-xs"
              >
                Promote a Channel Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPromos.map((promo) => {
                const joined = promo.joined_count || (promo.status === "completed" ? promo.target_members : 0);
                const target = promo.target_members || 1;
                const percent = Math.min(100, Math.round((joined / target) * 100));
                const isLive = promo.live_status === "live" || (promo.status === "approved" && promo.live_status !== "completed");
                const isCompleted = promo.status === "completed" || promo.live_status === "completed";
                const isRejected = promo.status === "rejected";

                return (
                  <div
                    key={promo.id}
                    className="p-4 rounded-2xl glass-card border border-white shadow-sm space-y-3 text-xs"
                  >
                    {/* Header with Channel Name & Status Badge */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-black text-sky-950 text-sm truncate">
                            {promo.channel_title || promo.channel_username}
                          </h5>
                          <a
                            href={promo.channel_link || `https://t.me/${promo.channel_username.replace("@", "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-sky-600 hover:text-sky-900 shrink-0"
                            title="Open in Telegram"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <p className="text-sky-700 font-mono text-[11px] mt-0.5">
                          {promo.channel_username}
                        </p>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {isLive && (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                            <span>LIVE IN TASKS</span>
                          </span>
                        )}
                        {!isLive && !isCompleted && !isRejected && (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>AWAITING APPROVAL</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                            <CheckCircle className="w-3 h-3" />
                            <span>GOAL DELIVERED</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>ORDER REJECTED</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Subscriber Delivery Progress Meter */}
                    <div className="space-y-1.5 bg-white/70 p-3 rounded-xl border border-sky-100">
                      <div className="flex justify-between items-center text-[11px] font-bold">
                        <span className="text-sky-900">
                          {isLive
                            ? "Active Subscribers Gained:"
                            : isCompleted
                            ? "All Members Delivered:"
                            : isRejected
                            ? "Status:"
                            : "Target Members Promised:"}
                        </span>
                        <span className="font-mono text-sky-950 font-black">
                          {joined.toLocaleString()} / {target.toLocaleString()} ({percent}%)
                        </span>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-sky-100 overflow-hidden relative">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            isLive
                              ? "bg-gradient-to-r from-emerald-400 to-sky-500"
                              : isCompleted
                              ? "bg-gradient-to-r from-purple-500 to-emerald-500"
                              : isRejected
                              ? "bg-rose-400"
                              : "bg-amber-400"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <p className="text-[10px] text-sky-700">
                        {isLive && "🚀 Users are completing tasks and joining your channel right now!"}
                        {!isLive && !isCompleted && !isRejected && "⏳ Admin is verifying your payment UTR. Once approved, it immediately appears in task list."}
                        {isCompleted && "🎉 Campaign completed! All promised members have been successfully delivered."}
                        {isRejected && `Reason: ${promo.rejection_reason || "Payment or Bot verification failed."}`}
                      </p>
                    </div>

                    {/* Campaign Financials Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 text-[11px]">
                      <div className="p-2 rounded-lg bg-white/50 border border-sky-100">
                        <span className="text-[10px] text-sky-600 block">Total Paid</span>
                        <span className="font-extrabold text-sky-950">₹{promo.price_inr} INR</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/50 border border-sky-100">
                        <span className="text-[10px] text-sky-600 block">Rate / Member</span>
                        <span className="font-extrabold text-sky-950">
                          ₹{(promo.price_inr / target).toFixed(2)}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/50 border border-sky-100">
                        <span className="text-[10px] text-sky-600 block">Plan</span>
                        <span className="font-bold text-sky-900 truncate block">
                          {promo.package_title}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/50 border border-sky-100">
                        <span className="text-[10px] text-sky-600 block">UTR Number</span>
                        <span className="font-mono font-bold text-sky-950 truncate block">
                          {promo.utr_number}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: NEW CHANNEL PROMOTION FORM */}
      {activeView === "order" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Intro Header */}
          <div className="rounded-squircle glass-card p-5 border border-white/85 shadow-glass">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
                <Megaphone className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider">
                Promote Your Telegram Channel
              </h3>
            </div>
            <p className="text-xs text-sky-800/80 leading-relaxed mt-1">
              Acquire verified, real Telegram members. Rewards are dynamically split and credited as users complete verified joins!
            </p>
          </div>

          {/* Plan Mode Switcher */}
          <div className="p-1 rounded-2xl glass-card border border-white/80 flex gap-1 shadow-sm">
            <button
              type="button"
              onClick={() => setPlanMode("bundle")}
              className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                planMode === "bundle"
                  ? "btn-tactile-sky text-white shadow-sm"
                  : "text-sky-800 hover:bg-white/60"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Pre-Made Bundles</span>
            </button>

            <button
              type="button"
              onClick={() => setPlanMode("custom")}
              className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                planMode === "custom"
                  ? "btn-tactile-sky text-white shadow-sm"
                  : "text-sky-800 hover:bg-white/60"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Custom Member Goal</span>
            </button>
          </div>

          {/* Step 1: Package Selection or Custom Configuration */}
      <div className="space-y-3">
        {planMode === "bundle" ? (
          <>
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-extrabold text-sky-950 uppercase tracking-wider">
                1. Select Package Bundle
              </h4>
              <span className="text-[11px] text-sky-700 font-semibold">
                Tap card to select
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {packages.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;

                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`rounded-2xl p-4 glass-card cursor-pointer transition-all duration-200 border relative ${
                      isSelected
                        ? "border-sky-500 ring-2 ring-sky-400/50 bg-sky-50 shadow-md"
                        : "border-white/80 hover:border-sky-300 bg-white/60"
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                        {pkg.badge || "RECOMMENDED"}
                      </span>
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Radio indicator */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                            isSelected
                              ? "border-sky-600 bg-sky-600 text-white"
                              : "border-sky-300 bg-white"
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>

                        <div>
                          <h5 className="text-sm font-bold text-sky-950">
                            {pkg.title}
                          </h5>
                          <div className="text-xs font-semibold text-sky-700">
                            {pkg.members.toLocaleString()} Real Active Members
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black text-sky-950">
                          ₹{pkg.price_inr.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-sky-600 font-bold block">
                          Fixed Package
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-sky-200/50 flex flex-wrap gap-2 text-[11px] text-sky-800">
                      {pkg.features.map((feat, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Custom Plan Builder */
          <div className="rounded-2xl p-4 glass-card border border-sky-300 bg-sky-50/60 space-y-3">
            <h4 className="text-xs font-extrabold text-sky-950 uppercase tracking-wider">
              1. Customize Target Members
            </h4>
            <p className="text-xs text-sky-700">
              Enter how many verified Telegram members you wish to gain. Price is dynamically calculated based on our verified rate of <strong>₹{minRatePerMember.toFixed(2)} / member</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <label className="block font-bold text-sky-900 mb-1">
                  Target Members Count (Min 50)
                </label>
                <input
                  type="number"
                  min={50}
                  step={50}
                  placeholder="e.g. 500, 1000, 2500"
                  value={customMembers === 0 ? "" : customMembers}
                  onChange={(e) => setCustomMembers(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm font-bold text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/90 border border-sky-200 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-sky-700 uppercase">
                  Calculated Total Campaign Cost:
                </span>
                <span className="text-lg font-black text-sky-950">
                  ₹{calculatedCustomPrice.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  (₹{minRatePerMember.toFixed(2)} per verified member join)
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-200 text-[11px] text-amber-950 font-medium">
              💡 Minimum platform floor rate is ₹{minRatePerMember.toFixed(2)} per user to ensure 100% active, non-drop Telegram earners.
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Verification, Payment & Submission Form */}
      <form onSubmit={handlePromoteSubmit} className="rounded-2xl p-4 glass-card border border-white/80 space-y-4">
        <h5 className="text-xs font-bold text-sky-950 uppercase tracking-wider">
          2. Verification & Payment
        </h5>

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Promotion Request Submitted!</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Admin is verifying your payment and bot admin privileges. Once approved, your campaign goes live immediately!
            </p>
          </div>
        )}

        {/* Channel Details */}
        <div>
          <label className="block text-[11px] font-bold text-sky-900 mb-1">
            Channel Username or Public Link
          </label>
          <input
            type="text"
            required
            placeholder="e.g. @MyCryptoChannel or https://t.me/..."
            value={channelInput}
            onChange={(e) => {
              setChannelInput(e.target.value);
              if (botAdminVerified || botAdminConfirmed) {
                setBotAdminVerified(false);
                setBotAdminConfirmed(false);
              }
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 border border-sky-200 text-xs text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 font-medium"
          />
        </div>

        {/* Bot Admin Requirement & Live Verification */}
        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 space-y-3 text-xs">
          <div className="flex items-start gap-2 text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Zaroori Step (Channel Admin Verification):</span>
              <p className="text-[11px] text-amber-900 mt-0.5 leading-tight">
                Hamare bot <strong className="font-mono">{botHandle}</strong> ko apne channel me <strong>Administrator</strong> banayein taaki system member joins ko automatically verify kar sake.
              </p>
            </div>
          </div>

          {/* Direct 1-Click Action & Live Verify Buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={`https://t.me/${botHandle.replace("@", "")}?startchannel=true&admin=invite_users+manage_chat`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2 px-3 rounded-xl btn-tactile-sky text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>1-Click: Add {botHandle} as Admin</span>
            </a>

            <button
              type="button"
              onClick={handleVerifyBotAdmin}
              disabled={isVerifyingBotAdmin || !channelInput.trim()}
              className="py-2 px-3 rounded-xl bg-white border border-sky-300 text-sky-900 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-sky-50 active:scale-95 disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>{isVerifyingBotAdmin ? "Checking Telegram..." : "Live Verify Admin"}</span>
            </button>
          </div>

          {/* Verification Status Feedback */}
          {botAdminVerified && (
            <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>✓ Verified! {botHandle} is confirmed as Administrator.</span>
            </div>
          )}

          {botAdminError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold">
              ❌ {botAdminError}
            </div>
          )}

          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={botAdminConfirmed}
              onChange={(e) => setBotAdminConfirmed(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-400"
            />
            <span className="text-[11px] font-bold text-amber-950">
              Maine {botHandle} ko Channel Admin bana diya hai
            </span>
          </label>
        </div>

        {/* Payment Due Card */}
        <div className="p-3.5 rounded-xl bg-sky-100/70 border border-sky-200 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-bold text-sky-900 block">Total Payment Due:</span>
              <span className="text-[10px] text-sky-700">{effectiveTitle} ({effectiveMembers.toLocaleString()} Members)</span>
            </div>
            <span className="text-lg font-black text-sky-950">₹{effectivePrice.toLocaleString()}</span>
          </div>

          <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] text-sky-700 font-semibold block">Pay to Official UPI ID:</span>
              <span className="font-mono font-bold text-sky-950 text-xs truncate block">{adminUpi}</span>
            </div>

            <button
              type="button"
              onClick={handleCopyUpi}
              className="px-2.5 py-1.5 rounded-lg bg-white text-sky-800 font-bold text-[11px] flex items-center gap-1 shadow-xs active:scale-95 border border-sky-200 shrink-0"
            >
              {copiedUpi ? (
                <>
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy UPI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* UTR Input */}
        <div>
          <label className="block text-[11px] font-bold text-sky-900 mb-1">
            Payment UTR / Transaction Reference (12 digits)
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 429183920192"
            value={utrInput}
            onChange={(e) => setUtrInput(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 border border-sky-200 text-xs text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 font-mono font-bold"
          />
        </div>

        {/* Telegram Contact & DM Screenshot */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-bold text-sky-900">
              Your Telegram Handle (@username)
            </label>
            <button
              type="button"
              onClick={handleDmAdminScreenshot}
              className="text-[11px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 underline"
            >
              <Camera className="w-3 h-3" />
              <span>DM Screenshot to Admin</span>
            </button>
          </div>

          <input
            type="text"
            required
            placeholder="e.g. @channel_owner"
            value={contactInput}
            onChange={(e) => setContactInput(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 border border-sky-200 text-xs text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 font-medium"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !botAdminConfirmed}
          className="w-full btn-tactile-sky py-3 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-tactile-btn mt-2 disabled:opacity-50"
        >
          <span>Submit for Admin Approval & Live Launch</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
      </div>
      )}
    </div>
  );
};
