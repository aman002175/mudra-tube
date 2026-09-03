"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, QrCode, Sparkles } from "lucide-react";
import { GlobalConfig, UserProfile, AdminPaymentMethod } from "@/types";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  config: GlobalConfig;
  paymentMethods?: AdminPaymentMethod[];
  onSubmitWithdrawal: (method: "UPI" | "TON", address: string, amount: number) => Promise<boolean>;
  onSaveAddress?: (method: "UPI" | "TON", address: string) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  user,
  config,
  paymentMethods,
  onSubmitWithdrawal,
  onSaveAddress,
}) => {
  const isUpiActive = paymentMethods ? paymentMethods.some((pm) => pm.type === "UPI" && pm.is_active) : true;
  const isTonActive = paymentMethods ? paymentMethods.some((pm) => pm.type === "TON" && pm.is_active) : true;

  const minWithdrawalInr = config.min_withdrawal_inr ?? config.min_withdrawal_coins ?? 10;
  const tonRate = Number(config.ton_rate_inr || config.coins_per_ton || 500);

  const [method, setMethod] = useState<"UPI" | "TON">(isUpiActive ? "UPI" : "TON");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState<string>(String(minWithdrawalInr));
  const [saveAddressOption, setSaveAddressOption] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-switch method safely without infinite loops (Fix 2.1)
  useEffect(() => {
    if (!isUpiActive && !isTonActive) return;

    if (!isTonActive && method === "TON" && isUpiActive) {
      setMethod("UPI");
      setAddress(user.saved_upi_id || "");
    } else if (!isUpiActive && method === "UPI" && isTonActive) {
      setMethod("TON");
      setAddress(user.saved_ton_address || "");
    }
  }, [isUpiActive, isTonActive, method, user.saved_upi_id, user.saved_ton_address]);

  // Auto-fill from saved settings
  useEffect(() => {
    if (method === "UPI" && user.saved_upi_id) {
      setAddress(user.saved_upi_id);
    } else if (method === "TON" && user.saved_ton_address) {
      setAddress(user.saved_ton_address);
    } else {
      setAddress("");
    }
  }, [method, user.saved_upi_id, user.saved_ton_address, isOpen]);

  if (!isOpen) return null;

  const parsedAmount = Number(amount) || 0;
  const tonEstimated = (parsedAmount / Math.max(1, tonRate)).toFixed(4);
  const userBalance = Number(user.balance ?? 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (parsedAmount < minWithdrawalInr) {
      setError(`Minimum withdrawal is ₹${minWithdrawalInr}.`);
      return;
    }

    if (parsedAmount > userBalance) {
      setError(`Insufficient cash balance (Available: ₹${userBalance.toFixed(2)}).`);
      return;
    }

    const cleanAddress = address.trim();
    if (!cleanAddress) {
      setError(method === "UPI" ? "Please enter your UPI ID." : "Please enter your TON address.");
      return;
    }

    if (method === "UPI") {
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiRegex.test(cleanAddress)) {
        setError("Invalid UPI ID format. Example: user@okhdfcbank or 9876543210@paytm");
        return;
      }
    } else if (method === "TON") {
      // Validate TON userfriendly or raw format
      const friendlyRegex = /^(EQ|UQ|kQ|0Q)[a-zA-Z0-9_\-]{46}$/;
      const rawRegex = /^(-1|0):[a-fA-F0-9]{64}$/;
      if (!friendlyRegex.test(cleanAddress) && !rawRegex.test(cleanAddress)) {
        setError("Invalid TON wallet address format (starts with EQ, UQ, kQ, 0Q or raw 0:).");
        return;
      }
    }

    setIsSubmitting(true);
    const result = await onSubmitWithdrawal(method, cleanAddress, parsedAmount);
    setIsSubmitting(false);

    if (result) {
      if (saveAddressOption && onSaveAddress) {
        onSaveAddress(method, cleanAddress);
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } else {
      setError("Withdrawal request rejected by server. Please check your balance or try again.");
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
              Withdraw Earnings (₹)
            </h3>
            <p className="text-xs font-medium text-sky-700">
              Transfer real rupees to Bank UPI or TON Crypto
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
              Your request for ₹{parsedAmount.toFixed(2)} is pending admin approval and will be transferred shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Payout Method Toggle */}
            <div className="flex gap-2 p-1.5 glass-card rounded-2xl border border-sky-200/60">
              {isUpiActive && (
                <button
                  type="button"
                  onClick={() => setMethod("UPI")}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    method === "UPI"
                      ? "btn-tactile-sky text-white shadow-sm"
                      : "text-sky-800 hover:bg-white/60"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>UPI (GPay/PhonePe)</span>
                </button>
              )}

              {isTonActive && (
                <button
                  type="button"
                  onClick={() => setMethod("TON")}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    method === "TON"
                      ? "btn-tactile-sky text-white shadow-sm"
                      : "text-sky-800 hover:bg-white/60"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>TON Wallet</span>
                </button>
              )}
            </div>

            {/* Address / UPI input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-sky-900 uppercase tracking-wide">
                  {method === "UPI" ? "Your Bank UPI ID" : "TON Wallet Address"}
                </label>

                {((method === "UPI" && user.saved_upi_id) || (method === "TON" && user.saved_ton_address)) && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-filled</span>
                  </span>
                )}
              </div>

              <input
                type="text"
                required
                placeholder={
                  method === "UPI" ? "e.g. mobile@paytm or user@okaxis" : "e.g. UQDa4Vfvy2qPkW_x09yJ6V19..."
                }
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-sky-200 text-sky-950 text-xs font-mono font-bold placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />

              {/* Save address checkbox */}
              <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={saveAddressOption}
                  onChange={(e) => setSaveAddressOption(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-400"
                />
                <span className="text-[11px] font-semibold text-sky-900">
                  Save this {method} address in my profile for future payouts
                </span>
              </label>
            </div>

            {/* Amount Selection in Direct ₹ INR */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-sky-900 uppercase tracking-wide">
                  Amount in Rupees (₹)
                </label>
                <span className="text-[11px] font-semibold text-sky-700">
                  Available: ₹{userBalance.toFixed(2)}
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-600 font-bold text-sm">₹</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={`Min ₹${minWithdrawalInr}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-white/80 border border-sky-200 text-sky-950 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 font-bold"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2 mt-2">
                {[minWithdrawalInr, minWithdrawalInr * 2, minWithdrawalInr * 5]
                  .filter((v, idx, arr) => arr.indexOf(v) === idx)
                  .map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(String(preset))}
                      className="flex-1 py-1 rounded-xl glass-pill text-[11px] font-bold text-sky-800 hover:bg-white/90 active:scale-95"
                    >
                      ₹{preset}
                    </button>
                  ))}
                <button
                  type="button"
                  onClick={() => setAmount(String(Math.floor(userBalance)))}
                  className="flex-1 py-1 rounded-xl glass-pill text-[11px] font-extrabold text-sky-900 hover:bg-white/90 active:scale-95 border-sky-300"
                >
                  All (₹{userBalance.toFixed(2)})
                </button>
              </div>
            </div>

            {/* Conversion Estimation Card */}
            <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200/80 space-y-1">
              <div className="flex justify-between text-xs text-sky-800 font-medium">
                <span>Direct Transfer Amount:</span>
                <span className="font-bold text-emerald-700">
                  {method === "UPI" ? `₹${parsedAmount.toFixed(2)} INR` : `~${tonEstimated} TON (₹${parsedAmount.toFixed(2)})`}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-sky-600">
                <span>Payout Method:</span>
                <span>
                  {method === "UPI"
                    ? "Direct Bank UPI Transfer"
                    : `1.00 TON ≈ ₹${tonRate} INR`}
                </span>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitting || parsedAmount > userBalance || parsedAmount < minWithdrawalInr}
              className="w-full btn-tactile-sky py-3.5 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-tactile-btn disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <span>Confirm & Request Payout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
