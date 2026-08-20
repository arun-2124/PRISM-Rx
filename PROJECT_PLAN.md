# Real-Time Biotech Arbitrage Engine for Drug Repurposing Signals

## Project Goal

Build a hackathon prototype that integrates multiple public biomedical data sources into a unified evidence layer, continuously detects new or overlooked relationships between drugs, targets, genes, pathways and diseases, and ranks them as explainable drug-repurposing research signals.

**This system generates research hypotheses, NOT medical recommendations.**

---

## Current State

- **Directory**: `D:\medbase` (empty, no git repo)
- **Platform**: Windows, PowerShell
- **Date**: August 2026

---

## Phase 1 - Research and Planning (Current)

### Data Sources Confirmed

| Source | Method | Format | License | Status |
|--------|--------|--------|---------|--------|
| Open Targets 26.06 | HTTPS download (Parquet) | Parquet | CC BY 4.0 | Researched |
| ChEMBL 37 | HTTPS download (SQLite) | SQLite (~1.7GB) | CC BY-SA 3.0 | Researched |
| Europe PMC | REST API (JSON) | JSON | Free API | Researched |
| ClinicalTrials.gov | v2 REST API (JSON) | JSON | Public domain | Researched |
| UniProt | REST API (JSON) | JSON | CC BY 4.0 | Researched |

### Windows Download Strategy (No rsync Required)

**Open Targets**: Use Python + `requests` to download from HTTPS:
```
https://ftp.ebi.ac.uk/pub/databases/opentargets/platform/26.06/output/
```
All datasets are Parquet files. Read with `pandas.read_parquet()` + `pyarrow`.

**ChEMBL**: Download SQLite dump via HTTPS:
```
https://ftp.ebi.ac.uk/pub/databases/chembl/ChEMBLdb/latest/chembl_37_sqlite.tar.gz
```

**ClinicalTrials.gov**: Use v2 API:
```
https://clinicaltrials.gov/api/v2/studies
```

**Europe PMC**: Use REST API:
```
https://www.ebi.ac.uk/europepmc/webservices/rest/search
```

**UniProt**: Use REST API:
```
https://rest.uniprot.org/
```

---

## Phase 2 - Data Ingestion

### Selected Open Targets Datasets (MVP)

These are the datasets we actually need (not everything):

| Dataset | Why | Est. Size |
|---------|-----|-----------|
| `disease` | Disease ontology | Small |
| `target` | Gene/protein targets | Small |
| `drug_molecule` | Drug information | Small |
| `drug_mechanism_of_action` | Drug-target relationships | Small |
| `clinical_indication` | Drug-disease clinical links | Small |
| `clinical_report` | Clinical evidence | Medium |
| `clinical_target` | Clinical target evidence | Medium |
| `drug_warning` | Safety signals | Small |
| `evidence_clinical_precedence` | Repurposing evidence | Medium |
| `association_overall_direct` | Overall target-disease associations | Large |

**Strategy**: Download only these 10 datasets, not the full 55+ datasets.

### ChEMBL (SQLite)

Download the SQLite dump. Extract only:
- `molecule` table (drugs/compounds)
- `target` table (drug targets)
- `mechanism_of_action` table
- `molecule_synonym` table
- `component_synonym` table

This avoids loading the full 35GB PostgreSQL dump.

### Europe PMC API

- Search for recent publications mentioning specific drugs/diseases
- Retrieve metadata and text-mined annotations
- API: `GET https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=...&resultType=core&format=json`

### ClinicalTrials.gov v2 API

- Search by drug name or condition
- API: `GET https://clinicaltrials.gov/api/v2/studies?query.term=...`

### UniProt REST API

- Retrieve protein/gene cross-references
- API: `GET https://rest.uniprot.org/uniprotkb/...`

---

## Phase 3 - Entity Normalization

Build normalization tables for:
- **Drugs**: Map between ChEMBL IDs, Open Targets IDs, drug names
- **Targets**: Map between UniProt IDs, Ensembl IDs, gene symbols
- **Diseases**: Map between EFO IDs, MONDO IDs, ORPHA codes, disease names
- **Publications**: PubMed IDs, Europe PMC IDs
- **Clinical Trials**: NCT IDs

Use authoritative cross-references, not fuzzy matching.

---

## Phase 4 - Unified Database

PostgreSQL with the following entity tables:
- `drug`
- `target`
- `disease`
- `publication`
- `clinical_trial`
- `evidence` (links all entities)

---

## Phase 5 - Knowledge Graph

Graph relationships in PostgreSQL (relational representation):
- Drug -> TARGETS -> Protein/Target
- Target -> INVOLVED_IN -> Pathway
- Drug -> STUDIED_IN -> Disease
- Drug -> TESTED_IN -> ClinicalTrial
- Publication -> REPORTS -> DrugTarget/Disease relationship
- Evidence -> SUPPORTS/CONTRADICTS -> Relationship

---

## Phase 6 - Signal Engine

### Signal Detection Logic

```
New evidence arrives
  -> Extract entities (drug, target, disease)
  -> Check if Drug->Target relationship exists
  -> Check if Target->Disease relationship exists
  -> If both exist but Drug->Disease is NOT well-established
     -> FLAG as potential repurposing signal
  -> Score based on:
     - Evidence count
     - Recency
     - Novelty (how under-investigated)
     - Biological plausibility
     - Clinical trial presence
     - Contradictory evidence
     - Source reliability
```

### Score Components

| Factor | Weight | Description |
|--------|--------|-------------|
| Evidence Count | 25% | How many evidence sources support |
| Recency | 20% | How recent is the evidence |
| Novelty | 20% | How under-investigated the relationship is |
| Biological Plausibility | 15% | Drug-target-pathway-disease chain makes sense |
| Clinical Evidence | 10% | Clinical trials exist |
| Contradiction Penalty | -10% | Negative/contradictory evidence |

**Clearly labeled as computational prioritization, NOT medical validation.**

---

## Phase 7 - Dashboard

FastAPI backend + Simple frontend showing:
- Signal list with scores
- Evidence detail for each signal
- Drug/disease/target profiles
- Publication links
- Clinical trial status
- Timeline view

---

## Phase 8 - Demo

End-to-end demonstration:
1. Show data ingestion running
2. Show entity normalization
3. Show knowledge graph
4. Show signal detection
5. Show explainable dashboard

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Language | Python 3.x |
| Backend | FastAPI |
| Database | PostgreSQL |
| Data Processing | pandas + pyarrow |
| NLP | SciSpaCy (biomedical) |
| Frontend | React or simple HTML |
| Parquet Reading | pyarrow/pandas |
| API Server | uvicorn |

---

## MVP Scope

Target manageable demonstration:
- 10-20 diseases (oncology + inflammatory + rare diseases)
- 200-500 drugs
- Relevant targets for those drugs
- Recent publications (last 2-5 years)
- Clinical trial evidence

---

## Safety Principles

The system must NOT:
- Recommend medication to patients
- Give treatment instructions
- Claim clinical efficacy
- Present computational predictions as medical facts

Use language like:
- "Potential research signal"
- "Computational hypothesis"
- "Evidence suggests"
- "Requires further validation"

---

## Development Priority

```
Research first -> Architecture second -> Small dataset proof-of-concept third -> 
Unified database fourth -> Signal engine fifth -> Dashboard sixth
```

Optimize for a **working, explainable, scientifically defensible hackathon prototype**.
