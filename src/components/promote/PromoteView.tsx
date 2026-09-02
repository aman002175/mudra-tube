"use client";

import React, { useState } from "react";
import { Megaphone, Check, Sparkles, Send, ShieldCheck, ArrowRight } from "lucide-react";
import { PromoPackage } from "@/types";

interface PromoteViewProps {
  packages: PromoPackage[];
  onSubmitPromotion: (data: {
    channel: string;
    members: number;
    contact: string;
    packageId?: string;
  }) => Promise<boolean>;
}

export const PromoteView: React.FC<PromoteViewProps> = ({
  packages,
  onSubmitPromotion,
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>(packages[1]?.id || "");
  const [channelInput, setChannelInput] = useState("");
  const [contactInput, setContactInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedPkg = packages.find((p) => p.id === selectedPkgId) || packages[0];

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelInput.trim() || !contactInput.trim()) return;

    setIsSubmitting(true);
    const ok = await onSubmitPromotion({
      channel: channelInput.trim(),
      members: selectedPkg.members,
      contact: contactInput.trim(),
      packageId: selectedPkg.id,
    });
    setIsSubmitting(false);

    if (ok) {
      setSuccess(true);
      setChannelInput("");
      setContactInput("");
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  return (
    <div className="space-y-4 px-1 pb-6">
      {/* Intro Header */}
      <div className="rounded-squircle glass-card p-5 border border-white/85 shadow-glass">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
            <Megaphone className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider">
            Promote Your Channel
          </h3>
        </div>
        <p className="text-xs text-sky-800/80 leading-relaxed mt-1">
          Get real, active Telegram members verified via official Telegram Bot API with zero dropouts.
        </p>
      </div>

      {/* Package Selection */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold text-sky-950 uppercase tracking-wider px-1">
          Choose Promotion Tier
        </h4>

        <div className="grid grid-cols-1 gap-3">
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
                    {pkg.badge || "RECOMMENDED"}
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-sky-950">
                      {pkg.title}
                    </h5>
                    <div className="text-xs font-semibold text-sky-700">
                      {pkg.members.toLocaleString()} Real Members
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-sky-950">
                      ₹{pkg.price_inr.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-sky-600 font-bold">
                      One-time
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-sky-200/50 flex flex-wrap gap-2 text-[11px] text-sky-800">
                  {pkg.features.slice(0, 2).map((feat, idx) => (
                    <span key={idx} className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{feat}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Application Form */}
      <form onSubmit={handlePromoteSubmit} className="rounded-2xl p-4 glass-card border border-white/80 space-y-3">
        <h5 className="text-xs font-bold text-sky-950 uppercase tracking-wider">
          Campaign Details
        </h5>

        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            🎉 Promotion request submitted! Our admin will review and launch your campaign within 2 hours.
          </div>
        )}

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

        <div>
          <label className="block text-[11px] font-bold text-sky-900 mb-1">
            Your Telegram Contact (@handle)
          </label>
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
          disabled={isSubmitting}
          className="w-full btn-tactile-sky py-3 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-tactile-btn mt-2"
        >
          <span>Submit Campaign for Admin Approval</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
