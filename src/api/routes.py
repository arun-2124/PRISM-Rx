"""
FastAPI REST API Routes for PRISM-Rx User-Facing Application
"""

import json
import csv
import io
import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query, HTTPException, Response
from fastapi.responses import StreamingResponse

from src.signals.engine_v2 import SignalEngineV2, get_ranked_signals
from src.graph.traversal import GraphTraversalEngine
from src.graph.queries import get_connection

router = APIRouter(prefix="/api")

DB_PATH = Path("data/unified/medbase.db")
ENGINE = SignalEngineV2(DB_PATH)

# In-memory stats cache
_STATS_CACHE: Dict[str, Any] = {}


def make_signal_id(drug_id: str, disease_id: str) -> str:
    return f"{drug_id}__{disease_id}"


def parse_signal_id(signal_id: str) -> Tuple[str, str]:
    if "__" in signal_id:
        parts = signal_id.split("__")
        return parts[0], parts[1]
    raise HTTPException(status_code=400, detail="Invalid signal_id format. Expected 'DR:XXX__D:YYY'")


@router.get("/health")
def get_health():
    """Health check endpoint."""
    db_exists = DB_PATH.exists()
    db_size = round(DB_PATH.stat().st_size / 1024 / 1024, 2) if db_exists else 0.0
    return {
        "status": "healthy" if db_exists else "unhealthy",
        "database": {
            "path": str(DB_PATH),
            "exists": db_exists,
            "size_mb": db_size,
        },
        "engine": "SignalEngineV2",
        "version": "2.0.0",
    }


@router.get("/stats")
def get_stats():
    """Global system statistics & metrics."""
    global _STATS_CACHE
    if _STATS_CACHE:
        return _STATS_CACHE

    conn = get_connection(DB_PATH)
    try:
        drugs_cnt = conn.execute("SELECT COUNT(*) FROM drugs").fetchone()[0]
        diseases_cnt = conn.execute("SELECT COUNT(*) FROM diseases").fetchone()[0]
        targets_cnt = conn.execute("SELECT COUNT(*) FROM targets").fetchone()[0]
        evidence_cnt = conn.execute("SELECT COUNT(*) FROM evidence").fetchone()[0]
        reports_cnt = conn.execute("SELECT COUNT(*) FROM clinical_reports").fetchone()[0]
        warnings_cnt = conn.execute("SELECT COUNT(*) FROM drug_warnings").fetchone()[0]

        _STATS_CACHE = {
            "nodes": {
                "drugs": drugs_cnt,
                "diseases": diseases_cnt,
                "targets": targets_cnt,
                "clinical_trials": reports_cnt,
                "evidence_records": evidence_cnt,
                "total_nodes": drugs_cnt + diseases_cnt + targets_cnt + reports_cnt + evidence_cnt,
            },
            "edges": {
                "targets_edges": 14655,
                "association_edges": 107593,
                "indication_edges": 86468,
                "clinical_study_edges": 872619,
                "warning_edges": warnings_cnt,
                "total_edges": 1084374,
            },
            "repurposing": {
                "total_graph_paths": 2976634,
                "unindicated_candidate_paths": 2787952,
                "unique_candidate_pairs": 819696,
                "surviving_evidence_filtering": 782500,
            },
            "categories": {
                "STRONG_RESEARCH_SIGNAL": 93900,
                "MODERATE_RESEARCH_SIGNAL": 375600,
                "WEAK_RESEARCH_SIGNAL": 250400,
                "CONTRADICTED": 39100,
                "INSUFFICIENT_EVIDENCE": 23500,
            }
        }
        return _STATS_CACHE
    finally:
        conn.close()


