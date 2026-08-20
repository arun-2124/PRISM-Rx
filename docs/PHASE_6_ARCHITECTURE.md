# PRISM-Rx Application Architecture Specification (Phase 6)

## 1. Executive Summary

**PRISM-Rx** (*Real-Time Biotech Arbitrage Engine for Drug Repurposing Signals*) is a user-facing research intelligence web application. The application exposes the underlying 1.3M+ node Knowledge Graph and Signal Intelligence Engine V2 through a high-performance **FastAPI backend** and a modern, scientific **React + Vite single-page frontend application**.

---

## 2. System Architecture

```text
+-------------------------------------------------------------------------------+
|                       REACT + VITE FRONTEND (PORT 3000)                        |
|                                                                               |
|  [Dashboard]   [Signal Explorer]   [Signal Details]   [Search]   [Methodology]|
|  - Stat Cards  - Filter Sidebar    - Score Breakdown  - Search   - Limitations|
|  - Top Signals - Sortable Cards    - Interactive Graph- Partial  - Specs      |
+---------------------------------------+---------------------------------------+
                                        | HTTP REST API (JSON)
                                        v
+-------------------------------------------------------------------------------+
|                        FASTAPI BACKEND SERVICE (PORT 8000)                    |
|                                                                               |
|  /api/health       /api/stats        /api/signals       /api/signals/{id}     |
|  /api/drugs        /api/diseases     /api/targets       /api/graph/{id}       |
|  /api/evidence/{id}/api/clinical-trials/{id}            /api/export           |
+---------------------------------------+---------------------------------------+
                                        | Python In-Process Calls
                                        v
+-------------------------------------------------------------------------------+
|                SIGNAL INTELLIGENCE ENGINE V2 & KNOWLEDGE GRAPH                |
|                                                                               |
|  - SignalEngineV2 (Candidate Collapsing & Multi-Factor 0-100 Scoring)         |
|  - GraphTraversalEngine (1-hop, 2-hop Neighborhoods & Provenance Tracking)    |
+---------------------------------------+---------------------------------------+
                                        | Read-Only SQLite Queries (Indexed)
                                        v
+-------------------------------------------------------------------------------+
|                        UNIFIED SQLITE DATABASE (medbase.db)                   |
|                        545.35 MB | 2,002,249 Records | 10 Tables              |
+-------------------------------------------------------------------------------+
```

---

## 3. Backend API Contract (FastAPI)

The backend layer exposes 12 structured JSON REST endpoints:

| Endpoint | Method | Description & Parameters |
| :--- | :---: | :--- |
| `/api/health` | `GET` | System status, database file existence, record counts. |
| `/api/stats` | `GET` | Summary statistics (Node counts, edge counts, signal category breakdown). |
| `/api/signals` | `GET` | Main signal query endpoint. Query params: `drug`, `disease`, `target`, `category`, `min_score`, `max_score`, `clinical_only`, `min_evidence`, `limit` (default: 20), `offset` (default: 0), `sort_by` (`score`, `evidence`, `clinical`, `diversity`). |
| `/api/signals/{id}` | `GET` | Unique candidate signal details payload by `drug_id` and `disease_id` slug (e.g. `DR:CHEMBL403989__D:MONDO_0004967`). |
| `/api/graph/{id}` | `GET` | Interactive 2-hop neighborhood graph topology (nodes, edges, positions) for selected signal. |
| `/api/clinical-trials/{id}`| `GET` | Detailed clinical trial reports linked to candidate drug. |
| `/api/evidence/{id}` | `GET` | Granular literature and target-disease association evidence records. |
| `/api/drugs` | `GET` | Paginated drug directory with search. |
| `/api/drugs/{id}` | `GET` | Specific drug entity profile and known indications. |
| `/api/diseases` | `GET` | Paginated disease directory with search. |
| `/api/diseases/{id}` | `GET` | Specific disease entity profile and associated targets. |
| `/api/export` | `GET` | Export signals as formatted JSON or downloadable CSV file. |

