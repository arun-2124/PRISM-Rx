import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';

export default function InteractiveGraph({ graphData }) {
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  // Layout Node Positions automatically on load
  const [nodePositions, setNodePositions] = useState({});

  useEffect(() => {
    if (!nodes.length) return;

    const width = 800;
    const height = 400;

    const drugNodes = nodes.filter(n => n.type === 'Drug');
    const targetNodes = nodes.filter(n => n.type === 'Target');
    const diseaseNodes = nodes.filter(n => n.type === 'Disease');
    const trialNodes = nodes.filter(n => n.type === 'ClinicalTrial');

    const pos = {};

    // Left Column: Drug
    drugNodes.forEach((n, i) => {
      pos[n.id] = { x: width * 0.15, y: height / 2 + (i - (drugNodes.length - 1) / 2) * 80 };
    });

    // Middle Column: Targets
    targetNodes.forEach((n, i) => {
      pos[n.id] = { x: width * 0.45, y: height * 0.25 + (i * 90) };
    });

    // Right Column: Disease
    diseaseNodes.forEach((n, i) => {
      pos[n.id] = { x: width * 0.85, y: height / 2 + (i - (diseaseNodes.length - 1) / 2) * 80 };
    });

    // Bottom Row: Clinical Trials
    trialNodes.forEach((n, i) => {
      pos[n.id] = { x: width * 0.35 + (i * 120), y: height * 0.85 };
    });

    setNodePositions(pos);
    if (nodes.length > 0) {
      setSelectedNode(nodes[0]);
    }
  }, [graphData]);

  // Draw Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.save();

    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Draw Edges
    edges.forEach(e => {
      const src = nodePositions[e.source];
      const dst = nodePositions[e.target];
      if (!src || !dst) return;

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(dst.x, dst.y);
      ctx.strokeStyle = e.color || 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Edge Label
      const midX = (src.x + dst.x) / 2;
      const midY = (src.y + dst.y) / 2;
      ctx.font = '10px Inter';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(e.label, midX - 30, midY - 6);
    });

    // Draw Nodes
    nodes.forEach(n => {
      const p = nodePositions[n.id];
      if (!p) return;

      const isSelected = selectedNode?.id === n.id;
      const r = n.size || 24;

      // Glow halo for selected node
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 6, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 242, 254, 0.3)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = n.color || '#4facfe';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.stroke();

      // Label
      ctx.font = 'bold 12px Outfit';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, p.x, p.y + r + 16);

      ctx.font = '10px Inter';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText(n.type, p.x, p.y + r + 28);
    });

    ctx.restore();
  }, [nodePositions, zoom, offset, selectedNode]);

  // Click & Node Selection
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - offset.x) / zoom;
    const clickY = (e.clientY - rect.top - offset.y) / zoom;

    let clicked = null;
    nodes.forEach(n => {
      const p = nodePositions[n.id];
      if (!p) return;
      const dist = Math.hypot(clickX - p.x, clickY - p.y);
      if (dist <= (n.size || 24)) {
        clicked = n;
      }
    });

    if (clicked) {
      setSelectedNode(clicked);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>Interactive 2-Hop Knowledge Neighborhood</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click nodes to inspect biological attributes and metadata lineage.</p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => setZoom(z => Math.min(2, z + 0.2))}>
            <ZoomIn size={14} />
          </button>
          <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>
            <ZoomOut size={14} />
          </button>
          <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '16px' }}>
        {/* Canvas Render Area */}
        <div style={{ background: '#050811', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            onClick={handleCanvasClick}
            style={{ width: '100%', height: '400px', cursor: 'pointer' }}
          />
        </div>

        {/* Selected Node Details Drawer */}
        <div className="glass-panel" style={{ padding: '16px', fontSize: '0.85rem' }}>
          <h4 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Info size={16} color="var(--primary-cyan)" />
            Node Inspector
          </h4>

          {selectedNode ? (
            <div>
              <div style={{ marginBottom: '8px' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.08)' }}>{selectedNode.type}</span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-cyan)', marginBottom: '8px' }}>
                {selectedNode.label}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '12px' }}>
                ID: <code>{selectedNode.id}</code>
              </div>

              {selectedNode.details && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                  {Object.entries(selectedNode.details).map(([k, v]) => (
                    <div key={k} style={{ fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-dim)' }}>{k}: </span>
                      <span style={{ color: 'var(--text-main)' }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Click any node on the graph to view attributes.</div>
          )}
        </div>
      </div>
    </div>
  );
}
