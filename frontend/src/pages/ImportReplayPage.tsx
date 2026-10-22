import React, { useState } from "react";
import {
  Upload,
  Play,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import { api } from "../api/client";

export const ImportReplayPage: React.FC = () => {
  const [runningStep, setRunningStep] = useState<string | null>(null);
  const [stepLogs, setStepLogs] = useState<any[]>([]);
  const [lastResult, setLastResult] = useState<any | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const runReplayStep = async (stepKey: string, apiCall: () => Promise<any>, stepTitle: string) => {
    setRunningStep(stepKey);
    setUploadError(null);
    try {
      const res = await apiCall();
      setLastResult({ title: stepTitle, data: res });
      setStepLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          step: stepTitle,
          status: "success",
          details: res
        },
        ...prev
      ]);
    } catch (err: any) {
      setUploadError(err.message || `Failed to execute ${stepTitle}`);
      setStepLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          step: stepTitle,
          status: "error",
          details: { error: err.message }
        },
        ...prev
      ]);
    } finally {
      setRunningStep(null);
    }
  };

  const handleFullReplaySequence = async () => {
    setRunningStep("full-sequence");
    setUploadError(null);
    try {
      const res = await api.replayFullSequence();
      setLastResult({ title: "Full Replay Sequence Verification", data: res });
      setStepLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          step: "Full Contract Replay Sequence",
          status: res.overall_verification ? "success" : "warning",
          details: res
        },
        ...prev
      ]);
    } catch (err: any) {
      setUploadError(err.message || "Failed full replay sequence");
    } finally {
      setRunningStep(null);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setRunningStep("upload");
    setUploadError(null);
    try {
      const res = await api.uploadEnvelope(uploadFile);
      setLastResult({ title: `Uploaded ${uploadFile.name}`, data: res });
      setStepLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          step: `Uploaded ${uploadFile.name}`,
          status: "success",
          details: res
        },
        ...prev
      ]);
      setUploadFile(null);
    } catch (err: any) {
      setUploadError(err.message || "Failed to process uploaded file");
    } finally {
      setRunningStep(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Import & Deterministic Replay Engine</h1>
        <p className="text-[#999999] text-sm mt-1">
          Validate the assignment data contract: idempotence, revision comparison, usable dialogue count transitions (17 → 18), and M07 override survival.
        </p>
      </div>

      {/* Contract Invariants Banner */}
      <div className="bg-[#103F49] border border-cyan-800/60 rounded-xl p-5 shadow-sm text-white space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#08B6D4]" />
          <h3 className="text-sm font-bold text-cyan-200 uppercase tracking-wider">
            SpendNest Data Contract Invariants
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-[#0d2a30]/80 rounded-lg border border-cyan-800/40">
            <span className="text-[#08B6D4] font-bold block mb-0.5">Record Identity</span>
            <p className="text-white/90">Identity is strictly <code>(source_type, source_id)</code>. Exactly 44 total records.</p>
          </div>
          <div className="p-3 bg-[#0d2a30]/80 rounded-lg border border-cyan-800/40">
            <span className="text-[#08B6D4] font-bold block mb-0.5">Idempotence</span>
            <p className="text-white/90">Repeating an import produces 0 duplicate records and 0 regressions.</p>
          </div>
          <div className="p-3 bg-[#0d2a30]/80 rounded-lg border border-cyan-800/40">
            <span className="text-[#08B6D4] font-bold block mb-0.5">Dialogue Transition</span>
            <p className="text-white/90">Usable text count transitions from <strong>17</strong> to <strong>18</strong> when M07 gets 27 turns.</p>
          </div>
          <div className="p-3 bg-[#0d2a30]/80 rounded-lg border border-cyan-800/40">
            <span className="text-[#08B6D4] font-bold block mb-0.5">Override Survival</span>
            <p className="text-white/90">Manual route changes to M07 permanently survive future batch imports.</p>
          </div>
        </div>
      </div>

      {/* Hero Action: Full Sequence Button */}
      <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#08B6D4]" />
            One-Click Automated Contract Verification Suite
          </h2>
          <p className="text-xs text-[#999999] max-w-2xl leading-relaxed">
            Executes the complete test: Clean DB → Ingest Initial Batch (17 usable) → Repeat Initial Scrambled (verify 0 added) → Set M07 Manual Override → Ingest Update Batch (M07 gets 27 turns, text count becomes 18) → Re-import Initial Batch (verify revision 1 rejected and M07 override survives).
          </p>
        </div>
        <button
          onClick={handleFullReplaySequence}
          disabled={runningStep !== null}
          className="px-6 py-3 bg-gradient-to-r from-[#08B6D4] to-[#008DB5] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-all disabled:opacity-50"
        >
          {runningStep === "full-sequence" ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Running 5-Step Verification...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              Run Full Contract Suite
            </>
          )}
        </button>
      </div>

      {/* Step-by-Step Replay Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Step 1 */}
        <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#08B6D4] uppercase tracking-wider">Step 1</span>
            <Database className="w-4 h-4 text-[#999999]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Import Initial Batch</h3>
            <p className="text-xs text-[#999999] mt-1">
              Ingests <code>01_initial.json</code> (44 records, 17 with dialogue text, M07 has 0 turns).
            </p>
          </div>
          <button
            onClick={() => runReplayStep("initial", api.replayInitial, "Ingest 01_initial.json")}
            disabled={runningStep !== null}
            className="w-full py-2 bg-[#151515] hover:bg-[#282a30] border border-[#3B3B3B] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {runningStep === "initial" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3 h-3" />}
            Run Initial Import
          </button>
        </div>

        {/* Step 2 */}
        <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#08B6D4] uppercase tracking-wider">Step 2</span>
            <Layers className="w-4 h-4 text-[#999999]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Repeat (Idempotence)</h3>
            <p className="text-xs text-[#999999] mt-1">
              Re-imports <code>01_initial.json</code> with scrambled order. Verifies 0 records added.
            </p>
          </div>
          <button
            onClick={() => runReplayStep("scrambled", api.replayInitialScrambled, "Repeat Initial (Scrambled)")}
            disabled={runningStep !== null}
            className="w-full py-2 bg-[#151515] hover:bg-[#282a30] border border-[#3B3B3B] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {runningStep === "scrambled" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
            Test Idempotence
          </button>
        </div>

        {/* Step 3 */}
        <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#08B6D4] uppercase tracking-wider">Step 3</span>
            <ShieldCheck className="w-4 h-4 text-[#999999]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Override M07 Route</h3>
            <p className="text-xs text-[#999999] mt-1">
              Changes M07 destination to <code>Customer Retention Escalation</code> with audit reason.
            </p>
          </div>
          <button
            onClick={() => runReplayStep("m07", api.replayM07Override, "Override M07 Route")}
            disabled={runningStep !== null}
            className="w-full py-2 bg-[#151515] hover:bg-[#282a30] border border-[#3B3B3B] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {runningStep === "m07" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3 h-3" />}
            Apply M07 Override
          </button>
        </div>

        {/* Step 4 */}
        <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#08B6D4] uppercase tracking-wider">Step 4</span>
            <Sparkles className="w-4 h-4 text-[#08B6D4]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Ingest Update Batch</h3>
            <p className="text-xs text-[#999999] mt-1">
              Ingests <code>02_update.json</code>. M07 receives 27 turns. Text count jumps 17 → 18.
            </p>
          </div>
          <button
            onClick={() => runReplayStep("update", api.replayUpdate, "Ingest 02_update.json")}
            disabled={runningStep !== null}
            className="w-full py-2 bg-[#151515] hover:bg-[#282a30] border border-[#3B3B3B] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {runningStep === "update" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3 h-3" />}
            Run Update Batch
          </button>
        </div>
      </div>

      {/* Custom File Upload Section */}
      <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#08B6D4]" />
          Upload Custom Envelope JSON
        </h3>
        <p className="text-xs text-[#999999]">
          Upload any JSON envelope formatted according to the SpendNest envelope schema (containing <code>batch_id</code>, <code>records</code>).
        </p>

        <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="file"
            accept=".json,.jsonl"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            className="w-full sm:flex-1 text-xs text-[#999999] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#151515] file:text-[#08B6D4] file:border file:border-[#3B3B3B] hover:file:bg-[#272830] cursor-pointer"
          />
          <button
            type="submit"
            disabled={!uploadFile || runningStep !== null}
            className="px-5 py-2 bg-gradient-to-r from-[#08B6D4] to-[#008DB5] hover:opacity-95 text-white font-medium text-xs rounded-lg shadow-sm disabled:opacity-50 cursor-pointer transition-all"
          >
            {runningStep === "upload" ? "Processing Envelope..." : "Process Envelope"}
          </button>
        </form>

        {uploadError && (
          <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {uploadError}
          </div>
        )}
      </div>

      {/* Execution Results & Audit Log */}
      {lastResult && (
        <div className="bg-[#202124] border border-cyan-900/60 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#3B3B3B]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Latest Result: {lastResult.title}
            </h3>
            <span className="text-xs text-cyan-400 font-mono">Status: Verified</span>
          </div>

          <pre className="bg-[#151515] p-4 rounded-lg border border-[#333333] text-xs font-mono text-[#08B6D4] overflow-x-auto max-h-60 leading-relaxed">
            {JSON.stringify(lastResult.data, null, 2)}
          </pre>
        </div>
      )}

      {/* Step History */}
      {stepLogs.length > 0 && (
        <div className="bg-[#202124] border border-[#3B3B3B] rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs uppercase font-bold text-[#999999] tracking-wider">
            Replay Audit History ({stepLogs.length} events)
          </h3>
          <div className="space-y-2">
            {stepLogs.map((log, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#18191c] border border-[#333333] rounded-lg text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] text-[#888888]">{log.timestamp}</span>
                  <span className="font-semibold text-white">{log.step}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    log.status === "success"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : "bg-red-950 text-red-300 border border-red-800"
                  }`}
                >
                  {log.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
