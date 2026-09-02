"use client";

import { useEffect, useState, useCallback } from "react";
import { TelegramUser } from "@/types";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: TelegramUser;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        enableClosingConfirmation: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        openTelegramLink: (url: string) => void;
        openLink: (url: string) => void;
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      try {
        tg.enableClosingConfirmation();
        tg.setHeaderColor("#F0F9FF");
        tg.setBackgroundColor("#F0F9FF");
      } catch (e) {
        // ignore in older clients
      }

      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
        setIsTelegram(true);
      } else {
        // Fallback simulated user for browser testing
        setUser({
          id: 92837461,
          first_name: "Demo Earner",
          username: "demo_user",
        });
        setIsTelegram(false);
      }
    } else {
      // Browser preview fallback
      setUser({
        id: 92837461,
        first_name: "Demo Earner",
        username: "demo_user",
      });
      setIsTelegram(false);
    }
    setIsReady(true);
  }, []);

  const triggerHaptic = useCallback(
    (style: "light" | "medium" | "heavy" = "light") => {
      if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
      }
    },
    []
  );

  const triggerNotificationHaptic = useCallback(
    (type: "success" | "error" | "warning") => {
      if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
      }
    },
    []
  );

  const openLink = useCallback((url: string) => {
    if (typeof window !== "undefined") {
      if (window.Telegram?.WebApp?.openTelegramLink && url.startsWith("https://t.me/")) {
        window.Telegram.WebApp.openTelegramLink(url);
      } else if (window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(url);
      } else {
        window.open(url, "_blank");
      }
    }
  }, []);

  return {
    user,
    isTelegram,
    isReady,
    triggerHaptic,
    triggerNotificationHaptic,
    openLink,
  };
}
