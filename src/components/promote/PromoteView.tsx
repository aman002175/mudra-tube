"use client";

import React, { useState } from "react";
import {
  Megaphone,
  Check,
  Sparkles,
  Send,
  ShieldCheck,
  ArrowRight,
  Copy,
  CheckCircle,
  ExternalLink,
  Camera,
  AlertTriangle,
} from "lucide-react";
import { PromoPackage, GlobalConfig, UserProfile } from "@/types";

interface PromoteViewProps {
  packages: PromoPackage[];
  user: UserProfile;
  config: GlobalConfig;
  onSubmitPromotion: (data: {
    channel: string;
    members: number;
    price_inr: number;
    utr_number: string;
    contact: string;
    packageId?: string;
  }) => Promise<boolean>;
}

export const PromoteView: React.FC<PromoteViewProps> = ({
  packages,
  user,
  config,
  onSubmitPromotion,
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>(packages[1]?.id || packages[0]?.id || "");
  const [channelInput, setChannelInput] = useState("");
  const [contactInput, setContactInput] = useState(user.username ? `@${user.username}` : "");
  const [utrInput, setUtrInput] = useState("");
  const [botAdminConfirmed, setBotAdminConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const selectedPkg = packages.find((p) => p.id === selectedPkgId) || packages[0] || {
    id: "default",
    title: "Starter Plan",
    members: 500,
    price_inr: 1000,
    features: [],
  };

  const adminUpi = config.admin_upi_id || "admin@paytm";
  const adminTgHandle = (config.admin_telegram_handle || "@admin_mudratube").replace("@", "");
  const botHandle = config.bot_username || "@MudraTube_bot";

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(adminUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleDmAdminScreenshot = () => {
    const text = encodeURIComponent(
      `Hello Admin! I have paid ₹${selectedPkg.price_inr} for Channel Promotion.\n\nChannel: ${channelInput || "N/A"}\nPackage: ${selectedPkg.title} (${selectedPkg.members} Members)\nUser ID: ${user.user_id}\nUTR: ${utrInput || "Sending screenshot..."}`
    );
    window.open(`https://t.me/${adminTgHandle}?text=${text}`, "_blank");
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelInput.trim() || !contactInput.trim() || !utrInput.trim()) return;

    setIsSubmitting(true);
    const ok = await onSubmitPromotion({
      channel: channelInput.trim(),
      members: selectedPkg.members,
      price_inr: selectedPkg.price_inr,
      utr_number: utrInput.trim(),
      contact: contactInput.trim(),
      packageId: selectedPkg.id,
    });
    setIsSubmitting(false);

    if (ok) {
      setSuccess(true);
      setChannelInput("");
      setUtrInput("");
      setBotAdminConfirmed(false);
      setTimeout(() => setSuccess(false), 5000);
    }
  };

  return (
    <div className="space-y-4 px-1 pb-6 animate-in fade-in duration-200">
      {/* Intro Header */}
      <div className="rounded-squircle glass-card p-5 border border-white/85 shadow-glass">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
            <Megaphone className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider">
            Promote Your Telegram Channel
          </h3>
        </div>
        <p className="text-xs text-sky-800/80 leading-relaxed mt-1">
          Acquire verified, real Telegram members. Rewards are dynamically split and credited as users complete verified joins!
        </p>
      </div>

      {/* Package Selection */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold text-sky-950 uppercase tracking-wider px-1">
          1. Choose Promotion Tier
        </h4>

        <div className="grid grid-cols-1 gap-2.5">
          {packages.map((pkg) => {
            const isSelected = selectedPkgId === pkg.id;

            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPkgId(pkg.id)}
                className={`rounded-2xl p-4 glass-card cursor-pointer transition-all duration-200 border relative ${
                  isSelected
                    ? "border-sky-500 ring-2 ring-sky-400/40 bg-sky-50/90 shadow-md"
                    : "border-white/80 hover:border-sky-200"
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                    {pkg.badge || "MOST POPULAR"}
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-sky-950">
                      {pkg.title}
                    </h5>
                    <div className="text-xs font-semibold text-sky-700">
                      {pkg.members.toLocaleString()} Real Active Members
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-sky-950">
                      ₹{pkg.price_inr.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-sky-600 font-bold">
                      Fixed One-Time
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-sky-200/50 flex flex-wrap gap-2 text-[11px] text-sky-800">
                  {pkg.features.map((feat, idx) => (
                    <span key={idx} className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3-Step Execution Form */}
      <form onSubmit={handlePromoteSubmit} className="rounded-2xl p-4 glass-card border border-white/80 space-y-4">
        <h5 className="text-xs font-bold text-sky-950 uppercase tracking-wider">
          2. Complete Verification & Payment
        </h5>

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Promotion Request Submitted!</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Admin is verifying your payment and bot admin privileges. Once approved, your channel will go live with real-time member progress!
            </p>
          </div>
        )}

        {/* Step A: Channel username */}
        <div>
          <label className="block text-[11px] font-bold text-sky-900 mb-1">
            Channel Username or Link
          </label>
          <input
            type="text"
            required
            placeholder="e.g. @MyCryptoChannel or https://t.me/..."
            value={channelInput}
            onChange={(e) => setChannelInput(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 border border-sky-200 text-xs text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 font-medium"
          />
        </div>

        {/* Step B: Mandatory Bot Administrator Instruction */}
        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-300/80 space-y-2 text-xs">
          <div className="flex items-start gap-2 text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Important Requirement:</span>
              <p className="text-[11px] text-amber-900 mt-0.5 leading-tight">
                Add our bot <strong className="font-mono">{botHandle}</strong> as an <strong>Administrator</strong> in your channel before submitting so our API can verify member joins.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={botAdminConfirmed}
              onChange={(e) => setBotAdminConfirmed(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-400"
            />
            <span className="text-[11px] font-bold text-amber-950">
              I have added {botHandle} as Channel Admin
            </span>
          </label>
        </div>

        {/* Step C: Payment Card */}
        <div className="p-3.5 rounded-xl bg-sky-100/70 border border-sky-200 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-bold text-sky-900">Total Payment Due:</span>
            <span className="text-base font-black text-sky-950">₹{selectedPkg.price_inr}</span>
          </div>

          <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] text-sky-700 font-semibold block">Pay to Official UPI ID:</span>
              <span className="font-mono font-bold text-sky-950 text-xs truncate block">{adminUpi}</span>
            </div>

            <button
              type="button"
              onClick={handleCopyUpi}
              className="px-2.5 py-1.5 rounded-lg bg-white text-sky-800 font-bold text-[11px] flex items-center gap-1 shadow-xs active:scale-95 border border-sky-200"
            >
              {copiedUpi ? (
                <>
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy UPI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step D: Payment Proof Input */}
        <div>
          <label className="block text-[11px] font-bold text-sky-900 mb-1">
            Payment UTR / Transaction Reference (12 digits)
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 429183920192"
            value={utrInput}
            onChange={(e) => setUtrInput(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 border border-sky-200 text-xs text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 font-mono font-bold"
          />
        </div>

        {/* Step E: Contact and DM Screenshot Option */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-bold text-sky-900">
              Your Telegram Handle (@username)
            </label>
            <button
              type="button"
              onClick={handleDmAdminScreenshot}
              className="text-[11px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 underline"
            >
              <Camera className="w-3 h-3" />
              <span>DM Screenshot on Telegram</span>
            </button>
          </div>

          <input
            type="text"
            required
            placeholder="e.g. @channel_owner"
            value={contactInput}
            onChange={(e) => setContactInput(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 border border-sky-200 text-xs text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 font-medium"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !botAdminConfirmed}
          className="w-full btn-tactile-sky py-3 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-tactile-btn mt-2 disabled:opacity-50"
        >
          <span>Submit for Admin Approval & Live Launch</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
