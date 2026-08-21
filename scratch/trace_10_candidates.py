import sqlite3
from pathlib import Path
from src.signals.engine_v2 import SignalEngineV2

DB_PATH = Path("data/unified/medbase.db")

def trace_candidates():
    engine = SignalEngineV2(DB_PATH)
    all_signals = engine.get_ranked_signals(limit=1000, min_score=0.0)
    
    # Pick 10 candidates with distinct drugs and distinct scores
    seen_drugs = set()
    selected = []
    
    for s in all_signals:
        dname = s["drug"]["name"]
        if dname not in seen_drugs:
            seen_drugs.add(dname)
            selected.append(s)
            if len(selected) == 10:
                break
                
    print(f"{'Candidate':<42} | {'Score':<5} | {'STD':<4} | {'SDT':<4} | {'SClin':<5} | {'SLit':<4} | {'FDiv':<4} | {'BTgt':<4} | {'SNov':<4} | {'PSaf':<4} | {'Math Check'}")
    print("-" * 115)
    
    for s in selected:
        cname = f"{s['drug']['name']} -> {s['disease']['name']}"
        score = s["research_priority_score"]
        sc = s["score_components"]
        
        std = sc["target_disease_pts"]
        sdt = sc["drug_target_pts"]
        sclin = sc["clinical_pts"]
        slit = sc["literature_pts"]
        fdiv = sc["source_diversity_pts"]
        btgt = sc["multi_target_bonus_pts"]
        snov = sc["novelty_pts"]
        psaf = sc["safety_penalty"]
        pcontra = sc["contradiction_penalty"]
        
        computed_sum = round(std + sdt + sclin + slit + fdiv + btgt + snov - psaf - pcontra, 1)
        math_valid = "PASS" if abs(computed_sum - score) < 0.01 else "FAIL"
        
        print(f"{cname[:42]:<42} | {score:<5.1f} | {std:<4.1f} | {sdt:<4.1f} | {sclin:<5.1f} | {slit:<4.1f} | {fdiv:<4.1f} | {btgt:<4.1f} | {snov:<4.1f} | {psaf:<4.1f} | {math_valid} ({computed_sum})")

if __name__ == "__main__":
    trace_candidates()
