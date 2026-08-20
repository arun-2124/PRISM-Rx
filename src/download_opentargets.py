import os
import requests
import time
from pathlib import Path
from tqdm import tqdm
import json
from datetime import datetime

BASE_URL = "https://ftp.ebi.ac.uk/pub/databases/opentargets/platform/26.06/output"
RAW_DIR = Path("data/raw/opentargets")
RAW_DIR.mkdir(parents=True, exist_ok=True)

DATASETS = [
    "disease",
    "target",
    "drug_molecule",
    "drug_mechanism_of_action",
    "clinical_indication",
    "clinical_report",
    "clinical_target",
    "drug_warning",
    "evidence_clinical_precedence",
    "association_overall_direct",
]

LOG_FILE = RAW_DIR / "download_log.json"
log_entries = []

def download_directory(dataset_name):
    """Download all files from an Open Targets dataset directory via HTTPS listing."""
    dir_url = f"{BASE_URL}/{dataset_name}"
    local_dir = RAW_DIR / dataset_name
    local_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"Downloading: {dataset_name}")
    print(f"URL: {dir_url}")
    print(f"Local: {local_dir}")
    print(f"{'='*60}")

    entry = {
        "source": "opentargets",
        "dataset": dataset_name,
        "url": dir_url,
        "source_version": "26.06",
        "download_date": datetime.now().isoformat(),
        "status": "pending",
        "files_downloaded": 0,
        "total_size_bytes": 0,
    }

    try:
        resp = requests.get(dir_url, timeout=30)
        resp.raise_for_status()
        
        import re
        links = re.findall(r'href="([^"]+)"', resp.text)
        links = [l for l in links if l.endswith(".parquet") or l.endswith(".json") or "/" in l]
        links = [l for l in links if not l.startswith("?") and l != "../"]
        
        if not links:
            print(f"  No files found, trying direct parquet download...")
            links = ["part-0.parquet"]

        files_to_download = []
        for link in links:
            if link.endswith("/"):
                sub_url = f"{dir_url}/{link.rstrip('/')}"
                sub_local = local_dir / link.rstrip("/")
                sub_local.mkdir(parents=True, exist_ok=True)
                try:
                    sub_resp = requests.get(sub_url, timeout=30)
                    sub_resp.raise_for_status()
                    sub_links = re.findall(r'href="([^"]+)"', sub_resp.text)
                    sub_links = [l for l in sub_links if l.endswith(".parquet") and not l.startswith("?") and l != "../"]
                    for sl in sub_links:
                        files_to_download.append((f"{link.rstrip('/')}/{sl}", sub_local / sl))
                except Exception as e:
                    print(f"  Warning: Could not list subdirectory {link}: {e}")
            elif link.endswith(".parquet"):
                files_to_download.append((link, local_dir / link))

        print(f"  Found {len(files_to_download)} parquet files")

        total_size = 0
        for filename, local_path in files_to_download:
            if local_path.exists():
                size = local_path.stat().st_size
                print(f"  Skipping (exists): {filename} ({size/1024/1024:.1f} MB)")
                total_size += size
                continue
            
            file_url = f"{dir_url}/{filename}"
            print(f"  Downloading: {filename}...")
            try:
                r = requests.get(file_url, stream=True, timeout=300)
                r.raise_for_status()
                
                total = int(r.headers.get('content-length', 0))
                with open(local_path, 'wb') as f:
                    with tqdm(total=total, unit='B', unit_scale=True, desc=f"  {filename}") as pbar:
                        for chunk in r.iter_content(chunk_size=8192*16):
                            f.write(chunk)
                            pbar.update(len(chunk))
                
                file_size = local_path.stat().st_size
                total_size += file_size
                entry["files_downloaded"] += 1
                print(f"  OK: {file_size/1024/1024:.1f} MB")
                
                time.sleep(1)
            except Exception as e:
                print(f"  ERROR downloading {filename}: {e}")
                if local_path.exists():
                    local_path.unlink()

        entry["total_size_bytes"] = total_size
        entry["status"] = "success"
        print(f"  Total: {total_size/1024/1024:.1f} MB")
        
    except Exception as e:
        entry["status"] = "failed"
        entry["error"] = str(e)
        print(f"  FAILED: {e}")

    log_entries.append(entry)
    return entry

if __name__ == "__main__":
    print(f"Open Targets 26.06 Download")
    print(f"Datasets: {len(DATASETS)}")
    print(f"Base URL: {BASE_URL}")
    print(f"Local dir: {RAW_DIR.absolute()}")
    
    for ds in DATASETS:
        download_directory(ds)
    
    with open(LOG_FILE, "w") as f:
        json.dump(log_entries, f, indent=2)
    
    print(f"\n{'='*60}")
    print("DOWNLOAD SUMMARY")
    print(f"{'='*60}")
    success = sum(1 for e in log_entries if e["status"] == "success")
    failed = sum(1 for e in log_entries if e["status"] == "failed")
    total_bytes = sum(e.get("total_size_bytes", 0) for e in log_entries)
    print(f"Success: {success}/{len(DATASETS)}")
    print(f"Failed: {failed}/{len(DATASETS)}")
    print(f"Total downloaded: {total_bytes/1024/1024:.1f} MB")
    print(f"Log saved to: {LOG_FILE}")
