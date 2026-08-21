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
sq_drug_ids = set(r[0] for r in sq_conn.execute('SELECT id FROM drugs').fetchall())

with conn.cursor() as cur:
    cur.execute('SELECT id FROM drugs')
    pg_drug_ids = set(r[0] for r in cur.fetchall())

extra = pg_drug_ids - sq_drug_ids
print('Extra drug IDs in Postgres:', extra)

if extra:
    with conn.cursor() as cur:
        for eid in extra:
            cur.execute('DELETE FROM drug_warnings WHERE drug_id = %s', (eid,))
            cur.execute('DELETE FROM drugs WHERE id = %s', (eid,))
    conn.commit()
    print('Cleaned up extra drugs!')

with conn.cursor() as cur:
    cur.execute('SELECT COUNT(*) FROM drugs')
    print('Final Postgres drugs count:', cur.fetchone()[0])
    cur.execute('SELECT COUNT(*) FROM drug_warnings')
    print('Final Postgres drug_warnings count:', cur.fetchone()[0])