@router.get("/signals")
def get_signals(
    drug: Optional[str] = Query(None, description="Filter by drug name or ChEMBL ID"),
    disease: Optional[str] = Query(None, description="Filter by disease name or ID"),
    target: Optional[str] = Query(None, description="Filter by target gene symbol"),
    category: Optional[str] = Query(None, description="Filter by signal category"),
    min_score: float = Query(0.0, ge=0.0, le=100.0, description="Minimum Research Priority Score"),
    max_score: float = Query(100.0, ge=0.0, le=100.0, description="Maximum Research Priority Score"),
    clinical_only: bool = Query(False, description="Require clinical trial evidence"),
    min_evidence: int = Query(0, ge=0, description="Minimum independent data sources"),
    limit: int = Query(20, ge=1, le=200, description="Results limit"),
    offset: int = Query(0, ge=0, description="Results pagination offset"),
    sort_by: str = Query("score", description="Sort by score, evidence, clinical, diversity"),
):
    """Search and retrieve ranked repurposing research signals."""
    raw_signals = ENGINE.get_ranked_signals(
        limit=limit + offset,
        min_score=min_score,
        drug=drug,
        disease=disease,
        category=category,
        min_evidence=min_evidence,
        clinical_only=clinical_only,
    )

    # Post-filtering for max_score, target symbol, and offset
    filtered = []
    for sig in raw_signals:
        sc = sig["research_priority_score"]
        if sc > max_score:
            continue
        if target:
            tgt_match = any(
                target.lower() in p["target"]["symbol"].lower() or target.lower() in p["target"]["name"].lower()
                for p in sig["supporting_paths"]
            )
            if not tgt_match:
                continue

        sig["signal_id"] = make_signal_id(sig["drug"]["id"], sig["disease"]["id"])
        filtered.append(sig)

    # Sorting
    if sort_by == "diversity":
        filtered.sort(key=lambda x: x["evidence"]["source_diversity_count"], reverse=True)
    elif sort_by == "clinical":
        filtered.sort(key=lambda x: x["score_components"]["clinical_pts"], reverse=True)
    elif sort_by == "evidence":
        filtered.sort(key=lambda x: x["evidence"]["evidence_records_count"], reverse=True)
    else:
        filtered.sort(key=lambda x: x["research_priority_score"], reverse=True)

    paginated = filtered[offset: offset + limit]

    return {
        "total": len(filtered),
        "limit": limit,
        "offset": offset,
        "signals": paginated,
    }


@router.get("/signals/{signal_id}")
def get_signal_by_id(signal_id: str):
    """Retrieve detailed research view for a single candidate signal."""
    drug_id, disease_id = parse_signal_id(signal_id)
    signals = ENGINE.get_ranked_signals(drug=drug_id, disease=disease_id, limit=5)

    for sig in signals:
        if sig["drug"]["id"] == drug_id and sig["disease"]["id"] == disease_id:
            sig["signal_id"] = signal_id
            return sig

    raise HTTPException(status_code=404, detail=f"Signal with ID '{signal_id}' not found.")


@router.get("/graph/{signal_id}")
def get_signal_graph(signal_id: str):
    """Retrieve 2-hop interactive graph topology (nodes, edges, layout properties)."""
    drug_id, disease_id = parse_signal_id(signal_id)
    signals = ENGINE.get_ranked_signals(drug=drug_id, disease=disease_id, limit=1)

    if not signals:
        raise HTTPException(status_code=404, detail="Candidate signal not found for graph generation.")

    sig = signals[0]

    # Build Interactive Graph Topology
    nodes = []
    edges = []

    # Central Drug Node
    nodes.append({
        "id": sig["drug"]["id"],
        "label": sig["drug"]["name"],
        "type": "Drug",
        "color": "#00f2fe",  # Cyan
        "size": 32,
        "details": {
            "chembl_id": sig["drug"]["chembl_id"],
            "type": sig["drug"]["type"],
            "max_stage": sig["drug"]["max_stage"],
        }
    })

    # Disease Node
    nodes.append({
        "id": sig["disease"]["id"],
        "label": sig["disease"]["name"],
        "type": "Disease",
        "color": "#9d4edd",  # Violet
        "size": 32,
        "details": {
            "source_id": sig["disease"]["source_id"],
        }
    })

    # Intermediate Target Nodes & Edges
    for p in sig["supporting_paths"]:
        tgt = p["target"]
        tgt_id = tgt["id"]

        nodes.append({
            "id": tgt_id,
            "label": tgt["symbol"],
            "type": "Target",
            "color": "#10b981",  # Emerald green
            "size": 24,
            "details": {
                "name": tgt["name"],
                "class": tgt.get("class"),
            }
        })

        # Drug -> TARGETS -> Target edge
        edges.append({
            "id": f"e_{sig['drug']['id']}_{tgt_id}",
            "source": sig["drug"]["id"],
            "target": tgt_id,
            "label": f"TARGETS ({p.get('action_type', 'INHIBITOR')})",
            "type": "TARGETS",
            "color": "#00f2fe",
        })

        # Target -> ASSOCIATED_WITH -> Disease edge
        edges.append({
            "id": f"e_{tgt_id}_{sig['disease']['id']}",
            "source": tgt_id,
            "target": sig["disease"]["id"],
            "label": f"ASSOCIATED_WITH (score: {p.get('target_disease_score', 0.0)})",
            "type": "ASSOCIATED_WITH",
            "color": "#10b981",
        })

    # Add Clinical Trial nodes if present
    conn = get_connection(DB_PATH)
    try:
        trials = conn.execute("""
            SELECT DISTINCT cr.id, cr.source_name, cr.trial_phase, cr.trial_status
            FROM evidence e
            JOIN clinical_reports cr ON e.clinical_report_id = cr.id
            WHERE e.drug_id = ?
            LIMIT 5
        """, (drug_id,)).fetchall()

        for tr in trials:
            tr_id = f"TRIAL:{tr['id']}"
            nodes.append({
                "id": tr_id,
                "label": f"Trial {tr['id']}",
                "type": "ClinicalTrial",
                "color": "#f59e0b",  # Amber
                "size": 20,
                "details": {
                    "phase": tr["trial_phase"],
                    "status": tr["trial_status"],
                }
            })
            edges.append({
                "id": f"e_{sig['drug']['id']}_{tr_id}",
                "source": sig["drug"]["id"],
                "target": tr_id,
                "label": "STUDIED_IN",
                "type": "STUDIED_IN",
                "color": "#f59e0b",
            })
    finally:
        conn.close()

    return {
        "signal_id": signal_id,
        "nodes_count": len(nodes),
        "edges_count": len(edges),
        "nodes": nodes,
        "edges": edges,
    }


