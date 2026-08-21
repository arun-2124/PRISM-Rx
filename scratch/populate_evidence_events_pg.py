import os, sqlite3, psycopg

if os.path.exists('.env'):
    with open('.env') as f:
        for line in f:
            if line.strip() and not line.startswith('#') and '=' in line:
                k, v = line.strip().split('=', 1)
                os.environ[k] = v.strip('\"\'')

db_url = os.environ.get('SUPABASE_DATABASE_URL')
conn = psycopg.connect(db_url)

sq_conn = sqlite3.connect('data/unified/medbase.db')
sq_conn.row_factory = sqlite3.Row
rows = sq_conn.execute('SELECT * FROM evidence_events').fetchall()

with conn.cursor() as pg_cur:
    inserted = 0
    for r in rows:
        d = dict(r)
        cols = list(d.keys())
        vals = [d[c] for c in cols]
        placeholders = ', '.join(['%s'] * len(vals))
        col_str = ', '.join(cols)
        sql = f"INSERT INTO evidence_events ({col_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
        pg_cur.execute(sql, vals)
        inserted += 1

conn.commit()
print(f"Successfully populated {inserted} evidence_events rows into Postgres!")

with conn.cursor() as cur:
    cur.execute("SELECT COUNT(*) FROM evidence_events")
    print("Final Postgres evidence_events count:", cur.fetchone()[0])
