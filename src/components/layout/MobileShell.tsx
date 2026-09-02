"use client";

import React from "react";

interface MobileShellProps {
  children: React.ReactNode;
}

export const MobileShell: React.FC<MobileShellProps> = ({ children }) => {
  return (
    <div className="h-[100dvh] w-full liquid-sky-bg flex justify-center items-center py-0 sm:py-6 overflow-hidden">
      {/* Dynamic Ambient Blur Glow Elements */}
      <div className="fixed top-12 left-1/4 w-72 h-72 bg-sky-300/40 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />
      <div className="fixed bottom-20 right-1/4 w-80 h-80 bg-cyan-200/50 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Native-style Mobile Device Frame */}
      <main className="w-full max-w-md h-[100dvh] sm:h-[880px] sm:rounded-[44px] sm:border-[6px] sm:border-white/60 sm:shadow-2xl flex flex-col relative bg-sky-50/40 backdrop-blur-md overflow-hidden">
        {children}
      </main>
    </div>
  );
};
