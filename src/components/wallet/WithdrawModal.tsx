"use client";

import React, { useState } from "react";
import { X, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, QrCode } from "lucide-react";
import { GlobalConfig, UserProfile } from "@/types";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  config: GlobalConfig;
  onSubmitWithdrawal: (method: "UPI" | "TON", address: string, coins: number) => Promise<boolean>;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  user,
  config,
  onSubmitWithdrawal,
}) => {
  const [method, setMethod] = useState<"UPI" | "TON">("UPI");
  const [address, setAddress] = useState("");
  const [coins, setCoins] = useState<number>(config.min_withdrawal_coins);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const inrAmount = (coins / config.coins_per_inr).toFixed(2);
  const tonAmount = (coins / config.coins_per_ton).toFixed(4);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (coins < config.min_withdrawal_coins) {
      setError(`Minimum withdrawal is ${config.min_withdrawal_coins} Coins.`);
      return;
    }

    if (coins > user.balance) {
      setError("Insufficient coin balance.");
      return;
    }

    if (!address.trim()) {
      setError(method === "UPI" ? "Please enter a valid UPI ID (e.g. user@paytm)." : "Please enter a valid TON address.");
      return;
    }

    setIsSubmitting(true);
    const result = await onSubmitWithdrawal(method, address.trim(), coins);
    setIsSubmitting(false);

    if (result) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } else {
      setError("Withdrawal request failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
      <div className="w-full max-w-md glass-elevated rounded-t-[36px] p-6 border-t border-white shadow-2xl relative animate-in slide-in-from-bottom duration-300">
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-sky-200/80 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-sky-950 tracking-tight">
              Withdraw Coins
            </h3>
            <p className="text-xs font-medium text-sky-700">
              Transfer earned coins to Bank UPI or TON Crypto
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-sky-800 hover:text-sky-950"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <h4 className="text-lg font-bold text-sky-950">
              Withdrawal Submitted!
            </h4>
            <p className="text-xs text-sky-700 max-w-xs mx-auto">
              Your payout request has been queued for admin verification and transfer.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Method Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-sky-100/70 border border-sky-200/60">
              <button
                type="button"
                onClick={() => setMethod("UPI")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  method === "UPI"
                    ? "bg-white text-sky-950 shadow-sm border border-white"
                    : "text-sky-700 hover:text-sky-900"
                }`}
              >
                <span className="text-emerald-600 font-extrabold text-sm">₹</span>
                <span>UPI (Paytm/GPay)</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("TON")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  method === "TON"
                    ? "bg-white text-sky-950 shadow-sm border border-white"
                    : "text-sky-700 hover:text-sky-900"
                }`}
              >
                <span>💎</span>
                <span>TON / USDT</span>
              </button>
            </div>

            {/* Address / UPI input */}
            <div>
              <label className="block text-[11px] font-bold text-sky-900 uppercase tracking-wide mb-1">
                {method === "UPI" ? "Your UPI ID" : "TON Wallet Address"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={
                    method === "UPI" ? "e.g. mobile@paytm or user@okaxis" : "e.g. UQDa4Vfvy2qPkW_x09yJ6V19..."
                  }
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-sky-200 text-sky-950 text-sm placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 font-medium"
                />
              </div>
            </div>

            {/* Coins Selection */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-sky-900 uppercase tracking-wide">
                  Coin Amount
                </label>
                <span className="text-[11px] font-semibold text-sky-700">
                  Balance: {user.balance} Coins
                </span>
              </div>

              <input
                type="number"
                min={config.min_withdrawal_coins}
                max={user.balance}
                value={coins}
                onChange={(e) => setCoins(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-sky-200 text-sky-950 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 font-bold"
              />

              {/* Quick Preset Buttons */}
              <div className="flex gap-2 mt-2">
                {[config.min_withdrawal_coins, 600, 1500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCoins(preset)}
                    className="flex-1 py-1 rounded-xl glass-pill text-[11px] font-bold text-sky-800 hover:bg-white/90 active:scale-95"
                  >
                    {preset}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCoins(user.balance)}
                  className="flex-1 py-1 rounded-xl glass-pill text-[11px] font-extrabold text-sky-900 hover:bg-white/90 active:scale-95 border-sky-300"
                >
                  All ({user.balance})
                </button>
              </div>
            </div>

            {/* Rate Conversion Summary Card */}
            <div className="rounded-2xl p-3 bg-sky-100/60 border border-sky-200/80 flex items-center justify-between text-xs">
              <span className="text-sky-800 font-medium">You will receive:</span>
              <span className="text-sky-950 font-black text-sm">
                {method === "UPI" ? `₹${inrAmount} INR` : `${tonAmount} TON`}
              </span>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Tactile Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || user.balance < config.min_withdrawal_coins}
              className="w-full btn-tactile-sky py-3 px-4 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-tactile-btn mt-2"
            >
              <span>Confirm & Request Payout</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
