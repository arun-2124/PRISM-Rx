"""
Repurposing Signal Engine (optimized)

Finds drug-disease pairs where:
  Drug → targets → Protein X
  Protein X → associated with → Disease Y
  Drug is NOT already approved for Disease Y

Usage: python src/signals/engine.py [--drug NAME] [--disease NAME] [--min-score N] [--top N]
"""

import sqlite3
import json
import argparse
from pathlib import Path

DB_PATH = Path("data/unified/medbase.db")

CLINICAL_STAGE_SCORES = {
    'APPROVAL': 1.0, 'PHASE_4': 0.8, 'PHASE_3': 0.6,
    'PHASE_2': 0.4, 'PHASE_1': 0.2, 'PHASE_0': 0.1,
}

ACTION_CONFIDENCE = {
    'INHIBITOR': 0.9, 'ANTAGONIST': 0.9, 'AGONIST': 0.8,
    'MODULATOR': 0.7, 'BLOCKER': 0.8, 'OPENER': 0.7,
    'POSITIVE_MODULATOR': 0.7, 'NEGATIVE_MODULATOR': 0.7,
    'REGULATOR': 0.6,
}


def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def find_signals(drug_name=None, disease_name=None, min_score=20, limit=20):
    conn = get_connection()

    query = """
    SELECT
        d.id as drug_id, d.name as drug_name, d.chembl_id,
        d.drug_type, d.max_clinical_stage as drug_max_stage,
        t.id as target_id, t.approved_symbol, t.approved_name,
        dt.action_type, dt.mechanism_of_action,
        dis.id as disease_id, dis.name as disease_name,
        td.score as td_score,
        dd_existing.max_clinical_stage as existing_indication
    FROM drug_target dt
    JOIN drugs d ON dt.drug_id = d.id
    JOIN targets t ON dt.target_id = t.id
    JOIN target_disease td ON td.target_id = t.id
    JOIN diseases dis ON td.disease_id = dis.id
    LEFT JOIN drug_disease dd_existing
        ON dd_existing.drug_id = d.id AND dd_existing.disease_id = dis.id
    WHERE dd_existing.drug_id IS NULL
    """

    params = []

    if drug_name:
        query += " AND (d.name LIKE ? OR d.id LIKE ?)"
        params.extend([f"%{drug_name}%", f"%{drug_name}%"])

    if disease_name:
        query += " AND (dis.name LIKE ? OR dis.id LIKE ?)"
        params.extend([f"%{disease_name}%", f"%{disease_name}%"])

    query += " ORDER BY td.score DESC LIMIT ?"
    params.append(min(limit * 10, 5000))

    rows = conn.execute(query, params).fetchall()

    signals = []
    for row in rows:
        td_score = row['td_score'] or 0

        clinical_stage = row['existing_indication']
        clinical_score = CLINICAL_STAGE_SCORES.get(clinical_stage, 0) if clinical_stage else 0

        action = row['action_type']
        action_conf = ACTION_CONFIDENCE.get(action, 0.5) if action else 0.5

        novelty = 1.0

        signal_score = (
            td_score * 0.30 +
            clinical_score * 0.25 +
            action_conf * 0.15 +
            0.5 * 0.15 +
            novelty * 0.15
        ) * 100

        if signal_score < min_score:
            continue

        if signal_score >= 70:
            category = "STRONG SIGNAL"
        elif signal_score >= 40:
            category = "MODERATE SIGNAL"
        elif signal_score >= 20:
            category = "WEAK SIGNAL"
        else:
            category = "INSUFFICIENT"

        signals.append({
            "drug": {
                "id": row['drug_id'],
                "name": row['drug_name'],
                "chembl_id": row['chembl_id'],
                "type": row['drug_type'],
                "max_stage": row['drug_max_stage'],
            },
            "target": {
                "id": row['target_id'],
                "symbol": row['approved_symbol'],
                "name": row['approved_name'],
                "action": row['action_type'],
                "mechanism": row['mechanism_of_action'],
            },
            "disease": {
                "id": row['disease_id'],
                "name": row['disease_name'],
            },
            "signal_score": round(signal_score, 1),
            "signal_category": category,
            "components": {
                "target_disease_score": round(td_score, 3),
                "clinical_stage": clinical_stage,
                "clinical_score": round(clinical_score, 2),
                "action_type": action,
                "action_confidence": round(action_conf, 2),
                "novelty": round(novelty, 2),
            },
        })

    signals.sort(key=lambda x: x['signal_score'], reverse=True)
    conn.close()
    return signals[:limit]


