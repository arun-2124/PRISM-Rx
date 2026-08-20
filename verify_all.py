import sqlite3
import sys
import py_compile
from pathlib import Path
import json
import time

DB_PATH = Path("data/unified/medbase.db")
SRC_DIR = Path("src")

def verify_code_syntax():
    print("\n" + "="*70)
    print("1. CODEBASE SYNTAX & COMPILATION VERIFICATION")
    print("="*70)
    py_files = list(SRC_DIR.rglob("*.py"))
    passed = 0
    failed = 0
    for f in py_files:
        try:
            py_compile.compile(str(f), doraise=True)
            print(f"  [PASS] {f}")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {f}: {e}")
            failed += 1
    print(f"Code Syntax Check: {passed} passed, {failed} failed.")
    return failed == 0

def verify_database():
    print("\n" + "="*70)
    print("2. DATABASE INTEGRITY & SCHEMA VERIFICATION")
    print("="*70)
    
    if not DB_PATH.exists():
        print(f"  [FAIL] Database file not found at {DB_PATH}")
        return False
    
    print(f"Database File: {DB_PATH.resolve()}")
    print(f"Database Size: {DB_PATH.stat().st_size / 1024 / 1024:.2f} MB")
    
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 2.1 Table list & counts
    expected_tables = [
        'drugs', 'diseases', 'targets', 'drug_target',
        'drug_disease', 'target_disease', 'drug_warnings',
        'clinical_reports', 'evidence', 'entity_synonyms'
    ]
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    existing_tables = [r[0] for r in cursor.fetchall() if not r[0].startswith('sqlite_')]
    
    print(f"\nExisting Tables ({len(existing_tables)} found):")
    table_counts = {}
    missing_tables = []
    for t in expected_tables:
        if t in existing_tables:
            count = cursor.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
            table_counts[t] = count
            status = "OK" if count > 0 else "EMPTY"
            print(f"  [{status}] {t:22s} : {count:>10,} rows")
        else:
            missing_tables.append(t)
            print(f"  [FAIL] {t:22s} : MISSING")
            
    if missing_tables:
        print(f"  [ERROR] Missing tables: {missing_tables}")
    
    # 2.2 Foreign Key / Reference Checks
    print("\n--- Referential Consistency Checks ---")
    
    # Check drug_target -> drugs
    dt_orphan_drugs = cursor.execute("""
        SELECT COUNT(DISTINCT drug_id) FROM drug_target 
        WHERE drug_id NOT IN (SELECT id FROM drugs)
    """).fetchone()[0]
    print(f"  Orphan drug_ids in drug_target: {dt_orphan_drugs}")

    # Check drug_target -> targets
    dt_orphan_targets = cursor.execute("""
        SELECT COUNT(DISTINCT target_id) FROM drug_target 
        WHERE target_id NOT IN (SELECT id FROM targets)
    """).fetchone()[0]
    print(f"  Orphan target_ids in drug_target: {dt_orphan_targets}")

    # Check target_disease -> targets
    td_orphan_targets = cursor.execute("""
        SELECT COUNT(DISTINCT target_id) FROM target_disease 
        WHERE target_id NOT IN (SELECT id FROM targets)
    """).fetchone()[0]
    print(f"  Orphan target_ids in target_disease: {td_orphan_targets}")

    # Check target_disease -> diseases
    td_orphan_diseases = cursor.execute("""
        SELECT COUNT(DISTINCT disease_id) FROM target_disease 
        WHERE disease_id NOT IN (SELECT id FROM diseases)
    """).fetchone()[0]
    print(f"  Orphan disease_ids in target_disease: {td_orphan_diseases}")

    # 2.3 Indexes check
    cursor.execute("SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%';")
    indexes = cursor.fetchall()
    print(f"\nIndexes Created: {len(indexes)}")
    for idx in indexes:
        print(f"  - {idx['name']} on table '{idx['tbl_name']}'")
        
    conn.close()
    return len(missing_tables) == 0

def test_signal_engine():
    print("\n" + "="*70)
    print("3. SIGNAL ENGINE VERIFICATION")
    print("="*70)
    from src.signals.engine import find_signals
    
    t0 = time.time()
    signals = find_signals(min_score=30, limit=10)
    elapsed = time.time() - t0
    
    print(f"Execution time: {elapsed*1000:.2f} ms")
    print(f"Signals retrieved: {len(signals)}")
    if signals:
        top = signals[0]
        print(f"Top Signal: Drug '{top['drug']['name']}' ({top['drug']['id']}) -> Target '{top['target']['symbol']}' -> Disease '{top['disease']['name']}' (Score: {top['signal_score']})")
    
    # Test specific drug query
    signals_aspirin = find_signals(drug_name="aspirin", limit=5)
    print(f"Aspirin signals found: {len(signals_aspirin)}")

    # Test specific disease query
    signals_cancer = find_signals(disease_name="cancer", limit=5)
    print(f"Cancer signals found: {len(signals_cancer)}")
    
    return len(signals) > 0

if __name__ == "__main__":
    c_ok = verify_code_syntax()
    db_ok = verify_database()
    se_ok = test_signal_engine()
    
    print("\n" + "="*70)
    print("VERIFICATION SUMMARY")
    print("="*70)
    print(f"  Code Syntax:    {'PASSED' if c_ok else 'FAILED'}")
    print(f"  Database Check: {'PASSED' if db_ok else 'FAILED'}")
    print(f"  Signal Engine:  {'PASSED' if se_ok else 'FAILED'}")
    print("="*70)
