"""
Signal Intelligence Engine V2 (PRISM-Rx Phase 5)

Transforms raw graph paths into ranked, explainable, evidence-aware Computational Research Signals.

Usage:
  python -m src.signals.engine_v2 [--drug NAME] [--disease NAME] [--category CAT] [--top N] [--json]
"""

import sqlite3
import json
import math
import time
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

DB_PATH = Path("data/unified/medbase.db")

# Action type confidence weights
ACTION_CONFIDENCE = {
    'INHIBITOR': 0.9,
    'ANTAGONIST': 0.9,
    'BLOCKER': 0.8,
    'AGONIST': 0.8,
    'OPENER': 0.7,
    'MODULATOR': 0.7,
    'POSITIVE_MODULATOR': 0.7,
    'NEGATIVE_MODULATOR': 0.7,
    'REGULATOR': 0.6,
}

# Clinical phase score mapping
CLINICAL_PHASE_WEIGHTS = {
    'PHASE_4': 1.0,
    'APPROVAL': 1.0,
    'PHASE_3': 0.8,
    'PHASE_2': 0.6,
    'PHASE_1': 0.4,
    'PHASE_0': 0.2,
    'PRECLINICAL': 0.1,
}


def get_connection(db_path: Path = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    return conn


class SignalEngineV2:
    """Evidence-Aware Signal Intelligence Engine for Drug Repurposing Hypotheses."""

    _cache: Dict[str, Any] = {}

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or DB_PATH

    def _get_conn(self) -> sqlite3.Connection:
        return get_connection(self.db_path)

    def get_ranked_signals(
        self,
        limit: int = 50,
        min_score: float = 0.0,
        drug: Optional[str] = None,
        disease: Optional[str] = None,
        category: Optional[str] = None,
        min_evidence: int = 0,
        clinical_only: bool = False,
        source: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves, collapses, scores, ranks, and synthesizes explainable research signals.
        """
        # Cache key for unfiltered/broad queries
        cache_key = f"base_ranked_{min_score}_{min_evidence}_{clinical_only}_{category}_{source}_{drug}_{disease}"
        
        # Check cache if no specific drug/disease filter or if base query cached
        if not drug and not disease and cache_key in SignalEngineV2._cache:
            all_cached = SignalEngineV2._cache[cache_key]
            filtered = [
                s for s in all_cached
                if s["research_priority_score"] >= min_score
                and (not category or s["category"].upper() == category.upper())
                and (not clinical_only or s["evidence"]["highest_clinical_phase"] not in ('PRECLINICAL', 'Phase N/A'))
                and (not min_evidence or s["evidence"]["source_diversity_count"] >= min_evidence)
            ]
            return filtered[:limit]

        conn = get_connection(self.db_path)
        try:
            # 1. Fetch Candidate Paths & Collapse Duplicates by (drug_id, disease_id)
            query = """
            SELECT 
                d.id as drug_id, d.name as drug_name, d.chembl_id, d.drug_type, d.max_clinical_stage as drug_max_stage,
                t.id as target_id, t.approved_symbol, t.approved_name, t.target_class,
                dt.action_type, dt.mechanism_of_action, dt.source as dt_source,
                dis.id as disease_id, dis.name as disease_name, dis.source_id as disease_source_id,
                td.score as td_score, td.source as td_source
            FROM drug_target dt
            JOIN drugs d ON dt.drug_id = d.id
            JOIN targets t ON dt.target_id = t.id
            JOIN target_disease td ON td.target_id = t.id
            JOIN diseases dis ON td.disease_id = dis.id
            LEFT JOIN drug_disease dd ON dd.drug_id = d.id AND dd.disease_id = dis.id
            WHERE dd.drug_id IS NULL
            """
            params = []

            if drug:
                query += " AND (d.name LIKE ? OR d.id = ? OR d.chembl_id = ?)"
                params.extend([f"%{drug}%", drug, drug])

            if disease:
                query += " AND (dis.name LIKE ? OR dis.id = ? OR dis.source_id = ?)"
                params.extend([f"%{disease}%", disease, disease])

            query += " ORDER BY td.score DESC LIMIT ?"
            params.append(limit * 20)

            rows = conn.execute(query, params).fetchall()

            # Group rows into unique candidates
            candidates_map: Dict[str, Dict[str, Any]] = {}

            for r in rows:
                key = f"{r['drug_id']}||{r['disease_id']}"
                if key not in candidates_map:
                    candidates_map[key] = {
                        "drug_id": r['drug_id'],
                        "drug_name": r['drug_name'] or r['chembl_id'],
                        "chembl_id": r['chembl_id'],
                        "drug_type": r['drug_type'],
                        "drug_max_stage": r['drug_max_stage'],
                        "disease_id": r['disease_id'],
                        "disease_name": r['disease_name'],
                        "disease_source_id": r['disease_source_id'],
                        "supporting_paths": [],
                        "target_ids": set(),
                        "sources": set(),
                        "max_td_score": 0.0,
                        "action_confidences": [],
                    }

                cand = candidates_map[key]
                cand["target_ids"].add(r['target_id'])

                td_sc = r['td_score'] or 0.0
                if td_sc > cand["max_td_score"]:
                    cand["max_td_score"] = td_sc

                if r['dt_source']:
                    cand["sources"].add(r['dt_source'])
                if r['td_source']:
                    cand["sources"].add(r['td_source'])

                action = r['action_type']
                act_conf = ACTION_CONFIDENCE.get(action, 0.5) if action else 0.5
                cand["action_confidences"].append(act_conf)

                cand["supporting_paths"].append({
                    "target": {
                        "id": r['target_id'],
                        "symbol": r['approved_symbol'],
                        "name": r['approved_name'],
                        "class": r['target_class'],
                    },
                    "action_type": action,
                    "mechanism": r['mechanism_of_action'],
                    "target_disease_score": round(td_sc, 3),
                    "source": r['td_source'] or "Open Targets",
                })

            # 2. Batch Fetch Evidence, Warnings & Trials across all Candidate Drugs
            unique_drug_ids = list({c["drug_id"] for c in candidates_map.values()})
            warnings_by_drug: Dict[str, List[Dict[str, Any]]] = {}
            trials_by_drug: Dict[str, List[Dict[str, Any]]] = {}
            ev_counts_by_drug: Dict[str, Tuple[int, int]] = {}

            if unique_drug_ids:
                placeholders = ",".join("?" for _ in unique_drug_ids)

                # Batch 1: Warnings
                w_rows = conn.execute(
                    f"SELECT drug_id, warning_type, toxicity_class, description FROM drug_warnings WHERE drug_id IN ({placeholders})",
                    unique_drug_ids
                ).fetchall()
                for w in w_rows:
                    warnings_by_drug.setdefault(w["drug_id"], []).append(dict(w))

                # Batch 2: Clinical Reports
                tr_rows = conn.execute(f"""
                    SELECT DISTINCT e.drug_id, cr.id, cr.source_name, cr.clinical_stage, cr.trial_phase, cr.trial_status, cr.url
                    FROM evidence e
                    JOIN clinical_reports cr ON e.clinical_report_id = cr.id
                    WHERE e.drug_id IN ({placeholders})
                """, unique_drug_ids).fetchall()
                for tr in tr_rows:
                    trials_by_drug.setdefault(tr["drug_id"], []).append(dict(tr))

                # Batch 3: Evidence counts
                e_rows = conn.execute(f"""
                    SELECT drug_id, COUNT(*) as ev_cnt, COUNT(DISTINCT publication_ids) as lit_cnt
                    FROM evidence
                    WHERE drug_id IN ({placeholders})
                    GROUP BY drug_id
                """, unique_drug_ids).fetchall()
                for er in e_rows:
                    ev_counts_by_drug[er["drug_id"]] = (er["ev_cnt"] or 0, er["lit_cnt"] or 0)

            # 3. Compute Scores per Candidate
            results = []

            for key, cand in candidates_map.items():
                drug_id = cand["drug_id"]
                warning_list = warnings_by_drug.get(drug_id, [])
                trial_list = trials_by_drug.get(drug_id, [])
                ev_count, lit_count = ev_counts_by_drug.get(drug_id, (0, 0))

                if ev_count > 0:
                    cand["sources"].add("Europe PMC")
                if len(trial_list) > 0:
                    cand["sources"].add("ClinicalTrials.gov")

                # Filter checks
                if len(cand["sources"]) < min_evidence:
                    continue
                if clinical_only and len(trial_list) == 0:
                    continue
                if source and not any(source.lower() in s.lower() for s in cand["sources"]):
                    continue

                # Calculate Scoring Dimensions
                score_comps, final_score = self._calculate_scores(
                    cand=cand,
                    warning_list=warning_list,
                    trial_list=trial_list,
                    ev_count=ev_count,
                    lit_count=lit_count,
                )

                if final_score < min_score:
                    continue

                category_name = self._determine_category(
                    final_score=final_score,
                    safety_penalty=score_comps["safety_penalty"],
                    contradiction_penalty=score_comps["contradiction_penalty"]
                )

                if category and category.upper() != category_name.upper():
                    continue

                # 4. Construct Payload
                payload = {
                    "drug": {
                        "id": cand["drug_id"],
                        "name": cand["drug_name"],
                        "chembl_id": cand["chembl_id"],
                        "type": cand["drug_type"],
                        "max_stage": cand["drug_max_stage"],
                    },
                    "disease": {
                        "id": cand["disease_id"],
                        "name": cand["disease_name"],
                        "source_id": cand["disease_source_id"],
                    },
                    "research_priority_score": round(final_score, 1),
                    "category": category_name,
                    "supporting_paths": cand["supporting_paths"],
                    "evidence": {
                        "target_disease_score": round(cand["max_td_score"], 3),
                        "drug_target_confidence": round(score_comps["action_conf_val"], 2),
                        "highest_clinical_phase": score_comps["highest_phase"],
                        "evidence_records_count": ev_count,
                        "literature_count": lit_count,
                        "source_diversity_count": len(cand["sources"]),
                        "sources_list": sorted(list(cand["sources"])),
                        "multi_target_count": len(cand["target_ids"]),
                        "safety_warnings_count": len(warning_list),
                        "contradictions_count": 1 if score_comps["contradiction_penalty"] > 0 else 0,
                    },
                    "score_components": score_comps,
                    "explanation": self._generate_explanation(cand, score_comps, category_name, warning_list, trial_list),
                    "limitations": [
                        "Computational hypothesis generated from public biological datasets (Open Targets 26.06).",
                        "Does NOT constitute medical advice, clinical efficacy prediction, or safety clearance.",
                        "Absence of safety warnings in database does not guarantee safety.",
                    ]
                }

                results.append(payload)

            results.sort(key=lambda x: x["research_priority_score"], reverse=True)
            if not drug and not disease:
                SignalEngineV2._cache[cache_key] = results
            return results[:limit]
        finally:
            conn.close()

    def _calculate_scores(
        self,
        cand: Dict[str, Any],
        warning_list: List[Dict[str, Any]],
        trial_list: List[Dict[str, Any]],
        ev_count: int,
        lit_count: int,
    ) -> Tuple[Dict[str, Any], float]:
        """Calculates multi-factor evidence score components."""
        # A. Target-Disease Score (max 30 pts)
        max_td = cand["max_td_score"]
        s_td = max_td * 30.0

        # B. Drug-Target Action Confidence (max 15 pts)
        avg_act_conf = (sum(cand["action_confidences"]) / len(cand["action_confidences"])) if cand["action_confidences"] else 0.5
        s_dt = avg_act_conf * 15.0

        # C. Clinical Precedence Score (max 15 pts)
        highest_phase = "PRECLINICAL"
        max_phase_score = 0.1
        for tr in trial_list:
            phase = (tr.get("trial_phase") or tr.get("clinical_stage") or "").upper()
            sc = CLINICAL_PHASE_WEIGHTS.get(phase, 0.1)
            if sc > max_phase_score:
                max_phase_score = sc
                highest_phase = phase if phase else "PHASE_UNKNOWN"

        s_clin = max_phase_score * 15.0

        # D. Literature & Evidence Tier (max 10 pts)
        if ev_count > 50 or lit_count > 10:
            s_lit = 10.0
            ev_tier = "HIGH"
        elif ev_count > 0 or lit_count > 0:
            s_lit = 7.0
            ev_tier = "MEDIUM"
        else:
            s_lit = 4.0
            ev_tier = "LOW"

        # E. Source Diversity Factor (max 10 pts)
        num_sources = len(cand["sources"])
        f_div = min(1.0, num_sources / 4.0) * 10.0

        # F. Multi-Target Bonus (max 10 pts)
        num_targets = len(cand["target_ids"])
        b_target = min(10.0, 5.0 * math.log2(num_targets)) if num_targets > 1 else 0.0

        # G. Under-Investigated Novelty Score (max 10 pts)
        s_nov = 10.0 if len(trial_list) == 0 else 5.0

        # H. Safety Penalty (-40 to 0 pts)
        p_safety = 0.0
        for w in warning_list:
            w_desc = str(w.get("description", "")).lower()
            w_type = str(w.get("warning_type", "")).lower()
            if "black box" in w_desc or "black box" in w_type or "withdrawn" in w_type:
                p_safety += 25.0
            else:
                p_safety += 10.0
        p_safety = min(40.0, p_safety)

        # I. Contradiction Penalty (-30 to 0 pts)
        p_contra = 0.0
        if p_safety >= 25.0:
            p_contra = 15.0

        raw_score = s_td + s_dt + s_clin + s_lit + f_div + b_target + s_nov - p_safety - p_contra
        final_score = max(0.0, min(100.0, raw_score))

        score_components = {
            "target_disease_pts": round(s_td, 2),
            "drug_target_pts": round(s_dt, 2),
            "clinical_pts": round(s_clin, 2),
            "literature_pts": round(s_lit, 2),
            "source_diversity_pts": round(f_div, 2),
            "multi_target_bonus_pts": round(b_target, 2),
            "novelty_pts": round(s_nov, 2),
            "safety_penalty": round(p_safety, 2),
            "contradiction_penalty": round(p_contra, 2),
            "action_conf_val": avg_act_conf,
            "highest_phase": highest_phase,
            "evidence_tier": ev_tier,
        }

        return score_components, final_score

    def _determine_category(self, final_score: float, safety_penalty: float, contradiction_penalty: float) -> str:
        """Determines signal classification category."""
        if safety_penalty >= 25.0 or contradiction_penalty > 0:
            return "CONTRADICTED"
        elif final_score >= 70.0:
            return "STRONG_RESEARCH_SIGNAL"
        elif final_score >= 40.0:
            return "MODERATE_RESEARCH_SIGNAL"
        elif final_score >= 20.0:
            return "WEAK_RESEARCH_SIGNAL"
        else:
            return "INSUFFICIENT_EVIDENCE"

    def _generate_explanation(
        self,
        cand: Dict[str, Any],
        sc: Dict[str, Any],
        category: str,
        warnings: List[Dict[str, Any]],
        trials: List[Dict[str, Any]],
    ) -> str:
        """Generates dynamic human-readable explanation text."""
        parts = []
        drug = cand["drug_name"]
        disease = cand["disease_name"]
        num_targets = len(cand["target_ids"])
        num_sources = len(cand["sources"])

        parts.append(
            f"Candidate '{drug}' is prioritized for '{disease}' with a Research Priority Score of {round(sc.get('target_disease_pts', 0) + sc.get('drug_target_pts', 0), 1)}/100."
        )

        if num_targets > 1:
            parts.append(f"It is supported by multi-target activity across {num_targets} biological targets.")
        else:
            parts.append(f"It is supported by a single primary target mechanism.")

        if trials:
            parts.append(f"Clinical trial evidence is available (highest stage: {sc['highest_phase']}).")
        else:
            parts.append("No clinical trials for this condition were identified in the current database.")

        parts.append(f"Evidence is verified across {num_sources} independent data source(s).")

        if warnings:
            parts.append(f"WARNING: Candidate received a safety penalty of {sc['safety_penalty']} pts due to {len(warnings)} recorded drug warning(s).")

        if category == "CONTRADICTED":
            parts.append("This hypothesis is classified as CONTRADICTED due to significant safety warnings or opposing mechanisms.")
        elif category == "STRONG_RESEARCH_SIGNAL":
            parts.append("Classified as a STRONG_RESEARCH_SIGNAL for laboratory or in-silico validation.")

        return " ".join(parts)


def get_ranked_signals(
    limit: int = 50,
    min_score: float = 0.0,
    drug: Optional[str] = None,
    disease: Optional[str] = None,
    category: Optional[str] = None,
    min_evidence: int = 0,
    clinical_only: bool = False,
    source: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Global service function wrapping SignalEngineV2."""
    engine = SignalEngineV2()
    return engine.get_ranked_signals(
        limit=limit,
        min_score=min_score,
        drug=drug,
        disease=disease,
        category=category,
        min_evidence=min_evidence,
        clinical_only=clinical_only,
        source=source,
    )


def format_signal_v2(sig: Dict[str, Any], idx: int = 1) -> str:
    """Format signal v2 payload for console display."""
    lines = []
    lines.append("=" * 70)
    lines.append(f"SIGNAL #{idx}: {sig['category']} ({sig['research_priority_score']}/100)")
    lines.append("Computational Research Hypothesis - NOT A MEDICAL RECOMMENDATION")
    lines.append("=" * 70)
    lines.append(f"  Drug:                   {sig['drug']['name']} ({sig['drug']['id']}) [{sig['drug']['type']}]")
    lines.append(f"  Disease:                {sig['disease']['name']} ({sig['disease']['id']})")
    lines.append(f"  Research Priority Score:{sig['research_priority_score']}/100")
    lines.append(f"  Multi-Target Hits:      {sig['evidence']['multi_target_count']}")
    lines.append(f"  Source Diversity:       {sig['evidence']['source_diversity_count']} ({', '.join(sig['evidence']['sources_list'])})")
    lines.append(f"  Highest Clinical Phase: {sig['evidence']['highest_clinical_phase']}")
    lines.append(f"  Safety Warnings Count:  {sig['evidence']['safety_warnings_count']}")
    lines.append("")
    lines.append("  Explanation:")
    lines.append(f"    {sig['explanation']}")
    lines.append("=" * 70)
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Signal Intelligence Engine V2")
    parser.add_argument("--drug", type=str, help="Filter by drug name or ID")
    parser.add_argument("--disease", type=str, help="Filter by disease name or ID")
    parser.add_argument("--category", type=str, help="Filter by signal category (e.g. STRONG_RESEARCH_SIGNAL)")
    parser.add_argument("--min-score", type=float, default=0.0, help="Minimum research priority score (default: 0)")
    parser.add_argument("--top", type=int, default=10, help="Number of signals to display (default: 10)")
    parser.add_argument("--json", action="store_true", help="Output raw JSON payload")
    args = parser.parse_args()

    t0 = time.time()
    signals = get_ranked_signals(
        drug=args.drug,
        disease=args.disease,
        category=args.category,
        min_score=args.min_score,
        limit=args.top,
    )
    elapsed = time.time() - t0

    print("=" * 70)
    print("SIGNAL INTELLIGENCE ENGINE V2 — COMPUTATIONAL RESEARCH HYPOTHESES")
    print(f"Evaluated & Ranked in {elapsed*1000:.2f} ms")
    print("=" * 70)

    if not signals:
        print("\nNo research signals found matching specified criteria.")
        return

    if args.json:
        print(json.dumps(signals, indent=2))
    else:
        for i, sig in enumerate(signals, 1):
            print(format_signal_v2(sig, i))
            print()


if __name__ == "__main__":
    main()
