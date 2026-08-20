# Repurposing Signal Logic

## Definition

A **Computational Research Signal** exists when:

```
Drug A → targets → Protein X
    +
Protein X → associated with → Disease Y
    +
Drug A is NOT already strongly indicated for Disease Y
    +
Supporting evidence exists (score, clinical stage, publications)
```

## Signal Score Components

| Component | Weight | Source | Description |
|-----------|--------|--------|-------------|
| Target-Disease Score | 30% | `target_disease.score` | 0-1 strength of association |
| Clinical Precedent | 25% | `evidence.clinical_stage` | Phase 1-4 / Approval |
| Drug-Target Confidence | 15% | `drug_target.action_type` | INHIBITOR/AGONIST vs MODULATOR |
| Evidence Count | 15% | `evidence` table | Number of independent evidence records |
| Novelty | 15% | `drug_disease` absence | Strength of absence from approved indications |

### Clinical Stage Scores

| Stage | Score |
|-------|-------|
| APPROVAL | 1.0 |
| PHASE_4 | 0.8 |
| PHASE_3 | 0.6 |
| PHASE_2 | 0.4 |
| PHASE_1 | 0.2 |
| PHASE_0 | 0.1 |

### Action Type Confidence

| Action Type | Confidence |
|-------------|------------|
| INHIBITOR | 0.9 |
| ANTAGONIST | 0.9 |
| AGONIST | 0.8 |
| MODULATOR | 0.7 |
| BLOCKER | 0.8 |
| OTHER | 0.5 |

### Novelty Score

- Drug has NO approved indication for the disease: 1.0 (max novelty)
- Drug has Phase 2/3 but not approved: 0.6
- Drug has any clinical indication: 0.2

## Final Score Formula

```
signal_score = (
    td_score * 0.30 +
    clinical_score * 0.25 +
    action_confidence * 0.15 +
    evidence_count_score * 0.15 +
    novelty_score * 0.15
) * 100
```

Normalized to 0-100 scale.

## Signal Categories

| Score Range | Category | Label |
|-------------|----------|-------|
| 70-100 | High | STRONG SIGNAL — Multiple converging evidence lines |
| 40-69 | Medium | MODERATE SIGNAL — Promising but needs more evidence |
| 20-39 | Low | WEAK SIGNAL — Preliminary computational hypothesis |
| 0-19 | Very Low | INSUFFICIENT — Not enough evidence for hypothesis |

## Exclusion Rules

A signal is EXCLUDED if:
1. Drug is already approved for the disease (novelty = 0)
2. No target-disease association score exists
3. The evidence is exclusively from animal models with no human data

## Warning Overlay

If the drug has a Black Box Warning for the disease or related condition, the signal is flagged with a safety warning.

## Output Format

```json
{
    "drug": {
        "id": "DR:CHEMBL25",
        "name": "Aspirin",
        "max_stage": "APPROVAL"
    },
    "disease": {
        "id": "D:EFO_0000544",
        "name": "Breast Cancer"
    },
    "pathway": [
        {"from": "Aspirin", "relation": "targets", "to": "PTGS2", "evidence": "INHIBITOR"},
        {"from": "PTGS2", "relation": "associated_with", "to": "Breast Cancer", "score": 0.72}
    ],
    "signal_score": 62,
    "signal_category": "MODERATE SIGNAL",
    "components": {
        "target_disease_score": 0.72,
        "clinical_stage": "PHASE_3",
        "action_type": "INHIBITOR",
        "evidence_count": 5,
        "novelty": 1.0
    },
    "warnings": [],
    "disclaimer": "This is a computational research hypothesis. Not a clinical recommendation."
}
```
