"use client";

import React from "react";
import { Coins, ArrowUpRight, TrendingUp, Sparkles, ShieldCheck } from "lucide-react";
import { UserProfile, GlobalConfig } from "@/types";

interface BalanceCardProps {
  user: UserProfile;
  config: GlobalConfig;
  onWithdrawClick: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  user,
  config,
  onWithdrawClick,
}) => {
  const inrValue = (user.balance / config.coins_per_inr).toFixed(2);
  const tonValue = (user.balance / config.coins_per_ton).toFixed(4);

  return (
    <div className="relative overflow-hidden rounded-squircle glass-card p-5 border border-white/85 shadow-glass">
      {/* Iridescent Ambient Aura */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-400/25 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-cyan-300/30 rounded-full blur-2xl pointer-events-none" />

      {/* Top Tag & Status */}
      <div className="flex items-center justify-between relative z-10 mb-2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-[11px] font-semibold text-sky-800">
          <Sparkles className="w-3 h-3 text-sky-500" />
          <span>Reward Balance</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300/50 px-2.5 py-0.5 rounded-full">
          <ShieldCheck className="w-3 h-3" />
          <span>Verified Safe</span>
        </div>
      </div>

      {/* Main Counter */}
      <div className="relative z-10 my-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-4xl font-black text-sky-950 tracking-tight">
            {user.balance.toLocaleString()}
          </h2>
          <span className="text-sm font-extrabold text-sky-600 uppercase tracking-wide">
            Coins
          </span>
        </div>

        {/* Currency Conversions Ticker */}
        <div className="mt-2 flex items-center gap-3 text-xs font-semibold text-sky-800/80">
          <div className="flex items-center gap-1 bg-white/60 px-2.5 py-1 rounded-xl border border-white/80">
            <span className="text-emerald-600 font-bold">₹</span>
            <span>≈ ₹{inrValue} INR</span>
          </div>
          <div className="flex items-center gap-1 bg-white/60 px-2.5 py-1 rounded-xl border border-white/80">
            <span className="text-sky-500 font-bold">💎</span>
            <span>≈ {tonValue} TON</span>
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="mt-5 pt-3 border-t border-white/50 flex items-center gap-3 relative z-10">
        <button
          onClick={onWithdrawClick}
          className="flex-1 btn-tactile-sky py-3 px-4 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-tactile-btn"
        >
          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          <span>Withdraw to UPI / TON</span>
        </button>
      </div>
    </div>
  );
};
