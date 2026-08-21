import sqlite3
from pathlib import Path
from src.signals.engine_v2 import SignalEngineV2

DB_PATH = Path("data/unified/medbase.db")

def test_candidate_timelines():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    candidates = [
        ("DR:CHEMBL403989", "D:MONDO_0004967", "Tg100-801 -> acute lymphoblastic leukemia"),
        ("DR:CHEMBL473159", "D:EFO_0005762", "Phloroglucinol -> neuropathic pain"),
        ("DR:CHEMBL1059", "D:EFO_0010282", "Pregabalin -> gastrointestinal disease"),
        ("DR:CHEMBL1201", "D:MONDO_0005070", "Metformin -> neoplasm")
    ]

    for drug_id, disease_id, label in candidates:
        print(f"\n=======================================================")
        print(f"CANDIDATE: {label} ({drug_id}__{disease_id})")
        print(f"=======================================================")

        # 1. Clinical Trials with dates
        trials = cursor.execute("""
            SELECT DISTINCT cr.id, cr.source_name, cr.trial_phase, cr.trial_status, cr.trial_start_date, cr.url
            FROM evidence e
            JOIN clinical_reports cr ON e.clinical_report_id = cr.id
            WHERE e.drug_id = ? AND cr.trial_start_date IS NOT NULL AND cr.trial_start_date != ''
            ORDER BY cr.trial_start_date DESC
            LIMIT 10
        """, (drug_id,)).fetchall()
        print(f"Clinical Trial Events ({len(trials)}):")
        for tr in trials:
            print(f"  - [{tr['trial_start_date']}] CLINICAL TRIAL: Study {tr['id']} ({tr['trial_phase'] or 'Phase N/A'}, Status: {tr['trial_status'] or 'N/A'})")

        # 2. Drug Warnings with years
        warnings = cursor.execute("""
            SELECT warning_type, toxicity_class, country, year
            FROM drug_warnings
            WHERE drug_id = ? AND year IS NOT NULL
            ORDER BY year DESC
        """, (drug_id,)).fetchall()
        print(f"Drug Warning Events ({len(warnings)}):")
        for w in warnings:
            print(f"  - [{int(w['year'])}] SAFETY WARNING: {w['warning_type']} ({w['toxicity_class'] or 'General Toxicity'})")

        # 3. Evidence Events
        events = cursor.execute("""
            SELECT source, event_type, publication_date, title, evidence_strength, url
            FROM evidence_events
            WHERE drug_id = ? OR disease_id = ?
            ORDER BY publication_date DESC
        """, (drug_id, disease_id)).fetchall()
        print(f"Evidence Events ({len(events)}):")
        for ev in events:
            print(f"  - [{ev['publication_date']}] {ev['event_type']}: {ev['title']} (Source: {ev['source']})")

        # 4. Open Targets & ChEMBL Datasets Ingestion Snapshot Date
        ev_snap = cursor.execute("""
            SELECT MIN(retrieved_at) as first_retrieved, MAX(retrieved_at) as last_retrieved, COUNT(*) as cnt
            FROM evidence
            WHERE drug_id = ?
        """, (drug_id,)).fetchone()
        if ev_snap and ev_snap['cnt'] > 0:
            print(f"Open Targets Ingestion Snapshot: [{ev_snap['last_retrieved'][:10]}] TARGET-DISEASE EVIDENCE: {ev_snap['cnt']} evidence records indexed in medbase.db")

    conn.close()

if __name__ == "__main__":
    test_candidate_timelines()
