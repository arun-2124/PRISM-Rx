import sqlite3
from pathlib import Path

DB_PATH = Path("data/unified/medbase.db")

def audit_drivers_and_sources():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    drug_id = "DR:CHEMBL403989"
    disease_id = "D:MONDO_0004967"

    print("=======================================================")
    print("1. AUDIT DRUG_TARGET FOR TG100-801")
    print("=======================================================")
    dt_rows = cursor.execute("""
        SELECT dt.drug_id, dt.target_id, dt.action_type, dt.mechanism_of_action, t.approved_symbol, t.approved_name
        FROM drug_target dt
        JOIN targets t ON dt.target_id = t.id
        WHERE dt.drug_id = ?
    """, (drug_id,)).fetchall()
    for r in dt_rows:
        print(dict(r))

    print("\n=======================================================")
    print("2. AUDIT INDEPENDENT SOURCES FOR TG100-801")
    print("=======================================================")
    # Source 1: Open Targets (from target_disease and evidence)
    ot_cnt = cursor.execute("SELECT COUNT(*) FROM evidence WHERE drug_id = ?", (drug_id,)).fetchone()[0]
    # Source 2: ChEMBL (from drug_target mechanism of action)
    chembl_cnt = cursor.execute("SELECT COUNT(*) FROM drug_target WHERE drug_id = ?", (drug_id,)).fetchone()[0]
    # Source 3: ClinicalTrials.gov (from clinical_reports linked via evidence)
    trials_cnt = cursor.execute("""
        SELECT COUNT(DISTINCT cr.id) FROM evidence e
        JOIN clinical_reports cr ON e.clinical_report_id = cr.id
        WHERE e.drug_id = ?
    """, (drug_id,)).fetchone()[0]

    sources = []
    if ot_cnt > 0: sources.append("Open Targets Platform 26.06")
    if chembl_cnt > 0: sources.append("ChEMBL 33 Database")
    if trials_cnt > 0: sources.append("ClinicalTrials.gov")

    print(f"Verified Independent Sources ({len(sources)}):", sources)
    print(f"  - Open Targets evidence records: {ot_cnt}")
    print(f"  - ChEMBL drug-target mechanisms: {chembl_cnt}")
    print(f"  - ClinicalTrials.gov study reports: {trials_cnt}")

    conn.close()

if __name__ == "__main__":
    audit_drivers_and_sources()
