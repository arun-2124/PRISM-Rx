import React from 'react';
import { X, GitCompare, ArrowRight, ShieldAlert, CheckCircle, Zap } from 'lucide-react';

export default function ComparisonDrawer({ signal1, signal2, onClose }) {
  if (!signal1 || !signal2) return null;

  const score1 = signal1.research_priority_score;
  const score2 = signal2.research_priority_score;

  const sc1 = signal1.score_components || {};
  const sc2 = signal2.score_components || {};

  const ev1 = signal1.evidence || {};
  const ev2 = signal2.evidence || {};

  const target1 = signal1.supporting_paths?.[0]?.target?.symbol || 'N/A';
  const target2 = signal2.supporting_paths?.[0]?.target?.symbol || 'N/A';

  const metrics = [
    { label: 'Primary Target Gene', val1: target1, val2: target2, format: 'text' },
    { label: 'PRISM Research Priority Score', val1: `${score1} / 100`, val2: `${score2} / 100`, winner: score1 >= score2 ? 1 : 2, format: 'score' },
    { label: 'Target-Disease Evidence (STD)', val1: `${sc1.target_disease_pts || 0} / 30`, val2: `${sc2.target_disease_pts || 0} / 30`, val1_num: sc1.target_disease_pts || 0, val2_num: sc2.target_disease_pts || 0, max: 30 },
    { label: 'Drug-Target Confidence (SDT)', val1: `${sc1.drug_target_pts || 0} / 15`, val2: `${sc2.drug_target_pts || 0} / 15`, val1_num: sc1.drug_target_pts || 0, val2_num: sc2.drug_target_pts || 0, max: 15 },
    { label: 'Clinical Precedence (SClin)', val1: `${sc1.clinical_pts || 0} / 15`, val2: `${sc2.clinical_pts || 0} / 15`, val1_num: sc1.clinical_pts || 0, val2_num: sc2.clinical_pts || 0, max: 15 },
    { label: 'Literature Quality (SLit)', val1: `${sc1.literature_pts || 0} / 10`, val2: `${sc2.literature_pts || 0} / 10`, val1_num: sc1.literature_pts || 0, val2_num: sc2.literature_pts || 0, max: 10 },
    { label: 'Source Diversity (FDiv)', val1: `${sc1.source_diversity_pts || 0} / 10`, val2: `${sc2.source_diversity_pts || 0} / 10`, val1_num: sc1.source_diversity_pts || 0, val2_num: sc2.source_diversity_pts || 0, max: 10 },
    { label: 'Novelty Bonus (SNov)', val1: `${sc1.novelty_pts || 0} / 10`, val2: `${sc2.novelty_pts || 0} / 10`, val1_num: sc1.novelty_pts || 0, val2_num: sc2.novelty_pts || 0, max: 10 },
    { label: 'Safety Warning Penalty', val1: `-${sc1.safety_penalty || 0} pts`, val2: `-${sc2.safety_penalty || 0} pts`, format: 'penalty' },
    { label: 'Contradiction Penalty', val1: `-${sc1.contradiction_penalty || 0} pts`, val2: `-${sc2.contradiction_penalty || 0} pts`, format: 'penalty' },
    { label: 'Highest Clinical Phase', val1: ev1.highest_clinical_phase || 'Preclinical', val2: ev2.highest_clinical_phase || 'Preclinical', format: 'text' },
    { label: 'Source Diversity Count', val1: `${ev1.source_diversity_count || 1} sources`, val2: `${ev2.source_diversity_count || 1} sources`, format: 'text' },
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      background: 'rgba(4, 7, 16, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      justify: 'center',
      alignItems: 'center',
      padding: '24px',
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '1100px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px',
        background: '#090d16',
        border: '1px solid var(--border-glow)',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitCompare size={24} color="var(--primary-cyan)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Side-by-Side Signal Comparison</h2>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '6px 12px', cursor: 'pointer' }}
          >
            <X size={18} /> Close
          </button>
        </div>

        {/* Candidate Header Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Signal 1 Card */}
          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--primary-cyan)' }}>
            <span className="badge badge-strong" style={{ marginBottom: '8px' }}>{signal1.category}</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>
              {signal1.drug.name} &rarr; {signal1.disease.name}
            </h3>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-cyan)', fontFamily: 'var(--font-heading)' }}>
              {score1} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/100 Score</span>
            </div>
          </div>

          {/* Signal 2 Card */}
          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent-purple)' }}>
            <span className="badge badge-strong" style={{ marginBottom: '8px' }}>{signal2.category}</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>
              {signal2.drug.name} &rarr; {signal2.disease.name}
            </h3>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-purple)', fontFamily: 'var(--font-heading)' }}>
              {score2} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/100 Score</span>
            </div>
          </div>
        </div>

        {/* Comparison Table & Visual Bars */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px', width: '35%' }}>Evaluation Dimension</th>
              <th style={{ padding: '12px', width: '32.5%', color: 'var(--primary-cyan)' }}>{signal1.drug.name}</th>
              <th style={{ padding: '12px', width: '32.5%', color: 'var(--accent-purple)' }}>{signal2.drug.name}</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{m.label}</td>
                <td style={{ padding: '12px', color: m.winner === 1 ? 'var(--accent-emerald)' : 'var(--text-main)', fontWeight: m.winner === 1 ? 700 : 400 }}>
                  {m.val1}
                  {m.max && (
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(m.val1_num / m.max) * 100}%`, background: 'var(--primary-cyan)' }} />
                    </div>
                  )}
                </td>
                <td style={{ padding: '12px', color: m.winner === 2 ? 'var(--accent-emerald)' : 'var(--text-main)', fontWeight: m.winner === 2 ? 700 : 400 }}>
                  {m.val2}
                  {m.max && (
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(m.val2_num / m.max) * 100}%`, background: 'var(--accent-purple)' }} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
