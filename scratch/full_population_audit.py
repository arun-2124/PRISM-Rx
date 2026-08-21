import sqlite3
import numpy as np
import collections
from pathlib import Path
from src.signals.engine_v2 import SignalEngineV2, ACTION_CONFIDENCE, DB_PATH

def run_full_population_audit():
    print("Starting full population audit over medbase.db using SignalEngineV2...")
    engine = SignalEngineV2(DB_PATH)
    
    # Evaluate 10,000 unindicated candidate pairs across the database spectrum
    print("Evaluating 10,000 candidate pairs spanning top, mid, and low score ranges...")
    
    signals = engine.get_ranked_signals(limit=10000, min_score=0.0)
    total_n = len(signals)
    print(f"Evaluated {total_n:,} candidate signals.\n")

    scores = [s["research_priority_score"] for s in signals]
    categories = collections.Counter([s["category"] for s in signals])

    std_list = [s["score_components"]["target_disease_pts"] for s in signals]
    sdt_list = [s["score_components"]["drug_target_pts"] for s in signals]
    sclin_list = [s["score_components"]["clinical_pts"] for s in signals]
    slit_list = [s["score_components"]["literature_pts"] for s in signals]
    fdiv_list = [s["score_components"]["source_diversity_pts"] for s in signals]
    btarget_list = [s["score_components"]["multi_target_bonus_pts"] for s in signals]
    snov_list = [s["score_components"]["novelty_pts"] for s in signals]
    psafety_list = [s["score_components"]["safety_penalty"] for s in signals]
    pcontra_list = [s["score_components"]["contradiction_penalty"] for s in signals]

    print("=======================================================")
    print(f"FULL POPULATION AUDIT RESULTS ({total_n:,} CANDIDATES)")
    print("=======================================================")
    print(f"Min Score:              {np.min(scores):.1f}")
    print(f"Max Score:              {np.max(scores):.1f}")
    print(f"Mean Score:             {np.mean(scores):.2f}")
    print(f"Median Score:           {np.median(scores):.2f}")
    print(f"Standard Deviation:     {np.std(scores):.2f}")
    print(f"Unique Score Values:    {len(set(scores))}")

    # Buckets
    b_0_19 = sum(1 for s in scores if 0 <= s <= 19.9)
    b_20_39 = sum(1 for s in scores if 20 <= s <= 39.9)
    b_40_69 = sum(1 for s in scores if 40 <= s <= 69.9)
    b_70_100 = sum(1 for s in scores if 70 <= s <= 100)

    print(f"\n1. SCORE BUCKET DISTRIBUTION:")
    print(f"  0 - 19:   {b_0_19:8,} ({b_0_19/total_n*100:5.2f}%)")
    print(f" 20 - 39:   {b_20_39:8,} ({b_20_39/total_n*100:5.2f}%)")
    print(f" 40 - 69:   {b_40_69:8,} ({b_40_69/total_n*100:5.2f}%)")
    print(f" 70 - 100:  {b_70_100:8,} ({b_70_100/total_n*100:5.2f}%)")

    print(f"\n2. CATEGORY DISTRIBUTION:")
    expected_cats = ["INSUFFICIENT_EVIDENCE", "WEAK_RESEARCH_SIGNAL", "MODERATE_RESEARCH_SIGNAL", "STRONG_RESEARCH_SIGNAL", "CONTRADICTED"]
    for cat in expected_cats:
        cnt = categories.get(cat, 0)
        print(f"  {cat:<26}: {cnt:8,} ({cnt/total_n*100:5.2f}%)")

    def analyze_comp(name, arr, max_val):
        arr_np = np.array(arr)
        min_v = np.min(arr_np)
        max_v = np.max(arr_np)
        mean_v = np.mean(arr_np)
        med_v = np.median(arr_np)
        uniq_v = len(set(arr))
        pct_max = np.sum(arr_np >= max_val) / total_n * 100
        pct_zero = np.sum(arr_np == 0.0) / total_n * 100
        return f"{name:<8} | Min: {min_v:5.1f} | Max: {max_v:5.1f} | Mean: {mean_v:5.2f} | Med: {med_v:5.1f} | Unique: {uniq_v:4d} | %Max: {pct_max:5.1f}% | %Zero: {pct_zero:5.1f}%"

    print(f"\n3. COMPONENT DISTRIBUTION & SATURATION ANALYSIS:")
    print(analyze_comp("STD", std_list, 30.0))
    print(analyze_comp("SDT", sdt_list, 15.0))
    print(analyze_comp("SClin", sclin_list, 15.0))
    print(analyze_comp("SLit", slit_list, 10.0))
    print(analyze_comp("FDiv", fdiv_list, 10.0))
    print(analyze_comp("BTarget", btarget_list, 10.0))
    print(analyze_comp("SNov", snov_list, 5.0))
    print(analyze_comp("PSafety", psafety_list, 40.0))
    print(analyze_comp("PContra", pcontra_list, 30.0))

if __name__ == "__main__":
    run_full_population_audit()
