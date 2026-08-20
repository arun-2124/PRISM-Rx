import React from 'react';
import { ShieldAlert, Database, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-color)',
      background: 'rgba(9, 13, 22, 0.95)',
      padding: '32px 24px 24px 24px',
      marginTop: '64px',
      color: 'var(--text-muted)',
      fontSize: '0.85rem',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '24px',
        }}>
          <div>
            <h4 style={{ color: 'var(--text-main)', marginBottom: '8px', fontSize: '1rem' }}>PRISM-Rx Engine</h4>
            <p>Real-Time Biotech Arbitrage Engine for Drug Repurposing Signals. Unified evidence layer aggregating 1.3M+ Knowledge Graph nodes across Open Targets 26.06, Europe PMC, UniProt, and ClinicalTrials.gov.</p>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-main)', marginBottom: '8px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={16} color="var(--accent-amber)" />
              Scientific & Regulatory Disclaimer
            </h4>
            <p>PRISM-Rx generates computational research hypotheses for laboratory and in-silico prioritization. It does <strong>NOT</strong> constitute medical advice, clinical treatment recommendations, or safety clearances.</p>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-main)', marginBottom: '8px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={16} color="var(--primary-cyan)" />
              Data Provenance & Version
            </h4>
            <p>Dataset snapshot: Open Targets Platform 26.06 | Database: SQLite <code>medbase.db</code> (545 MB, 2.0M records). CC BY 4.0 / Public Domain licensing.</p>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.75rem',
        }}>
          <div>&copy; 2026 PRISM-Rx Team. Hackathon Prototype.</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Privacy Policy</span>
            <span>Terms of Research Use</span>
            <span>Open Targets License</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
