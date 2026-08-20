import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Scale } from 'lucide-react';

export default function ContradictionMonitor({ supportingCount = 7, contradictoryCount = 1 }) {
  const total = supportingCount + contradictoryCount;
  const supportPercent = (supportingCount / total) * 100;

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scale size={20} color="var(--accent-amber)" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Evidence Conflict Monitor (Scientific Reliability Balance)
          </h3>
        </div>

        <span className="badge badge-moderate" style={{ fontSize: '0.75rem' }}>
          HIGH PROVENANCE TRUST
        </span>
      </div>

      {/* Visual Balance Progress Bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>
          <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={16} />
            {supportingCount} Supporting Evidence Sources ({supportPercent.toFixed(0)}%)
          </span>
          <span style={{ color: contradictoryCount > 0 ? 'var(--accent-rose)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} />
            {contradictoryCount} Contradictory Study ({ (100 - supportPercent).toFixed(0)}%)
          </span>
        </div>

        <div style={{ height: '10px', background: 'rgba(239, 68, 68, 0.3)', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
          <div style={{ height: '100%', width: `${supportPercent}%`, background: 'var(--accent-emerald)', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Rationale Callout Box */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <strong>Scientific Assessment:</strong> Evidence is highly promising but subject to ongoing clinical verification. {contradictoryCount > 0 ? '1 preliminary study identified potential off-target binding at high micromolar concentrations.' : 'Zero contradictory studies identified in current dataset snapshot.'}
      </div>
    </div>
  );
}
