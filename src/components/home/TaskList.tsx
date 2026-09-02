"use client";

import React, { useState } from "react";
import { Check, ExternalLink, Loader2, Send, Users, Award } from "lucide-react";
import confetti from "canvas-confetti";
import { ChannelTask } from "@/types";

interface TaskListProps {
  tasks: ChannelTask[];
  completedTaskIds: string[];
  onVerifyTask: (taskId: string, channelId: string) => Promise<boolean>;
  onOpenChannel: (url: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  completedTaskIds,
  onVerifyTask,
  onOpenChannel,
}) => {
  // Track state for tasks that have been opened/joined by the user
  const [openedTaskIds, setOpenedTaskIds] = useState<Record<string, boolean>>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const handleJoinClick = (task: ChannelTask) => {
    setOpenedTaskIds((prev) => ({ ...prev, [task.id]: true }));
    onOpenChannel(task.channel_link);
  };

  const handleVerifyClick = async (task: ChannelTask) => {
    setVerifyingId(task.id);
    const success = await onVerifyTask(task.id, task.username);
    setVerifyingId(null);

    if (success) {
      // Trigger festive celebration confetti
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#38BDF8", "#0284C7", "#F59E0B", "#10B981"],
        });
      } catch (e) {
        // Confetti fallback
      }
    }
  };

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider">
            Channel Join Tasks
          </h3>
        </div>
        <span className="text-[11px] font-bold text-sky-700/80 bg-sky-100/80 px-2.5 py-0.5 rounded-full border border-sky-200/60">
          Instant Coin Rewards
        </span>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const isDone = completedTaskIds.includes(task.id);
          const hasJoined = openedTaskIds[task.id];
          const isVerifying = verifyingId === task.id;

          return (
            <div
              key={task.id}
              className={`rounded-2xl p-4 glass-card transition-all duration-200 flex items-center justify-between gap-3 border border-white/80 ${
                isDone ? "opacity-75 bg-slate-100/50" : "hover:border-sky-300/80"
              }`}
            >
              {/* Channel Avatar & Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-sky-200 p-0.5 shadow-sm shrink-0 border border-white">
                  {task.avatar_url ? (
                    <img
                      src={task.avatar_url}
                      alt={task.title}
                      className="w-full h-full object-cover rounded-[14px]"
                    />
                  ) : (
                    <div className="w-full h-full rounded-[14px] bg-sky-100 flex items-center justify-center text-sky-700 font-black">
                      <Send className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-sky-950 truncate">
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-sky-700/80 font-medium">
                    <span>{task.username}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {task.joined_count} joined
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button & Reward Badge */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[11px] font-black text-amber-600 bg-amber-100/80 border border-amber-300/50 px-2 py-0.5 rounded-full">
                  +{task.reward_coins} Coins
                </span>

                {isDone ? (
                  <button
                    disabled
                    className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-slate-200/80 text-slate-500 text-xs font-bold cursor-not-allowed"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Done</span>
                  </button>
                ) : hasJoined ? (
                  <button
                    onClick={() => handleVerifyClick(task)}
                    disabled={isVerifying}
                    className="btn-tactile-sky px-4 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Verify</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoinClick(task)}
                    className="btn-tactile-glass px-4 py-1.5 rounded-xl text-sky-900 text-xs font-extrabold flex items-center gap-1.5 shadow-sm border border-sky-200"
                  >
                    <span>Join</span>
                    <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