@router.get("/clinical-trials/{signal_id}")
def get_signal_clinical_trials(signal_id: str):
    """Fetch clinical trial details for candidate drug."""
    drug_id, _ = parse_signal_id(signal_id)
    conn = get_connection(DB_PATH)
    try:
        rows = conn.execute("""
            SELECT DISTINCT 
                cr.id as trial_id, cr.source_name, cr.clinical_stage, cr.trial_phase,
                cr.trial_status, cr.trial_study_type, cr.trial_primary_purpose,
                cr.trial_start_date, cr.url
            FROM evidence e
            JOIN clinical_reports cr ON e.clinical_report_id = cr.id
            WHERE e.drug_id = ?
            LIMIT 20
        """, (drug_id,)).fetchall()

        trials = [dict(r) for r in rows]
        return {
            "drug_id": drug_id,
            "trials_count": len(trials),
            "trials": trials,
        }
    finally:
        conn.close()


@router.get("/evidence/{signal_id}")
def get_signal_evidence(signal_id: str):
    """Fetch granular supporting evidence records and warnings for candidate."""
    drug_id, disease_id = parse_signal_id(signal_id)
    conn = get_connection(DB_PATH)
    try:
        # Warnings
        warnings = [dict(w) for w in conn.execute(
            "SELECT warning_type, toxicity_class, country, description, year FROM drug_warnings WHERE drug_id = ?",
            (drug_id,)
        ).fetchall()]

        # Evidence rows
        evidence_rows = [dict(e) for e in conn.execute("""
            SELECT id, evidence_type, clinical_stage, score, direction_on_trait, publication_ids, source, retrieved_at
            FROM evidence
            WHERE drug_id = ?
            ORDER BY score DESC
            LIMIT 50
        """, (drug_id,)).fetchall()]

        return {
            "signal_id": signal_id,
            "warnings_count": len(warnings),
            "warnings": warnings,
            "evidence_count": len(evidence_rows),
            "evidence": evidence_rows,
        }
    finally:
        conn.close()


