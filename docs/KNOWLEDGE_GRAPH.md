# Biomedical Knowledge Graph Architecture & Specification

## 1. Executive Summary

This document defines the logical and physical Knowledge Graph (KG) architecture for **PRISM-Rx**. The Knowledge Graph is implemented as an evidence-aware graph abstraction directly over the normalized SQLite relational database (`medbase.db`).

The graph models biological entities (Drugs, Targets, Diseases, Clinical Trials, Publications, Evidence, Mechanisms) and explicit directional relationships between them with complete provenance tracking and evidence support classification (`SUPPORTS`, `CONTRADICTS`, `UNKNOWN`).

---

## 2. Relational-to-Graph Mapping Matrix

| Node / Edge Type | Entity/Relationship | Source Table | Primary Identifier / Join Key | Key Attributes / Metadata |
| :--- | :--- | :--- | :--- | :--- |
| **Node** | `Drug` | `drugs` | `id` (`DR:CHEMBL...`) | `name`, `chembl_id`, `drug_type`, `max_clinical_stage`, `trade_names`, `smiles` |
| **Node** | `Target` | `targets` | `id` (`T:ENSG...`) | `approved_symbol`, `approved_name`, `target_class`, `uniprot_ids` |
| **Node** | `Disease` | `diseases` | `id` (`D:EFO...`, `D:MONDO...`) | `name`, `description`, `therapeutic_areas`, `is_therapeutic_area` |
| **Node** | `ClinicalTrial` | `clinical_reports` | `id` (`NCT...`, `INT...`) | `source_name`, `trial_phase`, `trial_overall_status`, `url` |
| **Node** | `Publication` | Extracted from `evidence` | `pmid` / `publication_id` | `title`, `authors`, `journal`, `publication_date` |
| **Node** | `Evidence` | `evidence` | `id` | `evidence_type`, `clinical_stage`, `score`, `direction_on_trait` |
| **Node** | `Mechanism` | `drug_target` | `mechanism_of_action` string | `mechanism_of_action`, `action_type` |
| **Edge** | `TARGETS` | `drug_target` | `(drug_id, target_id)` | `action_type`, `mechanism_of_action`, `source`, `source_version` |
| **Edge** | `ASSOCIATED_WITH`| `target_disease` | `(target_id, disease_id)` | `score`, `source`, `source_version`, `retrieved_at` |
| **Edge** | `INDICATED_FOR` | `drug_disease` | `(drug_id, disease_id)` | `max_clinical_stage`, `source`, `source_version` |
| **Edge** | `STUDIED_IN` | `evidence` $\to$ `clinical_reports` | `(drug_id, clinical_report_id)` | `clinical_stage`, `score`, `source` |
| **Edge** | `MENTIONED_IN` | `evidence` $\to$ `publications` | `(entity_id, publication_id)` | `literature_ids`, `evidence_type`, `score` |
| **Edge** | `HAS_MECHANISM` | `drug_target` | `(drug_id, mechanism)` | `action_type`, `source` |
| **Edge** | `SUPPORTED_BY` | `evidence` | `(relationship_id, evidence_id)` | `evidence_type`, `score`, `direction_on_trait` |
| **Edge** | `CONTRADICTED_BY` | `drug_warnings` | `(drug_id, warning_id)` | `warning_type`, `toxicity_class`, `efo_id`, `description` |

---

## 3. Evidence & Provenance Metadata Model

Every edge in the knowledge graph carries mandatory metadata fields to preserve lineage and enable confidence-weighted reasoning:

```json
{
  "source": "Open Targets",
  "source_id": "CHEMBL1201583",
  "dataset_version": "26.06",
  "retrieved_at": "2026-08-20T04:16:13.515591+00:00",
  "confidence_score": 0.9,
  "evidence_type": "clinical_precedence",
  "support_status": "SUPPORTS"
}
```

### Evidence Support Classification (`SUPPORTS` | `CONTRADICTS` | `UNKNOWN`)
- **`SUPPORTS`**: Positive target-disease association scores (> 0.0) or active therapeutic indications without safety warnings.
- **`CONTRADICTS`**: Presence of black-box warnings (`drug_warnings`), withdrawn status, or negative direction on trait (`direction_on_trait == 'decreased'`).
- **`UNKNOWN`**: Insufficient experimental data or conflicting literature reports.

---

## 4. Architectural Evaluation: SQLite Relational Graph vs. Neo4j

Before introducing Neo4j, we evaluated both options against key engineering parameters:

| Criteria | Option A: SQLite Graph Abstraction (Selected) | Option B: Dedicated Neo4j Knowledge Graph |
| :--- | :--- | :--- |
| **Development Complexity** | **Low**: Pure Python abstraction over `sqlite3` without new infrastructure. | **High**: Requires Cypher queries, Docker/Java runtime, APOC plugins, OGM mappings. |
| **Query Performance** | **Sub-50ms**: Indexed multi-hop joins (`JOIN` across indexed primary keys) run in under 2 seconds. | **Sub-20ms**: Native pointer hopping is slightly faster, but transfer overhead offsets gains. |
| **Visualization** | **Simple & Direct**: Custom ASCII tree/path renderer and lightweight JSON outputs. | **Rich UI**: Neo4j Browser / Bloom visualization out-of-the-box. |
| **Hackathon Demo Value** | **High**: Zero-dependency executable package running locally instantly. | **Medium**: Requires running Docker service & setup scripts on target machines. |
| **Deployment Difficulty** | **Zero Deployment**: Single `.db` file (545 MB) bundled directly. | **Complex**: Server container management, database backups, memory tuning. |
| **Memory Footprint** | **Minimal (~50 MB RAM)**: Disk-backed SQLite with indexed page caching. | **Heavy (2GB+ RAM)**: Java Heap + JVM overhead. |

### Decision
**Option A (SQLite Graph Abstraction)** is selected for Phase 4 MVP. It provides sub-second multi-hop graph traversals, zero deployment overhead, and full evidence lineage capabilities while remaining completely self-contained.

---

## 5. Example Graph Paths

### Path 1: Candidate Repurposing Signal (Drug $\to$ Target $\to$ Disease)
```text
Drug: Tg100-801 (DR:CHEMBL403989)
  │
  │ [TARGETS] (Action: INHIBITOR, Source: Open Targets 26.06)
  ↓
Target: FGR (T:ENSG00000000930)
  │
  │ [ASSOCIATED_WITH] (Score: 1.000, Evidence: Clinical Precedence)
  ↓
Disease: acute lymphoblastic leukemia (D:EFO_0000220)

Indication Check: NO EXISTING INDICATION (Novel Candidate Signal)
```

### Path 2: Clinical Trial Evidence Chain
```text
Drug: Ilorasertib (DR:CHEMBL1980297)
  │
  ├── [TARGETS] ──→ Target: FGR (T:ENSG00000000930) ──→ [ASSOCIATED_WITH] ──→ Disease: acute lymphoblastic leukemia
  │
  └── [STUDIED_IN] ──→ ClinicalTrial: NCT00824421 (Phase 1, Overall Status: COMPLETED)
```
