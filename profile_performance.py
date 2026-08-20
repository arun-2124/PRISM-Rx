"""
Performance Profiler for PRISM-Rx Endpoints & SQL Queries
"""

import time
import sqlite3
from pathlib import Path
from src.signals.engine_v2 import SignalEngineV2

DB_PATH = Path("data/unified/medbase.db")

def profile_all():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    print("=" * 80)
    print("PROFILING ENDPOINTS & SQL QUERIES")
    print("=" * 80)

    # 1. Profile /api/drugs?q=aspirin
    t0 = time.time()
    drugs_cnt = conn.execute("SELECT COUNT(*) FROM drugs WHERE name LIKE '%aspirin%' OR chembl_id = 'aspirin' OR id = 'aspirin'").fetchone()[0]
    t_count = (time.time() - t0) * 1000
    t1 = time.time()
    drugs = conn.execute("SELECT id, chembl_id, name, drug_type, max_clinical_stage FROM drugs WHERE name LIKE '%aspirin%' OR chembl_id = 'aspirin' OR id = 'aspirin' ORDER BY name ASC LIMIT 20").fetchall()
    t_select = (time.time() - t1) * 1000
    print(f"\n1. Drug Search 'aspirin': Count query: {t_count:.2f} ms | Select query: {t_select:.2f} ms | Found: {drugs_cnt}")

    # 2. Profile /api/diseases?q=leukemia
    t0 = time.time()
    dis_cnt = conn.execute("SELECT COUNT(*) FROM diseases WHERE name LIKE '%leukemia%' OR source_id = 'leukemia' OR id = 'leukemia'").fetchone()[0]
    t_count = (time.time() - t0) * 1000
    t1 = time.time()
    diseases = conn.execute("SELECT id, source_id, name, description, is_therapeutic_area FROM diseases WHERE name LIKE '%leukemia%' OR source_id = 'leukemia' OR id = 'leukemia' ORDER BY name ASC LIMIT 20").fetchall()
    t_select = (time.time() - t1) * 1000
    print(f"2. Disease Search 'leukemia': Count query: {t_count:.2f} ms | Select query: {t_select:.2f} ms | Found: {dis_cnt}")

    # 3. Profile SignalEngineV2 candidate loop
    t0 = time.time()
    engine = SignalEngineV2(DB_PATH)
    t_init = (time.time() - t0) * 1000

    t0 = time.time()
    signals = engine.get_ranked_signals(limit=20, min_score=30)
    t_get_signals = (time.time() - t0) * 1000
    print(f"3. SignalEngineV2.get_ranked_signals(limit=20): {t_get_signals:.2f} ms | Found: {len(signals)}")

    # 4. Profile Single Candidate Lookup (e.g. Tg100-801 -> acute lymphoblastic leukemia)
    t0 = time.time()
    sig_detail = engine.get_ranked_signals(drug="DR:CHEMBL403989", disease="D:MONDO_0004967", limit=5)
    t_detail = (time.time() - t0) * 1000
    print(f"4. Single Signal Detail Lookup: {t_detail:.2f} ms")

    conn.close()

if __name__ == "__main__":
    profile_all()
