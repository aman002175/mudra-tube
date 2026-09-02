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
} from "lucide-react";
import { UserProfile } from "@/types";

interface ProfileViewProps {
  user: UserProfile;
  onSupportClick?: () => void;
  onUpdateSavedAddresses?: (upi?: string, ton?: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
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
  };

  const handleDeleteUpi = () => {
    if (onUpdateSavedAddresses) {
      onUpdateSavedAddresses("", user.saved_ton_address);
    }
    setUpiInput("");
    setIsEditingUpi(false);
  };

  const handleSaveTon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tonInput.trim()) return;
    if (onUpdateSavedAddresses) {
      onUpdateSavedAddresses(user.saved_upi_id, tonInput.trim());
    }
    setIsEditingTon(false);
  };

  const handleDeleteTon = () => {
    if (onUpdateSavedAddresses) {
      onUpdateSavedAddresses(user.saved_upi_id, "");
    }
    setTonInput("");
    setIsEditingTon(false);
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
