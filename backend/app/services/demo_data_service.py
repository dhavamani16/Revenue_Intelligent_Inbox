import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.database import get_db, record_audit
from app.services.analysis_engine import analyze_conversation, save_analysis
from app.services.routing_engine import evaluate_routing, save_routing_decision
from app.services.duplicate_engine import generate_fingerprint

DEMO_CONVERSATIONS = [
    {
        "conversation_id": "CONV-2026-101",
        "external_id": "EXT-CRM-8801",
        "source_system": "Salesforce CRM",
        "source_record_id": "SF-REC-001",
        "customer_id": "CUST-901",
        "customer_name": "Linda Vance",
        "company": "Apex Global Logistics",
        "deal_id": "DEAL-501",
        "deal_name": "Apex Enterprise Conversation Intelligence Rollout",
        "deal_stage": "Negotiation",
        "deal_value": 145000.0,
        "conversation_type": "Meeting",
        "occurred_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
        "owner": "Sarah Jenkins",
        "team": "Enterprise AE",
        "raw_transcript": """Sarah Jenkins: Thanks for hopping on, Linda. We reviewed your procurement requirements.
Linda Vance: Thanks Sarah. Our VP of Sales and CRO love the product and agreed the pilot went great. The budget is approved for $145,000. However, procurement flagged that we need an annual prepayment discount of 8% or we might delay contract execution to next quarter.
Sarah Jenkins: We can definitely structure a multi-year term with that discount. What is the target timeline for signature?
Linda Vance: If you send the revised commercial quote by tomorrow, we are ready to sign before the end of this month."""
    },
    {
        "conversation_id": "CONV-2026-102",
        "external_id": "EXT-CRM-8802",
        "source_system": "HubSpot CRM",
        "source_record_id": "HB-REC-002",
        "customer_id": "CUST-902",
        "customer_name": "Derek Thorne",
        "company": "Nordic Health Systems",
        "deal_id": "DEAL-502",
        "deal_name": "Nordic Health HIPAA-Compliant Intelligence",
        "deal_stage": "Technical Evaluation",
        "deal_value": 220000.0,
        "conversation_type": "Call",
        "occurred_at": (datetime.utcnow() - timedelta(days=3)).isoformat(),
        "owner": "David Chen",
        "team": "Solutions Engineering",
        "raw_transcript": """David Chen: Hi Derek, following up on your engineering team's questions regarding our webhook throughput.
Derek Thorne: Hi David. Our CTO raised a serious compliance concern. We require strict HIPAA and SOC2 compliance validation, plus under 200ms latency for real-time streaming audio transcription. If there is latency or missing integration with our Epic EHR system, this is a blocker.
David Chen: Our HIPAA BAA is fully standardized and we provide dedicated single-tenant VPC endpoints.
Derek Thorne: Understood. Please send over the SOC2 Type II compliance pack and schedule an architecture deep dive with our lead engineer next Tuesday."""
    },
    {
        "conversation_id": "CONV-2026-103",
        "external_id": "EXT-CRM-8803",
        "source_system": "Salesforce CRM",
        "source_record_id": "SF-REC-003",
        "customer_id": "CUST-903",
        "customer_name": "Carolyn Hayes",
        "company": "CloudScale Telecom",
        "deal_id": "DEAL-503",
        "deal_name": "CloudScale Annual Subscription Renewal",
        "deal_stage": "Renewal",
        "deal_value": 180000.0,
        "conversation_type": "Meeting",
        "occurred_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
        "owner": "Elena Rostova",
        "team": "Customer Success",
        "raw_transcript": """Elena Rostova: Good morning Carolyn, checking in on your upcoming renewal cycle.
Carolyn Hayes: Elena, to be completely candid, our executive team is deeply dissatisfied. Our reps experienced frequent latency and recurring bugs during peak call hours. We are seriously evaluating canceling our subscription and switching to Gong because Gong is offering a 20% lower quote and better support response times.
Elena Rostova: I understand completely, Carolyn, and I deeply apologize. I will immediately escalate the latency issues to our VP of Engineering and coordinate a root-cause remediation meeting tomorrow.
Carolyn Hayes: If these stability problems aren't permanently fixed, we will terminate the contract upon expiration."""
    },
    {
        "conversation_id": "CONV-2026-104",
        "external_id": "EXT-CRM-8804",
        "source_system": "Outreach",
        "source_record_id": "OR-REC-004",
        "customer_id": "CUST-904",
        "customer_name": "Jason Miller",
        "company": "Vanguard FinTech",
        "deal_id": "DEAL-504",
        "deal_name": "Inbound FinTech Discovery",
        "deal_stage": "Discovery",
        "deal_value": 75000.0,
        "conversation_type": "Call",
        "occurred_at": (datetime.utcnow() - timedelta(days=4)).isoformat(),
        "owner": "Marcus Vance",
        "team": "SDR",
        "raw_transcript": """Marcus Vance: Hi Jason, thanks for requesting an exploratory demo on our website.
Jason Miller: Hi Marcus. We have 45 SDRs and Account Executives who waste hours on manual CRM note-taking. We are currently evaluating whether automated conversation intelligence can reduce rep onboarding ramp time.
Marcus Vance: That is exactly what our platform specializes in. What does your evaluation timeline look like?
Jason Miller: We want to run a pilot next month. Our budget is around $75,000 for the first phase."""
    },
    {
        "conversation_id": "CONV-2026-105",
        "external_id": "EXT-CRM-8805",
        "source_system": "Salesforce CRM",
        "source_record_id": "SF-REC-005",
        "customer_id": "CUST-905",
        "customer_name": "Melissa Torres",
        "company": "Zephyr Cloud Dynamics",
        "deal_id": "DEAL-505",
        "deal_name": "Zephyr Mid-Market Expansion",
        "deal_stage": "Proposal",
        "deal_value": 92000.0,
        "conversation_type": "Meeting",
        "occurred_at": (datetime.utcnow() - timedelta(days=5)).isoformat(),
        "owner": "Alex Rivera",
        "team": "Mid-Market AE",
        "raw_transcript": """Alex Rivera: Hi Melissa, great connecting again. How did the team find the proposal?
Melissa Torres: Hi Alex. The team loves the product and automated summary features. However, Chorus and Clari both reached out with competitive offers. Clari's quote is slightly cheaper, but your UI is much cleaner. Can you match their price or provide additional seat licenses?
Alex Rivera: I can certainly look into bundling 5 additional coaching licenses if we finalize before the end of the quarter.
Melissa Torres: Perfect, if you can send that updated proposal, I will submit it to our VP for final approval."""
    },
    # Difficult routing decision 1: CRM owner is Marcus Vance (SDR) but call was led by David Chen on deep technical integration & security
    {
        "conversation_id": "CONV-2026-106",
        "external_id": "EXT-CRM-8806",
        "source_system": "Salesforce CRM",
        "source_record_id": "SF-REC-006",
        "customer_id": "CUST-906",
        "customer_name": "Gregory Ross",
        "company": "Starlight Cyber Security",
        "deal_id": "DEAL-506",
        "deal_name": "Starlight SIEM Integration & SDK Evaluation",
        "deal_stage": "Technical Evaluation",
        "deal_value": 310000.0,
        "conversation_type": "Meeting",
        "occurred_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
        "owner": "Marcus Vance",
        "team": "SDR",
        "raw_transcript": """David Chen: Good afternoon Gregory. I understand Marcus set up this technical integration review.
Gregory Ross: Thanks David. Yes, Marcus introduced us, but we now need an in-depth security and architecture review. We require custom SAML SSO, on-premise encryption key management, and REST API sync for our SIEM security platform. If your SDK doesn't support our Python backend, we cannot proceed.
David Chen: Our SDK is open-source and natively supports Python, Go, and TypeScript. Let's inspect the webhook schema together."""
    },
    # Difficult routing decision 2: Dual escalation - Churn risk AND critical technical bug
    {
        "conversation_id": "CONV-2026-107",
        "external_id": "EXT-CRM-8807",
        "source_system": "Gainsight",
        "source_record_id": "GS-REC-007",
        "customer_id": "CUST-907",
        "customer_name": "Samantha Wu",
        "company": "BioGenix Diagnostics",
        "deal_id": "DEAL-507",
        "deal_name": "BioGenix Enterprise Health & Renewal Sync",
        "deal_stage": "Renewal",
        "deal_value": 165000.0,
        "conversation_type": "Meeting",
        "occurred_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
        "owner": "Elena Rostova",
        "team": "Customer Success",
        "raw_transcript": """Elena Rostova: Hello Samantha, thank you for joining our escalation touchpoint.
Samantha Wu: Elena, our account is at severe churn risk. Your API integration has failed for three consecutive days during our hospital sync, dropping 400 call recordings. Our Chief Medical Officer is threatening to cancel the entire contract immediately and demand a refund.
David Chen: Hi Samantha, I joined this call with Elena. I have diagnosed the webhook queue timeout in your cluster and deployed a hotfix to our staging gateway.
Samantha Wu: We need this verified in production immediately, otherwise we cannot approve our upcoming annual renewal."""
    },
    # Missing Customer Identity case:
    {
        "conversation_id": "CONV-2026-108",
        "external_id": "EXT-CRM-8808",
        "source_system": "Zoom Phone",
        "source_record_id": "ZP-REC-008",
        "customer_id": "CUST-UNKNOWN",
        "customer_name": "Unknown",
        "company": "Undisclosed Inbound Prospect",
        "deal_id": "DEAL-508",
        "deal_name": "Anonymous Inbound Lead Call",
        "deal_stage": "Discovery",
        "deal_value": 45000.0,
        "conversation_type": "Call",
        "occurred_at": (datetime.utcnow() - timedelta(days=6)).isoformat(),
        "owner": "Unassigned",
        "team": "Unassigned",
        "raw_transcript": """Caller: Hi, I'm calling to inquire about enterprise pricing for 100 sales seats.
Representative: Wonderful, can I get your name and company name?
Caller: I prefer to keep that confidential until I know what your pricing models look like. Do you charge per seat or based on audio minutes?
Representative: We have tiered annual pricing based on seats with unlimited audio processing."""
    },
    # High-Risk Deal with Budget Freeze:
    {
        "conversation_id": "CONV-2026-109",
        "external_id": "EXT-CRM-8809",
        "source_system": "Salesforce CRM",
        "source_record_id": "SF-REC-009",
        "customer_id": "CUST-909",
        "customer_name": "Brian Gallagher",
        "company": "Kestrel Financial Analytics",
        "deal_id": "DEAL-509",
        "deal_name": "Kestrel Analytics Platform Migration",
        "deal_stage": "Proposal",
        "deal_value": 115000.0,
        "conversation_type": "Call",
        "occurred_at": (datetime.utcnow() - timedelta(days=3)).isoformat(),
        "owner": "Sarah Jenkins",
        "team": "Enterprise AE",
        "raw_transcript": """Sarah Jenkins: Hello Brian, checking in on the board review of our software agreement.
Brian Gallagher: Hi Sarah. Bad news from our leadership committee this morning. The board imposed an immediate company-wide budget freeze due to macroeconomic tightening. All new software purchases are put on hold until Q3 of next year. We cannot sign right now.
Sarah Jenkins: I appreciate the transparency, Brian. Could we consider a phased pilot with delayed payment terms?
Brian Gallagher: Even $10k requires CFO sign-off right now. Let's reconnect in six months."""
    },
    # Strong Buying Signal / Ready to Close:
    {
        "conversation_id": "CONV-2026-110",
        "external_id": "EXT-CRM-8810",
        "source_system": "HubSpot CRM",
        "source_record_id": "HB-REC-010",
        "customer_id": "CUST-910",
        "customer_name": "Rachel Zane",
        "company": "Summit Ridge Capital",
        "deal_id": "DEAL-510",
        "deal_name": "Summit Ridge Deal Intelligence Integration",
        "deal_stage": "Negotiation",
        "deal_value": 130000.0,
        "conversation_type": "Meeting",
        "occurred_at": (datetime.utcnow() - timedelta(days=4)).isoformat(),
        "owner": "Sarah Jenkins",
        "team": "Enterprise AE",
        "raw_transcript": """Sarah Jenkins: Good afternoon Rachel, glad to review our final MSA.
Rachel Zane: Hi Sarah! Our investment committee approved the budget of $130,000 yesterday. We love the product, especially the automated risk alerts. Our General Counsel reviewed the redlines and everything is approved. We are ready to sign before Friday if you send over DocuSign today.
Sarah Jenkins: That is phenomenal! I will issue the DocuSign envelope immediately after this call."""
    }
]

