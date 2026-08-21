"""
Script to Record Baseline Outputs for Scientific Consistency Check
"""

import json
from pathlib import Path
from src.signals.engine_v2 import SignalEngineV2

DB_PATH = Path("data/unified/medbase.db")

def record_baseline():
    engine = SignalEngineV2(DB_PATH)

    # 1. Top 5 Ranked Signals
    top5 = engine.get_ranked_signals(limit=5, min_score=30)

    # 2. Demo Candidate: Tg100-801 -> acute lymphoblastic leukemia
    tg = engine.get_ranked_signals(drug="DR:CHEMBL403989", disease="D:MONDO_0004967", limit=1)

    baseline = {
        "top5": top5,
        "tg100_801": tg,
    }

    with open("baseline_outputs.json", "w") as f:
        json.dump(baseline, f, indent=2)

    print(f"Recorded baseline outputs for {len(top5)} top signals and demo candidate.")

if __name__ == "__main__":
    record_baseline()
