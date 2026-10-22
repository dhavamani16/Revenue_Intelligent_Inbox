import sqlite3
import json
from contextlib import contextmanager
from datetime import datetime
from typing import Generator
from app.config import DB_PATH

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = dict_factory
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA busy_timeout = 30000;")
    return conn

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS source_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_type TEXT NOT NULL,
            source_id TEXT NOT NULL,
            record_ref TEXT,
            revision INTEGER NOT NULL DEFAULT 1,
            batch_id TEXT NOT NULL,
            occurred_at TEXT,
            rep_or_organizer TEXT,
            title_or_direction TEXT,
            has_usable_text INTEGER DEFAULT 0,
            usable_text_length INTEGER DEFAULT 0,
            raw_text TEXT,
            source_payload TEXT NOT NULL,
            transcript_payload TEXT,
            intake_state TEXT NOT NULL,
            analysis_freshness TEXT DEFAULT 'Fresh',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(source_type, source_id)
        );

        CREATE TABLE IF NOT EXISTS routing_decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_type TEXT NOT NULL,
            source_id TEXT NOT NULL,
            record_ref TEXT,
            assigned_route TEXT NOT NULL,
            suggested_route TEXT NOT NULL,
            target_owner TEXT NOT NULL,
            target_team TEXT NOT NULL,
            rules_matched TEXT,
            evidence_citation TEXT,
            confidence REAL DEFAULT 0.85,
            is_manual_override INTEGER DEFAULT 0,
            override_reason TEXT,
            override_by TEXT,
            override_at TEXT,
            status TEXT DEFAULT 'Pending Review',
            requires_manual_review INTEGER DEFAULT 0,
            conflict_reason TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(source_type, source_id)
        );

        CREATE TABLE IF NOT EXISTS conversation_analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_type TEXT NOT NULL,
            source_id TEXT NOT NULL,
            record_ref TEXT,
            version INTEGER DEFAULT 1,
            summary TEXT,
            customer_needs TEXT,
            pain_points TEXT,
            buying_intent TEXT,
            sentiment TEXT,
            sentiment_score REAL,
            positive_signals TEXT,
            negative_signals TEXT,
            objections TEXT,
            competitor_mentions TEXT,
            bant_budget TEXT,
            bant_authority TEXT,
            bant_need TEXT,
            bant_timeline TEXT,
            next_steps TEXT,
            follow_up_date TEXT,
            priority TEXT,
            deal_risk TEXT,
            deal_risk_score INTEGER,
            risk_factors TEXT,
            recommended_action TEXT,
            evidence_citations TEXT,
            analysis_provider TEXT,
            confidence_score REAL,
            is_stale INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS manual_corrections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_type TEXT NOT NULL,
            source_id TEXT NOT NULL,
            record_ref TEXT,
            field_name TEXT NOT NULL,
            previous_value TEXT,
            new_value TEXT NOT NULL,
            reason TEXT,
            user TEXT DEFAULT 'Sales Manager',
            batch_id TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS audit_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT,
            user TEXT DEFAULT 'Sales Manager',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS import_batches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id TEXT NOT NULL,
            revision INTEGER NOT NULL,
            filename TEXT NOT NULL,
            total_incoming INTEGER DEFAULT 0,
            applied_records INTEGER DEFAULT 0,
            ignored_records INTEGER DEFAULT 0,
            usable_text_count INTEGER DEFAULT 0,
            status TEXT NOT NULL,
            imported_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS rejected_decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            decision_considered TEXT NOT NULL,
            initial_rationale TEXT NOT NULL,
            evidence_reviewed TEXT NOT NULL,
            rejection_reason TEXT NOT NULL,
            potential_drawbacks TEXT NOT NULL,
            alternative_selected TEXT NOT NULL,
            author TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS routing_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rule_name TEXT UNIQUE NOT NULL,
            condition_keywords TEXT NOT NULL,
            target_route TEXT NOT NULL,
            target_team TEXT NOT NULL,
            target_owner TEXT NOT NULL,
            priority INTEGER DEFAULT 1,
            is_active INTEGER DEFAULT 1,
            description TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_records_identity ON source_records(source_type, source_id);
        CREATE INDEX IF NOT EXISTS idx_records_ref ON source_records(record_ref);
        CREATE INDEX IF NOT EXISTS idx_records_usable ON source_records(has_usable_text);
        CREATE INDEX IF NOT EXISTS idx_routing_identity ON routing_decisions(source_type, source_id);
        CREATE INDEX IF NOT EXISTS idx_analysis_identity ON conversation_analyses(source_type, source_id);
        CREATE INDEX IF NOT EXISTS idx_corrections_identity ON manual_corrections(source_type, source_id);
        """)

        # Seed default SpendNest routing rules if empty
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM routing_rules")
        if cursor.fetchone()["count"] == 0:
            rules = [
                ("Customer Retention & Escalation Rule", "save changes,not appearing,issue,bug,error,failed,screen,unhappy,dissatisfied,complaint", "Customer Retention Escalation", "Customer Success", "Elena Rostova", 1, 1, "Routes onboarding bugs, UI sync issues and retention risks to Senior CS"),
                ("Strategic Commercial Partnership Rule", "partner,commission,advisory,remote bank,incorporation,referral,rev share", "Strategic Channel Partnership", "Partnerships", "Sarah Jenkins", 2, 1, "Routes corporate incorporation and banking advisory partners to Strategic Partnerships"),
                ("Corporate Cards & Prepaid Controls Rule", "cards,prepaid,wallet,limits,expense,reimbursement,shared wallet", "Mid-Market Card Expansion", "Mid-Market AE", "Alex Rivera", 3, 1, "Routes domestic corporate cards, spending limits and expense management queries to AE"),
                ("Compliant E-Invoicing & Tech Integration Rule", "einvoicing,electronic invoicing,api,webhook,ledgerbridge,peppol,mandate", "Technical Invoicing Solutions", "Solutions Engineering", "David Chen", 4, 1, "Routes multi-country electronic invoicing and API integrations to Solutions Engineering"),
                ("Receivables & Collection Automation Rule", "receivables,collections,overdue,reconciliation,cash application,disputed", "Receivables Automation Specialist", "Enterprise AE", "Rachel Adams", 5, 1, "Routes accounts receivable and automatic collections to Enterprise AE"),
                ("Inbound / Cold Lead Qualification Rule", "cold call,introductory,forty seconds,presentation,networking", "Lead Qualification Queue", "SDR", "Marcus Vance", 6, 1, "Routes outbound cold inquiries and preliminary introductions to SDR team")
            ]
            cursor.executemany("""
                INSERT INTO routing_rules (rule_name, condition_keywords, target_route, target_team, target_owner, priority, is_active, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, rules)
        # Seed initial rejected decision if empty
        cursor.execute("SELECT COUNT(*) as count FROM rejected_decisions")
        if cursor.fetchone()["count"] == 0:
            cursor.execute("""
                INSERT INTO rejected_decisions (
                    id, decision_considered, initial_rationale, evidence_reviewed,
                    rejection_reason, potential_drawbacks, alternative_selected,
                    author, created_at
                ) VALUES (
                    1,
                    'Automatically Reassign All Pricing-Disputed Conversations to Senior Enterprise AEs without Rep Review',
                    'Accelerate commercial negotiation velocity by automatically bypassing initial SDR/AE and assigning high-tier executive closers.',
                    'Reviewed 14 conversation transcripts where customers raised pricing resistance or budget concerns (e.g. M03 Asterloom Systems Turn 23-24 on INR 39,000 vs INR 26,000 quote; C03 API pricing). In M03, the pricing confusion arose from bundling the INR 13,000 one-time setup fee with the annual subscription, not core customer unwillingness to pay.',
                    'Automated reassignment severed the relationship with the existing account owner who had deep organizational context, alienating customers and producing disjointed handoffs.',
                    'Rep confusion, CRM ownership churn, lack of accountability, and premature discounting before addressing root-cause onboarding questions.',
                    'Implemented the Intelligent Routing Flagging Queue: maintain original account owner while automatically attaching a co-pilot recommendation for Solutions Engineering or Customer Success with manager approval required.',
                    'Sales Operations Lead',
                    ?
                )
            """, (datetime.utcnow().isoformat(),))

def record_audit(entity_type: str, entity_id: str, action: str, details: dict, user: str = "Sales Manager", conn=None):
    sql = """
        INSERT INTO audit_history (entity_type, entity_id, action, details, user, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """
    params = (entity_type, str(entity_id), action, json.dumps(details), user, datetime.utcnow().isoformat())
    if conn is not None:
        conn.execute(sql, params)
    else:
        with get_db() as c:
            c.execute(sql, params)
