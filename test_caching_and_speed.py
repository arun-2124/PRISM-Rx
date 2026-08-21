"""
Test In-Memory Caching & Query Optimization for SignalEngineV2
"""

import time
from pathlib import Path
from src.signals.engine_v2 import SignalEngineV2

DB_PATH = Path("data/unified/medbase.db")

def test_speed():
    engine = SignalEngineV2(DB_PATH)

    print("=" * 80)
    print("TESTING SIGNAL ENGINE LATENCY WITH MEMOIZATION CACHE")
    print("=" * 80)

    # 1. Cold Call (First Request)
    t0 = time.time()
    signals1 = engine.get_ranked_signals(limit=50, min_score=30)
    t_cold = (time.time() - t0) * 1000
    print(f"Cold Call (First calculation): {t_cold:.2f} ms | Returned: {len(signals1)} signals")

    # 2. Warm Call (Second Request - Cached)
    t0 = time.time()
    signals2 = engine.get_ranked_signals(limit=50, min_score=30)
    t_warm = (time.time() - t0) * 1000
    print(f"Warm Call (In-memory cached): {t_warm:.2f} ms | Returned: {len(signals2)} signals")

    print(f"Speedup: {t_cold / max(0.01, t_warm):.1f}x faster!")

if __name__ == "__main__":
    test_speed()
