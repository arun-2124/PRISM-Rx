import os
import requests
import time
from pathlib import Path
from tqdm import tqdm
import json
from datetime import datetime
import tarfile

CHEMBL_URL = "https://ftp.ebi.ac.uk/pub/databases/chembl/ChEMBLdb/latest/chembl_37_sqlite.tar.gz"
RAW_DIR = Path("data/raw/chembl")
RAW_DIR.mkdir(parents=True, exist_ok=True)
TAR_FILE = RAW_DIR / "chembl_37_sqlite.tar.gz"
SQLITE_FILE = RAW_DIR / "chembl_37.sqlite"
LOG_FILE = RAW_DIR / "download_log.json"

def download_chembl():
    """Download ChEMBL SQLite dump."""
    print(f"{'='*60}")
    print(f"Downloading ChEMBL 37 SQLite")
    print(f"URL: {CHEMBL_URL}")
    print(f"Target: {TAR_FILE}")
    print(f"{'='*60}")

    entry = {
        "source": "chembl",
        "version": "37",
        "url": CHEMBL_URL,
        "download_date": datetime.now().isoformat(),
        "status": "pending",
    }

    if TAR_FILE.exists() and TAR_FILE.stat().st_size > 100_000_000:
        print(f"Tar file already exists ({TAR_FILE.stat().st_size/1024/1024:.1f} MB), skipping download")
        entry["status"] = "downloaded"
    else:
        try:
            print("Downloading...")
            r = requests.get(CHEMBL_URL, stream=True, timeout=30)
            r.raise_for_status()
            total = int(r.headers.get('content-length', 0))
            
            with open(TAR_FILE, 'wb') as f:
                with tqdm(total=total, unit='B', unit_scale=True, desc="chembl_37_sqlite.tar.gz") as pbar:
                    for chunk in r.iter_content(chunk_size=8192*32):
                        f.write(chunk)
                        pbar.update(len(chunk))
            
            entry["status"] = "downloaded"
            entry["file_size_bytes"] = TAR_FILE.stat().st_size
            print(f"Download complete: {TAR_FILE.stat().st_size/1024/1024:.1f} MB")
        except Exception as e:
            entry["status"] = "failed"
            entry["error"] = str(e)
            print(f"Download failed: {e}")
            with open(LOG_FILE, "w") as f:
                json.dump(entry, f, indent=2)
            return

    if not SQLITE_FILE.exists():
        print(f"\nExtracting sqlite file...")
        try:
            with tarfile.open(TAR_FILE, 'r:gz') as tar:
                members = tar.getnames()
                sqlite_members = [m for m in members if m.endswith('.sqlite')]
                print(f"Found: {sqlite_members}")
                for member in sqlite_members:
                    print(f"Extracting {member}...")
                    tar.extract(member, path=str(RAW_DIR))
                    extracted = RAW_DIR / member
                    if extracted != SQLITE_FILE:
                        extracted.rename(SQLITE_FILE)
            entry["status"] = "success"
            print(f"Extraction complete: {SQLITE_FILE}")
        except Exception as e:
            entry["status"] = "extraction_failed"
            entry["error"] = str(e)
            print(f"Extraction failed: {e}")
    else:
        entry["status"] = "success"
        print(f"SQLite file already exists: {SQLITE_FILE}")

    with open(LOG_FILE, "w") as f:
        json.dump(entry, f, indent=2)

    print(f"\nDone. SQLite: {SQLITE_FILE}")

if __name__ == "__main__":
    download_chembl()
