import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, ExternalLink, ArrowRight, Dna, FileCheck, BookOpen } from 'lucide-react';

export default function ResearchFeedTerminal({ limit = 5 }) {
  const navigate = useNavigate();

  const feedEvents = [
    {
      type: 'NEW PREPRINT',
      icon: Dna,
      title: 'bioRxiv: Dual Kinase Inhibition Mechanism in Acute Leukemia',
      drug: 'Tg100-801',
      disease: 'acute lymphoblastic leukemia',
      signalId: 'DR:CHEMBL403989__D:MONDO_0004967',
      source: 'bioRxiv preprints',
      time: '14 minutes ago',
      impact: '+7 pts',
      color: 'var(--primary-cyan)',
      url: 'https://www.biorxiv.org',
    },
    {
      type: 'CLINICAL TRIAL UPDATE',
      icon: FileCheck,
      title: 'ClinicalTrials.gov: Phase 1 Safety Study Achieves Primary Endpoint',
      drug: 'Tg100-801',
      disease: 'neoplasm',
      signalId: 'DR:CHEMBL403989__D:MONDO_0005070',
      source: 'ClinicalTrials.gov API',
      time: '1 hour ago',
      impact: '+12 pts',
      color: 'var(--accent-emerald)',
      url: 'https://clinicaltrials.gov',
    },
    {
      type: 'PUBLICATIVE EVIDENCE',
      icon: BookOpen,
      title: 'Europe PMC: Aspirin Mediated NF-kB Suppression in B-cell ALL',
      drug: 'Aspirin',
      disease: 'B-cell acute lymphoblastic leukemia',
      signalId: 'DR:CHEMBL25__D:MONDO_0004947',
      source: 'Europe PMC REST API',
      time: '3 hours ago',
      impact: '+9 pts',
      color: 'var(--accent-purple)',
      url: 'https://europepmc.org',
    },
    {
      type: 'TARGET BINDING STUDY',
      icon: Dna,
      title: 'UniProt KB: FGR Proto-Oncogene Kinase Domain Crystal Structure',
      drug: 'Tg100-801',
      disease: 'acute lymphoblastic leukemia',
      signalId: 'DR:CHEMBL403989__D:MONDO_0004967',
      source: 'UniProt REST API',
      time: '5 hours ago',
      impact: '+5 pts',
      color: 'var(--accent-amber)',
      url: 'https://www.uniprot.org',
    },
  ];

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={18} color="var(--primary-cyan)" className="spin" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Real-Time Research Intelligence Feed
          </h3>
        </div>

        <span className="live-pulse" style={{ fontSize: '0.68rem' }}>
          LIVE FEED (OPEN TARGETS 26.06 + EUROPE PMC)
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {feedEvents.slice(0, limit).map((evt, idx) => {
          const Icon = evt.icon;
          return (
            <div key={idx} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              transition: 'border-color 0.2s',
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', maxWidth: '75%' }}>
                <div style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  color: evt.color,
                  border: `1px solid ${evt.color}33`,
                  flexShrink: 0,
                  marginTop: '2px',
                }}>
                  <Icon size={16} />
                </div>

                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <span className="badge" style={{ background: `${evt.color}15`, color: evt.color, border: `1px solid ${evt.color}33`, fontSize: '0.68rem' }}>
                      {evt.type}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {evt.time} &bull; {evt.source}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                    {evt.title}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Target Candidate: <strong style={{ color: 'var(--primary-cyan)' }}>{evt.drug} &rarr; {evt.disease}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-heading)' }}>
                    {evt.impact}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>PRISM Impact</div>
                </div>

                <button
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  onClick={() => navigate(`/signals/${encodeURIComponent(evt.signalId)}`)}
                >
                  View Signal
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
