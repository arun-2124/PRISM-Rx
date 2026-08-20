import React from 'react';
import { TrendingUp, FileText, Calendar, Activity, Zap } from 'lucide-react';

export default function EvidenceMomentumChart({ candidateName = 'Tg100-801 -> acute lymphoblastic leukemia', momentum = '+68%' }) {
  const eventMarkers = [
    { date: 'Q1 PREPRINTS', type: 'Preprint', title: 'bioRxiv: Dual Kinase Inhibition Mechanism', impact: '+12%' },
    { date: 'Q2 TRIALS', type: 'Trial Update', title: 'ClinicalTrials.gov: Phase 1 Enrollment Complete', impact: '+24%' },
    { date: 'Q3 ABSTRACTS', type: 'Conference', title: 'AACR Abstract: Target Binding Affinity', impact: '+45%' },
    { date: 'CURRENT SIGNAL', type: 'Signal Detected', title: 'PRISM-Rx High-Confidence Research Signal', impact: 'EVIDENCE CONVERGED' },
  ];

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-cyan)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>
            <TrendingUp size={16} />
            EVIDENCE CONVERGENCE TRAJECTORY (ILLUSTRATIVE DEMO VISUALIZATION)
          </div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>
            Research Publication & Evidence Accumulation Trend
          </h3>
        </div>

        <div style={{ textAlign: 'right', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-heading)' }}>
            CONVERGED
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Evidence Status</div>
        </div>
      </div>

      {/* SVG Time-Series Momentum Curve */}
      <div style={{ height: '160px', width: '100%', position: 'relative', marginBottom: '24px' }}>
        <svg width="100%" height="100%" viewBox="0 0 600 140" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="momentumGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
          <line x1="0" y1="70" x2="600" y2="70" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
          <line x1="0" y1="110" x2="600" y2="110" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />

          {/* Area Fill */}
          <path d="M 0,120 Q 150,110 300,70 T 600,10 L 600,140 L 0,140 Z" fill="url(#momentumGrad)" />

          {/* Smooth Acceleration Line */}
          <path d="M 0,120 Q 150,110 300,70 T 600,10" fill="none" stroke="#10b981" strokeWidth="3" />

          {/* Event Dots */}
          <circle cx="150" cy="110" r="5" fill="#3b82f6" stroke="#040914" strokeWidth="2" />
          <circle cx="300" cy="70" r="5" fill="var(--accent-amber)" stroke="#040914" strokeWidth="2" />
          <circle cx="450" cy="35" r="5" fill="var(--accent-purple)" stroke="#040914" strokeWidth="2" />
          <circle cx="590" cy="12" r="7" fill="#10b981" stroke="#040914" strokeWidth="2" />
        </svg>
      </div>

      {/* Event Timeline Markers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {eventMarkers.map((evt, idx) => (
          <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.7rem', marginBottom: '4px' }}>
              <span>{evt.date}</span>
              <strong style={{ color: 'var(--accent-emerald)' }}>{evt.impact}</strong>
            </div>
            <div style={{ fontWeight: 700, color: 'var(--primary-cyan)', marginBottom: '2px' }}>{evt.type}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{evt.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
