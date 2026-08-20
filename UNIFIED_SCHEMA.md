# Unified Biomedical Data Model

## Overview
This schema defines the normalized data model for the Biotech Arbitrage Engine. All entities use canonical identifiers with source cross-references preserved.

---

## Entity Tables

### 1. drug

```sql
CREATE TABLE drug (
    internal_id SERIAL PRIMARY KEY,
    canonical_name TEXT NOT NULL,
    chembl_id TEXT UNIQUE,           -- e.g., CHEMBL25
    opentargets_id TEXT UNIQUE,      -- e.g., CHEMBL25 (Open Targets uses ChEMBL IDs for drugs)
    pubchem_cid INTEGER,             -- PubChem Compound ID
    drugbank_id TEXT,                -- DrugBank ID (if available)
    modality TEXT,                   -- e.g., small_molecule, antibody, etc.
    max_clinical_phase FLOAT,       -- Highest clinical trial phase
    is_approved BOOLEAN DEFAULT FALSE,
    source TEXT NOT NULL,            -- Primary source
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_drug_chembl ON drug(chembl_id);
CREATE INDEX idx_drug_name ON drug(canonical_name);
```

### 2. target

```sql
CREATE TABLE target (
    internal_id SERIAL PRIMARY KEY,
    gene_symbol TEXT NOT NULL,        -- e.g., BRCA1
    protein_name TEXT,
    ensembl_id TEXT UNIQUE,           -- e.g., ENSG00000012048
    uniprot_id TEXT UNIQUE,           -- e.g., P38398
    uniprot_accession TEXT,
    target_type TEXT,                 -- e.g., SINGLE_PROTEIN, PROTEIN_FAMILY
    organism TEXT DEFAULT 'Homo sapiens',
    source TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_target_gene ON target(gene_symbol);
CREATE INDEX idx_target_uniprot ON target(uniprot_id);
CREATE INDEX idx_target_ensembl ON target(ensembl_id);
```

### 3. disease

```sql
CREATE TABLE disease (
    internal_id SERIAL PRIMARY KEY,
    canonical_name TEXT NOT NULL,
    efo_id TEXT,                      -- e.g., EFO_0000616
    mondo_id TEXT,                    -- e.g., MONDO_0007848
    orpha_code TEXT,                  -- e.g., ORPHA:1234
    ontology_id TEXT,                 -- Primary ontology ID
    description TEXT,
    disease_class TEXT,               -- e.g., oncology, inflammatory
    source TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_disease_name ON disease(canonical_name);
CREATE INDEX idx_disease_efo ON disease(efo_id);
CREATE INDEX idx_disease_mondo ON disease(mondo_id);
```

### 4. publication

```sql
CREATE TABLE publication (
    internal_id SERIAL PRIMARY KEY,
    pmid TEXT UNIQUE,                 -- PubMed ID
    europepmc_id TEXT,                -- Europe PMC ID
    title TEXT,
    abstract TEXT,
    publication_date DATE,
    authors TEXT[],
    journal TEXT,
    doi TEXT,
    is_open_access BOOLEAN DEFAULT FALSE,
    source TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pub_pmid ON publication(pmid);
CREATE INDEX idx_pub_date ON publication(publication_date);
```

### 5. clinical_trial

```sql
CREATE TABLE clinical_trial (
    internal_id SERIAL PRIMARY KEY,
    nct_id TEXT UNIQUE NOT NULL,      -- ClinicalTrials.gov ID
    title TEXT,
    brief_summary TEXT,
    phase TEXT,                       -- e.g., PHASE1, PHASE2, PHASE3
    status TEXT,                      -- e.g., RECRUITING, COMPLETED
    study_type TEXT,                  -- INTERVENTIONAL or OBSERVATIONAL
    start_date DATE,
    completion_date DATE,
    enrollment_count INTEGER,
    source TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trial_nct ON clinical_trial(nct_id);
CREATE INDEX idx_trial_status ON clinical_trial(status);
```

---

## Relationship Tables

### 6. drug_target

