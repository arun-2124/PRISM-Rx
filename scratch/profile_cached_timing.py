import time, urllib.request, json

def test_endpoint(url, label):
    t0 = time.time()
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    res = urllib.request.urlopen(req)
    t1 = time.time()
    data = json.loads(res.read().decode())
    print(f"[{label}] HTTP {res.getcode()} in {(t1-t0)*1000:.1f} ms")

print("--- COLD VS CACHED SPEED PROFILER ---")

print("\n1st Call (Cold / Fill Cache):")
test_endpoint("http://localhost:8000/api/signal-intelligence/emerging", "GET /emerging (cold)")
test_endpoint("http://localhost:8000/api/signal-intelligence/latent", "GET /latent (cold)")

print("\n2nd Call (Cached / Server TTL Cache):")
test_endpoint("http://localhost:8000/api/signal-intelligence/emerging", "GET /emerging (cached)")
test_endpoint("http://localhost:8000/api/signal-intelligence/latent", "GET /latent (cached)")

print("\n3rd Call (Cached / Server TTL Cache):")
test_endpoint("http://localhost:8000/api/signal-intelligence/emerging", "GET /emerging (cached)")
test_endpoint("http://localhost:8000/api/signal-intelligence/latent", "GET /latent (cached)")
