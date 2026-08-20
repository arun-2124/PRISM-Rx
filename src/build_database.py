"""
Phase 3: Build Unified Biomedical Database
Reads Open Targets 26.06 parquet files → normalizes → loads into SQLite

Usage: python src/build_database.py
"""

import sqlite3
import pandas as pd
import json
import hashlib
from pathlib import Path
from datetime import datetime, timezone

BASE = Path("data/raw/opentargets")
DB_PATH = Path("data/unified/medbase.db")
LOG_PATH = Path("data/unified/build_log.json")

SCHEMA_SQL = """
DROP TABLE IF EXISTS entity_synonyms;
DROP TABLE IF EXISTS drug_warnings;
DROP TABLE IF EXISTS clinical_reports;
DROP TABLE IF EXISTS publications;
DROP TABLE IF EXISTS evidence;
DROP TABLE IF EXISTS drug_target;
DROP TABLE IF EXISTS drug_disease;
DROP TABLE IF EXISTS target_disease;
DROP TABLE IF EXISTS drugs;
DROP TABLE IF EXISTS diseases;
DROP TABLE IF EXISTS targets;

CREATE TABLE drugs (
    id TEXT PRIMARY KEY,
    chembl_id TEXT UNIQUE,
    name TEXT,
    drug_type TEXT,
    max_clinical_stage TEXT,
    canonical_smiles TEXT,
    inchi_key TEXT,
    drugbank_ids TEXT,
    trade_names TEXT,
    parent_id TEXT,
    synonyms TEXT,
    created_at TEXT
);

CREATE TABLE diseases (
    id TEXT PRIMARY KEY,
    source_id TEXT UNIQUE,
    name TEXT,
    description TEXT,
    therapeutic_areas TEXT,
    parent_ids TEXT,
    exact_synonyms TEXT,
    is_therapeutic_area INTEGER,
    created_at TEXT
);

CREATE TABLE targets (
    id TEXT PRIMARY KEY,
    ensembl_id TEXT UNIQUE,
    approved_symbol TEXT,
    approved_name TEXT,
    biotype TEXT,
    uniprot_ids TEXT,
    hgnc_id TEXT,
    chembl_target_id TEXT,
    target_class TEXT,
    subcellular_locations TEXT,
    function_descriptions TEXT,
    created_at TEXT
);

CREATE TABLE drug_target (
    drug_id TEXT,
    target_id TEXT,
    action_type TEXT,
    mechanism_of_action TEXT,
    source TEXT DEFAULT 'Open Targets',
    source_version TEXT DEFAULT '26.06',
    retrieved_at TEXT,
    PRIMARY KEY (drug_id, target_id, action_type)
);

CREATE TABLE drug_disease (
    drug_id TEXT,
    disease_id TEXT,
    max_clinical_stage TEXT,
    source TEXT DEFAULT 'Open Targets',
    source_version TEXT DEFAULT '26.06',
    retrieved_at TEXT,
    PRIMARY KEY (drug_id, disease_id)
);

CREATE TABLE target_disease (
    target_id TEXT,
    disease_id TEXT,
    score REAL,
    source TEXT DEFAULT 'Open Targets',
    source_version TEXT DEFAULT '26.06',
    retrieved_at TEXT,
    PRIMARY KEY (target_id, disease_id)
);

CREATE TABLE drug_warnings (
    drug_id TEXT,
    warning_type TEXT,
    toxicity_class TEXT,
    country TEXT,
    description TEXT,
    efo_id TEXT,
    year REAL,
    source TEXT DEFAULT 'Open Targets',
    source_version TEXT DEFAULT '26.06',
    retrieved_at TEXT
);

CREATE TABLE clinical_reports (
    id TEXT PRIMARY KEY,
    report_type TEXT,
    source_name TEXT,
    clinical_stage TEXT,
    trial_phase TEXT,
    trial_status TEXT,
    trial_study_type TEXT,
    trial_primary_purpose TEXT,
    trial_number_of_arms REAL,
    trial_start_date TEXT,
    url TEXT,
    has_expert_review INTEGER,
    source TEXT DEFAULT 'Open Targets',
    source_version TEXT DEFAULT '26.06',
    retrieved_at TEXT
);

CREATE TABLE publications (
    id TEXT PRIMARY KEY,
    pmid TEXT UNIQUE,
    title TEXT,
    authors TEXT,
    journal TEXT,
    publication_date TEXT,
    source TEXT,
    retrieved_at TEXT
);

CREATE TABLE evidence (
    id TEXT PRIMARY KEY,
    drug_id TEXT,
    target_id TEXT,
    disease_id TEXT,
    evidence_type TEXT,
    clinical_stage TEXT,
    score REAL,
    direction_on_trait TEXT,
    direction_on_target TEXT,
    publication_ids TEXT,
    clinical_report_id TEXT,
    source TEXT DEFAULT 'Open Targets',
    source_version TEXT DEFAULT '26.06',
    retrieved_at TEXT
);

CREATE TABLE entity_synonyms (
    canonical_id TEXT,
    entity_type TEXT,
    synonym TEXT,
    source TEXT
);

CREATE INDEX idx_drugs_chembl ON drugs(chembl_id);
CREATE INDEX idx_drugs_name ON drugs(name);
CREATE INDEX idx_diseases_source ON diseases(source_id);
CREATE INDEX idx_diseases_name ON diseases(name);
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
CREATE INDEX idx_entity_synonyms_canonical ON entity_synonyms(canonical_id);
CREATE INDEX idx_entity_synonyms_synonym ON entity_synonyms(synonym);
CREATE INDEX idx_clinical_reports_source ON clinical_reports(source_name);
"""


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def is_missing(val):
    if val is None:
        return True
    try:
        if pd.isna(val):
            return True
    except (ValueError, TypeError):
        pass
    return False


