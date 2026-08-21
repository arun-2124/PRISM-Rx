import sqlite3
import json
import os

DB_PATH = 'data/unified/medbase.db'

def run_audit():
  conn = sqlite3.connect(DB_PATH)
  cursor = conn.cursor()
  
  # Tables
  cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
  tables = [r[0] for r in cursor.fetchall()]
  
  # Indexes
  cursor.execute("SELECT name, tbl_name FROM sqlite_master WHERE type='index';")
  indexes = cursor.fetchall()
  
  report = ["# PRISM-Rx Database Audit Report\n"]
  report.append(f"**Database File**: `{DB_PATH}`")
  report.append(f"**File Size**: {os.path.getsize(DB_PATH) / (1024*1024):.2f} MB")
  report.append(f"**Total Relational Tables**: {len(tables)}\n")
  
  table_stats = []
  for t in tables:
    cursor.execute(f"SELECT COUNT(*) FROM {t}")
    count = cursor.fetchone()[0]
    cursor.execute(f"PRAGMA table_info({t})")
    cols = cursor.fetchall()
    col_names = [c[1] for c in cols]
    table_stats.append({
      'table': t,
      'count': count,
      'columns': col_names,
    })
    report.append(f"### Table: `{t}`")
    report.append(f"- **Record Count**: {count:,}")
    report.append(f"- **Columns ({len(col_names)})**: `{', '.join(col_names)}`\n")
    
  report.append(f"## Index Coverage ({len(indexes)} Indexes)\n")
  for idx in indexes:
    report.append(f"- `{idx[0]}` on table `{idx[1]}`")
    
  os.makedirs('docs', exist_ok=True)
  with open('docs/database-audit.md', 'w') as f:
    f.write('\n'.join(report))
    
  print("Database audit generated successfully in docs/database-audit.md")
  conn.close()

if __name__ == '__main__':
  run_audit()
