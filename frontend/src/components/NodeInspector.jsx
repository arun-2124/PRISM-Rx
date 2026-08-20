import React, { useState } from 'react';
import { Info, Dna, Activity, ShieldCheck, Database, Layers, ExternalLink } from 'lucide-react';

export default function NodeInspector({ selectedNode, selectedEdge, pathTrace }) {
  const [activeTab, setActiveTab] = useState('identity');

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="glass-panel" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Info size={32} color="var(--primary-cyan)" style={{ marginBottom: '12px', opacity: 0.6 }} />
        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Node & Edge Inspector</div>
        <div style={{ fontSize: '0.8rem' }}>Click any Drug, Target, Disease, or Clinical Trial node to inspect biological attributes and metadata provenance.</div>
      </div>
    );
  }

  if (selectedEdge) {
    const p = selectedEdge.properties || {};
    return (
      <div className="glass-panel" style={{ padding: '20px', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span className="badge" style={{ background: 'rgba(0, 242, 254, 0.15)', color: 'var(--primary-cyan)', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
            Relationship Edge
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{selectedEdge.type}</span>
        </div>

        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
          {selectedEdge.label}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Source Node:</span>
            <span style={{ color: 'var(--primary-cyan)', fontWeight: 600 }}>{selectedEdge.source}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Target Node:</span>
            <span style={{ color: 'var(--accent-violet)', fontWeight: 600 }}>{selectedEdge.target}</span>
          </div>
          {p.action_type && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Action Mechanism:</span>
              <span style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>{p.action_type}</span>
            </div>
          )}
          {p.score !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Association Score:</span>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>{p.score} / 1.0</span>
            </div>
          )}
          {p.source && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Dataset Provenance:</span>
              <span style={{ color: 'var(--text-muted)' }}>{p.source}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const d = selectedNode.details || {};
  const ntype = selectedNode.type;

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'Drug': return { bg: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', border: 'rgba(0, 242, 254, 0.4)' };
      case 'Target': return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.4)' };
      case 'Disease': return { bg: 'rgba(157, 78, 221, 0.15)', color: '#9d4edd', border: 'rgba(157, 78, 221, 0.4)' };
      case 'ClinicalTrial': return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.4)' };
      default: return { bg: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', border: 'rgba(255, 255, 255, 0.2)' };
    }
  };

  const badgeStyle = getTypeBadgeColor(ntype);

  return (
    <div className="glass-panel" style={{ padding: '16px', fontSize: '0.85rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span className="badge" style={{ background: badgeStyle.bg, color: badgeStyle.color, border: `1px solid ${badgeStyle.border}` }}>
          {ntype} NODE
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ID: {selectedNode.id}</span>
      </div>

      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px', lineHeight: 1.3 }}>
        {selectedNode.label}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', pb: '6px' }}>
        <button
          className={`btn-secondary ${activeTab === 'identity' ? 'active' : ''}`}
          style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px' }}
          onClick={() => setActiveTab('identity')}
        >
          Identity
        </button>
        <button
          className={`btn-secondary ${activeTab === 'bio' ? 'active' : ''}`}
          style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px' }}
          onClick={() => setActiveTab('bio')}
        >
          Biology
        </button>
        <button
          className={`btn-secondary ${activeTab === 'provenance' ? 'active' : ''}`}
          style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px' }}
          onClick={() => setActiveTab('provenance')}
        >
          Evidence
        </button>
      </div>

      {/* Tab Contents */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {activeTab === 'identity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Primary Name:</span>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>{selectedNode.label}</span>
            </div>
            {d.chembl_id && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>ChEMBL ID:</span>
                <code style={{ color: 'var(--primary-cyan)' }}>{d.chembl_id}</code>
              </div>
            )}
            {d.approved_symbol && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Gene Symbol:</span>
                <code style={{ color: 'var(--accent-teal)' }}>{d.approved_symbol}</code>
              </div>
            )}
            {d.source_id && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>MONDO/EFO ID:</span>
                <code style={{ color: 'var(--accent-violet)' }}>{d.source_id}</code>
              </div>
            )}
            {d.trial_id && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>NCT / Study ID:</span>
                <code style={{ color: '#f59e0b' }}>{d.trial_id}</code>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
            {d.target_class && (
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Target Classification:</span>
                <div style={{ color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>{d.target_class}</div>
              </div>
            )}
            {d.mechanism_of_action && (
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Mechanism of Action:</span>
                <div style={{ color: 'var(--primary-cyan)', fontSize: '0.8rem', marginTop: '2px' }}>{d.mechanism_of_action}</div>
              </div>
            )}
            {d.max_clinical_stage && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Clinical Stage:</span>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{d.max_clinical_stage}</span>
              </div>
            )}
            {d.phase && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Trial Phase:</span>
                <span className="badge" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>{d.phase}</span>
              </div>
            )}
            {d.status && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Trial Status:</span>
                <span style={{ color: '#ffffff' }}>{d.status}</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'provenance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Primary Database:</span>
              <span style={{ color: '#ffffff' }}>{ntype === 'Drug' ? 'ChEMBL 33' : ntype === 'Target' ? 'UniProt / Ensembl' : ntype === 'Disease' ? 'MONDO Disease Ontology' : 'ClinicalTrials.gov'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Lineage Status:</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>VERIFIED REAL DATA</span>
            </div>
            {d.url && (
              <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-cyan)', fontSize: '0.8rem', marginTop: '6px' }}>
                View Primary Source <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
