import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Phone,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  FileText,
  UserCheck,
  ChevronRight,
  X,
  Edit3,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { api } from "../api/client";
import { SourceRecord, EvidenceCitation } from "../types";

export const ConversationInboxPage: React.FC = () => {
  const [records, setRecords] = useState<SourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [sourceType, setSourceType] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [sentiment, setSentiment] = useState<string>("");
  const [dealRisk, setDealRisk] = useState<string>("");
  const [hasUsableText, setHasUsableText] = useState<string>("");
  const [assignedRoute, setAssignedRoute] = useState<string>("");

  // Slide-over detail state
  const [selectedRecord, setSelectedRecord] = useState<SourceRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "transcript" | "evidence" | "edit">("overview");

  // Edit form state
  const [editRoute, setEditRoute] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editStage, setEditStage] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editSuccessMessage, setEditSuccessMessage] = useState<string | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (sourceType) params.source_type = sourceType;
      if (priority) params.priority = priority;
      if (sentiment) params.sentiment = sentiment;
      if (dealRisk) params.deal_risk = dealRisk;
      if (hasUsableText !== "") params.has_usable_text = hasUsableText;
      if (assignedRoute) params.assigned_route = assignedRoute;

      const data = await api.getConversations(params);
      setRecords(data.records);
    } catch (err: any) {
      setError(err.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [sourceType, priority, sentiment, dealRisk, hasUsableText, assignedRoute]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRecords();
  };

  const handleSelectRecord = async (record: SourceRecord) => {
    setDetailLoading(true);
    try {
      const full = await api.getConversationDetail(record.source_type, record.source_id);
      setSelectedRecord(full);
      setEditRoute(full.assigned_route || "");
      setEditPriority(full.priority || "Medium");
      setEditStage(full.payload?.deal_stage || "Discovery");
      setEditNotes("");
      setEditReason("");
      setEditSuccessMessage(null);
      setActiveTab("overview");
    } catch (err: any) {
      alert("Failed to load details: " + err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setEditSubmitting(true);
    setEditSuccessMessage(null);
    try {
      const res = await api.updateConversation(
        selectedRecord.source_type,
        selectedRecord.source_id,
        {
          assigned_route: editRoute,
          priority: editPriority,
          deal_stage: editStage,
          notes: editNotes,
          reason: editReason || "Manual review correction by sales manager",
          user: "Sales Manager"
        }
      );
      setEditSuccessMessage("Changes saved successfully to persistent database!");
      // Refresh selected record
      const full = await api.getConversationDetail(selectedRecord.source_type, selectedRecord.source_id);
      setSelectedRecord(full);
      // Refresh list
      loadRecords();
    } catch (err: any) {
      alert("Failed to save correction: " + err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSourceType("");
    setPriority("");
    setSentiment("");
    setDealRisk("");
    setHasUsableText("");
    setAssignedRoute("");
  };

  // Badges helper
  const renderPriorityBadge = (p?: string) => {
    switch (p) {
      case "Critical":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-950/70 text-red-300 border border-red-800/50">Critical</span>;
      case "High":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-950/70 text-amber-300 border border-amber-800/50">High</span>;
      case "Medium":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-950/70 text-blue-300 border border-blue-800/50">Medium</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-400 border border-slate-700">Low</span>;
    }
  };

  const renderSentimentBadge = (s?: string) => {
    switch (s) {
      case "Positive":
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">Positive</span>;
      case "Negative":
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">Negative</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-800 text-slate-400 border border-slate-700">Neutral</span>;
    }
  };

  const renderRiskBadge = (r?: string) => {
    switch (r) {
      case "Critical":
        return <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-950 text-red-400 border border-red-800">Risk: Critical</span>;
      case "High":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-950/80 text-rose-300 border border-rose-800">Risk: High</span>;
      case "Medium":
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-950/60 text-amber-300 border border-amber-800">Risk: Medium</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">Healthy</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Conversation Intelligence Inbox</h1>
        <p className="text-[#999999] text-sm mt-1">
          Review calls and meetings, understand customer intent, and identify the conversations that need immediate attention.
        </p>
      </div>

      {/* Filter and Search Card */}
      <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, rep, topic, or raw conversation text..."
              className="w-full pl-10 pr-4 py-2 bg-[#151515] border border-[#3B3B3B] rounded-lg text-sm text-[#F5F5F5] placeholder-[#666666] focus:outline-none focus:border-[#08B6D4] transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-gradient-to-r from-[#08B6D4] to-[#008DB5] hover:opacity-95 text-white font-medium text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Filter className="w-4 h-4" />
            Apply Filter
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2 bg-[#151515] hover:bg-[#272830] border border-[#3B3B3B] text-[#999999] hover:text-white text-sm rounded-lg transition-colors cursor-pointer"
          >
            Reset
          </button>
        </form>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-[#2d2e33]">
          <div>
            <label className="text-[11px] font-medium text-[#999999] block mb-1">Source Type</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full bg-[#151515] border border-[#3B3B3B] rounded-md px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#08B6D4]"
            >
              <option value="">All Types (44)</option>
              <option value="call">Calls Only (30)</option>
              <option value="meeting">Meetings Only (14)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#999999] block mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-[#151515] border border-[#3B3B3B] rounded-md px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#08B6D4]"
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#999999] block mb-1">Sentiment</label>
            <select
              value={sentiment}
              onChange={(e) => setSentiment(e.target.value)}
              className="w-full bg-[#151515] border border-[#3B3B3B] rounded-md px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#08B6D4]"
            >
              <option value="">All Sentiments</option>
              <option value="Positive">Positive</option>
              <option value="Neutral">Neutral</option>
              <option value="Negative">Negative</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#999999] block mb-1">Deal Risk</label>
            <select
              value={dealRisk}
              onChange={(e) => setDealRisk(e.target.value)}
              className="w-full bg-[#151515] border border-[#3B3B3B] rounded-md px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#08B6D4]"
            >
              <option value="">All Deal Risk</option>
              <option value="Critical">Critical Risk</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Healthy">Healthy</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#999999] block mb-1">Transcript Text</label>
            <select
              value={hasUsableText}
              onChange={(e) => setHasUsableText(e.target.value)}
              className="w-full bg-[#151515] border border-[#3B3B3B] rounded-md px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#08B6D4]"
            >
              <option value="">All Records (44)</option>
              <option value="1">With Usable Text (18)</option>
              <option value="0">Placeholder / No Audio (26)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#999999] block mb-1">Assigned Route</label>
            <select
              value={assignedRoute}
              onChange={(e) => setAssignedRoute(e.target.value)}
              className="w-full bg-[#151515] border border-[#3B3B3B] rounded-md px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#08B6D4]"
            >
              <option value="">All Teams</option>
              <option value="Mid-Market Expansion">Mid-Market Expansion</option>
              <option value="Enterprise Sales">Enterprise Sales</option>
              <option value="Customer Success Retention">CS Retention</option>
              <option value="Partner Ecosystem">Partner Ecosystem</option>
              <option value="Core Sales Triage">Core Sales Triage</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#3B3B3B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">
              Conversations ({records.length})
            </span>
            <span className="text-xs text-[#999999]">
              {records.filter(r => r.has_usable_text === 1).length} with dialogue evidence
            </span>
          </div>
          <button
            onClick={loadRecords}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[#08B6D4] hover:text-[#008DB5] font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#999999]">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-[#08B6D4]" />
            Loading conversations...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-400">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            {error}
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-[#999999]">
            <p className="text-sm">No conversations match your current filters.</p>
            <button
              onClick={clearFilters}
              className="mt-3 px-3 py-1.5 text-xs bg-[#151515] border border-[#3B3B3B] rounded-md text-[#08B6D4] hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1b1c1e] text-[#999999] border-b border-[#2d2e33]">
                <tr>
                  <th className="py-3 px-3 font-semibold">Ref</th>
                  <th className="py-3 px-3 font-semibold">Title / Customer Subject</th>
                  <th className="py-3 px-3 font-semibold">Rep / Owner</th>
                  <th className="py-3 px-3 font-semibold">Date & Time</th>
                  <th className="py-3 px-3 font-semibold">Dialogue Evidence</th>
                  <th className="py-3 px-3 font-semibold">Sentiment</th>
                  <th className="py-3 px-3 font-semibold">Priority</th>
                  <th className="py-3 px-3 font-semibold">Deal Risk</th>
                  <th className="py-3 px-3 font-semibold">Assigned Route</th>
                  <th className="py-3 px-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2e33]">
                {records.map((r) => {
                  const isCall = r.source_type === "call";
                  return (
                    <tr
                      key={`${r.source_type}_${r.source_id}`}
                      className="hover:bg-[#272830]/70 transition-colors cursor-pointer group"
                      onClick={() => handleSelectRecord(r)}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isCall ? (
                            <Phone className="w-3.5 h-3.5 text-cyan-400" />
                          ) : (
                            <Users className="w-3.5 h-3.5 text-blue-400" />
                          )}
                          <span>{r.record_ref}</span>
                          {r.is_manual_override === 1 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" title="Manually Overridden" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#F5F5F5] font-medium max-w-[240px] truncate">
                        {r.title_or_direction}
                      </td>
                      <td className="py-3 px-3 text-[#CCCCCC] whitespace-nowrap">
                        {r.rep_or_organizer}
                      </td>
                      <td className="py-3 px-3 text-[#999999] whitespace-nowrap">
                        {new Date(r.occurred_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {r.has_usable_text === 1 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded text-[11px]">
                            <CheckCircle className="w-3 h-3" />
                            {isCall ? "1 Quote" : `${r.usable_text_length} chars`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#888888] bg-[#1a1a1a] border border-[#333333] px-2 py-0.5 rounded text-[11px]">
                            No Transcript
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderSentimentBadge(r.sentiment)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderPriorityBadge(r.priority)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderRiskBadge(r.deal_risk)}
                      </td>
                      <td className="py-3 px-3 text-xs text-[#08B6D4] font-medium whitespace-nowrap">
                        {r.assigned_route || "Unassigned"}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRecord(r);
                          }}
                          className="px-2.5 py-1 rounded bg-[#1b1c1e] group-hover:bg-[#08B6D4] text-[#08B6D4] group-hover:text-black font-semibold text-[11px] border border-[#3B3B3B] group-hover:border-[#08B6D4] transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          Details <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-[#1d1e22] border-l border-[#3B3B3B] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-[#3B3B3B] bg-[#222429] flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#08B6D4] px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">
                    {selectedRecord.record_ref}
                  </span>
                  <span className="text-xs text-[#999999] uppercase tracking-wider font-semibold">
                    Revision v{selectedRecord.revision}
                  </span>
                  {selectedRecord.is_manual_override === 1 && (
                    <span className="text-[10px] uppercase font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-700">
                      Manual Override Active
                    </span>
                  )}
                  {selectedRecord.analysis_freshness === "Stale" && (
                    <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-700">
                      Stale Analysis Flagged
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white mt-1">{selectedRecord.title_or_direction}</h2>
                <div className="text-xs text-[#999999] flex items-center gap-3">
                  <span>Rep: <strong className="text-white">{selectedRecord.rep_or_organizer}</strong></span>
                  <span>•</span>
                  <span>Date: {new Date(selectedRecord.occurred_at).toLocaleString()}</span>
                  <span>•</span>
                  <span>Batch: <code className="text-xs text-cyan-300">{selectedRecord.batch_id}</code></span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-[#999999] hover:text-white p-1.5 rounded-lg hover:bg-[#2d2f36] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#3B3B3B] bg-[#1a1b1f] px-5">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "overview"
                    ? "border-[#08B6D4] text-[#08B6D4]"
                    : "border-transparent text-[#999999] hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Intelligence & BANT
              </button>
              <button
                onClick={() => setActiveTab("transcript")}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "transcript"
                    ? "border-[#08B6D4] text-[#08B6D4]"
                    : "border-transparent text-[#999999] hover:text-white"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Original Dialogue ({selectedRecord.has_usable_text === 1 ? "Active" : "Unavailable"})
              </button>
              <button
                onClick={() => setActiveTab("evidence")}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "evidence"
                    ? "border-[#08B6D4] text-[#08B6D4]"
                    : "border-transparent text-[#999999] hover:text-white"
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Evidence Citations ({selectedRecord.evidence_citations?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("edit")}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "edit"
                    ? "border-[#08B6D4] text-[#08B6D4]"
                    : "border-transparent text-[#999999] hover:text-white"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Review & Override
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
              {activeTab === "overview" && (
                <div className="space-y-4">
                  {/* Summary Card */}
                  <div className="bg-[#25272c] border border-[#3B3B3B] rounded-xl p-4">
                    <h3 className="text-xs uppercase font-bold text-[#08B6D4] tracking-wider mb-2">Executive Summary</h3>
                    <p className="text-white text-xs leading-relaxed">
                      {selectedRecord.summary || "No automated summary generated."}
                    </p>
                    {selectedRecord.recommended_action && (
                      <div className="mt-3 pt-3 border-t border-[#3B3B3B]">
                        <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block mb-1">
                          Recommended Action:
                        </span>
                        <p className="text-xs text-[#E5E5E5] font-medium">{selectedRecord.recommended_action}</p>
                      </div>
                    )}
                  </div>

                  {/* BANT Matrix */}
                  <div className="bg-[#25272c] border border-[#3B3B3B] rounded-xl p-4">
                    <h3 className="text-xs uppercase font-bold text-[#08B6D4] tracking-wider mb-3">
                      BANT Qualification Signals
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-[#1a1b1f] border border-[#3B3B3B] rounded-lg">
                        <span className="text-[11px] font-bold text-[#08B6D4] uppercase block mb-1">Budget</span>
                        <p className="text-white">{selectedRecord.bant_budget || "Not discussed / Unspecified"}</p>
                      </div>
                      <div className="p-3 bg-[#1a1b1f] border border-[#3B3B3B] rounded-lg">
                        <span className="text-[11px] font-bold text-[#08B6D4] uppercase block mb-1">Authority</span>
                        <p className="text-white">{selectedRecord.bant_authority || "Not identified"}</p>
                      </div>
                      <div className="p-3 bg-[#1a1b1f] border border-[#3B3B3B] rounded-lg">
                        <span className="text-[11px] font-bold text-[#08B6D4] uppercase block mb-1">Need</span>
                        <p className="text-white">{selectedRecord.bant_need || "General inquiry"}</p>
                      </div>
                      <div className="p-3 bg-[#1a1b1f] border border-[#3B3B3B] rounded-lg">
                        <span className="text-[11px] font-bold text-[#08B6D4] uppercase block mb-1">Timeline</span>
                        <p className="text-white">{selectedRecord.bant_timeline || "Standard sales cycle"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Risk Factors & Objections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#25272c] border border-[#3B3B3B] rounded-xl p-4">
                      <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Risk Factors ({selectedRecord.risk_factors?.length || 0})
                      </h4>
                      {selectedRecord.risk_factors && selectedRecord.risk_factors.length > 0 ? (
                        <ul className="space-y-1.5 text-xs text-[#CCCCCC]">
                          {selectedRecord.risk_factors.map((rf, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-rose-400">•</span>
                              <span>{rf}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-[#888888]">No critical risk factors identified.</p>
                      )}
                    </div>

                    <div className="bg-[#25272c] border border-[#3B3B3B] rounded-xl p-4">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Customer Objections ({selectedRecord.objections?.length || 0})
                      </h4>
                      {selectedRecord.objections && selectedRecord.objections.length > 0 ? (
                        <ul className="space-y-1.5 text-xs text-[#CCCCCC]">
                          {selectedRecord.objections.map((obj, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-amber-400">•</span>
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-[#888888]">No strong objections logged.</p>
                      )}
                    </div>
                  </div>

                  {/* Buying Signals */}
                  <div className="bg-[#25272c] border border-[#3B3B3B] rounded-xl p-4">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                      Buying Signals ({selectedRecord.positive_signals?.length || 0})
                    </h4>
                    {selectedRecord.positive_signals && selectedRecord.positive_signals.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedRecord.positive_signals.map((sig, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 text-xs bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 rounded-md"
                          >
                            ✓ {sig}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#888888]">No explicit buying signals recorded.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "transcript" && (
                <div className="space-y-4">
                  {selectedRecord.has_usable_text === 1 ? (
                    <div>
                      {selectedRecord.source_type === "meeting" && selectedRecord.transcript_payload?.turns ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs text-[#999999] pb-2 border-b border-[#3B3B3B]">
                            <span>Transcript Turns: {selectedRecord.transcript_payload.turns.length}</span>
                            <span className="font-mono text-cyan-400">Meeting ID: {selectedRecord.source_id}</span>
                          </div>
                          {selectedRecord.transcript_payload.turns.map((t: any, idx: number) => {
                            const isRep = t.speaker?.toLowerCase().includes("rep") || t.speaker?.toLowerCase().includes("organizer");
                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg border text-xs ${
                                  isRep
                                    ? "bg-[#18232c] border-cyan-900/50 ml-4"
                                    : "bg-[#25272c] border-[#3B3B3B] mr-4"
                                }`}
                              >
                                <div className="flex items-center justify-between font-mono text-[11px] mb-1 text-[#999999]">
                                  <span className={`font-bold ${isRep ? "text-[#08B6D4]" : "text-amber-400"}`}>
                                    {t.speaker || "Participant"} [Turn #{t.turn_number || idx + 1}]
                                  </span>
                                  {t.timecode && <span>{t.timecode}</span>}
                                </div>
                                <p className="text-white leading-relaxed">{t.text}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-[#1a1b1f] p-4 rounded-xl border border-[#3B3B3B] font-mono text-xs text-[#F5F5F5] whitespace-pre-wrap leading-relaxed">
                          {selectedRecord.raw_text}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-8 text-center text-[#999999] space-y-2">
                      <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
                      <h4 className="text-sm font-bold text-white">No Audio / Usable Transcript Available</h4>
                      <p className="text-xs max-w-md mx-auto">
                        This source record was ingested as a metadata placeholder or recorded without a transcribed audio stream.
                        Status: <code className="text-cyan-300">{selectedRecord.intake_state}</code>.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "evidence" && (
                <div className="space-y-3">
                  <h3 className="text-xs uppercase font-bold text-[#08B6D4] tracking-wider mb-2">
                    Verified Source Excerpts & Citations
                  </h3>
                  {selectedRecord.evidence_citations && selectedRecord.evidence_citations.length > 0 ? (
                    selectedRecord.evidence_citations.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-[#1f2228] border border-cyan-900/40 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-[#08B6D4] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                            {c.citation_label || `${c.record_ref} Turn #${c.turn_number}`}
                          </span>
                          <span className="text-[11px] text-[#999999] font-medium">{c.topic}</span>
                        </div>
                        <blockquote className="border-l-2 border-[#08B6D4] pl-3 py-0.5 text-xs text-[#F5F5F5] italic leading-relaxed">
                          "{c.quote}"
                        </blockquote>
                        <div className="text-[11px] text-[#888888] flex items-center gap-3 pt-1">
                          <span>Speaker: <strong className="text-[#CCCCCC]">{c.speaker || "Customer"}</strong></span>
                          {c.timecode && <span>Time: {c.timecode}</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-[#999999] bg-[#25272c] rounded-xl border border-[#3B3B3B]">
                      No explicit dialogue citations found for this record.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "edit" && (
                <form onSubmit={handleSaveCorrection} className="space-y-4">
                  <div className="bg-[#182a30] border border-cyan-900/60 p-3 rounded-lg text-xs text-cyan-200">
                    <strong>Persistent Override Guarantee:</strong> Manual corrections survive repeated imports and batch updates in accordance with the data contract.
                  </div>

                  {editSuccessMessage && (
                    <div className="bg-emerald-950 border border-emerald-800 p-3 rounded-lg text-xs text-emerald-300">
                      ✓ {editSuccessMessage}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-[#CCCCCC] block mb-1">Assigned Route</label>
                    <select
                      value={editRoute}
                      onChange={(e) => setEditRoute(e.target.value)}
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
                      <label className="text-xs font-semibold text-[#CCCCCC] block mb-1">Priority</label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                        className="w-full bg-[#151515] border border-[#3B3B3B] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#08B6D4]"
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#CCCCCC] block mb-1">Deal Stage</label>
                      <input
                        type="text"
                        value={editStage}
                        onChange={(e) => setEditStage(e.target.value)}
                        className="w-full bg-[#151515] border border-[#3B3B3B] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#08B6D4]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#CCCCCC] block mb-1">Manager Reason for Correction</label>
                    <input
                      type="text"
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      placeholder="e.g., M07 payment defect requires Customer Retention Escalation"
                      className="w-full bg-[#151515] border border-[#3B3B3B] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#08B6D4]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#CCCCCC] block mb-1">Manager Notes & Instructions</label>
                    <textarea
                      rows={3}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Add guidance for the assigned rep or team..."
                      className="w-full bg-[#151515] border border-[#3B3B3B] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#08B6D4]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="w-full py-2.5 bg-gradient-to-r from-[#08B6D4] to-[#008DB5] hover:opacity-95 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    {editSubmitting ? "Saving..." : "Save Correction (Audit Logged)"}
                  </button>

                  {selectedRecord.manual_corrections && selectedRecord.manual_corrections.length > 0 && (
                    <div className="pt-4 border-t border-[#3B3B3B]">
                      <h4 className="text-xs font-bold text-[#999999] uppercase mb-2">Correction History</h4>
                      <div className="space-y-2">
                        {selectedRecord.manual_corrections.map((mc, idx) => (
                          <div key={idx} className="p-2.5 bg-[#151515] border border-[#333333] rounded text-[11px] space-y-1">
                            <div className="flex justify-between text-[#999999]">
                              <span className="font-semibold text-white">{mc.field_name}: {mc.new_value}</span>
                              <span>{new Date(mc.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-[#AAAAAA]">Reason: {mc.reason} (by {mc.user})</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
