# Knowledge Graph Query Guide & Reference

This document provides SQL pattern matching equivalents, Python API signatures, and CLI examples for querying the PRISM-Rx Knowledge Graph.

---

## 1. Core Graph Traversal Patterns (SQL Equivalents)

### Pattern 1: 1-Hop Drug $\to$ Target Lookup
```sql
SELECT d.name as drug_name, dt.action_type, t.approved_symbol, t.approved_name
FROM drug_target dt
JOIN drugs d ON dt.drug_id = d.id
JOIN targets t ON dt.target_id = t.id
WHERE d.name LIKE '%aspirin%';
```

### Pattern 2: 1-Hop Target $\to$ Disease Lookup
```sql
SELECT t.approved_symbol, dis.name as disease_name, td.score
FROM target_disease td
JOIN targets t ON td.target_id = t.id
JOIN diseases dis ON td.disease_id = dis.id
WHERE t.approved_symbol = 'BRCA1'
ORDER BY td.score DESC;
```

### Pattern 3: 2-Hop Candidate Signal Discovery (Drug $\to$ Target $\to$ Disease)
*Finds Drug $\to$ Target $\to$ Disease paths where Drug is NOT already indicated for Disease.*
```sql
SELECT 
    d.name as drug_name, 
    t.approved_symbol as target_symbol, 
    dis.name as disease_name,
    td.score as target_disease_score
FROM drug_target dt
JOIN drugs d ON dt.drug_id = d.id
JOIN targets t ON dt.target_id = t.id
JOIN target_disease td ON td.target_id = t.id
JOIN diseases dis ON td.disease_id = dis.id
LEFT JOIN drug_disease dd ON dd.drug_id = d.id AND dd.disease_id = dis.id
WHERE dd.drug_id IS NULL
  AND td.score >= 0.50
ORDER BY td.score DESC
LIMIT 20;
```

### Pattern 4: Evidence & Contradictory Warning Retrieval
```sql
-- Supporting evidence records
SELECT e.id, e.evidence_type, e.score, e.clinical_stage, e.publication_ids
FROM evidence e
WHERE e.drug_id = 'DR:CHEMBL403989';

-- Contradictory safety warnings
SELECT dw.warning_type, dw.toxicity_class, dw.description
FROM drug_warnings dw
WHERE dw.drug_id = 'DR:CHEMBL403989';
```

---

## 2. Python API Reference

```python
from src.graph import GraphTraversalEngine, find_repurposing_candidates

# 1. Initialize Engine
engine = GraphTraversalEngine()

# 2. Fetch 1-hop Drug Targets
targets = engine.get_drug_targets(drug_id="DR:CHEMBL403989")

# 3. Find Repurposing Candidates Service Function
candidates = find_repurposing_candidates(
    drug_name="aspirin",
    disease_name="cancer",
    min_score=0.3,
    limit=10
)

# Access Structured Payload
for cand in candidates:
    print(cand["drug"]["name"], "->", cand["disease"]["name"])
    print("Paths:", len(cand["paths"]))
    print("Supporting Evidence Count:", len(cand["supporting_evidence"]))
    print("Warnings/Contradictions:", len(cand["contradictory_evidence"]))
```

---

## 3. Command Line Interface (CLI) Usage

```bash
# Query top candidates across the entire graph
python -m src.graph.cli --limit 5

# Query candidates for a specific drug
python -m src.graph.cli --drug "Tg100-801" --min-score 0.5

# Query candidates for a specific disease
python -m src.graph.cli --disease "leukemia" --limit 5

# Export raw JSON payload
python -m src.graph.cli --drug "Ilorasertib" --json
```
