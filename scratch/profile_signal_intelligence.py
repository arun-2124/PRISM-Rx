import time, urllib.request, json

def measure(url, name):
    t0 = time.time()
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        res = urllib.request.urlopen(req, timeout=30)
        data = json.loads(res.read().decode())
        t1 = time.time()
        elapsed = t1 - t0
        print(f"[{name}] HTTP {res.getcode()} in {elapsed:.3f}s")
        return elapsed, data
    except Exception as e:
        t1 = time.time()
        print(f"[{name}] FAILED in {t1-t0:.3f}s: {e}")
        return t1 - t0, None

print("=== MEASURING CURRENT SIGNAL INTELLIGENCE BASELINE API PERFORMANCES ===")
measure("http://localhost:8000/api/signal-intelligence/emerging", "GET /emerging")
measure("http://localhost:8000/api/signal-intelligence/latent", "GET /latent")
measure("http://localhost:8000/api/signal-intelligence/DR%3ACHEMBL403989__D%3AMONDO_0004967", "GET /candidate-detail")
