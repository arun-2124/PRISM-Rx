import urllib.request, urllib.parse, json

candidates = [
    ('Tg100-801 -> acute lymphoblastic leukemia', 'DR:CHEMBL403989__D:MONDO_0004967'),
    ('Phloroglucinol -> neuropathic pain', 'DR:CHEMBL473159__D:EFO_0005762'),
    ('Pregabalin -> gastrointestinal disease', 'DR:CHEMBL1059__D:EFO_0010282')
]

print("=== VERIFYING 3 CANDIDATE SIGNAL DETAIL API ENDPOINTS ===")
for label, sid in candidates:
    url = 'http://localhost:8000/api/signals/' + urllib.parse.quote(sid)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    res = urllib.request.urlopen(req, timeout=10)
    data = json.loads(res.read().decode())
    drug_name = data.get('drug', {}).get('name')
    score = data.get('research_priority_score')
    print(f"[PASS] {label}: Drug={drug_name}, Score={score}")
