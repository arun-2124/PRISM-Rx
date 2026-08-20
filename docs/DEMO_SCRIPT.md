# PRISM-Rx — 2–3 Minute Hackathon Demo Script

This document provides the step-by-step presentation walkthrough, exact user clicks, and scientific talking points for demonstrating the PRISM-Rx Biotech Arbitrage Engine.

---

## 1. Introduction & Problem Statement (0:00 – 0:30)

**Visual**: Open Platform Dashboard (`http://localhost:5173/`).

**Talking Points**:
* "Traditional drug discovery takes 10–15 years and over $2.6B per approved molecule."
* "PRISM-Rx is a Real-Time Biotech Arbitrage Engine designed to discover high-priority **drug repurposing signals** from public biomedical data."
* "Our engine operates an evidence-aware Knowledge Graph spanning **1.31 Million nodes** (drugs, diseases, gene targets, clinical trials) and **1.08 Million relationship edges** over SQLite `medbase.db`."

**Key Action**: Point out the KPI Metric Cards on the Dashboard:
* **1.31M Nodes**
* **1.08M Edges**
* **819,696 Evaluated Unindicated Candidate Pairs**
* **93,900 Strong Research Signals (Score ≥ 70)**

---

## 2. Signal Explorer & Filtering (0:30 – 1:15)

**Visual**: Click **`Signal Explorer`** in the top navigation bar (`/signals`).

**Talking Points**:
* "From 2.97 Million multi-hop graph paths ($Drug \rightarrow Target \rightarrow Disease$), we collapsed duplicate paths and excluded established indications, isolating **819K unique candidate pairs**."
* "Our engine ranks candidates using a transparent **0–100 Research Priority Score**."

**Key Actions**:
1. Drag the **Min Priority Score** slider to `60 / 100`.
2. Select **Category**: `STRONG SIGNAL (≥70)`.
3. Type **Drug Name**: `Tg100-801` in the search filter and click **Apply Filters**.
4. Point out the top candidate card: **`Tg100-801 → acute lymphoblastic leukemia`** (Score: **82 / 100**).

---

## 3. Deep-Dive Research View & Score Rationale (1:15 – 2:00)

**Visual**: Click **`[VIEW SIGNAL]`** on `Tg100-801 → acute lymphoblastic leukemia` (`/signals/DR:CHEMBL403989__D:MONDO_0004967`).

**Talking Points**:
* "Let's inspect the scientific hypothesis for **Tg100-801** in **acute lymphoblastic leukemia**."
* "Tg100-801 is a potent inhibitor of Src family tyrosine kinase **FGR**, which exhibits a strong target-disease association score (1.000) with leukemic proliferation."

**Key Actions**:
1. **Explain Score Components**: Point to the progress bars:
   * Target-Disease Association ($S_{TD}$): **30 / 30 pts**
   * Drug-Target Action ($S_{DT}$): **15 / 15 pts**
   * Clinical Precedence ($S_{Clin}$): **15 / 15 pts** (Phase 1 clinical precedence)
   * Source Diversity ($F_{Div}$): **10 / 10 pts** (Multi-source validated)
   * Novelty Bonus ($S_{Nov}$): **10 / 10 pts**
2. **Highlight Biological Path**:
   $$\text{Tg100-801} \xrightarrow{\text{INHIBITOR}} \text{FGR (Tyrosine-protein kinase)} \xrightarrow{\text{ASSOCIATED\_WITH (1.000)}} \text{acute lymphoblastic leukemia}$$

---

## 4. Interactive Knowledge Neighborhood & Evidence (2:00 – 2:30)

**Visual**: Scroll down to the **Interactive 2-Hop Knowledge Neighborhood Canvas**.

**Talking Points**:
* "Our interactive 2-hop local graph topology visualizes the exact biological neighborhood without overloading browser memory."

**Key Actions**:
1. Zoom and pan the HTML5 Canvas node graph.
2. Click on the **FGR** Target node (Emerald Green) to open the **Node Inspector Drawer**.
3. Point out the **Clinical Trials Table**: Show Phase 1 trial entries (`d0gp9q`).
4. Point out the **Safety Banner**: Highlight *"No warning record found in the current dataset snapshot"* disclaimer.

---

## 5. Report Export & Wrap-up (2:30 – 3:00)

**Visual**: Click **`Export CSV`** or **`Export JSON`** button in the header.

**Talking Points**:
* "Researchers and biotech analysts can export full provenance scorecards and evidence lineages as CSV or JSON in **under 1 millisecond**."
* "PRISM-Rx demonstrates that lightweight SQLite graph abstractions can deliver sub-second drug repurposing signals at scale with **< 5 ms API response times**."

**Key Action**: Open downloaded `PRISM_Rx_Research_Signals.csv` to show structured evidence fields.

---

## Summary Demo Checksheet

| Step | Page | Action | Expected Result |
| :--- | :--- | :--- | :--- |
| 1 | `/` Dashboard | Observe KPI Cards | 1.31M Nodes, 819K Pairs displayed |
| 2 | `/signals` Explorer | Filter `Tg100-801` | Candidate `Tg100-801 → acute lymphoblastic leukemia` appears |
| 3 | `/signals/:id` Details | Click `VIEW SIGNAL` | Score **82/100**, score progress bars visible |
| 4 | Graph Canvas | Click `FGR` node | Node inspector drawer displays target details |
| 5 | Header | Click `Export CSV` | `PRISM_Rx_Research_Signals.csv` downloaded |
