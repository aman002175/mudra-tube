"use client";

import React, { useState } from "react";
import { User, Copy, CheckCircle, Share2, ShieldCheck, Coins, Award } from "lucide-react";
import { UserProfile } from "@/types";

interface ProfileViewProps {
  user: UserProfile;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user }) => {
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
          {user.first_name || user.username || "Telegram User"}
        </h3>
        <p className="text-xs font-semibold text-sky-700/80">
          @{user.username || "tg_user"}
        </p>

        <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-white/70 border border-sky-200/80 text-[11px] font-mono text-sky-900">
          <span>ID: {user.user_id}</span>
          <button
            onClick={handleCopyId}
            className="p-0.5 text-sky-600 hover:text-sky-800"
          >
            {copied ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

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
