"""
Test Batch Query Optimization in SignalEngineV2
"""

import time
import sqlite3
from pathlib import Path

DB_PATH = Path("data/unified/medbase.db")

def test_batch():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    # Sample 50 drug IDs
    drugs = conn.execute("SELECT id FROM drugs LIMIT 50").fetchall()
    drug_ids = [d["id"] for d in drugs]

    # Un-batched (50 * 3 = 150 queries)
    t0 = time.time()
    for did in drug_ids:
        w = conn.execute("SELECT warning_type FROM drug_warnings WHERE drug_id = ?", (did,)).fetchall()
        t = conn.execute("SELECT DISTINCT cr.id FROM evidence e JOIN clinical_reports cr ON e.clinical_report_id = cr.id WHERE e.drug_id = ?", (did,)).fetchall()
        e = conn.execute("SELECT COUNT(*), COUNT(DISTINCT publication_ids) FROM evidence WHERE drug_id = ?", (did,)).fetchone()
    t_unbatched = (time.time() - t0) * 1000

    # Batched (3 queries total)
    t0 = time.time()
    placeholders = ",".join("?" * len(drug_ids))
    
    # 1. Batch warnings
    warnings_rows = conn.execute(f"SELECT drug_id, warning_type, toxicity_class, description FROM drug_warnings WHERE drug_id IN ({placeholders})", drug_ids).fetchall()
    warnings_by_drug = {}
    for r in warnings_rows:
        warnings_by_drug.setdefault(r["drug_id"], []).append(dict(r))

    # 2. Batch clinical trials
    trials_rows = conn.execute(f"""
        SELECT DISTINCT e.drug_id, cr.id, cr.source_name, cr.clinical_stage, cr.trial_phase, cr.trial_status, cr.url
        FROM evidence e
        JOIN clinical_reports cr ON e.clinical_report_id = cr.id
        WHERE e.drug_id IN ({placeholders})
    """, drug_ids).fetchall()
    trials_by_drug = {}
    for r in trials_rows:
        trials_by_drug.setdefault(r["drug_id"], []).append(dict(r))

    # 3. Batch evidence counts
    ev_rows = conn.execute(f"""
        SELECT drug_id, COUNT(*) as ev_cnt, COUNT(DISTINCT publication_ids) as lit_cnt
        FROM evidence
        WHERE drug_id IN ({placeholders})
        GROUP BY drug_id
    """, drug_ids).fetchall()
    ev_by_drug = {r["drug_id"]: (r["ev_cnt"], r["lit_cnt"]) for r in ev_rows}
    t_batched = (time.time() - t0) * 1000

    print(f"Unbatched (150 queries): {t_unbatched:.2f} ms")
    print(f"Batched (3 queries): {t_batched:.2f} ms")
    print(f"Speedup: {t_unbatched / t_batched:.2f}x faster!")

    conn.close()

if __name__ == "__main__":
    test_batch()
