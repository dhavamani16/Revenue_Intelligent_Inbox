from fastapi import APIRouter
from typing import Dict, Any, List
from app.services.findings_engine import compute_evidence_findings, get_rejected_decisions, add_rejected_decision
from pydantic import BaseModel

router = APIRouter(prefix="/api/findings", tags=["Evidence & Findings"])

class RejectedDecisionPayload(BaseModel):
    decision_considered: str
    initial_rationale: str
    evidence_reviewed: str
    rejection_reason: str
    potential_drawbacks: str
    alternative_selected: str
    author: str = "Sales Operations Lead"

@router.get("")
def get_findings():
    findings = compute_evidence_findings()
    decisions = get_rejected_decisions()
    return {
        "findings": findings,
        "rejected_decisions": decisions
    }

@router.post("/decision")
def create_rejected_decision(payload: RejectedDecisionPayload):
    return add_rejected_decision(payload.dict())

@router.get("/manager-brief")
def get_manager_brief():
    return {
        "brief_date": "21 August 2026 (Asia/Kolkata)",
        "headline": "Manager Daily Intelligence Brief — SpendNest Operations",
        "executive_summary": "Intake for 21 August 2026 comprises 44 selected interactions (30 calls, 14 meetings). 18 conversations feature verified text transcripts, with M07 delivering critical onboarding defect evidence upon revision 2 update.",
        "key_priorities": [
            {
                "priority": "P0 Onboarding Escalation (M07 Willowfield Trust)",
                "action": "Urgent bug triage: customer demonstrated payment description edit failing to persist after save. Alert Frontend Engineering and schedule manager check-in."
            },
            {
                "priority": "P1 Programme Migration (M04 Cedarwave Distribution)",
                "action": "Decommissioning old card programme requires hybrid credit/prepaid pathway. Confirm bank credit line transaction feed eligibility."
            },
            {
                "priority": "P2 High-Velocity Channel Rollout (M01 Harborpath Advisory)",
                "action": "Partner agreed to USD 260 activation terms. Deliver unique tracked referral URL and marketing co-branding to scale incorporation referrals."
            }
        ],
        "rep_coaching_notes": [
            {
                "rep": "Arun (Outbound Calls)",
                "observation": "C01 met strong cold call resistance regarding existing automation. Coaching point: shift opener to asking about specific pain points in multi-currency wallets rather than pitching general automation."
            },
            {
                "rep": "Meera (Retail & Store Outbound)",
                "observation": "C05, C08, C09: Successfully elicited prospect tech stack (StoreHarbor) and secondary decision-maker referral (Mr. Rishabh). Good persistence; ensure email collateral emphasizes SpendNest payment execution vs pure reporting."
            }
        ]
    }
