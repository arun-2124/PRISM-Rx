import sqlite3
import json
from pathlib import Path

DB_PATH = Path("data/unified/medbase.db")

def audit_inventory():
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cursor.fetchall()]

    inventory = {}

    for t in sorted(tables):
        # Row count
        cursor.execute(f"SELECT COUNT(*) FROM {t}")
        row_cnt = cursor.fetchone()[0]

        # Table info (columns, types, pk)
        cursor.execute(f"PRAGMA table_info({t})")
        cols = cursor.fetchall()
        col_list = [{"cid": c[0], "name": c[1], "type": c[2], "notnull": c[3], "dflt_value": c[4], "pk": c[5]} for c in cols]

        # Foreign keys
        cursor.execute(f"PRAGMA foreign_key_list({t})")
        fks = cursor.fetchall()
        fk_list = [{"id": f[0], "seq": f[1], "table": f[2], "from": f[3], "to": f[4]} for f in fks]

        # Indexes
        cursor.execute(f"PRAGMA index_list({t})")
        idxs = cursor.fetchall()
        idx_list = []
        for idx in idxs:
            idx_name = idx[1]
            cursor.execute(f"PRAGMA index_info({idx_name})")
            idx_cols = [ic[2] for ic in cursor.fetchall()]
            idx_list.append({"name": idx_name, "unique": idx[2], "columns": idx_cols})

        inventory[t] = {
            "row_count": row_cnt,
            "columns": col_list,
            "foreign_keys": fk_list,
            "indexes": idx_list,
        }

    conn.close()

    print(f"=======================================================")
    print(f"MEDBASE.DB INVENTORY AUDIT ({len(inventory)} TABLES)")
    print(f"=======================================================")
    for tname, details in inventory.items():
        print(f"\nTABLE: `{tname}` ({details['row_count']:,} rows)")
        print(f"  Columns ({len(details['columns'])}):")
        for c in details["columns"]:
            pk_str = " [PRIMARY KEY]" if c["pk"] else ""
            print(f"    - {c['name']} ({c['type']}){pk_str}")
        if details["foreign_keys"]:
            print(f"  Foreign Keys ({len(details['foreign_keys'])}):")
            for fk in details["foreign_keys"]:
                print(f"    - {fk['from']} -> {fk['table']}({fk['to']})")
        if details["indexes"]:
            print(f"  Indexes ({len(details['indexes'])}):")
            for idx in details["indexes"]:
                u_str = "UNIQUE " if idx["unique"] else ""
                print(f"    - {u_str}{idx['name']} on ({', '.join(idx['columns'])})")

if __name__ == "__main__":
    audit_inventory()
