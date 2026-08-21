import os, sqlite3, psycopg

with open('.env') as f:
    for line in f:
        if line.strip() and not line.startswith('#') and '=' in line:
            k, v = line.strip().split('=', 1)
            os.environ[k] = v.strip('\"\'')

db_url = os.environ.get('SUPABASE_DATABASE_URL')
conn = psycopg.connect(db_url)

sq_conn = sqlite3.connect('data/unified/medbase.db')
sq_conn.row_factory = sqlite3.Row
rows = sq_conn.execute('SELECT * FROM drug_warnings').fetchall()

valid_inserted = 0
with conn.cursor() as pg_cur:
    # Fetch all drug IDs in Postgres
    pg_cur.execute("SELECT id FROM drugs")
    valid_drug_ids = set(r[0] for r in pg_cur.fetchall())
    print(f"Postgres drugs count: {len(valid_drug_ids)}")

    for r in rows:
        d = dict(r)
        d_id = d["drug_id"]
        # Match with or without DR: prefix
        if d_id not in valid_drug_ids and f"DR:{d_id}" in valid_drug_ids:
            d["drug_id"] = f"DR:{d_id}"
            d_id = f"DR:{d_id}"
        
        if d_id in valid_drug_ids:
            cols = list(d.keys())
            vals = [d[c] for c in cols]
            placeholders = ', '.join(['%s'] * len(vals))
            col_str = ', '.join(cols)
            sql = f"INSERT INTO drug_warnings ({col_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
            pg_cur.execute(sql, vals)
            valid_inserted += 1

conn.commit()
print(f"Successfully migrated {valid_inserted} drug_warnings rows into Postgres!")

with conn.cursor() as pg_cur:
    pg_cur.execute("SELECT COUNT(*) FROM drug_warnings")
    print("New Postgres drug_warnings count:", pg_cur.fetchone()[0])
