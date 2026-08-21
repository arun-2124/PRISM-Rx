import sqlite3
import json
import numpy as np
import collections
from pathlib import Path
from src.signals.engine_v2 import SignalEngineV2

DB_PATH = Path("data/unified/medbase.db")

def run_distribution_audit():
    engine = SignalEngineV2(DB_PATH)
    
    # Evaluate top 500 candidate signals across medbase.db
    signals = engine.get_ranked_signals(limit=500, min_score=0.0)
    
    print(f"Evaluated {len(signals)} candidates.")
    
    scores = [s["research_priority_score"] for s in signals]
    
    std_list = [s["score_components"]["target_disease_pts"] for s in signals]
    sdt_list = [s["score_components"]["drug_target_pts"] for s in signals]
    sclin_list = [s["score_components"]["clinical_pts"] for s in signals]
    slit_list = [s["score_components"]["literature_pts"] for s in signals]
    fdiv_list = [s["score_components"]["source_diversity_pts"] for s in signals]
    btarget_list = [s["score_components"]["multi_target_bonus_pts"] for s in signals]
    snov_list = [s["score_components"]["novelty_pts"] for s in signals]
    psafety_list = [s["score_components"]["safety_penalty"] for s in signals]
    pcontra_list = [s["score_components"]["contradiction_penalty"] for s in signals]

    # Stats
    min_score = np.min(scores)
    max_score = np.max(scores)
    mean_score = np.mean(scores)
    median_score = np.median(scores)
    std_dev = np.std(scores)
    
    counts = collections.Counter(scores)
    most_common_score, most_common_count = counts.most_common(1)[0]
    unique_scores_count = len(counts)
    
    print("\n--- DISTRIBUTION STATISTICS ---")
    print(f"Candidates Evaluated: {len(signals)}")
    print(f"Minimum Score: {min_score}")
    print(f"Maximum Score: {max_score}")
    print(f"Mean Score: {mean_score:.2f}")
    print(f"Median Score: {median_score:.2f}")
    print(f"Standard Deviation: {std_dev:.2f}")
    print(f"Unique Score Values: {unique_scores_count}")
    print(f"Most Common Score: {most_common_score} (occurs {most_common_count} times)")
    
    print("\n--- SCORE FREQUENCY HISTOGRAM (TOP 15) ---")
    for score_val, cnt in counts.most_common(15):
        print(f"Score {score_val:5.1f} | Count: {cnt:3d} | {'#' * (cnt // 2)}")

    print("\n--- COMPONENT DIVERSITY ---")
    print(f"STD Unique Values:      {len(set(std_list))}")
    print(f"SDT Unique Values:      {len(set(sdt_list))}")
    print(f"SClin Unique Values:    {len(set(sclin_list))}")
    print(f"SLit Unique Values:     {len(set(slit_list))}")
    print(f"FDiv Unique Values:     {len(set(fdiv_list))}")
    print(f"BTarget Unique Values:  {len(set(btarget_list))}")
    print(f"SNov Unique Values:     {len(set(snov_list))}")
    print(f"PSafety Unique Values:  {len(set(psafety_list))}")
    print(f"PContra Unique Values:  {len(set(pcontra_list))}")

    print("\n--- SAMPLE 10 CANDIDATES COMPONENT TABLE ---")
    print(f"{'Candidate Pair':<45} | {'Score':<5} | {'STD':<5} | {'SDT':<5} | {'SClin':<5} | {'SLit':<5} | {'FDiv':<5} | {'BTgt':<5} | {'SNov':<5} | {'PSafe':<5}")
    print("-" * 115)
    for s in signals[:10]:
        cname = f"{s['drug']['name']} -> {s['disease']['name']}"
        sc = s["score_components"]
        print(f"{cname[:45]:<45} | {s['research_priority_score']:<5.1f} | {sc['target_disease_pts']:<5.1f} | {sc['drug_target_pts']:<5.1f} | {sc['clinical_pts']:<5.1f} | {sc['literature_pts']:<5.1f} | {sc['source_diversity_pts']:<5.1f} | {sc['multi_target_bonus_pts']:<5.1f} | {sc['novelty_pts']:<5.1f} | {sc['safety_penalty']:<5.1f}")

if __name__ == "__main__":
    run_distribution_audit()