```sql
CREATE TABLE drug_target (
    id SERIAL PRIMARY KEY,
    drug_internal_id INTEGER REFERENCES drug(internal_id),
    target_internal_id INTEGER REFERENCES target(internal_id),
    mechanism_of_action TEXT,        -- e.g., "inhibitor", "agonist"
    action_type TEXT,                 -- e.g., "INHIBITOR", "AGONIST"
    evidence_source TEXT,
    evidence_type TEXT,               -- e.g., "experimental", "clinical"
    confidence FLOAT,                 -- 0-1 score
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(drug_internal_id, target_internal_id, action_type)
);

CREATE INDEX idx_dt_drug ON drug_target(drug_internal_id);
CREATE INDEX idx_dt_target ON drug_target(target_internal_id);
```

### 7. target_disease

```sql
CREATE TABLE target_disease (
    id SERIAL PRIMARY KEY,
    target_internal_id INTEGER REFERENCES target(internal_id),
    disease_internal_id INTEGER REFERENCES disease(internal_id),
    association_score FLOAT,         -- Overall association score
    evidence_source TEXT,
    evidence_type TEXT,               -- e.g., "genetic", "literature"
    confidence FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(target_internal_id, disease_internal_id)
);

CREATE INDEX idx_td_target ON target_disease(target_internal_id);
CREATE INDEX idx_td_disease ON target_disease(disease_internal_id);
```

### 8. drug_disease

```sql
CREATE TABLE drug_disease (
    id SERIAL PRIMARY KEY,
    drug_internal_id INTEGER REFERENCES drug(internal_id),
    disease_internal_id INTEGER REFERENCES disease(internal_id),
    relationship_type TEXT,           -- e.g., "indication", "investigational"
    evidence_source TEXT,
    evidence_type TEXT,
    confidence FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(drug_internal_id, disease_internal_id)
);

CREATE INDEX idx_dd_drug ON drug_disease(drug_internal_id);
CREATE INDEX idx_dd_disease ON drug_disease(disease_internal_id);
```

### 9. drug_trial

```sql
CREATE TABLE drug_trial (
    id SERIAL PRIMARY KEY,
    drug_internal_id INTEGER REFERENCES drug(internal_id),
    trial_internal_id INTEGER REFERENCES clinical_trial(internal_id),
    role TEXT,                        -- e.g., "intervention", "comparator"
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(drug_internal_id, trial_internal_id)
);
```

### 10. publication_drug

