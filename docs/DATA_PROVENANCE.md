# Data Provenance

## Principle

Every record in the unified database retains its source identity. This enables explainability — when a user asks "why is this a signal?", we can trace back to the exact source evidence.

## Provenance Columns

Every junction and evidence table includes:

| Column | Purpose |
|--------|---------|
| `source` | Origin system (e.g., "Open Targets", "Europe PMC", "ClinicalTrials.gov") |
| `source_version` | Version of source data (e.g., "26.06") |
| `retrieved_at` | ISO 8601 timestamp of when data was fetched |

## Provenance by Table

### `drugs`
- Source: Open Targets `drug_molecule` dataset, version 26.06
- Original IDs preserved: `chembl_id` = Open Targets `id` field
- Cross-references stored: DrugBank IDs from `crossReferences`

### `diseases`
- Source: Open Targets `disease` dataset, version 26.06
- Original IDs preserved: `source_id` = EFO / MONDO / GO / Orphanet ID
- Ontology hierarchy preserved in `parent_ids`, `therapeutic_areas`

### `targets`
- Source: Open Targets `target` dataset, version 26.06
- Original IDs preserved: `ensembl_id` = Ensembl gene ID
- Cross-references stored: UniProt, HGNC, ChEMBL target IDs

### `drug_target`
- Source: Open Targets `drug_mechanism_of_action` dataset, version 26.06
- Links ChEMBL drug IDs → Ensembl target IDs
- Includes action type and mechanism text

### `drug_disease`
- Source: Open Targets `clinical_indication` dataset, version 26.06
- Direct drug-disease pairs from Open Targets
- Includes highest clinical stage achieved

### `target_disease`
- Source: Open Targets `evidence_clinical_precedence` dataset, version 26.06
- Aggregated from 872K evidence rows → 107K unique (target, disease) pairs
- Score = max score across all evidence for each pair

### `evidence`
- Source: Open Targets `evidence_clinical_precedence` dataset, version 26.06
- Full provenance per evidence record
- Links to publications via PubMed IDs
- Links to clinical reports

### `drug_warnings`
- Source: Open Targets `drug_warning` dataset, version 26.06
- Regulatory warnings (Black Box, Warning, Contraindication)
- Country-specific

### `clinical_reports`
- Source: Open Targets `clinical_report` dataset, version 26.06
- Drug labels, clinical trials, literature
- Links to source URLs

### `publications`
- Source: Europe PMC REST API (dynamic, fetched on demand)
- PubMed IDs linked from evidence records

## Rebuild Provenance

To rebuild the database from raw data:
```bash
python src/build_database.py
```

This reads from `data/raw/opentargets/` and writes to `data/unified/medbase.db`.

## Data Freshness

| Source | Version | Date |
|--------|---------|------|
| Open Targets | 26.06 | August 2026 |
| Europe PMC | Live API | On demand |
| ClinicalTrials.gov | v2 API | On demand |

## Adding New Sources

When new sources are added (e.g., ChEMBL, DrugBank), each must:
1. Document its source name and version
2. Include `source`, `source_version`, `retrieved_at` columns
3. Preserve original source identifiers
4. Log ingestion with metadata
