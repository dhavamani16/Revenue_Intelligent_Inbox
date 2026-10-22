import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Sliders,
  Database,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  GitBranch,
  Shield,
  Layers
} from "lucide-react";
import { api } from "../api/client";

export const SettingsPage: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await api.getRoutingRules();
      setRules(data.rules);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleResetDatabase = async () => {
    if (!window.confirm("Are you sure you want to clean and reset all records in the SQLite database?")) {
      return;
    }
    setResetting(true);
    setMessage(null);
    try {
      const res = await api.resetDatabase();
      setMessage(res.message);
      // Automatically re-seed initial data
      await api.replayInitial();
      setMessage("Database reset and re-seeded with SpendNest initial dataset (44 records, 17 usable).");
    } catch (err: any) {
      alert("Reset failed: " + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Configuration & Rules</h1>
        <p className="text-[#999999] text-sm mt-1">
          Inspect deterministic routing rules, active database status, and manage persistent storage.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {message}
        </div>
      )}

      {/* Routing Rules Table */}
      <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2d2e33]">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#08B6D4]" />
              Active Routing Engine Rules ({rules.length})
            </h2>
            <p className="text-xs text-[#999999] mt-0.5">
              Rules are evaluated in ascending priority order. The first rule matching keyword/stage criteria claims the conversation.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#18191c] text-[#999999] border-b border-[#2d2e33]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Priority</th>
                <th className="py-2.5 px-3 font-semibold">Rule Name</th>
                <th className="py-2.5 px-3 font-semibold">Target Route</th>
                <th className="py-2.5 px-3 font-semibold">Default Owner</th>
                <th className="py-2.5 px-3 font-semibold">Keywords / Conditions</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2e33]">
              {rules.map((r) => (
                <tr key={r.id} className="hover:bg-[#272830]/60">
                  <td className="py-3 px-3 font-mono text-cyan-400 font-bold">#{r.priority}</td>
                  <td className="py-3 px-3 font-semibold text-white">{r.rule_name}</td>
                  <td className="py-3 px-3 text-[#08B6D4] font-medium">{r.target_route}</td>
                  <td className="py-3 px-3 text-[#CCCCCC]">{r.target_owner} ({r.target_team})</td>
                  <td className="py-3 px-3 text-[#999999] font-mono text-[11px] max-w-xs truncate">
                    {r.condition_keywords || "General stage filter"}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-[#08B6D4]" />
            Persistent Storage Configuration
          </h3>
          <div className="space-y-2 text-xs text-[#CCCCCC]">
            <div className="flex justify-between py-1.5 border-b border-[#2d2e33]">
              <span className="text-[#999999]">Engine:</span>
              <strong className="text-white">SQLite 3 (WAL Mode, Timeout 30s)</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#2d2e33]">
              <span className="text-[#999999]">Primary Key Invariant:</span>
              <code className="text-cyan-300">(source_type, source_id)</code>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#2d2e33]">
              <span className="text-[#999999]">Audit Trail:</span>
              <span className="text-emerald-400 font-semibold">Enabled (Immutable Append-Only)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[#999999]">API Base URL:</span>
              <span className="font-mono text-[#08B6D4]">http://localhost:8000/api</span>
            </div>
          </div>
        </div>

        {/* Database Clean & Reset */}
        <div className="bg-[#202124] border border-red-900/40 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Reset & Re-seed Environment
          </h3>
          <p className="text-xs text-[#999999] leading-relaxed">
            Cleans all source records, routing decisions, manual corrections, and analyses from the local SQLite database and immediately re-seeds the pristine initial SpendNest dataset.
          </p>
          <button
            onClick={handleResetDatabase}
            disabled={resetting}
            className="px-4 py-2 bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {resetting ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                Resetting Database...
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                Reset & Reseed Initial Dataset
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
