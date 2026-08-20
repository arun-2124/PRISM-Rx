import pandas as pd
import json
from pathlib import Path

base = Path("data/raw/opentargets")

datasets = {
    "disease": "disease/disease.parquet",
    "target": "target/",
    "drug_molecule": "drug_molecule/",
    "drug_mechanism_of_action": "drug_mechanism_of_action/",
    "clinical_indication": "clinical_indication/clinical_indication.parquet",
    "clinical_report": "clinical_report/clinical_report.parquet",
    "clinical_target": "clinical_target/clinical_target.parquet",
    "drug_warning": "drug_warning/",
    "evidence_clinical_precedence": "evidence_clinical_precedence/",
}

for name, path in datasets.items():
    full = base / path
    print(f"\n{'='*70}")
    print(f"DATASET: {name}")
    print(f"{'='*70}")
    
    try:
        if full.is_dir():
            df = pd.read_parquet(full)
        else:
            df = pd.read_parquet(full)
        
        print(f"Rows: {df.shape[0]:,}")
        print(f"Columns: {df.shape[1]}")
        print(f"\nColumn names and dtypes:")
        for col in df.columns:
            dtype = df[col].dtype
            non_null = df[col].notna().sum()
            null_pct = (1 - non_null / len(df)) * 100
            sample = df[col].dropna().iloc[0] if non_null > 0 else "ALL NULL"
            sample_str = str(sample)[:80]
            print(f"  {col:35s} {str(dtype):15s} {non_null:>8,} non-null ({null_pct:5.1f}% null)  e.g. {sample_str}")
        
        print(f"\nFirst 2 rows (key columns):")
        key_cols = [c for c in df.columns if any(k in c.lower() for k in ['id', 'name', 'symbol', 'drug', 'disease', 'target', 'stage', 'type', 'action'])]
        if not key_cols:
            key_cols = df.columns[:6].tolist()
        print(df[key_cols[:6]].head(2).to_string())
        
    except Exception as e:
        print(f"ERROR: {e}")

print("\n\nDONE")
