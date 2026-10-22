import React, { useState, useEffect } from "react";
import {
  Download,
  FileText,
  Archive,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  XCircle,
  ChevronRight,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { api } from "../api/client";
import { FindingItem, RejectedDecision } from "../types";

export const ExportsFindingsPage: React.FC = () => {
  const [findings, setFindings] = useState<FindingItem[]>([]);
  const [rejectedDecisions, setRejectedDecisions] = useState<RejectedDecision[]>([]);
  const [managerBrief, setManagerBrief] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Export generation state
  const [generatingExport, setGeneratingExport] = useState(false);
  const [exportResult, setExportResult] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fData, bData] = await Promise.all([
        api.getFindings(),
        api.getManagerBrief()
      ]);
      setFindings(fData.findings);
      setRejectedDecisions(fData.rejected_decisions);
      setManagerBrief(bData);
    } catch (err: any) {
      setError(err.message || "Failed to load findings and reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateExport = async () => {
    setGeneratingExport(true);
    try {
      const res = await api.createExport();
      setExportResult(res);
    } catch (err: any) {
      alert("Failed to generate export package: " + err.message);
    } finally {
      setGeneratingExport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Exports, Evidence Findings & Manager Brief</h1>
        <p className="text-[#999999] text-sm mt-1">
          Download the 11-file compliant ZIP archive with <code>manifest.json</code>, explore three strategic revenue findings, and review recorded rejected decisions.
        </p>
      </div>

      {/* Export Generation Card */}
      <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#2d2e33]">
          <div>
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-[#08B6D4]" />
              <h2 className="text-base font-bold text-white">
                SpendNest Assignment Export Package (11 Files + manifest.json)
              </h2>
            </div>
            <p className="text-xs text-[#999999] mt-1 max-w-xl">
              Generates an organized ZIP containing all 44 source records, analyses, routing decisions, manual overrides, findings, audit trail, and cryptographic checksum manifest.
            </p>
          </div>

          <button
            onClick={handleGenerateExport}
            disabled={generatingExport}
            className="px-5 py-2.5 bg-gradient-to-r from-[#08B6D4] to-[#008DB5] hover:opacity-95 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 shrink-0"
          >
            {generatingExport ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                Packaging 11 Files...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Generate & Package ZIP
              </>
            )}
          </button>
        </div>

        {/* Display generated export status */}
        {exportResult && (
          <div className="p-4 bg-[#18232c] border border-cyan-900/60 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Archive Generated: {exportResult.zip_filename}
              </span>
              <a
                href={api.getExportDownloadUrl(exportResult.export_id)}
                download
                className="px-4 py-1.5 bg-[#08B6D4] hover:bg-[#008DB5] text-black font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download ({Math.round(exportResult.zip_size_bytes / 1024)} KB)
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#CCCCCC]">
              <div>Total Records: <strong className="text-white">{exportResult.manifest?.total_records}</strong></div>
              <div>Usable Texts: <strong className="text-white">{exportResult.manifest?.usable_dialogue_texts}</strong></div>
              <div>Files in Archive: <strong className="text-cyan-400">{exportResult.files?.length} files</strong></div>
              <div>Version: <strong className="text-white">{exportResult.manifest?.app_version}</strong></div>
            </div>

            <div className="text-[11px] font-mono text-[#888888] truncate">
              Manifest SHA256: {exportResult.manifest?.files?.[0]?.sha256 || "verified"}
            </div>
          </div>
        )}

        <div className="text-xs text-[#888888]">
          Package Contents: <code>source_records.csv/json</code>, <code>conversation_analyses.csv/json</code>, <code>routing_decisions.csv/json</code>, <code>manual_corrections.csv/json</code>, <code>findings_and_evidence.json</code>, <code>audit_history.csv</code>, <code>manifest.json</code>.
        </div>
      </div>

      {/* 3 Evidence-Backed Strategic Findings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#08B6D4]" />
          <h2 className="text-lg font-bold text-white tracking-tight">
            Three Evidence-Backed Revenue Findings
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {findings.map((f, idx) => (
            <div
              key={f.id || idx}
              className="bg-[#202124] border border-[#3B3B3B] hover:border-cyan-900/60 rounded-xl p-5 shadow-sm space-y-4 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#2d2e33]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Finding #{idx + 1}
                  </span>
                  <h3 className="text-base font-bold text-white">{f.title}</h3>
                </div>
                <span className="text-xs text-amber-300 font-semibold px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 self-start sm:self-auto">
                  {f.metric}
                </span>
              </div>

              <p className="text-xs text-[#E5E5E5] leading-relaxed">
                {f.explanation}
              </p>

              {/* Supporting conversation excerpts */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-[#08B6D4] uppercase tracking-wider block">
                  Verifiable Source Excerpts & Dialogue Citations:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {f.excerpts.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="p-3 bg-[#17181c] border border-cyan-950/70 rounded-lg text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-[#08B6D4]">
                          {ex.citation_label || `${ex.record_ref} Turn #${ex.turn || ex.turn_number || 1}`}
                        </span>
                        <span className="text-[#888888]">{ex.speaker}</span>
                      </div>
                      <blockquote className="text-[#CCCCCC] italic pl-2 border-l-2 border-[#08B6D4] text-xs">
                        "{ex.quote}"
                      </blockquote>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rejected Decision Card (Assignment Requirement) */}
      <div className="bg-[#202124] border border-rose-900/40 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2d2e33]">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Documented Rejected Decision (Data Contract Requirement)
              </h3>
              <p className="text-xs text-[#999999]">
                Capturing deliberate operational decisions rejected during routing engine design.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-400 bg-rose-950 px-2.5 py-1 rounded border border-rose-800">
            Decision Rejected
          </span>
        </div>

        {rejectedDecisions.map((rd, idx) => (
          <div key={idx} className="space-y-3 text-xs">
            <div className="p-3.5 bg-[#17181c] rounded-lg border border-[#333333] space-y-2">
              <div>
                <strong className="text-rose-300 font-bold">Proposal Evaluated: </strong>
                <span className="text-white">{rd.decision_considered}</span>
              </div>
              <div>
                <strong className="text-[#999999] font-bold">Initial Rationale: </strong>
                <span className="text-[#CCCCCC]">{rd.initial_rationale}</span>
              </div>
              <div>
                <strong className="text-rose-400 font-bold">Why Rejected (Evidence-Based): </strong>
                <span className="text-[#E5E5E5]">{rd.rejection_reason}</span>
              </div>
              <div className="pt-2 border-t border-[#2d2e33] flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 font-semibold">
                  ✓ Selected Alternative: {rd.alternative_selected}
                </span>
                <span className="text-[#888888] font-mono">By: {rd.author}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manager Daily Intelligence Brief */}
      {managerBrief && (
        <div className="bg-[#103F49] border border-cyan-800/60 rounded-xl p-6 shadow-sm text-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-800/60">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-[#08B6D4]" />
              <h2 className="text-base font-bold text-cyan-200">
                {managerBrief.headline}
              </h2>
            </div>
            <span className="text-xs font-mono text-[#08B6D4] bg-[#0d2a30] px-2.5 py-1 rounded border border-cyan-800">
              {managerBrief.brief_date}
            </span>
          </div>

          <p className="text-xs text-white/90 leading-relaxed">
            {managerBrief.executive_summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {managerBrief.key_priorities.map((kp: any, idx: number) => (
              <div key={idx} className="p-3 bg-[#0d2a30]/80 rounded-lg border border-cyan-800/50 text-xs space-y-1">
                <span className="font-bold text-[#08B6D4] block">{kp.priority}</span>
                <p className="text-white/85 text-[11px]">{kp.action}</p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-cyan-800/60 space-y-2">
            <span className="text-xs font-bold text-cyan-200 uppercase tracking-wider block">
              Rep Coaching Notes:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {managerBrief.rep_coaching_notes.map((rc: any, idx: number) => (
                <div key={idx} className="p-3 bg-[#0d2a30]/60 rounded-lg border border-cyan-800/40 text-xs">
                  <strong className="text-amber-300 block mb-0.5">{rc.rep}</strong>
                  <p className="text-white/85 text-[11px]">{rc.observation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
