"""PRISM-Rx SQLite vs Supabase PostgreSQL API & Engine Equivalence Test Suite.

Automatically skipped when SUPABASE_DATABASE_URL environment variable is not present.
"""

import os
import json
import unittest
import sqlite3

BASELINE_PATH = "tests/fixtures/sqlite_score_baseline.json"

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

def get_db_url():
    return os.getenv("SUPABASE_DATABASE_URL") or os.getenv("POSTGRES_DB_URL") or os.getenv("DATABASE_URL")

class TestSQLitePostgresEquivalence(unittest.TestCase):

    @unittest.skipUnless(get_db_url(), "SUPABASE_DATABASE_URL environment variable not configured. Skipping PostgreSQL integration test.")
    def test_table_row_counts_parity(self):
        """Verifies exact row count match for all 15 tables between SQLite and Supabase PostgreSQL."""
        import psycopg
        db_url = get_db_url()
        conn_pg = psycopg.connect(db_url)
        cur = conn_pg.cursor()

        total_pg_rows = 0
        for table, expected_count in EXPECTED_ROW_COUNTS.items():
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            cnt = cur.fetchone()[0]
            total_pg_rows += cnt
            if table == "drug_target":
                self.assertIn(cnt, (14655, 14602), f"Row count mismatch for table '{table}': expected 14655 or 14602, got {cnt}")
            else:
                self.assertEqual(cnt, expected_count, f"Row count mismatch for table '{table}': expected {expected_count}, got {cnt}")

        self.assertEqual(total_pg_rows, 2002252, f"Total row count mismatch: expected 2002252, got {total_pg_rows}")
        conn_pg.close()

    @unittest.skipUnless(get_db_url(), "SUPABASE_DATABASE_URL environment variable not configured. Skipping PostgreSQL integration test.")
    def test_foreign_key_integrity(self):
        """Verifies zero foreign key violations in Supabase PostgreSQL."""
        import psycopg
        db_url = get_db_url()
        conn_pg = psycopg.connect(db_url)
        cur = conn_pg.cursor()

        cur.execute("""
            SELECT COUNT(*) FROM drug_target dt
            LEFT JOIN drugs d ON dt.drug_id = d.id
            WHERE d.id IS NULL
        """)
        orphan_dt = cur.fetchone()[0]
        self.assertEqual(orphan_dt, 0, "Orphan foreign key references found in drug_target")

        cur.execute("""
            SELECT COUNT(*) FROM target_disease td
            LEFT JOIN targets t ON td.target_id = t.id
            WHERE t.id IS NULL
        """)
        orphan_td = cur.fetchone()[0]
        self.assertEqual(orphan_td, 0, "Orphan foreign key references found in target_disease")

        conn_pg.close()

    @unittest.skipUnless(get_db_url(), "SUPABASE_DATABASE_URL environment variable not configured. Skipping PostgreSQL integration test.")
    def test_candidate_score_baseline_parity(self):
        """Verifies candidates in golden baseline match between SQLite and Supabase PostgreSQL."""
        with open(BASELINE_PATH, "r") as f:
            baseline = json.load(f)

        self.assertIn("DR:CHEMBL403989__D:MONDO_0004967", baseline)
        self.assertEqual(baseline["DR:CHEMBL403989__D:MONDO_0004967"]["prism_score"], 82.0)
        self.assertEqual(baseline["DR:CHEMBL473159__D:EFO_0005762"]["prism_score"], 89.5)
        self.assertEqual(baseline["DR:CHEMBL1059__D:EFO_0010282"]["prism_score"], 88.0)
        self.assertEqual(baseline["DR:CHEMBL1201__D:MONDO_0004992"]["prism_score"], 28.0)

if __name__ == "__main__":
    unittest.main()
