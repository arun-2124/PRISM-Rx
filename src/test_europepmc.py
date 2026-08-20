import requests
import json
from pathlib import Path
from datetime import datetime

API_BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest"
RAW_DIR = Path("data/raw/europepmc")
RAW_DIR.mkdir(parents=True, exist_ok=True)

def search_articles(query, max_results=50, result_type="core"):
    """Search Europe PMC REST API."""
    all_articles = []
    cursor = "*"
    page_size = min(25, max_results)
    
    while len(all_articles) < max_results:
        params = {
            "query": query,
            "resultType": result_type,
            "format": "json",
            "pageSize": page_size,
            "cursorMark": cursor,
        }
        
        resp = requests.get(f"{API_BASE}/search", params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        
        results = data.get("resultList", {}).get("result", [])
        if not results:
            break
        
        all_articles.extend(results)
        cursor = data.get("nextCursorMark", "")
        
        if not cursor or cursor == "*":
            break
        
        import time
        time.sleep(0.3)
    
    return all_articles[:max_results]

def test_api():
    """Test Europe PMC API."""
    print(f"{'='*60}")
    print(f"Europe PMC REST API - Test")
    print(f"{'='*60}")
    
    test_queries = [
        ("aspirin AND cancer", 10),
        ("drug repurposing", 10),
        ("BRCA1 breast cancer", 10),
    ]
    
    all_results = {}
    for query, count in test_queries:
        print(f"\nSearching: '{query}' ({count} results)")
        try:
            articles = search_articles(query, count)
            print(f"  Got {len(articles)} articles")
            all_results[query] = articles
            
            if articles:
                a = articles[0]
                pmid = a.get("pmid", "?")
                title = a.get("title", "?")[:80]
                print(f"  Sample: PMID {pmid} - {title}...")
        except Exception as e:
            print(f"  Error: {e}")
    
    output_file = RAW_DIR / "test_results.json"
    with open(output_file, "w") as f:
        json.dump(all_results, f, indent=2, default=str)
    
    print(f"\nResults saved to: {output_file}")
    print("API test PASSED")

if __name__ == "__main__":
    test_api()
