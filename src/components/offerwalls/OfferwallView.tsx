"use client";

import React from "react";
import { Gift, ExternalLink, Sparkles, ShieldCheck, Flame, Smartphone, CheckCircle } from "lucide-react";
import { UserProfile } from "@/types";

interface OfferwallViewProps {
  user: UserProfile;
  onOpenOfferwall: (provider: string) => void;
}

export const OfferwallView: React.FC<OfferwallViewProps> = ({
  user,
  onOpenOfferwall,
}) => {
  const offerwallPartners = [
    {
      id: "monlix",
      name: "Monlix Mini Offers",
      tag: "Best for Mobile & Telegram",
      payout_rate: "High (Up to +2,500 Coins)",
      icon: Smartphone,
      isHot: true,
      description: "Install quick gaming apps, reach level 5, and get massive coin drops.",
    },
    {
      id: "wannads",
      name: "Wannads Surveys & Tasks",
      tag: "Fast Approval",
      payout_rate: "Medium (Up to +1,200 Coins)",
      icon: Gift,
      isHot: false,
      description: "Complete simple 3-minute opinion surveys and earn instant credits.",
    },
    {
      id: "cpalead",
      name: "CPALead Quick Quizzes",
      tag: "Zero Install",
      payout_rate: "Instant (Up to +450 Coins)",
      icon: Flame,
      isHot: false,
      description: "Answer basic knowledge questions with dynamic subid tracking.",
    },
  ];

  return (
    <div className="space-y-4 px-1 pb-4">
      {/* Banner Card */}
      <div className="rounded-squircle glass-card p-5 border border-white/85 shadow-glass relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-extrabold text-sky-800 bg-sky-100/90 px-2.5 py-0.5 rounded-full border border-sky-200">
            No Video Ads Needed
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            Auto-Tagged: #{user.user_id}
          </span>
        </div>

        <h3 className="text-lg font-black text-sky-950 tracking-tight">
          CPA Rewards & Surveys
        </h3>
        <p className="text-xs text-sky-800/80 mt-1 leading-relaxed">
          Complete high-paying sponsor offers. Rewards are automatically credited to your balance via dynamic tracking.
        </p>
      </div>

      {/* Offerwalls Grid */}
      <div className="space-y-3">
        {offerwallPartners.map((partner) => {
          const Icon = partner.icon;

          return (
            <div
              key={partner.id}
              className="rounded-2xl p-4 glass-card border border-white/80 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-300 flex items-center justify-center text-white shadow-sm border border-white">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-sky-950">
                        {partner.name}
                      </h4>
                      {partner.isHot && (
                        <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          HOT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                      {partner.payout_rate}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-sky-800/80 leading-snug">
                {partner.description}
              </p>

              <button
                onClick={() => onOpenOfferwall(partner.id)}
                className="w-full btn-tactile-sky py-2.5 px-4 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Launch {partner.name}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
