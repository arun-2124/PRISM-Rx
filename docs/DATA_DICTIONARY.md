# Data Dictionary — Open Targets 26.06

> Based on actual inspection of the Open Targets 26.06 data release.

---

## Disease (47,080 rows)

| Field | Type | Description |
|---|---|---|
| `id` | String | Primary key (e.g., `EFO_0000544`, `MONDO_0008903`, `GO_0000050`). Multiple ontology sources. |
| `code` | String | URI code |
| `name` | String | Disease name (canonical) |
| `description` | String | Text description (11.5% null) |
| `dbXRefs` | Array | Cross-references (Reactome, Wikipedia, etc.) |
| `parents` | Array | Parent ontology IDs |
| `exactSynonyms` | Array | Exact synonym names |
| `relatedSynonyms` | Array | Related synonyms |
| `therapeuticAreas` | Array | Therapeutic area ontology IDs |
| `ancestors` | Array | Ancestor ontology IDs |
| `children` | Array | Child ontology IDs |
| `descendants` | Array | Descendant ontology IDs |
| `ontology` | Object | `isTherapeuticArea`, `leaf`, `sources` |
| `synonyms` | Object | `hasExactSynonym`, `hasRelatedSynonym`, etc. |

---

## Target (78,691 rows)

| Field | Type | Description |
|---|---|---|
| `id` | String | Ensembl gene ID (e.g., `ENSG00000087085`) |
| `approvedSymbol` | String | Gene symbol (e.g., `SRRT`) |
| `approvedName` | String | Full protein name |
| `biotype` | String | `protein_coding`, etc. |
| `proteinIds` | Array\<Object\> | `{id, source}` — UniProt accessions from `uniprot_swissprot` and `uniprot_trembl` |
| `dbXRefs` | Array\<Object\> | `{id, source}` — cross-refs to HGNC, ChEMBL, etc. |
| `synonyms` | Array\<Object\> | `{label, source}` |
| `symbolSynonyms` | Array\<Object\> | `{label, source}` |
| `nameSynonyms` | Array\<Object\> | `{label, source}` |
| `targetClass` | Array\<Object\> | `{id, label, level}` — protein target classification |
| `pathways` | Array\<Object\> | `{pathwayId, pathway, topLevelTerm}` |
| `go` | Object | Gene Ontology annotations |
| `functionDescriptions` | Array | Function text |
| `subcellularLocations` | Array\<Object\> | `{location, source}` |
| `tractability` | Object | Drug tractability assessment |
| `homologues` | Object | Cross-species homology |
| `constraint` | Object | Genetic constraint scores |
| `hallmarks` | Object | Cancer hallmarks |
| `safetyLiabilities` | Array | Safety concerns |

---

## Drug / Molecule (22,407 rows)

| Field | Type | Description |
|---|---|---|
| `id` | String | ChEMBL molecule ID (e.g., `CHEMBL1007`, `CHEMBL25`) |
| `name` | String | Drug name (canonical) |
| `drugType` | String | `Small molecule`, `Antibody`, `Protein`, etc. |
| `maximumClinicalStage` | String | `APPROVAL`, `PHASE_4`, `PHASE_3`, `PHASE_2`, `PHASE_1`, `PHASE_0`, `UNKNOWN` |
| `synonyms` | Array\<Object\> | `{label, source}` — drug name synonyms |
| `tradeNames` | Array\<Object\> | `{label, source}` — brand names |
| `crossReferences` | Array\<Object\> | `{source, ids}` — DrugBank, PubChem, etc. |
| `parentId` | String | Parent molecule ID (for prodrugs/metabolites) |
| `childChemblIds` | Array | Child molecule IDs |
| `canonicalSmiles` | String | SMILES string (16.6% null for biologics) |
| `inchiKey` | String | InChI key (16.6% null) |
| `molblock` | String | MOL file content (16.6% null) |

---

## Drug Mechanism of Action (6,500 rows)

