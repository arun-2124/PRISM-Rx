import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Dna, Layers, ShieldCheck, AlertTriangle, Layers3 } from 'lucide-react';

export default function SignalCard({ signal }) {
  const navigate = useNavigate();

  const drug = signal.drug;
  const disease = signal.disease;
  const score = signal.research_priority_score;
  const category = signal.category;
  const evidence = signal.evidence || {};
  const paths = signal.supporting_paths || [];
  const primaryTarget = paths[0]?.target?.symbol || 'Multi-Target';

  const getBadgeClass = (cat) => {
    switch (cat) {
      case 'STRONG_RESEARCH_SIGNAL': return 'badge-strong';
      case 'MODERATE_RESEARCH_SIGNAL': return 'badge-moderate';
      case 'WEAK_RESEARCH_SIGNAL': return 'badge-weak';
      case 'CONTRADICTED': return 'badge-contradicted';
      default: return 'badge-insufficient';
    }
  };

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'STRONG_RESEARCH_SIGNAL': return 'STRONG SIGNAL';
      case 'MODERATE_RESEARCH_SIGNAL': return 'MODERATE SIGNAL';
      case 'WEAK_RESEARCH_SIGNAL': return 'WEAK SIGNAL';
      case 'CONTRADICTED': return 'CONTRADICTED';
      default: return 'INSUFFICIENT';
    }
  };

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        {/* Top Header: Badges & Score */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className={`badge ${getBadgeClass(category)}`}>
              {category === 'CONTRADICTED' ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
              {getCategoryLabel(category)}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: score >= 70 ? 'var(--accent-emerald)' : score >= 40 ? 'var(--primary-cyan)' : 'var(--accent-amber)' }}>
              {score}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/100</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Research Priority</div>
          </div>
        </div>

        {/* Drug -> Disease Relationship Flow */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
            {drug.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-cyan)', fontSize: '0.85rem', fontWeight: 600, margin: '6px 0' }}>
            <ArrowRight size={14} />
            {disease.name}
          </div>
        </div>

        {/* Metadata Indicators Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          fontSize: '0.75rem',
          marginBottom: '16px',
        }}>
          <div>
            <span style={{ color: 'var(--text-dim)' }}>Target: </span>
            <strong style={{ color: 'var(--accent-emerald)' }}>{primaryTarget}</strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-dim)' }}>Sources: </span>
            <strong style={{ color: 'var(--text-main)' }}>{evidence.source_diversity_count || 1} independent</strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-dim)' }}>Clinical: </span>
            <strong style={{ color: 'var(--accent-amber)' }}>{evidence.highest_clinical_phase || 'Preclinical'}</strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-dim)' }}>Warnings: </span>
            <strong style={{ color: evidence.safety_warnings_count > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
              {evidence.safety_warnings_count || 0}
            </strong>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => navigate(`/signals/${encodeURIComponent(signal.signal_id)}`)}
      >
        VIEW SIGNAL
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
