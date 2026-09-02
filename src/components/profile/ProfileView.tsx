"use client";

import React, { useState } from "react";
import { User, Copy, CheckCircle, Share2, ShieldCheck, Coins, Award, MessageSquare, ChevronRight } from "lucide-react";
import { UserProfile } from "@/types";

interface ProfileViewProps {
  user: UserProfile;
  onSupportClick?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onSupportClick }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.user_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 px-1 pb-4 animate-in fade-in duration-200">
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
