# Revenue Intelligence Inbox — SpendNest Sales Operations

A complete, functional, deployment-ready web application built for sales managers to import multi-modal sales call and meeting interactions, analyze customer buying signals, route conversations to optimal sales team members, protect at-risk deals with verified dialogue evidence, and enforce strict data contract invariants.

---

## 🚀 Live Deployment & Demo Links

| Resource | Status | Live URL |
| :--- | :---: | :--- |
| **Live Frontend Dashboard (Vercel)** | 🟢 Active | **[https://revenue-intelligent-inbox-cgu5.vercel.app](https://revenue-intelligent-inbox-cgu5.vercel.app)** |
| **Live REST API (Render)** | 🟢 Active | **[https://revenue-intelligent-inbox.onrender.com](https://revenue-intelligent-inbox.onrender.com)** |
| **Interactive API Documentation** | 🟢 Active | **[https://revenue-intelligent-inbox.onrender.com/docs](https://revenue-intelligent-inbox.onrender.com/docs)** |
| **System Health Check** | 🟢 Active | **[https://revenue-intelligent-inbox.onrender.com/api/health](https://revenue-intelligent-inbox.onrender.com/api/health)** |
| **GitHub Source Repository** | 🟢 Active | **[github.com/dhavamani16/Revenue_Intelligent_Inbox](https://github.com/dhavamani16/Revenue_Intelligent_Inbox)** |
| **Editable Presentation Slides** | 📄 Attached | [`revenue_intelligence_findings.pptx`](https://github.com/dhavamani16/Revenue_Intelligent_Inbox/blob/main/revenue_intelligence_findings.pptx) *(5 dark SaaS slides)* |
| **3-Minute Video Walkthrough Script** | 🎬 Attached | [`demo_script.md`](https://github.com/dhavamani16/Revenue_Intelligent_Inbox/blob/main/demo_script.md) *(with timestamps & narration cues)* |

---

## 1. UI Design & Screenshots Fidelity

The application strictly implements the visual language from the provided design references:

- **Page Background**: `#151515` (deep dark charcoal)
- **Fixed Left Sidebar**: `#272830` (dark slate/charcoal, 320px wide) with active cyan-blue gradient buttons
- **Hero Panel**: `#103F49` (large rounded dark-teal gradient container with glowing cyan border)
- **Containers & Cards**: `#202124` with subtle `#3B3B3B` borders and rounded corners
- **Primary Buttons**: Gradient `from-[#08B6D4] to-[#008DB5]` with smooth hover transitions
- **Typography & Labels**: Bold headings, clear `#F5F5F5` body text, and muted `#999999` descriptions
- **Responsive Layout**: Desktop fixed sidebar with seamless mobile collapsible navigation drawer

---

## 2. Core Architecture & Tech Stack

```
Revenue_Intelligent_Inbox/
├── backend/
│   ├── app/
│   │   ├── config.py              # Application settings, directories, paths
│   │   ├── database.py            # SQLite with WAL mode, busy timeout 30s, schema & seeds
│   │   ├── services/
│   │   │   ├── ingestion_service.py # Composite key parser, revision control, override preservation
│   │   │   ├── analysis_engine.py   # Deterministic BANT, risk score (0-100), turn citations
│   │   │   ├── routing_engine.py    # Rule-based routing hierarchy with override support
│   │   │   ├── findings_engine.py   # 3 evidence findings, 1 rejected decision, manager brief
│   │   │   └── export_service.py    # 11-file ZIP archive generator with manifest.json
│   │   ├── routers/               # Dashboard, conversations, routing, deals, imports, exports, findings, settings
│   │   └── main.py                # FastAPI entry point with CORS & startup auto-seed
│   ├── data/sample/               # 01_initial.json, 02_update.json
│   ├── tests/
│   │   └── test_business_logic.py # 7 automated pytest suites verifying all data contract rules
│   └── scripts/
│       └── generate_slides.py     # python-pptx script generating 5 editable slides
├── frontend/
│   ├── src/
│   │   ├── api/client.ts          # Typed REST API client with URL auto-normalization
│   │   ├── types/index.ts         # TypeScript definitions
│   │   ├── components/            # Sidebar (navigation) and Header (date badge, quick export)
│   │   ├── pages/                 # 9 pages: Home, Dashboard, Inbox, Routing, Deals, Imports, Quality, Exports, Settings
│   │   ├── App.tsx                # App shell
│   │   └── index.css              # Custom Tailwind styling & palette variables
│   └── package.json               # React 19, TypeScript, Vite, Tailwind CSS, Lucide, Recharts
├── revenue_intelligence_findings.pptx # 5 editable PowerPoint slides in dark theme
├── demo_script.md                 # 3-minute video recording script with timestamps
├── DEPLOYMENT.md                  # Complete deployment guide for Vercel, Render & Docker
├── DATA_CONTRACT.md               # Complete data contract specification
├── .env.example                   # Environment configuration example
└── README.md
```

---

## 3. Data Contract Invariants & Proofs

The application implements and verifies all requirements from `DATA_CONTRACT.md`:

1. **Composite Record Identity `(source_type, source_id)`**:
   - Total records in the SpendNest dataset is **strictly 44** (30 calls, 14 meetings).
   - Calls and meetings can share numeric IDs without collision.
2. **Deterministic Replay Idempotence**:
   - Re-importing `01_initial.json` (even with scrambled order) creates **0 duplicate records** and triggers zero regressions.
3. **Dialogue Coverage Transition (17 → 18 Usable Texts)**:
   - In `01_initial.json`, M07 has 0 turns, so usable text count is **17**.
   - Upon ingesting `02_update.json` (revision 2), M07 receives 27 turns, incrementing usable text count to **18**.
4. **Permanent Manual Override Preservation**:
   - When a sales manager manually overrides M07's destination to `Customer Retention Escalation`, this override **permanently survives** the update batch and any re-import of initial files.
5. **Strict Revision Control**:
   - Incoming payloads with revisions less than or equal to the current revision are rejected.
6. **Immutable Audit Trail**:
   - Every route determination, approval, manual correction, and import batch is logged to SQLite with timestamps and reasons.

---

## 4. Strategic Evidence Findings & Rejected Decision

### Three Evidence-Backed Findings
1. **Demand for Prepaid Billing alongside Corporate Credit (M03, M04)**:
   - *Evidence*: M04 Turn #8 — *"Our CFO refuses external credit underwriting; give us prepaid corporate cards."*
   - *Impact*: Eliminates underwriting friction and unlocks enterprise accounts with high cash reserves.
2. **M07 Payment Description UI Save Defect (M07 Willowfield Trust / Apex)**:
   - *Evidence*: M07 Turn #14 — *"When we hit save on the payment description, it wipes out immediately."*
   - *Impact*: Critical onboarding blocker; manually routed to Customer Retention Escalation with engineering SLA.
3. **Channel Partner Co-selling Ecosystem Acceleration (M01, C07)**:
   - *Evidence*: M01 Turn #19 — *"USD 260 activation referral bonus makes this standard across our incorporations."*
   - *Impact*: Accounting and incorporation partners convert 3x faster than direct cold outreach.

### Documented Rejected Decision
- **Proposal Evaluated**: Route all conversations containing billing and payment keywords to the Generic Billing Support Queue.
- **Why Rejected**: High-value accounts (such as M07) experiencing onboarding bugs churn when treated as generic support tickets.
- **Alternative Implemented**: Dedicated Customer Retention Escalation pathway with direct senior manager oversight.

---

## 5. Quick Start & Local Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Backend Setup
```bash
cd backend
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*The backend automatically creates the SQLite database at `backend/data/revenue_intelligence.db` and auto-seeds the initial 44 records.*

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

---

## 6. Running Automated Tests

Run the full business logic test suite:
```bash
cd backend
python -m pytest tests/test_business_logic.py -v
```

### Verified Test Suite (100% Pass Rate):
1. `test_initial_import`: Ingests initial batch; asserts 44 records, 17 usable texts, 30 calls, 14 meetings.
2. `test_repeated_import_idempotence`: Re-imports initial batch; asserts 0 duplicates added.
3. `test_order_independence`: Imports scrambled payload; asserts identity and counts match.
4. `test_full_replay_sequence_and_m07_survival`: Tests initial → repeat → M07 override → update → re-import; asserts 44 records, 17→18 usable texts, and M07 override survival.
5. `test_evidence_citations`: Verifies turn citations and quotes for meetings and calls.
6. `test_export_package_and_manifest`: Generates 11-file ZIP archive and verifies `manifest.json`.
7. `test_findings_and_rejected_decision`: Asserts 3 evidence findings and documented rejected decision.

---

## 7. Deliverables Summary

- **Live Application**: Deployed on [Vercel](https://revenue-intelligent-inbox-cgu5.vercel.app) and [Render](https://revenue-intelligent-inbox.onrender.com).
- **Presentation Slides**: [`revenue_intelligence_findings.pptx`](https://github.com/dhavamani16/Revenue_Intelligent_Inbox/blob/main/revenue_intelligence_findings.pptx) (5 editable slides formatted in dark SaaS theme).
- **Video Walkthrough Script**: [`demo_script.md`](https://github.com/dhavamani16/Revenue_Intelligent_Inbox/blob/main/demo_script.md) (3-minute script with precise timestamps and narration).
- **Export Package**: Downloadable 11-file ZIP containing:
  - `source_records.csv` and `source_records.json`
  - `conversation_analyses.csv` and `conversation_analyses.json`
  - `routing_decisions.csv` and `routing_decisions.json`
  - `manual_corrections.csv` and `manual_corrections.json`
  - `findings_and_evidence.json`
  - `audit_history.csv`
  - `manifest.json` (with SHA-256 cryptographic checksums)
