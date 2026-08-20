import React from 'react';
import { FileCheck2, Activity, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ClinicalTrialsPage() {
  const navigate = useNavigate();

  const phaseStats = [
    { phase: 'Phase 1', count: '8,410', percent: '29.6%', color: 'var(--primary-cyan)' },
    { phase: 'Phase 2', count: '11,240', percent: '39.5%', color: 'var(--accent-purple)' },
    { phase: 'Phase 3', count: '6,520', percent: '22.9%', color: 'var(--accent-emerald)' },
    { phase: 'Phase 4', count: '2,242', percent: '7.9%', color: 'var(--accent-amber)' },
  ];

  const recentTrialEvents = [
    { trialId: 'NCT04812901', drug: 'Tg100-801', disease: 'acute lymphoblastic leukemia', phase: 'Phase 1', status: 'Recruiting', purpose: 'Safety & Target Occupancy Evaluation' },
    { trialId: 'NCT03984102', drug: 'Aspirin', disease: 'B-cell acute lymphoblastic leukemia', phase: 'Phase 2', status: 'Completed', purpose: 'Adjuvant Chemotherapy Trial' },
    { trialId: 'NCT02891044', drug: 'Metformin', disease: 'neoplasm', phase: 'Phase 2', status: 'Active, not recruiting', purpose: 'Metabolic Pathway Repurposing' },
    { trialId: 'NCT05102911', drug: 'Pazopanib', disease: 'renal cell carcinoma', phase: 'Phase 3', status: 'Active', purpose: 'Combination Angiogenesis Trial' },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileCheck2 size={28} color="var(--accent-amber)" />
          Clinical Trials Repurposing Analytics
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Monitored database of 28,412 active clinical trials from ClinicalTrials.gov snapshot.
        </p>
      </div>

      {/* Phase Distribution KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {phaseStats.map((p, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              {p.phase} Trials
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: p.color }}>
              {p.count}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              {p.percent} of active portfolio
            </div>
          </div>
        ))}
      </div>

      {/* Recently Updated Clinical Trials Feed Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--accent-amber)" />
          Recently Updated Clinical Study Reports
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px' }}>NCT Trial ID</th>
                <th style={{ padding: '12px' }}>Candidate Drug</th>
                <th style={{ padding: '12px' }}>Disease Area</th>
                <th style={{ padding: '12px' }}>Phase</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Primary Purpose</th>
              </tr>
            </thead>
            <tbody>
              {recentTrialEvents.map((t, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: 'var(--primary-cyan)', fontFamily: 'var(--font-mono)' }}>{t.trialId}</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-main)' }}>{t.drug}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{t.disease}</td>
                  <td style={{ padding: '12px' }}><span className="badge badge-strong">{t.phase}</span></td>
                  <td style={{ padding: '12px', color: 'var(--accent-emerald)' }}>{t.status}</td>
                  <td style={{ padding: '12px', color: 'var(--text-dim)' }}>{t.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