def safe_json(obj):
    if is_missing(obj):
        return None
    if isinstance(obj, (list, dict)):
        return json.dumps(obj, default=str)
    return str(obj)


def load_drugs(conn):
    print("\n[1/9] Loading drugs...")
    df = pd.read_parquet(BASE / "drug_molecule")
    now = now_iso()
    rows = []
    synonyms_rows = []

    for _, r in df.iterrows():
        drug_id = f"DR:{r['id']}"
        name = str(r['name']).strip().title() if not is_missing(r['name']) else None
        drug_type = r.get('drugType')
        max_stage = r.get('maximumClinicalStage')
        smiles = r.get('canonicalSmiles') if not is_missing(r.get('canonicalSmiles')) else None
        inchi = r.get('inchiKey') if not is_missing(r.get('inchiKey')) else None
        parent = r.get('parentId') if not is_missing(r.get('parentId')) else None

        drugbank_ids = []
        cross_refs = r.get('crossReferences')
        if not is_missing(cross_refs):
            for ref in cross_refs:
                if isinstance(ref, dict) and ref.get('source') == 'drugbank':
                    drugbank_ids.extend(ref.get('ids', []))

        trade_names = []
        trade_raw = r.get('tradeNames')
        if not is_missing(trade_raw):
            for tn in trade_raw:
                if isinstance(tn, dict) and tn.get('label'):
                    trade_names.append(tn['label'])

        syns = []
        syns_raw = r.get('synonyms')
        if not is_missing(syns_raw):
            for s in syns_raw:
                if isinstance(s, dict) and s.get('label'):
                    syns.append(s['label'])

        rows.append((
            drug_id, r['id'], name, drug_type, max_stage,
            smiles, inchi, ','.join(drugbank_ids) if drugbank_ids else None,
            json.dumps(trade_names) if trade_names else None,
            f"DR:{parent}" if parent else None,
            json.dumps(syns) if syns else None,
            now
        ))

        for s in syns[:20]:
            synonyms_rows.append((drug_id, 'drug', s, 'ChEMBL'))
        for tn in trade_names[:10]:
            synonyms_rows.append((drug_id, 'drug', tn, 'ChEMBL_trade_name'))

    conn.executemany(
        "INSERT OR IGNORE INTO drugs VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        rows
    )
    conn.executemany(
        "INSERT OR IGNORE INTO entity_synonyms VALUES (?,?,?,?)",
        synonyms_rows
    )
    print(f"  Loaded {len(rows):,} drugs, {len(synonyms_rows):,} synonyms")
    return len(rows)


