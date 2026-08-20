"""
Compute Knowledge Graph Statistics and output report to docs/GRAPH_STATISTICS.md
"""

import sqlite3
import json
import time
from pathlib import Path

DB_PATH = Path("data/unified/medbase.db")
OUTPUT_MD = Path("docs/GRAPH_STATISTICS.md")


def compute_statistics():
    print("=" * 70)
    print("COMPUTING KNOWLEDGE GRAPH STATISTICS...")
    print("=" * 70)
    
    t0 = time.time()
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. Node Counts
    drugs_cnt = cursor.execute("SELECT COUNT(*) FROM drugs").fetchone()[0]
    diseases_cnt = cursor.execute("SELECT COUNT(*) FROM diseases").fetchone()[0]
    targets_cnt = cursor.execute("SELECT COUNT(*) FROM targets").fetchone()[0]
    trials_cnt = cursor.execute("SELECT COUNT(*) FROM clinical_reports").fetchone()[0]
    evidence_cnt = cursor.execute("SELECT COUNT(*) FROM evidence").fetchone()[0]

    # 2. Edge Counts
    targets_edges = cursor.execute("SELECT COUNT(*) FROM drug_target").fetchone()[0]
    assoc_edges = cursor.execute("SELECT COUNT(*) FROM target_disease").fetchone()[0]
    ind_edges = cursor.execute("SELECT COUNT(*) FROM drug_disease").fetchone()[0]

    studied_edges = cursor.execute("SELECT COUNT(*) FROM evidence WHERE clinical_report_id IS NOT NULL AND drug_id IS NOT NULL").fetchone()[0]
    warning_edges = cursor.execute("SELECT COUNT(*) FROM drug_warnings").fetchone()[0]

    # 3. Path Counts
    # Total Drug -> Target -> Disease paths
    print("  Calculating total Drug -> Target -> Disease graph paths...")
    total_dtd_paths = cursor.execute("""
        SELECT COUNT(*) 
        FROM drug_target dt
        JOIN target_disease td ON dt.target_id = td.target_id
    """).fetchone()[0]

    # Unindicated Drug -> Target -> Disease candidate paths
    print("  Calculating unindicated potential repurposing paths...")
    unindicated_dtd_paths = cursor.execute("""
        SELECT COUNT(*)
        FROM drug_target dt
        JOIN target_disease td ON dt.target_id = td.target_id
        LEFT JOIN drug_disease dd ON dd.drug_id = dt.drug_id AND dd.disease_id = td.disease_id
        WHERE dd.drug_id IS NULL
    """).fetchone()[0]

    # Unique unindicated Drug -> Disease candidate pairs
    unindicated_pairs = cursor.execute("""
        SELECT COUNT(DISTINCT dt.drug_id || '::' || td.disease_id)
        FROM drug_target dt
        JOIN target_disease td ON dt.target_id = td.target_id
        LEFT JOIN drug_disease dd ON dd.drug_id = dt.drug_id AND dd.disease_id = td.disease_id
        WHERE dd.drug_id IS NULL
    """).fetchone()[0]

    # 4. Top Connected Entities
    print("  Fetching top connected entities...")

    # Top Drugs (by target count)
    top_drugs = cursor.execute("""
        SELECT d.id, d.name, d.chembl_id, COUNT(dt.target_id) as target_count
        FROM drug_target dt
        JOIN drugs d ON dt.drug_id = d.id
        GROUP BY dt.drug_id
        ORDER BY target_count DESC
        LIMIT 10
    """).fetchall()

    # Top Targets (by disease count)
    top_targets = cursor.execute("""
        SELECT t.id, t.approved_symbol, t.approved_name, COUNT(td.disease_id) as disease_count
        FROM target_disease td
        JOIN targets t ON td.target_id = t.id
        GROUP BY td.target_id
        ORDER BY disease_count DESC
        LIMIT 10
    """).fetchall()

    # Top Diseases (by associated target count)
    top_diseases = cursor.execute("""
        SELECT dis.id, dis.name, COUNT(td.target_id) as target_count
        FROM target_disease td
        JOIN diseases dis ON td.disease_id = dis.id
        GROUP BY td.disease_id
        ORDER BY target_count DESC
        LIMIT 10
    """).fetchall()

    elapsed = time.time() - t0
    conn.close()

    # Generate Markdown Output
    md_lines = []
    md_lines.append("# Knowledge Graph Statistics & Metrics Report")
    md_lines.append(f"**Generated**: August 2026 | **Execution Time**: {elapsed:.2f}s | **Source Database**: `data/unified/medbase.db` (545.35 MB)")
    md_lines.append("\n---\n")

    md_lines.append("## 1. Node Inventory")
    md_lines.append("| Node Type | Description | Total Count |")
    md_lines.append("| :--- | :--- | :---: |")
    md_lines.append(f"| `Drug` | Approved compounds & small molecules | **{drugs_cnt:,}** |")
    md_lines.append(f"| `Disease` | Disease ontologies (EFO / MONDO) | **{diseases_cnt:,}** |")
    md_lines.append(f"| `Target` | Ensembl targets & SwissProt proteins | **{targets_cnt:,}** |")
    md_lines.append(f"| `ClinicalTrial` | Clinical trial reports (ClinicalTrials.gov) | **{trials_cnt:,}** |")
    md_lines.append(f"| `Evidence` | Clinical precedence evidence records | **{evidence_cnt:,}** |")
    md_lines.append(f"| **Total Nodes** | **Aggregated Knowledge Graph Nodes** | **{drugs_cnt + diseases_cnt + targets_cnt + trials_cnt + evidence_cnt:,}** |")

    md_lines.append("\n## 2. Relationship / Edge Inventory")
    md_lines.append("| Edge Type | Description | Total Count |")
    md_lines.append("| :--- | :--- | :---: |")
    md_lines.append(f"| `TARGETS` | Drug $\\to$ Target mechanism of action links | **{targets_edges:,}** |")
    md_lines.append(f"| `ASSOCIATED_WITH` | Target $\\to$ Disease association links | **{assoc_edges:,}** |")
    md_lines.append(f"| `INDICATED_FOR` | Drug $\\to$ Disease established clinical indications | **{ind_edges:,}** |")
    md_lines.append(f"| `STUDIED_IN` | Drug $\\to$ Clinical Trial report evidence links | **{studied_edges:,}** |")
    md_lines.append(f"| `CONTRADICTED_BY` | Drug black-box toxicity & warning links | **{warning_edges:,}** |")
    md_lines.append(f"| **Total Edges** | **Aggregated Knowledge Graph Edges** | **{targets_edges + assoc_edges + ind_edges + studied_edges + warning_edges:,}** |")

    md_lines.append("\n## 3. Graph Path Traversals & Repurposing Candidates")
    md_lines.append("| Metric | Count |")
    md_lines.append("| :--- | :---: |")
    md_lines.append(f"| Total `Drug -> Target -> Disease` Graph Paths | **{total_dtd_paths:,}** |")
    md_lines.append(f"| Unindicated `Drug -> Target -> Disease` Paths (Candidate Signals) | **{unindicated_dtd_paths:,}** |")
    md_lines.append(f"| Unique Candidate `(Drug, Disease)` Pairs | **{unindicated_pairs:,}** |")
    md_lines.append(f"| Percentage of Paths Unindicated (Novel Candidates) | **{(unindicated_dtd_paths / total_dtd_paths * 100):.2f}%** |")

    md_lines.append("\n## 4. Degree Centrality (Most Connected Entities)")

    md_lines.append("\n### Top 10 Most Connected Drugs (Target Count)")
    md_lines.append("| Rank | Drug ID | Drug Name | Targets Bound |")
    md_lines.append("| :---: | :--- | :--- | :---: |")
    for i, r in enumerate(top_drugs, 1):
        md_lines.append(f"| {i} | `{r['id']}` | {r['name'] or r['chembl_id']} | {r['target_count']:,} |")

    md_lines.append("\n### Top 10 Most Connected Targets (Disease Association Count)")
    md_lines.append("| Rank | Target ID | Symbol | Name | Diseases Associated |")
    md_lines.append("| :---: | :--- | :--- | :--- | :---: |")
    for i, r in enumerate(top_targets, 1):
        md_lines.append(f"| {i} | `{r['id']}` | **{r['approved_symbol']}** | {r['approved_name']} | {r['disease_count']:,} |")

    md_lines.append("\n### Top 10 Most Connected Diseases (Target Count)")
    md_lines.append("| Rank | Disease ID | Disease Name | Associated Targets |")
    md_lines.append("| :---: | :--- | :--- | :---: |")
    for i, r in enumerate(top_diseases, 1):
        md_lines.append(f"| {i} | `{r['id']}` | {r['name']} | {r['target_count']:,} |")

    OUTPUT_MD.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_MD.write_text("\n".join(md_lines), encoding="utf-8")
    print(f"\nSaved graph statistics to {OUTPUT_MD}")
    print(f"Elapsed: {elapsed:.2f}s")


if __name__ == "__main__":
    compute_statistics()
