-- PRISM-Rx PostgreSQL / Supabase Schema DDL
-- Converted from SQLite data/unified/medbase.db

CREATE TABLE IF NOT EXISTS drugs (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    chembl_id VARCHAR(255),
    drugbank_id VARCHAR(255),
    pubchem_cid VARCHAR(255),
    cas_number VARCHAR(255),
    max_clinical_stage VARCHAR(100),
    drug_type VARCHAR(100),
    smiles TEXT,
    description TEXT,
    mechanism_of_action TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS diseases (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mondo_id VARCHAR(255),
    efo_id VARCHAR(255),
    doid VARCHAR(255),
    mesh_id VARCHAR(255),
    category VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS targets (
    id VARCHAR(255) PRIMARY KEY,
    ensembl_id VARCHAR(255),
    approved_symbol VARCHAR(100) NOT NULL,
    approved_name VARCHAR(255),
    biotype VARCHAR(100),
    uniprot_ids TEXT,
    hgnc_id VARCHAR(255),
    chembl_target_id VARCHAR(255),
    target_class VARCHAR(100),
    subcellular_locations TEXT,
    function_descriptions TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS entity_synonyms (
    id VARCHAR(255) PRIMARY KEY,
    entity_id VARCHAR(255) NOT NULL,
    synonym VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS drug_target (
    drug_id VARCHAR(255) REFERENCES drugs(id) ON DELETE CASCADE,
    target_id VARCHAR(255) REFERENCES targets(id) ON DELETE CASCADE,
    action_type VARCHAR(100),
    mechanism_of_action TEXT,
    source VARCHAR(100),
    source_version VARCHAR(50),
    retrieved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (drug_id, target_id)
);

CREATE TABLE IF NOT EXISTS target_disease (
    target_id VARCHAR(255) REFERENCES targets(id) ON DELETE CASCADE,
    disease_id VARCHAR(255) REFERENCES diseases(id) ON DELETE CASCADE,
    association_score DOUBLE PRECISION,
    evidence_count INT DEFAULT 0,
    source VARCHAR(100),
    source_version VARCHAR(50),
    PRIMARY KEY (target_id, disease_id)
);

CREATE TABLE IF NOT EXISTS drug_disease (
    drug_id VARCHAR(255) REFERENCES drugs(id) ON DELETE CASCADE,
    disease_id VARCHAR(255) REFERENCES diseases(id) ON DELETE CASCADE,
    max_clinical_stage VARCHAR(100),
    association_type VARCHAR(100),
    source VARCHAR(100),
    source_version VARCHAR(50),
    PRIMARY KEY (drug_id, disease_id)
);

CREATE TABLE IF NOT EXISTS clinical_reports (
    id VARCHAR(255) PRIMARY KEY,
    source_name VARCHAR(100),
    trial_phase VARCHAR(100),
    trial_status VARCHAR(100),
    trial_start_date DATE,
    url TEXT,
    title TEXT,
    conditions TEXT,
    interventions TEXT,
    sponsor VARCHAR(255),
    study_type VARCHAR(100),
    enrollment INT,
    completion_date DATE,
    brief_summary TEXT,
    detailed_description TEXT
);

CREATE TABLE IF NOT EXISTS evidence (
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

CREATE TABLE IF NOT EXISTS drug_warnings (
    id VARCHAR(255) PRIMARY KEY,
    drug_id VARCHAR(255) REFERENCES drugs(id) ON DELETE CASCADE,
    warning_type VARCHAR(100),
    toxicity_class VARCHAR(100),
    country VARCHAR(100),
    description TEXT,
    year INT,
    source VARCHAR(100),
    source_version VARCHAR(50),
    retrieved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence_events (
    id VARCHAR(255) PRIMARY KEY,
    drug_id VARCHAR(255) REFERENCES drugs(id) ON DELETE CASCADE,
    disease_id VARCHAR(255) REFERENCES diseases(id) ON DELETE CASCADE,
    source VARCHAR(100),
    event_type VARCHAR(100),
    publication_date DATE,
    title TEXT,
    evidence_strength DOUBLE PRECISION,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS publications (
    id VARCHAR(255) PRIMARY KEY,
    pmid VARCHAR(100),
    pmcid VARCHAR(100),
    doi VARCHAR(255),
    title TEXT,
    authors TEXT,
    journal VARCHAR(255),
    publication_year INT
);

CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    signal_id VARCHAR(255),
    alert_type VARCHAR(100),
    title TEXT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'UNREAD',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS signal_evidence (
    signal_id VARCHAR(255),
    evidence_id VARCHAR(255) REFERENCES evidence(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (signal_id, evidence_id)
);

CREATE TABLE IF NOT EXISTS signal_history (
    id VARCHAR(255) PRIMARY KEY,
    signal_id VARCHAR(255),
    prism_score DOUBLE PRECISION,
    category VARCHAR(100),
    calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_drugs_name ON drugs(name);
CREATE INDEX IF NOT EXISTS idx_diseases_name ON diseases(name);
CREATE INDEX IF NOT EXISTS idx_targets_symbol ON targets(approved_symbol);
CREATE INDEX IF NOT EXISTS idx_entity_synonyms_entity ON entity_synonyms(entity_id);
CREATE INDEX IF NOT EXISTS idx_drug_target_drug ON drug_target(drug_id);
CREATE INDEX IF NOT EXISTS idx_target_disease_disease ON target_disease(disease_id);
CREATE INDEX IF NOT EXISTS idx_drug_disease_drug ON drug_disease(drug_id);
CREATE INDEX IF NOT EXISTS idx_evidence_drug ON evidence(drug_id);
CREATE INDEX IF NOT EXISTS idx_evidence_disease ON evidence(disease_id);
CREATE INDEX IF NOT EXISTS idx_evidence_target ON evidence(target_id);
