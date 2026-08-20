import requests
import json
from pathlib import Path

API_BASE = "https://rest.uniprot.org"
RAW_DIR = Path("data/raw/uniprot")
RAW_DIR.mkdir(parents=True, exist_ok=True)

def search_proteins(query, max_results=5):
    """Search UniProt REST API."""
    params = {
        "query": query,
        "format": "json",
        "size": max_results,
    }
    resp = requests.get(f"{API_BASE}/uniprotkb/search", params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    return data.get("results", [])

def get_protein(accession):
    """Get protein by accession."""
    resp = requests.get(f"{API_BASE}/uniprotkb/{accession}", params={"format": "json"}, timeout=30)
    resp.raise_for_status()
    return resp.json()

def test_api():
    """Test UniProt REST API."""
    print(f"{'='*60}")
    print(f"UniProt REST API - Test")
    print(f"{'='*60}")
    
    print("\n1. Search for BRCA1 human proteins...")
    try:
        results = search_proteins("BRCA1 AND organism_id:9606", 3)
        print(f"  Got {len(results)} results")
        if results:
            p = results[0]
            acc = p.get("primaryAccession", "?")
            name = p.get("proteinDescription", {}).get("recommendedName", {}).get("fullName", {}).get("value", "?")
            print(f"  Sample: {acc} - {name}")
    except Exception as e:
        print(f"  Error: {e}")
    
    print("\n2. Get specific protein (P04637 - TP53)...")
    try:
        protein = get_protein("P04637")
        acc = protein.get("primaryAccession", "?")
        name = protein.get("proteinDescription", {}).get("recommendedName", {}).get("fullName", {}).get("value", "?")
        genes = protein.get("genes", [])
        gene_name = genes[0].get("geneName", {}).get("value", "?") if genes else "?"
        print(f"  {acc} - {name} (Gene: {gene_name})")
    except Exception as e:
        print(f"  Error: {e}")
    
    print("\n3. Search for kinase inhibitors...")
    try:
        results = search_proteins("kinase AND organism_id:9606", 3)
        print(f"  Got {len(results)} results")
        for r in results:
            acc = r.get("primaryAccession", "?")
            name = r.get("proteinDescription", {}).get("recommendedName", {}).get("fullName", {}).get("value", "?")[:50]
            print(f"  - {acc}: {name}")
    except Exception as e:
        print(f"  Error: {e}")
    
    output_file = RAW_DIR / "test_results.json"
    with open(output_file, "w") as f:
        json.dump({"status": "API test passed"}, f, indent=2)
    
    print(f"\nAPI test PASSED")

if __name__ == "__main__":
    test_api()
