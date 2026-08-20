import sqlite3
import os

DB_PATH = 'data/unified/medbase.db'

def run_migrations():
    """Applies schema migrations to medbase.db adding evidence_events, signal_history, signal_evidence, and alerts tables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. evidence_events Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evidence_events (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        source_record_id TEXT,
        event_type TEXT NOT NULL,
        drug_id TEXT,
        disease_id TEXT,
        target_id TEXT,
        publication_date TEXT,
        detected_at TEXT NOT NULL,
        evidence_strength REAL DEFAULT 1.0,
        source_reliability REAL DEFAULT 1.0,
        content_hash TEXT UNIQUE,
        title TEXT,
        summary TEXT,
        url TEXT,
        metadata_json TEXT,
        FOREIGN KEY (drug_id) REFERENCES drugs (id),
        FOREIGN KEY (disease_id) REFERENCES diseases (id),
        FOREIGN KEY (target_id) REFERENCES targets (id)
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ee_drug ON evidence_events(drug_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ee_disease ON evidence_events(disease_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ee_target ON evidence_events(target_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ee_pub_date ON evidence_events(publication_date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ee_detected ON evidence_events(detected_at);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ee_source ON evidence_events(source);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ee_event_type ON evidence_events(event_type);")

    # 2. signal_history Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS signal_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        drug_id TEXT NOT NULL,
        disease_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        prism_score REAL NOT NULL,
        mechanistic_score REAL DEFAULT 0.0,
        evidence_score REAL DEFAULT 0.0,
        novelty_score REAL DEFAULT 0.0,
        clinical_proximity_score REAL DEFAULT 0.0,
        momentum_score REAL DEFAULT 0.0,
        convergence_score REAL DEFAULT 0.0,
        reliability_score REAL DEFAULT 0.0,
        contradiction_penalty REAL DEFAULT 0.0,
        FOREIGN KEY (drug_id) REFERENCES drugs (id),
        FOREIGN KEY (disease_id) REFERENCES diseases (id)
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sh_pair ON signal_history(drug_id, disease_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sh_timestamp ON signal_history(timestamp);")

    # 3. signal_evidence Linking Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS signal_evidence (
        signal_id TEXT NOT NULL,
        evidence_event_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL,
        weight REAL DEFAULT 1.0,
        PRIMARY KEY (signal_id, evidence_event_id),
        FOREIGN KEY (evidence_event_id) REFERENCES evidence_events (id)
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_se_signal ON signal_evidence(signal_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_se_event ON signal_evidence(evidence_event_id);")

    # 4. alerts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        min_score REAL DEFAULT 70.0,
        min_momentum REAL DEFAULT 50.0,
        disease_id TEXT,
        drug_id TEXT,
        enabled INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()
    print("Migrations applied successfully to medbase.db")

if __name__ == '__main__':
    run_migrations()
