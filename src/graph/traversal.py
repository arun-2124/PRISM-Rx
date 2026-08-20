"""
Graph Traversal Engine & Candidate Discovery Service for PRISM-Rx Knowledge Graph
"""

import json
from pathlib import Path
from typing import List, Dict, Any, Optional

from .builder import Node, Edge, Path as GraphPath, CandidateSignal, EvidenceRecord
from .queries import (
    get_connection,
    query_drug_nodes,
    query_disease_nodes,
    query_target_nodes,
    query_drug_targets,
    query_target_diseases,
    query_drug_indications,
    query_drug_warnings,
    query_clinical_trials_for_drug,
    query_evidence_records,
    query_repurposing_candidate_paths,
)


class GraphTraversalEngine:
    """High-performance Python Knowledge Graph Traversal Engine backed by SQLite."""

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or Path("data/unified/medbase.db")

    def _get_conn(self):
        return get_connection(self.db_path)

    def get_drug_targets(self, drug_id: str) -> List[Edge]:
        """Fetch Drug -> Target edges."""
        conn = self._get_conn()
        try:
            records = query_drug_targets(conn, drug_id)
            edges = []
            for r in records:
                edges.append(Edge(
                    type="TARGETS",
                    source_id=r['drug_id'],
                    target_id=r['target_id'],
                    properties={
                        "action_type": r['action_type'],
                        "mechanism_of_action": r['mechanism_of_action'],
                        "target_symbol": r['approved_symbol'],
                        "target_name": r['approved_name'],
                        "target_class": r['target_class'],
                        "source": r['source'],
                        "source_version": r['source_version'],
                    }
                ))
            return edges
        finally:
            conn.close()

    def get_target_diseases(self, target_id: str) -> List[Edge]:
        """Fetch Target -> Disease edges."""
        conn = self._get_conn()
        try:
            records = query_target_diseases(conn, target_id)
            edges = []
            for r in records:
                edges.append(Edge(
                    type="ASSOCIATED_WITH",
                    source_id=r['target_id'],
                    target_id=r['disease_id'],
                    properties={
                        "score": r['score'],
                        "disease_name": r['disease_name'],
                        "source": r['source'],
                        "source_version": r['source_version'],
                    }
                ))
            return edges
        finally:
            conn.close()

    def get_drug_indications(self, drug_id: str) -> List[Edge]:
        """Fetch Drug -> Disease indication edges."""
        conn = self._get_conn()
        try:
            records = query_drug_indications(conn, drug_id)
            edges = []
            for r in records:
                edges.append(Edge(
                    type="INDICATED_FOR",
                    source_id=r['drug_id'],
                    target_id=r['disease_id'],
                    properties={
                        "max_clinical_stage": r['max_clinical_stage'],
                        "disease_name": r['disease_name'],
                        "source": r['source'],
                        "source_version": r['source_version'],
                    }
                ))
            return edges
        finally:
            conn.close()

    def get_drug_warnings(self, drug_id: str) -> List[EvidenceRecord]:
        """Fetch drug warnings (contradictory evidence)."""
        conn = self._get_conn()
        try:
            records = query_drug_warnings(conn, drug_id)
            warnings = []
            for r in records:
                warnings.append(EvidenceRecord(
                    id=f"WARN:{r['drug_id']}:{r['warning_type']}",
                    source=r['source'],
                    dataset_version=r['source_version'],
                    evidence_type="drug_warning",
                    support_status="CONTRADICTS",
                    confidence_score=1.0,
                    clinical_stage=r['warning_type'],
                ))
            return warnings
        finally:
            conn.close()

    def find_repurposing_candidates(
        self,
        drug_name: Optional[str] = None,
        disease_name: Optional[str] = None,
        min_score: float = 0.2,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Main Phase 4 Service:
        Traverses Drug -> Target -> Disease where Drug is NOT already indicated for Disease.
        Returns structured candidate payloads with paths, supporting evidence, contradictory evidence,
        clinical evidence, publication evidence, and source counts.
        """
        conn = self._get_conn()
        try:
            records = query_repurposing_candidate_paths(
                conn, drug_name=drug_name, disease_name=disease_name, min_score=min_score, limit=limit
            )

            # Group records by (drug_id, disease_id)
            candidates_map: Dict[str, Dict[str, Any]] = {}

            for r in records:
                key = f"{r['drug_id']}||{r['disease_id']}"
                if key not in candidates_map:
                    drug_node = Node(
                        id=r['drug_id'],
                        type="Drug",
                        name=r['drug_name'] or r['chembl_id'],
                        properties={
                            "chembl_id": r['chembl_id'],
                            "drug_type": r['drug_type'],
                            "max_clinical_stage": r['drug_max_stage'],
                        }
                    )
                    disease_node = Node(
                        id=r['disease_id'],
                        type="Disease",
                        name=r['disease_name'],
                        properties={"source_id": r['disease_source_id']}
                    )

                    # Fetch warnings & clinical trials for this drug
                    raw_warnings = query_drug_warnings(conn, r['drug_id'])
                    contradictory_evidence = []
                    for w in raw_warnings:
                        contradictory_evidence.append(EvidenceRecord(
                            id=f"WARN:{r['drug_id']}:{w['warning_type']}",
                            source=w['source'],
                            dataset_version=w['source_version'],
                            evidence_type="drug_warning",
                            support_status="CONTRADICTS",
                            confidence_score=1.0,
                            clinical_stage=w['warning_type'],
                        ).to_dict())

                    raw_trials = query_clinical_trials_for_drug(conn, r['drug_id'])

                    candidates_map[key] = {
                        "drug": drug_node.to_dict(),
                        "disease": disease_node.to_dict(),
                        "paths": [],
                        "supporting_evidence": [],
                        "contradictory_evidence": contradictory_evidence,
                        "clinical_evidence": raw_trials,
                        "publication_evidence": [],
                        "source_count": 1,
                        "established_indication": False,
                        "indication_stage": None,
                    }

                # Construct 2-hop Path: Drug --TARGETS--> Target --ASSOCIATED_WITH--> Disease
                target_node = Node(
                    id=r['target_id'],
                    type="Target",
                    name=r['approved_symbol'],
                    properties={
                        "approved_name": r['approved_name'],
                        "target_class": r['target_class'],
                    }
                )

                dt_edge = Edge(
                    type="TARGETS",
                    source_id=r['drug_id'],
                    target_id=r['target_id'],
                    properties={
                        "action_type": r['action_type'],
                        "mechanism_of_action": r['mechanism_of_action'],
                        "source": r['dt_source'],
                        "source_version": r['dt_version'],
                    }
                )

                td_edge = Edge(
                    type="ASSOCIATED_WITH",
                    source_id=r['target_id'],
                    target_id=r['disease_id'],
                    properties={
                        "score": r['target_disease_score'],
                        "source": r['td_source'],
                        "source_version": r['td_version'],
                    }
                )

                path_obj = GraphPath(
                    nodes=[
                        Node(id=r['drug_id'], type="Drug", name=r['drug_name'] or r['chembl_id']),
                        target_node,
                        Node(id=r['disease_id'], type="Disease", name=r['disease_name']),
                    ],
                    edges=[dt_edge, td_edge],
                    score=r['target_disease_score'] or 0.0
                )

                candidates_map[key]["paths"].append(path_obj.to_dict())

                # Add supporting evidence for this target-disease link
                ev_records = query_evidence_records(conn, target_id=r['target_id'], disease_id=r['disease_id'])
                for ev in ev_records:
                    pubs = []
                    if ev.get('publication_ids'):
                        try:
                            pubs = json.loads(ev['publication_ids'])
                        except Exception:
                            pass
                    candidates_map[key]["supporting_evidence"].append(EvidenceRecord(
                        id=str(ev['id']),
                        source=ev['source'],
                        dataset_version=ev['source_version'],
                        evidence_type=ev.get('evidence_type'),
                        confidence_score=ev.get('score'),
                        support_status="SUPPORTS",
                        clinical_stage=ev.get('clinical_stage'),
                        publication_ids=pubs,
                        clinical_report_id=ev.get('clinical_report_id'),
                        retrieved_at=ev.get('retrieved_at'),
                    ).to_dict())

                    if pubs and len(candidates_map[key]["publication_evidence"]) < 10:
                        for p in pubs:
                            candidates_map[key]["publication_evidence"].append({"publication_id": p})

            # Calculate source counts
            results = list(candidates_map.values())
            for res in results:
                sources = set()
                for p in res["paths"]:
                    for e in p["edges"]:
                        s = e["properties"].get("source")
                        if s:
                            sources.add(s)
                for ev in res["supporting_evidence"]:
                    if ev.get("source"):
                        sources.add(ev["source"])
                res["source_count"] = len(sources) if sources else 1

            return results[:limit]
        finally:
            conn.close()


def find_repurposing_candidates(
    drug_name: Optional[str] = None,
    disease_name: Optional[str] = None,
    min_score: float = 0.2,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """Helper module function wrapping GraphTraversalEngine."""
    engine = GraphTraversalEngine()
    return engine.find_repurposing_candidates(
        drug_name=drug_name, disease_name=disease_name, min_score=min_score, limit=limit
    )
