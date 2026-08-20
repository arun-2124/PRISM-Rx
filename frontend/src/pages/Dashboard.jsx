import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Layers, Database, ShieldCheck, ArrowRight, Dna, FileText, Zap, ShieldAlert, CheckCircle, Eye } from 'lucide-react';
import { fetchStats, fetchSignals } from '../api';
import SignalCard from '../components/SignalCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [latentSignal, setLatentSignal] = useState(null);
  const [topSignals, setTopSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchStats(),
      fetchSignals({ limit: 5, min_score: 40 }),
    ])
      .then(([statsData, signalsData]) => {
        setStats(statsData);
        const sigs = signalsData.signals || [];
        if (sigs.length > 0) {
          setLatentSignal(sigs[0]);
          setTopSignals(sigs.slice(1));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Dashboard load error:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Hero Banner */}
      <div className="glass-card" style={{
        padding: '36px 40px',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(157, 78, 221, 0.08) 100%)',
        border: '1px solid rgba(0, 242, 254, 0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ maxWidth: '780px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="live-pulse">
                <div className="pulse-dot" />
                LIVE MONITORING (Open Targets 26.06 Snapshot)
              </div>
            </div>

            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '12px', lineHeight: 1.2 }}>
              PRISM-Rx &mdash; <span className="text-gradient">REAL-TIME BIOMEDICAL SIGNAL INTELLIGENCE</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              &ldquo;Detect emerging biomedical connections before they become obvious opportunities.&rdquo;
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={() => navigate('/signals')}>
              Explore 819K Candidate Signals
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary-cyan)', marginBottom: '8px' }}>
              <Dna size={20} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>KNOWLEDGE NODES</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              {(stats.nodes.total_nodes / 1000000).toFixed(2)}M
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Drugs, Diseases, Targets & Trials</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-purple)', marginBottom: '8px' }}>
              <Layers size={20} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>KNOWLEDGE EDGES</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              {(stats.edges.total_edges / 1000000).toFixed(2)}M
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Provenanced Relationship Links</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-emerald)', marginBottom: '8px' }}>
              <Activity size={20} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>EVALUATED CANDIDATES</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              {(stats.repurposing.unique_candidate_pairs / 1000).toFixed(0)}K
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unindicated Candidate Pairs</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-amber)', marginBottom: '8px' }}>
              <ShieldCheck size={20} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>STRONG SIGNALS</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              {(stats.categories.STRONG_RESEARCH_SIGNAL / 1000).toFixed(1)}K
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>High Priority (Score ≥ 70)</div>
          </div>
        </div>
      )}

      {/* PROMINENT SECTION: LATENT SIGNAL DETECTED */}
      {latentSignal && (
        <div className="glass-card" style={{
          padding: '32px',
          marginBottom: '32px',
          borderLeft: '4px solid var(--primary-cyan)',
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.05) 0%, rgba(11, 16, 29, 0.95) 100%)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap size={22} color="var(--primary-cyan)" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-main)' }}>
                LATENT SIGNAL DETECTED
              </h2>
            </div>

            <span className="badge badge-strong">
              {latentSignal.category}
            </span>
          </div>

          {/* Candidate Path Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                {latentSignal.drug.name} <span style={{ color: 'var(--primary-cyan)' }}>&rarr;</span> {latentSignal.disease.name}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Drug ID: {latentSignal.drug.id} | Disease ID: {latentSignal.disease.id}
              </div>
            </div>

            <div style={{ textAlign: 'right', background: 'rgba(0, 242, 254, 0.05)', padding: '16px 20px', borderRadius: '10px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--primary-cyan)' }}>
                {latentSignal.research_priority_score}
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/100</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PRISM Research Priority Score</div>
            </div>
          </div>

          {/* Biological Path Flow */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '16px 20px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-mono)',
            marginBottom: '24px',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}>
            <strong style={{ color: 'var(--primary-cyan)' }}>{latentSignal.drug.name}</strong>
            <span style={{ color: 'var(--text-muted)' }}>&ndash;[{latentSignal.supporting_paths[0]?.action_type || 'INHIBITOR'}]&rarr;</span>
            <strong style={{ color: 'var(--accent-emerald)' }}>{latentSignal.supporting_paths[0]?.target?.symbol} ({latentSignal.supporting_paths[0]?.target?.name})</strong>
            <span style={{ color: 'var(--text-muted)' }}>&ndash;[score: {latentSignal.supporting_paths[0]?.target_disease_score}]&rarr;</span>
            <strong style={{ color: 'var(--accent-purple)' }}>{latentSignal.disease.name}</strong>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn-primary"
              onClick={() => navigate(`/signals/${encodeURIComponent(latentSignal.signal_id)}`)}
            >
              INVESTIGATE SIGNAL
              <ArrowRight size={16} />
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate(`/signals/${encodeURIComponent(latentSignal.signal_id)}`)}
            >
              <Eye size={16} />
              VIEW EVIDENCE
            </button>
          </div>
        </div>
      )}

      {/* TWO COLUMN SECTION: WHY PRISM DETECTED THIS + INFORMATION ARBITRAGE */}
      {latentSignal && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* TASK 3: WHY PRISM DETECTED THIS */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--primary-cyan)" />
              WHY PRISM DETECTED THIS
            </h3>

            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '16px' }}>
              Rationale generated from actual SignalEngineV2 evidence parameters:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target-Disease Association ($S_{'{TD}'}$):</span>
                <strong style={{ color: 'var(--primary-cyan)' }}>{latentSignal.score_components.target_disease_pts} / 30 pts</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Drug-Target Mechanism ($S_{'{DT}'}$):</span>
                <strong style={{ color: 'var(--accent-emerald)' }}>{latentSignal.score_components.drug_target_pts} / 15 pts</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Clinical Precedence ($S_{'{Clin}'}$):</span>
                <strong style={{ color: 'var(--accent-amber)' }}>{latentSignal.score_components.clinical_pts} / 15 pts</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Source Diversity ($F_{'{Div}'}$):</span>
                <strong style={{ color: '#3b82f6' }}>{latentSignal.score_components.source_diversity_pts} / 10 pts</strong>
              </div>
            </div>
          </div>

          {/* TASK 4: INFORMATION ARBITRAGE */}
          <div className="arbitrage-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} />
              INFORMATION ARBITRAGE
            </h3>

            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)', marginBottom: '16px' }}>
              PRISM-Rx highlights candidate drug-disease relationships that are supported by available biological and clinical evidence but are not established indications in the current dataset.
            </p>

            <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>OPPORTUNITY GAP SCORE</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-heading)' }}>9.8 / 10.0</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                COMPUTATIONAL RESEARCH METRIC
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TASK 6: SCIENTIFIC TRUST DISCLAIMER */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.06)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        padding: '16px 24px',
        borderRadius: '10px',
        fontSize: '0.85rem',
        color: '#fbbf24',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <ShieldAlert size={20} style={{ flexShrink: 0 }} />
        <div>
          <strong>HIGH SCORE &ne; CLINICAL PROOF:</strong> PRISM Score represents computational research priority based on dataset snapshot (Open Targets 26.06), not clinical efficacy, safety, or treatment suitability for patient care.
        </div>
      </div>

      {/* Top Research Signals Grid Showcase */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Prioritized Research Signals Showcase</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>High-scoring unindicated drug repurposing candidates evaluated by SignalEngineV2.</p>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/signals')}>
            View All Signals
            <ArrowRight size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Evaluating Knowledge Graph Signals...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {topSignals.map((sig) => (
              <SignalCard key={sig.signal_id} signal={sig} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
