"use client";

import React, { useState } from "react";
import { Wallet, ArrowUpRight, Clock, CheckCircle, XCircle, Shield, ArrowDownLeft } from "lucide-react";
import { GlobalConfig, UserProfile, WithdrawalRequest } from "@/types";
import { WithdrawModal } from "./WithdrawModal";

interface WalletViewProps {
  user: UserProfile;
  config: GlobalConfig;
  withdrawals: WithdrawalRequest[];
  onSubmitWithdrawal: (method: "UPI" | "TON", address: string, coins: number) => Promise<boolean>;
}

export const WalletView: React.FC<WalletViewProps> = ({
  user,
  config,
  withdrawals,
  onSubmitWithdrawal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter user's specific withdrawals
  const userWithdrawals = withdrawals.filter((w) => w.user_id === user.user_id);

  return (
    <div className="space-y-5 px-1 pb-4">
      {/* Wallet Stats Card */}
      <div className="rounded-squircle glass-card p-5 border border-white/85 shadow-glass">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider">
              My Wallet
            </h3>
          </div>
          <span className="text-[11px] font-bold text-sky-700 bg-white/70 px-2.5 py-1 rounded-full border border-white/90">
            Min: {config.min_withdrawal_coins} Coins (₹1)
          </span>
        </div>

        {/* Big Balance Display */}
        <div className="my-3">
          <span className="text-xs font-semibold text-sky-700">Spendable Coins</span>
          <div className="text-3xl font-black text-sky-950 mt-0.5">
            {user.balance.toLocaleString()}
          </div>
          <p className="text-xs font-bold text-emerald-700 mt-1">
            ≈ ₹{(user.balance / config.coins_per_inr).toFixed(2)} INR
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/50 text-xs">
          <div className="p-2 rounded-xl bg-white/50 border border-white/70">
            <span className="text-sky-700/80 font-medium">Total Earned</span>
            <div className="text-sm font-bold text-sky-950 mt-0.5">
              {user.total_earned} Coins
            </div>
          </div>
          <div className="p-2 rounded-xl bg-white/50 border border-white/70">
            <span className="text-sky-700/80 font-medium">Total Paid</span>
            <div className="text-sm font-bold text-sky-950 mt-0.5">
              {user.total_withdrawn} Coins
            </div>
          </div>
        </div>

        {/* Withdraw Action Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full mt-4 btn-tactile-sky py-3 px-4 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-tactile-btn"
        >
          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          <span>Request New Withdrawal</span>
        </button>
      </div>

      {/* Payout History Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold text-sky-950 uppercase tracking-wider px-1">
          Recent Payout History
        </h4>

        {userWithdrawals.length === 0 ? (
          <div className="rounded-2xl p-6 glass-card text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-500 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-sky-950">No withdrawal requests yet</p>
            <p className="text-[11px] text-sky-700/80">
              Complete channel tasks to earn coins and request payouts here!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {userWithdrawals.map((w) => (
              <div
                key={w.id}
                className="rounded-2xl p-3.5 glass-card border border-white/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-sky-700 shadow-sm">
                    {w.method === "UPI" ? (
                      <span className="font-extrabold text-emerald-600">₹</span>
                    ) : (
                      <span>💎</span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sky-950">
                      {w.coins} Coins (₹{w.amount_inr})
                    </div>
                    <div className="text-[11px] text-sky-700/70 truncate max-w-[140px]">
                      {w.payout_address}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {w.status === "completed" && (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                      <CheckCircle className="w-3 h-3" />
                      Paid
                    </span>
                  )}
                  {w.status === "pending" && (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                  {w.status === "rejected" && (
                    <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full border border-rose-300">
                      <XCircle className="w-3 h-3" />
                      Rejected
                    </span>
                  )}
                  <div className="text-[10px] text-sky-600/70 mt-1">
                    {new Date(w.requested_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <WithdrawModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        config={config}
        onSubmitWithdrawal={onSubmitWithdrawal}
      />
    </div>
  );
};
