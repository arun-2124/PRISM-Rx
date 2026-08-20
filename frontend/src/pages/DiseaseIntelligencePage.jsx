import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Search, ArrowRight, ShieldCheck, Dna } from 'lucide-react';
import { fetchDiseases, fetchSignals } from '../api';

export default function DiseaseIntelligencePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('acute lymphoblastic leukemia');
  const [diseaseList, setDiseaseList] = useState([]);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [candidateDrugs, setCandidateDrugs] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!query) return;
    setLoading(true);

    Promise.all([
      fetchDiseases(query, 10),
      fetchSignals({ disease: query, limit: 10 }),
    ])
      .then(([disRes, sigsRes]) => {
        setDiseaseList(disRes.diseases || []);
        if (disRes.diseases?.length > 0) {
          setSelectedDisease(disRes.diseases[0]);
        } else {
          setSelectedDisease({ id: 'D:MONDO_0004967', name: query, source_id: 'MONDO_0004967' });
        }
        setCandidateDrugs(sigsRes.signals || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Disease search error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={28} color="var(--primary-cyan)" />
          Disease Repurposing Landscape
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Explore 47,080 MONDO/EFO disease profiles to discover associated targets, therapeutic pathways, and candidate repurposed drugs.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '32px', maxWidth: '600px' }}>
        <input
          type="text"
          className="input-control"
          placeholder="Search disease condition (e.g. acute lymphoblastic leukemia, Alzheimer)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn-primary">
          <Search size={16} />
          Search
        </button>
      </form>

      {/* Selected Disease Profile Card */}
      {selectedDisease && (
        <div className="glass-card" style={{ padding: '28px', marginBottom: '32px', borderLeft: '4px solid var(--accent-purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="badge badge-strong" style={{ marginBottom: '8px' }}>
                MONDO DISEASE ONTOLOGY
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
                {selectedDisease.name}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Disease ID: {selectedDisease.id} | Source ID: {selectedDisease.source_id}
              </div>
            </div>

            <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-cyan)' }}>
                {candidateDrugs.length} Candidates
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Repurposing Signals</div>
            </div>
          </div>
        </div>
      )}

      {/* Repurposing Landscape Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} />
          Disease Repurposing Landscape (Ranked Candidate Compounds)
        </h3>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Searching candidate compounds...</div>
        ) : candidateDrugs.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Candidate Drug</th>
                  <th style={{ padding: '12px' }}>PRISM Priority Score</th>
                  <th style={{ padding: '12px' }}>Category</th>
                  <th style={{ padding: '12px' }}>Target Pathway</th>
                  <th style={{ padding: '12px' }}>Action Type</th>
                  <th style={{ padding: '12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {candidateDrugs.map((sig) => (
                  <tr key={sig.signal_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-main)' }}>{sig.drug.name}</td>
                    <td style={{ padding: '12px', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-heading)' }}>{sig.research_priority_score} / 100</td>
                    <td style={{ padding: '12px' }}><span className="badge badge-strong">{sig.category}</span></td>
                    <td style={{ padding: '12px', color: 'var(--primary-cyan)', fontFamily: 'var(--font-mono)' }}>{sig.supporting_paths?.[0]?.target?.symbol || 'Multi-Target'}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{sig.supporting_paths?.[0]?.action_type || 'INHIBITOR'}</td>
                    <td style={{ padding: '12px' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        onClick={() => navigate(`/signals/${encodeURIComponent(sig.signal_id)}`)}
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No repurposing candidate drugs found for this disease.</div>
        )}
      </div>
    </div>
  );
}
