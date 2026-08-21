-- PRISM-Rx PostgreSQL / Supabase Schema DDL
-- Converted directly from SQLite data/unified/medbase.db

DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS signal_history CASCADE;
DROP TABLE IF EXISTS signal_evidence CASCADE;
DROP TABLE IF EXISTS publications CASCADE;
DROP TABLE IF EXISTS evidence_events CASCADE;
DROP TABLE IF EXISTS drug_warnings CASCADE;
DROP TABLE IF EXISTS evidence CASCADE;
DROP TABLE IF EXISTS clinical_reports CASCADE;
DROP TABLE IF EXISTS drug_disease CASCADE;
DROP TABLE IF EXISTS target_disease CASCADE;
DROP TABLE IF EXISTS drug_target CASCADE;
DROP TABLE IF EXISTS entity_synonyms CASCADE;
DROP TABLE IF EXISTS targets CASCADE;
DROP TABLE IF EXISTS diseases CASCADE;
DROP TABLE IF EXISTS drugs CASCADE;

CREATE TABLE drugs (
    id VARCHAR(255) PRIMARY KEY,
    chembl_id VARCHAR(255),
    name TEXT NOT NULL,
    drug_type VARCHAR(100),
    max_clinical_stage VARCHAR(100),
    canonical_smiles TEXT,
    inchi_key VARCHAR(255),
    drugbank_ids TEXT,
    trade_names TEXT,
    parent_id VARCHAR(255),
    synonyms TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE diseases (
    id VARCHAR(255) PRIMARY KEY,
    source_id VARCHAR(255),
    name TEXT NOT NULL,
    description TEXT,
    therapeutic_areas TEXT,
    parent_ids TEXT,
    exact_synonyms TEXT,
    is_therapeutic_area INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE targets (
    id VARCHAR(255) PRIMARY KEY,
    ensembl_id VARCHAR(255),
    approved_symbol VARCHAR(100) NOT NULL,
    approved_name TEXT,
    biotype VARCHAR(100),
    uniprot_ids TEXT,
    hgnc_id VARCHAR(255),
    chembl_target_id VARCHAR(255),
    target_class TEXT,
    subcellular_locations TEXT,
    function_descriptions TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE entity_synonyms (
    canonical_id VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    synonym TEXT NOT NULL,
    source VARCHAR(100)
);

CREATE TABLE drug_target (
    drug_id VARCHAR(255) REFERENCES drugs(id) ON DELETE CASCADE,
    target_id VARCHAR(255) REFERENCES targets(id) ON DELETE CASCADE,
    action_type VARCHAR(100),
    mechanism_of_action TEXT,
    source VARCHAR(100),
    source_version VARCHAR(50),
    retrieved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (drug_id, target_id)
);

CREATE TABLE target_disease (
    target_id VARCHAR(255) REFERENCES targets(id) ON DELETE CASCADE,
    disease_id VARCHAR(255) REFERENCES diseases(id) ON DELETE CASCADE,
    score DOUBLE PRECISION,
    source VARCHAR(100),
    source_version VARCHAR(50),
    retrieved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (target_id, disease_id)
);

CREATE TABLE drug_disease (
    drug_id VARCHAR(255) REFERENCES drugs(id) ON DELETE CASCADE,
    disease_id VARCHAR(255) REFERENCES diseases(id) ON DELETE CASCADE,
    max_clinical_stage VARCHAR(100),
    source VARCHAR(100),
    source_version VARCHAR(50),
    retrieved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (drug_id, disease_id)
);

CREATE TABLE clinical_reports (
    id VARCHAR(255) PRIMARY KEY,
    report_type VARCHAR(100),
    source_name VARCHAR(100),
    clinical_stage VARCHAR(100),
    trial_phase VARCHAR(100),
    trial_status VARCHAR(100),
    trial_study_type VARCHAR(100),
    trial_primary_purpose VARCHAR(100),
    trial_number_of_arms DOUBLE PRECISION,
    trial_start_date DATE,
    url TEXT,
    has_expert_review INT DEFAULT 0,
    source VARCHAR(100),
    source_version VARCHAR(50),
    retrieved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evidence (
    id VARCHAR(255) PRIMARY KEY,
    drug_id VARCHAR(255) REFERENCES drugs(id) ON DELETE CASCADE,
    target_id VARCHAR(255) REFERENCES targets(id) ON DELETE CASCADE,
    disease_id VARCHAR(255) REFERENCES diseases(id) ON DELETE CASCADE,
    evidence_type VARCHAR(100),
    clinical_stage VARCHAR(100),
    score DOUBLE PRECISION,
    direction_on_trait VARCHAR(50),
    direction_on_target VARCHAR(50),
    publication_ids TEXT,
    clinical_report_id VARCHAR(255) REFERENCES clinical_reports(id) ON DELETE SET NULL,
    source VARCHAR(100),
    source_version VARCHAR(50),
    retrieved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE drug_warnings (
    drug_id VARCHAR(255) REFERENCES drugs(id) ON DELETE CASCADE,
    warning_type VARCHAR(100),
    toxicity_class VARCHAR(100),
    country VARCHAR(100),
    description TEXT,
    efo_id VARCHAR(255),
    year DOUBLE PRECISION,
    source VARCHAR(100),
    source_version VARCHAR(50),
    retrieved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evidence_events (
    id VARCHAR(255) PRIMARY KEY,
    source VARCHAR(100),
    source_record_id VARCHAR(255),
    event_type VARCHAR(100),
    drug_id VARCHAR(255) REFERENCES drugs(id) ON DELETE CASCADE,
    disease_id VARCHAR(255) REFERENCES diseases(id) ON DELETE CASCADE,
    target_id VARCHAR(255) REFERENCES targets(id) ON DELETE CASCADE,
    publication_date DATE,
    detected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    evidence_strength DOUBLE PRECISION,
    source_reliability DOUBLE PRECISION,
    content_hash VARCHAR(255),
    title TEXT,
    summary TEXT,
    url TEXT,
    metadata_json TEXT
);

CREATE TABLE publications (
    id VARCHAR(255) PRIMARY KEY,
    pmid VARCHAR(100),
    title TEXT,
    authors TEXT,
    journal TEXT,
    publication_date DATE,
    source VARCHAR(100),
    retrieved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alerts (
    id VARCHAR(255) PRIMARY KEY,
    topic TEXT,
    min_score DOUBLE PRECISION,
    min_momentum DOUBLE PRECISION,
    disease_id VARCHAR(255),
    drug_id VARCHAR(255),
    enabled INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signal_evidence (
    signal_id VARCHAR(255),
    evidence_event_id VARCHAR(255) REFERENCES evidence_events(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100),
    weight DOUBLE PRECISION
);

CREATE TABLE signal_history (
    id BIGSERIAL PRIMARY KEY,
    drug_id VARCHAR(255),
    disease_id VARCHAR(255),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    prism_score DOUBLE PRECISION,
    mechanistic_score DOUBLE PRECISION,
    evidence_score DOUBLE PRECISION,
    novelty_score DOUBLE PRECISION,
    clinical_proximity_score DOUBLE PRECISION,
    momentum_score DOUBLE PRECISION,
    convergence_score DOUBLE PRECISION,
    reliability_score DOUBLE PRECISION,
    contradiction_penalty DOUBLE PRECISION
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_drugs_name ON drugs(name);
CREATE INDEX IF NOT EXISTS idx_diseases_name ON diseases(name);
CREATE INDEX IF NOT EXISTS idx_targets_symbol ON targets(approved_symbol);
CREATE INDEX IF NOT EXISTS idx_entity_synonyms_canonical ON entity_synonyms(canonical_id);
CREATE INDEX IF NOT EXISTS idx_drug_target_drug ON drug_target(drug_id);
CREATE INDEX IF NOT EXISTS idx_drug_target_target ON drug_target(target_id);
CREATE INDEX IF NOT EXISTS idx_target_disease_disease ON target_disease(disease_id);
CREATE INDEX IF NOT EXISTS idx_target_disease_target ON target_disease(target_id);
CREATE INDEX IF NOT EXISTS idx_drug_disease_drug ON drug_disease(drug_id);
CREATE INDEX IF NOT EXISTS idx_drug_disease_pair ON drug_disease(drug_id, disease_id);
CREATE INDEX IF NOT EXISTS idx_evidence_drug ON evidence(drug_id);
CREATE INDEX IF NOT EXISTS idx_evidence_disease ON evidence(disease_id);
CREATE INDEX IF NOT EXISTS idx_evidence_target ON evidence(target_id);
