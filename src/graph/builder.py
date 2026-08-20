"""
Graph Builder & Data Models for PRISM-Rx Knowledge Graph
"""

from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional, Literal


@dataclass
class EvidenceRecord:
    id: str
    source: str = "Open Targets"
    dataset_version: str = "26.06"
    evidence_type: Optional[str] = None
    confidence_score: Optional[float] = None
    support_status: Literal["SUPPORTS", "CONTRADICTS", "UNKNOWN"] = "SUPPORTS"
    clinical_stage: Optional[str] = None
    publication_ids: List[str] = field(default_factory=list)
    clinical_report_id: Optional[str] = None
    retrieved_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Node:
    id: str
    type: Literal["Drug", "Target", "Disease", "ClinicalTrial", "Publication", "Mechanism", "Evidence"]
    name: str
    properties: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Edge:
    type: Literal["TARGETS", "ASSOCIATED_WITH", "INDICATED_FOR", "STUDIED_IN", "MENTIONED_IN", "HAS_MECHANISM", "SUPPORTED_BY", "CONTRADICTED_BY"]
    source_id: str
    target_id: str
    properties: Dict[str, Any] = field(default_factory=dict)
    evidence: List[EvidenceRecord] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d['evidence'] = [e.to_dict() for e in self.evidence]
        return d


@dataclass
class Path:
    nodes: List[Node]
    edges: List[Edge]
    score: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "nodes": [n.to_dict() for n in self.nodes],
            "edges": [e.to_dict() for e in self.edges],
            "score": self.score,
        }


@dataclass
class CandidateSignal:
    drug: Node
    disease: Node
    paths: List[Path]
    supporting_evidence: List[EvidenceRecord] = field(default_factory=list)
    contradictory_evidence: List[EvidenceRecord] = field(default_factory=list)
    clinical_evidence: List[Dict[str, Any]] = field(default_factory=list)
    publication_evidence: List[Dict[str, Any]] = field(default_factory=list)
    source_count: int = 1
    established_indication: bool = False
    indication_stage: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "drug": self.drug.to_dict(),
            "disease": self.disease.to_dict(),
            "paths": [p.to_dict() for p in self.paths],
            "supporting_evidence": [e.to_dict() for e in self.supporting_evidence],
            "contradictory_evidence": [e.to_dict() for e in self.contradictory_evidence],
            "clinical_evidence": self.clinical_evidence,
            "publication_evidence": self.publication_evidence,
            "source_count": self.source_count,
            "established_indication": self.established_indication,
            "indication_stage": self.indication_stage,
        }
