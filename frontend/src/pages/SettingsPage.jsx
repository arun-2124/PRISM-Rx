import React from 'react';
import { Settings, ShieldCheck, Database, FileText, Cpu, Info } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={28} color="var(--primary-cyan)" />
          Methodology & Platform Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Technical specifications, scoring algorithms, data source versioning, and scientific limitations.
        </p>
      </div>

      {/* Database & Data Sources */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={18} />
          Integrated Data Sources & Provenance
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', fontSize: '0.85rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--text-main)' }}>Open Targets Platform 26.06</strong>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Genetic target-disease association scores, evidence records, and drug profiles.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--text-main)' }}>ClinicalTrials.gov Snapshot</strong>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>28,412 active clinical trials, trial phases, primary purposes, and status reports.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--text-main)' }}>Europe PMC REST API</strong>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Real-time literature preprints and journal publication search with 6s timeout protection.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--text-main)' }}>UniProt Knowledgebase</strong>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Human protein target symbols, accession IDs, and crystal structure coordinates.</p>
          </div>
        </div>
      </div>

      {/* PRISM Scoring Algorithm Formula */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={18} />
          PRISM Research Priority Score Formula
        </h3>

        <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(157, 78, 221, 0.3)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--primary-cyan)', marginBottom: '16px' }}>
          PRISM Score = S_TD (30) + S_DT (15) + S_Clin (15) + S_Lit (10) + F_Div (10) + B_Target (10) + S_Nov (10) - P_Safety (40) - P_Contra (30)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
          <div><strong style={{ color: 'var(--text-main)' }}>Target-Disease (S_TD):</strong> Max 30 pts based on genetic evidence.</div>
          <div><strong style={{ color: 'var(--text-main)' }}>Drug-Target (S_DT):</strong> Max 15 pts based on mechanism action confidence.</div>
          <div><strong style={{ color: 'var(--text-main)' }}>Clinical Stage (S_Clin):</strong> Max 15 pts based on drug highest phase.</div>
          <div><strong style={{ color: 'var(--text-main)' }}>Source Diversity (F_Div):</strong> Max 10 pts based on independent data sources.</div>
          <div><strong style={{ color: 'var(--text-main)' }}>Multi-Target Bonus (B_Target):</strong> Max 10 pts for multi-target kinase pathways.</div>
          <div><strong style={{ color: 'var(--text-main)' }}>Safety Penalty (P_Safety):</strong> Subtracted up to -40 pts for toxicity warnings.</div>
        </div>
      </div>
    </div>
  );
}
