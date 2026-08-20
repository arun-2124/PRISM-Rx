# Signal Intelligence Engine V2 — Scorecard & Scoring Reference

This document provides the exact scoring formulas, weights, evidence quality definitions, and safety penalty rules for **PRISM-Rx Signal Intelligence Engine V2**.

---

## 1. Mathematical Scoring Formula

The **Research Priority Score** ($S_{total} \in [0, 100]$) is computed as follows:

$$S_{total} = \text{Clamp}_{0}^{100}\left( S_{TD} + S_{DT} + S_{Clin} + S_{Lit} + F_{Div} + B_{Target} + S_{Nov} - P_{Safety} - P_{Contra} \right)$$

---

## 2. Dimension Weights & Scoring Matrix

| Dimension | Variable | Weight / Max Points | Calculation Rule |
| :--- | :--- | :---: | :--- |
| **Target-Disease Association** | $S_{TD}$ | **30.0 pts** | $\max(td\_score) \times 30.0$. Derived from Open Targets direct association score ($[0.0, 1.0]$). |
| **Drug-Target Action Confidence** | $S_{DT}$ | **15.0 pts** | Action confidence average $\times 15.0$. Inhibitor/Antagonist = 0.9, Agonist/Blocker = 0.8, Modulator = 0.7, Regulator = 0.6. |
| **Clinical Precedence & Stage** | $S_{Clin}$ | **15.0 pts** | Max trial phase from `clinical_reports`: Phase 4/Approved = 1.0 (15 pts), Phase 3 = 0.8 (12 pts), Phase 2 = 0.6 (9 pts), Phase 1 = 0.4 (6 pts), Preclinical/Unknown = 0.1 (1.5 pts). |
| **Literature & Evidence Quality** | $S_{Lit}$ | **10.0 pts** | High Quality Tier (10 pts) if $>50$ evidence rows or $>10$ PMIDs; Medium Tier (7 pts) if $>0$ evidence rows; Low Tier (4 pts) otherwise. |
| **Source Diversity Factor** | $F_{Div}$ | **10.0 pts** | $\min(1.0, N_{sources} / 4.0) \times 10.0$. Independent data sources counted across Open Targets, Europe PMC, ClinicalTrials.gov, UniProt. |
| **Multi-Target Support Bonus** | $B_{Target}$ | **10.0 pts** | Capped logarithmic bonus for multi-target hits: $\min(10.0, 5.0 \times \log_2(N_{targets}))$ if $N_{targets} > 1$, else 0. |
| **Under-Investigated Novelty** | $S_{Nov}$ | **10.0 pts** | $10.0$ for non-indicated drug pairs without active condition trials; $5.0$ if condition trials exist. |
| **Safety Warning Penalty** | $P_{Safety}$ | **-40.0 pts** | $-25.0$ pts per Black-box warning or Withdrawn status; $-10.0$ pts per general safety warning (capped at $-40.0$). |
| **Contradiction Penalty** | $P_{Contra}$ | **-30.0 pts** | $-15.0$ to $-30.0$ pts for conflicting target-disease mechanism or opposing trait direction. |

---

## 3. Evidence Quality Categories

| Tier | Definition | Examples / Data Fields |
| :--- | :--- | :--- |
| **HIGH** | Multiple independent sources with clinical trial precedence & high association score. | Target-disease score $> 0.5$, active trial in `clinical_reports`, $N_{sources} \ge 2$. |
| **MEDIUM** | Strong biological mechanism with literature evidence. | Valid action type (`INHIBITOR`), literature PMIDs present, single/double source. |
| **LOW** | Single-source association with limited mechanism data. | $N_{sources} = 1$, indirect target association. |
| **UNKNOWN** | Insufficient records or missing mechanism metadata. | Unclassified action type, score $< 0.1$. |

---

## 4. Signal Classification Categories & Thresholds

```text
Score >= 70.0 AND Safety Penalty == 0       -->  STRONG_RESEARCH_SIGNAL
40.0 <= Score < 70.0 AND Safety Penalty <= 10  -->  MODERATE_RESEARCH_SIGNAL
20.0 <= Score < 40.0                         -->  WEAK_RESEARCH_SIGNAL
Safety Penalty >= 25 OR Contradictions > 0  -->  CONTRADICTED
Score < 20.0                                -->  INSUFFICIENT_EVIDENCE
```

---

## 5. Important Scientific Disclaimer & Limitations

1. **Research Priority Only**: A high score indicates that a drug-disease pair has strong public data support for further laboratory investigation. It does **NOT** indicate clinical efficacy, safety, or regulatory approval.
2. **Database Boundary**: Scores reflect data available in `medbase.db` as of August 2026. "No warning in database" does **NOT** mean "safe."
