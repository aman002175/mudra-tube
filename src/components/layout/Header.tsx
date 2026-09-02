"use client";

import React from "react";
import { Coins, Sparkles } from "lucide-react";
import { UserProfile } from "@/types";

interface HeaderProps {
  user: UserProfile;
  onCoinClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onCoinClick }) => {
  return (
    <header className="sticky top-0 z-30 px-5 pt-4 pb-3 flex items-center justify-between glass-elevated border-b border-white/60">
      {/* Brand & User Greeting */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-300 flex items-center justify-center shadow-md shadow-sky-400/30 text-white font-black text-lg border border-white/80">
            M
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500 border border-white"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold text-sky-950 tracking-tight">
              {user.first_name || user.username || "Earner"}
            </h1>
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <p className="text-[11px] font-medium text-sky-700/70">
            @{user.username || "tg_user"}
          </p>
        </div>
      </div>

      {/* Tactile Coin Counter Chip */}
      <button
        onClick={onCoinClick}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-sky-950 font-bold text-sm shadow-sm active:scale-95 transition-transform"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 flex items-center justify-center text-amber-950 shadow-inner">
          <Coins className="w-3.5 h-3.5" />
        </div>
        <span className="text-sky-900 font-extrabold tracking-tight">
          {user.balance.toLocaleString()}
        </span>
      </button>
    </header>
  );
};
