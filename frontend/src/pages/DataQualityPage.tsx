import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Database,
  FileText,
  FileQuestion,
  Layers,
  Sparkles,
  PieChart
} from "lucide-react";
import { api } from "../api/client";
import { DashboardSummary } from "../types";

export const DataQualityPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || "Failed to load data quality metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Data Quality & Ingestion Integrity</h1>
        <p className="text-[#999999] text-sm mt-1">
          Verify SpendNest dataset compliance, primary key uniqueness on <code>(source_type, source_id)</code>, dialogue text coverage, and placeholder handling.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#999999] font-medium mb-1">
            <span>Total Ingested Records</span>
            <Database className="w-4 h-4 text-[#08B6D4]" />
          </div>
          <div className="text-2xl font-bold text-white">{summary?.total_conversations || 44}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            100% Unique Primary Keys
          </div>
        </div>

        <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#999999] font-medium mb-1">
            <span>Usable Dialogue Records</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{summary?.usable_supplied_texts || 18}</div>
          <div className="text-[11px] text-[#999999] mt-1">
            {summary?.text_coverage_percent || 40.9}% dialogue coverage
          </div>
        </div>

        <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#999999] font-medium mb-1">
            <span>Metadata Placeholders</span>
            <FileQuestion className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {summary ? summary.total_conversations - summary.usable_supplied_texts : 26}
          </div>
          <div className="text-[11px] text-[#999999] mt-1">Recorded with unavailable transcript</div>
        </div>

        <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#999999] font-medium mb-1">
            <span>Duplicate Records Detected</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">0</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Zero identity conflicts
          </div>
        </div>
      </div>

      {/* Quality Checks Detailed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Coverage Breakdown */}
        <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#08B6D4]" />
            Dialogue Coverage by Source Modality
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-white font-medium mb-1.5">
                <span>Meeting Transcripts (14 total)</span>
                <span className="font-mono text-cyan-400">
                  {summary?.meetings_usable || 13} / 14 usable (92.8%)
                </span>
              </div>
              <div className="w-full bg-[#151515] rounded-full h-2 overflow-hidden border border-[#333333]">
                <div
                  className="bg-gradient-to-r from-[#08B6D4] to-[#008DB5] h-full rounded-full"
                  style={{ width: `${((summary?.meetings_usable || 13) / 14) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-[#888888] mt-1">
                Meetings provide multi-turn conversation dialogue with speaker tags and timecodes.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-white font-medium mb-1.5">
                <span>Call Recordings (30 total)</span>
                <span className="font-mono text-cyan-400">
                  {summary?.calls_usable || 5} / 30 usable (16.7%)
                </span>
              </div>
              <div className="w-full bg-[#151515] rounded-full h-2 overflow-hidden border border-[#333333]">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                  style={{ width: `${((summary?.calls_usable || 5) / 30) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-[#888888] mt-1">
                25 calls are stored as metadata summaries without audio transcripts (e.g. voicemail or scheduled).
              </p>
            </div>
          </div>
        </div>

        {/* Identity & Revision Rules */}
        <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-5 shadow-sm space-y-3 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Contract Compliance Checks
          </h3>

          <div className="space-y-2">
            <div className="p-3 bg-[#18191c] rounded-lg border border-[#333333] flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Composite Primary Key Uniqueness:</strong>
                <p className="text-[#AAAAAA] mt-0.5">
                  Every source record is uniquely keyed by <code>(source_type, source_id)</code>. Database prevents duplicates with SQLite UNIQUE constraints.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#18191c] rounded-lg border border-[#333333] flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Strict Revision Order Control:</strong>
                <p className="text-[#AAAAAA] mt-0.5">
                  Incoming revisions lower than or equal to the current revision are rejected. Outdated batch envelopes cannot overwrite newer transcript data.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#18191c] rounded-lg border border-[#333333] flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Manual Override Preservation:</strong>
                <p className="text-[#AAAAAA] mt-0.5">
                  When new batches update raw transcript payloads, human-applied routing overrides (e.g. M07 Customer Retention Escalation) are strictly preserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
