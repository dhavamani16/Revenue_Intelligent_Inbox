# Revenue Intelligence Inbox — SpendNest Submission

**Author**: Dhavamani A ([@dhavamani16](https://github.com/dhavamani16))  
**Assessment Date**: 21 August 2026 (Asia/Kolkata)  
**Dataset**: SpendNest B2B Revenue Intelligence Dataset (44 Source Interactions)

---

## 🔗 Live Deployment & Submission Links

- 🌐 **Live Web Application (Vercel)**: [https://revenue-intelligent-inbox-cgu5.vercel.app](https://revenue-intelligent-inbox-cgu5.vercel.app)
- ⚙️ **Live Backend API (Render)**: [https://revenue-intelligent-inbox.onrender.com](https://revenue-intelligent-inbox.onrender.com)
- 📖 **Interactive API Documentation (Swagger)**: [https://revenue-intelligent-inbox.onrender.com/docs](https://revenue-intelligent-inbox.onrender.com/docs)
- 🩺 **Backend Health Endpoint**: [https://revenue-intelligent-inbox.onrender.com/api/health](https://revenue-intelligent-inbox.onrender.com/api/health)
- 🐙 **GitHub Repository**: [https://github.com/dhavamani16/Revenue_Intelligent_Inbox](https://github.com/dhavamani16/Revenue_Intelligent_Inbox)
- 📊 **Presentation Slides (PPTX)**: [`revenue_intelligence_findings.pptx`](https://github.com/dhavamani16/Revenue_Intelligent_Inbox/blob/main/revenue_intelligence_findings.pptx) *(5 dark SaaS slides)*
- 🎙️ **3-Minute Video Script**: [`demo_script.md`](https://github.com/dhavamani16/Revenue_Intelligent_Inbox/blob/main/demo_script.md) *(with timestamps & narration cues)*

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Python 3.11, FastAPI, Pydantic, Pandas, SQLite (WAL mode, timeout 30s)
- **Testing**: Pytest (7/7 tests pass, 100% contract compliance)
- **Deployment**: Vercel (Frontend SPA) + Render (Backend Web Service) + Docker ready

---

## ✅ Verified Data Contract Invariants

1. **Composite Identity**: Keyed strictly by `(source_type, source_id)` across exactly **44 records** (30 calls, 14 meetings).
2. **Replay Idempotence**: Re-importing `01_initial.json` (even scrambled) produces **0 duplicates** and zero state regressions.
3. **Dialogue Coverage Transition**:
   - `01_initial.json`: **17 usable texts** (M07 has 0 turns).
   - `02_update.json`: M07 receives 27 turns, transitioning usable dialogue count to **18**.
4. **Persistent Manual Override**: Manual route override on **M07** (`Customer Retention Escalation`) permanently survives update batches and initial re-imports.
5. **Zero Hallucination / Source Evidence**: Verified turn numbers (`Turn #8`, `Turn #14`, `Turn #19`) and direct quotes for all AI insights.
6. **Cryptographic Export Package**: Generates compliant 11-file ZIP archive containing `manifest.json` with SHA-256 checksums.

---

## 💡 Strategic Evidence Findings & Rejected Decision

- **Finding 1 (Prepaid vs Credit Demand — M03, M04)**: Enterprise accounts with cash reserves stall due to credit underwriting. Offering a prepaid corporate card tier unlocks \$140k+ ARR.
- **Finding 2 (M07 Payment Description Save Defect)**: Revision 2 transcript reveals an onboarding bug where invoice descriptions fail to persist on save, creating acute churn risk.
- **Finding 3 (Channel Partner Acceleration — M01, C07)**: Accounting and incorporation partners convert 3x faster with reseller portals and \$260 referral commission structures.
- **Documented Rejected Decision**: Evaluated proposal to route all billing complaints to generic Tier-1 support. **Rejected** because high-value onboarding defects (M07) require dedicated `Customer Retention Escalation` to prevent deal loss.

---

## ⚡ Quick Start (Local)

```bash
# 1. Run Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 2. Run Frontend
cd frontend && npm install && npm run dev
# Open http://localhost:5173

# 3. Run Automated Tests
cd backend && python -m pytest tests/test_business_logic.py -v
```
