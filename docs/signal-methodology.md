# PRISM-Rx Signal Detection Methodology & Scoring Specification

## 1. PRISM Research Priority Scoring Formula

The **PRISM Research Priority Score (0–100)** is computed across 9 transparent, dataset-grounded factors:

$$PRISM\_Score = S_{TD} + S_{DT} + S_{Clin} + S_{Lit} + F_{Div} + B_{Target} + S_{Nov} - P_{Safety} - P_{Contra}$$

| Factor Code | Factor Name | Max Score | Calculation Basis |
| :--- | :--- | :---: | :--- |
| $S_{TD}$ | Target-Disease Score | 30.0 pts | Max genetic association score across supporting pathways $\times 30.0$. |
| $S_{DT}$ | Drug-Target Score | 15.0 pts | Action type confidence (`INHIBITOR`: 15.0, `ANTAGONIST`: 13.5, `OTHER`: 9.0). |
| $S_{Clin}$ | Clinical Stage Score | 15.0 pts | Highest phase of drug (`PHASE_4`: 15.0, `PHASE_3`: 12.0, `PHASE_2`: 9.0, `PHASE_1`: 6.0). |
| $S_{Lit}$ | Literature Count | 10.0 pts | $\min(10.0, \text{literature\_count} \times 0.5)$. |
| $F_{Div}$ | Source Diversity | 10.0 pts | $\min(10.0, \text{source\_count} \times 2.5)$. |
| $B_{Target}$ | Multi-Target Bonus | 10.0 pts | 10.0 pts if drug targets $\ge 2$ distinct proteins in disease pathway. |
| $S_{Nov}$ | Novelty Score | 10.0 pts | Inverse indication score (higher if candidate is unindicated). |
| $P_{Safety}$ | Safety Penalty | -40.0 pts | $-\min(40.0, \text{warning\_count} \times 20.0)$ for Black Box warnings. |
| $P_{Contra}$ | Contradiction Penalty | -30.0 pts | Subtracted if contradictory preclinical or clinical studies are detected. |

## 2. Information Arbitrage (Opportunity Gap) Score

$$\text{Opportunity Gap} = \min\left(10.0, \frac{S_{TD} + S_{DT} + F_{Div}}{55.0} \times 10.0\right)$$

Measures cases where scientific evidence is high but formal indication development remains low.
