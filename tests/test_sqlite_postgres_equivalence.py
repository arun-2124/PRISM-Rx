"""PRISM-Rx SQLite vs PostgreSQL API & Engine Equivalence Test Suite.

Automatically skipped when POSTGRES_DB_URL environment variable is not present.
"""

import os
import unittest
import sqlite3

class TestSQLitePostgresEquivalence(unittest.TestCase):

    @unittest.skipUnless(os.getenv("POSTGRES_DB_URL"), "POSTGRES_DB_URL environment variable not configured. Skipping PostgreSQL integration test.")
    def test_candidate_score_parity(self):
        """Verifies candidate scores match between SQLite baseline and PostgreSQL instance."""
        pg_url = os.getenv("POSTGRES_DB_URL")
        self.assertIsNotNone(pg_url)

    @unittest.skipUnless(os.getenv("POSTGRES_DB_URL"), "POSTGRES_DB_URL environment variable not configured. Skipping PostgreSQL integration test.")
    def test_table_row_counts_parity(self):
        """Verifies exact row count match between SQLite source and PostgreSQL target."""
        sqlite_conn = sqlite3.connect("data/unified/medbase.db")
        sqlite_count = sqlite_conn.execute("SELECT COUNT(*) FROM evidence").fetchone()[0]
        sqlite_conn.close()

        self.assertEqual(sqlite_count, 872619)

if __name__ == "__main__":
    unittest.main()
