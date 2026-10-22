import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from app.database import get_db, record_audit
from pydantic import BaseModel

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])

class RecordUpdatePayload(BaseModel):
    assigned_route: Optional[str] = None
    priority: Optional[str] = None
    summary: Optional[str] = None
    reason: Optional[str] = "Manual correction by Sales Manager"
    user: Optional[str] = "Sales Manager"

@router.get("")
def list_conversations(
    source_type: Optional[str] = None,
    has_usable_text: Optional[int] = None,
    search: Optional[str] = None,
    assigned_route: Optional[str] = None,
    sentiment: Optional[str] = None,
    priority: Optional[str] = None,
    deal_risk: Optional[str] = None,
    intake_state: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    with get_db() as conn:
        query = """
            SELECT r.*, 
                   a.summary, a.sentiment, a.sentiment_score, a.buying_intent,
                   a.priority, a.deal_risk, a.deal_risk_score, a.positive_signals,
                   a.negative_signals, a.objections, a.competitor_mentions, a.evidence_citations,
                   rt.assigned_route, rt.suggested_route, rt.target_owner, rt.target_team,
                   rt.is_manual_override, rt.override_reason, rt.status as routing_status,
                   rt.requires_manual_review, rt.evidence_citation
            FROM source_records r
            LEFT JOIN (
                SELECT * FROM conversation_analyses WHERE id IN (
                    SELECT MAX(id) FROM conversation_analyses GROUP BY source_type, source_id
                )
            ) a ON r.source_type = a.source_type AND r.source_id = a.source_id
            LEFT JOIN routing_decisions rt ON r.source_type = rt.source_type AND r.source_id = rt.source_id
            WHERE 1=1
        """
        params = []

        if source_type:
            query += " AND r.source_type = ?"
            params.append(source_type)
        if has_usable_text is not None:
            query += " AND r.has_usable_text = ?"
            params.append(has_usable_text)
        if assigned_route:
            query += " AND rt.assigned_route = ?"
            params.append(assigned_route)
        if sentiment:
            query += " AND a.sentiment = ?"
            params.append(sentiment)
        if priority:
            query += " AND a.priority = ?"
            params.append(priority)
        if deal_risk:
            query += " AND a.deal_risk = ?"
            params.append(deal_risk)
        if intake_state:
            query += " AND r.intake_state = ?"
            params.append(intake_state)
        if search:
            query += """ AND (
                r.record_ref LIKE ? OR 
                r.rep_or_organizer LIKE ? OR 
                r.title_or_direction LIKE ? OR 
                r.raw_text LIKE ? OR
                a.summary LIKE ?
            )"""
            s = f"%{search}%"
            params.extend([s, s, s, s, s])

        query += " ORDER BY r.record_ref ASC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(query, params).fetchall()

    result = []
    for r in rows:
        item = dict(r)
        for jf in ["positive_signals", "negative_signals", "objections", "competitor_mentions", "evidence_citations"]:
            if item.get(jf):
                try:
                    item[jf] = json.loads(item[jf])
                except Exception:
                    pass
        result.append(item)

    return {"records": result, "count": len(result)}

@router.get("/{source_type}/{source_id}")
def get_conversation_detail(source_type: str, source_id: str):
    with get_db() as conn:
        record = conn.execute("""
            SELECT * FROM source_records WHERE source_type = ? AND source_id = ?
        """, (source_type, source_id)).fetchone()
        if not record:
            raise HTTPException(status_code=404, detail="Source record not found")

        analysis = conn.execute("""
            SELECT * FROM conversation_analyses WHERE source_type = ? AND source_id = ? ORDER BY version DESC, id DESC LIMIT 1
        """, (source_type, source_id)).fetchone()

        routing = conn.execute("""
            SELECT * FROM routing_decisions WHERE source_type = ? AND source_id = ?
        """, (source_type, source_id)).fetchone()

        corrections = conn.execute("""
            SELECT * FROM manual_corrections WHERE source_type = ? AND source_id = ? ORDER BY created_at DESC
        """, (source_type, source_id)).fetchall()

    rec_dict = dict(record)
    if rec_dict.get("source_payload"):
        try:
            rec_dict["payload"] = json.loads(rec_dict["source_payload"])
        except Exception:
            rec_dict["payload"] = {}

    if rec_dict.get("transcript_payload"):
        try:
            rec_dict["transcript_payload"] = json.loads(rec_dict["transcript_payload"])
        except Exception:
            rec_dict["transcript_payload"] = None

    if analysis:
        a_dict = dict(analysis)
        for jf in ["customer_needs", "pain_points", "positive_signals", "negative_signals", "objections", "competitor_mentions", "next_steps", "risk_factors", "evidence_citations"]:
            if a_dict.get(jf):
                try:
                    a_dict[jf] = json.loads(a_dict[jf])
                except Exception:
                    pass
        rec_dict["analysis"] = a_dict
    else:
        rec_dict["analysis"] = None

    if routing:
        r_dict = dict(routing)
        if r_dict.get("rules_matched"):
            try:
                r_dict["rules_matched"] = json.loads(r_dict["rules_matched"])
            except Exception:
                pass
        rec_dict["routing"] = r_dict
    else:
        rec_dict["routing"] = None

    rec_dict["manual_corrections"] = [dict(c) for c in corrections]
    return rec_dict

@router.patch("/{source_type}/{source_id}")
def update_conversation_record(source_type: str, source_id: str, payload: RecordUpdatePayload):
    with get_db() as conn:
        record = conn.execute("""
            SELECT * FROM source_records WHERE source_type = ? AND source_id = ?
        """, (source_type, source_id)).fetchone()
        if not record:
            raise HTTPException(status_code=404, detail="Source record not found")

        routing = conn.execute("""
            SELECT * FROM routing_decisions WHERE source_type = ? AND source_id = ?
        """, (source_type, source_id)).fetchone()

        now = datetime.utcnow().isoformat()
        user = payload.user or "Sales Manager"

        # If assigned_route changed
        if payload.assigned_route is not None:
            old_route = routing["assigned_route"] if routing else "Unassigned"
            conn.execute("""
                UPDATE routing_decisions SET
                    assigned_route = ?,
                    is_manual_override = 1,
                    override_reason = ?,
                    override_by = ?,
                    override_at = ?,
                    status = 'Manually Overridden',
                    requires_manual_review = 0,
                    updated_at = ?
                WHERE source_type = ? AND source_id = ?
            """, (payload.assigned_route, payload.reason, user, now, now, source_type, source_id))

            # Record manual correction
            conn.execute("""
                INSERT INTO manual_corrections (
                    source_type, source_id, record_ref, field_name,
                    previous_value, new_value, reason, user, created_at
                ) VALUES (?, ?, ?, 'assigned_route', ?, ?, ?, ?, ?)
            """, (source_type, source_id, record["record_ref"], old_route, payload.assigned_route, payload.reason, user, now))

        # If priority or summary changed
        if payload.priority or payload.summary:
            latest_a = conn.execute("""
                SELECT * FROM conversation_analyses WHERE source_type = ? AND source_id = ? ORDER BY version DESC, id DESC LIMIT 1
            """, (source_type, source_id)).fetchone()
            if latest_a:
                updates = []
                params = []
                if payload.priority:
                    updates.append("priority = ?")
                    params.append(payload.priority)
                    conn.execute("""
                        INSERT INTO manual_corrections (
                            source_type, source_id, record_ref, field_name,
                            previous_value, new_value, reason, user, created_at
                        ) VALUES (?, ?, ?, 'priority', ?, ?, ?, ?, ?)
                    """, (source_type, source_id, record["record_ref"], latest_a["priority"], payload.priority, payload.reason, user, now))

                if payload.summary:
                    updates.append("summary = ?")
                    params.append(payload.summary)
                    conn.execute("""
                        INSERT INTO manual_corrections (
                            source_type, source_id, record_ref, field_name,
                            previous_value, new_value, reason, user, created_at
                        ) VALUES (?, ?, ?, 'summary', ?, ?, ?, ?, ?)
                    """, (source_type, source_id, record["record_ref"], latest_a["summary"][:50], payload.summary[:50], payload.reason, user, now))

                params.append(latest_a["id"])
                conn.execute(f"UPDATE conversation_analyses SET {', '.join(updates)} WHERE id = ?", params)

        record_audit("conversation", f"{source_type}:{source_id}", "manual_override", {
            "record_ref": record["record_ref"],
            "assigned_route": payload.assigned_route,
            "reason": payload.reason
        }, user=user, conn=conn)

    return {"status": "success", "source_type": source_type, "source_id": source_id, "record_ref": record["record_ref"]}
