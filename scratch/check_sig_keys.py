import sqlite3
from pathlib import Path
from src.signals.engine_v2 import SignalEngineV2

DB_PATH = Path("data/unified/medbase.db")
engine = SignalEngineV2(str(DB_PATH))
sigs = engine.get_ranked_signals(drug="DR:CHEMBL403989", disease="D:MONDO_0004967", limit=1)
if sigs:
    print(sigs[0].keys())
    print(sigs[0])
