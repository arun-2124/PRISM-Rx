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

      {/* KPI Cards with Sparklines & Percentage Trends */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary-cyan)', marginBottom: '6px' }}>
            <Dna size={18} />
            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>+18.4% this week</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>1,284</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Signals Detected</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-purple)', marginBottom: '6px' }}>
            <ShieldCheck size={18} />
            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>+12.8%</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>146</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>High-Confidence Signals</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-emerald)', marginBottom: '6px' }}>
            <TrendingUp size={18} />
            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>+24.1%</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>73</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Emerging Signals</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-amber)', marginBottom: '6px' }}>
            <Zap size={18} />
            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>+31.7%</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>4,821</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Evidence Events Today</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ec4899', marginBottom: '6px' }}>
            <Activity size={18} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>Active Database</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>28,412</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Clinical Trials Monitored</div>
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
                  Latent Signals Detected
                </h2>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Hidden connections emerging across independent biomedical evidence streams.
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

          {/* Metric Component Bars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Mechanistic Overlap:</span> <strong style={{ color: 'var(--primary-cyan)' }}>94 / 100</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Evidence Convergence:</span> <strong style={{ color: 'var(--accent-emerald)' }}>89 / 100</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Novelty Score:</span> <strong style={{ color: 'var(--accent-purple)' }}>92 / 100</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Clinical Proximity:</span> <strong style={{ color: 'var(--accent-amber)' }}>81 / 100</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Temporal Momentum:</span> <strong style={{ color: '#34d399' }}>95 / 100</strong>
            </div>
          </div>

          {/* WHY NOW? Callout */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', color: '#34d399', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>WHY NOW?</strong> 4 independent evidence events (preprints, clinical trials, conference abstracts) published within the last 12 days.
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

      {/* TWO COLUMN SECTION: OPPORTUNITY RADAR + REAL-TIME FEED */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <OpportunityRadar candidateSignals={latentSignals} />
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
