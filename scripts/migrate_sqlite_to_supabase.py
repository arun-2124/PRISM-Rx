"""PRISM-Rx SQLite to Supabase PostgreSQL Migration Script (PREPARATION TOOLING ONLY).

DO NOT EXECUTE IN PRODUCTION UNTIL POSTGRESQL INSTANCE IS PROVISIONED.

Usage:
  python scripts/migrate_sqlite_to_supabase.py --dry-run
"""

import os
import sys
import argparse
import sqlite3
from typing import Dict, Any

SQLITE_DB_PATH = "data/unified/medbase.db"

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

def migrate_data(dry_run: bool = True):
    print("=" * 70)
    print("PRISM-Rx SQLITE TO SUPABASE MIGRATION SCRIPT")
    print(f"Mode: {'DRY RUN (NO MIGRATION EXECUTED)' if dry_run else 'LIVE EXECUTION'}")
    print("=" * 70)

    if not os.path.exists(SQLITE_DB_PATH):
        print(f"[ERROR] Source SQLite database '{SQLITE_DB_PATH}' not found.")
        return False

    conn_sqlite = sqlite3.connect(SQLITE_DB_PATH)
    conn_sqlite.row_factory = sqlite3.Row

    # Table Row Audit
    row_counts: Dict[str, int] = {}
    for table in TABLES_ORDER:
        cnt = conn_sqlite.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        row_counts[table] = cnt

    print("\nSource SQLite Table Row Inventory:")
    total_rows = 0
    for t, cnt in row_counts.items():
        print(f"  - {t:<22}: {cnt:>10,} rows")
        total_rows += cnt
    print(f"  {'TOTAL ROWS':<22}: {total_rows:>10,} rows\n")

    if dry_run:
        print("[DRY-RUN CONFIRMED] Source SQLite database remains 100% untouched.")
        print("To execute real migration, provision POSTGRES_DB_URL environment variable and remove --dry-run flag.")
        conn_sqlite.close()
        return True

    db_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_DB_URL")
    if not db_url:
        print("[ERROR] DATABASE_URL or POSTGRES_DB_URL environment variable not set.")
        conn_sqlite.close()
        return False

    try:
        import psycopg
    except ImportError:
        print("[ERROR] 'psycopg' library not installed. Add psycopg[binary] to requirements.txt.")
        conn_sqlite.close()
        return False

    conn_sqlite.close()
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PRISM-Rx SQLite to Supabase Migration Tool")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Perform dry run audit without executing migration")
    args = parser.parse_args()

    success = migrate_data(dry_run=args.dry_run)
    sys.exit(0 if success else 1)
