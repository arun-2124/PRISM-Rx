# Data Sources Documentation

## Source 1: Open Targets Platform 26.06

### Overview
Open Targets Platform provides evidence on the causal links between genes and diseases, integrating data from multiple sources including GWAS, animal models, somatic mutations, and more.

### Download Method (Windows-Compatible)
No rsync required. Use HTTPS downloads from EBI FTP.

**Base URL:**
```
https://ftp.ebi.ac.uk/pub/databases/opentargets/platform/26.06/output/
```

**Download Strategy:**
- Use Python `requests` library to download individual dataset directories
- Datasets are in Parquet format (partitioned)
- Read with `pandas.read_parquet()` + `pyarrow`

### Selected Datasets for MVP

| Dataset | Description | Priority | Est. Size |
|---------|-------------|----------|-----------|
| `disease` | Disease ontology (EFO, MONDO, ORPHA) | HIGH | ~50MB |
| `target` | Gene/protein targets (Ensembl) | HIGH | ~50MB |
| `drug_molecule` | Drug/compound information | HIGH | ~50MB |
| `drug_mechanism_of_action` | Drug -> Target relationships | HIGH | ~10MB |
| `clinical_indication` | Drug -> Disease clinical links | HIGH | ~20MB |
| `clinical_report` | Clinical evidence reports | MEDIUM | ~100MB |
| `clinical_target` | Clinical target evidence | MEDIUM | ~100MB |
| `drug_warning` | Drug safety warnings (black box) | HIGH | ~5MB |
| `evidence_clinical_precedence` | Clinical precedence evidence | HIGH | ~50MB |
| `association_overall_direct` | Overall target-disease scores | MEDIUM | ~500MB |

### Licensing
Open Targets data is available under CC BY 4.0 license.

**Citation:** Open Targets Platform 26.06 release.

### Key Schema Fields

**disease:**
- id (e.g., "EFO_0000616")
- name
- description
- ontologyIds

**target:**
- id (e.g., "ENSG00000153201")
- approvedSymbol
- approvedName
- biotype

**drug_molecule:**
- id (e.g., "CHEMBL25")
- name
- description
- maximumClinicalTrialPhase
- isApproved

**drug_mechanism_of_action:**
- targetId
- mechanismOfAction
- actionType
- targetName

---

## Source 2: ChEMBL 37

### Overview
ChEMBL is a manually curated database of bioactive molecules with drug-like properties. Contains chemical, bioactivity and genomic data.

### Download Method (Windows-Compatible)
Download the SQLite dump (no server installation needed).

**Download URL:**
```
https://ftp.ebi.ac.uk/pub/databases/chembl/ChEMBLdb/latest/chembl_37_sqlite.tar.gz
```

**Size:** ~1.7GB compressed (SQLite), ~35GB uncompressed

### Selected Tables for MVP

| Table | Description | Est. Rows |
|-------|-------------|-----------|
| `molecule` | Drug/compound records | ~2.4M |
| `molecule_synonym` | Drug name synonyms | ~3M |
| `target` | Target records | ~400K |
| `component_synonym` | Gene/protein synonyms | ~500K |
| `mechanism_of_action` | Drug mechanism of action | ~30K |
| `molecule_dictionary` | Drug classification | ~2.4M |
| `compound_structures` | Chemical structures | ~2.4M |

### Licensing
CC BY-SA 3.0 license (Creative Commons Attribution-ShareAlike).

**Citation:** ChEMBL Database in 2023 (doi: 10.1093/nar/gkad1004)

### Key Schema Fields

**molecule:**
- molregno (primary key)
- pref_name (preferred name)
- mol_type
- max_phase (highest clinical phase)

**target:**
- tid (primary key)
- pref_name
- target_type
- organism

**mechanism_of_action:**
- mechanism_id
- action_type
- mechanism_of_action
- tid (FK to target)
- molregno (FK to molecule)

---

## Source 3: Europe PMC

### Overview
Europe PMC provides access to over 48 million publications from PubMed, Agricola, and other sources. REST API available for programmatic access.

### API Endpoint
```
https://www.ebi.ac.uk/europepmc/webservices/rest/
```

### Key API Calls

**Search articles:**
```
GET https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=aspirin+cancer&resultType=core&format=json&pageSize=25
```

**Get article by ID:**
```
GET https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:12345&resultType=core&format=json
```

**Text-mined annotations:**
```
GET https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=aspirin&resultType=core&format=json&include=TRUE&extraAnnotations=TRUE
```

### Rate Limits
- No strict rate limit but be respectful
- Recommended: < 10 requests/second

### Licensing
Free for academic and commercial use. Data from PubMed is public domain.

---

## Source 4: ClinicalTrials.gov

### Overview
ClinicalTrials.gov is a database of clinical studies conducted around the world. The v2 API provides JSON access.

### API Endpoint
```
https://clinicaltrials.gov/api/v2/studies
```

### Key API Calls

**Search by condition:**
```
GET https://clinicaltrials.gov/api/v2/studies?query.term=diabetes&pageSize=10
```

**Search by drug:**
```
GET https://clinicaltrials.gov/api/v2/studies?query.intr=metformin&pageSize=10
```

**Get specific study:**
```
GET https://clinicaltrials.gov/api/v2/studies/NCT00000102
```

### Rate Limits
- 1,000 requests per hour
- Use `pageSize` parameter to batch results

### Licensing
Public domain (US Government work).

### Key Fields in Response
- protocolSection.identificationModule.nctId
- protocolSection.identificationModule.briefTitle
- protocolSection.statusModule.overallStatus
- protocolSection.designModule.phases
- protocolSection.armsInterventionsModule.interventions
- protocolSection.conditionsModule.conditions
- protocolSection.statusModule.startDateStruct
- protocolSection.statusModule.completionDateStruct

---

## Source 5: UniProt

### Overview
UniProt provides protein sequence and functional information.

### API Endpoint
```
https://rest.uniprot.org/
```

### Key API Calls

**Search proteins:**
```
GET https://rest.uniprot.org/uniprotkb/search?query=BRCA1+AND+organism_id:9606&format=json
```

**Get protein by accession:**
```
GET https://rest.uniprotkb/P04637?format=json
```

**Cross-references:**
```
GET https://rest.uniprot.org/uniprotkb/search?query=ensembl:ENSG00000139618&format=json
```

### Rate Limits
- No strict rate limit
- Recommended: < 5 requests/second

### Licensing
CC BY 4.0 license.

### Key Fields
- primaryAccession
- proteinDescription.recommendedName.fullName
- genes[].geneName
- sequence.length
- organism.scientificName
- uniProtKBCrossReferences[] (external database links)

---

## Cross-Reference Mapping (Critical)

The key to entity resolution is mapping between database identifiers:

| Entity | Open Targets | ChEMBL | UniProt | ClinicalTrials |
|--------|-------------|--------|---------|----------------|
| Drug | molecule.id | molecule.molregno | - | intervention.name |
| Target | target.id (ENSG) | target.tid | primaryAccession | - |
| Disease | disease.id (EFO) | - | - | conditions[] |
| Gene | Ensembl ID | component | genes[].geneName | - |
| Publication | - | - | - | - |

**Normalization Strategy:**
- Use Open Targets as primary entity hub (it already cross-references many sources)
- Use ChEMBL for drug details and bioactivity
- Use UniProt for protein details
- Use ClinicalTrials for clinical evidence
- Use Europe PMC for publication evidence
