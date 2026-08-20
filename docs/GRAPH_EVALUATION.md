# Graph Database Evaluation

## Question

Do we need Neo4j or another graph database for the MVP?

## Analysis

### What we need to query

1. **Drug → Target → Disease** (2-hop path)
   ```sql
   SELECT d.name, t.approved_symbol, dis.name
   FROM drug_target dt
   JOIN drugs d ON dt.drug_id = d.id
   JOIN targets t ON dt.target_id = t.id
   JOIN target_disease td ON td.target_id = t.id
   JOIN diseases dis ON td.disease_id = dis.id
   WHERE d.name LIKE '%aspirin%'
   ```

2. **Drug → Disease** (direct indication)
   ```sql
   SELECT d.name, dis.name, dd.max_clinical_stage
   FROM drug_disease dd
   JOIN drugs d ON dd.drug_id = d.id
   JOIN diseases dis ON dd.disease_id = dis.id
   ```

3. **Multi-hop: Drug → Target1 → Disease1 → Target2 → Drug2**
   This requires recursive CTEs in SQL but is natural in graph databases.

4. **Drug repurposing signal: Drug A targets Protein X, Protein X is associated with Disease Y, Drug A is NOT indicated for Disease Y**
   ```sql
   SELECT d.name, t.approved_symbol, dis.name
   FROM drug_target dt
   JOIN drugs d ON dt.drug_id = d.id
   JOIN targets t ON dt.target_id = t.id
   JOIN target_disease td ON td.target_id = t.id
   JOIN diseases dis ON td.disease_id = dis.id
   LEFT JOIN drug_disease dd ON dd.drug_id = d.id AND dd.disease_id = dis.id
   WHERE dd.drug_id IS NULL
   AND td.score > 0.5
   ```

### SQLite Performance

With proper indexes (already created):
- 22K drugs × 78K targets: 15K drug-target pairs → fast
- 107K target-disease pairs → fast
- JOINs on indexed foreign keys → fast

### Verdict

**PostgreSQL / SQLite is sufficient for the MVP.** The schema is normalized and well-indexed. Graph traversal queries can be expressed as JOINs.

### When to consider a graph database

- If we need arbitrary multi-hop path discovery (3+ hops)
- If we need community detection or graph algorithms
- If we need to visualize the knowledge graph interactively
- If performance degrades with growing data

### Recommendation

**Use SQLite for MVP.** If we need graph visualization or complex path queries later, we can:
1. Export the relational data to a graph format
2. Load into Neo4j or NetworkX
3. Keep the relational DB as the source of truth

For now, the signal engine runs entirely on SQL JOINs and is fast enough for a hackathon demo.
