"""
Scientific Consistency Verifier — Comparing Post-Optimization Outputs with Baseline
"""

import json
from pathlib import Path
from src.signals.engine_v2 import SignalEngineV2

DB_PATH = Path("data/unified/medbase.db")

def verify_consistency():
    print("=" * 80)
    print("VERIFYING SCIENTIFIC OUTPUT CONSISTENCY BEFORE & AFTER OPTIMIZATION")
    print("=" * 80)

    with open("baseline_outputs.json", "r") as f:
        baseline = json.load(f)

    # Re-fetch with optimized engine
    engine = SignalEngineV2(DB_PATH)
    top5_post = engine.get_ranked_signals(limit=5, min_score=30)
    tg_post = engine.get_ranked_signals(drug="DR:CHEMBL403989", disease="D:MONDO_0004967", limit=1)

    top5_base = baseline["top5"]
    tg_base = baseline["tg100_801"]

    # 1. Compare Top 5 Candidates
    assert len(top5_post) == len(top5_base), "Length mismatch in top 5"
    for i in range(len(top5_base)):
        b = top5_base[i]
        p = top5_post[i]
        assert b["drug"]["id"] == p["drug"]["id"], f"Drug ID mismatch at index {i}"
        assert b["disease"]["id"] == p["disease"]["id"], f"Disease ID mismatch at index {i}"
        assert b["research_priority_score"] == p["research_priority_score"], f"Score mismatch at index {i}"
        assert b["category"] == p["category"], f"Category mismatch at index {i}"
        print(f"  [MATCH] Rank #{i+1}: {p['drug']['name']} -> {p['disease']['name']} | Score: {p['research_priority_score']}/100")

    # 2. Compare Demo Candidate Tg100-801
    assert tg_post[0]["drug"]["id"] == tg_base[0]["drug"]["id"]
    assert tg_post[0]["disease"]["id"] == tg_base[0]["disease"]["id"]
    assert tg_post[0]["research_priority_score"] == tg_base[0]["research_priority_score"]
    print(f"  [MATCH] Demo Candidate: Tg100-801 -> acute lymphoblastic leukemia | Score: {tg_post[0]['research_priority_score']}/100")

    print("\n" + "=" * 80)
    print("SCIENTIFIC CONSISTENCY CHECK 100% PASSED — IDENTICAL OUTPUTS")
    print("=" * 80)

if __name__ == "__main__":
    verify_consistency()
