import React, { useState, useEffect } from 'react';
import { GitMerge, Layers, Search, RefreshCw } from 'lucide-react';
import { fetchSignalGraph, fetchSignals } from '../api';
import InteractiveGraph from '../components/InteractiveGraph';

const BENCHMARK_CANDIDATES = [
  { id: 'DR:CHEMBL403989__D:MONDO_0004967', label: 'Tg100-801 → acute lymphoblastic leukemia (82.0 pts)' },
  { id: 'DR:CHEMBL473159__D:EFO_0005762', label: 'Phloroglucinol → neuropathic pain (89.5 pts)' },
  { id: 'DR:CHEMBL1059__D:EFO_0010282', label: 'Pregabalin → gastrointestinal disease (88.0 pts)' },
  { id: 'DR:CHEMBL1201__D:MONDO_0004992', label: 'Metformin → cancer (28.0 pts)' },
  { id: 'DR:CHEMBL4__D:EFO_0000544', label: 'Ofloxacin → infection (95.0 pts)' },
];

export default function EvidenceGraphPage() {
  const [candidateList, setCandidateList] = useState(BENCHMARK_CANDIDATES);
  const [selectedSignalId, setSelectedSignalId] = useState('DR:CHEMBL403989__D:MONDO_0004967');
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignals({ limit: 20 })
      .then((data) => {
        if (data?.signals?.length > 0) {
          const apiOptions = data.signals.map((s) => ({
            id: s.signal_id,
            label: `${s.drug.name} → ${s.disease.name} (${s.research_priority_score} pts)`,
          }));
          const map = new Map();
          BENCHMARK_CANDIDATES.forEach((c) => map.set(c.id, c));
          apiOptions.forEach((c) => map.set(c.id, c));
          setCandidateList(Array.from(map.values()));
        }
      })
      .catch((err) => console.error('Failed to fetch candidate signals:', err));
  }, []);

  useEffect(() => {
    if (!selectedSignalId) return;
    setLoading(true);
    fetchSignalGraph(selectedSignalId)
      .then((data) => {
        setGraphData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Graph fetch error:', err);
        setLoading(false);
      });
  }, [selectedSignalId]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitMerge size={28} color="var(--primary-cyan)" />
            Evidence Knowledge Graph Topology
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Explore 1.31M nodes and 1.08M edges across drugs, targets, diseases, clinical studies, and literature.
          </p>
        </div>

        {/* Candidate Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select Candidate Signal:</span>
          <select
            className="input-control"
            style={{ width: '380px', fontWeight: 600 }}
            value={selectedSignalId}
            onChange={(e) => setSelectedSignalId(e.target.value)}
          >
            {candidateList.map((cand) => (
              <option key={cand.id} value={cand.id}>
                {cand.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Interactive Graph Component */}
      {loading ? (
        <div className="glass-card" style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="spin" style={{ marginBottom: '12px' }} />
          <div>Traversing Knowledge Graph Neighborhood...</div>
        </div>
      ) : graphData ? (
        <InteractiveGraph graphData={graphData} />
      ) : (
        <div className="glass-card" style={{ padding: '40px', color: 'var(--accent-rose)' }}>
          Failed to load graph topology for selected candidate.
        </div>
      )}
    </div>
  );
}
