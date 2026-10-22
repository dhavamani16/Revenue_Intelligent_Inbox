from fastapi import APIRouter
from typing import Optional, Dict, Any, List
from app.database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary():
    with get_db() as conn:
        total_records = conn.execute("SELECT COUNT(*) as c FROM source_records").fetchone()["c"]
        usable_texts = conn.execute("SELECT COUNT(*) as c FROM source_records WHERE has_usable_text = 1").fetchone()["c"]
        calls_count = conn.execute("SELECT COUNT(*) as c FROM source_records WHERE source_type = 'call'").fetchone()["c"]
        meetings_count = conn.execute("SELECT COUNT(*) as c FROM source_records WHERE source_type = 'meeting'").fetchone()["c"]
        calls_usable = conn.execute("SELECT COUNT(*) as c FROM source_records WHERE source_type = 'call' AND has_usable_text = 1").fetchone()["c"]
        meetings_usable = conn.execute("SELECT COUNT(*) as c FROM source_records WHERE source_type = 'meeting' AND has_usable_text = 1").fetchone()["c"]

        high_priority = conn.execute("""
            SELECT COUNT(*) as c FROM conversation_analyses WHERE priority IN ('Critical', 'High')
        """).fetchone()["c"]

        pending_routing = conn.execute("""
            SELECT COUNT(*) as c FROM routing_decisions WHERE requires_manual_review = 1
        """).fetchone()["c"]

        at_risk = conn.execute("""
            SELECT COUNT(*) as c FROM conversation_analyses WHERE deal_risk IN ('Critical', 'High')
        """).fetchone()["c"]

        manual_overrides = conn.execute("""
            SELECT COUNT(*) as c FROM routing_decisions WHERE is_manual_override = 1
        """).fetchone()["c"]

        pos_signals = conn.execute("""
            SELECT COUNT(*) as c FROM conversation_analyses WHERE sentiment = 'Positive' OR buying_intent = 'High'
        """).fetchone()["c"]

        neg_signals = conn.execute("""
            SELECT COUNT(*) as c FROM conversation_analyses WHERE sentiment = 'Negative' OR deal_risk IN ('Critical', 'High')
        """).fetchone()["c"]

    coverage_pct = round((usable_texts / total_records * 100), 1) if total_records > 0 else 0.0

    return {
        "total_conversations": total_records,
        "usable_supplied_texts": usable_texts,
        "text_coverage_percent": coverage_pct,
        "calls_count": calls_count,
        "meetings_count": meetings_count,
        "calls_usable": calls_usable,
        "meetings_usable": meetings_usable,
        "high_priority_conversations": high_priority,
        "unresolved_routing_decisions": pending_routing,
        "at_risk_deals": at_risk,
        "manual_overrides_active": manual_overrides,
        "positive_buying_signals": pos_signals,
        "negative_buying_signals": neg_signals,
        "conversations_requiring_attention": pending_routing + at_risk
    }

@router.get("/charts")
def get_dashboard_charts():
    with get_db() as conn:
        # 1. Routing Breakdown
        route_rows = conn.execute("""
            SELECT assigned_route, COUNT(*) as count
            FROM routing_decisions
            GROUP BY assigned_route
            ORDER BY count DESC
        """).fetchall()

        # 2. Text Coverage Calls vs Meetings
        coverage_rows = [
            {"category": "Calls", "total": conn.execute("SELECT COUNT(*) as c FROM source_records WHERE source_type = 'call'").fetchone()["c"], "usable": conn.execute("SELECT COUNT(*) as c FROM source_records WHERE source_type = 'call' AND has_usable_text = 1").fetchone()["c"]},
            {"category": "Meetings", "total": conn.execute("SELECT COUNT(*) as c FROM source_records WHERE source_type = 'meeting'").fetchone()["c"], "usable": conn.execute("SELECT COUNT(*) as c FROM source_records WHERE source_type = 'meeting' AND has_usable_text = 1").fetchone()["c"]}
        ]

        # 3. Sentiment Distribution
        sentiment_rows = conn.execute("""
            SELECT sentiment, COUNT(*) as count
            FROM conversation_analyses
            GROUP BY sentiment
        """).fetchall()

        # 4. Priority Distribution
        priority_rows = conn.execute("""
            SELECT priority, COUNT(*) as count
            FROM conversation_analyses
            GROUP BY priority
        """).fetchall()

        # 5. Deal Risk Distribution
        risk_rows = conn.execute("""
            SELECT deal_risk, COUNT(*) as count
            FROM conversation_analyses
            GROUP BY deal_risk
        """).fetchall()

        # 6. Rep / Organizer Activity
        rep_rows = conn.execute("""
            SELECT rep_or_organizer as name, COUNT(*) as count
            FROM source_records
            WHERE rep_or_organizer != 'Unassigned'
            GROUP BY rep_or_organizer
            ORDER BY count DESC
            LIMIT 7
        """).fetchall()

    return {
        "routing_breakdown": [dict(r) for r in route_rows],
        "coverage_by_type": coverage_rows,
        "sentiment_distribution": [dict(r) for r in sentiment_rows],
        "priority_distribution": [dict(r) for r in priority_rows],
        "deal_risk_distribution": [dict(r) for r in risk_rows],
        "rep_activity": [dict(r) for r in rep_rows]
    }
