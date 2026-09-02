"use client";

import React from "react";
import { Gift, Sparkles, ShieldCheck, Clock, CheckCircle2, Zap } from "lucide-react";
import { UserProfile } from "@/types";

interface OfferwallViewProps {
  user: UserProfile;
  onOpenOfferwall: (provider: string) => void;
}

export const OfferwallView: React.FC<OfferwallViewProps> = ({ user }) => {
  return (
    <div className="space-y-4 px-1 pb-4 animate-in fade-in duration-200">
      {/* Banner Card */}
      <div className="rounded-squircle glass-card p-5 border border-white/85 shadow-glass relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-extrabold text-sky-800 bg-sky-100/90 px-2.5 py-0.5 rounded-full border border-sky-200">
            No Video Ads
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            Auto-Tag: #{user.user_id}
          </span>
        </div>

        <h3 className="text-lg font-black text-sky-950 tracking-tight">
          CPA Rewards & Surveys
        </h3>
        <p className="text-xs text-sky-800/80 mt-1 leading-relaxed">
          High-paying sponsor offers where users complete surveys, play apps, and earn massive coin bonuses with zero invasive video ads.
        </p>
      </div>

      {/* Integration Status Card */}
      <div className="rounded-2xl p-6 glass-card border border-white/80 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-400 to-sky-200 text-sky-800 flex items-center justify-center mx-auto shadow-md border border-white">
          <Clock className="w-8 h-8" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300/60 text-xs font-black uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Integration in Progress</span>
          </div>
          <h4 className="text-sm font-bold text-sky-950">
            Offerwall Modules Under Activation
          </h4>
          <p className="text-xs text-sky-700/80 mt-1.5 max-w-xs mx-auto leading-relaxed">
            We are configuring official postback callbacks for Monlix & Wannads CPA networks. Once the admin enables live offers, tasks will appear here automatically!
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-sky-100/80 text-left text-xs">
          <div className="p-3 rounded-xl bg-white/60 border border-white flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-sky-900 font-semibold">
              App Installs & Game Quests (Up to +2,500 Coins)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white/60 border border-white flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-sky-900 font-semibold">
              3-Minute Consumer Surveys (Instant Approval)
            </span>
          </div>
        </div>

        <div className="pt-1 text-[11px] text-sky-600 font-medium">
          💡 In the meantime, join available channels in the <strong>Tasks</strong> tab to earn instant coins!
        </div>
      </div>
    </div>
  );
};
