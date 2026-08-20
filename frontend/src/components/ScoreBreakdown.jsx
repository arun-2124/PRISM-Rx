import React from 'react';

export default function ScoreBreakdown({ components }) {
  if (!components) return null;

  const items = [
    { label: 'Target-Disease Association', val: components.target_disease_pts, max: 30, color: 'var(--primary-cyan)' },
    { label: 'Drug-Target Action Confidence', val: components.drug_target_pts, max: 15, color: 'var(--accent-emerald)' },
    { label: 'Clinical Precedence & Stage', val: components.clinical_pts, max: 15, color: 'var(--accent-amber)' },
    { label: 'Literature & Evidence Quality', val: components.literature_pts, max: 10, color: 'var(--accent-purple)' },
    { label: 'Source Diversity Factor', val: components.source_diversity_pts, max: 10, color: '#3b82f6' },
    { label: 'Multi-Target Support Bonus', val: components.multi_target_bonus_pts, max: 10, color: '#10b981' },
    { label: 'Under-Investigated Novelty', val: components.novelty_pts, max: 10, color: '#ec4899' },
  ];

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-main)' }}>
        Research Priority Score Components
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {items.map((item, idx) => {
          const pct = Math.min(100, Math.max(0, (item.val / item.max) * 100));
          return (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontWeight: 700, color: item.color }}>
                  {item.val} <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 400 }}>/ {item.max} pts</span>
                </span>
              </div>
              <div style={{
                height: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: item.color,
                  borderRadius: '4px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          );
        })}

        {/* Penalties */}
        {components.safety_penalty > 0 && (
          <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '0.85rem', color: '#f87171' }}>
            <strong>Safety Warning Penalty:</strong> -{components.safety_penalty} pts
          </div>
        )}

        {components.contradiction_penalty > 0 && (
          <div style={{ marginTop: '4px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '0.85rem', color: '#f87171' }}>
            <strong>Contradiction Penalty:</strong> -{components.contradiction_penalty} pts
          </div>
        )}
      </div>
    </div>
  );
}
