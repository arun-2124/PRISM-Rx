"""
ASCII & Console Visualization Utilities for Knowledge Graph Paths
"""

from typing import Dict, Any, List


def format_path_ascii(path: Dict[str, Any], idx: int = 1) -> str:
    """Format a single multi-hop graph path into an ASCII tree."""
    nodes = path.get("nodes", [])
    edges = path.get("edges", [])

    if len(nodes) < 2 or len(edges) < 1:
        return "Invalid path structure"

    lines = []
    lines.append(f"--- PATH #{idx} (Score: {path.get('score', 0.0):.2f}) ---")

    for i in range(len(edges)):
        src_node = nodes[i]
        edge = edges[i]
        dst_node = nodes[i + 1]

        edge_type = edge.get("type", "CONNECTED_TO")
        props = edge.get("properties", {})
        prop_str_list = []
        for k, v in props.items():
            if v and k not in ["source_version"]:
                prop_str_list.append(f"{k}: {v}")
        prop_str = ", ".join(prop_str_list[:3])

        lines.append(f"  {src_node['type']}: {src_node['name']} ({src_node['id']})")
        lines.append(f"    |")
        lines.append(f"    |-- [{edge_type}] ({prop_str})")
        lines.append(f"    v")

    last_node = nodes[-1]
    lines.append(f"  {last_node['type']}: {last_node['name']} ({last_node['id']})")
    return "\n".join(lines)


def format_candidate_summary(candidate: Dict[str, Any], idx: int = 1) -> str:
    """Format a complete candidate signal payload with evidence details."""
    drug = candidate["drug"]
    disease = candidate["disease"]
    paths = candidate.get("paths", [])
    sup_ev = candidate.get("supporting_evidence", [])
    con_ev = candidate.get("contradictory_evidence", [])
    cli_ev = candidate.get("clinical_evidence", [])

    lines = []
    lines.append("=" * 70)
    lines.append(f"POTENTIAL REPURPOSING RESEARCH SIGNAL #{idx}")
    lines.append("Computational Research Hypothesis - NOT A MEDICAL RECOMMENDATION")
    lines.append("=" * 70)
    lines.append(f"  Drug:                {drug['name']} ({drug['id']})")
    lines.append(f"  Target Disease:      {disease['name']} ({disease['id']})")
    lines.append(f"  Existing Indication: {'YES' if candidate.get('established_indication') else 'NONE (Novel Candidate)'}")
    lines.append(f"  Paths Discovered:    {len(paths)}")
    lines.append(f"  Supporting Evidence: {len(sup_ev)} records")
    lines.append(f"  Warnings/Tox:        {len(con_ev)} records")
    lines.append(f"  Clinical Trials:     {len(cli_ev)} records")
    lines.append(f"  Sources Count:       {candidate.get('source_count', 1)}")

    if paths:
        lines.append("\n  Primary Graph Traversal Path:")
        path_ascii = format_path_ascii(paths[0], 1)
        for pline in path_ascii.split("\n"):
            lines.append(f"    {pline}")

    if con_ev:
        lines.append("\n  [CONTRADICTORY EVIDENCE / WARNINGS]:")
        for w in con_ev[:3]:
            lines.append(f"    - [{w['support_status']}] {w['evidence_type']} ({w['clinical_stage']})")

    lines.append("=" * 70)
    return "\n".join(lines)
