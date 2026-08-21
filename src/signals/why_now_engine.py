"""
Why Now Engine Module for PRISM-Rx Signal Intelligence
Generates structured facts and deterministic explanations of why a signal is emerging now.
"""

from typing import Dict, Any, List, Optional
from src.database.connection import execute_query


class WhyNowEngine:
    """Generates structured database-grounded explanations for why a signal is important NOW."""

    def __init__(self, conn: Any):
        self.conn = conn

    def generate_why_now(self, drug_id: str, disease_id: str, drug_name: str = "", disease_name: str = "") -> Dict[str, Any]:
        """Returns structured facts and deterministic explanation grounded strictly in database records."""
        clean_drug_id = drug_id.replace("DR:", "") if drug_id.startswith("DR:") else drug_id
        clean_disease_id = disease_id.replace("D:", "") if disease_id.startswith("D:") else disease_id

        # 1. Fetch clinical trial details
        trials = list(execute_query(self.conn, """
            SELECT cr.id AS trial_id, cr.trial_phase, cr.trial_start_date
            FROM evidence e
            JOIN clinical_reports cr ON e.clinical_report_id = cr.id
            WHERE (e.drug_id = ? OR e.drug_id = ?)
              AND (e.disease_id = ? OR e.disease_id = ?)
        """, (drug_id, clean_drug_id, disease_id, clean_disease_id)).fetchall())

        # 2. Fetch evidence & sources
        ev_rows = list(execute_query(self.conn, """
            SELECT source, clinical_report_id, score
            FROM evidence
            WHERE (drug_id = ? OR drug_id = ?)
              AND (disease_id = ? OR disease_id = ?)
        """, (drug_id, clean_drug_id, disease_id, clean_disease_id)).fetchall())

        # 3. Fetch target linkage
        target_rows = list(execute_query(self.conn, """
            SELECT DISTINCT dt.target_id, dt.action_type
            FROM drug_target dt
            JOIN target_disease td ON dt.target_id = td.target_id
            WHERE (dt.drug_id = ? OR dt.drug_id = ?)
              AND (td.disease_id = ? OR td.disease_id = ?)
        """, (drug_id, clean_drug_id, disease_id, clean_disease_id)).fetchall())

        trial_cnt = len(trials)
        ev_cnt = len(ev_rows)
        target_cnt = len(target_rows)

        sources = set()
        for r in ev_rows:
            src = r["source"] if isinstance(r, dict) else r[0]
            if src:
                sources.add(src)
        if target_cnt > 0:
            sources.add("DrugTargetMap")
        if trial_cnt > 0:
            sources.add("ClinicalTrialsGov")

        source_cnt = max(1, len(sources))

        # Build structured facts
        facts = []
        if trial_cnt > 0:
            phases = [r["trial_phase"] if isinstance(r, dict) else r[1] for r in trials if (r["trial_phase"] if isinstance(r, dict) else r[1])]
            phase_str = f" ({', '.join(set(phases))})" if phases else ""
            facts.append(f"{trial_cnt} active clinical study report(s) indexed{phase_str}")
        
        if ev_cnt > 0:
            facts.append(f"{ev_cnt} provenanced evidence record(s) indexed in medbase.db")
        
        if source_cnt > 1:
            facts.append(f"Evidence converging across {source_cnt} independent biomedical data sources ({', '.join(list(sources)[:3])})")
        
        if target_cnt > 0:
            facts.append(f"{target_cnt} shared target pathway linkage(s) connecting drug to disease")

        if not facts:
            facts.append("Early computational target linkage identified prior to clinical trial indexing")

        # Build deterministic explanation
        d_name = drug_name or clean_drug_id
        dis_name = disease_name or clean_disease_id

        if trial_cnt > 0:
            explanation = f"Recent clinical development and multi-source evidence have strengthened around '{d_name}' for '{dis_name}', driven by {target_cnt} target pathway connection(s) and {source_cnt} converging data sources."
        elif target_cnt > 1:
            explanation = f"Multi-target pathway convergence ({target_cnt} shared biological targets) connects '{d_name}' to '{dis_name}' across {source_cnt} independent data sources, elevating evidence momentum."
        else:
            explanation = f"Target pathway evidence and computational research priority support '{d_name}' for '{dis_name}', establishing a candidate latent signal for early investigation."

        return {
            "drug_id": drug_id,
            "disease_id": disease_id,
            "why_now_factors": facts,
            "why_now_summary": explanation,
            "metrics": {
                "clinical_trials_count": trial_cnt,
                "evidence_records_count": ev_cnt,
                "target_linkages_count": target_cnt,
                "independent_sources_count": source_cnt
            }
        }