# Generate additional realistic records to reach ~35 synthetic conversations
COMPANIES_DATA = [
    ("Quantum Peak Logistics", "Nathan Drake", "Mid-Market AE", "Alex Rivera", "Discovery", 55000.0, "Exploring speech analytics to reduce rep churn."),
    ("Triton Energy Corp", "Claire Sterling", "Enterprise AE", "Sarah Jenkins", "Technical Evaluation", 280000.0, "Evaluating custom on-premise deployment and strict data governance."),
    ("Aura Medical Devices", "Dr. Kenneth Boyd", "Solutions Engineering", "David Chen", "Proposal", 175000.0, "Reviewing HIPAA security architecture and webhook payloads."),
    ("BlueSky Media Group", "Chloe Sullivan", "Customer Success", "Elena Rostova", "Renewal", 95000.0, "Annual renewal discussion; requested 10 additional seats."),
    ("Hyperion Robotics", "Victor Vance", "SDR", "Marcus Vance", "Discovery", 62000.0, "Initial inquiry into automated conversation call transcription."),
    ("Sentinel Cyber Systems", "Evelyn Reed", "Solutions Engineering", "David Chen", "Technical Evaluation", 190000.0, "Security review; objection raised regarding SSO and SAML 2.0."),
    ("Oasis Retail Ventures", "Omar Farooq", "Enterprise AE", "Sarah Jenkins", "Negotiation", 140000.0, "Contract redline discussions with procurement team."),
    ("Pinnacle Cloud Labs", "Natasha Roman", "Mid-Market AE", "Alex Rivera", "Proposal", 88000.0, "Evaluating Chorus vs Revenue Intelligence; competitor pricing objection."),
    ("Crestview Financial", "Arthur Pendelton", "Customer Success", "Elena Rostova", "Renewal", 210000.0, "Severe dissatisfaction regarding reporting latency and missing CRM sync."),
    ("Solaria Smart Home", "Maya Lin", "Enterprise AE", "Sarah Jenkins", "Negotiation", 160000.0, "Budget approved; waiting on VP of Sales final signature."),
    ("Titanium Infrastructure", "Lucas Meyer", "Solutions Engineering", "David Chen", "Discovery", 125000.0, "API integration requirements for real-time sales alert routing."),
    ("Horizon Fleet Logistics", "Danielle Boone", "SDR", "Marcus Vance", "Discovery", 48000.0, "Inbound lead inquiring about rep onboarding and call coaching."),
    ("Veritas Analytics", "Harvey Specter", "Enterprise AE", "Sarah Jenkins", "Proposal", 195000.0, "Commercial review of multi-year contract terms and SLA guarantees."),
    ("NexGen BioPharm", "Julianna Moore", "Customer Success", "Elena Rostova", "Renewal", 150000.0, "Customer reported great ROI and agreed to expand contract by $30k."),
    ("Atlas Cloud Security", "Gabriel Macht", "Solutions Engineering", "David Chen", "Technical Evaluation", 240000.0, "Deep technical review of REST API latency and SOC2 Type II report."),
    ("Frontier Agriculture", "Donna Paulsen", "Mid-Market AE", "Alex Rivera", "Discovery", 70000.0, "Evaluating conversation intelligence to standardize sales playbooks."),
    ("Beacon Real Estate Tech", "Louis Litt", "Enterprise AE", "Sarah Jenkins", "Negotiation", 135000.0, "Procurement requested payment terms of Net-60; budget confirmed."),
    ("Starlight Dynamics", "Jessica Pearson", "Customer Success", "Elena Rostova", "Renewal", 225000.0, "Renewal risk due to leadership turnover; new CRO evaluating Clari."),
    ("EchoStream Media", "Mike Ross", "SDR", "Marcus Vance", "Discovery", 50000.0, "Inbound qualification call; reps overwhelmed by manual CRM logging."),
    ("Orion Satellite Tech", "Katrina Bennett", "Solutions Engineering", "David Chen", "Proposal", 185000.0, "Integration with internal Salesforce and HubSpot instances validated.")
]

