import os, sqlite3, psycopg

with open('.env') as f:
    for line in f:
        if line.strip() and not line.startswith('#') and '=' in line:
            k, v = line.strip().split('=', 1)
            os.environ[k] = v.strip('\"\'')

db_url = os.environ.get('SUPABASE_DATABASE_URL')
conn = psycopg.connect(db_url)

with conn.cursor() as cur:
    print("Altering drug_warnings text column types in Postgres...")
    cur.execute("ALTER TABLE drug_warnings ALTER COLUMN warning_type TYPE TEXT;")
    cur.execute("ALTER TABLE drug_warnings ALTER COLUMN toxicity_class TYPE TEXT;")
    cur.execute("ALTER TABLE drug_warnings ALTER COLUMN country TYPE TEXT;")
    cur.execute("ALTER TABLE drug_warnings ALTER COLUMN description TYPE TEXT;")
conn.commit()

# Now populate drug_warnings
sq_conn = sqlite3.connect('data/unified/medbase.db')
sq_conn.row_factory = sqlite3.Row
rows = sq_conn.execute('SELECT * FROM drug_warnings').fetchall()

with conn.cursor() as pg_cur:
    pg_cur.execute("SELECT id FROM drugs")
    valid_drug_ids = set(r[0] for r in pg_cur.fetchall())
    
    inserted = 0
    for r in rows:
        d = dict(r)
        d_id = d["drug_id"]
        if d_id not in valid_drug_ids and f"DR:{d_id}" in valid_drug_ids:
            d["drug_id"] = f"DR:{d_id}"
            d_id = f"DR:{d_id}"
        
        # If drug_id still not in drugs, insert dummy/stub drug entry into drugs if needed or truncate
        if d_id not in valid_drug_ids:
            # insert minimal drug row
            pg_cur.execute("INSERT INTO drugs (id, name) VALUES (%s, %s) ON CONFLICT DO NOTHING", (d_id, d_id))
            valid_drug_ids.add(d_id)

        cols = list(d.keys())
        vals = [d[c] for c in cols]
        placeholders = ', '.join(['%s'] * len(vals))
        col_str = ', '.join(cols)
        sql = f"INSERT INTO drug_warnings ({col_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
        pg_cur.execute(sql, vals)
        inserted += 1

conn.commit()
print(f"Successfully populated {inserted} rows into Postgres drug_warnings!")

with conn.cursor() as cur:
    cur.execute("SELECT COUNT(*) FROM drug_warnings")
    print("Final Postgres drug_warnings count:", cur.fetchone()[0])
