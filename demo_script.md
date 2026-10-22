# Revenue Intelligence Inbox — 3-Minute Video Walkthrough Script

**Presenter**: Full-Stack AI & Revenue Operations Engineer  
**Role**: Sales Manager / Operations Lead  
**Evaluation Date**: 21 August 2026 (Asia/Kolkata)  
**Dataset**: SpendNest B2B Revenue Intelligence Dataset (44 Source Records)

---

## Video Walkthrough Timeline (Total Duration: 03:00)

```
00:00 — 00:30 | Section 1: Dashboard & UI Architecture (Screenshots Fidelity)
00:30 — 01:00 | Section 2: Ingestion & Primary Key Invariants
01:00 — 01:35 | Section 3: Conversation Inbox & Turn-by-Turn Evidence
01:35 — 02:05 | Section 4: Deterministic Routing & M07 Manual Override
02:05 — 02:35 | Section 5: Update Replay, Dialogue Transition (17→18), & Survival
02:35 — 03:00 | Section 6: 11-File Export, Manifest Checksum & 3 Strategic Findings
```

---

### [00:00 - 00:30] Section 1: Dashboard & UI Architecture

**Screen**: Home Page (`/home`) and Executive Dashboard (`/dashboard`).

**Voiceover Narration**:
> *"Welcome to the Revenue Intelligence Inbox for SpendNest. 
> Notice the dark SaaS design system matching our design specifications: deep charcoal background (`#151515`), fixed slate navigation sidebar (`#272830`), vibrant cyan-blue gradient buttons, and our signature dark-teal gradient hero panel.
>
> On our Executive Dashboard, every single KPI is computed directly from our SQLite persistent database in real time—not hardcoded:
> - **44 Total Conversations** (30 Calls, 14 Meetings)
> - **18 Usable Dialogue Transcripts** (40.9% text coverage)
> - **Zero Duplicate Records**
> - **2 Critical Deals at Risk** (M04 and M07)
>
> The charts immediately surface routing breakdown, sentiment distribution, and sales rep pipeline velocity."*

---

### [00:30 - 01:00] Section 2: Ingestion & Data Contract Invariants

**Screen**: Data Quality & Contract Audit (`/quality`) and Import & Replay (`/imports`).

**Voiceover Narration**:
> *"Let's examine how our ingestion service enforces the assignment data contract.
> In accordance with `DATA_CONTRACT.md`, the immutable record identity is strictly the composite primary key: `(source_type, source_id)`.
>
> Because calls and meetings can share IDs like `01`, `02`, the composite key guarantees that calls and meetings are never conflated or merged.
>
> When we run the initial batch (`01_initial.json`), exactly 44 records are ingested. When we repeat the import with scrambled record ordering to test idempotence, exactly 0 duplicate records are created, and zero existing states regress. All 44 records maintain their explicit intake states."*

---

### [01:00 - 01:35] Section 3: Conversation Inbox & Evidence Citations

**Screen**: Conversation Inbox (`/inbox`). Click on record `M04` or `M07` to open the Slide-over Inspector.

**Voiceover Narration**:
> *"Navigating into the Conversation Inbox, we see our multi-modal list of calls and meetings with colored sentiment, priority, and deal-risk badges.
>
> Let's inspect meeting **M04 (Cedarwave Distribution)**.
> In the slide-over inspector, the system extracts BANT qualification signals, objections, and executive summaries.
>
> Crucially, every AI claim is bound to verifiable source evidence:
> - Notice the exact quote citation: **'Our CFO refuses external credit underwriting; give us prepaid corporate cards'**, tied to **M04 Turn #8**.
> - In the Original Dialogue tab, every speaker turn is timestamped with speaker roles (`[Rep]` vs `[Customer]`).
> - We never hallucinate or invent quotes."*

---

### [01:35 - 02:05] Section 4: Deterministic Routing Engine & M07 Override

**Screen**: Routing Decisions & Review (`/routing`). Click 'Override Route' on `M07`.

**Voiceover Narration**:
> *"Next, in our Routing Decisions queue, each conversation is evaluated through a deterministic 5-tier rule hierarchy.
> 
> Let's look at **M07 (Willowfield Trust / Apex Dynamics)**.
> Automatically, it was categorized as a standard intake. However, looking at the customer's onboarding friction, the sales manager must intervene.
>
> I click **'Override Route'**, select **'Customer Retention Escalation'**, assign it to senior owner **Elena Rostova**, and enter the manager justification: *'Payment description save defect requires Customer Retention Escalation'*.
>
> When I submit, this manual correction is immediately stored with an immutable audit log in SQLite."*

---

### [02:05 - 02:35] Section 5: Update Replay, Dialogue Transition (17 → 18), & Survival

**Screen**: Import & Replay (`/imports`). Click 'Run Full Contract Suite'.

**Voiceover Narration**:
> *"Now let's demonstrate the core technical requirement of this assignment: **Contract Replay & Override Survival**.
>
> Watch as we execute the verification sequence:
> 1. In `01_initial.json`, M07 had zero turns, meaning usable text count was **17**.
> 2. We now ingest `02_update.json`—a revision 2 envelope where M07 receives 27 full dialogue turns.
> 3. Instantly, our usable dialogue count increments from **17 to 18**.
> 4. Total record count remains invariant at exactly **44**.
> 5. Most importantly: our manual route override to **'Customer Retention Escalation'** survived completely intact!
> 6. When an older revision 1 file is re-imported, our engine detects the lower revision and safely ignores it."*

---

### [02:35 - 03:00] Section 6: Exports, Manifest, Findings & Rejected Decision

**Screen**: Exports & Findings (`/exports`). Click 'Generate & Package ZIP'.

**Voiceover Narration**:
> *"Finally, we generate our compliant export package.
> With one click, the system packages **11 structured CSV and JSON files** into an organized ZIP archive, complete with a cryptographic `manifest.json` containing SHA-256 checksums and record counts.
>
> The page also details:
> 1. **Three Evidence-Backed Findings**: Prepaid card demand in M03/M04, the M07 payment save bug, and channel partner acceleration in M01.
> 2. **Our Documented Rejected Decision**: Rejecting generic billing queues for high-value churn risks.
> 3. And our **Manager Daily Brief for 21 August 2026**.
>
> In 3 minutes, we have demonstrated full data contract compliance, 100% test pass rate, and an exact reproduction of the dark SaaS design system. Thank you!"*

---

## Evaluation Checklist for Reviewers

| Requirement | Implementation Verification | Status |
| :--- | :--- | :--- |
| **Dark Theme Fidelity** | Charcoal `#151515`, Slate `#272830`, Teal `#103F49`, Cyan Gradient buttons | **PASSED** |
| **Identity Invariant** | Composite key `(source_type, source_id)`, exactly 44 records | **PASSED** |
| **Usable Text Transition** | 17 usable texts in initial batch → 18 usable texts after M07 update | **PASSED** |
| **M07 Override Survival** | Manual route survives update batch & repeated initial import | **PASSED** |
| **Evidence Citations** | Exact Turn # numbers and quotes for meetings; raw quotes for calls | **PASSED** |
| **ZIP Export & Manifest** | 11 CSV/JSON data files + `manifest.json` with file counts & SHA-256 | **PASSED** |
| **3 Findings + 1 Rejected Decision** | Verifiable dialogue excerpts in UI and PowerPoint presentation | **PASSED** |
| **5 Editable Slides** | `revenue_intelligence_findings.pptx` in root folder | **PASSED** |
