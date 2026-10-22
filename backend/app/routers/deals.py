import json
from fastapi import APIRouter
from typing import Dict, Any, List
from app.database import get_db

router = APIRouter(prefix="/api/deals", tags=["Deals & Risk"])

@router.get("/at-risk")
def get_at_risk_deals():
    with get_db() as conn:
        rows = conn.execute("""
            SELECT r.*, 
                   a.summary, a.deal_risk, a.deal_risk_score, a.risk_factors,
                   a.recommended_action, a.evidence_citations, a.sentiment,
                   rt.assigned_route, rt.target_owner, rt.target_team, rt.status as routing_status
            FROM source_records r
            JOIN conversation_analyses a ON r.source_type = a.source_type AND r.source_id = a.source_id
            LEFT JOIN routing_decisions rt ON r.source_type = rt.source_type AND r.source_id = rt.source_id
            WHERE a.deal_risk IN ('Critical', 'High', 'Medium')
            ORDER BY a.deal_risk_score DESC, r.record_ref ASC
        """).fetchall()

    result = []
    for r in rows:
        item = dict(r)
        if item.get("risk_factors"):
            try:
                item["risk_factors"] = json.loads(item["risk_factors"])
            except Exception:
                pass
        if item.get("evidence_citations"):
            try:
                item["evidence_citations"] = json.loads(item["evidence_citations"])
            except Exception:
                pass
        result.append(item)

    return {"at_risk_records": result, "count": len(result)}
