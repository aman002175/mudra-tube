"use client";

import React from "react";
import { Save, Users } from "lucide-react";
import { GlobalConfig } from "@/types";

interface SettingsInputs {
  min_withdrawal_inr: string;
  ton_rate_inr: string;
  default_task_reward_inr: string;
  min_rate_per_member_inr: string;
  admin_profit_cut_percent: number;
  admin_upi_id: string;
  admin_telegram_handle: string;
  bot_username: string;
  channel_tasks_enabled: boolean;
  offerwalls_enabled: boolean;
  custom_service_enabled: boolean;
  custom_service_title: string;
  custom_service_telegram: string;
  custom_total_users_count: string;
  help_desk_url: string;
  referral_system_enabled: boolean;
  referral_reward_type: "flat_bonus" | "withdrawal_percentage";
  referral_reward_amount: string;
}

interface AdminSettingsPanelProps {
  settingsInputs: SettingsInputs;
  setSettingsInputs: (inputs: SettingsInputs) => void;
  setIsSettingsDirty: (dirty: boolean) => void;
  usersList: any[];
  withdrawals: any[];
  handleSaveConfig: () => void;
  configSaving: boolean;
  configSavedToast: boolean;
}

export const AdminSettingsPanel: React.FC<AdminSettingsPanelProps> = ({
  settingsInputs,
  setSettingsInputs,
  setIsSettingsDirty,
  usersList,
  withdrawals,
  handleSaveConfig,
  configSaving,
  configSavedToast,
}) => {
  const update = (partial: Partial<SettingsInputs>) => {
    setIsSettingsDirty(true);
    setSettingsInputs({ ...settingsInputs, ...partial });
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-white space-y-4 max-w-xl">
      <h3 className="text-sm font-extrabold text-sky-950 uppercase tracking-wider">
        Global Platform Controls
      </h3>

      <div className="space-y-3 text-xs">
        {/* DATABASE STATUS */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-emerald-950 flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Database Engine & Cloud Sync</span>
            </span>
            <span className="text-[11px] font-mono font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300">
              🟢 Active & Connected
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-900">
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              <span className="block text-slate-500 text-[10px] font-bold">Total Registered Users</span>
              <span className="font-mono font-black text-sm text-emerald-900">{usersList.length}</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              <span className="block text-slate-500 text-[10px] font-bold">Total Withdrawal Tickets</span>
              <span className="font-mono font-black text-sm text-emerald-900">{withdrawals.length}</span>
            </div>
          </div>
          <p className="text-[10px] text-emerald-700 leading-relaxed">
            Persistent disk database is active. All user registrations, balance updates, and settings changes are saved permanently.
          </p>
        </div>

        {/* Min Withdrawal */}
        <div>
          <label className="block font-bold text-sky-900 mb-1">Minimum Withdrawal Threshold (₹ INR)</label>
          <input
            type="text"
            inputMode="decimal"
            value={settingsInputs.min_withdrawal_inr}
            onChange={(e) => update({ min_withdrawal_inr: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-white/80 border border-sky-200 font-bold text-sky-950"
            placeholder="10"
          />
          <span className="text-[10px] text-sky-600 block mt-0.5">e.g. ₹10, ₹50, ₹100</span>
        </div>

        {/* TON Rate */}
        <div>
          <label className="block font-bold text-sky-900 mb-1">TON Crypto Exchange Rate (₹ INR per 1 TON)</label>
          <input
            type="text"
            inputMode="decimal"
            value={settingsInputs.ton_rate_inr}
            onChange={(e) => update({ ton_rate_inr: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-white/80 border border-sky-200 font-bold text-sky-950"
            placeholder="500"
          />
        </div>

        {/* Task Reward */}
        <div>
          <label className="block font-bold text-sky-900 mb-1">Default Task Reward (₹ INR per verified join)</label>
          <input
            type="text"
            inputMode="decimal"
            value={settingsInputs.default_task_reward_inr}
            onChange={(e) => update({ default_task_reward_inr: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-white/80 border border-sky-200 font-bold text-sky-950"
            placeholder="1.50"
          />
        </div>

        {/* Min Rate Per Member */}
        <div>
          <label className="block font-bold text-sky-900 mb-1">Minimum Rate Per Member Floor (₹ INR)</label>
          <input
            type="text"
            inputMode="decimal"
            value={settingsInputs.min_rate_per_member_inr}
            onChange={(e) => update({ min_rate_per_member_inr: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-white/80 border border-sky-200 font-bold text-sky-950"
            placeholder="2.0"
          />
        </div>

        {/* Admin Profit Cut Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="font-bold text-sky-900">Admin Revenue Cut (%)</label>
            <span className="font-black text-sky-950 bg-sky-100 px-2 py-0.5 rounded-md">
              {settingsInputs.admin_profit_cut_percent}% Admin / {100 - Number(settingsInputs.admin_profit_cut_percent)}% Users
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={90}
            step={5}
            value={settingsInputs.admin_profit_cut_percent}
            onChange={(e) => update({ admin_profit_cut_percent: parseInt(e.target.value) || 60 })}
            className="w-full accent-sky-600 h-2 bg-sky-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Admin UPI */}
        <div>
          <label className="block font-bold text-sky-900 mb-1">Admin Receiving UPI ID</label>
          <input
            type="text"
            value={settingsInputs.admin_upi_id}
            onChange={(e) => update({ admin_upi_id: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-white/80 border border-sky-200 font-mono font-bold text-sky-950"
            placeholder="yourname@paytm"
          />
        </div>

        {/* Admin Telegram */}
        <div>
          <label className="block font-bold text-sky-900 mb-1">Admin Telegram Handle</label>
          <input
            type="text"
            value={settingsInputs.admin_telegram_handle}
            onChange={(e) => update({ admin_telegram_handle: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-white/80 border border-sky-200 font-mono font-bold text-sky-950"
            placeholder="@MudraAdmin"
          />
        </div>

        {/* Bot Username */}
        <div>
          <label className="block font-bold text-sky-900 mb-1">Bot Username</label>
          <input
            type="text"
            value={settingsInputs.bot_username}
            onChange={(e) => update({ bot_username: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-white/80 border border-sky-200 font-mono font-bold text-sky-950"
            placeholder="@MudraTube_bot"
          />
        </div>

        {/* Custom Users Count */}
        <div className="p-3.5 rounded-2xl bg-sky-50/90 border border-sky-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-sky-950 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-sky-600" />
              <span>Total Platform Users Header Display</span>
            </label>
            <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-sky-200 text-sky-800">
              Live: {usersList.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={settingsInputs.custom_total_users_count}
              onChange={(e) => update({ custom_total_users_count: e.target.value })}
              className="flex-1 px-3 py-2 rounded-xl bg-white border border-sky-200 font-bold text-sky-950"
              placeholder="0 = show live count"
            />
            <button
              type="button"
              onClick={() => update({ custom_total_users_count: String(usersList.length) })}
              className="px-3 py-2 rounded-xl bg-white border border-sky-200 text-sky-800 font-bold hover:bg-sky-100 active:scale-95 text-xs"
            >
              Sync Live
            </button>
          </div>
        </div>

        {/* Custom Service Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-purple-50 to-indigo-50 border border-purple-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-bold text-purple-950">🚀 Custom Solution Banner</label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settingsInputs.custom_service_enabled}
                onChange={(e) => update({ custom_service_enabled: e.target.checked })}
                className="rounded text-purple-600"
              />
              <span className="font-bold text-purple-900 text-xs">Active</span>
            </label>
          </div>
          <input
            type="text"
            value={settingsInputs.custom_service_title}
            onChange={(e) => update({ custom_service_title: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 font-bold text-purple-950 text-xs"
            placeholder="Banner text..."
          />
          <input
            type="text"
            value={settingsInputs.custom_service_telegram}
            onChange={(e) => update({ custom_service_telegram: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 font-mono font-bold text-purple-950 text-xs"
            placeholder="@developer"
          />
        </div>

        {/* Help Desk URL */}
        <div className="p-3.5 rounded-2xl bg-white/70 border border-sky-100 space-y-3">
          <label className="block font-bold text-sky-950 mb-1">Telegram Help Desk URL</label>
          <input
            type="text"
            value={settingsInputs.help_desk_url}
            onChange={(e) => update({ help_desk_url: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 font-mono font-bold text-sky-950 text-xs"
            placeholder="https://t.me/mudratubehelpdesk"
          />
        </div>

        {/* REFERRAL SYSTEM */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-bold text-emerald-950">👥 Referral Program</label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settingsInputs.referral_system_enabled}
                onChange={(e) => update({ referral_system_enabled: e.target.checked })}
                className="rounded text-emerald-600"
              />
              <span className="font-bold text-emerald-900 text-xs">Active</span>
            </label>
          </div>

          {settingsInputs.referral_system_enabled && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block font-bold text-emerald-900 mb-1 text-[11px]">Reward Type</label>
                <select
                  value={settingsInputs.referral_reward_type}
                  onChange={(e) => update({ referral_reward_type: e.target.value as "flat_bonus" | "withdrawal_percentage" })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-200 font-bold text-emerald-950 text-xs"
                >
                  <option value="withdrawal_percentage">Percentage Cut on Withdrawal (%)</option>
                  <option value="flat_bonus">Flat Bonus on Join (₹)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-emerald-900 mb-1 text-[11px]">
                  Reward Amount ({settingsInputs.referral_reward_type === "withdrawal_percentage" ? "%" : "₹"})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settingsInputs.referral_reward_amount}
                  onChange={(e) => update({ referral_reward_amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-200 font-bold text-emerald-950 text-xs"
                  placeholder="e.g. 2"
                />
                <p className="text-[10px] text-emerald-700/80 mt-1">
                  {settingsInputs.referral_reward_type === "withdrawal_percentage"
                    ? "When referred user withdraws, this % is cut and added to referrer's balance."
                    : "Referrer gets this flat ₹ amount immediately when a new user joins via their link."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Feature Toggles */}
        <div className="pt-2 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settingsInputs.channel_tasks_enabled}
              onChange={(e) => update({ channel_tasks_enabled: e.target.checked })}
              className="rounded text-sky-600"
            />
            <span className="font-bold text-sky-900">Enable Channel Join Tasks</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settingsInputs.offerwalls_enabled}
              onChange={(e) => update({ offerwalls_enabled: e.target.checked })}
              className="rounded text-sky-600"
            />
            <span className="font-bold text-sky-900">Enable CPA Offerwalls</span>
          </label>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
          ✓ Changes persist to database and take effect immediately.
        </div>

        {/* Save Button */}
        <div className="pt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={configSaving}
            className="btn-tactile-sky px-5 py-2.5 rounded-xl text-white font-extrabold text-xs flex items-center gap-2 active:scale-95 shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>{configSaving ? "Saving..." : "Save All Platform Settings"}</span>
          </button>
          {configSavedToast && (
            <span className="text-emerald-700 font-bold text-xs bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 animate-in fade-in">
              ✓ Settings saved!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
