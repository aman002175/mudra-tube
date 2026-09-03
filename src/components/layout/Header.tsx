"use client";

import React from "react";
import { Coins, Sparkles, MessageSquare, Users } from "lucide-react";
import { UserProfile } from "@/types";

interface HeaderProps {
  user: UserProfile;
  totalUsers?: number;
  onCoinClick: () => void;
  onSupportClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  totalUsers,
  onCoinClick,
  onSupportClick,
}) => {
  return (
    <header className="sticky top-0 z-30 px-3.5 pt-3.5 pb-3 flex items-center justify-between glass-elevated border-b border-white/60">
      {/* Brand & User Greeting */}
      <div className="flex items-center gap-2">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-300 flex items-center justify-center shadow-md shadow-sky-400/30 text-white font-black text-base border border-white/80">
            M
          </div>
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500 border border-white"></span>
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <h1 className="text-xs sm:text-sm font-bold text-sky-950 tracking-tight truncate max-w-[90px] sm:max-w-[120px]">
              {user.first_name || user.username || "Earner"}
            </h1>
            <Sparkles className="w-3 h-3 text-sky-500 shrink-0" />
          </div>
          <p className="text-[10px] font-medium text-sky-700/70 truncate max-w-[90px] sm:max-w-[120px]">
            @{user.username || "tg_user"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Total Platform Users Counter (For Telegram Channel Owners & Sponsors) */}
        {totalUsers !== undefined && (
          <div
            title="Total Registered Platform Users"
            className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-white/85 border border-sky-200/90 shadow-xs text-sky-950 text-xs font-black"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="tracking-tight text-xs font-black">{totalUsers.toLocaleString()}</span>
          </div>
        )}

        {/* Support Chat Trigger Button */}
        {onSupportClick && (
          <button
            onClick={onSupportClick}
            title="Chat with Admin Support"
            className="w-8 h-8 rounded-2xl glass-pill text-sky-800 flex items-center justify-center shadow-sm active:scale-95 transition-transform hover:bg-white/80"
          >
            <MessageSquare className="w-3.5 h-3.5 text-sky-700" />
          </button>
        )}

        {/* Tactile Coin Counter Chip */}
        <button
          onClick={onCoinClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full glass-pill text-sky-950 font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition-transform"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 flex items-center justify-center text-amber-950 shadow-inner">
            <Coins className="w-3 h-3" />
          </div>
          <span className="text-sky-900 font-extrabold tracking-tight">
            {user.balance.toLocaleString()}
          </span>
        </button>
      </div>
    </header>
  );
};
