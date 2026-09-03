"use client";

import React, { useState } from "react";
import {
  User,
  Copy,
  CheckCircle,
  Share2,
  ShieldCheck,
  Coins,
  Award,
  MessageSquare,
  ChevronRight,
  Wallet,
  Edit2,
  Trash2,
  Plus,
  Save,
  X,
  CreditCard,
  Send,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { UserProfile, GlobalConfig } from "@/types";

interface ProfileViewProps {
  user: UserProfile;
  config?: GlobalConfig;
  onSupportClick?: () => void;
  onUpdateSavedAddresses?: (upi?: string, ton?: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  config,
  onSupportClick,
  onUpdateSavedAddresses,
}) => {
  const [copied, setCopied] = useState(false);

  // Saved UPI edit state
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [upiInput, setUpiInput] = useState(user.saved_upi_id || "");

  // Saved TON edit state
  const [isEditingTon, setIsEditingTon] = useState(false);
  const [tonInput, setTonInput] = useState(user.saved_ton_address || "");

  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.user_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiInput.trim()) return;
    if (onUpdateSavedAddresses) {
      onUpdateSavedAddresses(upiInput.trim(), user.saved_ton_address);
    }
    setIsEditingUpi(false);
    setSaveSuccessToast("UPI ID saved to database successfully!");
    setTimeout(() => setSaveSuccessToast(null), 3000);
  };

  const handleDeleteUpi = () => {
    if (onUpdateSavedAddresses) {
      onUpdateSavedAddresses("", user.saved_ton_address);
    }
    setUpiInput("");
    setIsEditingUpi(false);
    setSaveSuccessToast("UPI ID removed from database!");
    setTimeout(() => setSaveSuccessToast(null), 3000);
  };

  const handleSaveTon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tonInput.trim()) return;
    if (onUpdateSavedAddresses) {
      onUpdateSavedAddresses(user.saved_upi_id, tonInput.trim());
    }
    setIsEditingTon(false);
    setSaveSuccessToast("TON address saved to database successfully!");
    setTimeout(() => setSaveSuccessToast(null), 3000);
  };

  const handleDeleteTon = () => {
    if (onUpdateSavedAddresses) {
      onUpdateSavedAddresses(user.saved_upi_id, "");
    }
    setTonInput("");
    setIsEditingTon(false);
    setSaveSuccessToast("TON address removed from database!");
    setTimeout(() => setSaveSuccessToast(null), 3000);
  };

  const handleContactDev = () => {
    const raw = config?.custom_service_telegram || "@amxnbixnoe";
    const cleanHandle = raw.replace(/^@+/, "");
    const url = `https://t.me/${cleanHandle}`;
    if (typeof window !== "undefined") {
      const tg = (window as any).Telegram?.WebApp;
      if (tg && typeof tg.openTelegramLink === "function") {
        tg.openTelegramLink(url);
      } else {
        window.open(url, "_blank");
      }
    }
  };

  return (
    <div className="space-y-4 px-1 pb-6 animate-in fade-in duration-200">
      {/* Profile Info Card */}
      <div className="rounded-squircle glass-card p-5 border border-white/85 shadow-glass text-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500 to-sky-300 flex items-center justify-center text-white text-2xl font-black mx-auto shadow-md border-2 border-white">
          {user.first_name ? user.first_name[0].toUpperCase() : "U"}
        </div>

        <h3 className="text-base font-black text-sky-950 mt-3">
          {user.first_name || user.username || "Telegram Earner"}
        </h3>
        <p className="text-xs text-sky-700/80 font-medium">@{user.username || "anonymous"}</p>

        <div className="mt-3 inline-flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-xl border border-sky-200 text-xs font-mono">
          <span className="text-sky-600 font-bold">ID:</span>
          <span className="font-bold text-sky-950">{user.user_id}</span>
          <button
            onClick={handleCopyId}
            className="text-sky-600 hover:text-sky-900 active:scale-95 ml-1"
            title="Copy User ID"
          >
            {copied ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* EXCLUSIVE BLINKING / GLOWING CUSTOM SOLUTION PROMO BANNER */}
      {config?.custom_service_enabled !== false && (
        <div className="relative group overflow-hidden rounded-3xl p-[2px] bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 shadow-xl shadow-purple-500/20 animate-pulse transition-all">
          <div className="rounded-[22px] bg-gradient-to-b from-sky-950 via-slate-900 to-sky-950 text-white p-4 sm:p-5 relative overflow-hidden">
            {/* Background Ambient Glows */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-purple-500/30 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-3">
              {/* Blinking Live Badge */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-wider text-amber-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span>Direct Dev Solution</span>
                </div>
                <span className="text-[10px] font-bold text-sky-200/90 bg-purple-900/70 px-2 py-0.5 rounded-md border border-purple-400/40">
                  Verified Builder ⚡
                </span>
              </div>

              {/* Title / User Hook */}
              <div>
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white leading-snug drop-shadow-sm">
                  {config?.custom_service_title || "need custom solution telegram bot,web,App?? contect here..🚀💰"}
                </h3>
                <p className="text-[11px] text-sky-200/80 font-medium mt-1">
                  Custom Telegram Mini Apps, Telegram Bots, Full Web Systems & Scalable Solutions.
                </p>
              </div>

              {/* Action Button to Open Direct DM */}
              <button
                type="button"
                onClick={handleContactDev}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 hover:from-amber-300 hover:to-purple-500 text-white font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/30"
              >
                <Send className="w-4 h-4 text-white" />
                <span>Contact on Telegram DM ({config?.custom_service_telegram || "@amxnbixnoe"})</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-90" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVED PAYOUT ADDRESSES (UPI & TON WALLET) */}
      <div className="rounded-2xl glass-card p-5 border border-sky-300/80 shadow-glass space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-sky-950 uppercase tracking-wider">
              Saved Payout Addresses (Auto-fill)
            </h4>
            <p className="text-[11px] text-sky-700/80">
              Save your UPI & TON address once so you never have to re-enter them during withdrawal.
            </p>
          </div>
        </div>

        {saveSuccessToast && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessToast}</span>
          </div>
        )}

        {/* 1. Saved UPI Section */}
        <div className="p-3 rounded-xl bg-white/75 border border-sky-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-sky-950">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 uppercase">
                UPI
              </span>
              <span>Bank UPI ID (GPay / PhonePe / Paytm)</span>
            </div>

            {user.saved_upi_id && !isEditingUpi && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setUpiInput(user.saved_upi_id || "");
                    setIsEditingUpi(true);
                  }}
                  className="p-1 rounded-lg hover:bg-sky-100 text-sky-700"
                  title="Edit UPI"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUpi}
                  className="p-1 rounded-lg hover:bg-rose-100 text-rose-600"
                  title="Delete UPI"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {isEditingUpi || !user.saved_upi_id ? (
            <form onSubmit={handleSaveUpi} className="space-y-2 pt-1">
              <input
                type="text"
                required
                placeholder="e.g. yourname@paytm or user@okhdfcbank"
                value={upiInput}
                onChange={(e) => setUpiInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-sky-50 border border-sky-300 font-mono font-bold text-sky-950 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="btn-tactile-sky px-3 py-1.5 rounded-xl text-white font-bold text-xs flex items-center gap-1 active:scale-95"
                >
                  <Save className="w-3 h-3" />
                  <span>Save UPI ID</span>
                </button>
                {isEditingUpi && (
                  <button
                    type="button"
                    onClick={() => setIsEditingUpi(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between pt-1">
              <code className="font-mono font-bold text-sky-950 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100 text-xs truncate">
                {user.saved_upi_id}
              </code>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                ✓ Auto-fills on withdraw
              </span>
            </div>
          )}
        </div>

        {/* 2. Saved TON Wallet Section */}
        <div className="p-3 rounded-xl bg-white/75 border border-sky-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-sky-950">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 uppercase">
                TON
              </span>
              <span>TON Crypto Wallet Address</span>
            </div>

            {user.saved_ton_address && !isEditingTon && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTonInput(user.saved_ton_address || "");
                    setIsEditingTon(true);
                  }}
                  className="p-1 rounded-lg hover:bg-sky-100 text-sky-700"
                  title="Edit TON Address"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTon}
                  className="p-1 rounded-lg hover:bg-rose-100 text-rose-600"
                  title="Delete TON Address"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {isEditingTon || !user.saved_ton_address ? (
            <form onSubmit={handleSaveTon} className="space-y-2 pt-1">
              <input
                type="text"
                required
                placeholder="e.g. EQDa4Vfvy2qPkW_x09yJ6V19nQW-29eL13098..."
                value={tonInput}
                onChange={(e) => setTonInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-sky-50 border border-sky-300 font-mono font-bold text-sky-950 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="btn-tactile-sky px-3 py-1.5 rounded-xl text-white font-bold text-xs flex items-center gap-1 active:scale-95"
                >
                  <Save className="w-3 h-3" />
                  <span>Save TON Address</span>
                </button>
                {isEditingTon && (
                  <button
                    type="button"
                    onClick={() => setIsEditingTon(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between pt-1">
              <code className="font-mono font-bold text-sky-950 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100 text-xs truncate max-w-[200px]">
                {user.saved_ton_address}
              </code>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                ✓ Auto-fills on withdraw
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 24/7 Official Support Chat Button */}
      {onSupportClick && (
        <button
          onClick={onSupportClick}
          className="w-full p-4 rounded-2xl glass-card border border-sky-300/80 flex items-center justify-between hover:bg-white/80 active:scale-98 transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-black text-sky-950">24/7 Admin Support Desk</h4>
              <p className="text-[11px] text-sky-700/80">
                Direct 1-to-1 private chat with the administrator
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-sky-600" />
        </button>
      )}

      {/* Stats Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl glass-card border border-white/80 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-sky-700 font-semibold">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>Lifetime Earned</span>
          </div>
          <div className="text-lg font-black text-sky-950">
            {user.total_earned.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-white/80 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-sky-700 font-semibold">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Completed Tasks</span>
          </div>
          <div className="text-lg font-black text-sky-950">
            {user.completed_tasks.length}
          </div>
        </div>
      </div>

      {/* Trust & Verification Badge */}
      <div className="p-4 rounded-2xl glass-card border border-white/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-sky-950">
            Official Anti-Cheat Protected
          </h4>
          <p className="text-[11px] text-sky-700/80">
            All coin rewards and Telegram tasks are verified via official Telegram Bot API.
          </p>
        </div>
      </div>
    </div>
  );
};
