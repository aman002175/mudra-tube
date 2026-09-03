"use client";

import React from "react";
import { CheckCircle2, Gift, Megaphone, Wallet, User } from "lucide-react";

export type TabType = "tasks" | "offerwalls" | "promote" | "wallet" | "profile";

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingWithdrawalsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  pendingWithdrawalsCount = 0,
}) => {
  interface NavItem {
    id: TabType;
    label: string;
    icon: any;
    badge?: number;
  }

  const tabs: NavItem[] = [
    { id: "tasks", label: "Tasks", icon: CheckCircle2 },
    { id: "offerwalls", label: "Offers", icon: Gift },
    { id: "promote", label: "Promote", icon: Megaphone },
    { id: "wallet", label: "Wallet", icon: Wallet, badge: pendingWithdrawalsCount },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="fixed sm:absolute bottom-0 left-0 right-0 max-w-md mx-auto z-40 px-4 pb-4 pt-2 pointer-events-none">
      <nav className="glass-elevated rounded-3xl p-1.5 flex items-center justify-around shadow-xl shadow-sky-950/15 border border-white/95 pointer-events-auto backdrop-blur-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-gradient-to-b from-sky-400 to-sky-600 text-white shadow-md shadow-sky-500/30 font-bold"
                  : "text-sky-800/70 hover:text-sky-950 font-medium"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">
                {tab.label}
              </span>

              {/* Optional Notification Badge */}
              {(tab.badge || 0) > 0 && !isActive && (
                <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
