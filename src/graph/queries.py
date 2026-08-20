"""
Database Query Primitives for PRISM-Rx Knowledge Graph Abstraction
Executes optimized SQL queries over medbase.db to fetch nodes, edges, paths, and evidence.
"""

import sqlite3
import json
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

DB_PATH = Path("data/unified/medbase.db")


def get_connection(db_path: Path = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    return conn


def query_drug_nodes(conn: sqlite3.Connection, identifier: str) -> List[Dict[str, Any]]:
    query = """
    SELECT id, chembl_id, name, drug_type, max_clinical_stage, trade_names, canonical_smiles
    FROM drugs
    WHERE id = ? OR chembl_id = ? OR name LIKE ?
    LIMIT 10
    """
    rows = conn.execute(query, (identifier, identifier, f"%{identifier}%")).fetchall()
    return [dict(r) for r in rows]


def query_disease_nodes(conn: sqlite3.Connection, identifier: str) -> List[Dict[str, Any]]:
    query = """
    SELECT id, source_id, name, description, therapeutic_areas, is_therapeutic_area
    FROM diseases
    WHERE id = ? OR source_id = ? OR name LIKE ?
    LIMIT 10
    """
    rows = conn.execute(query, (identifier, identifier, f"%{identifier}%")).fetchall()
    return [dict(r) for r in rows]


def query_target_nodes(conn: sqlite3.Connection, identifier: str) -> List[Dict[str, Any]]:
    query = """
    SELECT id, ensembl_id, approved_symbol, approved_name, target_class, uniprot_ids
    FROM targets
    WHERE id = ? OR ensembl_id = ? OR approved_symbol = ? OR approved_symbol LIKE ?
    LIMIT 10
    """
    rows = conn.execute(query, (identifier, identifier, identifier, f"%{identifier}%")).fetchall()
    return [dict(r) for r in rows]


def query_drug_targets(conn: sqlite3.Connection, drug_id: str) -> List[Dict[str, Any]]:
    query = """
    SELECT 
        d.id as drug_id, d.name as drug_name, d.chembl_id,
        t.id as target_id, t.approved_symbol, t.approved_name, t.target_class,
        dt.action_type, dt.mechanism_of_action, dt.source, dt.source_version, dt.retrieved_at
    FROM drug_target dt
    JOIN drugs d ON dt.drug_id = d.id
    JOIN targets t ON dt.target_id = t.id
    WHERE dt.drug_id = ?
    """
    rows = conn.execute(query, (drug_id,)).fetchall()
    return [dict(r) for r in rows]


def query_target_diseases(conn: sqlite3.Connection, target_id: str) -> List[Dict[str, Any]]:
    query = """
    SELECT 
        t.id as target_id, t.approved_symbol,
        dis.id as disease_id, dis.name as disease_name,
        td.score, td.source, td.source_version, td.retrieved_at
    FROM target_disease td
    JOIN targets t ON td.target_id = t.id
    JOIN diseases dis ON td.disease_id = dis.id
    WHERE td.target_id = ?
    ORDER BY td.score DESC
    """
    rows = conn.execute(query, (target_id,)).fetchall()
    return [dict(r) for r in rows]


def query_drug_indications(conn: sqlite3.Connection, drug_id: str) -> List[Dict[str, Any]]:
    query = """
    SELECT 
        dd.drug_id, dd.disease_id, dis.name as disease_name,
        dd.max_clinical_stage, dd.source, dd.source_version
    FROM drug_disease dd
    JOIN diseases dis ON dd.disease_id = dis.id
    WHERE dd.drug_id = ?
    """
    rows = conn.execute(query, (drug_id,)).fetchall()
    return [dict(r) for r in rows]


def query_drug_warnings(conn: sqlite3.Connection, drug_id: str) -> List[Dict[str, Any]]:
    query = """
    SELECT 
        dw.drug_id, dw.warning_type, dw.toxicity_class, dw.country,
        dw.description, dw.efo_id, dw.year, dw.source, dw.source_version
    FROM drug_warnings dw
    WHERE dw.drug_id = ?
    """
    rows = conn.execute(query, (drug_id,)).fetchall()
    return [dict(r) for r in rows]


def query_clinical_trials_for_drug(conn: sqlite3.Connection, drug_id: str) -> List[Dict[str, Any]]:
    query = """
    SELECT DISTINCT
        cr.id as trial_id, cr.source_name, cr.clinical_stage, cr.trial_phase,
        cr.trial_status, cr.trial_study_type, cr.url, cr.trial_start_date
    FROM evidence e
    JOIN clinical_reports cr ON e.clinical_report_id = cr.id
    WHERE e.drug_id = ?
    LIMIT 20
    """
    rows = conn.execute(query, (drug_id,)).fetchall()
    return [dict(r) for r in rows]


def query_evidence_records(conn: sqlite3.Connection, drug_id: Optional[str] = None, target_id: Optional[str] = None, disease_id: Optional[str] = None) -> List[Dict[str, Any]]:
    query = """
    SELECT 
        id, drug_id, target_id, disease_id, evidence_type, clinical_stage,
        score, direction_on_trait, direction_on_target, publication_ids,
        clinical_report_id, source, source_version, retrieved_at
    FROM evidence
    WHERE 1=1
    """
    params = []
    if drug_id:
        query += " AND drug_id = ?"
        params.append(drug_id)
    if target_id:
        query += " AND target_id = ?"
        params.append(target_id)
    if disease_id:
        query += " AND disease_id = ?"
        params.append(disease_id)

    query += " ORDER BY score DESC LIMIT 50"
    rows = conn.execute(query, params).fetchall()
    return [dict(r) for r in rows]


def query_repurposing_candidate_paths(
    conn: sqlite3.Connection,
    drug_name: Optional[str] = None,
    disease_name: Optional[str] = None,
    min_score: float = 0.2,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Core Graph Traversal Query:
    Drug --[TARGETS]--> Target --[ASSOCIATED_WITH]--> Disease
    WHERE Drug is NOT already indicated for Disease in drug_disease table.
    """
    query = """
    SELECT 
        d.id as drug_id, d.name as drug_name, d.chembl_id, d.drug_type, d.max_clinical_stage as drug_max_stage,
        t.id as target_id, t.approved_symbol, t.approved_name, t.target_class,
        dt.action_type, dt.mechanism_of_action, dt.source as dt_source, dt.source_version as dt_version,
        dis.id as disease_id, dis.name as disease_name, dis.source_id as disease_source_id,
        td.score as target_disease_score, td.source as td_source, td.source_version as td_version,
        dd.max_clinical_stage as established_indication_stage
    FROM drug_target dt
    JOIN drugs d ON dt.drug_id = d.id
    JOIN targets t ON dt.target_id = t.id
    JOIN target_disease td ON td.target_id = t.id
    JOIN diseases dis ON td.disease_id = dis.id
    LEFT JOIN drug_disease dd ON dd.drug_id = d.id AND dd.disease_id = dis.id
    WHERE dd.drug_id IS NULL
      AND td.score >= ?
    """
    params = [min_score]

    if drug_name:
        query += " AND (d.name LIKE ? OR d.id = ? OR d.chembl_id = ?)"
        params.extend([f"%{drug_name}%", drug_name, drug_name])

    if disease_name:
        query += " AND (dis.name LIKE ? OR dis.id = ? OR dis.source_id = ?)"
        params.extend([f"%{disease_name}%", disease_name, disease_name])

    query += " ORDER BY td.score DESC LIMIT ?"
    params.append(limit * 10)

    rows = conn.execute(query, params).fetchall()
    return [dict(r) for r in rows]
