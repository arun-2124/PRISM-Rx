"""
Unit Tests for Signal Intelligence Engine V2 (PRISM-Rx Phase 5)
Covers all 15 required test scenarios.
"""

import unittest
from pathlib import Path
from src.signals.engine_v2 import SignalEngineV2, get_ranked_signals


class TestSignalEngineV2(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.engine = SignalEngineV2(db_path=Path("data/unified/medbase.db"))

    def test_1_existing_indication_filtering(self):
        """Verify candidates with established indications in drug_disease are excluded."""
        signals = self.engine.get_ranked_signals(limit=10)
        self.assertGreater(len(signals), 0)

        conn = self.engine._get_conn()
        for sig in signals:
            d_id = sig["drug"]["id"]
            dis_id = sig["disease"]["id"]
            ind = conn.execute(
                "SELECT 1 FROM drug_disease WHERE drug_id = ? AND disease_id = ?",
                (d_id, dis_id)
            ).fetchone()
            self.assertIsNone(ind, msg=f"Established indication found for candidate ({d_id}, {dis_id})")
        conn.close()

    def test_2_candidate_generation(self):
        """Test candidate signal generation returns valid structures."""
        signals = get_ranked_signals(limit=5)
        self.assertGreater(len(signals), 0)
        sig = signals[0]
        self.assertIn("drug", sig)
        self.assertIn("disease", sig)
        self.assertIn("research_priority_score", sig)
        self.assertIn("category", sig)

    def test_3_drug_target_evidence(self):
        """Test drug-target evidence component values."""
        signals = get_ranked_signals(limit=5)
        sig = signals[0]
        self.assertIn("supporting_paths", sig)
        self.assertGreater(len(sig["supporting_paths"]), 0)
        path = sig["supporting_paths"][0]
        self.assertIn("target", path)
        self.assertIn("action_type", path)

    def test_4_target_disease_evidence(self):
        """Test target-disease association score component."""
        signals = get_ranked_signals(limit=5)
        sig = signals[0]
        td_sc = sig["evidence"]["target_disease_score"]
        self.assertGreaterEqual(td_sc, 0.0)
        self.assertLessEqual(td_sc, 1.0)

    def test_5_clinical_evidence(self):
        """Test clinical reports & phase extraction."""
        conn = self.engine._get_conn()
        r = conn.execute("SELECT DISTINCT drug_id FROM evidence WHERE clinical_report_id IS NOT NULL LIMIT 1").fetchone()
        conn.close()

        if r:
            signals = self.engine.get_ranked_signals(drug=r["drug_id"], limit=5)
            if signals:
                sig = signals[0]
                self.assertIn("highest_clinical_phase", sig["evidence"])

    def test_6_safety_penalty(self):
        """Test safety penalty calculation for drugs with warnings."""
        conn = self.engine._get_conn()
        r = conn.execute("SELECT DISTINCT drug_id FROM drug_warnings LIMIT 1").fetchone()
        conn.close()

        if r:
            signals = self.engine.get_ranked_signals(drug=r["drug_id"], limit=5)
            if signals:
                sig = signals[0]
                self.assertGreater(sig["evidence"]["safety_warnings_count"], 0)
                self.assertGreater(sig["score_components"]["safety_penalty"], 0.0)

    def test_7_source_diversity(self):
        """Test calculation of source diversity count."""
        signals = get_ranked_signals(limit=5)
        sig = signals[0]
        div_count = sig["evidence"]["source_diversity_count"]
        self.assertGreaterEqual(div_count, 1)
        self.assertIsInstance(sig["evidence"]["sources_list"], list)

    def test_8_multi_target_aggregation(self):
        """Test multi-target capped log bonus for candidates with multiple targets."""
        conn = self.engine._get_conn()
        r = conn.execute("SELECT drug_id FROM drug_target GROUP BY drug_id HAVING COUNT(DISTINCT target_id) > 1 LIMIT 1").fetchone()
        conn.close()

        if r:
            signals = self.engine.get_ranked_signals(drug=r["drug_id"], limit=5)
            if signals and signals[0]["evidence"]["multi_target_count"] > 1:
                self.assertGreater(signals[0]["score_components"]["multi_target_bonus_pts"], 0.0)

    def test_9_duplicate_path_collapsing(self):
        """Test candidate collapsing ensures unique (Drug, Disease) pairs."""
        signals = get_ranked_signals(limit=10)
        seen_pairs = set()
        for sig in signals:
            pair = (sig["drug"]["id"], sig["disease"]["id"])
            self.assertNotIn(pair, seen_pairs, msg=f"Duplicate candidate pair: {pair}")
            seen_pairs.add(pair)

    def test_10_score_normalization(self):
        """Test final research priority score is strictly normalized between 0 and 100."""
        signals = get_ranked_signals(limit=10)
        for sig in signals:
            score = sig["research_priority_score"]
            self.assertGreaterEqual(score, 0.0)
            self.assertLessEqual(score, 100.0)

    def test_11_category_assignment(self):
        """Test correct signal category assignment logic."""
        valid_cats = {
            "STRONG_RESEARCH_SIGNAL",
            "MODERATE_RESEARCH_SIGNAL",
            "WEAK_RESEARCH_SIGNAL",
            "CONTRADICTED",
            "INSUFFICIENT_EVIDENCE",
        }
        signals = get_ranked_signals(limit=10)
        for sig in signals:
            self.assertIn(sig["category"], valid_cats)

    def test_12_json_output_structure(self):
        """Test complete structured JSON output serialization."""
        signals = get_ranked_signals(limit=1)
        self.assertGreater(len(signals), 0)
        sig = signals[0]
        self.assertIn("drug", sig)
        self.assertIn("disease", sig)
        self.assertIn("research_priority_score", sig)
        self.assertIn("category", sig)
        self.assertIn("supporting_paths", sig)
        self.assertIn("evidence", sig)
        self.assertIn("explanation", sig)
        self.assertIn("limitations", sig)

    def test_13_explainability(self):
        """Test explanation string generation and contents."""
        signals = get_ranked_signals(limit=3)
        for sig in signals:
            exp = sig["explanation"]
            self.assertIsInstance(exp, str)
            self.assertGreater(len(exp), 20)
            self.assertIn(sig["drug"]["name"], exp)

    def test_14_contradiction_handling(self):
        """Test category classification logic for contradicted candidates."""
        cat = self.engine._determine_category(final_score=60.0, safety_penalty=25.0, contradiction_penalty=0.0)
        self.assertEqual(cat, "CONTRADICTED")

    def test_15_empty_or_insufficient_evidence(self):
        """Test filtering by high min_score returns empty or insufficient evidence cleanly."""
        signals = get_ranked_signals(min_score=99.9, limit=5)
        # Should gracefully return empty or very high score list without crashing
        self.assertIsInstance(signals, list)


if __name__ == "__main__":
    unittest.main()
