import React from 'react';
import { Database, Search, GitMerge, Cpu, BarChart3, FileText, Bell } from 'lucide-react';

export default function PipelineWorkflow() {
  const steps = [
    { title: 'SCAN', desc: 'Continuous stream scanning', icon: Database, color: 'var(--primary-cyan)' },
    { title: 'EXTRACT', desc: 'NLP & entity resolution', icon: Search, color: '#3b82f6' },
    { title: 'CONNECT', desc: 'Knowledge graph edges', icon: GitMerge, color: 'var(--accent-purple)' },
    { title: 'DETECT', desc: 'Unindicated path matching', icon: Cpu, color: 'var(--accent-emerald)' },
    { title: 'SCORE', desc: '0-100 multi-factor matrix', icon: BarChart3, color: 'var(--accent-amber)' },
    { title: 'EXPLAIN', desc: 'Transparent evidence rationale', icon: FileText, color: '#ec4899' },
    { title: 'ALERT', desc: 'Real-time research signals', icon: Bell, color: 'var(--accent-rose)' },
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>
        PRISM-Rx END-TO-END INTELLIGENCE PIPELINE
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={idx}>
              <div style={{
                flex: '1',
                minWidth: '110px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center',
                transition: 'transform 0.2s',
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px auto',
                  color: step.color,
                  border: `1px solid ${step.color}33`,
                }}>
                  <Icon size={16} />
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.04em' }}>{step.title}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>{step.desc}</div>
              </div>

              {idx < steps.length - 1 && (
                <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 700 }}>&rarr;</div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
