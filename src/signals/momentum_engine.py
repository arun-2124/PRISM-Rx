"""
Momentum Engine Module for PRISM-Rx Signal Intelligence
Calculates evidence momentum, growth rate, acceleration, and direction.
"""

from typing import Dict, Any, List, Optional
from src.database.connection import execute_query


class MomentumEngine:
    """Calculates evidence growth rate, momentum score (0-100), and direction."""

    def __init__(self, conn: Any):
        self.conn = conn

    def calculate_momentum(self, drug_id: str, disease_id: str) -> Dict[str, Any]:
        """Calculates evidence acceleration, percentage change, and momentum score."""
        clean_drug_id = drug_id.replace("DR:", "") if drug_id.startswith("DR:") else drug_id
        clean_disease_id = disease_id.replace("D:", "") if disease_id.startswith("D:") else disease_id

        # 1. Fetch timestamped clinical trials
        trials = list(execute_query(self.conn, """
            SELECT cr.trial_start_date
            FROM evidence e
            JOIN clinical_reports cr ON e.clinical_report_id = cr.id
            WHERE (e.drug_id = ? OR e.drug_id = ?)
              AND (e.disease_id = ? OR e.disease_id = ?)
              AND cr.trial_start_date IS NOT NULL
        """, (drug_id, clean_drug_id, disease_id, clean_disease_id)).fetchall())

        # 2. Fetch evidence events
        events = list(execute_query(self.conn, """
            SELECT event_type, created_at
            FROM evidence_events
            WHERE (drug_id = ? OR drug_id = ?)
        """, (drug_id, clean_drug_id)).fetchall())

        # 3. Fetch evidence records count
        ev_count_row = execute_query(self.conn, """
            SELECT COUNT(*) FROM evidence
            WHERE (drug_id = ? OR drug_id = ?)
              AND (disease_id = ? OR disease_id = ?)
        """, (drug_id, clean_drug_id, disease_id, clean_disease_id)).fetchone()

        ev_count = list(ev_count_row.values())[0] if isinstance(ev_count_row, dict) else ev_count_row[0]

        trial_count = len(trials)
        event_count = len(events)

        total_temporal_records = trial_count + event_count

        # If no temporal data exists at all
        if total_temporal_records == 0 and ev_count == 0:
            return {
                "momentum_score": 0.0,
                "momentum_percent_change": 0.0,
                "momentum_direction": "INSUFFICIENT_DATA",
                "evidence_acceleration": 0.0,
                "recent_activity_count": 0,
                "baseline_activity_count": 0,
                "status": "INSUFFICIENT_DATA"
            }

        # Calculate temporal split based on dates or available records
        # Count recent activity (dates in recent years e.g., 2024-2026 vs <= 2023)
        recent_trials = 0
        baseline_trials = 0

        for r in trials:
            d_val = str(r["trial_start_date"] if isinstance(r, dict) else r[0])
            if any(y in d_val for y in ["2024", "2025", "2026"]):
                recent_trials += 1
            else:
                baseline_trials += 1

        recent_events = event_count
        recent_total = recent_trials + recent_events + (1 if ev_count > 0 else 0)
        baseline_total = max(1, baseline_trials + (ev_count if ev_count > 0 else 1))

        # Calculate percentage growth
        percent_change = round(((recent_total - baseline_total) / float(baseline_total)) * 100.0, 1)
        if total_temporal_records > 0 and percent_change <= 0:
            percent_change = float(recent_total * 25.0)

        # Normalize Momentum Score (0-100)
        momentum_score = round(min(100.0, max(0.0, (recent_total * 20.0) + (percent_change * 0.4))), 1)

        # Determine direction
        if momentum_score >= 25.0 or percent_change >= 20.0:
            direction = "RISING"
        elif momentum_score >= 10.0 or percent_change >= 0.0:
            direction = "STABLE"
        elif total_temporal_records > 0:
            direction = "DECLINING"
        else:
            direction = "INSUFFICIENT_DATA"

        return {
            "momentum_score": momentum_score,
            "momentum_percent_change": percent_change,
            "momentum_direction": direction,
            "evidence_acceleration": round(recent_total * 1.5, 1),
            "recent_activity_count": recent_total,
            "baseline_activity_count": baseline_total,
            "status": "CALCULATED"
        }
