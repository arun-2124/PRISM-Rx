# PRISM-Rx Database Audit Report

**Database File**: `data/unified/medbase.db`
**File Size**: 545.35 MB
**Total Relational Tables**: 11

### Table: `drugs`
- **Record Count**: 22,407
- **Columns (12)**: `id, chembl_id, name, drug_type, max_clinical_stage, canonical_smiles, inchi_key, drugbank_ids, trade_names, parent_id, synonyms, created_at`

### Table: `diseases`
- **Record Count**: 47,080
- **Columns (9)**: `id, source_id, name, description, therapeutic_areas, parent_ids, exact_synonyms, is_therapeutic_area, created_at`

### Table: `targets`
- **Record Count**: 78,691
- **Columns (12)**: `id, ensembl_id, approved_symbol, approved_name, biotype, uniprot_ids, hgnc_id, chembl_target_id, target_class, subcellular_locations, function_descriptions, created_at`

### Table: `drug_target`
- **Record Count**: 14,655
- **Columns (7)**: `drug_id, target_id, action_type, mechanism_of_action, source, source_version, retrieved_at`

### Table: `drug_disease`
- **Record Count**: 86,468
- **Columns (6)**: `drug_id, disease_id, max_clinical_stage, source, source_version, retrieved_at`

### Table: `target_disease`
- **Record Count**: 107,593
- **Columns (6)**: `target_id, disease_id, score, source, source_version, retrieved_at`

### Table: `drug_warnings`
- **Record Count**: 3,039
- **Columns (10)**: `drug_id, warning_type, toxicity_class, country, description, efo_id, year, source, source_version, retrieved_at`

### Table: `clinical_reports`
- **Record Count**: 289,955
- **Columns (15)**: `id, report_type, source_name, clinical_stage, trial_phase, trial_status, trial_study_type, trial_primary_purpose, trial_number_of_arms, trial_start_date, url, has_expert_review, source, source_version, retrieved_at`

### Table: `publications`
- **Record Count**: 0
- **Columns (8)**: `id, pmid, title, authors, journal, publication_date, source, retrieved_at`

### Table: `evidence`
- **Record Count**: 872,619
- **Columns (14)**: `id, drug_id, target_id, disease_id, evidence_type, clinical_stage, score, direction_on_trait, direction_on_target, publication_ids, clinical_report_id, source, source_version, retrieved_at`

### Table: `entity_synonyms`
- **Record Count**: 479,742
- **Columns (4)**: `canonical_id, entity_type, synonym, source`

## Index Coverage (31 Indexes)

- `sqlite_autoindex_drugs_1` on table `drugs`
- `sqlite_autoindex_drugs_2` on table `drugs`
- `sqlite_autoindex_diseases_1` on table `diseases`
- `sqlite_autoindex_diseases_2` on table `diseases`
- `sqlite_autoindex_targets_1` on table `targets`
- `sqlite_autoindex_targets_2` on table `targets`
- `sqlite_autoindex_drug_target_1` on table `drug_target`
- `sqlite_autoindex_drug_disease_1` on table `drug_disease`
- `sqlite_autoindex_target_disease_1` on table `target_disease`
- `sqlite_autoindex_clinical_reports_1` on table `clinical_reports`
- `sqlite_autoindex_publications_1` on table `publications`
- `sqlite_autoindex_publications_2` on table `publications`
- `sqlite_autoindex_evidence_1` on table `evidence`
- `idx_drugs_chembl` on table `drugs`
- `idx_drugs_name` on table `drugs`
- `idx_diseases_source` on table `diseases`
- `idx_diseases_name` on table `diseases`
- `idx_targets_ensembl` on table `targets`
- `idx_targets_symbol` on table `targets`
- `idx_drug_target_drug` on table `drug_target`
- `idx_drug_target_target` on table `drug_target`
- `idx_drug_disease_drug` on table `drug_disease`
- `idx_drug_disease_disease` on table `drug_disease`
- `idx_target_disease_target` on table `target_disease`
- `idx_target_disease_disease` on table `target_disease`
- `idx_evidence_drug` on table `evidence`
- `idx_evidence_target` on table `evidence`
- `idx_evidence_disease` on table `evidence`
- `idx_entity_synonyms_canonical` on table `entity_synonyms`
- `idx_entity_synonyms_synonym` on table `entity_synonyms`
- `idx_clinical_reports_source` on table `clinical_reports`