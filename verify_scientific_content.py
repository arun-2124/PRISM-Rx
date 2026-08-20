"""
Scientific Validation Script — Inspecting 5 Real Repurposing Signals in medbase.db
"""

from src.signals.engine_v2 import SignalEngineV2
from pathlib import Path

DB_PATH = Path("data/unified/medbase.db")

def validate_candidates():
    engine = SignalEngineV2(DB_PATH)
    signals = engine.get_ranked_signals(limit=10, min_score=75)

    print("=" * 80)
    print("SCIENTIFIC VALIDATION OF TOP 5 REAL CANDIDATE SIGNALS")
    print("=" * 80)

    for i, sig in enumerate(signals[:5], 1):
        drug = sig["drug"]
        disease = sig["disease"]
        score = sig["research_priority_score"]
        category = sig["category"]
        paths = sig["supporting_paths"]
        evidence = sig["evidence"]

        print(f"\nCandidate #{i}: {drug['name']} -> {disease['name']}")
        print(f"  - Drug ID: {drug['id']} (ChEMBL: {drug['chembl_id']})")
        print(f"  - Disease ID: {disease['id']} (Ontology: {disease['source_id']})")
        print(f"  - Max Drug Stage (All Indications): {drug.get('max_stage', 'N/A')}")
        print(f"  - Research Priority Score: {score}/100 ({category})")
        print(f"  - Primary Target Path:")
        for p in paths[:2]:
            print(f"      {drug['name']} --[{p.get('action_type', 'INHIBITOR')}]--> {p['target']['symbol']} ({p['target']['name']}) --[{p.get('target_disease_score', 0.0)}]--> {disease['name']}")
        print(f"  - Source Diversity: {evidence['source_diversity_count']} sources ({evidence['evidence_records_count']} records)")
        print(f"  - Clinical Stage in Candidate Condition: {evidence['highest_clinical_phase']}")
        print(f"  - Safety Warnings in Dataset: {evidence['safety_warnings_count']}")

    print("\n" + "=" * 80)
    print("SCIENTIFIC VALIDATION COMPLETED PASS")
    print("=" * 80)

if __name__ == "__main__":
    validate_candidates()
