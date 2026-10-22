import pytest
import json
from pathlib import Path
from app.database import get_db, init_db
from app.services.ingestion_service import process_envelope
from app.services.export_service import generate_export_package
from app.services.findings_engine import compute_evidence_findings, get_rejected_decisions
from app.routers.conversations import update_conversation_record, RecordUpdatePayload

SAMPLE_DIR = Path(__file__).resolve().parent.parent / "data" / "sample"

@pytest.fixture(autouse=True)
def clean_db():
    init_db()
    with get_db() as conn:
        conn.execute("DELETE FROM conversation_analyses")
        conn.execute("DELETE FROM routing_decisions")
        conn.execute("DELETE FROM manual_corrections")
        conn.execute("DELETE FROM import_batches")
        conn.execute("DELETE FROM source_records")
        conn.execute("DELETE FROM audit_history")
    yield

def test_initial_import():
    """Verify initial batch imports exactly 44 records with 17 usable texts"""
    with open(SAMPLE_DIR / "01_initial.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    res = process_envelope(data, "01_initial.json")
    
    assert res["applied_records"] == 44
    assert res["total_unique_records"] == 44
    assert res["usable_text_count"] == 17

    with get_db() as conn:
        calls = conn.execute("SELECT COUNT(*) as c FROM source_records WHERE source_type = 'call'").fetchone()["c"]
        meetings = conn.execute("SELECT COUNT(*) as c FROM source_records WHERE source_type = 'meeting'").fetchone()["c"]
        m07 = conn.execute("SELECT * FROM source_records WHERE record_ref = 'M07'").fetchone()

    assert calls == 30
    assert meetings == 14
    assert m07["has_usable_text"] == 0
    assert m07["revision"] == 1

def test_repeated_import_idempotence():
    """Verify importing same batch twice is completely idempotent with 0 duplicates created"""
    with open(SAMPLE_DIR / "01_initial.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    res1 = process_envelope(data, "01_initial.json")
    assert res1["total_unique_records"] == 44

    # Repeat
    res2 = process_envelope(data, "01_initial.json")
    assert res2["applied_records"] == 0
    assert res2["ignored_records"] == 44
    assert res2["total_unique_records"] == 44
    assert res2["usable_text_count"] == 17

def test_order_independence():
    """Verify record order in envelope does not affect final identity or counts"""
    with open(SAMPLE_DIR / "01_initial.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Reverse records order
    reversed_data = dict(data)
    reversed_data["records"] = list(reversed(data["records"]))
    
    res = process_envelope(reversed_data, "01_initial_reversed.json")
    assert res["total_unique_records"] == 44
    assert res["usable_text_count"] == 17

def test_full_replay_sequence_and_m07_survival():
    """
    Execute full required replay test:
    1. Import 01_initial.json (44 records, 17 usable texts)
    2. Repeat 01_initial.json (stays 44 records, 17 usable texts)
    3. Manually change M07's route to 'Customer Retention Escalation'
    4. Import 02_update.json (stays 44 records, usable texts becomes 18, M07 has 27 turns)
    5. Reimport 01_initial.json (older revision ignored, stays 44 records, usable texts 18)
    6. Verify M07 manual route survives throughout!
    """
    # 1. Initial import
    with open(SAMPLE_DIR / "01_initial.json", "r", encoding="utf-8") as f:
        data1 = json.load(f)
    res1 = process_envelope(data1, "01_initial.json")
    assert res1["total_unique_records"] == 44
    assert res1["usable_text_count"] == 17

    # 2. Repeat import
    res2 = process_envelope(data1, "01_initial.json")
    assert res2["total_unique_records"] == 44
    assert res2["usable_text_count"] == 17

    # 3. Manually override M07's route
    with get_db() as conn:
        m07 = conn.execute("SELECT source_type, source_id FROM source_records WHERE record_ref = 'M07'").fetchone()
    
    payload = RecordUpdatePayload(
        assigned_route="Customer Retention Escalation",
        reason="Manager override: critical UI save bug during onboarding",
        user="Sales Manager"
    )
    update_conversation_record(m07["source_type"], m07["source_id"], payload)

    with get_db() as conn:
        m07_route = conn.execute("SELECT assigned_route, is_manual_override FROM routing_decisions WHERE record_ref = 'M07'").fetchone()
    assert m07_route["assigned_route"] == "Customer Retention Escalation"
    assert m07_route["is_manual_override"] == 1

    # 4. Import 02_update.json
    with open(SAMPLE_DIR / "02_update.json", "r", encoding="utf-8") as f:
        data2 = json.load(f)
    res3 = process_envelope(data2, "02_update.json")
    assert res3["total_unique_records"] == 44
    assert res3["usable_text_count"] == 18

    with get_db() as conn:
        m07_after = conn.execute("""
            SELECT r.revision, r.has_usable_text, rt.assigned_route, rt.is_manual_override, r.transcript_payload
            FROM source_records r
            JOIN routing_decisions rt ON r.source_type = rt.source_type AND r.source_id = rt.source_id
            WHERE r.record_ref = 'M07'
        """).fetchone()

    assert m07_after["revision"] == 2
    assert m07_after["has_usable_text"] == 1
    assert m07_after["assigned_route"] == "Customer Retention Escalation"
    assert m07_after["is_manual_override"] == 1
    tp = json.loads(m07_after["transcript_payload"])
    assert len(tp["turns"]) == 27

    # 5. Re-import 01_initial.json again (revision 1)
    res4 = process_envelope(data1, "01_initial.json")
    assert res4["total_unique_records"] == 44
    assert res4["usable_text_count"] == 18

    with get_db() as conn:
        m07_final = conn.execute("""
            SELECT r.revision, r.has_usable_text, rt.assigned_route, rt.is_manual_override
            FROM source_records r
            JOIN routing_decisions rt ON r.source_type = rt.source_type AND r.source_id = rt.source_id
            WHERE r.record_ref = 'M07'
        """).fetchone()

    assert m07_final["revision"] == 2
    assert m07_final["has_usable_text"] == 1
    assert m07_final["assigned_route"] == "Customer Retention Escalation"
    assert m07_final["is_manual_override"] == 1

def test_evidence_citations():
    """Verify evidence citations reference valid turn numbers and exact quotes"""
    with open(SAMPLE_DIR / "01_initial.json", "r", encoding="utf-8") as f:
        process_envelope(json.load(f), "01_initial.json")
    with open(SAMPLE_DIR / "02_update.json", "r", encoding="utf-8") as f:
        process_envelope(json.load(f), "02_update.json")

    with get_db() as conn:
        m07_analysis = conn.execute("SELECT evidence_citations FROM conversation_analyses WHERE record_ref = 'M07' ORDER BY version DESC LIMIT 1").fetchone()
        m01_analysis = conn.execute("SELECT evidence_citations FROM conversation_analyses WHERE record_ref = 'M01' ORDER BY version DESC LIMIT 1").fetchone()

    m07_c = json.loads(m07_analysis["evidence_citations"])
    assert len(m07_c) > 0
    assert any(c.get("turn_number") is not None for c in m07_c)
    assert any("save" in c.get("quote", "").lower() or "description" in c.get("quote", "").lower() for c in m07_c)

    m01_c = json.loads(m01_analysis["evidence_citations"])
    assert len(m01_c) > 0
    assert any("commission" in c.get("quote", "").lower() or "usd 260" in c.get("quote", "").lower() for c in m01_c)

def test_export_package_and_manifest():
    """Verify export package generates downloadable ZIP and manifest.json matching record counts"""
    with open(SAMPLE_DIR / "01_initial.json", "r", encoding="utf-8") as f:
        process_envelope(json.load(f), "01_initial.json")
    with open(SAMPLE_DIR / "02_update.json", "r", encoding="utf-8") as f:
        process_envelope(json.load(f), "02_update.json")

    export_res = generate_export_package()
    assert export_res["record_count"] == 44
    assert Path(export_res["download_url"]).name != ""

    manifest = export_res["manifest"]
    assert manifest["record_counts"]["total_unique_records"] == 44
    assert manifest["record_counts"]["usable_supplied_texts"] == 18
    assert len(manifest["records"]) == 44
    assert len(manifest["files"]) == 11

def test_findings_and_rejected_decision():
    """Verify three evidence-backed findings and rejected decision are computed from records"""
    with open(SAMPLE_DIR / "01_initial.json", "r", encoding="utf-8") as f:
        process_envelope(json.load(f), "01_initial.json")
    with open(SAMPLE_DIR / "02_update.json", "r", encoding="utf-8") as f:
        process_envelope(json.load(f), "02_update.json")

    findings = compute_evidence_findings()
    assert len(findings) == 3
    assert any("Prepaid" in f["title"] or "Credit" in f["title"] for f in findings)
    assert any("Defect" in f["title"] or "Save" in f["title"] for f in findings)
    assert any("Partnership" in f["title"] for f in findings)

    decisions = get_rejected_decisions()
    assert len(decisions) >= 1
    assert "Reassign" in decisions[0]["decision_considered"]
