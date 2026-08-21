import os, psycopg

env_vars = {}
if os.path.exists('.env'):
    with open('.env') as f:
        for line in f:
            if line.strip() and not line.startswith('#') and '=' in line:
                k, v = line.strip().split('=', 1)
                os.environ[k] = v.strip('\"\'')

db_url = os.environ.get('SUPABASE_DATABASE_URL')
conn = psycopg.connect(db_url)
cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM drug_warnings;')
count = cur.fetchone()[0]
print('drug_warnings count in Supabase Postgres:', count)

if count == 0:
    print('Migrating drug_warnings from SQLite to Supabase Postgres...')
    import sqlite3
    sq_conn = sqlite3.connect('data/unified/medbase.db')
    sq_conn.row_factory = sqlite3.Row
    rows = sq_conn.execute('SELECT * FROM drug_warnings').fetchall()
    print(f'Found {len(rows)} rows in SQLite drug_warnings.')
    
    with conn.cursor() as pg_cur:
        for r in rows:
            d = dict(r)
            cols = list(d.keys())
            vals = [d[c] for c in cols]
            placeholders = ', '.join(['%s'] * len(vals))
            col_str = ', '.join(cols)
            sql = f'INSERT INTO drug_warnings ({col_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING'
            pg_cur.execute(sql, vals)
    conn.commit()
    print('Migration complete!')
    cur.execute('SELECT COUNT(*) FROM drug_warnings;')
    print('New count in Postgres:', cur.fetchone()[0])
