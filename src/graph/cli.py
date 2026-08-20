"""
CLI Utility for PRISM-Rx Knowledge Graph Traversal & Dev Visualization
Usage: python -m src.graph.cli [--drug NAME] [--disease NAME] [--min-score 0.2] [--limit 10] [--json]
"""

import argparse
import json
from pathlib import Path
from .traversal import find_repurposing_candidates
from .visualization import format_candidate_summary


def main():
    parser = argparse.ArgumentParser(description="PRISM-Rx Knowledge Graph Traversal CLI")
    parser.add_argument("--drug", type=str, help="Filter by drug name or ID")
    parser.add_argument("--disease", type=str, help="Filter by disease name or ID")
    parser.add_argument("--min-score", type=float, default=0.2, help="Minimum target-disease score threshold (default: 0.2)")
    parser.add_argument("--limit", type=int, default=10, help="Maximum candidates to return (default: 10)")
    parser.add_argument("--json", action="store_true", help="Output raw JSON payload")
    args = parser.parse_args()

    candidates = find_repurposing_candidates(
        drug_name=args.drug,
        disease_name=args.disease,
        min_score=args.min_score,
        limit=args.limit
    )

    if not candidates:
        print("\nNo potential repurposing candidate paths found matching the specified criteria.")
        return

    if args.json:
        print(json.dumps(candidates, indent=2))
    else:
        print(f"\nFound {len(candidates)} potential repurposing candidate signal(s):\n")
        for i, cand in enumerate(candidates, 1):
            print(format_candidate_summary(cand, i))
            print()


if __name__ == "__main__":
    main()
