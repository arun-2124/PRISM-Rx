import requests
import time
from pathlib import Path
from tqdm import tqdm
import re

BASE_URL = "https://ftp.ebi.ac.uk/pub/databases/opentargets/platform/26.06/output"
RAW_DIR = Path("data/raw/opentargets")

DATASETS = [
    "clinical_report",
    "clinical_target",
    "drug_warning",
    "evidence_clinical_precedence",
    "association_overall_direct",
]

def download_parquet_files(dataset_name):
    """Download all parquet files from a dataset directory."""
    dir_url = f"{BASE_URL}/{dataset_name}"
    local_dir = RAW_DIR / dataset_name
    local_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n{'='*60}")
    print(f"Dataset: {dataset_name}")
    print(f"{'='*60}")
    
    try:
        resp = requests.get(dir_url, timeout=30)
        resp.raise_for_status()
        links = re.findall(r'href="([^"]+)"', resp.text)
        parquet_files = [l for l in links if l.endswith(".parquet") and not l.startswith("?") and l != "../"]
        
        if not parquet_files:
            print(f"  No parquet files found!")
            return
        
        print(f"  Found {len(parquet_files)} files")
        total_size = 0
        
        for filename in parquet_files:
            local_path = local_dir / filename
            file_url = f"{dir_url}/{filename}"
            
            if local_path.exists():
                size = local_path.stat().st_size
                if size > 1000:
                    print(f"  Skip (exists): {filename} ({size/1024/1024:.1f} MB)")
                    total_size += size
                    continue
            
            print(f"  Download: {filename}...")
            try:
                r = requests.get(file_url, stream=True, timeout=600)
                r.raise_for_status()
                total = int(r.headers.get('content-length', 0))
                with open(local_path, 'wb') as f:
                    with tqdm(total=total, unit='B', unit_scale=True, desc=f"  {filename[:40]}") as pbar:
                        for chunk in r.iter_content(chunk_size=8192*32):
                            f.write(chunk)
                            pbar.update(len(chunk))
                file_size = local_path.stat().st_size
                total_size += file_size
                print(f"  OK: {file_size/1024/1024:.1f} MB")
                time.sleep(1)
            except Exception as e:
                print(f"  ERROR: {e}")
                if local_path.exists():
                    local_path.unlink()
        
        print(f"  Total: {total_size/1024/1024:.1f} MB")
    except Exception as e:
        print(f"  FAILED: {e}")

if __name__ == "__main__":
    for ds in DATASETS:
        download_parquet_files(ds)
    print("\nDone!")
