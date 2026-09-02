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
        enableClosingConfirmation?: () => void;
        disableClosingConfirmation?: () => void;
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
        // Disable annoying "Changes may not be saved" popup when closing the Mini App
        if (tg.disableClosingConfirmation) {
          tg.disableClosingConfirmation();
        }
        tg.setHeaderColor("#F0F9FF");
        tg.setBackgroundColor("#F0F9FF");
      } catch (e) {
        // ignore in older clients
      }

      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
        setIsTelegram(true);
      } else {
        setUser(null);
        setIsTelegram(false);
      }
    } else {
      setUser(null);
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
