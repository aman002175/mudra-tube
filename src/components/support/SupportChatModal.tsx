"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, ShieldCheck, CheckCheck, Clock, HelpCircle, ExternalLink, Copy } from "lucide-react";
import { SupportChatMessage, UserProfile, GlobalConfig } from "@/types";

interface SupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  messages: SupportChatMessage[];
  config?: GlobalConfig;
  onSendMessage: (text: string) => void;
}

export const SupportChatModal: React.FC<SupportChatModalProps> = ({
  isOpen,
  onClose,
  user,
  messages,
  config,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState("");
  const [view, setView] = useState<"options" | "direct">("options");
  const [copied, setCopied] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Filter strictly for this user (1-to-1 privacy guaranteed)
  const userChatHistory = messages.filter((m) => m.user_id === user.user_id);

  useEffect(() => {
    if (isOpen) {
      setView("options"); // Reset view on open
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && view === "direct") {
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isOpen, view, userChatHistory.length]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const copyUid = () => {
    navigator.clipboard.writeText(user.user_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const helpDeskLink = config?.help_desk_url || "https://t.me/mudratubehelpdesk";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-sky-950/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-[82vh] max-h-[640px] glass-elevated rounded-squircle border border-white/90 shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-white/80 glass-elevated flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-sm border border-white">
                <HelpCircle className="w-5 h-5" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-sky-950">
                  {view === "options" ? "Help & Support" : "Official Admin Chat"}
                </h3>
              </div>
              <p className="text-[11px] text-sky-700 font-medium">
                Your ID: <span className="font-bold font-mono">{user.user_id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view === "direct" && (
              <button
                onClick={() => setView("options")}
                className="px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white text-sky-800 font-bold text-xs active:scale-95 transition-all border border-sky-200"
              >
                Back
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/70 hover:bg-white text-rose-600 flex items-center justify-center active:scale-95 transition-all border border-rose-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {view === "options" ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-center space-y-2 mb-6 mt-4">
              <h2 className="text-lg font-black text-sky-950">How can we help you?</h2>
              <p className="text-xs text-sky-700 font-medium max-w-[280px] mx-auto">
                Choose a method below to resolve your issues related to withdrawals, tasks, or promotions.
              </p>
            </div>

            <div className="space-y-3">
              {/* Option 1: Help Desk Group */}
              <div className="p-4 rounded-2xl glass-card border border-white/80 shadow-sm space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-100 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-sky-950">Telegram Help Desk</h3>
                    <p className="text-[10px] text-sky-700 mt-0.5">Community & Support Group</p>
                  </div>
                </div>
                
                <p className="text-xs text-sky-800/90 leading-relaxed font-medium">
                  Send screenshots and proofs of your issue here. <span className="font-bold text-rose-600">Important:</span> Include your UID in the message so admins can solve your issue quickly.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={copyUid}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-slate-200"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? "Copied!" : "Copy My UID"}</span>
                  </button>
                  <a
                    href={helpDeskLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-[2] py-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1a8bc0] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-[#229ED9]/30"
                  >
                    <span>Open Telegram Group</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Option 2: Direct Admin Chat */}
              <div className="p-4 rounded-2xl glass-card border border-white/80 shadow-sm space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-sky-950">Direct Admin Chat</h3>
                    <p className="text-[10px] text-sky-700 mt-0.5">In-App Private Messaging</p>
                  </div>
                </div>
                
                <p className="text-xs text-sky-800/90 leading-relaxed font-medium">
                  Message the admin directly inside the app. Check back here to see admin replies and issue resolution status.
                </p>

                <button
                  onClick={() => setView("direct")}
                  className="w-full py-2.5 mt-1 rounded-xl btn-tactile-sky text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-tactile-btn"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open Private Chat</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Chat History Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {userChatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-sky-800">
                  <div className="w-14 h-14 rounded-3xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-inner">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-sky-950">Start Conversation</h4>
                    <p className="text-xs text-sky-700/80 mt-1 max-w-xs leading-relaxed">
                      Describe your issue clearly. Admin will investigate and reply here.
                    </p>
                  </div>
                </div>
              ) : (
                userChatHistory.map((msg) => {
                  const isAdmin = msg.sender === "admin";
                  
                  // Simple logic to detect if the admin resolved it based on keywords
                  const isSolved = isAdmin && (msg.message.toLowerCase().includes("solved") || msg.message.toLowerCase().includes("resolved"));

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-sky-700/70 font-semibold">
                        {isAdmin ? (
                          <span className={`font-bold flex items-center gap-1 ${isSolved ? 'text-emerald-700' : 'text-sky-900'}`}>
                            {isSolved ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <ShieldCheck className="w-3 h-3 text-sky-600" />}
                            <span>Admin</span>
                            {isSolved && <span className="ml-1 px-1.5 rounded bg-emerald-100 border border-emerald-300">SOLVED</span>}
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
                            ? isSolved ? "bg-emerald-50 text-emerald-950 rounded-tl-sm border border-emerald-200" : "bg-white/90 text-sky-950 rounded-tl-sm border border-sky-100"
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
                placeholder="Type your message..."
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
          </>
        )}
      </div>
    </div>
  );
};
