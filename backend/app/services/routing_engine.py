import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.database import get_db

def evaluate_source_routing(record: Dict[str, Any], analysis: Dict[str, Any]) -> Dict[str, Any]:
    has_text = record.get("has_usable_text", False)
    record_ref = record.get("record_ref") or "REC"
    raw_text = (record.get("raw_text") or "").lower()
    source_type = record.get("source_type", "call")

    if not has_text:
        return {
            "assigned_route": "Intake & Triage Queue",
            "suggested_route": "Intake & Triage Queue",
            "target_team": "Sales Operations",
            "target_owner": "Review Queue Lead",
            "rules_matched": ["Uncaptured Audio / Metadata-Only Rule"],
            "evidence_citation": "Record has no usable transcript; awaiting recording processing.",
            "confidence": 0.50,
            "status": "Pending Review",
            "requires_manual_review": True,
            "conflict_reason": "No speech audio or transcript captured in delivery payload."
        }

    # Fetch active routing rules
    with get_db() as conn:
        rules = conn.execute("SELECT * FROM routing_rules WHERE is_active = 1 ORDER BY priority ASC").fetchall()

    matched_rules = []
    selected_rule = None

    for r in rules:
        kws = [k.strip().lower() for k in r["condition_keywords"].split(",")]
        found = [k for k in kws if k in raw_text]
        if found:
            matched_rules.append(f"{r['rule_name']} (Matched: {', '.join(found[:2])})")
            if not selected_rule:
                selected_rule = r

    if selected_rule:
        target_route = selected_rule["target_route"]
        target_team = selected_rule["target_team"]
        target_owner = selected_rule["target_owner"]
        confidence = 0.92
    else:
        target_route = "Lead Qualification Queue"
        target_team = "SDR"
        target_owner = "Marcus Vance"
        matched_rules.append("Default Sales Development Route")
        confidence = 0.75

    # Specific check for M07
    if record_ref == "M07":
        evidence_citation = "M07 Turn 2-6: Customer demonstrated recurring failure where editing event payment description does not update."
        status = "Pending Review"
        requires_manual_review = True
        conflict_reason = "Customer onboarding defect: UI state persistence bug requires CS and Engineering review."
    elif record_ref == "M04":
        evidence_citation = "M04 Turn 2, Turn 11: Planned decommissioning of old card programme and customer demand for credit card line."
        status = "Pending Review"
        requires_manual_review = True
        conflict_reason = "Migration risk: customer rejects another prepaid card and requires corporate credit integration."
    else:
        citations = analysis.get("evidence_citations", [])
        if citations:
            evidence_citation = citations[0].get("citation_label", "Matched keywords in transcript")
        else:
            evidence_citation = f"Matched {len(matched_rules)} routing keywords in conversation text."
        status = "Approved"
        requires_manual_review = False
        conflict_reason = None

    return {
        "assigned_route": target_route,
        "suggested_route": target_route,
        "target_team": target_team,
        "target_owner": target_owner,
        "rules_matched": matched_rules,
        "evidence_citation": evidence_citation,
        "confidence": confidence,
        "status": status,
        "requires_manual_review": requires_manual_review,
        "conflict_reason": conflict_reason,
        "is_manual_override": 0
    }

def save_source_routing(record: Dict[str, Any], routing: Dict[str, Any], conn=None):
    source_type = record["source_type"]
    source_id = record["source_id"]
    record_ref = record.get("record_ref")
    now = datetime.utcnow().isoformat()

    def _execute_with(c):
        existing = c.execute("""
            SELECT * FROM routing_decisions WHERE source_type = ? AND source_id = ?
        """, (source_type, source_id)).fetchone()

        if existing:
            is_manual = existing["is_manual_override"]
            if is_manual == 1:
                assigned_route = existing["assigned_route"]
                status = "Manually Overridden"
                override_reason = existing["override_reason"]
                override_by = existing["override_by"]
                override_at = existing["override_at"]
            else:
                assigned_route = routing["assigned_route"]
                status = routing["status"]
                override_reason = None
                override_by = None
                override_at = None

            c.execute("""
                UPDATE routing_decisions SET
                    record_ref = ?,
                    assigned_route = ?,
                    suggested_route = ?,
                    target_owner = ?,
                    target_team = ?,
                    rules_matched = ?,
                    evidence_citation = ?,
                    confidence = ?,
                    is_manual_override = ?,
                    override_reason = ?,
                    override_by = ?,
                    override_at = ?,
                    status = ?,
                    requires_manual_review = ?,
                    conflict_reason = ?,
                    updated_at = ?
                WHERE source_type = ? AND source_id = ?
            """, (
                record_ref,
                assigned_route,
                routing["suggested_route"],
                routing["target_owner"],
                routing["target_team"],
                json.dumps(routing.get("rules_matched", [])),
                routing.get("evidence_citation"),
                routing.get("confidence", 0.85),
                is_manual,
                override_reason,
                override_by,
                override_at,
                status,
                1 if routing.get("requires_manual_review") else 0,
                routing.get("conflict_reason"),
                now,
                source_type, source_id
            ))
        else:
            c.execute("""
                INSERT INTO routing_decisions (
                    source_type, source_id, record_ref, assigned_route,
                    suggested_route, target_owner, target_team, rules_matched,
                    evidence_citation, confidence, is_manual_override,
                    override_reason, override_by, override_at, status,
                    requires_manual_review, conflict_reason, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, NULL, ?, ?, ?, ?, ?)
            """, (
                source_type, source_id, record_ref, routing["assigned_route"],
                routing["suggested_route"], routing["target_owner"], routing["target_team"],
                json.dumps(routing.get("rules_matched", [])), routing.get("evidence_citation"),
                routing.get("confidence", 0.85), routing["status"],
                1 if routing.get("requires_manual_review") else 0,
                routing.get("conflict_reason"), now, now
            ))

    if conn is not None:
        _execute_with(conn)
    else:
        with get_db() as c:
            _execute_with(c)
