"""
Detailed Line-by-Line Profiler for SignalEngineV2.get_ranked_signals()
"""

import time
import sqlite3
from pathlib import Path

DB_PATH = Path("data/unified/medbase.db")

def profile_engine_steps():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    print("=" * 80)
    print("LINE-BY-LINE PROFILING OF SignalEngineV2.get_ranked_signals()")
    print("=" * 80)

    # Step 1: Initial Candidate Join Query
    t0 = time.time()
    query = """
    SELECT 
        d.id as drug_id, d.name as drug_name, d.chembl_id, d.drug_type, d.max_clinical_stage as drug_max_stage,
        t.id as target_id, t.approved_symbol, t.approved_name, t.target_class,
        dt.action_type, dt.mechanism_of_action, dt.source as dt_source,
        dis.id as disease_id, dis.name as disease_name, dis.source_id as disease_source_id,
        td.score as td_score, td.source as td_source
    FROM drug_target dt
    JOIN drugs d ON dt.drug_id = d.id
    JOIN targets t ON dt.target_id = t.id
    JOIN target_disease td ON td.target_id = t.id
    JOIN diseases dis ON td.disease_id = dis.id
    LEFT JOIN drug_disease dd ON dd.drug_id = d.id AND dd.disease_id = dis.id
    WHERE dd.drug_id IS NULL
    ORDER BY td.score DESC LIMIT ?
    """
    rows = conn.execute(query, (400,)).fetchall()
    t1 = time.time()
    print(f"Step 1 (Main Join Query): {(t1 - t0) * 1000:.2f} ms | Rows fetched: {len(rows)}")

    # Step 2: Grouping into candidates_map
    candidates_map = {}
    for r in rows:
        key = f"{r['drug_id']}||{r['disease_id']}"
        if key not in candidates_map:
            candidates_map[key] = {
                "drug_id": r['drug_id'], "drug_name": r['drug_name'], "chembl_id": r['chembl_id'],
                "disease_id": r['disease_id'], "disease_name": r['disease_name'], "sources": set(),
                "max_td_score": 0.0, "target_ids": set(), "action_confidences": [], "supporting_paths": []
            }
    t2 = time.time()
    print(f"Step 2 (Map Grouping): {(t2 - t1) * 1000:.2f} ms | Unique Candidates: {len(candidates_map)}")

    # Step 3: Loop for per-candidate evidence queries
    t_loop_start = time.time()
    for key, cand in candidates_map.items():
        drug_id = cand["drug_id"]
        warnings = conn.execute("SELECT warning_type, toxicity_class, description FROM drug_warnings WHERE drug_id = ?", (drug_id,)).fetchall()
        trials = conn.execute("SELECT DISTINCT cr.id, cr.source_name, cr.clinical_stage, cr.trial_phase, cr.trial_status, cr.url FROM evidence e JOIN clinical_reports cr ON e.clinical_report_id = cr.id WHERE e.drug_id = ? LIMIT 20", (drug_id,)).fetchall()
        ev_rows = conn.execute("SELECT COUNT(*), COUNT(DISTINCT publication_ids) FROM evidence WHERE drug_id = ?", (drug_id,)).fetchone()
    t3 = time.time()
    print(f"Step 3 (Per-Candidate Loop Queries): {(t3 - t_loop_start) * 1000:.2f} ms")

    conn.close()

if __name__ == "__main__":
    profile_engine_steps()
