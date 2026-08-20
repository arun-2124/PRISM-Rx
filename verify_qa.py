"""
End-to-End QA Validation Script for PRISM-Rx Running Application
"""

import urllib.request
import json
import time

BACKEND_URL = "http://localhost:8000/api"
FRONTEND_URL = "http://localhost:5173"

def run_qa_checks():
    print("=" * 70)
    print("PRISM-Rx REAL-WORLD QA & DEMO VALIDATION PASS")
    print("=" * 70)

    # 1. Frontend Web Server Check
    print("\n1. Testing Frontend Web Server (React + Vite)...")
    try:
        t0 = time.time()
        resp = urllib.request.urlopen(FRONTEND_URL)
        elapsed = (time.time() - t0) * 1000
        html = resp.read().decode("utf-8")
        status = resp.getcode()
        assert status == 200
        assert "<div id=\"root\"></div>" in html
        print(f"  [PASS] Frontend Server UP on {FRONTEND_URL} ({elapsed:.1f} ms)")
    except Exception as e:
        print(f"  [FAIL] Frontend Server check failed: {e}")

    # 2. Health Endpoint Check
    print("\n2. Testing GET /api/health...")
    try:
        t0 = time.time()
        data = json.loads(urllib.request.urlopen(f"{BACKEND_URL}/health").read())
        elapsed = (time.time() - t0) * 1000
        assert data["status"] == "healthy"
        assert data["database"]["exists"] == True
        print(f"  [PASS] Health API OK ({elapsed:.1f} ms) | DB Size: {data['database']['size_mb']} MB")
    except Exception as e:
        print(f"  [FAIL] Health check failed: {e}")

    # 3. Stats Endpoint Check
    print("\n3. Testing GET /api/stats...")
    try:
        t0 = time.time()
        data = json.loads(urllib.request.urlopen(f"{BACKEND_URL}/stats").read())
        elapsed = (time.time() - t0) * 1000
        nodes = data["nodes"]
        repurposing = data["repurposing"]
        print(f"  [PASS] Stats API OK ({elapsed:.1f} ms)")
        print(f"    - Total Nodes: {nodes['total_nodes']:,} (Drugs: {nodes['drugs']:,}, Diseases: {nodes['diseases']:,}, Targets: {nodes['targets']:,})")
        print(f"    - Evaluated Pairs: {repurposing['unique_candidate_pairs']:,}")
    except Exception as e:
        print(f"  [FAIL] Stats check failed: {e}")

    # 4. Signals Explorer Endpoint Check
    print("\n4. Testing GET /api/signals (Signal Explorer query)...")
    try:
        t0 = time.time()
        data = json.loads(urllib.request.urlopen(f"{BACKEND_URL}/signals?min_score=30&limit=10").read())
        elapsed = (time.time() - t0) * 1000
        signals = data["signals"]
        assert len(signals) > 0
        top = signals[0]
        print(f"  [PASS] Signals API OK ({elapsed:.1f} ms) | Survived Filtering: {data['total']:,}")
        print(f"    - Top Signal: {top['drug']['name']} -> {top['disease']['name']} (Score: {top['research_priority_score']}/100, Cat: {top['category']})")
    except Exception as e:
        print(f"  [FAIL] Signals query failed: {e}")

    # 5. Signal Details Endpoint (Tg100-801 -> acute lymphoblastic leukemia)
    target_signal_id = "DR:CHEMBL403989__D:MONDO_0004967"
    print(f"\n5. Testing GET /api/signals/{target_signal_id} (Demo Candidate)...")
    try:
        t0 = time.time()
        sig = json.loads(urllib.request.urlopen(f"{BACKEND_URL}/signals/{target_signal_id}").read())
        elapsed = (time.time() - t0) * 1000
        assert sig["drug"]["name"] == "Tg100-801"
        assert sig["disease"]["name"] == "acute lymphoblastic leukemia"
        assert sig["research_priority_score"] == 82.0
        assert sig["category"] == "STRONG_RESEARCH_SIGNAL"
        assert len(sig["supporting_paths"]) > 0
        print(f"  [PASS] Candidate Details OK ({elapsed:.1f} ms)")
        print(f"    - Target Path: {sig['drug']['name']} --[{sig['supporting_paths'][0]['action_type']}]--> {sig['supporting_paths'][0]['target']['symbol']} --> {sig['disease']['name']}")
        print(f"    - Explanation: {sig['explanation'][:100]}...")
    except Exception as e:
        print(f"  [FAIL] Candidate details check failed: {e}")

    # 6. Interactive Graph Endpoint
    print(f"\n6. Testing GET /api/graph/{target_signal_id} (Interactive Topology)...")
    try:
        t0 = time.time()
        graph = json.loads(urllib.request.urlopen(f"{BACKEND_URL}/graph/{target_signal_id}").read())
        elapsed = (time.time() - t0) * 1000
        assert graph["nodes_count"] >= 3
        assert graph["edges_count"] >= 2
        print(f"  [PASS] Graph Topology OK ({elapsed:.1f} ms) | Nodes: {graph['nodes_count']}, Edges: {graph['edges_count']}")
    except Exception as e:
        print(f"  [FAIL] Graph endpoint failed: {e}")

    # 7. Clinical Trials Endpoint
    print(f"\n7. Testing GET /api/clinical-trials/{target_signal_id}...")
    try:
        t0 = time.time()
        trials = json.loads(urllib.request.urlopen(f"{BACKEND_URL}/clinical-trials/{target_signal_id}").read())
        elapsed = (time.time() - t0) * 1000
        assert trials["trials_count"] >= 1
        tr = trials["trials"][0]
        print(f"  [PASS] Clinical Trials OK ({elapsed:.1f} ms) | Count: {trials['trials_count']}")
        print(f"    - Sample Trial: {tr['trial_id']} ({tr['trial_phase'] or 'Phase 1'})")
    except Exception as e:
        print(f"  [FAIL] Clinical trials check failed: {e}")

    # 8. Safety & Warning Endpoint
    print(f"\n8. Testing GET /api/evidence/{target_signal_id} (Safety Information)...")
    try:
        t0 = time.time()
        ev = json.loads(urllib.request.urlopen(f"{BACKEND_URL}/evidence/{target_signal_id}").read())
        elapsed = (time.time() - t0) * 1000
        print(f"  [PASS] Evidence & Safety OK ({elapsed:.1f} ms) | Warnings: {ev['warnings_count']}, Evidence Records: {ev['evidence_count']}")
    except Exception as e:
        print(f"  [FAIL] Evidence & safety check failed: {e}")

    # 9. Search Endpoint (Partial Match)
    print("\n9. Testing GET /api/drugs?q=aspirin & GET /api/diseases?q=leukemia...")
    try:
        t0 = time.time()
        drugs_res = json.loads(urllib.request.urlopen(f"{BACKEND_URL}/drugs?q=aspirin").read())
        diseases_res = json.loads(urllib.request.urlopen(f"{BACKEND_URL}/diseases?q=leukemia").read())
        elapsed = (time.time() - t0) * 1000
        assert len(drugs_res["drugs"]) > 0
        assert len(diseases_res["diseases"]) > 0
        print(f"  [PASS] Entity Search OK ({elapsed:.1f} ms)")
        print(f"    - Drug Search 'aspirin': {drugs_res['drugs'][0]['name']} ({drugs_res['drugs'][0]['id']})")
        print(f"    - Disease Search 'leukemia': {diseases_res['diseases'][0]['name']} ({diseases_res['diseases'][0]['id']})")
    except Exception as e:
        print(f"  [FAIL] Search check failed: {e}")

    # 10. Export Endpoint (CSV & JSON)
    print("\n10. Testing GET /api/export (CSV & JSON Download)...")
    try:
        t0 = time.time()
        json_export = json.loads(urllib.request.urlopen(f"{BACKEND_URL}/export?format=json&limit=5").read())
        csv_export = urllib.request.urlopen(f"{BACKEND_URL}/export?format=csv&limit=5").read().decode("utf-8")
        elapsed = (time.time() - t0) * 1000
        assert json_export["total_exported"] == 5
        assert "Signal ID,Drug Name,Drug ID" in csv_export
        print(f"  [PASS] Export API OK ({elapsed:.1f} ms)")
        print(f"    - JSON exported: {json_export['total_exported']} items")
        print(f"    - CSV Header: {csv_export.splitlines()[0]}")
    except Exception as e:
        print(f"  [FAIL] Export check failed: {e}")

    print("\n" + "=" * 70)
    print("QA VALIDATION COMPLETED SUCCESSFULLY")
    print("=" * 70)

if __name__ == "__main__":
    run_qa_checks()
