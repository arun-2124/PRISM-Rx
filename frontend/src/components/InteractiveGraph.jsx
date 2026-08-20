import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Filter, Search, Plus, Eye, EyeOff } from 'lucide-react';
import NodeInspector from './NodeInspector';

export default function InteractiveGraph({ graphData, onExpandNeighborhood }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  // Viewport State
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState(null);

  // Controls & Filters
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);
  const [nodeTypeFilters, setNodeTypeFilters] = useState({
    Drug: true,
    Target: true,
    Disease: true,
    ClinicalTrial: true,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Extract raw graph arrays
  const rawNodes = graphData?.nodes || [];
  const rawEdges = graphData?.edges || [];

  // Filtered Graph
  const nodes = useMemo(() => {
    return rawNodes.filter(n => nodeTypeFilters[n.type] !== false);
  }, [rawNodes, nodeTypeFilters]);

  const activeNodeIds = useMemo(() => new Set(nodes.map(n => n.id)), [nodes]);

  const edges = useMemo(() => {
    return rawEdges.filter(e => activeNodeIds.has(e.source) && activeNodeIds.has(e.target));
  }, [rawEdges, activeNodeIds]);

  // Physics Simulation Node Positions & Velocities
  const physicsRef = useRef({
    positions: {},
    velocities: {},
    isSimulating: true,
  });

  // Seed Initial Layout Positions in 3 Columns
  useEffect(() => {
    if (!nodes.length) return;

    const width = 800;
    const height = 500;

    const drugNodes = nodes.filter(n => n.type === 'Drug');
    const targetNodes = nodes.filter(n => n.type === 'Target');
    const diseaseNodes = nodes.filter(n => n.type === 'Disease');
    const trialNodes = nodes.filter(n => n.type === 'ClinicalTrial');

    const newPos = {};
    const newVel = {};

    // Left Column: Drug
    drugNodes.forEach((n, i) => {
      newPos[n.id] = { x: width * 0.15, y: height / 2 + (i - (drugNodes.length - 1) / 2) * 90 };
      newVel[n.id] = { vx: 0, vy: 0 };
    });

    // Center Column: Targets
    targetNodes.forEach((n, i) => {
      newPos[n.id] = { x: width * 0.48, y: height * 0.2 + (i * 75) };
      newVel[n.id] = { vx: 0, vy: 0 };
    });

    // Right Column: Diseases
    diseaseNodes.forEach((n, i) => {
      newPos[n.id] = { x: width * 0.82, y: height / 2 + (i - (diseaseNodes.length - 1) / 2) * 90 };
      newVel[n.id] = { vx: 0, vy: 0 };
    });

    // Bottom Row: Clinical Trials
    trialNodes.forEach((n, i) => {
      newPos[n.id] = { x: width * 0.3 + (i * 120), y: height * 0.85 };
      newVel[n.id] = { vx: 0, vy: 0 };
    });

    physicsRef.current.positions = newPos;
    physicsRef.current.velocities = newVel;
    physicsRef.current.isSimulating = true;

    if (nodes.length > 0 && !selectedNode) {
      setSelectedNode(nodes[0]);
    }
  }, [graphData, nodes]);

  // Compute 1-Hop Connected Neighbor Sets for Selected/Hovered Node Highlighting
  const connectedInfo = useMemo(() => {
    const activeId = selectedNode?.id || hoveredNode?.id;
    if (!activeId) return { nodes: new Set(), edges: new Set() };

    const connNodes = new Set([activeId]);
    const connEdges = new Set();

    edges.forEach(e => {
      if (e.source === activeId || e.target === activeId) {
        connEdges.add(e.id);
        connNodes.add(e.source);
        connNodes.add(e.target);
      }
    });

    return { nodes: connNodes, edges: connEdges };
  }, [selectedNode, hoveredNode, edges]);

  // Active Biological Path Trace String for Header Banner
  const pathTrace = useMemo(() => {
    if (!graphData?.center_node_id || !graphData?.target_disease_id) return null;
    const centerDrug = nodes.find(n => n.id === graphData.center_node_id);
    const targetDisease = nodes.find(n => n.id === graphData.target_disease_id);
    const targets = nodes.filter(n => n.type === 'Target');

    if (!centerDrug || !targetDisease) return null;
    const targetSymbols = targets.map(t => t.label).join(' / ') || 'Multi-Target';
    return `${centerDrug.label} --[TARGETS]--> ${targetSymbols} --[ASSOCIATED_WITH]--> ${targetDisease.label}`;
  }, [graphData, nodes]);

  // Force Physics Simulation & Canvas Rendering Loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const runFrame = () => {
      const width = canvas.width;
      const height = canvas.height;
      const pos = physicsRef.current.positions;
      const vel = physicsRef.current.velocities;

      // 1. Physics Step (Relaxation Damping)
      if (physicsRef.current.isSimulating && nodes.length > 0) {
        let maxMove = 0;

        // Repulsion between nodes
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const n1 = nodes[i].id;
            const n2 = nodes[j].id;
            const p1 = pos[n1];
            const p2 = pos[n2];
            if (!p1 || !p2) continue;

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const distSq = dx * dx + dy * dy + 0.1;
            const dist = Math.sqrt(distSq);

            if (dist < 180) {
              const force = (180 - dist) / dist * 0.12;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              if (n1 !== draggedNode?.id) {
                p1.x -= fx;
                p1.y -= fy;
              }
              if (n2 !== draggedNode?.id) {
                p2.x += fx;
                p2.y += fy;
              }
            }
          }
        }

        // Spring Attraction along Edges
        edges.forEach(e => {
          const p1 = pos[e.source];
          const p2 = pos[e.target];
          if (!p1 || !p2) return;

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.hypot(dx, dy) + 0.1;
          const targetDist = 140;

          const force = (dist - targetDist) * 0.015;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (e.source !== draggedNode?.id) {
            p1.x += fx;
            p1.y += fy;
          }
          if (e.target !== draggedNode?.id) {
            p2.x -= fx;
            p2.y -= fy;
          }
        });

        // Boundary Clamp
        nodes.forEach(n => {
          const p = pos[n.id];
          if (p && n.id !== draggedNode?.id) {
            p.x = Math.max(50, Math.min(width - 50, p.x));
            p.y = Math.max(50, Math.min(height - 50, p.y));
          }
        });
      }

      // 2. Render Frame
      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Transform Canvas (Pan & Zoom)
      ctx.translate(offset.x, offset.y);
      ctx.scale(zoom, zoom);

      const hasActiveSelection = selectedNode || hoveredNode;

      // Draw Edges
      edges.forEach(e => {
        const src = pos[e.source];
        const dst = pos[e.target];
        if (!src || !dst) return;

        const isConnected = connectedInfo.edges.has(e.id);
        const isSelectedEdge = selectedEdge?.id === e.id;
        const opacity = hasActiveSelection ? (isConnected || isSelectedEdge ? 1.0 : 0.15) : 0.6;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(dst.x, dst.y);
        ctx.strokeStyle = isSelectedEdge ? '#00f2fe' : (e.color || 'rgba(255, 255, 255, 0.4)');
        ctx.lineWidth = isSelectedEdge ? 3 : (isConnected ? 2.5 : 1.5);
        ctx.globalAlpha = opacity;
        ctx.stroke();

        // Draw Directional Arrow
        const angle = Math.atan2(dst.y - src.y, dst.x - src.x);
        const arrowDist = (dst.size || 24) + 12;
        const arrowX = dst.x - Math.cos(angle) * arrowDist;
        const arrowY = dst.y - Math.sin(angle) * arrowDist;

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - 8 * Math.cos(angle - Math.PI / 6), arrowY - 8 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(arrowX - 8 * Math.cos(angle + Math.PI / 6), arrowY - 8 * Math.sin(angle + Math.PI / 6));
        ctx.fillStyle = e.color || '#4facfe';
        ctx.fill();

        // Draw Edge Label ONLY on hover, selection, or when showEdgeLabels toggle is ON and connected
        if (showEdgeLabels && (isConnected || isSelectedEdge || hoveredEdge?.id === e.id)) {
          const midX = (src.x + dst.x) / 2;
          const midY = (src.y + dst.y) / 2;
          ctx.font = '500 10px Inter';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.globalAlpha = 0.95;

          // Text Background Pill
          const textWidth = ctx.measureText(e.label).width;
          ctx.fillStyle = 'rgba(5, 8, 17, 0.85)';
          ctx.fillRect(midX - textWidth / 2 - 4, midY - 10, textWidth + 8, 14);

          ctx.fillStyle = isSelectedEdge ? '#00f2fe' : '#ffffff';
          ctx.fillText(e.label, midX, midY);
        }
      });

      // Draw Nodes
      nodes.forEach(n => {
        const p = pos[n.id];
        if (!p) return;

        const isSelected = selectedNode?.id === n.id;
        const isHovered = hoveredNode?.id === n.id;
        const isConnected = connectedInfo.nodes.has(n.id);
        const r = n.size || 24;

        const opacity = hasActiveSelection ? (isConnected || isSelected || isHovered ? 1.0 : 0.2) : 1.0;
        ctx.globalAlpha = opacity;

        // Glowing Halo for Selected or Hovered Node
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 8, 0, 2 * Math.PI);
          ctx.fillStyle = n.color ? `${n.color}33` : 'rgba(0, 242, 254, 0.25)';
          ctx.fill();
        }

        // Draw Node Shape by Type
        ctx.beginPath();
        if (n.type === 'Disease') {
          // Rounded Rectangle for Disease
          const size = r * 1.8;
          ctx.roundRect(p.x - size / 2, p.y - size / 2, size, size, 8);
        } else if (n.type === 'ClinicalTrial') {
          // Diamond Shape for Clinical Trial
          ctx.moveTo(p.x, p.y - r * 1.3);
          ctx.lineTo(p.x + r * 1.3, p.y);
          ctx.lineTo(p.x, p.y + r * 1.3);
          ctx.lineTo(p.x - r * 1.3, p.y);
          ctx.closePath();
        } else {
          // Circle for Drug and Target
          ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
        }

        ctx.fillStyle = n.color || '#4facfe';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = isSelected ? 3.5 : 1.5;
        ctx.stroke();

        // Node Label Text
        ctx.font = isSelected ? '700 12px Outfit' : '600 11px Outfit';
        ctx.fillStyle = opacity < 0.5 ? 'rgba(255, 255, 255, 0.4)' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, p.x, p.y + r + 16);

        // Node Subtitle (Type)
        ctx.font = '500 9px Inter';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.fillText(n.type, p.x, p.y + r + 28);
      });

      ctx.restore();
      animId = requestAnimationFrame(runFrame);
    };

    animId = requestAnimationFrame(runFrame);
    return () => cancelAnimationFrame(animId);
  }, [nodes, edges, zoom, offset, selectedNode, hoveredNode, selectedEdge, hoveredEdge, connectedInfo, showEdgeLabels, draggedNode]);

  // Click & Mouse Handlers for Pan, Zoom, Drag & Selection
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offset.x) / zoom,
      y: (e.clientY - rect.top - offset.y) / zoom,
    };
  };

  const handleMouseDown = (e) => {
    const coords = getCanvasCoords(e);
    const pos = physicsRef.current.positions;

    // Check if clicked on a node
    let clickedN = null;
    nodes.forEach(n => {
      const p = pos[n.id];
      if (!p) return;
      const dist = Math.hypot(coords.x - p.x, coords.y - p.y);
      if (dist <= (n.size || 24)) {
        clickedN = n;
      }
    });

    if (clickedN) {
      setSelectedNode(clickedN);
      setSelectedEdge(null);
      setDraggedNode(clickedN);
    } else {
      // Check if clicked on an edge
      let clickedE = null;
      edges.forEach(eObj => {
        const p1 = pos[eObj.source];
        const p2 = pos[eObj.target];
        if (!p1 || !p2) return;

        // Distance from point to line segment
        const A = coords.x - p1.x;
        const B = coords.y - p1.y;
        const C = p2.x - p1.x;
        const D = p2.y - p1.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = lenSq !== 0 ? dot / lenSq : -1;

        let xx, yy;
        if (param < 0) { xx = p1.x; yy = p1.y; }
        else if (param > 1) { xx = p2.x; yy = p2.y; }
        else { xx = p1.x + param * C; yy = p1.y + param * D; }

        const dist = Math.hypot(coords.x - xx, coords.y - yy);
        if (dist <= 8) {
          clickedE = eObj;
        }
      });

      if (clickedE) {
        setSelectedEdge(clickedE);
        setSelectedNode(null);
      } else {
        // Start Canvas Pan
        setIsDraggingCanvas(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      }
    }
  };

  const handleMouseMove = (e) => {
    if (draggedNode) {
      const coords = getCanvasCoords(e);
      const pos = physicsRef.current.positions;
      if (pos[draggedNode.id]) {
        pos[draggedNode.id].x = coords.x;
        pos[draggedNode.id].y = coords.y;
      }
      return;
    }

    if (isDraggingCanvas) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // Hover Detection
    const coords = getCanvasCoords(e);
    const pos = physicsRef.current.positions;
    let hN = null;
    nodes.forEach(n => {
      const p = pos[n.id];
      if (p && Math.hypot(coords.x - p.x, coords.y - p.y) <= (n.size || 24)) {
        hN = n;
      }
    });
    setHoveredNode(hN);
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDraggedNode(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(z => Math.min(3.0, Math.max(0.3, z * zoomFactor)));
  };

  // Node Search Filter Action
  const handleSearchNode = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const found = nodes.find(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.id.toLowerCase().includes(searchQuery.toLowerCase()));
    if (found) {
      setSelectedNode(found);
      const p = physicsRef.current.positions[found.id];
      if (p) {
        setOffset({
          x: 400 - p.x * zoom,
          y: 250 - p.y * zoom,
        });
      }
    }
  };

  // Fit Viewport
  const handleFitViewport = () => {
    setZoom(1.0);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="glass-card" style={{ padding: '20px', position: 'relative' }} ref={containerRef}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', fontWeight: 700, margin: 0 }}>
              Interactive 2-Hop Biomedical Knowledge Graph
            </h3>
            <span className="badge" style={{ background: 'rgba(0, 242, 254, 0.15)', color: 'var(--primary-cyan)', border: '1px solid rgba(0,242,254,0.3)' }}>
              {nodes.length} Nodes · {edges.length} Edges
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
            Inspect real database target mechanisms, disease associations, and clinical study pathways.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Node Search */}
          <form onSubmit={handleSearchNode} style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px 8px' }}>
            <Search size={14} color="var(--text-dim)" style={{ marginRight: '4px' }} />
            <input
              type="text"
              placeholder="Search node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.8rem', outline: 'none', width: '110px' }}
            />
          </form>

          {/* Toggle Labels */}
          <button
            className={`btn-secondary ${showEdgeLabels ? 'active' : ''}`}
            style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => setShowEdgeLabels(v => !v)}
            title="Toggle Edge Labels"
          >
            {showEdgeLabels ? <Eye size={14} /> : <EyeOff size={14} />} Labels
          </button>

          {/* Expand Neighborhood */}
          {onExpandNeighborhood && (
            <button
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={onExpandNeighborhood}
            >
              <Plus size={14} /> Expand Neighborhood
            </button>
          )}

          {/* Zoom & Fit */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <button className="btn-secondary" style={{ padding: '6px 8px' }} onClick={() => setZoom(z => Math.min(3, z + 0.2))} title="Zoom In">
              <ZoomIn size={14} />
            </button>
            <button className="btn-secondary" style={{ padding: '6px 8px' }} onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} title="Zoom Out">
              <ZoomOut size={14} />
            </button>
            <button className="btn-secondary" style={{ padding: '6px 8px' }} onClick={handleFitViewport} title="Fit Viewport">
              <Maximize2 size={14} />
            </button>
            <button className="btn-secondary" style={{ padding: '6px 8px' }} onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} title="Reset Layout">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Path Trace Banner */}
      {pathTrace && (
        <div style={{ background: 'rgba(0, 242, 254, 0.08)', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: '6px', padding: '8px 12px', marginBottom: '12px', fontSize: '0.8rem', color: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <strong style={{ color: '#ffffff' }}>Target Path:</strong> {pathTrace}
        </div>
      )}

      {/* Node Type Filter Checkboxes Bar & Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', flexWrap: 'wrap', gap: '10px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-dim)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={12} /> FILTERS:
          </span>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#00f2fe' }}>
            <input
              type="checkbox"
              checked={nodeTypeFilters.Drug}
              onChange={(e) => setNodeTypeFilters(f => ({ ...f, Drug: e.target.checked }))}
            />
            Drugs
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#10b981' }}>
            <input
              type="checkbox"
              checked={nodeTypeFilters.Target}
              onChange={(e) => setNodeTypeFilters(f => ({ ...f, Target: e.target.checked }))}
            />
            Targets
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#9d4edd' }}>
            <input
              type="checkbox"
              checked={nodeTypeFilters.Disease}
              onChange={(e) => setNodeTypeFilters(f => ({ ...f, Disease: e.target.checked }))}
            />
            Diseases
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#f59e0b' }}>
            <input
              type="checkbox"
              checked={nodeTypeFilters.ClinicalTrial}
              onChange={(e) => setNodeTypeFilters(f => ({ ...f, ClinicalTrial: e.target.checked }))}
            />
            Clinical Trials
          </label>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00f2fe' }}></span> DRUG</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span> TARGET</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 8, height: 8, borderRadius: '2px', background: '#9d4edd' }}></span> DISEASE</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 8, height: 8, transform: 'rotate(45deg)', background: '#f59e0b' }}></span> CLINICAL TRIAL</span>
        </div>
      </div>

      {/* Main Graph Grid: Canvas + Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '16px', minHeight: '480px' }}>
        {/* Canvas Render Area */}
        <div style={{ background: '#050811', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            style={{ width: '100%', height: '500px', cursor: isDraggingCanvas ? 'grabbing' : 'grab' }}
          />

          {/* Watermark Notice */}
          <div style={{ position: 'absolute', bottom: '10px', left: '12px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>
            PRISM-Rx Medbase.db Graph Topology · Drag nodes to adjust physics layout
          </div>
        </div>

        {/* Selected Node / Edge Details Inspector Panel */}
        <div style={{ height: '500px' }}>
          <NodeInspector
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            pathTrace={pathTrace}
          />
        </div>
      </div>
    </div>
  );
}
