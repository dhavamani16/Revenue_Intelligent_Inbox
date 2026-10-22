import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from app.database import get_db, record_audit
from pydantic import BaseModel

router = APIRouter(prefix="/api/routing", tags=["Routing"])

class RouteApprovePayload(BaseModel):
    reviewer: Optional[str] = "Sales Manager"
    reason: Optional[str] = "Approved automated route recommendation"

class RouteOverridePayload(BaseModel):
    new_route: str
    target_owner: Optional[str] = "Elena Rostova"
    target_team: Optional[str] = "Customer Success"
    override_reason: str
    reviewer: Optional[str] = "Sales Manager"

@router.get("")
def list_routing_decisions(
    status: Optional[str] = None,
    is_manual_override: Optional[int] = None,
    requires_manual_review: Optional[int] = None,
    assigned_route: Optional[str] = None,
    search: Optional[str] = None
):
    with get_db() as conn:
        query = """
            SELECT rt.*, 
                   r.rep_or_organizer, r.title_or_direction, r.occurred_at,
                   r.has_usable_text, r.intake_state, r.raw_text,
                   a.summary, a.deal_risk, a.deal_risk_score, a.priority, a.evidence_citations
            FROM routing_decisions rt
            JOIN source_records r ON rt.source_type = r.source_type AND rt.source_id = r.source_id
            LEFT JOIN (
                SELECT * FROM conversation_analyses WHERE id IN (
                    SELECT MAX(id) FROM conversation_analyses GROUP BY source_type, source_id
                )
            ) a ON rt.source_type = a.source_type AND rt.source_id = a.source_id
            WHERE 1=1
        """
        params = []

        if status:
            query += " AND rt.status = ?"
            params.append(status)
        if is_manual_override is not None:
            query += " AND rt.is_manual_override = ?"
            params.append(is_manual_override)
        if requires_manual_review is not None:
            query += " AND rt.requires_manual_review = ?"
            params.append(requires_manual_review)
        if assigned_route:
            query += " AND rt.assigned_route = ?"
            params.append(assigned_route)
        if search:
            query += " AND (rt.record_ref LIKE ? OR rt.assigned_route LIKE ? OR rt.target_owner LIKE ? OR r.rep_or_organizer LIKE ?)"
            s = f"%{search}%"
            params.extend([s, s, s, s])

        query += " ORDER BY rt.requires_manual_review DESC, rt.record_ref ASC"
        rows = conn.execute(query, params).fetchall()

    result = []
    for r in rows:
        item = dict(r)
        if item.get("rules_matched"):
            try:
                item["rules_matched"] = json.loads(item["rules_matched"])
            except Exception:
                pass
        if item.get("evidence_citations"):
            try:
                item["evidence_citations"] = json.loads(item["evidence_citations"])
            except Exception:
                pass
        result.append(item)

    return {"decisions": result, "count": len(result)}

@router.post("/{source_type}/{source_id}/approve")
def approve_route(source_type: str, source_id: str, payload: RouteApprovePayload):
    with get_db() as conn:
        rt = conn.execute("SELECT * FROM routing_decisions WHERE source_type = ? AND source_id = ?", (source_type, source_id)).fetchone()
        if not rt:
            raise HTTPException(status_code=404, detail="Routing decision not found")

        now = datetime.utcnow().isoformat()
        reviewer = payload.reviewer or "Sales Manager"

        conn.execute("""
            UPDATE routing_decisions SET
                assigned_route = suggested_route,
                status = 'Approved',
                requires_manual_review = 0,
                updated_at = ?
            WHERE source_type = ? AND source_id = ?
        """, (now, source_type, source_id))

        record_audit("routing", f"{source_type}:{source_id}", "route_approved", {
            "record_ref": rt["record_ref"],
            "route": rt["suggested_route"],
            "reason": payload.reason
        }, user=reviewer)

    return {"status": "success", "assigned_route": rt["suggested_route"]}

@router.post("/{source_type}/{source_id}/override")
def override_route(source_type: str, source_id: str, payload: RouteOverridePayload):
    with get_db() as conn:
        rt = conn.execute("SELECT * FROM routing_decisions WHERE source_type = ? AND source_id = ?", (source_type, source_id)).fetchone()
        if not rt:
            raise HTTPException(status_code=404, detail="Routing decision not found")

        now = datetime.utcnow().isoformat()
        reviewer = payload.reviewer or "Sales Manager"
        old_route = rt["assigned_route"]

        conn.execute("""
            UPDATE routing_decisions SET
                assigned_route = ?,
                target_owner = ?,
                target_team = ?,
                is_manual_override = 1,
                override_reason = ?,
                override_by = ?,
                override_at = ?,
                status = 'Manually Overridden',
                requires_manual_review = 0,
                updated_at = ?
            WHERE source_type = ? AND source_id = ?
        """, (payload.new_route, payload.target_owner, payload.target_team, payload.override_reason, reviewer, now, now, source_type, source_id))

        # Record in manual corrections
        conn.execute("""
            INSERT INTO manual_corrections (
                source_type, source_id, record_ref, field_name,
                previous_value, new_value, reason, user, created_at
            ) VALUES (?, ?, ?, 'assigned_route', ?, ?, ?, ?, ?)
        """, (source_type, source_id, rt["record_ref"], old_route, payload.new_route, payload.override_reason, reviewer, now))

        record_audit("routing", f"{source_type}:{source_id}", "route_overridden", {
            "record_ref": rt["record_ref"],
            "old_route": old_route,
            "new_route": payload.new_route,
            "reason": payload.override_reason
        }, user=reviewer)

    return {
        "status": "success",
        "record_ref": rt["record_ref"],
        "assigned_route": payload.new_route,
        "is_manual_override": True
    }
