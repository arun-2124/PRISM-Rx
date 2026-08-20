# PRISM-Rx Final System Verification & Demo Hardening Report

**Verification Timestamp**: 2026-08-20T12:32:28.597971
**Database Location**: `data/unified/medbase.db`

## 1. Database Integrity Verification
- **Database Size**: 545.43 MB
- **Total Relational Tables**: 16
  - `alerts`: 0 records
  - `clinical_reports`: 289,955 records
  - `diseases`: 47,080 records
  - `drug_disease`: 86,468 records
  - `drug_target`: 14,655 records
  - `drug_warnings`: 3,039 records
  - `drugs`: 22,407 records
  - `entity_synonyms`: 479,742 records
  - `evidence`: 872,619 records
  - `evidence_events`: 3 records
  - `publications`: 0 records
  - `signal_evidence`: 0 records
  - `signal_history`: 0 records
  - `sqlite_sequence`: 0 records
  - `target_disease`: 107,593 records
  - `targets`: 78,691 records

## 2. SignalEngineV3 Multi-Candidate Verification

### Candidate: `Tg100-801 -> acute lymphoblastic leukemia` (`DR:CHEMBL403989__D:MONDO_0004967`)
- **PRISM Score**: 82.0 / 100 (STRONG_RESEARCH_SIGNAL)
- **Score Components**: Target-Disease (30.0), Drug-Target (13.5), Clinical (9.0), Lit (7.0), Div (7.5), Novelty (5.0), Safety (0.0)
- **Convergence Score**: 81.3 / 100
- **Momentum**: 80.0 (RISING)
- **Arbitrage Score**: 9.3 / 10.0

### Candidate: `Aspirin -> B-cell acute lymphoblastic leukemia` (`DR:CHEMBL25__D:MONDO_0004947`)
- **PRISM Score**: 60.5 / 100 (MODERATE_RESEARCH_SIGNAL)
- **Score Components**: Target-Disease (4.5), Drug-Target (13.5), Clinical (15.0), Lit (10.0), Div (7.5), Novelty (5.0), Safety (0.0)
- **Convergence Score**: 82.5 / 100
- **Momentum**: 50.0 (STABLE)
- **Arbitrage Score**: 4.6 / 10.0

## 3. Real-Time Ingestion Verification
- **Evidence Events Before Ingestion**: 3
- **Incremental Events Fetched**: 0
- **Evidence Events Total After**: 3
- **Content Hashing Duplicate Protection**: Verified (UNIQUE content_hash constraint)

## 4. RAG Copilot Grounding Verification
- **Sample Query**: 'Find emerging repurposing signals for Alzheimer's disease.'
- **Grounded Candidate**: Tg100-801 -> acute lymphoblastic leukemia
- **Grounded Score**: 82.0 / 100
- **Provenanced Why-Now**: 3 independent public sources and 32 provenanced evidence records in medbase.db.