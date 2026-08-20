import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Layers, Database, ShieldCheck, ArrowRight, Dna, FileText } from 'lucide-react';
import { fetchStats, fetchSignals } from '../api';
import SignalCard from '../components/SignalCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [topSignals, setTopSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchStats(), fetchSignals({ limit: 4, min_score: 40 })])
      .then(([statsData, signalsData]) => {
        setStats(statsData);
        setTopSignals(signalsData.signals || []);
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
        padding: '40px',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(157, 78, 221, 0.08) 100%)',
        border: '1px solid rgba(0, 242, 254, 0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ maxWidth: '700px' }}>
            <span className="badge badge-strong" style={{ marginBottom: '12px' }}>
              <Dna size={12} /> BIOTECH ARBITRAGE ENGINE V2.0
            </span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '12px' }}>
              Discover & Rank <span className="text-gradient">Drug Repurposing</span> Research Signals
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              PRISM-Rx operates an evidence-aware Knowledge Graph over 1.3M+ biological entities and 2.7M+ graph paths, surfacing explainable repurposing hypotheses with multi-source validation.
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
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>GRAPH NODES</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{(stats.nodes.total_nodes / 1000000).toFixed(2)}M</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Drugs, Diseases, Targets & Trials</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-purple)', marginBottom: '8px' }}>
              <Layers size={20} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>GRAPH EDGES</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{(stats.edges.total_edges / 1000000).toFixed(2)}M</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Provenanced Edge Links</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-emerald)', marginBottom: '8px' }}>
              <Activity size={20} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>EVALUATED PAIRS</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{(stats.repurposing.unique_candidate_pairs / 1000).toFixed(0)}K</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unindicated Candidate Pairs</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-amber)', marginBottom: '8px' }}>
              <ShieldCheck size={20} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>STRONG SIGNALS</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{(stats.categories.STRONG_RESEARCH_SIGNAL / 1000).toFixed(1)}K</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>High Research Priority (Score ≥ 70)</div>
          </div>
        </div>
      )}

      {/* Top Research Signals Showcase */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Top Prioritized Research Signals</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>High-scoring unindicated drug repurposing candidates generated from multi-source data.</p>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/signals')}>
            View All Signals
            <ArrowRight size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Evaluating Knowledge Graph Signals...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {topSignals.map((sig) => (
              <SignalCard key={sig.signal_id} signal={sig} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
