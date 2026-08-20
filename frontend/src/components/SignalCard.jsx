import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Dna, Layers, ShieldCheck, AlertTriangle, Bookmark, Check, GitCompare } from 'lucide-react';
import { isSignalSaved, toggleSaveSignal } from '../utils/savedSignals';

export default function SignalCard({ signal, isSelectedForCompare, onToggleCompare }) {
  const navigate = useNavigate();

  const drug = signal.drug;
  const disease = signal.disease;
  const score = signal.research_priority_score;
  const category = signal.category;
  const evidence = signal.evidence || {};
  const paths = signal.supporting_paths || [];
  const primaryTarget = paths[0]?.target?.symbol || 'Multi-Target';

  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    setSaved(isSignalSaved(signal.signal_id));

    const handleSavedChange = () => {
      setSaved(isSignalSaved(signal.signal_id));
    };

    window.addEventListener('prism_saved_signals_changed', handleSavedChange);
    return () => window.removeEventListener('prism_saved_signals_changed', handleSavedChange);
  }, [signal.signal_id]);

  const handleToggleBookmark = (e) => {
    e.stopPropagation();
    const newStatus = toggleSaveSignal(signal.signal_id);
    setSaved(newStatus);
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

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
    <div className="glass-card" style={{
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justify: 'space-between',
      position: 'relative',
      border: isSelectedForCompare ? '1px solid var(--primary-cyan)' : '1px solid var(--border-color)',
      boxShadow: isSelectedForCompare ? '0 0 15px rgba(0, 242, 254, 0.25)' : 'none',
    }}>
      <div>
        {/* Top Header: Badges & Score + Bookmark + Compare Checkbox */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`badge ${getBadgeClass(category)}`}>
              {category === 'CONTRADICTED' ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
              {getCategoryLabel(category)}
            </span>

            {/* Bookmark Toggle Button */}
            <button
              onClick={handleToggleBookmark}
              title={saved ? 'Remove from Saved Hypotheses' : 'Save Hypothesis to Portfolio'}
              style={{
                background: saved ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: saved ? '1px solid var(--primary-cyan)' : '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                color: saved ? 'var(--primary-cyan)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              <Bookmark size={14} fill={saved ? 'var(--primary-cyan)' : 'none'} />
              {saved ? 'Saved' : 'Save'}
            </button>

            {/* Compare Checkbox Button */}
            {onToggleCompare && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleCompare(signal); }}
                title="Select signal for side-by-side comparison"
                style={{
                  background: isSelectedForCompare ? 'rgba(157, 78, 221, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: isSelectedForCompare ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  color: isSelectedForCompare ? 'var(--accent-purple)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                <GitCompare size={14} />
                {isSelectedForCompare ? 'Compared' : 'Compare'}
              </button>
            )}
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

      {/* Toast Feedback */}
      {toast && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 242, 254, 0.95)',
          color: '#040914',
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '4px 12px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
        }}>
          <Check size={12} />
          {saved ? 'Signal saved to portfolio' : 'Signal removed'}
        </div>
      )}
    </div>
  );
}
