import sqlite3
from pathlib import Path

DB_PATH = Path("data/unified/medbase.db")

def sample_dd():
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute("""
        SELECT dd.drug_id, d.name as drug_name, dd.disease_id, dis.name as disease_name, dd.max_clinical_stage
        FROM drug_disease dd
        JOIN drugs d ON dd.drug_id = d.id
        JOIN diseases dis ON dd.disease_id = dis.id
        LIMIT 10
    """)
    for r in cursor.fetchall():
        print(r)
    conn.close()

if __name__ == "__main__":
    sample_dd()
