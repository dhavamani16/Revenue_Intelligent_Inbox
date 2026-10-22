import json
from datetime import datetime
from typing import Dict, Any, List
from app.database import get_db, record_audit

def get_data_quality_stats() -> Dict[str, Any]:
    with get_db() as conn:
        total_conv = conn.execute("SELECT COUNT(*) as c FROM conversations WHERE is_deleted = 0").fetchone()["c"]
        batches = conn.execute("""
            SELECT 
                COALESCE(SUM(total_records), 0) as total_imported,
                COALESCE(SUM(new_records), 0) as new_records,
                COALESCE(SUM(exact_duplicates), 0) as exact_duplicates,
                COALESCE(SUM(updated_records), 0) as updated_records,
                COALESCE(SUM(potential_duplicates), 0) as potential_duplicates,
                COALESCE(SUM(conflicts), 0) as conflicts,
                COALESCE(SUM(invalid_records), 0) as invalid_records
            FROM import_batches
        """).fetchone()

        pending_dups = conn.execute("SELECT COUNT(*) as c FROM duplicate_reviews WHERE status = 'pending'").fetchone()["c"]
        manual_corrections_count = conn.execute("SELECT COUNT(*) as c FROM manual_corrections").fetchone()["c"]
        routing_reviews = conn.execute("SELECT COUNT(*) as c FROM routing_decisions WHERE requires_manual_review = 1").fetchone()["c"]

    return {
        "total_active_conversations": total_conv,
        "total_imported_records": batches["total_imported"] or total_conv,
        "valid_records": total_conv,
        "records_with_missing_fields": batches["invalid_records"],
        "exact_duplicates": batches["exact_duplicates"],
        "potential_duplicates": batches["potential_duplicates"] + pending_dups,
        "updated_records": batches["updated_records"],
        "conflicts": batches["conflicts"],
        "pending_duplicate_reviews": pending_dups,
        "manual_corrections_applied": manual_corrections_count,
        "routing_conflicts": routing_reviews,
        "failed_analysis_jobs": 0
    }

def get_duplicate_reviews() -> List[Dict[str, Any]]:
    with get_db() as conn:
        reviews = conn.execute("""
            SELECT d.*, 
                   c1.customer_name as primary_customer, c1.company as primary_company, c1.occurred_at as primary_occurred_at, c1.raw_transcript as primary_transcript,
                   c2.customer_name as candidate_customer, c2.company as candidate_company, c2.occurred_at as candidate_occurred_at, c2.raw_transcript as candidate_transcript
            FROM duplicate_reviews d
            LEFT JOIN conversations c1 ON d.primary_conversation_id = c1.conversation_id
            LEFT JOIN conversations c2 ON d.duplicate_candidate_id = c2.conversation_id
            ORDER BY d.created_at DESC
        """).fetchall()
    
    result = []
    for r in reviews:
        item = dict(r)
        if item.get("field_differences"):
            try:
                item["field_differences"] = json.loads(item["field_differences"])
            except Exception:
                pass
        result.append(item)
    return result

def resolve_duplicate(review_id: int, action: str, merged_fields: Dict[str, Any] = None, notes: str = None, reviewer: str = "Sales Manager"):
    with get_db() as conn:
        review = conn.execute("SELECT * FROM duplicate_reviews WHERE id = ?", (review_id,)).fetchone()
        if not review:
            raise ValueError(f"Duplicate review ID {review_id} not found")

        now = datetime.utcnow().isoformat()
        primary_id = review["primary_conversation_id"]
        candidate_id = review["duplicate_candidate_id"]

        if action == "mark_same":
            # Soft delete candidate or mark as duplicate
            conn.execute("UPDATE conversations SET is_deleted = 1, updated_at = ? WHERE conversation_id = ?", (now, candidate_id))
            status = "marked_same"
        elif action == "keep_separate":
            status = "kept_separate"
        elif action == "merge":
            if merged_fields:
                for field, val in merged_fields.items():
                    conn.execute(f"UPDATE conversations SET {field} = ?, updated_at = ? WHERE conversation_id = ?", (val, now, primary_id))
            conn.execute("UPDATE conversations SET is_deleted = 1, updated_at = ? WHERE conversation_id = ?", (now, candidate_id))
            status = "merged"
        elif action == "accept_update":
            status = "accepted_update"
        elif action == "reject_update":
            status = "rejected_update"
        else:
            status = action

        conn.execute("""
            UPDATE duplicate_reviews SET status = ?, resolution_notes = ?, resolved_by = ?, resolved_at = ?
            WHERE id = ?
        """, (status, notes or f"Action {action} performed", reviewer, now, review_id))

        record_audit("duplicate", str(review_id), f"duplicate_{action}", {
            "primary_id": primary_id,
            "candidate_id": candidate_id,
            "action": action,
            "notes": notes,
            "merged_fields": merged_fields
        }, user=reviewer)

    return {"status": "success", "action": action, "review_id": review_id}
