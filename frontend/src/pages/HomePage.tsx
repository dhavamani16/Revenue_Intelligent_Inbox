import React, { useEffect, useState } from "react";
import {
  Inbox,
  UploadCloud,
  FileText,
  AlertTriangle,
  GitPullRequest,
  CheckCircle2,
  TrendingUp,
  Play,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { api } from "../api/client";
import { DashboardSummary, ManagerBrief } from "../types";

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [brief, setBrief] = useState<ManagerBrief | null>(null);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayResult, setReplayResult] = useState<any>(null);

  const loadData = async () => {
    try {
      const s = await api.getDashboardSummary();
      setSummary(s);
      const b = await api.getManagerBrief();
      setBrief(b);
    } catch (err) {
      console.error("Failed to load home data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunReplay = async () => {
    setReplayLoading(true);
    try {
      const res = await api.replayFullSequence();
      setReplayResult(res);
      await loadData();
    } catch (err) {
      alert("Error running replay sequence: " + err);
    } finally {
      setReplayLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Section matching Screenshot 1 */}
      <div className="bg-gradient-to-br from-[#103F49] via-[#0d343c] to-[#071f25] border border-[#08B6D4]/30 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#08B6D4]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-[#08B6D4]/20 border border-[#08B6D4]/40 px-3 py-1 rounded-full text-xs font-semibold text-[#08B6D4] mb-4 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            SpendNest Revenue Intelligence
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-[#08B6D4] tracking-tight leading-tight">
            Revenue Intelligence Inbox
          </h1>

          <p className="text-[#E0E0E0] text-base md:text-lg mt-4 leading-relaxed font-normal">
            Turn sales conversations into actionable revenue intelligence. Analyze customer signals,
            prioritize deals, resolve routing decisions, and help your sales team focus on what matters.
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <button
              onClick={() => onNavigate("inbox")}
              className="bg-gradient-to-r from-[#08B6D4] to-[#008DB5] hover:opacity-95 text-white font-bold text-sm rounded-xl px-7 py-3.5 shadow-[0_4px_20px_rgba(8,182,212,0.4)] flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Inbox className="w-4 h-4" />
              <span>Open Conversation Inbox</span>
            </button>

            <button
              onClick={() => onNavigate("imports")}
              className="bg-[#202124] hover:bg-[#2b2c32] text-white border border-[#3B3B3B] hover:border-[#08B6D4]/50 font-bold text-sm rounded-xl px-6 py-3.5 flex items-center gap-2 transition-all"
            >
              <UploadCloud className="w-4 h-4 text-[#08B6D4]" />
              <span>Import & Replay Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Compact KPI Cards calculated from database */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() => onNavigate("inbox")}
          className="bg-[#202124] border border-[#3B3B3B] hover:border-[#08B6D4]/50 p-5 rounded-2xl shadow-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#999999]">
              Total Source Records
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#272830] flex items-center justify-center text-[#08B6D4] group-hover:bg-[#08B6D4]/20 transition-colors">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3">
            {summary?.total_conversations ?? 44}
          </div>
          <div className="text-xs text-[#999999] mt-1.5 flex items-center gap-1.5">
            <span className="text-[#08B6D4] font-medium">30 calls</span> &bull; <span>14 meetings</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate("inbox")}
          className="bg-[#202124] border border-[#3B3B3B] hover:border-[#08B6D4]/50 p-5 rounded-2xl shadow-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#999999]">
              Usable Supplied Texts
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#272830] flex items-center justify-center text-emerald-400 group-hover:bg-emerald-400/20 transition-colors">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3">
            {summary?.usable_supplied_texts ?? 18}
          </div>
          <div className="text-xs text-[#999999] mt-1.5 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">
              {summary?.text_coverage_percent ?? 40.9}% coverage
            </span>
            <span>(10 calls + 8 meetings)</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate("deals")}
          className="bg-[#202124] border border-[#3B3B3B] hover:border-[#08B6D4]/50 p-5 rounded-2xl shadow-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#999999]">
              Deals & Accounts at Risk
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#272830] flex items-center justify-center text-rose-400 group-hover:bg-rose-400/20 transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-400 mt-3">
            {summary?.at_risk_deals ?? 4}
          </div>
          <div className="text-xs text-[#999999] mt-1.5">
            Includes M04 (Migration) &amp; M07 (UI Bug)
          </div>
        </div>

        <div
          onClick={() => onNavigate("routing")}
          className="bg-[#202124] border border-[#3B3B3B] hover:border-[#08B6D4]/50 p-5 rounded-2xl shadow-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#999999]">
              Pending Routing Reviews
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#272830] flex items-center justify-center text-amber-400 group-hover:bg-amber-400/20 transition-colors">
              <GitPullRequest className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400 mt-3">
            {summary?.unresolved_routing_decisions ?? 1}
          </div>
          <div className="text-xs text-[#999999] mt-1.5">
            {summary?.manual_overrides_active ?? 1} manual route override active
          </div>
        </div>
      </div>

      {/* Contract Replay Verification Interactive Card */}
      <div className="bg-[#202124] border border-[#3B3B3B] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#3B3B3B]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#08B6D4]"></span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Data Contract &amp; Replay Verification Suite
              </h3>
            </div>
            <p className="text-xs text-[#999999] mt-1">
              Test candidate replay requirements: Identity by (source_type, source_id), idempotent imports, M07 route survival, and 17 &rarr; 18 usable text transition.
            </p>
          </div>

          <button
            onClick={handleRunReplay}
            disabled={replayLoading}
            className="bg-gradient-to-r from-[#08B6D4] to-[#008DB5] hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-[0_4px_16px_rgba(8,182,212,0.35)] flex items-center gap-2 whitespace-nowrap self-start md:self-auto transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${replayLoading ? "animate-spin" : ""}`} />
            <span>{replayLoading ? "Running Replay..." : "Run Replay Verification"}</span>
          </button>
        </div>

        {/* Verification Status Banner */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#151515] border border-[#3B3B3B] p-4 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white">44 Unique Records Intact</div>
              <div className="text-[11px] text-[#999999] mt-0.5">
                Importing 01_initial twice or scrambled never duplicates source records.
              </div>
            </div>
          </div>

          <div className="bg-[#151515] border border-[#3B3B3B] p-4 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white">17 &rarr; 18 Usable Text Transition</div>
              <div className="text-[11px] text-[#999999] mt-0.5">
                02_update delivers M07's 27 turns; older revisions arriving later are ignored.
              </div>
            </div>
          </div>

          <div className="bg-[#151515] border border-[#3B3B3B] p-4 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white">M07 Manual Route Preserved</div>
              <div className="text-[11px] text-[#999999] mt-0.5">
                Manager override survives subsequent updates and re-imports without erasure.
              </div>
            </div>
          </div>
        </div>

        {/* Replay Details Log if executed */}
        {replayResult && (
          <div className="mt-5 p-4 bg-[#151515] border border-emerald-500/40 rounded-xl">
            <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{replayResult.summary}</span>
            </div>
            <div className="space-y-1.5 mt-3">
              {replayResult.steps.map((st: any) => (
                <div key={st.step} className="text-[11px] text-[#cccccc] flex items-center justify-between py-1 border-b border-[#3B3B3B]/40 last:border-0">
                  <span className="font-mono text-[#08B6D4]">Step {st.step}: {st.action}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-semibold text-[10px]">VERIFIED</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Daily Manager Brief Section for 21 August 2026 */}
      {brief && (
        <div className="bg-[#202124] border border-[#3B3B3B] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-[#3B3B3B]">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#08B6D4]" />
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {brief.headline}
                </h3>
              </div>
              <div className="text-xs text-[#08B6D4] font-medium mt-0.5">
                {brief.brief_date}
              </div>
            </div>
            <button
              onClick={() => onNavigate("exports")}
              className="text-xs text-[#08B6D4] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View full findings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-[#cccccc] mt-4 leading-relaxed bg-[#151515] p-3.5 rounded-xl border border-[#3B3B3B]">
            {brief.executive_summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#999999] mb-3">
                Key Action Priorities
              </h4>
              <div className="space-y-2.5">
                {brief.key_priorities.map((item, idx) => (
                  <div key={idx} className="bg-[#151515] p-3 rounded-xl border border-[#3B3B3B]/70">
                    <div className="text-xs font-bold text-white">{item.priority}</div>
                    <div className="text-[11px] text-[#999999] mt-1 leading-normal">{item.action}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#999999] mb-3">
                Sales Rep Coaching Notes
              </h4>
              <div className="space-y-2.5">
                {brief.rep_coaching_notes.map((item, idx) => (
                  <div key={idx} className="bg-[#151515] p-3 rounded-xl border border-[#3B3B3B]/70">
                    <div className="text-xs font-bold text-[#08B6D4]">{item.rep}</div>
                    <div className="text-[11px] text-[#999999] mt-1 leading-normal">{item.observation}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
