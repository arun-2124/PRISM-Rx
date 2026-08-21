import sqlite3
from pathlib import Path
from src.signals.engine_v2 import SignalEngineV2

DB_PATH = Path("data/unified/medbase.db")

def test_api_scores():
    engine = SignalEngineV2(DB_PATH)
    
    # Query candidate pairs with distinct drugs and diseases
    signals = engine.get_ranked_signals(limit=200, min_score=0.0)
    
    # Group by drug to find different drugs
    distinct_candidates = {}
    for s in signals:
        key = (s["drug"]["name"], s["disease"]["name"])
        if key not in distinct_candidates:
            distinct_candidates[key] = s
            
    print(f"Total Unique Candidates Sampled: {len(distinct_candidates)}\n")
    print(f"{'Signal ID':<45} | {'Drug Name':<20} | {'Disease Name':<30} | {'Score':<5}")
    print("-" * 110)
    
    sample_items = list(distinct_candidates.values())[:20]
    for sig in sample_items:
        sig_id = f"{sig['drug']['id']}__{sig['disease']['id']}"
        print(f"{sig_id:<45} | {sig['drug']['name'][:20]:<20} | {sig['disease']['name'][:30]:<30} | {sig['research_priority_score']:<5.1f}")

if __name__ == "__main__":
    test_api_scores()
