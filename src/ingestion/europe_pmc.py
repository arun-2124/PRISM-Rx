import urllib.request
import urllib.parse
import json
import sqlite3
import hashlib
import time
from datetime import datetime

DB_PATH = 'data/unified/medbase.db'

def fetch_europe_pmc_events(query: str, drug_id: str = None, disease_id: str = None, limit: int = 5):
    """Incremental fetcher from Europe PMC REST API inserting records into evidence_events."""
    encoded_query = urllib.parse.quote(query)
    url = f"https://www.ebi.ac.uk/europepmc/webservices/rest/search?query={encoded_query}&format=json&pageSize={limit}"

    req = urllib.request.Request(url, headers={'User-Agent': 'PRISM-Rx/3.0 (Biotech Intelligence)'})
    
    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            results = data.get('resultList', {}).get('result', [])

            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            events_added = 0

            for pub in results:
                title = pub.get('title', 'Biomedical Publication')
                pub_id = pub.get('id', str(time.time()))
                source = pub.get('pubType', 'Europe PMC Literature')
                pub_date = pub.get('firstPublicationDate', datetime.now().strftime('%Y-%m-%d'))
                url_link = f"https://europepmc.org/article/{pub.get('source', 'MED')}/{pub_id}"

                content_string = f"{pub_id}_{title}_{drug_id}_{disease_id}"
                content_hash = hashlib.sha256(content_string.encode('utf-8')).hexdigest()

                event_type = "NEW_PREPRINT" if "biorxiv" in source.lower() or "preprint" in source.lower() else "NEW_PUBLICATION"

                try:
                    cursor.execute("""
                        INSERT OR IGNORE INTO evidence_events (
                            id, source, source_record_id, event_type, drug_id, disease_id,
                            publication_date, detected_at, title, url, content_hash
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        f"EV_{pub_id}", source, pub_id, event_type, drug_id, disease_id,
                        pub_date, datetime.now().isoformat(), title, url_link, content_hash
                    ))
                    if cursor.rowcount > 0:
                        events_added += 1
                except Exception as e:
                    pass

            conn.commit()
            conn.close()
            return events_added
    except Exception as err:
        print(f"Europe PMC fetch error: {err}")
        return 0

if __name__ == '__main__':
    added = fetch_europe_pmc_events("Tg100-801 acute lymphoblastic leukemia", "DR:CHEMBL403989", "D:MONDO_0004967")
    print(f"Fetched and added {added} new Europe PMC events to evidence_events table.")
