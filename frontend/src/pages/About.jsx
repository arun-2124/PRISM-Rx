import React from 'react';
import { ShieldAlert, Database, Cpu, Dna, FileText } from 'lucide-react';

export default function About() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span className="badge badge-strong" style={{ marginBottom: '12px' }}>
          <Cpu size={12} /> SYSTEM SPECIFICATIONS & METHODOLOGY
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '12px' }}>
          PRISM-Rx <span className="text-gradient">Methodology & Limitations</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '700px', margin: '0 auto' }}>
          Transparent documentation of data provenance, Knowledge Graph traversal, scoring dimensions, and scientific boundaries.
        </p>
      </div>

      {/* Section 1: Data Sources & Provenance */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-cyan)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Database size={22} />
          1. Data Provenance & Unified Layer
        </h2>
        <p style={{ color: 'var(--text-main)', lineHeight: 1.7, marginBottom: '16px' }}>
          PRISM-Rx integrates multiple public biological data sources into a unified SQLite evidence database (<code>medbase.db</code>, 545 MB, 2,002,249 records):
        </p>
        <ul style={{ paddingLeft: '24px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <li><strong>Open Targets Platform (26.06)</strong>: Disease ontologies, gene targets, drug mechanisms of action, clinical precedence evidence. (CC BY 4.0).</li>
          <li><strong>ClinicalTrials.gov (API v2)</strong>: Interventional trial reports, phases, study statuses, start dates. (Public Domain).</li>
          <li><strong>Europe PMC REST API</strong>: Literature evidence annotations and publication identifiers. (Open Access).</li>
          <li><strong>UniProt KB</strong>: SwissProt protein accessions and gene symbol mapping. (CC BY 4.0).</li>
        </ul>
      </div>

      {/* Section 2: Knowledge Graph & Traversal */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--accent-purple)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Dna size={22} />
          2. Knowledge Graph Construction & Candidate Collapsing
        </h2>
        <p style={{ color: 'var(--text-main)', lineHeight: 1.7, marginBottom: '16px' }}>
          The Knowledge Graph models 1,310,752 nodes and 1,084,374 directional edges. Multi-hop graph traversal evaluates candidate paths:
        </p>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--primary-cyan)', marginBottom: '16px' }}>
          Drug &ndash;[TARGETS]&rarr; Target &ndash;[ASSOCIATED_WITH]&rarr; Disease
        </div>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Candidates are filtered to exclude pairs with established clinical indications in the <code>drug_disease</code> table. Duplicate biological target paths connecting the same Drug and Disease are collapsed into unique candidate pairs with capped multi-target support bonuses.
        </p>
      </div>

      {/* Section 3: Research Priority Scoring Model */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--accent-emerald)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={22} />
          3. Multi-Factor Research Priority Score (0 – 100)
        </h2>
        <p style={{ color: 'var(--text-main)', lineHeight: 1.7, marginBottom: '16px' }}>
          The transparent 100-point formula balances target-disease association strength, drug-target action confidence, clinical trial precedence, literature recency, source diversity, multi-target bonus, and safety penalties:
        </p>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.8 }}>
          <strong>Formula:</strong> Clamp( S_TD + S_DT + S_Clin + S_Lit + F_Div + B_Target + S_Nov - P_Safety - P_Contra )<br />
          &bull; <strong>Target-Disease ($S_{TD}$)</strong>: Max score &times; 30 pts<br />
          &bull; <strong>Drug-Target Action ($S_{DT}$)</strong>: Mechanism confidence &times; 15 pts<br />
          &bull; <strong>Clinical Precedence ($S_{Clin}$)</strong>: Highest trial phase (Phase 4: 15 pts, Phase 3: 12 pts, Phase 2: 9 pts, Phase 1: 6 pts)<br />
          &bull; <strong>Source Diversity ($F_{Div}$)</strong>: Independent sources count &times; 2.5 pts (max 10 pts)<br />
          &bull; <strong>Safety Penalty ($P_{Safety}$)</strong>: Black-box warning (-25 pts), Withdrawn (-40 pts)<br />
        </div>
      </div>

      {/* Section 4: Scientific & Regulatory Limitations */}
      <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '24px', borderRadius: '16px', color: '#f87171' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={20} />
          Critical Scientific & Regulatory Disclaimer
        </h3>
        <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>
          PRISM-Rx generates computational research hypotheses for laboratory and in-silico prioritization. A high Research Priority Score indicates strong public data support for further research; it does <strong>NOT</strong> establish clinical efficacy, patient safety, treatment suitability, or regulatory approval. Absence of safety warnings in public dataset snapshots does not guarantee drug safety.
        </p>
      </div>
    </div>
  );
}