def generate_synthetic_conversations() -> List[Dict[str, Any]]:
    conversations = list(DEMO_CONVERSATIONS)
    base_idx = 111
    
    for i, (company, cust, team, owner, stage, val, note) in enumerate(COMPANIES_DATA):
        conv_id = f"CONV-2026-{base_idx + i}"
        ext_id = f"EXT-CRM-{8810 + i + 1}"
        days_ago = (i % 14) + 1
        occurred = (datetime.utcnow() - timedelta(days=days_ago, hours=(i*3)%24)).isoformat()
        
        # Build a realistic transcript based on stage and note
        if "objection" in note.lower() or "dissatisfaction" in note.lower() or "risk" in note.lower():
            transcript = f"""{owner}: Hi {cust}, thank you for making time today to connect regarding {company}.
{cust}: Hi {owner}. I need to be straightforward with you. {note} If your team cannot resolve this promptly, we will cancel our subscription or choose a competitor.
{owner}: I hear you loud and clear. Let me pull in our technical and executive leads to address these points directly."""
        elif "budget approved" in note.lower() or "ready" in note.lower() or "expand" in note.lower():
            transcript = f"""{owner}: Hi {cust}, thrilled to review next steps for {company}.
{cust}: Hi {owner}. Great news! {note} The budget is approved and our team is ready to move forward. Please send the agreement for signature.
{owner}: Excellent! I will finalize the documentation and send it over right away."""
        else:
            transcript = f"""{owner}: Hello {cust}, thank you for joining our session today regarding {company}.
{cust}: Thanks {owner}. {note} We want to ensure seamless implementation and high team adoption across our sales reps.
{owner}: Absolutely. Let's walk through our milestone roadmap and schedule the next follow-up call."""

        conversations.append({
            "conversation_id": conv_id,
            "external_id": ext_id,
            "source_system": "Salesforce CRM" if i % 2 == 0 else "HubSpot CRM",
            "source_record_id": f"REC-AUTO-{base_idx + i}",
            "customer_id": f"CUST-{910 + i + 1}",
            "customer_name": cust,
            "company": company,
            "deal_id": f"DEAL-{510 + i + 1}",
            "deal_name": f"{company} Revenue Intelligence Project",
            "deal_stage": stage,
            "deal_value": val,
            "conversation_type": "Meeting" if i % 2 == 0 else "Call",
            "occurred_at": occurred,
            "owner": owner,
            "team": team,
            "raw_transcript": transcript
        })

    return conversations

