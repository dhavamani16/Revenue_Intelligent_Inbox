from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ConversationBase(BaseModel):
    conversation_id: str
    external_id: Optional[str] = None
    source_system: Optional[str] = "CRM"
    source_record_id: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: str
    company: str
    deal_id: Optional[str] = None
    deal_name: Optional[str] = None
    deal_stage: Optional[str] = "Discovery"
    deal_value: Optional[float] = None
    conversation_type: str = "Call"  # Call or Meeting
    occurred_at: str
    owner: str
    team: str
    raw_transcript: str

class EvidenceExcerpt(BaseModel):
    quote: str
    context: Optional[str] = None
    position: Optional[int] = None
    topic: Optional[str] = None

class ConversationAnalysisDTO(BaseModel):
    summary: str
    customer_needs: List[str] = []
    pain_points: List[str] = []
    buying_intent: str = "Medium"
    sentiment: str = "Neutral"
    sentiment_score: float = 0.0
    positive_signals: List[str] = []
    negative_signals: List[str] = []
    objections: List[str] = []
    competitor_mentions: List[str] = []
    bant_budget: Optional[str] = "Not specified"
    bant_authority: Optional[str] = "Not specified"
    bant_need: Optional[str] = "Not specified"
    bant_timeline: Optional[str] = "Not specified"
    next_steps: List[str] = []
    follow_up_date: Optional[str] = None
    priority: str = "Medium"
    priority_reason: Optional[str] = None
    deal_risk: str = "Healthy"
    deal_risk_score: int = 20
    risk_factors: List[str] = []
    recommended_action: Optional[str] = None
    evidence_excerpts: List[EvidenceExcerpt] = []
    analysis_provider: str = "Rule-Based Engine (Deterministic)"
    confidence_score: float = 0.85

class RoutingDecisionDTO(BaseModel):
    assigned_owner: str
    assigned_team: str
    suggested_owner: str
    suggested_team: str
    alternative_candidate: Optional[str] = None
    alternative_team: Optional[str] = None
    rules_matched: List[str] = []
    evidence_text: Optional[str] = None
    confidence: float = 0.8
    status: str = "Pending Review"
    requires_manual_review: bool = False
    conflict_reason: Optional[str] = None
    override_reason: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None

class ConversationDetail(ConversationBase):
    id: int
    version: int = 1
    analysis: Optional[ConversationAnalysisDTO] = None
    routing: Optional[RoutingDecisionDTO] = None
    created_at: str
    updated_at: str

class ConversationUpdatePayload(BaseModel):
    summary: Optional[str] = None
    priority: Optional[str] = None
    owner: Optional[str] = None
    team: Optional[str] = None
    deal_stage: Optional[str] = None
    deal_value: Optional[float] = None
    next_steps: Optional[List[str]] = None
    review_status: Optional[str] = None
    reason: Optional[str] = "Manual correction by Sales Manager"
    user: Optional[str] = "Sales Manager"

class ManualCorrectionItem(BaseModel):
    id: int
    conversation_id: str
    field_name: str
    previous_value: Optional[str]
    new_value: str
    reason: Optional[str]
    user: str
    created_at: str

class RoutingApprovePayload(BaseModel):
    reviewer: Optional[str] = "Sales Manager"
    reason: Optional[str] = "Approved recommendation"

class RoutingOverridePayload(BaseModel):
    new_owner: str
    new_team: str
    override_reason: str
    reviewer: Optional[str] = "Sales Manager"

class DuplicateResolvePayload(BaseModel):
    action: str  # mark_same | keep_separate | merge | accept_update | reject_update
    merged_fields: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    reviewer: Optional[str] = "Sales Manager"

class RejectedDecisionCreate(BaseModel):
    decision_considered: str
    initial_rationale: str
    evidence_reviewed: str
    rejection_reason: str
    potential_drawbacks: str
    alternative_selected: str
    author: Optional[str] = "Sales Operations Lead"

class ExportFilterParams(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    team: Optional[str] = None
    owner: Optional[str] = None
    sentiment: Optional[str] = None
    priority: Optional[str] = None
    routing_status: Optional[str] = None
    deal_risk: Optional[str] = None

class ImportPreviewRecord(BaseModel):
    index: int
    raw_data: Dict[str, Any]
    mapped_record: Dict[str, Any]
    status: str  # New, Exact Duplicate, Updated, Potential Duplicate, Invalid, Conflict
    match_id: Optional[str] = None
    missing_fields: List[str] = []
    differences: Dict[str, Dict[str, Any]] = {}

class ImportConfirmPayload(BaseModel):
    batch_id: str
    records: List[Dict[str, Any]]
    conflict_resolutions: Optional[Dict[str, str]] = {}  # conversation_id -> keep_existing | accept_incoming | merge

class RoutingRuleItem(BaseModel):
    id: Optional[int] = None
    rule_name: str
    condition_type: str
    condition_pattern: str
    target_team: str
    target_owner: str
    priority: int = 1
    is_active: bool = True
    description: Optional[str] = None