def load_diseases(conn):
    print("\n[2/9] Loading diseases...")
    df = pd.read_parquet(BASE / "disease")
    now = now_iso()
    rows = []
    synonyms_rows = []

    for _, r in df.iterrows():
        disease_id = f"D:{r['id']}"
        name = str(r['name']).strip() if not is_missing(r['name']) else None
        desc = str(r['description'])[:2000] if not is_missing(r.get('description')) else None
        ta = safe_json(r.get('therapeuticAreas'))
        parents = safe_json(r.get('parents'))
        exact_syns = safe_json(r.get('exactSynonyms'))
        is_ta = 0
        if not is_missing(r.get('ontology')):
            ont = r['ontology']
            if isinstance(ont, dict):
                is_ta = 1 if ont.get('isTherapeuticArea') else 0

        rows.append((
            disease_id, r['id'], name, desc, ta, parents,
            exact_syns, is_ta, now
        ))

        if not is_missing(r.get('exactSynonyms')):
            for s in r['exactSynonyms'][:20]:
                synonyms_rows.append((disease_id, 'disease', s, 'OpenTargets'))
        if not is_missing(r.get('relatedSynonyms')):
            for s in r['relatedSynonyms'][:10]:
                synonyms_rows.append((disease_id, 'disease', s, 'OpenTargets_related'))

    conn.executemany(
        "INSERT OR IGNORE INTO diseases VALUES (?,?,?,?,?,?,?,?,?)",
        rows
    )
    conn.executemany(
        "INSERT OR IGNORE INTO entity_synonyms VALUES (?,?,?,?)",
        synonyms_rows
    )
    print(f"  Loaded {len(rows):,} diseases, {len(synonyms_rows):,} synonyms")
    return len(rows)


def load_targets(conn):
    print("\n[3/9] Loading targets...")
    df = pd.read_parquet(BASE / "target")
    now = now_iso()
    rows = []
    synonyms_rows = []

    for _, r in df.iterrows():
        target_id = f"T:{r['id']}"
        symbol = r.get('approvedSymbol')
        name = str(r.get('approvedName', '')).strip() if not is_missing(r.get('approvedName')) else None
        biotype = r.get('biotype')

        uniprot_ids = []
        if not is_missing(r.get('proteinIds')):
            for p in r['proteinIds']:
                if p.get('source') == 'uniprot_swissprot':
                    uniprot_ids.append(p['id'])

        hgnc_id = None
        chembl_target_id = None
        if not is_missing(r.get('dbXrefs')):
            for ref in r['dbXrefs']:
                if ref.get('source') == 'HGNC':
                    hgnc_id = ref['id']
                if ref.get('source') == 'ChEMBL':
                    chembl_target_id = ref['id']

        target_class = safe_json(r.get('targetClass'))
        subcell = safe_json(r.get('subcellularLocations'))
        func = safe_json(r.get('functionDescriptions'))

        rows.append((
            target_id, r['id'], symbol, name, biotype,
            json.dumps(uniprot_ids) if uniprot_ids else None,
            hgnc_id, chembl_target_id, target_class,
            subcell, func, now
        ))

        if not is_missing(r.get('symbolSynonyms')):
            for s in r['symbolSynonyms'][:10]:
                if s.get('label'):
                    synonyms_rows.append((target_id, 'target', s['label'], s.get('source', 'OpenTargets')))
        if not is_missing(r.get('nameSynonyms')):
            for s in r['nameSynonyms'][:5]:
                if s.get('label'):
                    synonyms_rows.append((target_id, 'target', s['label'], s.get('source', 'OpenTargets')))

    conn.executemany(
        "INSERT OR IGNORE INTO targets VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        rows
    )
    conn.executemany(
        "INSERT OR IGNORE INTO entity_synonyms VALUES (?,?,?,?)",
        synonyms_rows
    )
    print(f"  Loaded {len(rows):,} targets, {len(synonyms_rows):,} synonyms")
    return len(rows)


def load_drug_target(conn):
    print("\n[4/9] Loading drug-target relationships...")
    df = pd.read_parquet(BASE / "drug_mechanism_of_action")
    now = now_iso()
    rows = []

    for _, r in df.iterrows():
        chembl_ids = r['chemblIds'] if not is_missing(r['chemblIds']) else []
        target_ids = r['targets'] if not is_missing(r['targets']) else []
        action = r.get('actionType')
        mechanism = r.get('mechanismOfAction')

        for cid in chembl_ids:
            for tid in target_ids:
                rows.append((
                    f"DR:{cid}", f"T:{tid}", action, mechanism,
                    'Open Targets', '26.06', now
                ))

    conn.executemany(
        "INSERT OR IGNORE INTO drug_target VALUES (?,?,?,?,?,?,?)",
        rows
    )
    print(f"  Loaded {len(rows):,} drug-target pairs")
    return len(rows)


