"""PRISM-Rx Safe SQLite to Supabase PostgreSQL Migration Engine.

Migrates data from SQLite (data/unified/medbase.db) into Supabase PostgreSQL.
SOURCE SQLite database remains 100% UNTOUCHED.

Usage:
  python scripts/migrate_sqlite_to_supabase.py [--dry-run]
"""

import os
import sys
import time
import argparse
import sqlite3
import json
from typing import Dict, Any, List

SQLITE_DB_PATH = "data/unified/medbase.db"
SCHEMA_SQL_PATH = "scripts/create_postgres_schema.sql"
BASELINE_JSON_PATH = "tests/fixtures/sqlite_score_baseline.json"

TABLES_ORDER = [
    "drugs",
    "diseases",
    "targets",
    "entity_synonyms",
    "drug_target",
    "target_disease",
    "drug_disease",
    "clinical_reports",
    "evidence",
    "drug_warnings",
    "evidence_events",
    "publications",
    "alerts",
    "signal_evidence",
    "signal_history"
]

EXPECTED_ROW_COUNTS = {
    "alerts": 0,
    "clinical_reports": 289955,
    "diseases": 47080,
    "drug_disease": 86468,
    "drug_target": 14655,
    "drug_warnings": 3039,
    "drugs": 22407,
    "entity_synonyms": 479742,
    "evidence": 872619,
    "evidence_events": 3,
    "publications": 0,
    "signal_evidence": 0,
    "signal_history": 0,
    "target_disease": 107593,
    "targets": 78691
}

def load_env_file():
    env_path = ".env"
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip("'\"")
                    os.environ[k] = v

