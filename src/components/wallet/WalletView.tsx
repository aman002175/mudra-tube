"use client";

import React, { useState } from "react";
import { Wallet, ArrowUpRight, Clock, CheckCircle, XCircle, Shield, ArrowDownLeft } from "lucide-react";
import { GlobalConfig, UserProfile, WithdrawalRequest, AdminPaymentMethod } from "@/types";
import { WithdrawModal } from "./WithdrawModal";

interface WalletViewProps {
  user: UserProfile;
  config: GlobalConfig;
  withdrawals: WithdrawalRequest[];
  paymentMethods?: AdminPaymentMethod[];
  onSubmitWithdrawal: (method: "UPI" | "TON", address: string, amount: number) => Promise<boolean>;
  onSaveAddress?: (type: "UPI" | "TON", address: string) => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  user,
  config,
  withdrawals,
  paymentMethods,
  onSubmitWithdrawal,
  onSaveAddress,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter user's specific withdrawals
  const userWithdrawals = (withdrawals || []).filter((w) => w.user_id === user.user_id);
  const currentBalance = Number(user.balance ?? 0);
  const totalEarned = Number(user.total_earned ?? 0);
  const totalWithdrawn = Number(user.total_withdrawn ?? 0);
  const minWdInr = config.min_withdrawal_inr ?? config.min_withdrawal_coins ?? 10;
  const tonRate = Number(config?.ton_rate_inr || config?.coins_per_ton || 500);

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
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-300/60">
            Min Payout: ₹{minWdInr}
          </span>
        </div>

        {/* Big Balance Display */}
        <div className="my-3">
          <span className="text-xs font-semibold text-sky-700">Available Cash Balance</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-black text-emerald-600">₹</span>
            <div className="text-3xl font-black text-sky-950">
              {currentBalance.toFixed(2)}
            </div>
            <span className="text-xs font-bold text-sky-600 ml-1">INR</span>
          </div>
          <p className="text-xs font-bold text-sky-700 mt-1">
            ≈ {(currentBalance / Math.max(1, tonRate)).toFixed(4)} TON
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/50 text-xs">
          <div className="p-2 rounded-xl bg-white/50 border border-white/70">
            <span className="text-sky-700/80 font-medium">Total Earned</span>
            <div className="text-sm font-bold text-emerald-700 mt-0.5">
              ₹{totalEarned.toFixed(2)}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-white/50 border border-white/70">
            <span className="text-sky-700/80 font-medium">Total Withdrawn</span>
            <div className="text-sm font-bold text-sky-950 mt-0.5">
              ₹{totalWithdrawn.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Withdraw Action Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full mt-4 btn-tactile-sky py-3 px-4 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-tactile-btn active:scale-95"
        >
          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          <span>Request New Withdrawal (₹)</span>
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
              Complete channel tasks to earn real rupees and request payouts here!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {userWithdrawals.map((w) => {
              const amount = Number(w.amount_inr ?? w.coins ?? 0);
              const tonDisplay = (amount / Math.max(1, tonRate)).toFixed(4);

              return (
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
                        {w.method === "UPI" ? `₹${amount.toFixed(2)}` : `~${tonDisplay} TON (₹${amount.toFixed(2)})`}
                      </div>
                      <div className="text-[11px] text-sky-700/70 truncate max-w-[140px]">
                        {w.payout_address}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {w.status === "completed" && (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                        <CheckCircle className="w-3 h-3" />
                        Completed
                      </span>
                    )}
                    {w.status === "pending" && (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                    {w.status === "rejected" && (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full text-[10px]">
                        <XCircle className="w-3 h-3" />
                        Rejected
                      </span>
                    )}
                    <div className="text-[10px] text-sky-600/70 mt-1">
                      {w.requested_at ? new Date(w.requested_at).toLocaleDateString() : "Recently"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <WithdrawModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        config={config}
        paymentMethods={paymentMethods}
        onSubmitWithdrawal={onSubmitWithdrawal}
        onSaveAddress={onSaveAddress}
      />
    </div>
  );
};
