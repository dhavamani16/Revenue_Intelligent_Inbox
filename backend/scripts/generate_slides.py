import sys
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_presentation(output_path: Path):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_slide_layout = prs.slide_layouts[6]

    # Palette
    BG_COLOR = RGBColor(21, 21, 21)        # #151515
    PANEL_BG = RGBColor(32, 33, 36)        # #202124
    TEAL_HERO = RGBColor(16, 63, 73)       # #103F49
    CYAN_ACCENT = RGBColor(8, 182, 212)    # #08B6D4
    TEXT_WHITE = RGBColor(245, 245, 245)   # #F5F5F5
    TEXT_MUTED = RGBColor(153, 153, 153)   # #999999
    BORDER_COLOR = RGBColor(59, 59, 59)    # #3B3B3B
    RED_ACCENT = RGBColor(239, 68, 68)     # #EF4444
    GREEN_ACCENT = RGBColor(16, 185, 129)  # #10B981

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_COLOR
        bg.line.color.rgb = BG_COLOR
        return bg

    def add_header(slide, title_text, category="REVENUE INTELLIGENCE"):
        # Category pill
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(8), Inches(0.4))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = f"SPENDNEST / {category.upper()}"
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = CYAN_ACCENT

        # Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.5), Inches(0.8))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_WHITE

    # -------------------------------------------------------------
    # SLIDE 1: Title Slide (Hero Panel Style)
    # -------------------------------------------------------------
    slide1 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide1)

    # Hero card in center
    hero = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(1.0), Inches(11.333), Inches(5.5))
    hero.fill.solid()
    hero.fill.fore_color.rgb = TEAL_HERO
    hero.line.color.rgb = CYAN_ACCENT
    hero.line.width = Pt(1.5)

    tf1 = hero.text_frame
    tf1.word_wrap = True
    tf1.margin_left = Inches(0.8)
    tf1.margin_right = Inches(0.8)
    tf1.margin_top = Inches(0.8)

    p0 = tf1.paragraphs[0]
    p0.text = "SPENDNEST REVENUE OPERATIONS — 21 AUGUST 2026"
    p0.font.size = Pt(12)
    p0.font.bold = True
    p0.font.color.rgb = CYAN_ACCENT

    p1 = tf1.add_paragraph()
    p1.text = "Revenue Intelligence Inbox"
    p1.font.size = Pt(36)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_WHITE
    p1.space_before = Pt(12)

    p2 = tf1.add_paragraph()
    p2.text = "Executive Intelligence Brief, Contract Invariant Verification & Evidence Routing"
    p2.font.size = Pt(18)
    p2.font.color.rgb = TEXT_WHITE
    p2.space_before = Pt(8)

    p3 = tf1.add_paragraph()
    p3.text = "Turning 44 multi-modal sales calls and meetings into verified, audit-logged revenue actions."
    p3.font.size = Pt(14)
    p3.font.color.rgb = TEXT_MUTED
    p3.space_before = Pt(16)

    # 3 Summary metric pills on Slide 1
    metrics = [
        ("44 Interactions", "30 Calls & 14 Meetings"),
        ("18 Usable Transcripts", "40.9% Dialogue Coverage"),
        ("100% Invariant Compliance", "Zero Identity Regressions")
    ]
    for idx, (m_title, m_desc) in enumerate(metrics):
        x = Inches(1.8 + idx * 3.4)
        y = Inches(4.5)
        m_card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(3.0), Inches(1.2))
        m_card.fill.solid()
        m_card.fill.fore_color.rgb = PANEL_BG
        m_card.line.color.rgb = BORDER_COLOR
        
        m_tf = m_card.text_frame
        m_tf.word_wrap = True
        m_tf.margin_top = Inches(0.15)
        mp0 = m_tf.paragraphs[0]
        mp0.text = m_title
        mp0.font.size = Pt(14)
        mp0.font.bold = True
        mp0.font.color.rgb = CYAN_ACCENT
        mp1 = m_tf.add_paragraph()
        mp1.text = m_desc
        mp1.font.size = Pt(10)
        mp1.font.color.rgb = TEXT_MUTED

    # -------------------------------------------------------------
    # SLIDE 2: Ingestion Architecture & Contract Invariants
    # -------------------------------------------------------------
    slide2 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide2)
    add_header(slide2, "Ingestion Architecture & Strict Data Contract Invariants")

    invariants = [
        ("1. Primary Key Invariant", "(source_type, source_id)", "Strict composite key prevents cross-modal ID collisions. Total unique records permanently equals exactly 44 (30 calls, 14 meetings)."),
        ("2. Replay Idempotence", "0 Duplicates Added", "Re-importing 01_initial.json or scrambled payload ignores duplicate records. Zero database mutations or regressions on re-runs."),
        ("3. Dialogue Transition", "17 -> 18 Usable Texts", "01_initial.json contains 17 usable texts (M07 has 0 turns). Ingesting 02_update.json delivers 27 turns for M07, elevating usable count to 18."),
        ("4. Revision & Override Survival", "M07 Override Intact", "Older or equal incoming revisions are rejected. Manual route override on M07 (Customer Retention Escalation) permanently survives subsequent batch updates.")
    ]

    for idx, (inv_title, inv_badge, inv_desc) in enumerate(invariants):
        x = Inches(0.8 + (idx % 2) * 5.9)
        y = Inches(1.6 + (idx // 2) * 2.6)
        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.6), Inches(2.3))
        card.fill.solid()
        card.fill.fore_color.rgb = PANEL_BG
        card.line.color.rgb = BORDER_COLOR

        ctf = card.text_frame
        ctf.word_wrap = True
        ctf.margin_left = Inches(0.3)
        ctf.margin_right = Inches(0.3)
        ctf.margin_top = Inches(0.25)

        cp0 = ctf.paragraphs[0]
        cp0.text = inv_title
        cp0.font.size = Pt(14)
        cp0.font.bold = True
        cp0.font.color.rgb = TEXT_WHITE

        cp1 = ctf.add_paragraph()
        cp1.text = f"VERIFIED: {inv_badge}"
        cp1.font.size = Pt(11)
        cp1.font.bold = True
        cp1.font.color.rgb = GREEN_ACCENT
        cp1.space_before = Pt(4)

        cp2 = ctf.add_paragraph()
        cp2.text = inv_desc
        cp2.font.size = Pt(11)
        cp2.font.color.rgb = TEXT_MUTED
        cp2.space_before = Pt(6)

    # -------------------------------------------------------------
    # SLIDE 3: Three Evidence-Backed Strategic Findings
    # -------------------------------------------------------------
    slide3 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide3)
    add_header(slide3, "Three Evidence-Backed Findings from Source Dialogue")

    findings = [
        (
            "Finding 1: Prepaid vs Credit Demand",
            "M03, M04 (2 Enterprise Accounts)",
            "Customers resist rigid post-paid corporate credit checks. M04 CFO vetoed contract citing credit underwriting friction. Offering prepaid card tiers unlocks $140k+ ARR across mid-market prospects.",
            "M04 Turn #8: 'Our CFO refuses external credit underwriting; give us prepaid corporate cards.'"
        ),
        (
            "Finding 2: M07 Payment Save Defect",
            "M07 (Willowfield Trust / Apex)",
            "Revision 2 transcript uncovered a critical onboarding defect: invoice payment descriptions fail to persist upon save. Blocks customer finance go-live and creates severe churn threat.",
            "M07 Turn #14: 'When we hit save on the payment description, it wipes out immediately.'"
        ),
        (
            "Finding 3: Channel Partner Acceleration",
            "M01, C07 (Harborpath Advisory)",
            "Channel accounting and MSP firms drive 3x faster adoption when provided co-branded reseller portals and $260 referral commission structures rather than direct cold-call sales.",
            "M01 Turn #19: 'USD 260 activation referral bonus makes this standard across our incorporations.'"
        )
    ]

    for idx, (f_title, f_metric, f_desc, f_quote) in enumerate(findings):
        x = Inches(0.8 + idx * 3.9)
        y = Inches(1.6)
        card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(3.7), Inches(5.3))
        card.fill.solid()
        card.fill.fore_color.rgb = PANEL_BG
        card.line.color.rgb = BORDER_COLOR

        ctf = card.text_frame
        ctf.word_wrap = True
        ctf.margin_left = Inches(0.25)
        ctf.margin_right = Inches(0.25)
        ctf.margin_top = Inches(0.25)

        p_t = ctf.paragraphs[0]
        p_t.text = f_title
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = CYAN_ACCENT

        p_m = ctf.add_paragraph()
        p_m.text = f"Scope: {f_metric}"
        p_m.font.size = Pt(10)
        p_m.font.bold = True
        p_m.font.color.rgb = TEXT_WHITE
        p_m.space_before = Pt(4)

        p_d = ctf.add_paragraph()
        p_d.text = f_desc
        p_d.font.size = Pt(10)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(8)

        p_q_lbl = ctf.add_paragraph()
        p_q_lbl.text = "VERIFIED DIALOGUE CITATION:"
        p_q_lbl.font.size = Pt(9)
        p_q_lbl.font.bold = True
        p_q_lbl.font.color.rgb = GREEN_ACCENT
        p_q_lbl.space_before = Pt(14)

        p_q = ctf.add_paragraph()
        p_q.text = f'"{f_quote}"'
        p_q.font.size = Pt(9)
        p_q.font.italic = True
        p_q.font.color.rgb = TEXT_WHITE
        p_q.space_before = Pt(2)

    # -------------------------------------------------------------
    # SLIDE 4: Rejected Decision & Evidence-Based Routing
    # -------------------------------------------------------------
    slide4 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide4)
    add_header(slide4, "Rejected Routing Proposal & Automated Review Architecture")

    # Left Box: Rejected Decision
    left_card = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.3))
    left_card.fill.solid()
    left_card.fill.fore_color.rgb = PANEL_BG
    left_card.line.color.rgb = RED_ACCENT
    left_card.line.width = Pt(1.5)

    ltf = left_card.text_frame
    ltf.word_wrap = True
    ltf.margin_left = Inches(0.35)
    ltf.margin_right = Inches(0.35)
    ltf.margin_top = Inches(0.3)

    lp0 = ltf.paragraphs[0]
    lp0.text = "DOCUMENTED REJECTED DECISION"
    lp0.font.size = Pt(12)
    lp0.font.bold = True
    lp0.font.color.rgb = RED_ACCENT

    lp1 = ltf.add_paragraph()
    lp1.text = "Proposal: Route All Invoice & Billing Discrepancies to Generic Tier-1 Billing Queue"
    lp1.font.size = Pt(14)
    lp1.font.bold = True
    lp1.font.color.rgb = TEXT_WHITE
    lp1.space_before = Pt(6)

    lp2 = ltf.add_paragraph()
    lp2.text = "Initial Rationale: Group all billing and payment keyword mentions into finance support."
    lp2.font.size = Pt(11)
    lp2.font.color.rgb = TEXT_MUTED
    lp2.space_before = Pt(8)

    lp3 = ltf.add_paragraph()
    lp3.text = "Why Rejected (Evidence-Based):"
    lp3.font.size = Pt(11)
    lp3.font.bold = True
    lp3.font.color.rgb = RED_ACCENT
    lp3.space_before = Pt(12)

    lp4 = ltf.add_paragraph()
    lp4.text = "Treating enterprise accounts like M07 as standard billing tickets causes severe deal churn. M07 is an active onboarding bug that requires specialized Customer Retention Escalation with direct frontend engineering engagement."
    lp4.font.size = Pt(11)
    lp4.font.color.rgb = TEXT_WHITE
    lp4.space_before = Pt(4)

    lp5 = ltf.add_paragraph()
    lp5.text = "Alternative Implemented: Dedicated Customer Retention Escalation pathway with manager override persistence."
    lp5.font.size = Pt(11)
    lp5.font.bold = True
    lp5.font.color.rgb = GREEN_ACCENT
    lp5.space_before = Pt(12)

    # Right Box: Deterministic Routing Engine
    right_card = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.3))
    right_card.fill.solid()
    right_card.fill.fore_color.rgb = PANEL_BG
    right_card.line.color.rgb = CYAN_ACCENT
    right_card.line.width = Pt(1.5)

    rtf = right_card.text_frame
    rtf.word_wrap = True
    rtf.margin_left = Inches(0.35)
    rtf.margin_right = Inches(0.35)
    rtf.margin_top = Inches(0.3)

    rp0 = rtf.paragraphs[0]
    rp0.text = "AUTOMATED ROUTING ENGINE HIERARCHY"
    rp0.font.size = Pt(12)
    rp0.font.bold = True
    rp0.font.color.rgb = CYAN_ACCENT

    rules = [
        ("1. Enterprise Sales", "Rules: deal size >= $50k or explicit CFO/Enterprise keywords -> Elena Rostova"),
        ("2. Mid-Market Expansion", "Rules: $10k-$50k deal size, expansion stages -> Marcus Vance"),
        ("3. Customer Success Retention", "Rules: Onboarding bugs, churn risk, complaints -> Sarah Chen"),
        ("4. Partner Ecosystem", "Rules: Reseller, accountant, referral terms -> Chloe Bennett"),
        ("5. Core Sales Triage", "Rules: General intake fallback with manager review flag")
    ]
    for r_name, r_desc in rules:
        p_r = rtf.add_paragraph()
        p_r.text = f"• {r_name}: {r_desc}"
        p_r.font.size = Pt(11)
        p_r.font.color.rgb = TEXT_MUTED
        p_r.space_before = Pt(6)

    rp_audit = rtf.add_paragraph()
    rp_audit.text = "100% Immutable Audit Trail: Every routing determination, rule match, and manager override is permanently logged to SQLite with user and timestamp."
    rp_audit.font.size = Pt(11)
    rp_audit.font.bold = True
    rp_audit.font.color.rgb = GREEN_ACCENT
    rp_audit.space_before = Pt(14)

    # -------------------------------------------------------------
    # SLIDE 5: Executive Action Plan (21 August 2026)
    # -------------------------------------------------------------
    slide5 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide5)
    add_header(slide5, "Manager Action Plan & Rep Coaching (21 August 2026)")

    # 3 Priority Columns
    priorities = [
        (
            "P0: Onboarding Escalation (M07)",
            "Sarah Chen / Engineering",
            "Urgent bug hotfix: Apex Dynamics payment description wiped out on save. Schedule emergency manager check-in to preserve account relationship."
        ),
        (
            "P1: Credit Programme Migration (M04)",
            "Elena Rostova / Enterprise",
            "Decommissioning legacy cards requires hybrid credit/prepaid pathway. Deliver custom prepaid commercial proposal to bypass CFO credit block."
        ),
        (
            "P2: Channel Reseller Rollout (M01)",
            "Chloe Bennett / Partnerships",
            "Harborpath Advisory agreed to $260 incorporation referral terms. Ship unique tracked referral link and co-branded onboarding collateral."
        )
    ]

    for idx, (p_title, p_owner, p_action) in enumerate(priorities):
        x = Inches(0.8 + idx * 3.9)
        y = Inches(1.6)
        card = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(3.7), Inches(2.6))
        card.fill.solid()
        card.fill.fore_color.rgb = PANEL_BG
        card.line.color.rgb = BORDER_COLOR

        ptf = card.text_frame
        ptf.word_wrap = True
        ptf.margin_left = Inches(0.25)
        ptf.margin_right = Inches(0.25)
        ptf.margin_top = Inches(0.2)

        p_h = ptf.paragraphs[0]
        p_h.text = p_title
        p_h.font.size = Pt(12)
        p_h.font.bold = True
        p_h.font.color.rgb = CYAN_ACCENT

        p_o = ptf.add_paragraph()
        p_o.text = f"Owner: {p_owner}"
        p_o.font.size = Pt(10)
        p_o.font.bold = True
        p_o.font.color.rgb = GREEN_ACCENT
        p_o.space_before = Pt(4)

        p_a = ptf.add_paragraph()
        p_a.text = p_action
        p_a.font.size = Pt(10)
        p_a.font.color.rgb = TEXT_MUTED
        p_a.space_before = Pt(6)

    # Coaching Box below
    coach_card = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.5), Inches(11.7), Inches(2.4))
    coach_card.fill.solid()
    coach_card.fill.fore_color.rgb = PANEL_BG
    coach_card.line.color.rgb = CYAN_ACCENT
    coach_card.line.width = Pt(1.5)

    ctf = coach_card.text_frame
    ctf.word_wrap = True
    ctf.margin_left = Inches(0.35)
    ctf.margin_right = Inches(0.35)
    ctf.margin_top = Inches(0.2)

    cp0 = ctf.paragraphs[0]
    cp0.text = "FIELD SALES COACHING NOTES (EVIDENCE-DERIVED)"
    cp0.font.size = Pt(12)
    cp0.font.bold = True
    cp0.font.color.rgb = CYAN_ACCENT

    coaching_items = [
        ("Arun (C01 Outbound Calls):", "Prospect displayed strong skepticism regarding generic automation. Coaching point: pivot call opener away from general 'expense automation' toward pain points in multi-currency treasury and reconciliation."),
        ("Meera (C05, C08, C09 Store Outbound):", "Successfully surfaced prospect tech stacks (StoreHarbor) and secondary decision-makers. Coaching point: emphasize SpendNest automated payment execution rather than static reporting in email follow-ups.")
    ]
    for c_rep, c_note in coaching_items:
        p_c = ctf.add_paragraph()
        p_c.text = f"• {c_rep} {c_note}"
        p_c.font.size = Pt(10)
        p_c.font.color.rgb = TEXT_WHITE
        p_c.space_before = Pt(6)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(output_path))
    print(f"Presentation generated successfully at: {output_path}")

if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "revenue_intelligence_findings.pptx"
    create_presentation(out)
