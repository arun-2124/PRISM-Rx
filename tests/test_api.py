"""
API Tests for PRISM-Rx FastAPI Backend Service
"""

import unittest
from fastapi.testclient import TestClient
from src.api.main import app


class TestFastAPIBackend(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_endpoint(self):
        """Test GET /api/health status."""
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["database"]["exists"])

    def test_stats_endpoint(self):
        """Test GET /api/stats metadata counts."""
        resp = self.client.get("/api/stats")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("nodes", data)
        self.assertIn("edges", data)
        self.assertIn("categories", data)
        self.assertGreater(data["nodes"]["total_nodes"], 1000000)

    def test_signals_list_endpoint(self):
        """Test GET /api/signals query and pagination."""
        resp = self.client.get("/api/signals?limit=5&min_score=30")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("signals", data)
        self.assertGreater(len(data["signals"]), 0)
        sig = data["signals"][0]
        self.assertIn("signal_id", sig)
        self.assertIn("research_priority_score", sig)

    def test_signal_details_endpoint(self):
        """Test GET /api/signals/{id} single signal lookup."""
        # Get a signal_id from list
        resp_list = self.client.get("/api/signals?limit=1")
        sig = resp_list.json()["signals"][0]
        signal_id = sig["signal_id"]

        resp = self.client.get(f"/api/signals/{signal_id}")
        self.assertEqual(resp.status_code, 200)
        detail = resp.json()
        self.assertEqual(detail["signal_id"], signal_id)
        self.assertIn("explanation", detail)
        self.assertIn("score_components", detail)

    def test_graph_topology_endpoint(self):
        """Test GET /api/graph/{id} 2-hop neighborhood generation."""
        resp_list = self.client.get("/api/signals?limit=1")
        signal_id = resp_list.json()["signals"][0]["signal_id"]

        resp = self.client.get(f"/api/graph/{signal_id}")
        self.assertEqual(resp.status_code, 200)
        graph = resp.json()
        self.assertIn("nodes", graph)
        self.assertIn("edges", graph)
        self.assertGreater(len(graph["nodes"]), 2)
        self.assertGreater(len(graph["edges"]), 1)

    def test_drugs_directory_endpoint(self):
        """Test GET /api/drugs directory search."""
        resp = self.client.get("/api/drugs?q=aspirin&limit=5")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("drugs", data)

    def test_diseases_directory_endpoint(self):
        """Test GET /api/diseases directory search."""
        resp = self.client.get("/api/diseases?q=cancer&limit=5")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("diseases", data)

    def test_export_endpoint(self):
        """Test GET /api/export endpoint for CSV and JSON."""
        resp_json = self.client.get("/api/export?format=json&limit=5")
        self.assertEqual(resp_json.status_code, 200)

        resp_csv = self.client.get("/api/export?format=csv&limit=5")
        self.assertEqual(resp_csv.status_code, 200)
        self.assertEqual(resp_csv.headers["content-type"], "text/csv; charset=utf-8")

    def test_signal_timeline_endpoint(self):
        """Test GET /api/signals/{signal_id}/timeline endpoint."""
        sig_id = "DR:CHEMBL403989__D:MONDO_0004967"
        resp = self.client.get(f"/api/signals/{sig_id}/timeline")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["signal_id"], sig_id)
        self.assertIn("events", data)
        self.assertEqual(data["temporal_evidence"], "AVAILABLE")
        self.assertEqual(data["temporal_acceleration"], "NOT_ESTABLISHED")

    def test_signal_why_now_endpoint(self):
        """Test GET /api/signals/{signal_id}/why-now endpoint."""
        sig_id = "DR:CHEMBL403989__D:MONDO_0004967"
        resp = self.client.get(f"/api/signals/{sig_id}/why-now")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["signal_id"], sig_id)
        self.assertIn("drivers", data)
        self.assertIn("explanation", data)
        self.assertEqual(data["temporal_acceleration"], "NOT_ESTABLISHED")

    def test_signal_status_emerging_candidate(self):
        """Test classification of unindicated candidate with evidence (EMERGING)."""
        sig_id = "DR:CHEMBL403989__D:MONDO_0004967"
        resp = self.client.get(f"/api/signals/{sig_id}")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("signal_status", data)
        self.assertEqual(data["signal_status"]["status"], "EMERGING")
        self.assertFalse(data["signal_status"]["established_indication"])

    def test_signal_status_established_candidate(self):
        """Test classification of established indication (ESTABLISHED)."""
        sig_id = "DR:CHEMBL4__D:EFO_0000544" # Ofloxacin -> infection
        resp = self.client.get(f"/api/signals/{sig_id}/status")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["classification"]["status"], "ESTABLISHED")
        self.assertTrue(data["classification"]["established_indication"])

    def test_score_invariance_after_status_classification(self):
        """Verify PRISM Priority Score remains exactly 82.0 for Tg100-801."""
        sig_id = "DR:CHEMBL403989__D:MONDO_0004967"
        resp = self.client.get(f"/api/signals/{sig_id}")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["research_priority_score"], 82.0)
        self.assertEqual(data["category"], "STRONG_RESEARCH_SIGNAL")


if __name__ == "__main__":
    unittest.main()
