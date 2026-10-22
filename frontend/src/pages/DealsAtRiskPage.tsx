import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  TrendingDown,
  ArrowRight,
  FileText,
  DollarSign,
  UserCheck,
  ChevronRight,
  Zap,
  ExternalLink
} from "lucide-react";
import { api } from "../api/client";

export const DealsAtRiskPage: React.FC<{ onNavigateToConversation?: (ref: string) => void }> = () => {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAtRiskDeals();
      setDeals(data.at_risk_records);
    } catch (err: any) {
      setError(err.message || "Failed to load at-risk deals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const criticalCount = deals.filter((d) => d.deal_risk === "Critical").length;
  const highCount = deals.filter((d) => d.deal_risk === "High").length;
  const mediumCount = deals.filter((d) => d.deal_risk === "Medium").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Deals at Risk & Retention Priorities</h1>
        <p className="text-[#999999] text-sm mt-1">
          Monitor conversations exhibiting critical budget blocks, implementation friction, and churn indicators requiring sales leadership intervention.
        </p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#999999] font-medium mb-1">
            <span>Total At-Risk Deals</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white">{deals.length}</div>
          <div className="text-[11px] text-[#888888] mt-1">Requiring proactive management</div>
        </div>

        <div className="bg-[#202124] border border-red-900/40 rounded-xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-red-300 font-medium mb-1">
            <span>Critical Severity</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
          <div className="text-[11px] text-red-300/70 mt-1">Immediate churn / cancellation threat</div>
        </div>

        <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-amber-300 font-medium mb-1">
            <span>High Severity</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{highCount}</div>
          <div className="text-[11px] text-[#888888] mt-1">Budget stall or terms mismatch</div>
        </div>

        <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#999999] font-medium mb-1">
            <span>Medium Severity</span>
            <TrendingDown className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">{mediumCount}</div>
          <div className="text-[11px] text-[#888888] mt-1">Timing delays or technical questions</div>
        </div>
      </div>

      {/* Focus Alert Card */}
      <div className="bg-[#103F49] border border-cyan-800/60 rounded-xl p-5 shadow-sm text-white">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-[#08B6D4] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-cyan-200">
              Executive Notice: Two Urgent Revenue Blockers Identified
            </h3>
            <p className="text-xs text-white/90 leading-relaxed">
              1. <strong>M04 (Prestige Logistics)</strong>: CFO vetoed invoice terms requiring immediate prepaid tier transition or custom payment schedule.
              <br />
              2. <strong>M07 (Apex Dynamics)</strong>: Unresolved payment description defect causing finance workflow friction; requires Customer Retention Escalation.
            </p>
          </div>
        </div>
      </div>

      {/* Deals List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#999999]">
            Ranked Risk Analysis (By Risk Score)
          </h2>
          <button
            onClick={loadDeals}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[#08B6D4] hover:text-[#008DB5] font-medium cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#999999] bg-[#202124] border border-[#3B3B3B] rounded-xl">
            <RotateCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#08B6D4]" />
            Analyzing risk patterns...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-400 bg-[#202124] border border-[#3B3B3B] rounded-xl">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            {error}
          </div>
        ) : deals.length === 0 ? (
          <div className="py-16 text-center text-[#999999] bg-[#202124] border border-[#3B3B3B] rounded-xl">
            No at-risk deals identified. All active accounts meet health thresholds.
          </div>
        ) : (
          deals.map((deal) => {
            const isCritical = deal.deal_risk === "Critical";
            const isHigh = deal.deal_risk === "High";
            const citations = deal.evidence_citations || [];

            return (
              <div
                key={`${deal.source_type}_${deal.source_id}`}
                className="bg-[#202124] border border-[#3B3B3B] hover:border-cyan-800/60 rounded-xl p-5 shadow-sm space-y-4 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Title & Ref */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white px-2 py-0.5 rounded bg-[#151515] border border-[#3B3B3B]">
                        {deal.record_ref}
                      </span>
                      <span className="text-xs text-[#999999] uppercase font-semibold">
                        {deal.source_type}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded ${
                          isCritical
                            ? "bg-red-950 text-red-300 border border-red-800"
                            : isHigh
                            ? "bg-rose-950/80 text-rose-300 border border-rose-800"
                            : "bg-amber-950/60 text-amber-300 border border-amber-800"
                        }`}
                      >
                        Risk Level: {deal.deal_risk}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{deal.title_or_direction}</h3>
                    <div className="text-xs text-[#999999] flex items-center gap-3">
                      <span>Rep: <strong className="text-[#CCCCCC]">{deal.rep_or_organizer}</strong></span>
                      <span>•</span>
                      <span>Assigned Route: <strong className="text-cyan-400">{deal.assigned_route}</strong></span>
                      <span>•</span>
                      <span>Owner: <strong className="text-white">{deal.target_owner}</strong></span>
                    </div>
                  </div>

                  {/* Score Indicator */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] text-[#999999] block font-medium">Risk Score</span>
                      <span
                        className={`text-2xl font-black font-mono ${
                          isCritical ? "text-red-400" : isHigh ? "text-rose-400" : "text-amber-400"
                        }`}
                      >
                        {deal.deal_risk_score}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Risk Factors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#2d2e33]">
                  <div className="p-3 bg-[#18191c] rounded-lg border border-[#333333]">
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                      Identified Risk Drivers
                    </span>
                    {deal.risk_factors && deal.risk_factors.length > 0 ? (
                      <ul className="text-xs text-[#CCCCCC] space-y-1">
                        {deal.risk_factors.map((rf: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-rose-400">•</span>
                            <span>{rf}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-[#888888]">General deal stall or contract ambiguity.</p>
                    )}
                  </div>

                  <div className="p-3 bg-[#18191c] rounded-lg border border-[#333333]">
                    <span className="text-xs font-bold text-[#08B6D4] uppercase tracking-wider block mb-1">
                      Executive Intervention Strategy
                    </span>
                    <p className="text-xs text-white leading-relaxed">
                      {deal.recommended_action || "Schedule follow-up review with rep to confirm customer requirements."}
                    </p>
                  </div>
                </div>

                {/* Evidence citations */}
                {citations && citations.length > 0 && (
                  <div className="p-3 bg-[#151515] border border-cyan-950 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-[#08B6D4] text-[11px] uppercase tracking-wider">
                      Direct Conversation Quote Evidence:
                    </div>
                    <blockquote className="text-[#DDDDDD] italic pl-2 border-l-2 border-[#08B6D4]">
                      "{citations[0].quote}" — <span className="font-mono text-cyan-400">{citations[0].citation_label}</span>
                    </blockquote>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
