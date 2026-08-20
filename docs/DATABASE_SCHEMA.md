# Unified Database Schema

**Engine**: SQLite (MVP) — portable, zero-install, sufficient for hackathon prototype
**Migration target**: PostgreSQL for production

---

## Design Principles

1. **Normalized but not over-normalized** — join tables only where many-to-many requires it
2. **Preserve source IDs** — every entity keeps its Open Targets / ChEMBL / Ensembl ID
3. **Internal canonical IDs** — prefixed (`D:`, `T:`, `DR:`, `PUB:`) for clean referencing
4. **Provenance columns** on every evidence table — `source`, `source_version`, `retrieved_at`
5. **No aggressive fuzzy matching** — use existing cross-references from Open Targets

---

## Entity Tables

### `drugs`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | Canonical internal ID (`DR:CHEMBL25`) |
| chembl_id | TEXT UNIQUE | ChEMBL molecule ID |
| name | TEXT | Canonical drug name |
| drug_type | TEXT | Small molecule, Antibody, Protein, etc. |
| max_clinical_stage | TEXT | APPROVAL, PHASE_4, etc. |
| canonical_smiles | TEXT | SMILES (nullable) |
| inchi_key | TEXT | InChI key (nullable) |
| drugbank_ids | TEXT | Comma-separated DrugBank IDs |
| trade_names | TEXT | Comma-separated brand names |
| parent_id | TEXT | Parent molecule (nullable) |
| synonyms | TEXT | JSON array of synonyms |

### `diseases`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | Canonical internal ID (`D:EFO_0000544`) |
| source_id | TEXT UNIQUE | EFO / MONDO / GO / Orphanet ID |
| name | TEXT | Disease name |
| description | TEXT | Text description (nullable) |
| therapeutic_areas | TEXT | JSON array of TA IDs |
| parent_ids | TEXT | JSON array of parent ontology IDs |
| exact_synonyms | TEXT | JSON array |
| is_therapeutic_area | BOOLEAN | From ontology field |

### `targets`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | Canonical internal ID (`T:ENSG00000087085`) |
| ensembl_id | TEXT UNIQUE | Ensembl gene ID |
| approved_symbol | TEXT | Gene symbol (e.g., SRRT) |
| approved_name | TEXT | Full protein name |
| biotype | TEXT | protein_coding, etc. |
| uniprot_ids | TEXT | JSON array of UniProt accessions |
| hgnc_id | TEXT | HGNC identifier (nullable) |
| chembl_id | TEXT | ChEMBL target ID (nullable) |
| target_class | TEXT | JSON array of {id, label, level} |
| subcellular_locations | TEXT | JSON array |
| function_descriptions | TEXT | JSON array |

### `drug_target` (junction)
| Column | Type | Notes |
|--------|------|-------|
| drug_id | TEXT FK → drugs | |
| target_id | TEXT FK → targets | |
| action_type | TEXT | INHIBITOR, AGONIST, etc. |
| mechanism_of_action | TEXT | Description |
| source | TEXT | Open Targets |
| source_version | TEXT | 26.06 |
| retrieved_at | TEXT | ISO timestamp |
| PRIMARY KEY | (drug_id, target_id, action_type) | |

### `drug_disease` (junction — clinical indications)
| Column | Type | Notes |
|--------|------|-------|
| drug_id | TEXT FK → drugs | |
| disease_id | TEXT FK → diseases | |
| max_clinical_stage | TEXT | Highest stage for this pair |
| source | TEXT | Open Targets |
| source_version | TEXT | 26.06 |
| retrieved_at | TEXT | ISO timestamp |
| PRIMARY KEY | (drug_id, disease_id) | |

### `target_disease` (evidence associations)
| Column | Type | Notes |
|--------|------|-------|
| target_id | TEXT FK → targets | |
| disease_id | TEXT FK → diseases | |
| score | REAL | 0-1 association score |
| source | TEXT | Open Targets |
| source_version | TEXT | 26.06 |
| retrieved_at | TEXT | ISO timestamp |
| PRIMARY KEY | (target_id, disease_id) | |

### `drug_warnings`
| Column | Type | Notes |
|--------|------|-------|
| drug_id | TEXT FK → drugs | |
| warning_type | TEXT | Black Box Warning, etc. |
| toxicity_class | TEXT | (nullable) |
| country | TEXT | |
| description | TEXT | (nullable) |
| efo_id | TEXT | Disease association (nullable) |
| year | REAL | (nullable) |
| source | TEXT | Open Targets |
| source_version | TEXT | 26.06 |
| retrieved_at | TEXT | ISO timestamp |

