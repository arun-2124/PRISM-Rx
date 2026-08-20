import React from 'react';
import { Radio } from 'lucide-react';
import ResearchFeedTerminal from '../components/ResearchFeedTerminal';

export default function ResearchFeedPage() {
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Radio size={28} color="var(--primary-cyan)" className="spin" />
          Real-Time Biomedical Research Intelligence Terminal
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Live event stream monitoring bioRxiv preprints, Europe PMC publications, ClinicalTrials.gov updates, and UniProt target structural studies.
        </p>
      </div>

      <ResearchFeedTerminal limit={10} />
    </div>
  );
}
