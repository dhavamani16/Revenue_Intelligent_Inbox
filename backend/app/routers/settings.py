from fastapi import APIRouter
from typing import Dict, Any, List
from app.database import get_db, record_audit
from pydantic import BaseModel

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class RoutingRulePayload(BaseModel):
    rule_name: str
    condition_keywords: str
    target_route: str
    target_team: str
    target_owner: str
    priority: int = 1
    is_active: bool = True
    description: str = ""

@router.get("/rules")
def get_routing_rules():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM routing_rules ORDER BY priority ASC").fetchall()
    return {"rules": [dict(r) for r in rows]}

@router.post("/reset-database")
def reset_database():
    with get_db() as conn:
        conn.execute("DELETE FROM conversation_analyses")
        conn.execute("DELETE FROM routing_decisions")
        conn.execute("DELETE FROM manual_corrections")
        conn.execute("DELETE FROM import_batches")
        conn.execute("DELETE FROM source_records")
        conn.execute("DELETE FROM audit_history")
    return {"status": "success", "message": "Database successfully reset to clean state."}
