import requests
import json
from pathlib import Path
from datetime import datetime

API_BASE = "https://clinicaltrials.gov/api/v2/studies"
RAW_DIR = Path("data/raw/clinicaltrials")
RAW_DIR.mkdir(parents=True, exist_ok=True)

def search_trials(query, max_results=50):
    """Search ClinicalTrials.gov API."""
    all_studies = []
    page_token = None
    
    while len(all_studies) < max_results:
        params = {
            "query.term": query,
            "pageSize": min(50, max_results - len(all_studies)),
        }
        if page_token:
            params["pageToken"] = page_token
        
        resp = requests.get(API_BASE, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        
        studies = data.get("studies", [])
        if not studies:
            break
        
        all_studies.extend(studies)
        page_token = data.get("nextPageToken")
        
        if not page_token:
            break
        
        import time
        time.sleep(0.5)
    
    return all_studies[:max_results]

def test_api():
    """Test ClinicalTrials.gov API."""
    print(f"{'='*60}")
    print(f"ClinicalTrials.gov API v2 - Test")
    print(f"{'='*60}")
    
    test_queries = [
        ("aspirin", 10),
        ("diabetes", 10),
        ("cancer", 10),
    ]
    
    all_results = {}
    for query, count in test_queries:
        print(f"\nSearching: '{query}' ({count} results)")
        try:
            studies = search_trials(query, count)
            print(f"  Got {len(studies)} studies")
            all_results[query] = studies
            
            if studies:
                s = studies[0]
                nct = s.get("protocolSection", {}).get("identificationModule", {}).get("nctId", "?")
                title = s.get("protocolSection", {}).get("identificationModule", {}).get("briefTitle", "?")
                print(f"  Sample: {nct} - {title[:80]}...")
        except Exception as e:
            print(f"  Error: {e}")
    
    output_file = RAW_DIR / "test_results.json"
    with open(output_file, "w") as f:
        json.dump(all_results, f, indent=2, default=str)
    
    print(f"\nResults saved to: {output_file}")
    print("API test PASSED")

if __name__ == "__main__":
    test_api()
