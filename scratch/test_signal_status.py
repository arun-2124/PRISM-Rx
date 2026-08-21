import sqlite3
from pathlib import Path
from src.signals.engine_v2 import SignalEngineV2

DB_PATH = Path("data/unified/medbase.db")

def classify_candidate(drug_id, disease_id):
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. Check if established indication in drug_disease table
    est_row = cursor.execute("""
        SELECT max_clinical_stage FROM drug_disease
        WHERE drug_id = ? AND disease_id = ?
    """, (drug_id, disease_id)).fetchone()

    is_established = False
    if est_row:
        stage = (est_row["max_clinical_stage"] or "").upper()
        if "APPROVAL" in stage or "APPROVED" in stage or "INDICATION" in stage:
            is_established = True

    # 2. Check supporting evidence
    ev_cnt = cursor.execute("SELECT COUNT(*) FROM evidence WHERE drug_id = ?", (drug_id,)).fetchone()[0]
    dt_cnt = cursor.execute("SELECT COUNT(*) FROM drug_target WHERE drug_id = ?", (drug_id,)).fetchone()[0]
    trials_cnt = cursor.execute("""
        SELECT COUNT(DISTINCT cr.id) FROM evidence e
        JOIN clinical_reports cr ON e.clinical_report_id = cr.id
        WHERE e.drug_id = ?
    """, (drug_id,)).fetchone()[0]

    sources_count = (1 if ev_cnt > 0 else 0) + (1 if dt_cnt > 0 else 0) + (1 if trials_cnt > 0 else 0)

    # Get PRISM Score from engine
    engine = SignalEngineV2(str(DB_PATH))
    sigs = engine.get_ranked_signals(drug=drug_id, disease=disease_id, limit=1)
    prism_score = sigs[0].get("prism_score") or sigs[0].get("score") if sigs else None
    cat = sigs[0].get("category") if sigs else None

    # Determine Classification
    if is_established:
        status = "ESTABLISHED"
        label = "ESTABLISHED INDICATION"
        color = "#10b981" # Emerald
        reason = "Verified established drug-disease indication relationship in current database snapshot."
    elif ev_cnt > 0 or sources_count >= 2 or trials_cnt > 0:
        status = "EMERGING"
        label = "EMERGING SIGNAL"
        color = "#f59e0b" # Amber
        reason = f"Candidate is not an established indication in current database snapshot; supported by {sources_count} independent sources and {ev_cnt} provenanced evidence records."
    else:
        status = "HYPOTHESIS"
        label = "RESEARCH HYPOTHESIS"
        color = "#9d4edd" # Violet
        reason = "Candidate relationship is a computationally generated research hypothesis with limited direct evidence records."

    conn.close()

    return {
        "drug_id": drug_id,
        "disease_id": disease_id,
        "prism_score": prism_score,
        "category": cat,
        "status": status,
        "label": label,
        "color": color,
        "reason": reason,
        "established_indication": is_established,
        "supporting_evidence_count": ev_cnt,
        "independent_sources_count": sources_count,
        "clinical_trials_count": trials_cnt
    }

def main():
    candidates = [
        ("DR:CHEMBL403989", "D:MONDO_0004967", "Tg100-801 -> acute lymphoblastic leukemia"),
        ("DR:CHEMBL4", "D:EFO_0000544", "Ofloxacin -> infection (Established Test)"),
        ("DR:CHEMBL940", "D:MONDO_0005027", "Gabapentin -> epilepsy (Established Test)"),
        ("DR:CHEMBL473159", "D:EFO_0005762", "Phloroglucinol -> neuropathic pain"),
        ("DR:CHEMBL1059", "D:EFO_0010282", "Pregabalin -> gastrointestinal disease"),
        ("DR:CHEMBL1201", "D:MONDO_0005070", "Metformin -> neoplasm"),
    ]

    print("=======================================================")
    print("SIGNAL STATUS CLASSIFICATION TEST RESULTS")
    print("=======================================================")
    for d, dis, title in candidates:
        res = classify_candidate(d, dis)
        print(f"\nCandidate: {title} ({d}__{dis})")
        print(f"  - PRISM Priority Score: {res['prism_score']} / 100 ({res['category']})")
        print(f"  - Established Indication? {res['established_indication']}")
        print(f"  - Supporting Evidence Records: {res['supporting_evidence_count']}")
        print(f"  - Independent Data Sources: {res['independent_sources_count']}")
        print(f"  - Final Status: {res['label']} ({res['status']})")
        print(f"  - Reason: {res['reason']}")

if __name__ == "__main__":
    main()
