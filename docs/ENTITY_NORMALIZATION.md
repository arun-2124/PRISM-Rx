# Entity Normalization Strategy

## Overview

Open Targets 26.06 provides well-structured cross-references. Our normalization leverages existing IDs rather than performing fuzzy matching.

## Canonical ID Conventions

| Entity | Prefix | Example | Source |
|--------|--------|---------|--------|
| Drug | `DR:` | `DR:CHEMBL25` | ChEMBL molecule ID |
| Disease | `D:` | `D:EFO_0000544` | EFO / MONDO / GO ID |
| Target | `T:` | `T:ENSG00000087085` | Ensembl gene ID |
| Publication | `PUB:` | `PUB:26056183` | PubMed ID |
| Clinical Report | `CR:` | `CR:00011703-...` | Open Targets UUID |

## Drug Normalization

**Source**: `drug_molecule` dataset
- Primary ID: ChEMBL molecule ID (`id` field, e.g., `CHEMBL25`)
- Canonical name: `name` field (uppercase in source, normalize to title case)
- DrugBank IDs: Extracted from `crossReferences` where `source == 'drugbank'`
- Trade names: Extracted from `tradeNames` array, deduplicated
- Synonyms: Extracted from `synonyms` array

**Cross-reference extraction from `crossReferences`**:
```python
for ref in row['crossReferences']:
    if ref['source'] == 'drugbank':
        drugbank_ids = ref['ids']
```

**Normalization steps**:
1. Skip molecules where `name` is empty (should not happen)
2. Deduplicate by `chembl_id`
3. Extract DrugBank IDs from cross-references
4. Collect trade names from tradeNames array
5. Store synonyms as JSON array

## Disease Normalization

**Source**: `disease` dataset
- Primary ID: Ontology ID (`id` field, e.g., `EFO_0000544`, `MONDO_0008903`)
- Canonical name: `name` field
- Therapeutic areas: From `therapeuticAreas` array
- Synonyms: From `exactSynonyms` and `relatedSynonyms` arrays

**Normalization steps**:
1. Keep all ontology IDs as-is (EFO, MONDO, GO, Orphanet)
2. Determine `is_therapeutic_area` from `ontology.isTherapeuticArea`
3. Collect all synonyms into unified list
4. Store parent/ancestor relationships for hierarchy queries

## Target Normalization

**Source**: `target` dataset
- Primary ID: Ensembl gene ID (`id` field, e.g., `ENSG00000087085`)
- Gene symbol: `approvedSymbol` field
- Protein name: `approvedName` field
- UniProt IDs: Extracted from `proteinIds` where `source == 'uniprot_swissprot'`
- HGNC ID: Extracted from `dbXrefs` where `source == 'HGNC'`
- ChEMBL target ID: Extracted from `dbXrefs` where `source == 'ChEMBL'`

**Cross-reference extraction from `proteinIds`**:
```python
uniprot_ids = [p['id'] for p in row['proteinIds'] if p['source'] == 'uniprot_swissprot']
```

**Cross-reference extraction from `dbXrefs`**:
```python
for ref in row['dbXrefs']:
    if ref['source'] == 'HGNC':
        hgnc_id = ref['id']
    if ref['source'] == 'ChEMBL':
        chembl_target_id = ref['id']
```

**Normalization steps**:
1. Keep only protein_coding biotype for primary targets
2. Extract Swiss-Prot UniProt IDs (reviewed entries)
3. Extract HGNC and ChEMBL cross-references
4. Store target class, subcellular locations, function descriptions

## Drug-Target Mapping

**Source**: `drug_mechanism_of_action` dataset
- Joins ChEMBL drug IDs to Ensembl target IDs
- Provides action type and mechanism description

**Normalization steps**:
1. Each row may have multiple `chemblIds` — explode to individual mappings
2. Each row may have multiple `targets` (Ensembl IDs) — explode to individual mappings
3. Create Cartesian product for (drug, target) pairs
4. Store action type and mechanism of action text

## Drug-Disease Mapping

**Source**: `clinical_indication` dataset
- Direct (drugId, diseaseId) pairs
- Already normalized to ChEMBL and EFO/MONDO IDs

**Normalization steps**:
1. Direct mapping — no transformation needed
2. Store max clinical stage for each pair

## Target-Disease Associations

**Source**: `evidence_clinical_precedence` dataset
- 872K rows of target-disease evidence with scores
- Contains drug information as well

**Normalization steps**:
1. Aggregate to unique (target, disease) pairs
2. Take maximum score across all evidence for each pair
3. Preserve drug associations in evidence table

## Entity Synonym Collection

From each entity table, collect all synonyms into `entity_synonyms`:
- Drug synonyms from `drug_molecule.synonyms` and `tradeNames`
- Disease synonyms from `disease.exactSynonyms`, `relatedSynonyms`
- Target synonyms from `target.symbolSynonyms`, `nameSynonyms`

## Cross-Reference Integrity Checks

After loading, verify:
1. All `drug_target.drug_id` exist in `drugs`
2. All `drug_target.target_id` exist in `targets`
3. All `drug_disease.drug_id` exist in `drugs`
4. All `drug_disease.disease_id` exist in `diseases`
5. All `target_disease.target_id` exist in `targets`
6. All `target_disease.disease_id` exist in `diseases`
7. All `evidence.drug_id` exist in `drugs` (where not null)
8. All `evidence.target_id` exist in `targets` (where not null)
9. All `evidence.disease_id` exist in `diseases` (where not null)
