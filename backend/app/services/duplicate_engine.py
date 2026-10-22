import hashlib
import json
import re
from typing import Dict, Any, List, Optional, Tuple
from app.database import get_db

def generate_fingerprint(customer_name: str, occurred_at: str, transcript: str) -> str:
    clean_cust = re.sub(r"[^\w\s]", "", customer_name.lower().strip())
    # date part only
    date_part = occurred_at[:10] if occurred_at and len(occurred_at) >= 10 else ""
    # normalize first 120 chars of transcript
    norm_text = re.sub(r"\s+", " ", transcript.lower().strip())[:120]
    payload = f"{clean_cust}|{date_part}|{norm_text}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def classify_record(incoming: Dict[str, Any], conn) -> Tuple[str, Optional[Dict[str, Any]], Dict[str, Any], List[str]]:
    """
    Returns:
        status: 'New' | 'Exact Duplicate' | 'Updated' | 'Potential Duplicate' | 'Conflict' | 'Invalid'
        matched_existing_record: Dict or None
        field_differences: Dict of {field: {"old": ..., "new": ...}}
        missing_fields: List[str]
    """
    missing_fields = []
    # Check mandatory fields
    if not incoming.get("customer_name"):
        missing_fields.append("customer_name")
    if not incoming.get("company"):
        missing_fields.append("company")
    if not incoming.get("occurred_at"):
        missing_fields.append("occurred_at")
    transcript = incoming.get("raw_transcript") or incoming.get("transcript") or ""
    if not transcript.strip():
        missing_fields.append("raw_transcript")

    if missing_fields:
        return "Invalid", None, {}, missing_fields

    external_id = incoming.get("external_id")
    source_record_id = incoming.get("source_record_id")
    source_system = incoming.get("source_system", "CRM")
    customer_name = incoming.get("customer_name", "").strip()
    company = incoming.get("company", "").strip()
    occurred_at = incoming.get("occurred_at", "")
    fingerprint = generate_fingerprint(customer_name, occurred_at, transcript)

    # 1. Look up by external_id or source_record_id
    existing = None
    if external_id:
        existing = conn.execute(
            "SELECT * FROM conversations WHERE external_id = ? AND is_deleted = 0", (external_id,)
        ).fetchone()

    if not existing and source_record_id:
        existing = conn.execute(
            "SELECT * FROM conversations WHERE source_record_id = ? AND source_system = ? AND is_deleted = 0",
            (source_record_id, source_system)
        ).fetchone()

    # 2. Look up by fingerprint
    if not existing:
        existing = conn.execute(
            "SELECT * FROM conversations WHERE fingerprint = ? AND is_deleted = 0", (fingerprint,)
        ).fetchone()

    # If found an exact match on identifier or fingerprint
    if existing:
        # Check if this conversation has manual corrections
        corrections = conn.execute(
            "SELECT field_name, previous_value, new_value FROM manual_corrections WHERE conversation_id = ?",
            (existing["conversation_id"],)
        ).fetchall()
        
        diffs = {}
        fields_to_check = [
            ("customer_name", customer_name),
            ("company", company),
            ("raw_transcript", transcript),
            ("owner", incoming.get("owner", existing["owner"])),
            ("team", incoming.get("team", existing["team"])),
            ("deal_stage", incoming.get("deal_stage", existing["deal_stage"])),
            ("deal_value", incoming.get("deal_value", existing["deal_value"]))
        ]

        for field, inc_val in fields_to_check:
            exist_val = existing.get(field)
            if inc_val is not None and str(inc_val).strip() != str(exist_val or "").strip():
                diffs[field] = {"old": exist_val, "new": inc_val}

        # If existing record has manual corrections and incoming tries to overwrite a manually corrected field
        manually_corrected_fields = {c["field_name"] for c in corrections}
        overlapping_manual_fields = set(diffs.keys()).intersection(manually_corrected_fields)

        if overlapping_manual_fields:
            return "Conflict", existing, diffs, []

        if not diffs:
            return "Exact Duplicate", existing, {}, []
        else:
            return "Updated", existing, diffs, []

    # 3. Potential Duplicate check: same company & customer on same date, but different ID or transcript text
    date_part = occurred_at[:10] if occurred_at and len(occurred_at) >= 10 else ""
    if date_part:
        potential = conn.execute("""
            SELECT * FROM conversations 
            WHERE LOWER(company) = LOWER(?) 
              AND LOWER(customer_name) = LOWER(?)
              AND occurred_at LIKE ?
              AND is_deleted = 0
            LIMIT 1
        """, (company, customer_name, f"{date_part}%")).fetchone()

        if potential:
            diffs = {
                "transcript_length": {
                    "old": len(potential["raw_transcript"]),
                    "new": len(transcript)
                },
                "incoming_external_id": {
                    "old": potential.get("external_id"),
                    "new": external_id
                }
            }
            return "Potential Duplicate", potential, diffs, []

    return "New", None, {}, []
