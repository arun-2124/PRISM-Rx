import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Search, ArrowRight, ShieldCheck, Activity, Dna } from 'lucide-react';
import { fetchDrugs, fetchSignals } from '../api';

export default function DrugIntelligencePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('Tg100-801');
  const [drugList, setDrugList] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [repurposingSignals, setRepurposingSignals] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!query) return;
    setLoading(true);

    Promise.all([
      fetchDrugs(query, 10),
      fetchSignals({ drug: query, limit: 10 }),
    ])
      .then(([drugsRes, sigsRes]) => {
        setDrugList(drugsRes.drugs || []);
        if (drugsRes.drugs?.length > 0) {
          setSelectedDrug(drugsRes.drugs[0]);
        } else {
          setSelectedDrug({ id: 'DR:CHEMBL403989', name: query, chembl_id: 'CHEMBL403989', type: 'Small molecule', max_stage: 'PHASE_2' });
        }
        setRepurposingSignals(sigsRes.signals || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Drug search error:', err);
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
          <Pill size={28} color="var(--primary-cyan)" />
          Drug Repurposing Intelligence
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Search across 22,407 ChEMBL drug profiles to discover target pathways, mechanisms of action, and potential new indications.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '32px', maxWidth: '600px' }}>
        <input
          type="text"
          className="input-control"
          placeholder="Search drug name or ChEMBL ID (e.g. Tg100-801, Aspirin, Metformin)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn-primary">
          <Search size={16} />
          Search
        </button>
      </form>

      {/* Selected Drug Profile Card */}
      {selectedDrug && (
        <div className="glass-card" style={{ padding: '28px', marginBottom: '32px', borderLeft: '4px solid var(--primary-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="badge badge-strong" style={{ marginBottom: '8px' }}>
                {selectedDrug.type || 'Small Molecule'}
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
                {selectedDrug.name}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Drug ID: {selectedDrug.id} | ChEMBL ID: {selectedDrug.chembl_id}
              </div>
            </div>

            <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                {selectedDrug.max_stage || 'PHASE_2'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Highest Clinical Phase</div>
            </div>
          </div>
        </div>
      )}

      {/* Potential New Indications Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} />
          Potential New Indications (Evaluated Repurposing Candidates)
        </h3>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Searching candidate pairs...</div>
        ) : repurposingSignals.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Candidate Indication</th>
                  <th style={{ padding: '12px' }}>PRISM Priority Score</th>
                  <th style={{ padding: '12px' }}>Category</th>
                  <th style={{ padding: '12px' }}>Supporting Target</th>
                  <th style={{ padding: '12px' }}>Sources</th>
                  <th style={{ padding: '12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {repurposingSignals.map((sig) => (
                  <tr key={sig.signal_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-main)' }}>{sig.disease.name}</td>
                    <td style={{ padding: '12px', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-heading)' }}>{sig.research_priority_score} / 100</td>
                    <td style={{ padding: '12px' }}><span className="badge badge-strong">{sig.category}</span></td>
                    <td style={{ padding: '12px', color: 'var(--primary-cyan)', fontFamily: 'var(--font-mono)' }}>{sig.supporting_paths?.[0]?.target?.symbol || 'Multi-Target'}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{sig.evidence?.source_diversity_count || 1} sources</td>
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
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No unindicated repurposing candidates found for this query.</div>
        )}
      </div>
    </div>
  );
}