def load_drug_disease(conn):
    print("\n[5/9] Loading drug-disease indications...")
    df = pd.read_parquet(BASE / "clinical_indication")
    now = now_iso()
    rows = []

    for _, r in df.iterrows():
        rows.append((
            f"DR:{r['drugId']}", f"D:{r['diseaseId']}",
            r.get('maxClinicalStage'),
            'Open Targets', '26.06', now
        ))

    conn.executemany(
        "INSERT OR IGNORE INTO drug_disease VALUES (?,?,?,?,?,?)",
        rows
    )
    print(f"  Loaded {len(rows):,} drug-disease pairs")
    return len(rows)


def load_target_disease(conn):
    print("\n[6/9] Loading target-disease evidence...")
    df = pd.read_parquet(BASE / "evidence_clinical_precedence")
    now = now_iso()

    agg = df.groupby(['targetId', 'diseaseId']).agg(
        max_score=('score', 'max'),
    ).reset_index()

    rows = []
    for _, r in agg.iterrows():
        rows.append((
            f"T:{r['targetId']}", f"D:{r['diseaseId']}",
            r['max_score'],
            'Open Targets', '26.06', now
        ))

    conn.executemany(
        "INSERT OR IGNORE INTO target_disease VALUES (?,?,?,?,?,?)",
        rows
    )
    print(f"  Loaded {len(rows):,} target-disease pairs (max score)")
    return len(rows)


def load_drug_warnings(conn):
    print("\n[7/9] Loading drug warnings...")
    df = pd.read_parquet(BASE / "drug_warning")
    now = now_iso()
    rows = []

    for _, r in df.iterrows():
        chembl_ids = r['chemblIds'] if not is_missing(r['chemblIds']) else []
        for cid in chembl_ids:
            rows.append((
                f"DR:{cid}",
                r.get('warningType'),
                r.get('toxicityClass') if not is_missing(r.get('toxicityClass')) else None,
                r.get('country'),
                str(r['description'])[:2000] if not is_missing(r.get('description')) else None,
                r.get('efoId') if not is_missing(r.get('efoId')) else None,
                r.get('year') if not is_missing(r.get('year')) else None,
                'Open Targets', '26.06', now
            ))

    conn.executemany(
        "INSERT OR IGNORE INTO drug_warnings VALUES (?,?,?,?,?,?,?,?,?,?)",
        rows
    )
    print(f"  Loaded {len(rows):,} drug warning records")
    return len(rows)


def load_clinical_reports(conn):
    print("\n[8/9] Loading clinical reports...")
    df = pd.read_parquet(BASE / "clinical_report")
    now = now_iso()
    rows = []

    for _, r in df.iterrows():
        start_date = None
        if not is_missing(r.get('trialStartDate')):
            sd = r['trialStartDate']
            if hasattr(sd, 'isoformat'):
                start_date = sd.isoformat()
            else:
                start_date = str(sd)[:10]

        rows.append((
            r['id'],
            r.get('type'),
            r.get('source'),
            r.get('clinicalStage'),
            r.get('trialPhase') if not is_missing(r.get('trialPhase')) else None,
            r.get('trialOverallStatus') if not is_missing(r.get('trialOverallStatus')) else None,
            r.get('trialStudyType') if not is_missing(r.get('trialStudyType')) else None,
            r.get('trialPrimaryPurpose') if not is_missing(r.get('trialPrimaryPurpose')) else None,
            r.get('trialNumberOfArms') if not is_missing(r.get('trialNumberOfArms')) else None,
            start_date,
            r.get('url') if not is_missing(r.get('url')) else None,
            1 if r.get('hasExpertReview') else 0,
            'Open Targets', '26.06', now
        ))

    conn.executemany(
        "INSERT OR IGNORE INTO clinical_reports VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        rows
    )
    print(f"  Loaded {len(rows):,} clinical reports")
    return len(rows)


