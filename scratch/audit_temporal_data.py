import sqlite3
import json
from pathlib import Path

DB_PATH = Path("data/unified/medbase.db")

def audit_temporal_fields():
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cursor.fetchall()]

    temporal_summary = []

    for t in sorted(tables):
        cursor.execute(f"PRAGMA table_info({t})")
        cols = cursor.fetchall()
        
        date_cols = []
        for c in cols:
            col_name = c[1]
            if any(k in col_name.lower() for k in ['date', 'time', 'year', 'retrieved', 'created']):
                date_cols.append(col_name)

        cursor.execute(f"SELECT COUNT(*) FROM {t}")
        total_rows = cursor.fetchone()[0]

        for dc in date_cols:
            cursor.execute(f"SELECT COUNT(*) FROM {t} WHERE {dc} IS NOT NULL AND {dc} != ''")
            non_null_cnt = cursor.fetchone()[0]

            cursor.execute(f"SELECT {dc} FROM {t} WHERE {dc} IS NOT NULL AND {dc} != '' LIMIT 3")
            samples = [str(r[0]) for r in cursor.fetchall()]

            temporal_summary.append({
                "table": t,
                "date_column": dc,
                "total_rows": total_rows,
                "non_null_count": non_null_cnt,
                "pct_populated": round((non_null_cnt / total_rows * 100), 2) if total_rows > 0 else 0,
                "sample_values": samples,
            })

    conn.close()

    print("=======================================================")
    print("TEMPORAL DATA AUDIT ACROSS MEDBASE.DB")
    print("=======================================================")
    print(f"{'Table':<20} | {'Date Field':<22} | {'Populated Rows':<18} | {'% Populated':<12} | Sample Values")
    print("-" * 115)
    for r in temporal_summary:
        samples_str = ", ".join(r["sample_values"])
        print(f"{r['table']:<20} | {r['date_column']:<22} | {r['non_null_count']:,} / {r['total_rows']:,} | {r['pct_populated']:<12.1f}% | {samples_str[:35]}")

if __name__ == "__main__":
    audit_temporal_fields()
