# Knowledge Graph Statistics & Metrics Report
**Generated**: August 2026 | **Execution Time**: 3.34s | **Source Database**: `data/unified/medbase.db` (545.35 MB)

---

## 1. Node Inventory
| Node Type | Description | Total Count |
| :--- | :--- | :---: |
| `Drug` | Approved compounds & small molecules | **22,407** |
| `Disease` | Disease ontologies (EFO / MONDO) | **47,080** |
| `Target` | Ensembl targets & SwissProt proteins | **78,691** |
| `ClinicalTrial` | Clinical trial reports (ClinicalTrials.gov) | **289,955** |
| `Evidence` | Clinical precedence evidence records | **872,619** |
| **Total Nodes** | **Aggregated Knowledge Graph Nodes** | **1,310,752** |

## 2. Relationship / Edge Inventory
| Edge Type | Description | Total Count |
| :--- | :--- | :---: |
| `TARGETS` | Drug $\to$ Target mechanism of action links | **14,655** |
| `ASSOCIATED_WITH` | Target $\to$ Disease association links | **107,593** |
| `INDICATED_FOR` | Drug $\to$ Disease established clinical indications | **86,468** |
| `STUDIED_IN` | Drug $\to$ Clinical Trial report evidence links | **872,619** |
| `CONTRADICTED_BY` | Drug black-box toxicity & warning links | **3,039** |
| **Total Edges** | **Aggregated Knowledge Graph Edges** | **1,084,374** |

## 3. Graph Path Traversals & Repurposing Candidates
| Metric | Count |
| :--- | :---: |
| Total `Drug -> Target -> Disease` Graph Paths | **2,976,634** |
| Unindicated `Drug -> Target -> Disease` Paths (Candidate Signals) | **2,787,952** |
| Unique Candidate `(Drug, Disease)` Pairs | **819,696** |
| Percentage of Paths Unindicated (Novel Candidates) | **93.66%** |

## 4. Degree Centrality (Most Connected Entities)

### Top 10 Most Connected Drugs (Target Count)
| Rank | Drug ID | Drug Name | Targets Bound |
| :---: | :--- | :--- | :---: |
| 1 | `DR:CHEMBL1743000` | Citatuzumab Bogatox | 79 |
| 2 | `DR:CHEMBL2107890` | Taplitumomab Paptox | 79 |
| 3 | `DR:CHEMBL2108785` | Zolimomab Aritox | 79 |
| 4 | `DR:CHEMBL2108790` | Telimomab Aritox | 79 |
| 5 | `DR:CHEMBL4297789` | Mt-3724 | 79 |
| 6 | `DR:CHEMBL123292` | Cycloheximide | 78 |
| 7 | `DR:CHEMBL2109124` | Dorlimomab Aritox | 78 |
| 8 | `DR:CHEMBL256997` | Ataluren | 78 |
| 9 | `DR:CHEMBL4297744` | Elx-02 | 78 |
| 10 | `DR:CHEMBL1431` | Metformin | 51 |

### Top 10 Most Connected Targets (Disease Association Count)
| Rank | Target ID | Symbol | Name | Diseases Associated |
| :---: | :--- | :--- | :--- | :---: |
| 1 | `T:ENSG00000113580` | **NR3C1** | nuclear receptor subfamily 3 group C member 1 | 821 |
| 2 | `T:ENSG00000073756` | **PTGS2** | prostaglandin-endoperoxide synthase 2 | 599 |
| 3 | `T:ENSG00000101162` | **TUBB1** | tubulin beta 1 class VI | 551 |
| 4 | `T:ENSG00000104833` | **TUBB4A** | tubulin beta 4A class IVa | 551 |
| 5 | `T:ENSG00000123416` | **TUBA1B** | tubulin alpha 1b | 551 |
| 6 | `T:ENSG00000127824` | **TUBA4A** | tubulin alpha 4a | 551 |
| 7 | `T:ENSG00000137267` | **TUBB2A** | tubulin beta 2A class IIa | 551 |
| 8 | `T:ENSG00000137285` | **TUBB2B** | tubulin beta 2B class IIb | 551 |
| 9 | `T:ENSG00000152086` | **TUBA3E** | tubulin alpha 3e | 551 |
| 10 | `T:ENSG00000167552` | **TUBA1A** | tubulin alpha 1a | 551 |

### Top 10 Most Connected Diseases (Target Count)
| Rank | Disease ID | Disease Name | Associated Targets |
| :---: | :--- | :--- | :---: |
| 1 | `D:MONDO_0005233` | non-small cell lung carcinoma | 630 |
| 2 | `D:MONDO_0007254` | breast cancer | 611 |
| 3 | `D:MONDO_0008315` | prostate cancer | 538 |
| 4 | `D:MONDO_0005575` | colorectal cancer | 532 |
| 5 | `D:MONDO_0004992` | cancer | 527 |
| 6 | `D:MONDO_0005070` | neoplasm | 491 |
| 7 | `D:MONDO_0018874` | acute myeloid leukemia | 471 |
| 8 | `D:MONDO_0018177` | glioblastoma | 470 |
| 9 | `D:MONDO_0009693` | plasma cell myeloma | 447 |
| 10 | `D:MONDO_0005105` | melanoma | 430 |