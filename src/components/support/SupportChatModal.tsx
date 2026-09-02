"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, ShieldCheck, CheckCheck, Clock } from "lucide-react";
import { SupportChatMessage, UserProfile } from "@/types";

interface SupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  messages: SupportChatMessage[];
  onSendMessage: (text: string) => void;
}

export const SupportChatModal: React.FC<SupportChatModalProps> = ({
  isOpen,
  onClose,
  user,
  messages,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Filter strictly for this user (1-to-1 privacy guaranteed)
  const userChatHistory = messages.filter((m) => m.user_id === user.user_id);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isOpen, userChatHistory.length]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-sky-950/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-[82vh] max-h-[640px] glass-elevated rounded-squircle border border-white/90 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-white/80 glass-elevated flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-sm border border-white">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-sky-950">Official Admin Support</h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full border border-emerald-300">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-sky-700 font-medium">
                1-to-1 Private Desk • Account #{user.user_id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/70 hover:bg-white text-sky-800 flex items-center justify-center active:scale-95 transition-all border border-sky-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {userChatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-sky-800">
              <div className="w-14 h-14 rounded-3xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-inner">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-sky-950">How can we assist you today?</h4>
                <p className="text-xs text-sky-700/80 mt-1 max-w-xs leading-relaxed">
                  Send a message directly to the Admin regarding withdrawals, coin rewards, or promotional campaigns. Admin replies appear here!
                </p>
              </div>
            </div>
          ) : (
            userChatHistory.map((msg) => {
              const isAdmin = msg.sender === "admin";

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-sky-700/70 font-semibold">
                    {isAdmin ? (
                      <span className="font-bold text-sky-900 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-sky-600" />
                        <span>Admin</span>
                      </span>
                    ) : (
                      <span>You</span>
                    )}
                    <span>•</span>
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                      isAdmin
                        ? "bg-white/90 text-sky-950 rounded-tl-sm border border-sky-100"
                        : "btn-tactile-sky text-white rounded-tr-sm"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-white/80 glass-elevated flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            required
            placeholder="Type your message to Admin..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/90 border border-sky-200 text-xs text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 font-medium"
          />

          <button
            type="submit"
            className="btn-tactile-sky px-4 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
