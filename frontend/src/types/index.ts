export interface EvidenceCitation {
  record_ref: string;
  source_id: string;
  turn_number?: number;
  speaker?: string;
  timecode?: string;
  quote: string;
  topic: string;
  citation_label: string;
}

export interface SourceRecord {
  source_type: "call" | "meeting";
  source_id: string;
  record_ref: string;
  revision: number;
  batch_id: string;
  occurred_at: string;
  rep_or_organizer: string;
  title_or_direction: string;
  has_usable_text: number;
  usable_text_length: number;
  raw_text: string;
  intake_state: string;
  analysis_freshness: string;
  summary?: string;
  sentiment?: "Positive" | "Neutral" | "Negative";
  sentiment_score?: number;
  priority?: "Critical" | "High" | "Medium" | "Low";
  deal_risk?: "Critical" | "High" | "Medium" | "Low" | "Healthy";
  deal_risk_score?: number;
  assigned_route?: string;
  suggested_route?: string;
  target_owner?: string;
  target_team?: string;
  is_manual_override?: number;
  override_reason?: string;
  override_by?: string;
  override_at?: string;
  evidence_citations?: EvidenceCitation[];
  risk_factors?: string[];
  objections?: string[];
  positive_signals?: string[];
  negative_signals?: string[];
  customer_needs?: string[];
  pain_points?: string[];
  bant_budget?: string;
  bant_authority?: string;
  bant_need?: string;
  bant_timeline?: string;
  recommended_action?: string;
  next_steps?: string[];
  payload?: any;
  transcript_payload?: any;
  manual_corrections?: Array<{
    id: number;
    field_name: string;
    previous_value: string;
    new_value: string;
    reason: string;
    user: string;
    created_at: string;
  }>;
}

export interface DashboardSummary {
  total_conversations: number;
  usable_supplied_texts: number;
  text_coverage_percent: number;
  calls_count: number;
  meetings_count: number;
  calls_usable: number;
  meetings_usable: number;
  high_priority_conversations: number;
  unresolved_routing_decisions: number;
  at_risk_deals: number;
  manual_overrides_active: number;
  positive_buying_signals: number;
  negative_buying_signals: number;
  conversations_requiring_attention: number;
}

export interface ChartData {
  routing_breakdown: Array<{ assigned_route: string; count: number }>;
  coverage_by_type: Array<{ category: string; total: number; usable: number }>;
  sentiment_distribution: Array<{ sentiment: string; count: number }>;
  priority_distribution: Array<{ priority: string; count: number }>;
  deal_risk_distribution: Array<{ deal_risk: string; count: number }>;
  rep_activity: Array<{ name: string; count: number }>;
}

export interface FindingItem {
  id: string;
  title: string;
  explanation: string;
  metric: string;
  supporting_record_count: number;
  conversation_ids: string[];
  excerpts: Array<{
    record_ref: string;
    speaker: string;
    turn?: number;
    turn_number?: number;
    citation_label?: string;
    quote: string;
    context: string;
  }>;
  confidence: string;
  suggested_action: string;
}

export interface RejectedDecision {
  id?: number;
  decision_considered: string;
  initial_rationale: string;
  evidence_reviewed: string;
  rejection_reason: string;
  potential_drawbacks: string;
  alternative_selected: string;
  author: string;
  created_at?: string;
}

export interface ManagerBrief {
  brief_date: string;
  headline: string;
  executive_summary: string;
  key_priorities: Array<{ priority: string; action: string }>;
  rep_coaching_notes: Array<{ rep: string; observation: string }>;
}
