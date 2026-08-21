"""
Unit Tests for PRISM Signal Intelligence Layer
Tests LatentSignalDetector, MomentumEngine, WhyNowEngine, and SignalIntelligenceService.
"""

import unittest
from pathlib import Path
from src.database.connection import get_db_connection
from src.signals.latent_signal_detector import LatentSignalDetector
from src.signals.momentum_engine import MomentumEngine
from src.signals.why_now_engine import WhyNowEngine
from src.signals.signal_intelligence_service import SignalIntelligenceService


class TestSignalIntelligence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.backend, cls.conn = get_db_connection()
        cls.latent_detector = LatentSignalDetector(cls.conn)
        cls.momentum_engine = MomentumEngine(cls.conn)
        cls.why_now_engine = WhyNowEngine(cls.conn)
        cls.service = SignalIntelligenceService()

    @classmethod
    def tearDownClass(cls):
        cls.conn.close()

    def test_latent_signal_detector(self):
        """Test Latent Signal Detector output structure and score calculation."""
        res = self.latent_detector.detect_latent_signal("DR:CHEMBL403989", "D:MONDO_0004967")
        self.assertIn("latent_signal_score", res)
        self.assertIn("signal_lifecycle", res)
        self.assertGreaterEqual(res["latent_signal_score"], 0.0)
        self.assertLessEqual(res["latent_signal_score"], 100.0)
        self.assertIn(res["signal_lifecycle"], ["LATENT", "EMERGING", "ESTABLISHED", "CONTRADICTED"])

    def test_momentum_engine(self):
        """Test Momentum Engine score, direction, and percent change calculation."""
        res = self.momentum_engine.calculate_momentum("DR:CHEMBL403989", "D:MONDO_0004967")
        self.assertIn("momentum_score", res)
        self.assertIn("momentum_direction", res)
        self.assertIn("momentum_percent_change", res)
        self.assertIn(res["momentum_direction"], ["RISING", "STABLE", "DECLINING", "INSUFFICIENT_DATA"])

    def test_why_now_engine(self):
        """Test Why-Now Engine structured factors and summary generation."""
        res = self.why_now_engine.generate_why_now("DR:CHEMBL403989", "D:MONDO_0004967", "Tg100-801", "acute lymphoblastic leukemia")
        self.assertIn("why_now_factors", res)
        self.assertIn("why_now_summary", res)
        self.assertGreater(len(res["why_now_factors"]), 0)
        self.assertIn("Tg100-801", res["why_now_summary"])

    def test_signal_intelligence_service_kpis(self):
        """Test Signal Intelligence Service KPI calculation."""
        kpis = self.service.get_dashboard_kpis()
        self.assertIn("emerging_signals_count", kpis)
        self.assertIn("latent_signals_count", kpis)
        self.assertIn("rising_signals_count", kpis)
        self.assertGreater(kpis["emerging_signals_count"], 0)

    def test_emerging_radar_ranking(self):
        """Test Emerging Radar Signal ranking returns non-empty structured list."""
        radar = self.service.get_emerging_radar_signals(limit=5)
        self.assertGreater(len(radar), 0)
        self.assertIn("emerging_priority_score", radar[0])
        self.assertIn("latent_signal_score", radar[0])
        self.assertIn("momentum_score", radar[0])


if __name__ == "__main__":
    unittest.main()
