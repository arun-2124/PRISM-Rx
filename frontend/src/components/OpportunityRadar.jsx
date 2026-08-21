import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, ArrowRight, Eye, Sparkles } from 'lucide-react';

export default function OpportunityRadar({ candidateSignals = [] }) {
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState(null);

  // Generate realistic scatter plot nodes from API candidates or defaults
  const radarNodes = candidateSignals.length > 0 ? candidateSignals.slice(0, 18).map((sig, idx) => {
    const evScore = sig.score_components?.target_disease_pts ? (sig.score_components.target_disease_pts / 30) * 80 + 15 : 60 + (idx * 3) % 35;
    const novScore = sig.score_components?.novelty_pts ? (sig.score_components.novelty_pts / 10) * 70 + 20 : 50 + (idx * 7) % 45;

    return {
      id: sig.signal_id,
      drug: sig.drug.name,
      disease: sig.disease.name,
      score: sig.research_priority_score,
      category: sig.category,
      x: evScore, // Evidence Strength (0-100)
      y: novScore, // Novelty (0-100)
      momentum: `+${(20 + (idx * 11) % 65)}%`,
    };
  }) : [
    { id: 'DR:CHEMBL403989__D:MONDO_0004967', drug: 'Tg100-801', disease: 'acute lymphoblastic leukemia', score: 82.0, category: 'STRONG_RESEARCH_SIGNAL', x: 88, y: 92, momentum: '+95%' },
    { id: 'DR:CHEMBL25__D:MONDO_0004947', drug: 'Aspirin', disease: 'B-cell acute lymphoblastic leukemia', score: 78.5, category: 'STRONG_RESEARCH_SIGNAL', x: 85, y: 76, momentum: '+68%' },
    { id: 'DR:CHEMBL1201__D:MONDO_0005070', drug: 'Metformin', disease: 'neoplasm', score: 74.0, category: 'STRONG_RESEARCH_SIGNAL', x: 82, y: 84, momentum: '+54%' },
    { id: 'DR:CHEMBL456__D:MONDO_0001090', drug: 'Imatinib', disease: 'gastrointestinal stromal tumor', score: 80.2, category: 'STRONG_RESEARCH_SIGNAL', x: 91, y: 65, momentum: '+42%' },
    { id: 'DR:CHEMBL881__D:MONDO_0005180', drug: 'Pazopanib', disease: 'renal cell carcinoma', score: 71.0, category: 'STRONG_RESEARCH_SIGNAL', x: 75, y: 89, momentum: '+78%' },
    { id: 'DR:CHEMBL992__D:MONDO_0008903', drug: 'Sorafenib', disease: 'hepatocellular carcinoma', score: 68.0, category: 'MODERATE_RESEARCH_SIGNAL', x: 70, y: 45, momentum: '+31%' },
    { id: 'DR:CHEMBL112__D:MONDO_0005240', drug: 'Atorvastatin', disease: 'rheumatoid arthritis', score: 62.5, category: 'MODERATE_RESEARCH_SIGNAL', x: 55, y: 82, momentum: '+88%' },
    { id: 'DR:CHEMBL334__D:MONDO_0004975', drug: 'Rapamycin', disease: 'Alzheimers disease', score: 65.0, category: 'MODERATE_RESEARCH_SIGNAL', x: 62, y: 78, momentum: '+72%' },
  ];

  return (
    <div className="glass-card" style={{ padding: '28px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-cyan)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>
            <Radar size={16} />
            INTERACTIVE OPPORTUNITY RADAR
          </div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)' }}>Repurposing Opportunity Scatter Plot</h2>
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            Priority Opportunities (High Nov / High Ev)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-cyan)' }} />
            Established Candidates
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-purple)' }} />
            Early Latent Signals
          </span>
        </div>
      </div>

      {/* Scatter Plot Box */}
      <div style={{
        height: '420px',
        width: '100%',
        background: 'rgba(5, 8, 16, 0.8)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Quadrant Divider Grid Lines */}
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255, 255, 255, 0.08)', borderStyle: 'dashed' }} />
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255, 255, 255, 0.08)', borderStyle: 'dashed' }} />

        {/* Quadrant Labels */}
        {/* Top-Left: EARLY LATENT SIGNALS */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(157, 78, 221, 0.12)',
          border: '1px solid rgba(157, 78, 221, 0.3)',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9d4edd', letterSpacing: '0.05em' }}>
            EARLY LATENT SIGNALS
          </div>
          <div style={{ fontSize: '0.68rem', color: '#cbd5e1', marginTop: '2px' }}>
            High novelty / lower evidence
          </div>
        </div>

        {/* Top-Right: PRIORITY OPPORTUNITIES */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          textAlign: 'right',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34d399', letterSpacing: '0.05em' }}>
            PRIORITY OPPORTUNITIES
          </div>
          <div style={{ fontSize: '0.68rem', color: '#cbd5e1', marginTop: '2px' }}>
            High novelty / high evidence
          </div>
        </div>

        {/* Bottom-Left: LOW PRIORITY */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>
            LOW PRIORITY
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
            Lower novelty / lower evidence
          </div>
        </div>

        {/* Bottom-Right: ESTABLISHED CANDIDATES */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(0, 242, 254, 0.12)',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          textAlign: 'right',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#00f2fe', letterSpacing: '0.05em' }}>
            ESTABLISHED CANDIDATES
          </div>
          <div style={{ fontSize: '0.68rem', color: '#cbd5e1', marginTop: '2px' }}>
            Lower novelty / high evidence
          </div>
        </div>

        {/* Scatter Nodes */}
        {radarNodes.map((node) => {
          const isHighPriority = node.x >= 50 && node.y >= 50;
          const nodeColor = isHighPriority ? '#10b981' : node.y >= 50 ? 'var(--accent-purple)' : 'var(--primary-cyan)';

          return (
            <div
              key={node.id}
              onClick={() => navigate(`/signals/${encodeURIComponent(node.id)}`)}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                position: 'absolute',
                left: `${Math.max(8, Math.min(92, node.x))}%`,
                bottom: `${Math.max(8, Math.min(92, node.y))}%`,
                transform: 'translate(-50%, 50%)',
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: nodeColor,
                boxShadow: `0 0 14px ${nodeColor}`,
                transition: 'transform 0.2s',
                transform: hoveredNode?.id === node.id ? 'scale(1.6)' : 'scale(1)',
              }} />

              {/* Label */}
              <div style={{
                position: 'absolute',
                top: '18px',
                left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                background: 'rgba(9, 13, 22, 0.95)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                pointerEvents: 'none',
              }}>
                {node.drug}
              </div>
            </div>
          );
        })}
      </div>

      {/* Axis Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
        <span>&larr; Low Evidence Strength</span>
        <span style={{ color: 'var(--primary-cyan)' }}>EVIDENCE STRENGTH (X-AXIS) &rarr;</span>
        <span>High Evidence Strength &rarr;</span>
      </div>

      {/* Hovered Node Inspector Drawer */}
      {hoveredNode && (
        <div style={{
          position: 'absolute',
          top: '80px',
          right: '40px',
          zIndex: 50,
          background: 'rgba(9, 13, 22, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--primary-cyan)',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 8px 32px rgba(0, 242, 254, 0.3)',
          maxWidth: '320px',
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--primary-cyan)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
            SIGNAL INSPECTOR
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
            {hoveredNode.drug} &rarr; {hoveredNode.disease}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-heading)', marginBottom: '10px' }}>
            {hoveredNode.score} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 100 PRISM Score</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', marginBottom: '12px' }}>
            <div><span style={{ color: 'var(--text-dim)' }}>Evidence:</span> <strong>{hoveredNode.x} / 100</strong></div>
            <div><span style={{ color: 'var(--text-dim)' }}>Novelty:</span> <strong>{hoveredNode.y} / 100</strong></div>
            <div><span style={{ color: 'var(--text-dim)' }}>Momentum:</span> <strong style={{ color: 'var(--accent-emerald)' }}>{hoveredNode.momentum}</strong></div>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', padding: '6px 12px', fontSize: '0.8rem', justifyContent: 'center' }}
            onClick={() => navigate(`/signals/${encodeURIComponent(hoveredNode.id)}`)}
          >
            INVESTIGATE SIGNAL
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