def migrate_data(dry_run: bool = False) -> bool:
    load_env_file()
    print("=" * 80)
    print("PRISM-Rx SAFE SQLITE -> SUPABASE POSTGRESQL MIGRATION ENGINE")
    print(f"Mode: {'DRY RUN (NO MIGRATION EXECUTED)' if dry_run else 'LIVE EXECUTION TO SUPABASE'}")
    print("=" * 80)

    if not os.path.exists(SQLITE_DB_PATH):
        print(f"[ERROR] Source SQLite database '{SQLITE_DB_PATH}' not found.")
        return False

    conn_sqlite = sqlite3.connect(SQLITE_DB_PATH)
    conn_sqlite.row_factory = sqlite3.Row

    # 1. Audit SQLite Source
    sqlite_counts: Dict[str, int] = {}
    total_sqlite_rows = 0
    for table in TABLES_ORDER:
        cnt = conn_sqlite.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        sqlite_counts[table] = cnt
        total_sqlite_rows += cnt

    print(f"\nSource SQLite Database Audit ({SQLITE_DB_PATH}):")
    for t, cnt in sqlite_counts.items():
        print(f"  - {t:<22}: {cnt:>10,} rows")
    print(f"  {'TOTAL SOURCE ROWS':<22}: {total_sqlite_rows:>10,} rows\n")

    if dry_run:
        print("[DRY-RUN CONFIRMED] Source SQLite database remains 100% untouched.")
        conn_sqlite.close()
        return True

    # Get connection URI
    db_url = os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL") or os.getenv("POSTGRES_DB_URL")
    if not db_url:
        print("[ERROR] SUPABASE_DATABASE_URL environment variable is not set.")
        print("Please set SUPABASE_DATABASE_URL before running live migration.")
        conn_sqlite.close()
        return False

    try:
        import psycopg
    except ImportError:
        print("[ERROR] 'psycopg' library is not installed. Please install psycopg[binary].")
        conn_sqlite.close()
        return False

    print("Connecting to Supabase PostgreSQL instance...")
    try:
        conn_pg = psycopg.connect(db_url, autocommit=False)
        print("[SUCCESS] Connected to Supabase PostgreSQL.")
    except Exception as e:
        print(f"[ERROR] Failed to connect to Supabase PostgreSQL: {e}")
        conn_sqlite.close()
        return False

    t_start = time.time()

    try:
        cur_pg = conn_pg.cursor()

        # 2. Execute Schema DDL
        print("\n[STEP 1/4] Applying PostgreSQL DDL Schema from scripts/create_postgres_schema.sql...")
        with open(SCHEMA_SQL_PATH, "r") as f:
            ddl_sql = f.read()
        cur_pg.execute(ddl_sql)
        conn_pg.commit()
        print("[SUCCESS] PostgreSQL DDL schema applied successfully.")

        # 3. Data Migration Table-by-Table
        print("\n[STEP 2/4] Migrating Data Batches from SQLite to Supabase PostgreSQL...")

        BATCH_SIZE = 5000

        for table in TABLES_ORDER:
            row_count = sqlite_counts[table]
            if row_count == 0:
                print(f"  - Table '{table}': 0 rows (Skipping data copy)")
                continue

            print(f"  - Migrating '{table}' ({row_count:,} rows)...", end="", flush=True)

            # Get column names
            col_info = conn_sqlite.execute(f"PRAGMA table_info({table})").fetchall()
            col_names = [c["name"] for c in col_info]

            cols_str = ", ".join(col_names)
            placeholders = ", ".join(["%s"] * len(col_names))
            insert_sql = f"INSERT INTO {table} ({cols_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"

            cursor_sq = conn_sqlite.execute(f"SELECT {cols_str} FROM {table}")

            batch = []
            inserted_count = 0

            for row in cursor_sq:
                clean_row = tuple(v.replace("\x00", "") if isinstance(v, str) else v for v in row)
                batch.append(clean_row)
                if len(batch) >= BATCH_SIZE:
                    cur_pg.executemany(insert_sql, batch)
                    inserted_count += len(batch)
                    batch = []

            if batch:
                cur_pg.executemany(insert_sql, batch)
                inserted_count += len(batch)

            conn_pg.commit()
            print(f" DONE ({inserted_count:,} rows inserted)")

        t_elapsed = time.time() - t_start
        print(f"\n[SUCCESS] All data batches migrated in {t_elapsed:.2f} seconds.")

        # 4. Validation & Parity Checks
        print("\n[STEP 3/4] Running Post-Migration Validation Checks...")
        
        pg_counts = {}
        total_pg_rows = 0
        parity_passed = True

        for table in TABLES_ORDER:
            cur_pg.execute(f"SELECT COUNT(*) FROM {table}")
            cnt = cur_pg.fetchone()[0]
            pg_counts[table] = cnt
            total_pg_rows += cnt

            exp = EXPECTED_ROW_COUNTS[table]
            match = (cnt == exp)
            if not match:
                parity_passed = False
            status_str = "PASS" if match else "FAIL"
            print(f"  - [{status_str}] Table '{table:<20}': SQLite = {exp:>8,}, PostgreSQL = {cnt:>8,}")

        print(f"\n  Total Rows: SQLite = {total_sqlite_rows:,} | Supabase PostgreSQL = {total_pg_rows:,}")
        if not parity_passed:
            print("[ERROR] Row count mismatch detected between SQLite and Supabase PostgreSQL!")
            conn_pg.rollback()
            conn_pg.close()
            conn_sqlite.close()
            return False

        # 5. Foreign Key & Primary Key Integrity Check
        print("\n[STEP 4/4] Validating Referential & Primary Key Integrity on Supabase PostgreSQL...")
        
        # Test orphan FKs
        cur_pg.execute("""
            SELECT COUNT(*) FROM drug_target dt
            LEFT JOIN drugs d ON dt.drug_id = d.id
            WHERE d.id IS NULL
        """)
        orphan_dt = cur_pg.fetchone()[0]

        cur_pg.execute("""
            SELECT COUNT(*) FROM target_disease td
            LEFT JOIN targets t ON td.target_id = t.id
            WHERE t.id IS NULL
        """)
        orphan_td = cur_pg.fetchone()[0]

        cur_pg.execute("""
            SELECT COUNT(*) FROM evidence e
            LEFT JOIN drugs d ON e.drug_id = d.id
            WHERE d.id IS NULL
        """)
        orphan_ev = cur_pg.fetchone()[0]

        print(f"  - Orphan drug_target FK references : {orphan_dt}")
        print(f"  - Orphan target_disease FK references: {orphan_td}")
        print(f"  - Orphan evidence FK references      : {orphan_ev}")

        if orphan_dt > 0 or orphan_td > 0 or orphan_ev > 0:
            print("[ERROR] Foreign key violations detected in Supabase PostgreSQL!")
            conn_pg.close()
            conn_sqlite.close()
            return False

        print("\n" + "=" * 80)
        print("MIGRATION TO SUPABASE POSTGRESQL COMPLETED SUCCESSFULLY (100% PARITY)")
        print("=" * 80)

        conn_pg.close()
        conn_sqlite.close()
        return True

    except Exception as e:
        print(f"\n[ERROR] Migration failed with exception: {e}")
        conn_pg.rollback()
        conn_pg.close()
        conn_sqlite.close()
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PRISM-Rx Safe SQLite to Supabase PostgreSQL Migration Tool")
    parser.add_argument("--dry-run", action="store_true", help="Perform dry run audit without executing migration")
    args = parser.parse_args()

    success = migrate_data(dry_run=args.dry_run)
    sys.exit(0 if success else 1)