def find_drug_detail(drug_id, conn):
    query = """
    SELECT
        dis.name as disease_name,
        dt.action_type,
        t.approved_symbol,
        td.score as td_score,
        dd.max_clinical_stage as indication_stage
    FROM drug_target dt
    JOIN targets t ON dt.target_id = t.id
    JOIN target_disease td ON td.target_id = t.id
    JOIN diseases dis ON td.disease_id = dis.id
    LEFT JOIN drug_disease dd ON dd.drug_id = ? AND dd.disease_id = dis.id
    WHERE dt.drug_id = ?
    ORDER BY td.score DESC
    LIMIT 20
    """
    return conn.execute(query, (drug_id, drug_id)).fetchall()


def format_signal(s, idx=1):
    lines = []
    lines.append(f"\n{'='*70}")
    lines.append(f"SIGNAL #{idx}: {s['signal_category']} ({s['signal_score']}/100)")
    lines.append(f"{'='*70}")
    lines.append(f"  Drug:     {s['drug']['name']} ({s['drug']['chembl_id']}) [{s['drug']['type']}]")
    lines.append(f"  Disease:  {s['disease']['name']}")
    lines.append(f"  Score:    {s['signal_score']}/100")
    lines.append(f"")
    lines.append(f"  Pathway:")
    lines.append(f"    {s['drug']['name']} --[{s['target']['action']}]--> {s['target']['symbol']} --(score={s['components']['target_disease_score']})--> {s['disease']['name']}")
    lines.append(f"")
    lines.append(f"  Components:")
    lines.append(f"    Target-disease score: {s['components']['target_disease_score']}")
    lines.append(f"    Action: {s['components']['action_type']} (confidence: {s['components']['action_confidence']})")
    lines.append(f"    Clinical stage: {s['components']['clinical_stage'] or 'None'}")
    lines.append(f"    Novelty: {s['components']['novelty']} (drug NOT indicated for this disease)")
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description='Drug Repurposing Signal Engine')
    parser.add_argument('--drug', type=str, help='Filter by drug name')
    parser.add_argument('--disease', type=str, help='Filter by disease name')
    parser.add_argument('--min-score', type=float, default=20, help='Minimum signal score')
    parser.add_argument('--top', type=int, default=20, help='Number of signals to show')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    args = parser.parse_args()

    print("="*70)
    print("DRUG REPURPOSING SIGNAL ENGINE")
    print("Computational Research Hypotheses - NOT Clinical Recommendations")
    print("="*70)

    signals = find_signals(
        drug_name=args.drug,
        disease_name=args.disease,
        min_score=args.min_score,
        limit=args.top,
    )

    if not signals:
        print("\nNo signals found matching criteria.")
        return

    print(f"\nFound {len(signals)} signals (min score: {args.min_score})")

    if args.json:
        print(json.dumps(signals, indent=2))
    else:
        for i, s in enumerate(signals, 1):
            print(format_signal(s, i))

    print(f"\n{'='*70}")
    print("DISCLAIMER: These are computational research hypotheses.")
    print("They are generated from public data and should NOT be used")
    print("for clinical decision-making.")
    print(f"{'='*70}")


if __name__ == '__main__':
    main()
