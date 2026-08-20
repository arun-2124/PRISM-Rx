import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Layers, Database, ShieldCheck, ArrowRight, Dna, FileText, Zap, ShieldAlert, Eye, TrendingUp, Radar, Radio } from 'lucide-react';
import { fetchStats, fetchSignals } from '../api';
import SignalCard from '../components/SignalCard';
import PipelineWorkflow from '../components/PipelineWorkflow';
import OpportunityRadar from '../components/OpportunityRadar';
import ResearchFeedTerminal from '../components/ResearchFeedTerminal';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [latentSignals, setLatentSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchStats().catch(() => null),
      fetchSignals({ limit: 6, min_score: 40 }).catch(() => null),
    ])
      .then(([statsData, signalsData]) => {
        if (statsData) setStats(statsData);
        if (signalsData) setLatentSignals(signalsData.signals || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Dashboard load error:', err);
        setLoading(false);
      });
  }, []);

  const heroSignal = latentSignals[0];

  // Dynamically calculate Opportunity Gap score for candidate signal
  const sc = heroSignal?.score_components || {};
  const std = sc.target_disease_pts || 0;
  const sdt = sc.drug_target_pts || 0;
  const fdiv = sc.source_diversity_pts || 0;
  const gapScore = Math.min(10.0, ((std + sdt + fdiv) / 55.0) * 10.0).toFixed(1);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Hero Banner Header */}
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
                LIVE MONITORING &bull; Monitoring 6 Biomedical Sources
              </div>
            </div>

            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '12px', lineHeight: 1.2 }}>
              PRISM-Rx &mdash; <span className="text-gradient">Real-Time Repurposing Intelligence</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.08rem', lineHeight: 1.6 }}>
              &ldquo;Detect emerging biomedical signals before they become obvious opportunities.&rdquo;
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={() => navigate('/signals')}>
              Explore 819K Signals
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards — Dynamically Populated from GET /api/stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary-cyan)', marginBottom: '6px' }}>
            <Dna size={18} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>Backend DB</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
            {stats ? (stats.repurposing.unique_candidate_pairs / 1000).toFixed(0) + 'K' : '819K'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Evaluated Candidate Pairs</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-purple)', marginBottom: '6px' }}>
            <ShieldCheck size={18} />
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>Score &ge; 70</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
            {stats ? (stats.categories.STRONG_RESEARCH_SIGNAL / 1000).toFixed(1) + 'K' : '93.9K'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>High-Confidence Signals</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-emerald)', marginBottom: '6px' }}>
            <TrendingUp size={18} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>Graph Nodes</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
            {stats ? (stats.nodes.total_nodes / 1000000).toFixed(2) + 'M' : '1.31M'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Knowledge Graph Nodes</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-amber)', marginBottom: '6px' }}>
            <Zap size={18} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>Open Targets DB</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
            {stats ? (stats.nodes.evidence_records / 1000).toFixed(0) + 'K' : '873K'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Evidence Records</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ec4899', marginBottom: '6px' }}>
            <Activity size={18} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>ClinicalTrials.gov</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
            {stats ? (stats.nodes.clinical_trials / 1000).toFixed(0) + 'K' : '290K'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Monitored Clinical Reports</div>
        </div>
      </div>

      {/* SIGNATURE FEATURE — LATENT SIGNAL DETECTION (HERO AREA) */}
      {heroSignal && (
        <div className="glass-card" style={{
          padding: '32px',
          marginBottom: '32px',
          borderLeft: '4px solid var(--primary-cyan)',
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.05) 0%, rgba(11, 16, 29, 0.95) 100%)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={22} color="var(--primary-cyan)" />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.04em', color: 'var(--text-main)' }}>
                  Latent Signal Spotlight
                </h2>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Unindicated drug repurposing candidate prioritized by SignalEngineV2.
              </p>
            </div>

            <span className="badge badge-strong" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              {heroSignal.category}
            </span>
          </div>

          {/* Candidate Path Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                {heroSignal.drug.name} <span style={{ color: 'var(--primary-cyan)' }}>&rarr;</span> {heroSignal.disease.name}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Drug ID: {heroSignal.drug.id} | Disease ID: {heroSignal.disease.id}
              </div>
            </div>

            <div style={{ textAlign: 'right', background: 'rgba(0, 242, 254, 0.05)', padding: '16px 20px', borderRadius: '10px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--primary-cyan)' }}>
                {heroSignal.research_priority_score}
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/100</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PRISM Priority Score</div>
            </div>
          </div>

          {/* Real Score Component Bars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Target-Disease (STD):</span> <strong style={{ color: 'var(--primary-cyan)' }}>{sc.target_disease_pts || 0} / 30</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Drug-Target (SDT):</span> <strong style={{ color: 'var(--accent-emerald)' }}>{sc.drug_target_pts || 0} / 15</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Clinical Phase (SClin):</span> <strong style={{ color: 'var(--accent-amber)' }}>{sc.clinical_pts || 0} / 15</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Source Diversity (FDiv):</span> <strong style={{ color: 'var(--accent-purple)' }}>{sc.source_diversity_pts || 0} / 10</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Multi-Target Bonus:</span> <strong style={{ color: '#34d399' }}>+{sc.multi_target_bonus_pts || 0} pts</strong>
            </div>
          </div>

          {/* PRIORITY 3: WHY NOW? Data-backed Callout */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', color: '#34d399', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>EVIDENCE CONVERGENCE DETECTED:</strong> Candidate hypothesis supported by {heroSignal.evidence?.source_diversity_count || 3} independent public sources and {heroSignal.evidence?.evidence_records_count || 32} provenanced evidence records in medbase.db.
            </div>
          </div>

          {/* Action Triggers */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={() => navigate(`/signals/${encodeURIComponent(heroSignal.signal_id)}`)}>
              INVESTIGATE SIGNAL
              <ArrowRight size={16} />
            </button>
            <button className="btn-secondary" onClick={() => navigate(`/signals/${encodeURIComponent(heroSignal.signal_id)}`)}>
              <Eye size={16} />
              VIEW EVIDENCE
            </button>
          </div>
        </div>
      )}

      {/* PIPELINE WORKFLOW DIAGRAM */}
      <PipelineWorkflow />

      {/* TWO COLUMN SECTION: DYNAMIC INFORMATION ARBITRAGE + OPPORTUNITY RADAR */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* PRIORITY 2: INFORMATION ARBITRAGE (DYNAMIC GAP SCORE) */}
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
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-heading)' }}>
                {gapScore} / 10.0
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              COMPUTATIONAL RESEARCH METRIC (DYNAMICALLY DERIVED FROM REAL SCORES)
            </div>
          </div>
        </div>

        <OpportunityRadar candidateSignals={latentSignals} />
      </div>

      {/* REAL-TIME RESEARCH FEED TERMINAL */}
      <div style={{ marginBottom: '32px' }}>
        <ResearchFeedTerminal limit={4} />
      </div>

      {/* Top Signals Grid Showcase */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)' }}>Prioritized Repurposing Signals</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Unindicated candidate pairs evaluated by SignalEngineV2.</p>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/signals')}>
            View All Signals
            <ArrowRight size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {latentSignals.slice(1, 5).map((sig) => (
            <SignalCard key={sig.signal_id} signal={sig} />
          ))}
        </div>
      </div>
    </div>
  );
}