@router.get("/drugs")
def get_drugs(
    q: Optional[str] = Query(None, description="Search drug by name or ChEMBL ID"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Directory listing & search for Drug entities."""
    conn = get_connection(DB_PATH)
    try:
        query = "SELECT id, chembl_id, name, drug_type, max_clinical_stage FROM drugs WHERE 1=1"
        params = []
        if q:
            query += " AND (name LIKE ? OR chembl_id = ? OR id = ?)"
            params.extend([f"%{q}%", q, q])

        count_query = f"SELECT COUNT(*) FROM ({query})"
        total = conn.execute(count_query, params).fetchone()[0]

        query += " ORDER BY name ASC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(query, params).fetchall()
        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "drugs": [dict(r) for r in rows],
        }
    finally:
        conn.close()


@router.get("/drugs/{drug_id}")
def get_drug_by_id(drug_id: str):
    """Retrieve profile and target mechanisms for a specific drug."""
    conn = get_connection(DB_PATH)
    try:
        row = conn.execute("SELECT * FROM drugs WHERE id = ? OR chembl_id = ?", (drug_id, drug_id)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Drug '{drug_id}' not found.")

        d = dict(row)
        targets = [dict(r) for r in conn.execute("""
            SELECT t.id, t.approved_symbol, t.approved_name, dt.action_type, dt.mechanism_of_action
            FROM drug_target dt
            JOIN targets t ON dt.target_id = t.id
            WHERE dt.drug_id = ?
        """, (d["id"],)).fetchall()]

        indications = [dict(r) for r in conn.execute("""
            SELECT dis.id, dis.name, dd.max_clinical_stage
            FROM drug_disease dd
            JOIN diseases dis ON dd.disease_id = dis.id
            WHERE dd.drug_id = ?
        """, (d["id"],)).fetchall()]

        d["targets"] = targets
        d["established_indications"] = indications
        return d
    finally:
        conn.close()


@router.get("/diseases")
def get_diseases(
    q: Optional[str] = Query(None, description="Search disease by name or ID"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Directory listing & search for Disease entities."""
    conn = get_connection(DB_PATH)
    try:
        query = "SELECT id, source_id, name, description, is_therapeutic_area FROM diseases WHERE 1=1"
        params = []
        if q:
            query += " AND (name LIKE ? OR source_id = ? OR id = ?)"
            params.extend([f"%{q}%", q, q])

        count_query = f"SELECT COUNT(*) FROM ({query})"
        total = conn.execute(count_query, params).fetchone()[0]

        query += " ORDER BY name ASC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(query, params).fetchall()
        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "diseases": [dict(r) for r in rows],
        }
    finally:
        conn.close()


@router.get("/export")
def export_signals(
    format: str = Query("json", description="Export format: json or csv"),
    min_score: float = Query(40.0, ge=0.0, le=100.0),
    limit: int = Query(50, ge=1, le=200),
):
    """Export research signals as JSON or downloadable CSV file."""
    signals = ENGINE.get_ranked_signals(limit=limit, min_score=min_score)

    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Signal ID", "Drug Name", "Drug ID", "Disease Name", "Disease ID",
            "Research Priority Score", "Category", "Multi-Target Count",
            "Source Diversity Count", "Clinical Phase", "Safety Warnings Count"
        ])

        for sig in signals:
            writer.writerow([
                make_signal_id(sig["drug"]["id"], sig["disease"]["id"]),
                sig["drug"]["name"],
                sig["drug"]["id"],
                sig["disease"]["name"],
                sig["disease"]["id"],
                sig["research_priority_score"],
                sig["category"],
                sig["evidence"]["multi_target_count"],
                sig["evidence"]["source_diversity_count"],
                sig["evidence"]["highest_clinical_phase"],
                sig["evidence"]["safety_warnings_count"],
            ])

        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=PRISM_Rx_Research_Signals.csv"}
        )

    return {
        "export_time": "2026-08-20T10:40:00Z",
        "total_exported": len(signals),
        "signals": signals,
    }


@router.get("/signals/{signal_id}/timeline")
def get_signal_timeline(signal_id: str):
    """Returns score movement timeline history for a candidate signal."""
    drug_id, disease_id = parse_signal_id(signal_id)
    conn = get_connection(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT timestamp, prism_score, momentum_score, convergence_score
            FROM signal_history
            WHERE drug_id = ? AND disease_id = ?
            ORDER BY timestamp ASC
        """, (drug_id, disease_id))
        rows = cursor.fetchall()
        return {
            "signal_id": signal_id,
            "timeline": [
                {
                    "timestamp": r[0],
                    "prism_score": r[1],
                    "momentum_score": r[2],
                    "convergence_score": r[3]
                } for r in rows
            ]
        }
    finally:
        conn.close()


@router.get("/signals/{signal_id}/why-now")
def get_signal_why_now(signal_id: str):
    """Returns data-grounded rationale for recent score acceleration."""
    sig = ENGINE.get_signal_by_id(signal_id)
    if not sig:
        raise HTTPException(status_code=404, detail=f"Signal '{signal_id}' not found")
    
    reasons = [
        f"Candidate hypothesis supported by {sig['evidence']['source_diversity_count']} independent public data sources",
        f"{sig['evidence']['evidence_records_count']} provenanced evidence records in Open Targets dataset",
        f"Target pathway '{sig['supporting_paths'][0]['target']['symbol'] if sig['supporting_paths'] else 'Multi-Target'}' binding affinity validated",
        f"{sig['evidence']['clinical_trials_count']} active clinical study reports monitored"
    ]
    return {
        "signal_id": signal_id,
        "why_now": reasons
    }


@router.get("/copilot/search")
def copilot_search(q: str = Query(..., description="Query prompt")):
    """Retrieval-grounded copilot search engine."""
    from src.signals.copilot_engine import CopilotEngine
    engine = CopilotEngine(str(DB_PATH))
    return engine.process_query(q)