```sql
CREATE TABLE publication_drug (
    id SERIAL PRIMARY KEY,
    publication_internal_id INTEGER REFERENCES publication(internal_id),
    drug_internal_id INTEGER REFERENCES drug(internal_id),
    relationship_type TEXT,           -- e.g., "mentions", "studied"
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 11. publication_target

```sql
CREATE TABLE publication_target (
    id SERIAL PRIMARY KEY,
    publication_internal_id INTEGER REFERENCES publication(internal_id),
    target_internal_id INTEGER REFERENCES target(internal_id),
    relationship_type TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 12. publication_disease

```sql
CREATE TABLE publication_disease (
    id SERIAL PRIMARY KEY,
    publication_internal_id INTEGER REFERENCES publication(internal_id),
    disease_internal_id INTEGER REFERENCES disease(internal_id),
    relationship_type TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Evidence Tables

### 13. evidence

```sql
CREATE TABLE evidence (
    evidence_id SERIAL PRIMARY KEY,
    source TEXT NOT NULL,             -- e.g., "opentargets", "chembl", "europepmc"
    source_evidence_id TEXT,          -- Original source ID
    drug_internal_id INTEGER REFERENCES drug(internal_id),
    target_internal_id INTEGER REFERENCES target(internal_id),
    disease_internal_id INTEGER REFERENCES disease(internal_id),
    publication_internal_id INTEGER REFERENCES publication(internal_id),
    trial_internal_id INTEGER REFERENCES clinical_trial(internal_id),
    evidence_type TEXT NOT NULL,      -- e.g., "experimental", "genetic", "clinical"
    evidence_direction TEXT,          -- "supports" or "contradicts"
    confidence FLOAT,
    evidence_date DATE,
    metadata JSONB,                   -- Additional source-specific data
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ev_drug ON evidence(drug_internal_id);
CREATE INDEX idx_ev_target ON evidence(target_internal_id);
CREATE INDEX idx_ev_disease ON evidence(disease_internal_id);
CREATE INDEX idx_ev_source ON evidence(source);
CREATE INDEX idx_ev_type ON evidence(evidence_type);
```

---

## Signal Tables

### 14. repurposing_signal

```sql
CREATE TABLE repurposing_signal (
    signal_id SERIAL PRIMARY KEY,
    drug_internal_id INTEGER REFERENCES drug(internal_id),
    disease_internal_id INTEGER REFERENCES disease(internal_id),
    signal_score FLOAT NOT NULL,      -- 0-100
    evidence_score FLOAT,
    recency_score FLOAT,
    novelty_score FLOAT,
    plausibility_score FLOAT,
    clinical_score FLOAT,
    contradiction_penalty FLOAT,
    signal_type TEXT,                 -- "novel", "supporting", "contradictory"
    explanation TEXT,                 -- Human-readable explanation
    is_active BOOLEAN DEFAULT TRUE,
    first_detected DATE,
    last_updated DATE DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sig_drug ON repurposing_signal(drug_internal_id);
CREATE INDEX idx_sig_disease ON repurposing_signal(disease_internal_id);
CREATE INDEX idx_sig_score ON repurposing_signal(signal_score DESC);
```

### 15. signal_evidence

```sql
CREATE TABLE signal_evidence (
    id SERIAL PRIMARY KEY,
    signal_id INTEGER REFERENCES repurposing_signal(signal_id),
    evidence_id INTEGER REFERENCES evidence(evidence_id),
    contribution_to_score FLOAT,     -- How much this evidence contributed
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Entity Normalization Tables

### 16. drug_synonym

```sql
CREATE TABLE drug_synonym (
    id SERIAL PRIMARY KEY,
    drug_internal_id INTEGER REFERENCES drug(internal_id),
    synonym TEXT NOT NULL,
    synonym_type TEXT,               -- "trade_name", "generic", "abbreviation"
    source TEXT
);
```

### 17. target_synonym

```sql
CREATE TABLE target_synonym (
    id SERIAL PRIMARY KEY,
    target_internal_id INTEGER REFERENCES target(internal_id),
    synonym TEXT NOT NULL,
    synonym_type TEXT,               -- "alias", "previous_symbol"
    source TEXT
);
```

### 18. disease_synonym

```sql
CREATE TABLE disease_synonym (
    id SERIAL PRIMARY KEY,
    disease_internal_id INTEGER REFERENCES disease(internal_id),
    synonym TEXT NOT NULL,
    synonym_type TEXT,
    source TEXT
);
```

---

## Logging Table

### 19. ingestion_log

```sql
CREATE TABLE ingestion_log (
    id SERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    dataset_name TEXT,
    source_version TEXT,
    download_url TEXT,
    download_date TIMESTAMP,
    file_name TEXT,
    file_size_bytes BIGINT,
    status TEXT,                      -- "success", "failed", "partial"
    error_message TEXT,
    processing_start TIMESTAMP,
    processing_end TIMESTAMP,
    records_processed INTEGER,
    records_inserted INTEGER,
    records_updated INTEGER,
    records_failed INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Key Design Decisions

1. **Separate raw and processed data**: Raw downloads stay in `data/raw/`, processed in `data/processed/`, unified in `data/unified/`
2. **Preserve source identifiers**: Every entity keeps its original source IDs as metadata
3. **Use internal_ids for relationships**: Foreign keys use internal database IDs, not source-specific IDs
4. **JSONB for flexible metadata**: Use PostgreSQL JSONB for source-specific fields that don't fit the unified schema
5. **Temporal tracking**: All tables have `created_at` and many have `updated_at` for change tracking
6. **Evidence provenance**: Every evidence record tracks its source and date

---

## Next Steps

1. Implement this schema in PostgreSQL
2. Build ingestion scripts for each data source
3. Create entity resolution/mapping logic
4. Populate the database
5. Build the signal detection engine
6. Create the API layer
7. Build the dashboard
