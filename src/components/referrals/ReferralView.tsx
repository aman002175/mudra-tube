"use client";

import React, { useState } from "react";
import { Users, Copy, Share2, Gift, TrendingUp, UserPlus, CheckCircle, X, QrCode, Send } from "lucide-react";
import { UserProfile, GlobalConfig } from "@/types";

interface ReferralViewProps {
  user: UserProfile;
  config: GlobalConfig;
  allUsers: UserProfile[];
  botUsername: string;
}

export const ReferralView: React.FC<ReferralViewProps> = ({
  user,
  config,
  allUsers,
  botUsername,
}) => {
  const [copied, setCopied] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);

  const isEnabled = config.referral_system_enabled ?? false;
  const rewardType = config.referral_reward_type || "withdrawal_percentage";
  const rewardAmount = config.referral_reward_amount ?? 0;

  // Build referral link: https://t.me/BOT_USERNAME?start=USER_ID
  const cleanBot = (botUsername || config.bot_username || "mudratube_bot").replace("@", "");
  const referralLink = `https://t.me/${cleanBot}?start=${user.user_id}`;

  // allUsers is already pre-filtered referrals from the API
  const myReferrals = allUsers;
  const totalEarnings = user.referral_earnings ?? 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = () => {
    setShowSharePopup(true);
  };

  const shareToTelegram = () => {
    const text = `🚀 Join MudraTube and earn real cash by completing simple Telegram tasks!\n\n💰 Start earning now:\n${referralLink}`;
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("🚀 Join MudraTube & earn real cash! 💰")}`
      );
    } else {
      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("🚀 Join MudraTube & earn real cash! 💰")}`,
        "_blank"
      );
    }
  };

  if (!isEnabled) {
    return (
      <div className="space-y-5 px-1 pb-4">
        <div className="rounded-2xl p-8 glass-card text-center space-y-3 border border-white/60">
          <div className="w-14 h-14 rounded-3xl bg-sky-100 text-sky-500 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-sky-950">Referral Program</h3>
          <p className="text-xs text-sky-700/80">
            The referral program is currently not active. Check back later!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-1 pb-4">
      {/* Hero Card */}
      <div className="rounded-squircle glass-card p-5 border border-white/85 shadow-glass relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-sky-950">Invite & Earn 💸</h3>
            <p className="text-[10px] text-sky-700 font-medium">
              {rewardType === "withdrawal_percentage"
                ? `Earn ${rewardAmount}% from every withdrawal your referrals make!`
                : `Get ₹${rewardAmount} bonus for every friend who joins!`}
            </p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">Your Invite Link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-xl bg-white/90 border border-sky-200 font-mono font-bold text-sky-950 text-[11px] truncate select-all">
              {referralLink}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCopy}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${
                copied
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : "bg-white/80 text-sky-800 border-sky-200 hover:bg-white"
              }`}
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-[#229ED9] to-[#1a8bc0] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-[#229ED9]/30"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Share / QR Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl glass-card border border-white/80 text-center shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-1.5">
            <UserPlus className="w-4 h-4" />
          </div>
          <div className="text-lg font-black text-sky-950">{myReferrals.length}</div>
          <div className="text-[9px] font-bold text-sky-700 uppercase">Friends Joined</div>
        </div>

        <div className="p-3 rounded-2xl glass-card border border-white/80 text-center shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1.5">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-lg font-black text-emerald-700">₹{totalEarnings.toFixed(2)}</div>
          <div className="text-[9px] font-bold text-emerald-700 uppercase">Total Earned</div>
        </div>

        <div className="p-3 rounded-2xl glass-card border border-white/80 text-center shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-1.5">
            <Gift className="w-4 h-4" />
          </div>
          <div className="text-lg font-black text-purple-700">
            {rewardType === "withdrawal_percentage" ? `${rewardAmount}%` : `₹${rewardAmount}`}
          </div>
          <div className="text-[9px] font-bold text-purple-700 uppercase">Per Referral</div>
        </div>
      </div>

      {/* How it Works */}
      <div className="rounded-2xl glass-card p-4 border border-white/80 shadow-sm space-y-3">
        <h4 className="text-xs font-extrabold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
          📋 How It Works
        </h4>
        <div className="space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-800 flex items-center justify-center font-black text-[10px] shrink-0">1</span>
            <p className="text-sky-800 font-medium">Share your invite link with friends on Telegram</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-800 flex items-center justify-center font-black text-[10px] shrink-0">2</span>
            <p className="text-sky-800 font-medium">When they open the bot and start using MudraTube, they get linked to you</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-black text-[10px] shrink-0">3</span>
            <p className="text-emerald-800 font-bold">
              {rewardType === "withdrawal_percentage"
                ? `Every time they withdraw, you earn ${rewardAmount}% of their withdrawal amount automatically!`
                : `You instantly receive ₹${rewardAmount} bonus when they join!`}
            </p>
          </div>
        </div>
      </div>

      {/* Referred Users List */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold text-sky-950 uppercase tracking-wider px-1 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-sky-600" />
          My Referrals ({myReferrals.length})
        </h4>

        {myReferrals.length === 0 ? (
          <div className="rounded-2xl p-5 glass-card text-center border border-white/60 space-y-2">
            <p className="text-xs font-bold text-sky-900">No referrals yet</p>
            <p className="text-[11px] text-sky-700/80">
              Share your link above to start earning from referrals!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {myReferrals.slice(0, 20).map((ref) => (
              <div key={ref.user_id} className="rounded-xl p-3 glass-card border border-white/70 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-black text-[11px] shrink-0">
                    {(ref.first_name || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sky-950">{ref.first_name || ref.username}</div>
                    <div className="text-[10px] text-sky-700/70">
                      Joined {new Date(ref.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                  Active ✓
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share / QR Code Glassmorphism Popup */}
      {showSharePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-[2rem] glass-elevated border border-white p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowSharePopup(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-sky-100/50 hover:bg-sky-200 text-sky-800 rounded-full flex items-center justify-center transition-colors active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6" />
            </div>
            
            <h3 className="text-lg font-black text-sky-950 mb-1">Share Referral Link</h3>
            <p className="text-xs text-sky-700/80 mb-5 font-medium px-4">
              Let your friends scan this QR Code or share the link directly to earn rewards.
            </p>

            {/* QR Code Display */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-sky-100 mb-5">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralLink)}`}
                alt="Referral QR Code"
                className="w-40 h-40 rounded-xl"
              />
            </div>

            {/* Link & Copy */}
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2 bg-white/80 border border-sky-200 rounded-xl p-1.5">
                <div className="flex-1 overflow-hidden">
                  <p className="text-[11px] font-mono font-bold text-sky-900 truncate pl-2">
                    {referralLink}
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    copied ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700 hover:bg-sky-200"
                  }`}
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <button
                onClick={shareToTelegram}
                className="w-full py-3 rounded-xl bg-[#229ED9] hover:bg-[#1a8bc0] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-[#229ED9]/30"
              >
                <Send className="w-4 h-4" />
                Send via Telegram
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