| Field | Type | Description |
|---|---|---|
| `actionType` | String | `INHIBITOR`, `AGONIST`, `ANTAGONIST`, `MODULATOR`, etc. |
| `mechanismOfAction` | String | Text description |
| `chemblIds` | Array | ChEMBL drug IDs |
| `targetName` | String | Target protein name |
| `targetType` | String | `"single protein"`, `"protein family"`, etc. |
| `targets` | Array | Ensembl gene IDs (`ENSG`) |
| `references` | Array\<Object\> | `{source, ids, urls}` |

---

## Clinical Indication (86,468 rows)

| Field | Type | Description |
|---|---|---|
| `id` | String | Hash-based unique ID |
| `drugId` | String | ChEMBL drug ID |
| `diseaseId` | String | Disease ontology ID (`EFO`, `MONDO`) |
| `maxClinicalStage` | String | Highest clinical stage achieved |
| `clinicalReportIds` | Array | Clinical report UUIDs |

---

## Clinical Report (289,955 rows)

| Field | Type | Description |
|---|---|---|
| `id` | String | UUID or identifier |
| `type` | String | `DRUG_LABEL`, `CLINICAL_TRIAL`, etc. |
| `source` | String | `DailyMed`, `ClinicalTrials.gov`, `EMA`, etc. |
| `drugs` | Array\<Object\> | `{drugFromSource, drugId}` |
| `diseases` | Array\<Object\> | `{diseaseFromSource, diseaseId}` |
| `clinicalStage` | String | `APPROVAL`, `PHASE_3`, etc. |
| `trialPhase` | String | `PHASE1`, `PHASE2`, `PHASE3`, `PHASE1/PHASE2`, etc. |
| `trialOverallStatus` | String | `COMPLETED`, `RECRUITING`, etc. |
| `trialStudyType` | String | `INTERVENTIONAL`, `OBSERVATIONAL` |
| `trialPrimaryPurpose` | String | `TREATMENT`, `PREVENTION`, etc. |
| `trialNumberOfArms` | Integer | Number of study arms |
| `trialStartDate` | Date | Date |
| `trialDescription` | String | Study description |
| `sideEffects` | Array\<Object\> | `{diseaseId, diseaseFromSource}` |
| `hasExpertReview` | Boolean | — |
| `url` | String | Source URL |

---

## Clinical Target (13,307 rows)

| Field | Type | Description |
|---|---|---|
| `id` | String | Hash-based unique ID |
| `drugId` | String | ChEMBL drug ID |
| `targetId` | String | Ensembl gene ID |
| `diseases` | Array\<Object\> | `{diseaseFromSource, diseaseId}` |
| `clinicalReportIds` | Array | Report identifiers |
| `maxClinicalStage` | String | Highest clinical stage |

---

## Drug Warning (2,304 rows)

| Field | Type | Description |
|---|---|---|
| `id` | Integer | ID |
| `chemblIds` | Array | ChEMBL drug IDs |
| `warningType` | String | `"Black Box Warning"`, `"Warning"`, `"Contraindication"` |
| `toxicityClass` | String | e.g., `"musculoskeletal toxicity"` |
| `country` | String | Country of regulatory action |
| `description` | String | Warning text (56% null) |
| `efoId` | String | Disease ontology ID (57.7% null) |
| `efoTerm` | String | Disease name (57.7% null) |
| `year` | Integer | Year of warning (56.2% null) |
| `references` | Array\<Object\> | `{id, source, url}` |

---

## Evidence — Clinical Precedence (872,619 rows)

| Field | Type | Description |
|---|---|---|
| `id` | String | Hash-based unique ID |
| `targetId` | String | Ensembl gene ID |
| `drugId` | String | ChEMBL drug ID |
| `diseaseId` | String | Disease ontology ID |
| `diseaseFromSource` | String | Original disease name |
| `drugFromSource` | String | Original drug name |
| `clinicalStage` | String | `PHASE_1` through `APPROVAL` |
| `clinicalReportId` | String | Clinical report identifier |
| `score` | Float | 0–1 confidence score |
| `directionOnTrait` | String | `"protect"`, `"risk"`, etc. |
| `directionOnTarget` | String | `"LoF"`, `"GoF"`, etc. |
| `studyStartDate` | Date | Date |
| `publicationDate` | Date | Date |
| `evidenceDate` | Date | Date |
| `literature` | Array | PubMed IDs |
| `qualityControls` | Array | Quality flags |
