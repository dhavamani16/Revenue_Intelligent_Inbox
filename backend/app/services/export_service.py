import os
import csv
import json
import zipfile
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from app.config import EXPORTS_DIR, APP_VERSION
from app.database import get_db

def generate_export_package(filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    filters = filters or {}
    export_id = f"EXP-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    timestamp = datetime.utcnow().isoformat()
    export_folder = EXPORTS_DIR / export_id
    export_folder.mkdir(exist_ok=True, parents=True)

    with get_db() as conn:
        records = conn.execute("""
            SELECT r.*, 
                   a.summary, a.customer_needs, a.pain_points, a.buying_intent,
                   a.sentiment, a.sentiment_score, a.positive_signals, a.negative_signals,
                   a.objections, a.competitor_mentions, a.bant_budget, a.bant_authority,
                   a.bant_need, a.bant_timeline, a.next_steps, a.follow_up_date,
                   a.priority, a.deal_risk, a.deal_risk_score, a.risk_factors,
                   a.recommended_action, a.evidence_citations, a.analysis_provider, a.confidence_score,
                   rt.assigned_route, rt.suggested_route, rt.target_owner, rt.target_team,
                   rt.rules_matched, rt.evidence_citation, rt.is_manual_override,
                   rt.override_reason, rt.status as routing_status, rt.requires_manual_review
            FROM source_records r
            LEFT JOIN (
                SELECT * FROM conversation_analyses WHERE id IN (
                    SELECT MAX(id) FROM conversation_analyses GROUP BY source_type, source_id
                )
            ) a ON r.source_type = a.source_type AND r.source_id = a.source_id
            LEFT JOIN routing_decisions rt ON r.source_type = rt.source_type AND r.source_id = rt.source_id
            ORDER BY r.record_ref ASC
        """).fetchall()

        manual_corrections = conn.execute("SELECT * FROM manual_corrections ORDER BY created_at DESC").fetchall()
        audit_history = conn.execute("SELECT * FROM audit_history ORDER BY created_at DESC").fetchall()
        import_batches = conn.execute("SELECT * FROM import_batches ORDER BY imported_at DESC").fetchall()

    # 1. conversations.csv
    conv_csv_path = export_folder / "conversations.csv"
    conv_fields = ["source_type", "source_id", "record_ref", "revision", "batch_id", "occurred_at", "rep_or_organizer", "title_or_direction", "has_usable_text", "usable_text_length", "intake_state", "analysis_freshness"]
    with open(conv_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=conv_fields, extrasaction="ignore")
        writer.writeheader()
        for r in records:
            writer.writerow(r)

    # 2. conversations.json
    conv_json_path = export_folder / "conversations.json"
    with open(conv_json_path, "w", encoding="utf-8") as f:
        json.dump([dict(r) for r in records], f, indent=2, default=str)

    # 3. conversation_analysis.csv
    analysis_csv_path = export_folder / "conversation_analysis.csv"
    analysis_fields = ["source_type", "source_id", "record_ref", "summary", "buying_intent", "sentiment", "sentiment_score", "priority", "deal_risk", "deal_risk_score", "analysis_provider", "confidence_score"]
    with open(analysis_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=analysis_fields, extrasaction="ignore")
        writer.writeheader()
        for r in records:
            writer.writerow(r)

    # 4. routing_decisions.csv
    routing_csv_path = export_folder / "routing_decisions.csv"
    routing_fields = ["source_type", "source_id", "record_ref", "assigned_route", "suggested_route", "target_owner", "target_team", "is_manual_override", "override_reason", "routing_status", "requires_manual_review"]
    with open(routing_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=routing_fields, extrasaction="ignore")
        writer.writeheader()
        for r in records:
            writer.writerow(r)

    # 5. deals_at_risk.csv
    risk_csv_path = export_folder / "deals_at_risk.csv"
    risk_fields = ["source_type", "source_id", "record_ref", "rep_or_organizer", "title_or_direction", "deal_risk", "deal_risk_score", "risk_factors", "recommended_action"]
    risk_rows = [r for r in records if r.get("deal_risk") in ["Critical", "High", "Medium"]]
    with open(risk_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=risk_fields, extrasaction="ignore")
        writer.writeheader()
        for r in risk_rows:
            writer.writerow(r)

    # 6. data_quality_report.csv
    dq_csv_path = export_folder / "data_quality_report.csv"
    usable_count = len([r for r in records if r.get("has_usable_text") == 1])
    calls_count = len([r for r in records if r.get("source_type") == "call"])
    meetings_count = len([r for r in records if r.get("source_type") == "meeting"])
    with open(dq_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Metric", "Count", "Description"])
        writer.writerow(["Total Unique Source Records", len(records), "Identified strictly by (source_type, source_id)"])
        writer.writerow(["Calls Count", calls_count, "Source call records"])
        writer.writerow(["Meetings Count", meetings_count, "Source meeting records"])
        writer.writerow(["Usable Supplied Texts", usable_count, "Records with non-blank call text or >=1 meeting turn"])
        writer.writerow(["Usable Text Coverage", f"{(usable_count/len(records)*100):.1f}%" if records else "0%", "Coverage across selected records"])
        writer.writerow(["Manual Route Overrides", len([r for r in records if r.get("is_manual_override") == 1]), "Preserved manager route overrides"])
        writer.writerow(["Manual Corrections Logged", len(manual_corrections), "Audit trail entries for field corrections"])

    # 7. manual_corrections.csv
    mc_csv_path = export_folder / "manual_corrections.csv"
    mc_fields = ["id", "source_type", "source_id", "record_ref", "field_name", "previous_value", "new_value", "reason", "user", "created_at"]
    with open(mc_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=mc_fields, extrasaction="ignore")
        writer.writeheader()
        for r in manual_corrections:
            writer.writerow(r)

    # 8. audit_history.csv
    audit_csv_path = export_folder / "audit_history.csv"
    audit_fields = ["id", "entity_type", "entity_id", "action", "details", "user", "created_at"]
    with open(audit_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=audit_fields, extrasaction="ignore")
        writer.writeheader()
        for r in audit_history:
            writer.writerow(r)

    # 9. import_batches.csv
    batch_csv_path = export_folder / "import_batches.csv"
    batch_fields = ["id", "batch_id", "revision", "filename", "total_incoming", "applied_records", "ignored_records", "usable_text_count", "status", "imported_at"]
    with open(batch_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=batch_fields, extrasaction="ignore")
        writer.writeheader()
        for r in import_batches:
            writer.writerow(r)

    # 10. manifest.json (strictly compliant with DATA_CONTRACT.md)
    manifest_records = []
    for r in records:
        manifest_records.append({
            "source_type": r["source_type"],
            "source_id": r["source_id"],
            "record_ref": r.get("record_ref"),
            "applied_source_revision": r["revision"],
            "assigned_route": r.get("assigned_route"),
            "suggested_route": r.get("suggested_route"),
            "output_paths": [
                f"conversations.json#{r['source_id']}",
                "conversation_analysis.csv"
            ],
            "processing_state": r.get("intake_state"),
            "manual_override_flag": bool(r.get("is_manual_override") == 1),
            "analysis_freshness": r.get("analysis_freshness", "Fresh")
        })

    manifest = {
        "export_id": export_id,
        "export_creation_timestamp": timestamp,
        "application_version": APP_VERSION,
        "assessment_date": "2026-08-21 (Asia/Kolkata)",
        "dataset_name": "SpendNest Revenue Intelligence Extraction",
        "record_counts": {
            "total_unique_records": len(records),
            "usable_supplied_texts": usable_count,
            "calls": calls_count,
            "meetings": meetings_count,
            "manual_corrections": len(manual_corrections),
            "import_batches": len(import_batches)
        },
        "files": [
            {"filename": "conversations.csv", "format": "CSV", "record_count": len(records), "description": "Normalized source records with intake states"},
            {"filename": "conversations.json", "format": "JSON", "record_count": len(records), "description": "Complete source record payloads and turns"},
            {"filename": "conversation_analysis.csv", "format": "CSV", "record_count": len(records), "description": "AI and deterministic analytical summaries"},
            {"filename": "routing_decisions.csv", "format": "CSV", "record_count": len(records), "description": "Active routes, suggested routes, and override flags"},
            {"filename": "deals_at_risk.csv", "format": "CSV", "record_count": len(risk_rows), "description": "Prioritized risk records with explainable factors"},
            {"filename": "data_quality_report.csv", "format": "CSV", "record_count": 7, "description": "Coverage ratios and identity integrity summary"},
            {"filename": "manual_corrections.csv", "format": "CSV", "record_count": len(manual_corrections), "description": "Manager manual corrections audit log"},
            {"filename": "audit_history.csv", "format": "CSV", "record_count": len(audit_history), "description": "System event trace"},
            {"filename": "import_batches.csv", "format": "CSV", "record_count": len(import_batches), "description": "Delivery batch history and revision tracking"},
            {"filename": "manifest.json", "format": "JSON", "record_count": len(manifest_records), "description": "Machine-readable contract manifest"},
            {"filename": "README.md", "format": "Markdown", "record_count": 1, "description": "Package documentation and replay instructions"}
        ],
        "records": manifest_records,
        "export_generation_status": "COMPLETED_SUCCESSFULLY"
    }

    manifest_path = export_folder / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    # 11. README.md
    readme_path = export_folder / "README.md"
    readme_content = f"""# Revenue Intelligence Inbox — Export Archive
**Export ID:** {export_id}  
**Created:** {timestamp}  
**Version:** {APP_VERSION}  

## Package Contents
This downloadable package contains the complete operational data exported from the Revenue Intelligence Inbox SQLite database for SpendNest:

1. `conversations.csv` & `conversations.json`: 44 unique source records identified by `(source_type, source_id)`.
2. `conversation_analysis.csv`: Deterministic and AI analytical extractions with evidence citations.
3. `routing_decisions.csv`: Route classifications, manual overrides, and target owners.
4. `deals_at_risk.csv`: Account risk scores and severity factors.
5. `data_quality_report.csv`: Data coverage statistics ({usable_count} usable texts out of {len(records)} records).
6. `manual_corrections.csv`: Persistent record of manager modifications.
7. `audit_history.csv`: Operational audit trail.
8. `import_batches.csv`: Ingested envelope deliveries with revision ordering.
9. `manifest.json`: Machine-readable data contract manifest with relative output paths, review states, and freshness.
"""
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(readme_content)

    # Create ZIP
    zip_filename = f"{export_id}.zip"
    zip_path = EXPORTS_DIR / zip_filename
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for file in export_folder.iterdir():
            zipf.write(file, arcname=file.name)

    file_size = os.path.getsize(zip_path)

    return {
        "export_id": export_id,
        "filename": zip_filename,
        "record_count": len(records),
        "file_size_bytes": file_size,
        "manifest": manifest,
        "download_url": f"/api/exports/{export_id}/download"
    }