### JSON Signal Detail Response Structure
```json
{
  "signal_id": "DR:CHEMBL403989__D:MONDO_0004967",
  "drug": {
    "id": "DR:CHEMBL403989",
    "name": "Tg100-801",
    "chembl_id": "CHEMBL403989",
    "type": "Small molecule",
    "max_stage": "PHASE_1"
  },
  "disease": {
    "id": "D:MONDO_0004967",
    "name": "acute lymphoblastic leukemia",
    "source_id": "MONDO_0004967"
  },
  "research_priority_score": 66.0,
  "category": "MODERATE_RESEARCH_SIGNAL",
  "supporting_paths": [
    {
      "target": {"id": "T:ENSG00000000938", "symbol": "FGR", "name": "FGR proto-oncogene"},
      "action_type": "INHIBITOR",
      "mechanism": "SRC inhibitor",
      "target_disease_score": 1.0,
      "source": "Open Targets"
    }
  ],
  "score_components": {
    "target_disease_pts": 30.0,
    "drug_target_pts": 13.5,
    "clinical_pts": 6.0,
    "literature_pts": 7.0,
    "source_diversity_pts": 5.0,
    "multi_target_bonus_pts": 0.0,
    "novelty_pts": 4.5,
    "safety_penalty": 0.0,
    "contradiction_penalty": 0.0
  },
  "explanation": "Candidate 'Tg100-801' is prioritized for 'acute lymphoblastic leukemia'...",
  "limitations": [
    "Computational hypothesis generated from public datasets.",
    "Does NOT constitute medical recommendations or clinical efficacy prediction."
  ]
}
```

---

## 4. Frontend Application Architecture (React + Vite)

* **Stack**: React 18, Vite, Lucide-React Icons, Vanilla CSS Design System.
* **Color Palette**: Modern dark mode biotech aesthetic (`#0b0f19` dark canvas, `#131b2e` card surface, `#00f2fe` neon cyan accents, `#9d4edd` violet highlights, `#10b981` emerald success badges, `#ef4444` rose warning badges).
* **Interactive Graph Visualization**: Custom HTML5 Canvas / SVG 2-hop interactive force graph rendering nodes (Drug, Target, Disease, Clinical Trial) with drag, zoom, hover tooltips, and click-to-inspect attributes.

---

## 5. Main Application Pages & User Flow

1. **Dashboard (`/`)**: High-level platform KPIs (1.3M Nodes, 1.0M Edges, 819K Candidate Pairs), category distribution pie/bar chart, and Top 5 Research Signals showcase.
2. **Signal Explorer (`/signals`)**: Search bar, multi-attribute filter sidebar (Score slider, Category select, Clinical filter, Target filter, Source filter), sort control, and responsive signal cards.
3. **Signal Details View (`/signals/:id`)**: Deep-dive page featuring score breakdown progress bars, interactive 2-hop graph neighborhood, chronological evidence timeline, clinical trials drawer, safety warning banner, and JSON/CSV export actions.
4. **Global Search (`/search`)**: Real-time auto-complete partial matching across Drugs, Diseases, and Targets.
5. **Methodology & Limitations (`/about`)**: Full scientific transparency page documenting data sources, knowledge graph construction, scoring weights, safety penalties, and explicit research disclaimers.

---

## 6. Hackathon Demo Flow (2–3 Minutes)

1. **Overview (Dashboard)**: Highlight 1.3M Knowledge Graph nodes and 819,696 evaluated repurposing candidates.
2. **Search / Filter (Signal Explorer)**: Filter by `STRONG_RESEARCH_SIGNAL` and minimum score $\ge 60$.
3. **Select Signal (Signal Details)**: Select `Tg100-801 -> acute lymphoblastic leukemia`.
4. **Inspect Biological Path & Interactive Graph**: Drag and inspect the 2-hop Drug $\to$ Target (FGR) $\to$ Disease graph topology.
5. **Review Score Breakdown**: Demonstrate the transparent 100-point multi-factor breakdown ($S_{TD}$, $S_{DT}$, $S_{Clin}$, $S_{Lit}$, $F_{Div}$, $B_{Target}$, $S_{Nov}$).
6. **Examine Clinical & Safety Evidence**: Verify Phase 1 trial information and safety warnings.
7. **Export Hypothesis**: Export candidate research report as CSV / JSON.