def load_demo_data(force_reset: bool = False) -> Dict[str, Any]:
    with get_db() as conn:
        if force_reset:
            conn.execute("DELETE FROM conversation_analyses")
            conn.execute("DELETE FROM routing_decisions")
            conn.execute("DELETE FROM manual_corrections")
            conn.execute("DELETE FROM duplicate_reviews")
            conn.execute("DELETE FROM import_batches")
            conn.execute("DELETE FROM conversations")
            conn.execute("DELETE FROM audit_history")
            conn.execute("DELETE FROM rejected_decisions")

        # Check existing count
        existing_count = conn.execute("SELECT COUNT(*) as c FROM conversations WHERE is_deleted = 0").fetchone()["c"]
        if existing_count > 0 and not force_reset:
            return {"status": "already_loaded", "count": existing_count, "message": "Demo data already loaded."}

    demo_data = generate_synthetic_conversations()
    loaded_count = 0
    now = datetime.utcnow().isoformat()

    # Create an initial demo import batch
    batch_id = f"BATCH-DEMO-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    with get_db() as conn:
        conn.execute("""
            INSERT INTO import_batches (batch_id, filename, file_format, total_records, new_records, exact_duplicates, updated_records, potential_duplicates, conflicts, invalid_records, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (batch_id, "demo_conversations_seed.json", "JSON", len(demo_data), len(demo_data), 0, 0, 0, 0, 0, "completed", now))

    for item in demo_data:
        fingerprint = generate_fingerprint(item["customer_name"], item["occurred_at"], item["raw_transcript"])
        with get_db() as conn:
            conn.execute("""
                INSERT OR IGNORE INTO conversations (
                    conversation_id, external_id, source_system, source_record_id,
                    fingerprint, customer_id, customer_name, company, deal_id,
                    deal_name, deal_stage, deal_value, conversation_type,
                    occurred_at, owner, team, raw_transcript, version, is_deleted,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
            """, (
                item["conversation_id"], item["external_id"], item["source_system"],
                item["source_record_id"], fingerprint, item["customer_id"],
                item["customer_name"], item["company"], item["deal_id"],
                item["deal_name"], item["deal_stage"], item["deal_value"],
                item["conversation_type"], item["occurred_at"], item["owner"],
                item["team"], item["raw_transcript"], now, now
            ))

        # Perform analysis
        analysis = analyze_conversation(item)
        save_analysis(item["conversation_id"], analysis, version=1)

        # Perform routing
        routing = evaluate_routing(item, analysis)
        save_routing_decision(item["conversation_id"], routing)
        loaded_count += 1

    # Insert initial rejected decision example
    with get_db() as conn:
        conn.execute("""
            INSERT OR IGNORE INTO rejected_decisions (
                id, decision_considered, initial_rationale, evidence_reviewed,
                rejection_reason, potential_drawbacks, alternative_selected,
                author, created_at
            ) VALUES (
                1,
                'Automatically Reassign All Pricing-Disputed Conversations to Senior Enterprise AEs without Rep Review',
                'Accelerate commercial negotiation velocity by automatically bypassing initial SDR/AE and assigning high-tier executive closers.',
                'Reviewed 14 conversation transcripts where customers raised pricing resistance or budget freezes (e.g. Apex Global Logistics, CloudScale Telecom). In 64% of cases, pricing resistance was a secondary symptom of unresolved technical or onboarding dissatisfaction rather than commercial resistance.',
                'Automated reassignment severed the relationship with the existing account owner who had deep organizational context, alienating customers and producing disjointed handoffs.',
                'Rep confusion, CRM ownership churn, lack of accountability, and premature discounting before addressing root-cause technical objections.',
                'Implemented the Intelligent Routing Flagging Queue: maintain original account owner while automatically attaching a co-pilot recommendation for Solutions Engineering or Customer Success with manager approval required.',
                'Chief Revenue Officer & Sales Operations Lead',
                ?
            )
        """, (now,))

        # Insert a sample manual correction
        conn.execute("""
            INSERT OR IGNORE INTO manual_corrections (
                id, conversation_id, field_name, previous_value, new_value, reason, user, created_at
            ) VALUES (
                1, 'CONV-2026-101', 'priority', 'High', 'Critical',
                'Customer requested DocuSign signature this week with approved $145k budget; expedited closing priority',
                'Sales Manager', ?
            )
        """, (now,))

    record_audit("import", batch_id, "demo_data_loaded", {"record_count": loaded_count}, user="system")

    return {
        "status": "success",
        "loaded_records": loaded_count,
        "batch_id": batch_id,
        "message": f"Successfully loaded {loaded_count} realistic synthetic conversations."
    }
