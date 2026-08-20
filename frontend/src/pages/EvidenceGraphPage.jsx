import React, { useState, useEffect } from 'react';
import { GitMerge, Layers, Search, RefreshCw } from 'lucide-react';
import { fetchSignalGraph, fetchSignals } from '../api';
import InteractiveGraph from '../components/InteractiveGraph';

export default function EvidenceGraphPage() {
  const [signals, setSignals] = useState([]);
  const [selectedSignalId, setSelectedSignalId] = useState('DR:CHEMBL403989__D:MONDO_0004967');
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignals({ limit: 20, min_score: 50 })
      .then((data) => {
        setSignals(data.signals || []);
      })
      .catch((err) => console.error(err));
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
            style={{ width: '320px' }}
            value={selectedSignalId}
            onChange={(e) => setSelectedSignalId(e.target.value)}
          >
            {signals.map((sig) => (
              <option key={sig.signal_id} value={sig.signal_id}>
                {sig.drug.name} &rarr; {sig.disease.name} ({sig.research_priority_score} pts)
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