def load_evidence(conn):
    print("\n[9/9] Loading evidence records...")
    df = pd.read_parquet(BASE / "evidence_clinical_precedence")
    now = now_iso()
    rows = []

    for _, r in df.iterrows():
        pub_ids = None
        if not is_missing(r.get('literature')):
            pub_ids = json.dumps([str(p) for p in r['literature']])

        rows.append((
            r['id'],
            f"DR:{r['drugId']}" if not is_missing(r.get('drugId')) else None,
            f"T:{r['targetId']}" if not is_missing(r.get('targetId')) else None,
            f"D:{r['diseaseId']}" if not is_missing(r.get('diseaseId')) else None,
            r.get('datatypeId'),
            r.get('clinicalStage'),
            r.get('score'),
            r.get('directionOnTrait') if not is_missing(r.get('directionOnTrait')) else None,
            r.get('directionOnTarget') if not is_missing(r.get('directionOnTarget')) else None,
            pub_ids,
            r.get('clinicalReportId') if not is_missing(r.get('clinicalReportId')) else None,
            'Open Targets', '26.06', now
        ))

    conn.executemany(
        "INSERT OR IGNORE INTO evidence VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        rows
    )
    print(f"  Loaded {len(rows):,} evidence records")
    return len(rows)


def verify_database(conn):
    print("\n" + "="*60)
    print("DATABASE VERIFICATION")
    print("="*60)

    tables = [
        'drugs', 'diseases', 'targets', 'drug_target',
        'drug_disease', 'target_disease', 'drug_warnings',
        'clinical_reports', 'evidence', 'entity_synonyms'
    ]

    for t in tables:
        count = conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        print(f"  {t:25s} {count:>10,} rows")

    print("\n--- Sample Drug-Target Pairs ---")
    rows = conn.execute("""
        SELECT d.name, dt.action_type, t.approved_symbol, t.approved_name
        FROM drug_target dt
        JOIN drugs d ON dt.drug_id = d.id
        JOIN targets t ON dt.target_id = t.id
        LIMIT 10
    """).fetchall()
    for r in rows:
        print(f"  {r[0]:30s} --{r[1]:15s}--> {r[2]} ({r[3][:40]})")

    print("\n--- Sample Drug-Disease Indications ---")
    rows = conn.execute("""
        SELECT d.name, dis.name, dd.max_clinical_stage
        FROM drug_disease dd
        JOIN drugs d ON dd.drug_id = d.id
        JOIN diseases dis ON dd.disease_id = dis.id
        WHERE dd.max_clinical_stage = 'APPROVAL'
        LIMIT 10
    """).fetchall()
    for r in rows:
        print(f"  {r[0]:30s} --> {r[1]:40s} [{r[2]}]")

    print("\n--- Target-Disease Evidence (Top 10 by score) ---")
    rows = conn.execute("""
        SELECT t.approved_symbol, dis.name, td.score
        FROM target_disease td
        JOIN targets t ON td.target_id = t.id
        JOIN diseases dis ON td.disease_id = dis.id
        ORDER BY td.score DESC
        LIMIT 10
    """).fetchall()
    for r in rows:
        print(f"  {r[0]:10s} --> {r[1]:40s} score={r[2]:.2f}")

    print("\n--- Drug Warnings ---")
    rows = conn.execute("""
        SELECT d.name, dw.warning_type, dw.country
        FROM drug_warnings dw
        JOIN drugs d ON dw.drug_id = d.id
        LIMIT 10
    """).fetchall()
    for r in rows:
        print(f"  {r[0]:30s} {r[1]:25s} ({r[2]})")


def main():
    print("="*60)
    print("PHASE 3: BUILD UNIFIED DATABASE")
    print(f"Started: {now_iso()}")
    print("="*60)

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()

    conn = sqlite3.connect(str(DB_PATH))
    conn.executescript(SCHEMA_SQL)

    stats = {}
    stats['drugs'] = load_drugs(conn)
    stats['diseases'] = load_diseases(conn)
    stats['targets'] = load_targets(conn)
    stats['drug_target'] = load_drug_target(conn)
    stats['drug_disease'] = load_drug_disease(conn)
    stats['target_disease'] = load_target_disease(conn)
    stats['drug_warnings'] = load_drug_warnings(conn)
    stats['clinical_reports'] = load_clinical_reports(conn)
    stats['evidence'] = load_evidence(conn)

    conn.commit()
    verify_database(conn)
    conn.close()

    log = {
        'build_time': now_iso(),
        'database_path': str(DB_PATH),
        'database_size_mb': round(DB_PATH.stat().st_size / 1024 / 1024, 1),
        'source': 'Open Targets 26.06',
        'tables': stats
    }
    LOG_PATH.write_text(json.dumps(log, indent=2))

    print(f"\n{'='*60}")
    print(f"DONE: {DB_PATH}")
    print(f"Size: {log['database_size_mb']} MB")
    print(f"Log: {LOG_PATH}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
