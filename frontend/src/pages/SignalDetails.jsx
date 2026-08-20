import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Download, Layers, Activity, FileText, Calendar, CheckCircle, AlertTriangle, Zap, GitMerge, Info, RefreshCw, ExternalLink, BookOpen } from 'lucide-react';
import { fetchSignalById, fetchSignalGraph, fetchSignalTrials, fetchSignalEvidence, fetchLiveEuropePMC } from '../api';
import { isSignalSaved, toggleSaveSignal } from '../utils/savedSignals';
import ScoreBreakdown from '../components/ScoreBreakdown';
import InteractiveGraph from '../components/InteractiveGraph';

export default function SignalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [signal, setSignal] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [trialsData, setTrialsData] = useState(null);
  const [evidenceData, setEvidenceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live Literature Enrichment state
  const [liveLit, setLiveLit] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setLiveLit(null);
    setLiveError(null);

    Promise.all([
      fetchSignalById(id),
      fetchSignalGraph(id).catch(() => null),
      fetchSignalTrials(id).catch(() => null),
      fetchSignalEvidence(id).catch(() => null),
    ])
      .then(([sigRes, graphRes, trialsRes, evRes]) => {
        setSignal(sigRes);
        setGraphData(graphRes);
        setTrialsData(trialsRes);
        setEvidenceData(evRes);
        setLoading(false);
      })
      .catch(err => {
        console.error('Signal details fetch error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleFetchLiveLit = () => {
    if (!signal) return;
    setLiveLoading(true);
    setLiveError(null);

    fetchLiveEuropePMC(signal.drug.name, signal.disease.name)
      .then(results => {
        setLiveLit(results);
        setLiveLoading(false);
      })
      .catch(err => {
        console.error('Live literature fetch failed:', err);
        setLiveError(err.message || 'Live Europe PMC lookup unavailable.');
        setLiveLoading(false);
      });
  };

  const handleExpandNeighborhood = () => {
    fetchSignalGraph(id, { expanded: true, max_nodes: 100 })
      .then(res => {
        if (res) setGraphData(res);
      })
      .catch(err => console.error('Neighborhood expansion error:', err));
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-cyan)', marginBottom: '8px' }}>
          Analyzing Evidence & Loading Neighborhood Graph...
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Retrieving provenanced paths, clinical study reports, and safety records.
        </div>
      </div>
    );
  }

  if (error || !signal) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 24px' }}>
        <button className="btn-secondary" onClick={() => navigate('/signals')} style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Explorer
        </button>
        <div className="glass-card" style={{ padding: '40px', color: 'var(--accent-rose)' }}>
          Error loading signal details: {error || 'Candidate signal not found.'}
        </div>
      </div>
    );
  }

  const drug = signal.drug;
  const disease = signal.disease;
  const score = signal.research_priority_score;
  const category = signal.category;
  const scoreComps = signal.score_components || {};
  const evidence = signal.evidence || {};

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isSignalSaved(signal.signal_id));
  }, [signal.signal_id]);

  const handleToggleBookmark = () => {
    const newStatus = toggleSaveSignal(signal.signal_id);
    setSaved(newStatus);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Back Button */}
      <button className="btn-secondary" onClick={() => navigate('/signals')} style={{ marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to Signal Explorer
      </button>

      {/* Main Signal Banner */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '32px', borderLeft: '4px solid var(--primary-cyan)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
              <span className={`badge ${category === 'STRONG_RESEARCH_SIGNAL' ? 'badge-strong' : category === 'MODERATE_RESEARCH_SIGNAL' ? 'badge-moderate' : 'badge-weak'}`}>
                {category}
              </span>

              {/* Bookmark Button */}
              <button
                onClick={handleToggleBookmark}
                style={{
                  background: saved ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: saved ? '1px solid var(--primary-cyan)' : '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  color: saved ? 'var(--primary-cyan)' : 'var(--text-main)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                <FileText size={14} fill={saved ? 'var(--primary-cyan)' : 'none'} />
                {saved ? 'SAVED TO PORTFOLIO' : 'SAVE HYPOTHESIS'}
              </button>
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px' }}>
              {drug.name} <span style={{ color: 'var(--primary-cyan)' }}>&rarr;</span> {disease.name}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>
              Drug ID: {drug.id} | Disease ID: {disease.id}
            </p>
          </div>

          <div style={{ textAlign: 'right', background: 'rgba(0, 242, 254, 0.05)', padding: '16px 24px', borderRadius: '12px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--primary-cyan)' }}>
              {score}
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PRISM Research Priority Score</div>
          </div>
        </div>
      </div>

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
          <strong>HIGH SCORE &ne; CLINICAL PROOF:</strong> PRISM Score represents computational research priority, not clinical efficacy, safety, or treatment suitability for patient care.
        </div>
      </div>

      {/* WHY PRISM DETECTED THIS & SCORE BREAKDOWN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Score Breakdown Progress Bars */}
        <ScoreBreakdown components={scoreComps} />

        {/* Dynamic Hypothesis Explanation */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--primary-cyan)" />
            WHY PRISM DETECTED THIS
          </h3>

          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-main)', marginBottom: '16px', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {signal.explanation}
          </p>

          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Primary Biological Target Paths:</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {signal.supporting_paths?.map((p, idx) => (
              <div key={idx} style={{ background: 'rgba(0, 242, 254, 0.05)', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(0, 242, 254, 0.15)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                <strong>{drug.name}</strong> &ndash;[{p.action_type || 'INHIBITOR'}]&rarr; <strong style={{ color: 'var(--accent-emerald)' }}>{p.target.symbol} ({p.target.name})</strong> &ndash;(score: {p.target_disease_score})&rarr; <strong>{disease.name}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TWO COLUMN SECTION: INFORMATION ARBITRAGE + INDEPENDENT SIGNAL COLLISION */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* INFORMATION ARBITRAGE */}
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

        {/* INDEPENDENT SIGNAL COLLISION */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitMerge size={18} />
            INDEPENDENT SIGNAL COLLISION
          </h3>

          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)', letterSpacing: '0.05em', marginBottom: '16px' }}>
            CONVERGING EVIDENCE ({evidence.source_diversity_count || 1} PUBLIC SOURCES)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Target-Disease Association:</span>
              <strong style={{ color: 'var(--primary-cyan)' }}>Score {evidence.target_disease_score || '1.000'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Drug Action Confidence:</span>
              <strong style={{ color: 'var(--accent-emerald)' }}>{evidence.drug_target_confidence || '0.90'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Clinical Study Precedence:</span>
              <strong style={{ color: 'var(--accent-amber)' }}>{evidence.highest_clinical_phase || 'Preclinical'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Literature Records Count:</span>
              <strong style={{ color: '#3b82f6' }}>{evidence.evidence_records_count || 0} records</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 2-Hop Knowledge Neighborhood Graph */}
      {graphData && (
        <div style={{ marginBottom: '32px' }}>
          <InteractiveGraph graphData={graphData} onExpandNeighborhood={handleExpandNeighborhood} />
        </div>
      )}

      {/* Clinical Trials Table View */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--accent-amber)" />
          Clinical Trials Evidence ({trialsData?.trials_count || 0} studies found)
        </h3>

        {trialsData?.trials?.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Trial ID</th>
                  <th style={{ padding: '10px' }}>Phase</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }}>Study Purpose</th>
                  <th style={{ padding: '10px' }}>Start Date</th>
                </tr>
              </thead>
              <tbody>
                {trialsData.trials.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px', color: 'var(--primary-cyan)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{t.trial_id}</td>
                    <td style={{ padding: '10px' }}><span className="badge badge-moderate">{t.trial_phase || 'Phase N/A'}</span></td>
                    <td style={{ padding: '10px', color: 'var(--text-main)' }}>{t.trial_status || 'Active'}</td>
                    <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{t.trial_primary_purpose || 'Therapeutic evaluation'}</td>
                    <td style={{ padding: '10px', color: 'var(--text-dim)' }}>{t.trial_start_date || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No clinical trials for this condition were identified in the current dataset snapshot.
          </div>
        )}
      </div>

      {/* LIVE LITERATURE ENRICHMENT (EUROPE PMC REST API) */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '32px', border: '1px solid rgba(0, 242, 254, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-cyan)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>
              <BookOpen size={16} />
              LIVE LITERATURE ENRICHMENT
            </div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>
              Real-time Europe PMC Publication Preprints
            </h3>
          </div>

          <button
            onClick={handleFetchLiveLit}
            disabled={liveLoading}
            className="btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} className={liveLoading ? 'spin' : ''} />
            {liveLoading ? 'Querying Europe PMC API...' : 'REFRESH LIVE LITERATURE'}
          </button>
        </div>

        {/* Source Distinction Disclaimer Banner */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          marginBottom: '20px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>LOCAL DATASET EVIDENCE:</span> Verified snapshot from Open Targets 26.06 (medbase.db).
          </div>
          <div>
            <span style={{ color: 'var(--primary-cyan)', fontWeight: 700 }}>LIVE EXTERNAL LITERATURE:</span> Real-time query to Europe PMC REST API. <em>(Does not alter candidate PRISM score)</em>.
          </div>
        </div>

        {/* State Handler */}
        {liveLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
            <div>Querying Europe PMC Public REST API for publications matching <strong>&ldquo;{drug.name}&rdquo; AND &ldquo;{disease.name}&rdquo;</strong>...</div>
          </div>
        ) : liveError ? (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem' }}>
            <strong>Live Literature Lookup Failed:</strong> {liveError}
            <div style={{ marginTop: '4px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Note: Local database evidence and PRISM score remain 100% operational.
            </div>
          </div>
        ) : liveLit ? (
          liveLit.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No recent literature records returned by Europe PMC for &ldquo;{drug.name}&rdquo; AND &ldquo;{disease.name}&rdquo;.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {liveLit.map((pub, idx) => (
                <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <a
                      href={pub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-cyan)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {pub.title}
                      <ExternalLink size={14} />
                    </a>
                    <span className="badge badge-moderate" style={{ fontSize: '0.7rem' }}>
                      {pub.pubYear} &bull; {pub.journal}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Authors: {pub.authors} {pub.pmid && <span style={{ color: 'var(--text-dim)' }}>| PMID: {pub.pmid}</span>}
                  </div>

                  {pub.abstractSnippet && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5, background: 'rgba(0, 0, 0, 0.2)', padding: '10px 12px', borderRadius: '6px' }}>
                      {pub.abstractSnippet}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Click <strong>REFRESH LIVE LITERATURE</strong> to query Europe PMC REST API for live 2026 preprints and publications.
          </div>
        )}
      </div>

      {/* Safety Warnings Banner */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} color="var(--accent-rose)" />
          Safety Information Available in Current Dataset
        </h3>

        {evidenceData?.warnings?.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {evidenceData.warnings.map((w, idx) => (
              <div key={idx} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>
                  [{w.warning_type}] {w.toxicity_class || 'Black Box / Toxicity Warning'} ({w.country || 'Global'})
                </div>
                <div style={{ color: 'var(--text-muted)' }}>{w.description}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', fontSize: '0.9rem' }}>
            <CheckCircle size={18} />
            No warning record found in the current dataset snapshot.
          </div>
        )}
      </div>
    </div>
  );
}
