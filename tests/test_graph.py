"""
Unit Tests for PRISM-Rx Knowledge Graph Abstraction
"""

import unittest
from pathlib import Path
from src.graph import GraphTraversalEngine, find_repurposing_candidates


class TestKnowledgeGraph(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.engine = GraphTraversalEngine(db_path=Path("data/unified/medbase.db"))

    def test_1_drug_to_target_lookup(self):
        """Test Drug -> Target lookup returns valid edges."""
        edges = self.engine.get_drug_targets(drug_id="DR:CHEMBL403989")
        self.assertGreater(len(edges), 0)
        edge = edges[0]
        self.assertEqual(edge.type, "TARGETS")
        self.assertEqual(edge.source_id, "DR:CHEMBL403989")
        self.assertTrue(edge.target_id.startswith("T:"))
        self.assertIn("source", edge.properties)

    def test_2_target_to_disease_lookup(self):
        """Test Target -> Disease lookup returns valid edges."""
        edges = self.engine.get_target_diseases(target_id="T:ENSG00000000938")
        self.assertGreater(len(edges), 0)
        edge = edges[0]
        self.assertEqual(edge.type, "ASSOCIATED_WITH")
        self.assertEqual(edge.source_id, "T:ENSG00000000938")
        self.assertTrue(edge.target_id.startswith("D:"))
        self.assertIn("score", edge.properties)

    def test_3_drug_to_disease_indication_lookup(self):
        """Test Drug -> Disease indication lookup."""
        # Find a drug with indications
        conn = self.engine._get_conn()
        r = conn.execute("SELECT drug_id FROM drug_disease LIMIT 1").fetchone()
        conn.close()
        self.assertIsNotNone(r)
        
        edges = self.engine.get_drug_indications(drug_id=r["drug_id"])
        self.assertGreater(len(edges), 0)
        self.assertEqual(edges[0].type, "INDICATED_FOR")

    def test_4_drug_target_disease_traversal(self):
        """Test Drug -> Target -> Disease multi-hop graph traversal."""
        candidates = find_repurposing_candidates(limit=5, min_score=0.3)
        self.assertGreater(len(candidates), 0)
        cand = candidates[0]
        self.assertIn("drug", cand)
        self.assertIn("disease", cand)
        self.assertIn("paths", cand)
        self.assertGreater(len(cand["paths"]), 0)

        # Check path structure
        path = cand["paths"][0]
        self.assertEqual(len(path["nodes"]), 3)
        self.assertEqual(path["nodes"][0]["type"], "Drug")
        self.assertEqual(path["nodes"][1]["type"], "Target")
        self.assertEqual(path["nodes"][2]["type"], "Disease")
        self.assertEqual(len(path["edges"]), 2)
        self.assertEqual(path["edges"][0]["type"], "TARGETS")
        self.assertEqual(path["edges"][1]["type"], "ASSOCIATED_WITH")

    def test_5_evidence_retrieval(self):
        """Test evidence record retrieval for candidates."""
        candidates = find_repurposing_candidates(limit=5, min_score=0.5)
        self.assertGreater(len(candidates), 0)
        cand = candidates[0]
        self.assertIn("supporting_evidence", cand)
        self.assertIsInstance(cand["supporting_evidence"], list)

    def test_6_provenance_retrieval(self):
        """Test metadata and provenance properties on edges."""
        candidates = find_repurposing_candidates(limit=1)
        self.assertGreater(len(candidates), 0)
        path = candidates[0]["paths"][0]
        for edge in path["edges"]:
            self.assertIn("source", edge["properties"])
            self.assertIn("source_version", edge["properties"])

    def test_7_missing_entity_handling(self):
        """Test robust handling of non-existent entity IDs."""
        edges_drug = self.engine.get_drug_targets(drug_id="DR:NON_EXISTENT_123456")
        self.assertEqual(len(edges_drug), 0)

        edges_target = self.engine.get_target_diseases(target_id="T:NON_EXISTENT_123456")
        self.assertEqual(len(edges_target), 0)

        candidates = find_repurposing_candidates(drug_name="NON_EXISTENT_DRUG_NAME_XYZ_123")
        self.assertEqual(len(candidates), 0)

    def test_8_duplicate_relationship_handling(self):
        """Test grouping and deduplication of candidate pairs."""
        candidates = find_repurposing_candidates(limit=20)
        seen_pairs = set()
        for cand in candidates:
            pair = (cand["drug"]["id"], cand["disease"]["id"])
            self.assertNotIn(pair, seen_pairs, msg=f"Duplicate candidate pair found: {pair}")
            seen_pairs.add(pair)


if __name__ == "__main__":
    unittest.main()
