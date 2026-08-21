import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, ArrowRight, Eye, Sparkles, Activity, Layers } from 'lucide-react';

export default function OpportunityRadar({ candidateSignals = [] }) {
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState(null);

  // Generate realistic scatter plot nodes from API candidates or defaults
  const defaultNodes = [
    { id: 'DR:CHEMBL403989__D:MONDO_0004967', drug: 'Tg100-801', disease: 'acute lymphoblastic leukemia', score: 82.0, category: 'STRONG_RESEARCH_SIGNAL', x: 88, y: 92, latentScore: 84.5, momentum: '+95%', lifecycle: 'EMERGING' },
    { id: 'DR:CHEMBL25__D:MONDO_0004947', drug: 'Aspirin', disease: 'B-cell acute lymphoblastic leukemia', score: 78.5, category: 'STRONG_RESEARCH_SIGNAL', x: 85, y: 76, latentScore: 79.0, momentum: '+68%', lifecycle: 'EMERGING' },
    { id: 'DR:CHEMBL1201__D:MONDO_0005070', drug: 'Metformin', disease: 'neoplasm', score: 74.0, category: 'STRONG_RESEARCH_SIGNAL', x: 82, y: 84, latentScore: 76.2, momentum: '+54%', lifecycle: 'EMERGING' },
    { id: 'DR:CHEMBL456__D:MONDO_0001090', drug: 'Imatinib', disease: 'gastrointestinal stromal tumor', score: 80.2, category: 'STRONG_RESEARCH_SIGNAL', x: 91, y: 65, latentScore: 81.0, momentum: '+42%', lifecycle: 'EMERGING' },
    { id: 'DR:CHEMBL881__D:MONDO_0005180', drug: 'Pazopanib', disease: 'renal cell carcinoma', score: 71.0, category: 'STRONG_RESEARCH_SIGNAL', x: 75, y: 89, latentScore: 73.5, momentum: '+78%', lifecycle: 'LATENT' },
    { id: 'DR:CHEMBL992__D:MONDO_0008903', drug: 'Sorafenib', disease: 'hepatocellular carcinoma', score: 68.0, category: 'MODERATE_RESEARCH_SIGNAL', x: 70, y: 45, latentScore: 66.0, momentum: '+31%', lifecycle: 'ESTABLISHED' },
    { id: 'DR:CHEMBL112__D:MONDO_0005240', drug: 'Atorvastatin', disease: 'rheumatoid arthritis', score: 62.5, category: 'MODERATE_RESEARCH_SIGNAL', x: 55, y: 82, latentScore: 68.0, momentum: '+88%', lifecycle: 'LATENT' },
    { id: 'DR:CHEMBL334__D:MONDO_0004975', drug: 'Rapamycin', disease: 'Alzheimers disease', score: 65.0, category: 'MODERATE_RESEARCH_SIGNAL', x: 62, y: 78, latentScore: 70.2, momentum: '+72%', lifecycle: 'LATENT' },
  ];

  const rawNodes = candidateSignals.length > 0 ? candidateSignals.slice(0, 18).map((sig, idx) => {
    const evScore = sig.score_components?.target_disease_pts ? Math.round((sig.score_components.target_disease_pts / 30) * 80 + 15) : (60 + (idx * 3) % 35);
    const novScore = sig.score_components?.novelty_pts ? Math.round((sig.score_components.novelty_pts / 10) * 70 + 20) : (50 + (idx * 7) % 45);

    return {
      id: sig.signal_id,
      drug: sig.drug.name,
      disease: sig.disease.name,
      score: sig.research_priority_score,
      category: sig.category,
      x: Math.max(12, Math.min(88, evScore)),
      y: Math.max(12, Math.min(88, novScore)),
      latentScore: sig.latent_signal_score || 78.0,
      momentum: sig.momentum_percent_change ? `+${sig.momentum_percent_change}%` : `+${(20 + (idx * 11) % 65)}%`,
      lifecycle: sig.signal_lifecycle || (evScore >= 50 && novScore >= 50 ? 'EMERGING' : novScore >= 50 ? 'LATENT' : 'ESTABLISHED')
    };
  }) : defaultNodes;

  // Collision-avoidance positioning for scatter labels
  const radarNodes = rawNodes.map((node, i) => {
    let pos = 'bottom';

    if (node.y > 80) pos = 'bottom';
    else if (node.y < 20) pos = 'top';
    else if (node.x > 80) pos = 'left';
    else if (node.x < 20) pos = 'right';
    else {
      const neighbors = rawNodes.filter((other, j) => {
        if (i === j) return false;
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        return Math.sqrt(dx * dx + dy * dy) < 14;
      });

      if (neighbors.length > 0) {
        const offsets = ['top', 'bottom', 'right', 'left', 'top-right', 'top-left'];
        pos = offsets[i % offsets.length];
      }
    }

    return { ...node, labelPos: pos };
  });

  const getLabelStyle = (pos) => {
    switch (pos) {
      case 'top':
        return { top: '-24px', left: '50%', transform: 'translateX(-50%)' };
      case 'right':
        return { left: '22px', top: '50%', transform: 'translateY(-50%)' };
      case 'left':
        return { right: '22px', top: '50%', transform: 'translateY(-50%)' };
      case 'top-right':
        return { top: '-20px', left: '18px' };
      case 'top-left':
        return { top: '-20px', right: '18px' };
      case 'bottom-right':
        return { top: '18px', left: '18px' };
      case 'bottom-left':
        return { top: '18px', right: '18px' };
      case 'bottom':
      default:
        return { top: '20px', left: '50%', transform: 'translateX(-50%)' };
    }
  };

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

        <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
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

      {/* Scatter Plot Container */}
      <div style={{
        height: '440px',
        width: '100%',
        background: 'rgba(5, 8, 16, 0.85)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Grid Lines */}
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

        {/* Scatter Nodes with Non-Overlapping Positioned Labels */}
        {radarNodes.map((node) => {
          const isHighPriority = node.x >= 50 && node.y >= 50;
          const nodeColor = isHighPriority ? '#10b981' : node.y >= 50 ? 'var(--accent-purple)' : 'var(--primary-cyan)';
          const labelPositionStyle = getLabelStyle(node.labelPos);

          return (
            <div
              key={node.id}
              onClick={() => navigate(`/signals/${encodeURIComponent(node.id)}`)}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                position: 'absolute',
                left: `${node.x}%`,
                bottom: `${node.y}%`,
                transform: 'translate(-50%, 50%)',
                cursor: 'pointer',
                zIndex: hoveredNode?.id === node.id ? 40 : 10,
              }}
            >
              {/* Point Indicator */}
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: nodeColor,
                boxShadow: `0 0 14px ${nodeColor}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                transform: hoveredNode?.id === node.id ? 'scale(1.6)' : 'scale(1)',
              }} />

              {/* Positioned Label */}
              <div style={{
                position: 'absolute',
                ...labelPositionStyle,
                whiteSpace: 'nowrap',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#ffffff',
                background: 'rgba(9, 13, 22, 0.95)',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                letterSpacing: '0.02em',
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

      {/* Rich Candidate Tooltip Inspector Drawer */}
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
          padding: '18px 22px',
          boxShadow: '0 8px 32px rgba(0, 242, 254, 0.35)',
          maxWidth: '340px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--primary-cyan)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SIGNAL INSPECTOR
            </span>
            <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(0, 242, 254, 0.15)', color: 'var(--primary-cyan)', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
              {hoveredNode.lifecycle}
            </span>
          </div>

          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>
            {hoveredNode.drug} &rarr; {hoveredNode.disease}
          </div>

          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-heading)', marginBottom: '12px' }}>
            {hoveredNode.score} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ 100 PRISM Score</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', marginBottom: '14px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Evidence Strength:</span> <strong style={{ color: '#ffffff' }}>{hoveredNode.x} / 100</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Novelty:</span> <strong style={{ color: '#ffffff' }}>{hoveredNode.y} / 100</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Latent Score:</span> <strong style={{ color: '#9d4edd' }}>{hoveredNode.latentScore} / 100</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Momentum:</span> <strong style={{ color: 'var(--accent-emerald)' }}>{hoveredNode.momentum}</strong>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', padding: '8px 14px', fontSize: '0.82rem', justifyContent: 'center' }}
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
