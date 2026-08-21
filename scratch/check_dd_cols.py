import sqlite3
from pathlib import Path

DB_PATH = Path("data/unified/medbase.db")

def check_dd_cols():
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(drug_disease)")
    for c in cursor.fetchall():
        print(c)
    conn.close()

if __name__ == "__main__":
    check_dd_cols()
