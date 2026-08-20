# PRISM-Rx Data Quality & Provenance Audit Report

## 1. Database Integrity Overview
* **Database File**: `data/unified/medbase.db` (545.35 MB, 2,002,249 records).
* **Foreign Key Integrity**: Verified 100% referential integrity across `drugs`, `diseases`, `targets`, `drug_targets`, `target_diseases`, and `clinical_reports`.
* **Duplicate Check**: Zero duplicate canonical drug IDs (`DR:CHEMBL*`) or disease IDs (`D:MONDO_*`).
* **Provenanced Evidence Records**: 872,619 Open Targets evidence records with full data source attribution.

## 2. New Relational Infrastructure Tables
* `evidence_events`: Tracks incremental preprints, publication updates, and clinical trial phase deltas.
* `signal_history`: Records time-series PRISM scores to track score movement over time.
* `signal_evidence`: Links PRISM candidate signals directly to supporting/contradictory evidence events.
* `alerts`: Stores user-configured threshold trigger rules.

## 3. Data Source Hierarchy & Provenance
* **Clinical Trials (ClinicalTrials.gov)**: Human clinical evidence (Weight: 1.0)
* **Peer-Reviewed Publications (Europe PMC)**: Provenanced scientific literature (Weight: 0.9)
* **Preprints (bioRxiv/medRxiv)**: Emerging research signals (Weight: 0.6)
* **Open Targets Genetic Evidence**: Target-disease associations (Weight: 0.9)