### `clinical_reports`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID from Open Targets |
| report_type | TEXT | DRUG_LABEL, CLINICAL_TRIAL, etc. |
| source_name | TEXT | DailyMed, ClinicalTrials.gov, etc. |
| clinical_stage | TEXT | APPROVAL, PHASE_3, etc. |
| trial_phase | TEXT | (nullable) |
| trial_status | TEXT | COMPLETED, RECRUITING, etc. |
| trial_study_type | TEXT | INTERVENTIONAL, OBSERVATIONAL |
| trial_primary_purpose | TEXT | TREATMENT, etc. |
| trial_number_of_arms | REAL | (nullable) |
| trial_start_date | TEXT | (nullable) |
| url | TEXT | Source URL |
| has_expert_review | BOOLEAN | |
| source | TEXT | Open Targets |
| source_version | TEXT | 26.06 |
| retrieved_at | TEXT | ISO timestamp |

### `publications`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | PubMed ID (`PUB:26056183`) |
| pmid | TEXT UNIQUE | PubMed ID |
| title | TEXT | (fetched from Europe PMC) |
| authors | TEXT | (fetched from Europe PMC) |
| journal | TEXT | (fetched from Europe PMC) |
| publication_date | TEXT | (fetched from Europe PMC) |
| source | TEXT | Europe PMC |
| retrieved_at | TEXT | ISO timestamp |

### `evidence` (core evidence table)
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | Hash-based unique ID |
| drug_id | TEXT FK → drugs (nullable) | |
| target_id | TEXT FK → targets (nullable) | |
| disease_id | TEXT FK → diseases (nullable) | |
| evidence_type | TEXT | clinical, genetic, etc. |
| clinical_stage | TEXT | |
| score | REAL | |
| direction_on_trait | TEXT | protect, risk, etc. |
| direction_on_target | TEXT | LoF, GoF (nullable) |
| publication_ids | TEXT | JSON array of PubMed IDs |
| clinical_report_id | TEXT | (nullable) |
| source | TEXT | |
| source_version | TEXT | |
| retrieved_at | TEXT | ISO timestamp |

### `entity_synonyms`
| Column | Type | Notes |
|--------|------|-------|
| canonical_id | TEXT | FK to drugs/diseases/targets |
| entity_type | TEXT | drug, disease, target |
| synonym | TEXT | Alternative name |
| source | TEXT | Where synonym came from |

---

## Indexes

```sql
CREATE INDEX idx_drugs_chembl ON drugs(chembl_id);
CREATE INDEX idx_diseases_source ON diseases(source_id);
CREATE INDEX idx_targets_ensembl ON targets(ensembl_id);
CREATE INDEX idx_targets_symbol ON targets(approved_symbol);
CREATE INDEX idx_drug_target_drug ON drug_target(drug_id);
CREATE INDEX idx_drug_target_target ON drug_target(target_id);
CREATE INDEX idx_drug_disease_drug ON drug_disease(drug_id);
CREATE INDEX idx_drug_disease_disease ON drug_disease(disease_id);
CREATE INDEX idx_target_disease_target ON target_disease(target_id);
CREATE INDEX idx_target_disease_disease ON target_disease(disease_id);
CREATE INDEX idx_evidence_drug ON evidence(drug_id);
CREATE INDEX idx_evidence_target ON evidence(target_id);
CREATE INDEX idx_evidence_disease ON evidence(disease_id);
CREATE INDEX idx_clinical_reports_source ON clinical_reports(source_name);
```

---

## Row Count Estimates

| Table | Est. Rows | Source |
|-------|-----------|--------|
| drugs | ~22,000 | drug_molecule |
| diseases | ~47,000 | disease |
| targets | ~78,000 | target |
| drug_target | ~6,500 | drug_mechanism_of_action |
| drug_disease | ~86,000 | clinical_indication |
| target_disease | ~872,000 | evidence_clinical_precedence |
| drug_warnings | ~2,300 | drug_warning |
| clinical_reports | ~290,000 | clinical_report |
| publications | ~0 → growing | Europe PMC API |
| evidence | ~872,000 | evidence_clinical_precedence |
| entity_synonyms | ~200,000+ | All entity tables |
