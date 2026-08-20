"""PRISM-Rx Score Equivalence & Regression Verification Script.

Compares live candidate calculation against recorded SQLite golden baseline.
"""

import sys
import json
import sqlite3
sys.path.insert(0, ".")

from src.signals.engine_v2 import SignalEngineV2

BASELINE_PATH = "tests/fixtures/sqlite_score_baseline.json"
DB_PATH = "data/unified/medbase.db"

def run_score_equivalence_check():
    with open(BASELINE_PATH, "r") as f:
        baseline = json.load(f)

    engine = SignalEngineV2(DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    print("=" * 70)
    print("PRISM-Rx SCORE EQUIVALENCE REGRESSION TEST")
    print("=" * 70)

    all_passed = True

    for sig_id, base in baseline.items():
        parts = sig_id.split("__")
        d_clean, dis_clean = parts[0].replace("DR:", ""), parts[1].replace("D:", "")

        sigs = engine.get_ranked_signals(drug=d_clean, disease=dis_clean, limit=1)
        if not sigs:
            print(f"[FAIL] Candidate '{sig_id}' not found in engine lookup.")
            all_passed = False
            continue

        sig = sigs[0]
        live_score = sig["research_priority_score"]
        base_score = base["prism_score"]

        match = abs(live_score - base_score) < 0.0001

        status_str = "PASS" if match else "FAIL"
        print(f"[{status_str}] {base['drug_name']} -> {base['disease_name']}")
        print(f"       Baseline Score: {base_score} | Live Score: {live_score}")

        if not match:
            all_passed = False

    conn.close()

    print("=" * 70)
    if all_passed:
        print("ALL CANDIDATE SCORES MATCH GOLDEN BASELINE 100%")
    else:
        print("SCORE EQUIVALENCE FAILURE DETECTED")
    print("=" * 70)

    return all_passed

if __name__ == "__main__":
    success = run_score_equivalence_check()
    sys.exit(0 if success else 1)
