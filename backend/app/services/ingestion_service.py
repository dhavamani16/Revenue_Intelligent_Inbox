import json
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional
from app.database import get_db, record_audit
from app.services.analysis_engine import analyze_source_record, save_source_analysis
from app.services.routing_engine import evaluate_source_routing, save_source_routing

def extract_usable_text(source_type: str, payload: Dict[str, Any], transcript_payload: Optional[Dict[str, Any]]) -> Tuple[bool, int, str]:
    if source_type == "call":
        t = payload.get("transcript")
        if t and t.strip():
            return True, len(t), t.strip()
        return False, 0, ""
    elif source_type == "meeting":
        if transcript_payload and transcript_payload.get("turns"):
            turns = transcript_payload["turns"]
            if len(turns) > 0:
                formatted = "\n".join([f"Turn {i+1} | {turn.get('timecode', '')} | {turn.get('speaker', 'Speaker')}: {turn.get('text', '')}" for i, turn in enumerate(turns)])
                return True, len(formatted), formatted
        return False, 0, ""
    return False, 0, ""

def process_envelope(envelope_data: Dict[str, Any], filename: str = "upload.json") -> Dict[str, Any]:
    batch_id = envelope_data.get("batch_id", "unknown-batch")
    revision = int(envelope_data.get("revision", 1))
    records = envelope_data.get("records", [])

    applied_count = 0
    ignored_count = 0
    now = datetime.utcnow().isoformat()

    with get_db() as conn:
        for r in records:
            source_type = r["source_type"]
            source_id = r["source_id"]
            record_ref = r.get("record_ref")
            payload = r.get("payload", {})
            transcript_payload = r.get("transcript_payload")

            has_usable, text_len, raw_text = extract_usable_text(source_type, payload, transcript_payload)
            intake_state = "Usable Transcript (Analyzed)" if has_usable else "No Usable Transcript (Awaiting Audio/Text)"

            occurred_at = payload.get("started_at") or payload.get("starts_at") or ""
            rep_or_organizer = payload.get("rep_name") or payload.get("rep_email") or payload.get("organizer_email") or "Unassigned"
            title_or_direction = payload.get("title") or payload.get("direction") or "Call"

            # Check if record already exists
            existing = conn.execute("""
                SELECT revision, has_usable_text, intake_state FROM source_records 
                WHERE source_type = ? AND source_id = ?
            """, (source_type, source_id)).fetchone()

            if not existing:
                # Fresh insert
                conn.execute("""
                    INSERT INTO source_records (
                        source_type, source_id, record_ref, revision, batch_id,
                        occurred_at, rep_or_organizer, title_or_direction,
                        has_usable_text, usable_text_length, raw_text,
                        source_payload, transcript_payload, intake_state,
                        analysis_freshness, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Fresh', ?, ?)
                """, (
                    source_type, source_id, record_ref, revision, batch_id,
                    occurred_at, rep_or_organizer, title_or_direction,
                    1 if has_usable else 0, text_len, raw_text,
                    json.dumps(payload), json.dumps(transcript_payload) if transcript_payload else None,
                    intake_state, now, now
                ))

                # Analyze & route
                record_dict = {
                    "source_type": source_type,
                    "source_id": source_id,
                    "record_ref": record_ref,
                    "raw_text": raw_text,
                    "has_usable_text": has_usable,
                    "payload": payload,
                    "transcript_payload": transcript_payload,
                    "rep_or_organizer": rep_or_organizer,
                    "title_or_direction": title_or_direction,
                    "occurred_at": occurred_at
                }
                analysis = analyze_source_record(record_dict)
                save_source_analysis(record_dict, analysis, version=1, conn=conn)

                routing = evaluate_source_routing(record_dict, analysis)
                save_source_routing(record_dict, routing, conn=conn)

                applied_count += 1

            else:
                stored_rev = existing["revision"]
                if revision > stored_rev:
                    # Higher revision! Replace payload and transcript_payload completely
                    conn.execute("""
                        UPDATE source_records SET
                            revision = ?, batch_id = ?, occurred_at = ?,
                            rep_or_organizer = ?, title_or_direction = ?,
                            has_usable_text = ?, usable_text_length = ?, raw_text = ?,
                            source_payload = ?, transcript_payload = ?,
                            intake_state = ?, analysis_freshness = 'Updated (Awaiting Review)',
                            updated_at = ?
                        WHERE source_type = ? AND source_id = ?
                    """, (
                        revision, batch_id, occurred_at, rep_or_organizer, title_or_direction,
                        1 if has_usable else 0, text_len, raw_text,
                        json.dumps(payload), json.dumps(transcript_payload) if transcript_payload else None,
                        intake_state, now, source_type, source_id
                    ))

                    # Re-analyze and update routing while strictly preserving any manual override!
                    record_dict = {
                        "source_type": source_type,
                        "source_id": source_id,
                        "record_ref": record_ref,
                        "raw_text": raw_text,
                        "has_usable_text": has_usable,
                        "payload": payload,
                        "transcript_payload": transcript_payload,
                        "rep_or_organizer": rep_or_organizer,
                        "title_or_direction": title_or_direction,
                        "occurred_at": occurred_at
                    }
                    analysis = analyze_source_record(record_dict)
                    save_source_analysis(record_dict, analysis, version=stored_rev + 1, conn=conn)

                    routing = evaluate_source_routing(record_dict, analysis)
                    # Preserve manual override
                    existing_route = conn.execute("""
                        SELECT is_manual_override, assigned_route, override_reason, override_by, override_at
                        FROM routing_decisions WHERE source_type = ? AND source_id = ?
                    """, (source_type, source_id)).fetchone()

                    if existing_route and existing_route["is_manual_override"] == 1:
                        # Keep assigned_route as the manual override!
                        routing["assigned_route"] = existing_route["assigned_route"]
                        routing["is_manual_override"] = 1
                        routing["override_reason"] = existing_route["override_reason"]
                        routing["override_by"] = existing_route["override_by"]
                        routing["override_at"] = existing_route["override_at"]
                        routing["status"] = "Manually Overridden"

                    save_source_routing(record_dict, routing, conn=conn)
                    applied_count += 1
                else:
                    # Same or older revision: ignore!
                    ignored_count += 1

        # Calculate final counts
        total_unique = conn.execute("SELECT COUNT(*) as c FROM source_records").fetchone()["c"]
        usable_texts = conn.execute("SELECT COUNT(*) as c FROM source_records WHERE has_usable_text = 1").fetchone()["c"]

        # Record import batch
        conn.execute("""
            INSERT INTO import_batches (
                batch_id, revision, filename, total_incoming,
                applied_records, ignored_records, usable_text_count,
                status, imported_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?)
        """, (
            batch_id, revision, filename, len(records),
            applied_count, ignored_count, usable_texts, now
        ))

    record_audit("import", batch_id, "batch_processed", {
        "revision": revision,
        "applied": applied_count,
        "ignored": ignored_count,
        "total_unique": total_unique,
        "usable_texts": usable_texts
    })

    return {
        "status": "success",
        "batch_id": batch_id,
        "revision": revision,
        "applied_records": applied_count,
        "ignored_records": ignored_count,
        "total_unique_records": total_unique,
        "usable_text_count": usable_texts
    }
