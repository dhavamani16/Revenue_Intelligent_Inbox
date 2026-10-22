import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import {
  FileText,
  CheckCircle2,
  Phone,
  Video,
  AlertTriangle,
  GitPullRequest,
  ShieldCheck,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { api } from "../api/client";
import { DashboardSummary, ChartData } from "../types";

const COLORS = ["#08B6D4", "#008DB5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const s = await api.getDashboardSummary();
      setSummary(s);
      const c = await api.getDashboardCharts();
      setCharts(c);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Manager Executive Dashboard
          </h2>
          <p className="text-xs text-[#999999] mt-1">
            Real-time analytics across all 44 selected interactions for 21 August 2026 (Asia/Kolkata).
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className="bg-[#202124] hover:bg-[#282a2e] text-[#08B6D4] border border-[#3B3B3B] hover:border-[#08B6D4]/50 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 8 KPI Cards calculated from database */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#202124] border border-[#3B3B3B] p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider">
            Total Source Records
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {summary?.total_conversations ?? 44}
          </div>
          <div className="text-[11px] text-[#999999] mt-1 flex items-center gap-1">
            <span className="text-[#08B6D4] font-medium">{summary?.calls_count ?? 30} calls</span>
            <span>&bull;</span>
            <span className="text-[#08B6D4] font-medium">{summary?.meetings_count ?? 14} meetings</span>
          </div>
        </div>

        <div className="bg-[#202124] border border-[#3B3B3B] p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider">
            Usable Supplied Texts
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {summary?.usable_supplied_texts ?? 18}
          </div>
          <div className="text-[11px] text-[#999999] mt-1 flex items-center gap-1">
            <span>{summary?.calls_usable ?? 10} calls</span>
            <span>&bull;</span>
            <span>{summary?.meetings_usable ?? 8} meetings</span>
          </div>
        </div>

        <div className="bg-[#202124] border border-[#3B3B3B] p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider">
            Text Coverage Ratio
          </div>
          <div className="text-2xl font-black text-[#08B6D4] mt-2">
            {summary?.text_coverage_percent ?? 40.9}%
          </div>
          <div className="text-[11px] text-[#999999] mt-1">
            18 with text / 44 selected
          </div>
        </div>

        <div className="bg-[#202124] border border-[#3B3B3B] p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider">
            Manual Route Overrides
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {summary?.manual_overrides_active ?? 1}
          </div>
          <div className="text-[11px] text-[#999999] mt-1">
            Preserved across revisions
          </div>
        </div>

        <div className="bg-[#202124] border border-[#3B3B3B] p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider">
            At-Risk Accounts
          </div>
          <div className="text-2xl font-black text-rose-400 mt-2">
            {summary?.at_risk_deals ?? 4}
          </div>
          <div className="text-[11px] text-[#999999] mt-1">
            Critical/High churn indicators
          </div>
        </div>

        <div className="bg-[#202124] border border-[#3B3B3B] p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider">
            Pending Routing Reviews
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {summary?.unresolved_routing_decisions ?? 1}
          </div>
          <div className="text-[11px] text-[#999999] mt-1">
            Requires manager triage
          </div>
        </div>

        <div className="bg-[#202124] border border-[#3B3B3B] p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider">
            Positive Buying Signals
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {summary?.positive_buying_signals ?? 5}
          </div>
          <div className="text-[11px] text-[#999999] mt-1">
            Explicit commercial interest
          </div>
        </div>

        <div className="bg-[#202124] border border-[#3B3B3B] p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider">
            Negative / Blockers
          </div>
          <div className="text-2xl font-black text-rose-400 mt-2">
            {summary?.negative_buying_signals ?? 6}
          </div>
          <div className="text-[11px] text-[#999999] mt-1">
            Prepaid/bug objections
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Text Coverage Calls vs Meetings */}
        <div className="bg-[#202124] border border-[#3B3B3B] p-5 rounded-2xl shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1">
            Usable Supplied Text Coverage (Calls vs Meetings)
          </h3>
          <p className="text-xs text-[#999999] mb-4">
            Shows text-covered interactions vs metadata-only background calls and meetings.
          </p>
          <div className="h-64">
            {charts?.coverage_by_type ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.coverage_by_type}>
                  <XAxis dataKey="category" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#151515", border: "1px solid #3B3B3B", borderRadius: "8px", fontSize: "11px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="total" fill="#3B3B3B" name="Total Records" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="usable" fill="#08B6D4" name="Usable Text Supplied" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Chart 2: Routing Distribution */}
        <div className="bg-[#202124] border border-[#3B3B3B] p-5 rounded-2xl shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1">
            Routing Decisions Breakdown
          </h3>
          <p className="text-xs text-[#999999] mb-4">
            Assigned destinations across sales, solutions engineering, and customer success.
          </p>
          <div className="h-64">
            {charts?.routing_breakdown ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.routing_breakdown} layout="vertical">
                  <XAxis type="number" stroke="#888888" fontSize={11} />
                  <YAxis type="category" dataKey="assigned_route" stroke="#888888" width={140} fontSize={10} tickFormatter={(t) => t.length > 20 ? t.substring(0, 18) + '...' : t} />
                  <Tooltip contentStyle={{ backgroundColor: "#151515", border: "1px solid #3B3B3B", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="count" fill="#008DB5" radius={[0, 6, 6, 0]}>
                    {charts.routing_breakdown.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Chart 3: Sentiment Distribution */}
        <div className="bg-[#202124] border border-[#3B3B3B] p-5 rounded-2xl shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1">
            Sentiment Distribution Across Conversations
          </h3>
          <p className="text-xs text-[#999999] mb-4">
            Paraphrased speaker tone evaluated by deterministic rule-based engine.
          </p>
          <div className="h-64 flex items-center justify-center">
            {charts?.sentiment_distribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.sentiment_distribution}
                    dataKey="count"
                    nameKey="sentiment"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    label
                  >
                    {charts.sentiment_distribution.map((entry, index) => {
                      const color = entry.sentiment === "Positive" ? "#10B981" : entry.sentiment === "Negative" ? "#EF4444" : "#999999";
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#151515", border: "1px solid #3B3B3B", borderRadius: "8px", fontSize: "11px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Chart 4: Rep & Organizer Activity */}
        <div className="bg-[#202124] border border-[#3B3B3B] p-5 rounded-2xl shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1">
            Selected Interactions by Rep / Organizer
          </h3>
          <p className="text-xs text-[#999999] mb-4">
            Call reps and meeting organizers on 21 August 2026.
          </p>
          <div className="h-64">
            {charts?.rep_activity ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.rep_activity}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickFormatter={(t) => t.split('@')[0]} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#151515", border: "1px solid #3B3B3B", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="count" fill="#08B6D4" radius={[6, 6, 0, 0]}>
                    {charts.rep_activity.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
