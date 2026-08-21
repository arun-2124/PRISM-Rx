"""
Latent Signal Detector Module for PRISM-Rx Signal Intelligence
Detects hidden, multi-source biomedical evidence convergence for drug-disease pairs.
"""

from typing import Dict, Any, List, Optional
from src.database.connection import execute_query


class LatentSignalDetector:
    """Detects latent drug-disease relationships and calculates Latent Signal Score (0-100)."""

    def __init__(self, conn: Any):
        self.conn = conn

    def detect_latent_signal(self, drug_id: str, disease_id: str, base_signal: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Calculates Latent Signal Score (0-100) and assesses multi-source evidence convergence."""
        clean_drug_id = drug_id.replace("DR:", "") if drug_id.startswith("DR:") else drug_id
        clean_disease_id = disease_id.replace("D:", "") if disease_id.startswith("D:") else disease_id

        # 1. Target-Disease Linkage Convergence (0-25 pts)
        target_rows = list(execute_query(self.conn, """
            SELECT DISTINCT dt.target_id, dt.action_type
            FROM drug_target dt
            JOIN target_disease td ON dt.target_id = td.target_id
            WHERE (dt.drug_id = ? OR dt.drug_id = ?) 
              AND (td.disease_id = ? OR td.disease_id = ?)
        """, (drug_id, clean_drug_id, disease_id, clean_disease_id)).fetchall())

        target_count = len(target_rows)
        target_convergence_score = min(25.0, target_count * 8.33)

        # 2. Mechanistic Evidence Confidence (0-20 pts)
        action_types = [r["action_type"] if isinstance(r, dict) else r[1] for r in target_rows if (r["action_type"] if isinstance(r, dict) else r[1])]
        mechanistic_weight = 0.5
        if any(act in ['INHIBITOR', 'ANTAGONIST', 'BLOCKER'] for act in action_types):
            mechanistic_weight = 1.0
        elif any(act in ['AGONIST', 'MODULATOR', 'OPENER'] for act in action_types):
            mechanistic_weight = 0.8
        mechanistic_score = min(20.0, (target_count * 6.0) * mechanistic_weight) if target_count > 0 else 5.0

        # 3. Literature Support (0-20 pts)
        ev_rows = list(execute_query(self.conn, """
            SELECT source, clinical_report_id, score
            FROM evidence
            WHERE (drug_id = ? OR drug_id = ?)
              AND (disease_id = ? OR disease_id = ?)
        """, (drug_id, clean_drug_id, disease_id, clean_disease_id)).fetchall())

        evidence_count = len(ev_rows)
        literature_score = min(20.0, evidence_count * 4.0)

        # 4. Clinical Evidence & Phase (0-15 pts)
        clinical_trials = list(execute_query(self.conn, """
            SELECT cr.trial_phase, cr.has_expert_review
            FROM evidence e
            JOIN clinical_reports cr ON e.clinical_report_id = cr.id
            WHERE (e.drug_id = ? OR e.drug_id = ?)
              AND (e.disease_id = ? OR e.disease_id = ?)
        """, (drug_id, clean_drug_id, disease_id, clean_disease_id)).fetchall())

        trial_count = len(clinical_trials)
        has_phase_3_4 = any((r["trial_phase"] if isinstance(r, dict) else r[0]) in ['PHASE_3', 'PHASE_4', 'APPROVAL'] for r in clinical_trials)
        clinical_score = min(15.0, trial_count * 4.0 + (5.0 if has_phase_3_4 else 2.0 if trial_count > 0 else 0.0))

        # 5. Source Diversity (0-10 pts)
        sources = set()
        for r in ev_rows:
            src = r["source"] if isinstance(r, dict) else r[0]
            if src:
                sources.add(src)

        if target_count > 0:
            sources.add("DrugTargetMap")
        if trial_count > 0:
            sources.add("ClinicalTrialsGov")

        source_count = max(1, len(sources))
        source_diversity_score = min(10.0, source_count * 3.33)

        recent_row = execute_query(self.conn, """
            SELECT COUNT(*) FROM evidence_events
            WHERE (drug_id = ? OR drug_id = ?)
        """, (drug_id, clean_drug_id)).fetchone()
        raw_val = list(recent_row.values())[0] if isinstance(recent_row, dict) else recent_row[0] if recent_row else 0
        recent_count = int(raw_val or 0)
        recent_activity_score = min(10.0, recent_count * 5.0 + (3.0 if evidence_count > 0 else 0.0))

        # Calculate Total Normalized Latent Signal Score (0-100)
        total_latent_score = round(
            target_convergence_score +
            mechanistic_score +
            literature_score +
            clinical_score +
            source_diversity_score +
            recent_activity_score, 1
        )
        total_latent_score = max(0.0, min(100.0, total_latent_score))

        # Determine Signal Lifecycle State
        # Check established indication
        ind_row = execute_query(self.conn, """
            SELECT 1 FROM drug_disease
            WHERE (drug_id = ? OR drug_id = ?)
              AND (disease_id = ? OR disease_id = ?)
        """, (drug_id, clean_drug_id, disease_id, clean_disease_id)).fetchone()
        is_established = ind_row is not None

        # Check safety warnings / contradictions
        warn_row = execute_query(self.conn, """
            SELECT COUNT(*) FROM drug_warnings
            WHERE (drug_id = ? OR drug_id = ?)
        """, (drug_id, clean_drug_id)).fetchone()
        warn_cnt = list(warn_row.values())[0] if isinstance(warn_row, dict) else warn_row[0]

        if is_established:
            lifecycle = "ESTABLISHED"
            lifecycle_label = "ESTABLISHED INDICATION"
        elif warn_cnt >= 3:
            lifecycle = "CONTRADICTED"
            lifecycle_label = "CONTRADICTED SIGNAL"
        elif total_latent_score >= 50.0 or target_count >= 2:
            lifecycle = "EMERGING"
            lifecycle_label = "EMERGING SIGNAL"
        else:
            lifecycle = "LATENT"
            lifecycle_label = "LATENT SIGNAL"

        return {
            "drug_id": drug_id,
            "disease_id": disease_id,
            "latent_signal_score": total_latent_score,
            "signal_lifecycle": lifecycle,
            "signal_lifecycle_label": lifecycle_label,
            "breakdown": {
                "target_convergence_score": round(target_convergence_score, 1),
                "mechanistic_score": round(mechanistic_score, 1),
                "literature_score": round(literature_score, 1),
                "clinical_score": round(clinical_score, 1),
                "source_diversity_score": round(source_diversity_score, 1),
                "recent_activity_score": round(recent_activity_score, 1),
            },
            "metrics": {
                "target_count": target_count,
                "evidence_count": evidence_count,
                "trial_count": trial_count,
                "source_count": source_count,
                "recent_event_count": recent_count,
                "is_established": is_established
            }
        }
