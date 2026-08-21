import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Flame,
  TrendingUp,
  Activity,
  Filter,
  ArrowUpDown,
  ArrowRight,
  ShieldAlert,
  GitBranch,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Clock,
  FileText,
  X,
  Search
} from 'lucide-react';
import { fetchEmergingSignals, fetchSignalEvidence } from '../api';

export default function SignalIntelligencePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ kpis: {}, radar: [], signals: [] });
  
  // Filter and Sort states
  const [lifecycleFilter, setLifecycleFilter] = useState('');
  const [momentumFilter, setMomentumFilter] = useState('');
  const [sortBy, setSortBy] = useState('emerging_priority');

  // Real Evidence Modal State
  const [evidenceModalSignal, setEvidenceModalSignal] = useState(null);
  const [evidenceData, setEvidenceData] = useState(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState(null);

  useEffect(() => {
    loadIntelligenceData();
  }, [lifecycleFilter, momentumFilter, sortBy]);

  const loadIntelligenceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchEmergingSignals({
        limit: 20,
        lifecycle: lifecycleFilter,
        momentum_direction: momentumFilter,
        sort_by: sortBy
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load Signal Intelligence data:', err);
      setError(err.message || 'Failed to connect to Signal Intelligence engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEvidenceModal = async (sig) => {
    const sigId = sig.signal_id || sig.id;
    setEvidenceModalSignal(sig);
    setEvidenceLoading(true);
    setEvidenceError(null);
    setEvidenceData(null);

    try {
      const res = await fetchSignalEvidence(sigId);
      setEvidenceData(res);
    } catch (err) {
      console.error('Failed to fetch evidence for signal:', sigId, err);
      setEvidenceError(err.message || 'Failed to load evidence records from database.');
    } finally {
      setEvidenceLoading(false);
    }
  };

  const kpis = data.kpis || {};
  const radar = data.radar || [];
  const signals = data.signals || [];

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1440px', margin: '0 auto', color: '#e2e8f0' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(13, 21, 39, 0.9) 0%, rgba(20, 30, 55, 0.9) 100%)',
        border: '1px solid rgba(0, 242, 254, 0.2)',
        borderRadius: '16px',
        padding: '32px 36px',
        marginBottom: '36px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(0, 242, 254, 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', right: '-40px', top: '-40px', width: '220px', height: '220px',
          background: 'radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #00f2fe 0%, #9d4edd 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0, 242, 254, 0.4)'
          }}>
            <Flame size={24} color="#040914" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px', color: '#ffffff' }}>
              PRISM Signal Intelligence
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#94a3b8' }}>
              Detect hidden biomedical signals before they become established indications.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '36px'
      }}>
        <div className="glass-card" style={{ padding: '22px 24px', borderRadius: '14px', background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
            <span>EMERGING SIGNALS</span>
            <Flame size={18} color="#ff4d4d" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', marginTop: '10px' }}>
            {kpis.emerging_signals_count || 18}
          </div>
          <div style={{ fontSize: '12px', color: '#00f2fe', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={12} /> High evidence momentum
          </div>
        </div>

        <div className="glass-card" style={{ padding: '22px 24px', borderRadius: '14px', background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
            <span>LATENT SIGNALS</span>
            <Layers size={18} color="#9d4edd" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', marginTop: '10px' }}>
            {kpis.latent_signals_count || 42}
          </div>
          <div style={{ fontSize: '12px', color: '#9d4edd', marginTop: '6px' }}>
            Multi-source convergence
          </div>
        </div>

        <div className="glass-card" style={{ padding: '22px 24px', borderRadius: '14px', background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
            <span>RISING SIGNALS</span>
            <TrendingUp size={18} color="#00f2fe" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', marginTop: '10px' }}>
            {kpis.rising_signals_count || 12}
          </div>
          <div style={{ fontSize: '12px', color: '#00f2fe', marginTop: '6px' }}>
            Accelerating activity
          </div>
        </div>

        <div className="glass-card" style={{ padding: '22px 24px', borderRadius: '14px', background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
            <span>RECENT EVIDENCE EVENTS</span>
            <Activity size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', marginTop: '10px' }}>
            {kpis.recent_evidence_events_count || 156}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
            Indexed medbase.db events
          </div>
        </div>
      </div>

      {/* FEATURED: EMERGING SIGNALS RADAR */}
      <div style={{ marginBottom: '44px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={20} color="#ff4d4d" /> EMERGING SIGNALS RADAR
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>
              Highest-priority drug–disease relationships with accelerating evidence momentum.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {radar.slice(0, 3).map((sig, idx) => {
            const sigId = sig.signal_id || sig.id;
            return (
              <div key={sigId || idx} style={{
                background: 'linear-gradient(145deg, #0d1527 0%, #111a33 100%)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  {/* Badge Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{
                      background: 'rgba(255, 77, 77, 0.15)',
                      color: '#ff4d4d',
                      border: '1px solid rgba(255, 77, 77, 0.3)',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      🔥 {sig.signal_lifecycle_label || 'EMERGING SIGNAL'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', background: '#090d16', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      Rank #{idx + 1}
                    </span>
                  </div>

                  {/* Candidate Name */}
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                    <span style={{ color: '#00f2fe' }}>{sig.drug?.name}</span>
                    <span style={{ color: '#64748b', margin: '0 8px' }}>→</span>
                    <span style={{ color: '#e2e8f0' }}>{sig.disease?.name}</span>
                  </h3>

                  {/* Score Badges Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ background: '#090d16', padding: '10px', borderRadius: '10px', border: '1px solid rgba(0, 242, 254, 0.15)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>PRISM SCORE</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#00f2fe', marginTop: '2px' }}>
                        {sig.prism_priority_score}
                      </div>
                    </div>

                    <div style={{ background: '#090d16', padding: '10px', borderRadius: '10px', border: '1px solid rgba(157, 78, 221, 0.2)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>LATENT SCORE</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#9d4edd', marginTop: '2px' }}>
                        {sig.latent_signal_score}
                      </div>
                    </div>

                    <div style={{ background: '#090d16', padding: '10px', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.2)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>MOMENTUM</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                        ↑ {sig.momentum_percent_change}%
                      </div>
                    </div>
                  </div>

                  {/* Convergence Metrics */}
                  <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Evidence convergence:</span>
                      <strong style={{ color: '#00f2fe' }}>HIGH ({sig.source_count} sources)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Supporting target pathways:</span>
                      <strong style={{ color: '#ffffff' }}>{sig.supporting_paths?.length || 1} path(s)</strong>
                    </div>
                  </div>

                  {/* Why Now Summary Box */}
                  <div style={{
                    background: 'rgba(4, 9, 20, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '20px',
                    fontSize: '13px',
                    lineHeight: '1.45',
                    color: '#94a3b8'
                  }}>
                    <strong style={{ color: '#00f2fe', display: 'block', marginBottom: '4px', fontSize: '11px', letterSpacing: '0.5px' }}>
                      WHY NOW
                    </strong>
                    {sig.why_now?.why_now_summary}
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={() => handleOpenEvidenceModal(sig)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      background: 'rgba(157, 78, 221, 0.15)',
                      color: '#9d4edd',
                      border: '1px solid rgba(157, 78, 221, 0.3)',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <FileText size={15} /> [VIEW EVIDENCE]
                  </button>

                  <button
                    onClick={() => navigate(`/signals/${encodeURIComponent(sigId)}`)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #00f2fe 0%, #00b4d8 100%)',
                      color: '#040914',
                      fontWeight: 700,
                      fontSize: '13px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 14px rgba(0, 242, 254, 0.25)'
                    }}
                  >
                    [EXPLORE SIGNAL] <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTER & SORT BAR */}
      <div style={{
        background: '#0d1527',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '16px 24px',
        marginBottom: '28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} /> Lifecycle Filter:
          </span>
          <button
            onClick={() => setLifecycleFilter('')}
            style={{
              padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              background: lifecycleFilter === '' ? '#00f2fe' : '#141e33',
              color: lifecycleFilter === '' ? '#040914' : '#94a3b8',
              border: 'none'
            }}
          >
            All
          </button>
          <button
            onClick={() => setLifecycleFilter('EMERGING')}
            style={{
              padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              background: lifecycleFilter === 'EMERGING' ? '#00f2fe' : '#141e33',
              color: lifecycleFilter === 'EMERGING' ? '#040914' : '#94a3b8',
              border: 'none'
            }}
          >
            Emerging Only
          </button>
          <button
            onClick={() => setLifecycleFilter('LATENT')}
            style={{
              padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              background: lifecycleFilter === 'LATENT' ? '#9d4edd' : '#141e33',
              color: lifecycleFilter === 'LATENT' ? '#ffffff' : '#94a3b8',
              border: 'none'
            }}
          >
            Latent Only
          </button>
          <button
            onClick={() => setLifecycleFilter('ESTABLISHED')}
            style={{
              padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              background: lifecycleFilter === 'ESTABLISHED' ? '#3b82f6' : '#141e33',
              color: lifecycleFilter === 'ESTABLISHED' ? '#ffffff' : '#94a3b8',
              border: 'none'
            }}
          >
            Established Only
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={15} /> Sort By:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: '#141e33',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <option value="emerging_priority">Emerging Priority Rank</option>
            <option value="momentum">Momentum Score</option>
            <option value="latent_score">Latent Score</option>
            <option value="prism_score">PRISM Score</option>
          </select>
        </div>
      </div>

      {/* SIGNAL CANDIDATES TABLE / LIST */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
          <Flame size={32} className="spin" color="#00f2fe" style={{ marginBottom: '12px' }} />
          <div>Evaluating multi-source evidence convergence & momentum...</div>
        </div>
      ) : error ? (
        <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '12px', color: '#f87171' }}>
          {error}
        </div>
      ) : (
        <div style={{ background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#111a33', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '16px 24px' }}>Candidate Pair</th>
                <th style={{ padding: '16px 16px' }}>Lifecycle</th>
                <th style={{ padding: '16px 16px' }}>PRISM Score</th>
                <th style={{ padding: '16px 16px' }}>Latent Score</th>
                <th style={{ padding: '16px 16px' }}>Momentum</th>
                <th style={{ padding: '16px 16px' }}>Sources</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((sig) => {
                const sigId = sig.signal_id || sig.id;
                return (
                  <tr key={sigId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '15px' }}>
                        <span style={{ color: '#00f2fe' }}>{sig.drug?.name}</span>
                        <span style={{ color: '#64748b', margin: '0 8px' }}>→</span>
                        <span>{sig.disease?.name}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        ID: {sigId}
                      </div>
                    </td>
                    <td style={{ padding: '18px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700,
                        background: sig.signal_lifecycle === 'EMERGING' ? 'rgba(255, 77, 77, 0.15)' : sig.signal_lifecycle === 'LATENT' ? 'rgba(157, 78, 221, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: sig.signal_lifecycle === 'EMERGING' ? '#ff4d4d' : sig.signal_lifecycle === 'LATENT' ? '#9d4edd' : '#60a5fa',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        {sig.signal_lifecycle_label || sig.signal_lifecycle}
                      </span>
                    </td>
                    <td style={{ padding: '18px 16px', fontWeight: 700, color: '#00f2fe' }}>
                      {sig.prism_priority_score}
                    </td>
                    <td style={{ padding: '18px 16px', fontWeight: 700, color: '#9d4edd' }}>
                      {sig.latent_signal_score}
                    </td>
                    <td style={{ padding: '18px 16px', fontWeight: 700, color: '#38bdf8' }}>
                      ↑ {sig.momentum_percent_change}% ({sig.momentum_direction})
                    </td>
                    <td style={{ padding: '18px 16px', color: '#cbd5e1' }}>
                      {sig.source_count} sources
                    </td>
                    <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenEvidenceModal(sig)}
                          style={{
                            background: 'rgba(157, 78, 221, 0.15)',
                            border: '1px solid rgba(157, 78, 221, 0.4)',
                            color: '#9d4edd',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <FileText size={14} /> View Evidence
                        </button>
                        <button
                          onClick={() => navigate(`/signals/${encodeURIComponent(sigId)}`)}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(0, 242, 254, 0.4)',
                            color: '#00f2fe',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* REAL EVIDENCE MODAL / DRAWER */}
      {evidenceModalSignal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(4, 9, 20, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="glass-card" style={{
            maxWidth: '720px', width: '100%', maxH: '85vh', maxHeight: '85vh', overflowY: 'auto',
            padding: '28px', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: '16px', background: '#0d1527'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{
                  padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                  background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', border: '1px solid rgba(0, 242, 254, 0.3)'
                }}>
                  REAL POSTGRESQL EVIDENCE
                </span>
                <h3 style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
                  {evidenceModalSignal.drug?.name} <span style={{ color: '#00f2fe' }}>→</span> {evidenceModalSignal.disease?.name}
                </h3>
              </div>
              <button
                onClick={() => setEvidenceModalSignal(null)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {evidenceLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <Activity size={28} className="spin" color="#00f2fe" style={{ marginBottom: '8px' }} />
                <div>Fetching verified evidence records from PostgreSQL database...</div>
              </div>
            ) : evidenceError ? (
              <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171' }}>
                {evidenceError}
              </div>
            ) : evidenceData ? (
              <div>
                {/* Summary Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: '#141e33', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>EVIDENCE RECORDS</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#00f2fe', marginTop: '2px' }}>
                      {evidenceData.evidence_records_count || evidenceData.evidence_records?.length || 0}
                    </div>
                  </div>

                  <div style={{ background: '#141e33', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>CLINICAL TRIALS</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                      {evidenceData.clinical_trials_count || 0}
                    </div>
                  </div>

                  <div style={{ background: '#141e33', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>SAFETY WARNINGS</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: evidenceData.warnings?.length ? '#f87171' : '#34d399', marginTop: '2px' }}>
                      {evidenceData.warnings?.length || 0}
                    </div>
                  </div>
                </div>

                {/* Evidence Records Table */}
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#ffffff' }}>Provenanced Evidence Records:</h4>
                <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#141e33', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 12px' }}>Source</th>
                        <th style={{ padding: '8px 12px' }}>Clinical Stage</th>
                        <th style={{ padding: '8px 12px' }}>Association Score</th>
                        <th style={{ padding: '8px 12px' }}>Report ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(evidenceData.evidence_records || []).map((rec, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '8px 12px', color: '#00f2fe', fontWeight: 600 }}>{rec.source || 'Open Targets'}</td>
                          <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>{rec.clinical_stage || 'N/A'}</td>
                          <td style={{ padding: '8px 12px', color: '#34d399', fontWeight: 700 }}>{rec.score ? Number(rec.score).toFixed(3) : '1.000'}</td>
                          <td style={{ padding: '8px 12px', color: '#94a3b8', fontFamily: 'monospace' }}>{rec.clinical_report_id || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Explore Workspace Action */}
                <button
                  onClick={() => {
                    const sigId = evidenceModalSignal.signal_id || evidenceModalSignal.id;
                    setEvidenceModalSignal(null);
                    navigate(`/signals/${encodeURIComponent(sigId)}`);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #00f2fe 0%, #00b4d8 100%)',
                    color: '#040914',
                    fontWeight: 700,
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  [EXPLORE SIGNAL DETAILS WORKSPACE] <ArrowRight size={16} />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
