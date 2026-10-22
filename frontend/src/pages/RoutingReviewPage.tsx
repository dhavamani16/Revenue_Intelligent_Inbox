import React, { useState, useEffect } from "react";
import {
  GitFork,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  X,
  FileText,
  Clock,
  Sparkles,
  Info
} from "lucide-react";
import { api } from "../api/client";

export const RoutingReviewPage: React.FC = () => {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOverride, setFilterOverride] = useState("");
  const [filterRoute, setFilterRoute] = useState("");

  // Override Modal
  const [overrideModalRecord, setOverrideModalRecord] = useState<any | null>(null);
  const [newRoute, setNewRoute] = useState("Customer Retention Escalation");
  const [targetOwner, setTargetOwner] = useState("Elena Rostova");
  const [targetTeam, setTargetTeam] = useState("Customer Success");
  const [overrideReason, setOverrideReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadDecisions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (filterStatus) params.status = filterStatus;
      if (filterOverride !== "") params.is_manual_override = filterOverride;
      if (filterRoute) params.assigned_route = filterRoute;

      const res = await api.getRoutingDecisions(params);
      setDecisions(res.decisions);
    } catch (err: any) {
      setError(err.message || "Failed to load routing decisions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecisions();
  }, [filterStatus, filterOverride, filterRoute]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDecisions();
  };

  const handleApprove = async (record: any) => {
    try {
      await api.approveRoute(record.source_type, record.source_id, {
        reviewer: "Sales Manager",
        reason: `Approved automated recommendation for ${record.assigned_route}`
      });
      loadDecisions();
    } catch (err: any) {
      alert("Failed to approve route: " + err.message);
    }
  };

  const openOverrideModal = (record: any) => {
    setOverrideModalRecord(record);
    setNewRoute(record.assigned_route || "Customer Retention Escalation");
    setTargetOwner(record.target_owner || "Elena Rostova");
    setTargetTeam(record.target_team || "Customer Success");
    setOverrideReason(
      record.record_ref === "M07"
        ? "Payment description save defect requires Customer Retention Escalation"
        : ""
    );
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModalRecord) return;
    setSubmitting(true);
    try {
      await api.overrideRoute(overrideModalRecord.source_type, overrideModalRecord.source_id, {
        new_route: newRoute,
        target_owner: targetOwner,
        target_team: targetTeam,
        override_reason: overrideReason || "Manager manual override",
        reviewer: "Sales Manager"
      });
      setOverrideModalRecord(null);
      loadDecisions();
    } catch (err: any) {
      alert("Failed to override route: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Routing Decisions & Review Queue</h1>
          <p className="text-[#999999] text-sm mt-1">
            Review automated routing determinations, evaluate matched rule evidence, and enforce persistent manager overrides.
          </p>
        </div>
        <div className="bg-[#182a30] border border-cyan-900/60 rounded-xl px-4 py-2.5 text-xs text-cyan-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#08B6D4] shrink-0" />
          <span>Overrides persist through re-imports and batch updates</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by record ref (e.g. M07, M04), route, owner, or organizer..."
              className="w-full pl-10 pr-4 py-2 bg-[#151515] border border-[#3B3B3B] rounded-lg text-sm text-[#F5F5F5] placeholder-[#666666] focus:outline-none focus:border-[#08B6D4]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-gradient-to-r from-[#08B6D4] to-[#008DB5] hover:opacity-95 text-white font-medium text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Filter className="w-4 h-4" />
            Filter Queue
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#2d2e33]">
          <div>
            <label className="text-[11px] font-medium text-[#999999] block mb-1">Review Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-[#151515] border border-[#3B3B3B] rounded-md px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#08B6D4]"
            >
              <option value="">All Review Statuses</option>
              <option value="suggested">Suggested (Pending Review)</option>
              <option value="approved">Approved</option>
              <option value="overridden">Manually Overridden</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#999999] block mb-1">Override Status</label>
            <select
              value={filterOverride}
              onChange={(e) => setFilterOverride(e.target.value)}
              className="w-full bg-[#151515] border border-[#3B3B3B] rounded-md px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#08B6D4]"
            >
              <option value="">All</option>
              <option value="1">Manual Overrides Only</option>
              <option value="0">Automated Rules Only</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#999999] block mb-1">Target Route</label>
            <select
              value={filterRoute}
              onChange={(e) => setFilterRoute(e.target.value)}
              className="w-full bg-[#151515] border border-[#3B3B3B] rounded-md px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#08B6D4]"
            >
              <option value="">All Routes</option>
              <option value="Customer Retention Escalation">Customer Retention Escalation</option>
              <option value="Customer Success Retention">Customer Success Retention</option>
              <option value="Mid-Market Expansion">Mid-Market Expansion</option>
              <option value="Enterprise Sales">Enterprise Sales</option>
              <option value="Partner Ecosystem">Partner Ecosystem</option>
              <option value="Core Sales Triage">Core Sales Triage</option>
            </select>
          </div>
        </div>
      </div>

      {/* Decisions List / Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-[#999999] bg-[#202124] border border-[#3B3B3B] rounded-xl">
            <RotateCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#08B6D4]" />
            Loading routing decisions...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-400 bg-[#202124] border border-[#3B3B3B] rounded-xl">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            {error}
          </div>
        ) : decisions.length === 0 ? (
          <div className="py-16 text-center text-[#999999] bg-[#202124] border border-[#3B3B3B] rounded-xl">
            No routing decisions found matching current criteria.
          </div>
        ) : (
          decisions.map((d) => {
            const isOverridden = d.is_manual_override === 1;
            const citations = d.evidence_citations ? (typeof d.evidence_citations === 'string' ? JSON.parse(d.evidence_citations) : d.evidence_citations) : [];

            return (
              <div
                key={`${d.source_type}_${d.source_id}`}
                className={`bg-[#202124] border rounded-xl p-5 transition-all shadow-sm ${
                  isOverridden ? "border-cyan-500/50 bg-[#162227]/40" : "border-[#3B3B3B] hover:border-[#4B4B4B]"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Record identity, rule, title */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white px-2 py-0.5 rounded bg-[#151515] border border-[#3B3B3B]">
                        {d.record_ref}
                      </span>
                      <span className="text-xs text-[#999999] uppercase font-semibold">
                        {d.source_type}
                      </span>
                      {isOverridden ? (
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-cyan-950 text-cyan-300 border border-cyan-700 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          Manual Override
                        </span>
                      ) : d.status === "approved" ? (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-950/50 text-amber-300 border border-amber-800">
                          Suggested (Pending Review)
                        </span>
                      )}

                      {d.matched_rule_id && (
                        <span className="px-2 py-0.5 text-[11px] font-mono text-[#AAAAAA] bg-[#1a1b1e] border border-[#333333] rounded">
                          Rule: {d.matched_rule_id}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white">
                      {d.title_or_direction}
                    </h3>

                    <div className="text-xs text-[#999999] flex flex-wrap items-center gap-3">
                      <span>Rep: <strong className="text-[#CCCCCC]">{d.rep_or_organizer}</strong></span>
                      <span>•</span>
                      <span>Target Rep: <strong className="text-cyan-400">{d.target_owner}</strong> ({d.target_team})</span>
                      <span>•</span>
                      <span>Confidence: <strong className="text-white">{Math.round((d.confidence_score || 0.8) * 100)}%</strong></span>
                    </div>

                    {/* Routing Rationale & Override Note */}
                    <div className="pt-2 text-xs text-[#CCCCCC] space-y-1">
                      <p>
                        <strong className="text-[#08B6D4]">Routing Logic: </strong>
                        {d.routing_reason || "Automated rule evaluation based on customer size and deal stage."}
                      </p>
                      {isOverridden && d.override_reason && (
                        <p className="text-cyan-300 bg-cyan-950/40 p-2 rounded border border-cyan-800/40">
                          <strong>Manager Override Note: </strong>
                          {d.override_reason} (by {d.override_by || "Sales Manager"} at {new Date(d.override_at || "").toLocaleString()})
                        </p>
                      )}
                    </div>

                    {/* Evidence quote if available */}
                    {citations && citations.length > 0 && (
                      <div className="mt-2 text-xs bg-[#151515] border border-[#333333] p-2.5 rounded-lg flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 text-[#08B6D4] shrink-0 mt-0.5" />
                        <span className="text-[#BBBBBB] italic">
                          "{citations[0].quote}" — <span className="font-mono text-cyan-400">{citations[0].citation_label}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Route Badge & Actions */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#2d2e33]">
                    <div className="text-right">
                      <div className="text-[11px] text-[#999999] font-medium">Assigned Destination</div>
                      <div className="text-sm font-bold text-white px-3 py-1 rounded-md bg-[#151515] border border-cyan-900/60 mt-0.5">
                        {d.assigned_route}
                      </div>
                      {d.suggested_route && d.suggested_route !== d.assigned_route && (
                        <div className="text-[11px] text-[#888888] line-through mt-0.5">
                          Originally: {d.suggested_route}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {d.status !== "approved" && !isOverridden && (
                        <button
                          onClick={() => handleApprove(d)}
                          className="px-3 py-1.5 bg-[#1b1c1e] hover:bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => openOverrideModal(d)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-[#08B6D4] to-[#008DB5] hover:opacity-95 text-white font-medium text-xs rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {isOverridden ? "Edit Override" : "Override Route"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Override Modal */}
      {overrideModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#3B3B3B]">
              <div className="flex items-center gap-2">
                <GitFork className="w-5 h-5 text-[#08B6D4]" />
                <h3 className="text-base font-bold text-white">
                  Override Route for {overrideModalRecord.record_ref}
                </h3>
              </div>
              <button
                onClick={() => setOverrideModalRecord(null)}
                className="text-[#999999] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOverride} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#CCCCCC] block mb-1">New Destination Route</label>
                <select
                  value={newRoute}
                  onChange={(e) => setNewRoute(e.target.value)}
                  className="w-full bg-[#151515] border border-[#3B3B3B] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#08B6D4]"
                >
                  <option value="Customer Retention Escalation">Customer Retention Escalation</option>
                  <option value="Customer Success Retention">Customer Success Retention</option>
                  <option value="Mid-Market Expansion">Mid-Market Expansion</option>
                  <option value="Enterprise Sales">Enterprise Sales</option>
                  <option value="Partner Ecosystem">Partner Ecosystem</option>
                  <option value="Core Sales Triage">Core Sales Triage</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#CCCCCC] block mb-1">Target Rep / Owner</label>
                  <input
                    type="text"
                    value={targetOwner}
                    onChange={(e) => setTargetOwner(e.target.value)}
                    className="w-full bg-[#151515] border border-[#3B3B3B] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#08B6D4]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#CCCCCC] block mb-1">Target Sales Team</label>
                  <input
                    type="text"
                    value={targetTeam}
                    onChange={(e) => setTargetTeam(e.target.value)}
                    className="w-full bg-[#151515] border border-[#3B3B3B] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#08B6D4]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#CCCCCC] block mb-1">
                  Manager Justification (Required for Audit Trail)
                </label>
                <textarea
                  rows={3}
                  required
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why this conversation is routed away from the automated rule (e.g. M07 payment defect requires Customer Retention Escalation)..."
                  className="w-full bg-[#151515] border border-[#3B3B3B] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#08B6D4]"
                />
              </div>

              <div className="p-3 bg-[#18232c] border border-cyan-900/60 rounded-lg text-xs text-cyan-200">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Info className="w-3.5 h-3.5 text-[#08B6D4]" />
                  Data Contract Invariant
                </div>
                This manual override will be permanently preserved in the SQLite persistent database across all future imports of initial and update batches.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalRecord(null)}
                  className="px-4 py-2 bg-[#151515] hover:bg-[#272830] border border-[#3B3B3B] text-[#999999] text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-[#08B6D4] to-[#008DB5] hover:opacity-95 text-white font-semibold text-xs rounded-lg shadow-sm"
                >
                  {submitting ? "Saving..." : "Confirm & Save Override"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
