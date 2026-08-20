import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Filter, Search, Plus, Eye, EyeOff, Target, Compass, Sparkles } from 'lucide-react';
import NodeInspector from './NodeInspector';

export default function InteractiveGraph({ graphData, onExpandNeighborhood }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  // Viewport & Mode State
  const [zoom, setZoom] = useState(1.0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState(null);

  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [pathMode, setPathMode] = useState(false);
  const [nodeTypeFilters, setNodeTypeFilters] = useState({
    Drug: true,
    Target: true,
    Disease: true,
    ClinicalTrial: true,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Raw Graph Inputs
  const rawNodes = graphData?.nodes || [];
  const rawEdges = graphData?.edges || [];

  // Compute 1-Hop Connected Neighbor Sets
  const connectedInfo = useMemo(() => {
    const activeId = selectedNode?.id || hoveredNode?.id;
    if (!activeId) return { nodes: new Set(), edges: new Set() };

    const connNodes = new Set([activeId]);
    const connEdges = new Set();

    rawEdges.forEach(e => {
      if (e.source === activeId || e.target === activeId) {
        connEdges.add(e.id);
        connNodes.add(e.source);
        connNodes.add(e.target);
      }
    });

    return { nodes: connNodes, edges: connEdges };
  }, [selectedNode, hoveredNode, rawEdges]);

  // Filtered Nodes & Edges (Supporting PATH MODE & Type Checkboxes)
  const nodes = useMemo(() => {
    return rawNodes.filter(n => {
      if (nodeTypeFilters[n.type] === false) return false;
      if (pathMode && selectedNode) {
        return connectedInfo.nodes.has(n.id);
      }
      return true;
    });
  }, [rawNodes, nodeTypeFilters, pathMode, selectedNode, connectedInfo]);

  const activeNodeIds = useMemo(() => new Set(nodes.map(n => n.id)), [nodes]);

  const edges = useMemo(() => {
    return rawEdges.filter(e => {
      if (!activeNodeIds.has(e.source) || !activeNodeIds.has(e.target)) return false;
      if (pathMode && selectedNode) {
        return connectedInfo.edges.has(e.id);
      }
      return true;
    });
  }, [rawEdges, activeNodeIds, pathMode, selectedNode, connectedInfo]);

  // Physics Simulation Reference
  const physicsRef = useRef({
    positions: {},
    velocities: {},
    isSimulating: true,
  });

  // Seed Structured Layered Layout Positions (Targets at Top, Drug in Center, Disease at Bottom)
  useEffect(() => {
    if (!rawNodes.length) return;

    const width = 800;
    const height = 500;

    const drugNodes = rawNodes.filter(n => n.type === 'Drug');
    const targetNodes = rawNodes.filter(n => n.type === 'Target');
    const diseaseNodes = rawNodes.filter(n => n.type === 'Disease');
    const trialNodes = rawNodes.filter(n => n.type === 'ClinicalTrial');

    const newPos = {};
    const newVel = {};

    // 1. Top Layer: Targets (Horizontally spaced at y = 100)
    const targetSpacing = Math.min(120, (width - 120) / Math.max(1, targetNodes.length));
    const targetStartX = (width - (targetNodes.length - 1) * targetSpacing) / 2;

    targetNodes.forEach((n, i) => {
      newPos[n.id] = { x: targetStartX + i * targetSpacing, y: 100 };
      newVel[n.id] = { vx: 0, vy: 0 };
    });

    // 2. Middle Layer: Drug (Centered at y = 250)
    drugNodes.forEach((n, i) => {
      newPos[n.id] = { x: width / 2 + (i - (drugNodes.length - 1) / 2) * 140, y: 250 };
      newVel[n.id] = { vx: 0, vy: 0 };
    });

    // 3. Bottom Layer: Disease (Centered at y = 400)
    diseaseNodes.forEach((n, i) => {
      newPos[n.id] = { x: width / 2 + (i - (diseaseNodes.length - 1) / 2) * 160, y: 400 };
      newVel[n.id] = { vx: 0, vy: 0 };
    });

    // 4. Side / Orbit Layer: Clinical Trials (y = 440)
    const trialSpacing = Math.min(100, (width - 100) / Math.max(1, trialNodes.length));
    const trialStartX = (width - (trialNodes.length - 1) * trialSpacing) / 2;

    trialNodes.forEach((n, i) => {
      newPos[n.id] = { x: trialStartX + i * trialSpacing, y: 445 };
      newVel[n.id] = { vx: 0, vy: 0 };
    });

    physicsRef.current.positions = newPos;
    physicsRef.current.velocities = newVel;
    physicsRef.current.isSimulating = true;

    if (rawNodes.length > 0 && !selectedNode) {
      setSelectedNode(rawNodes[0]);
    }
  }, [graphData, rawNodes]);

  // Selected Biological Path Trace
  const currentInvestigationPath = useMemo(() => {
    const centerDrug = rawNodes.find(n => n.type === 'Drug');
    const targetDisease = rawNodes.find(n => n.type === 'Disease');

    if (!centerDrug || !targetDisease) return null;

    if (selectedNode && selectedNode.type === 'Target') {
      return `${centerDrug.label} ──[TARGETS]──> ${selectedNode.label} ──[ASSOCIATED_WITH]──> ${targetDisease.label}`;
    }

    const targetSymbols = rawNodes.filter(n => n.type === 'Target').map(t => t.label).join(' / ') || 'Multi-Target';
    return `${centerDrug.label} ──[TARGETS]──> ${targetSymbols} ──[ASSOCIATED_WITH]──> ${targetDisease.label}`;
  }, [rawNodes, selectedNode]);

  // Connected Nodes List for Inspector Tab
  const connectedNodesList = useMemo(() => {
    if (!selectedNode) return [];
    const connIds = new Set();
    rawEdges.forEach(e => {
      if (e.source === selectedNode.id) connIds.add(e.target);
      if (e.target === selectedNode.id) connIds.add(e.source);
    });
    return rawNodes.filter(n => connIds.has(n.id));
  }, [selectedNode, rawNodes, rawEdges]);

  // Physics Simulation & Render Loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const runFrame = () => {
      const width = canvas.width;
      const height = canvas.height;
      const pos = physicsRef.current.positions;

      // 1. Collision Prevention & Minimum Separation Physics
      if (physicsRef.current.isSimulating && nodes.length > 0) {
        const minSep = 80; // Enforce minimum 80px visual separation between nodes

        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const n1 = nodes[i].id;
            const n2 = nodes[j].id;
            const p1 = pos[n1];
            const p2 = pos[n2];
            if (!p1 || !p2) continue;

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.hypot(dx, dy) + 0.1;

            if (dist < minSep) {
              const force = (minSep - dist) / dist * 0.15;
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

        // Boundary Clamp
        nodes.forEach(n => {
          const p = pos[n.id];
          if (p && n.id !== draggedNode?.id) {
            p.x = Math.max(60, Math.min(width - 60, p.x));
            p.y = Math.max(50, Math.min(height - 50, p.y));
          }
        });
      }

      // 2. Render Frame
      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Transform Canvas
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
        const opacity = hasActiveSelection ? (isConnected || isSelectedEdge ? 1.0 : 0.12) : 0.65;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(dst.x, dst.y);
        ctx.strokeStyle = isSelectedEdge ? '#00f2fe' : (e.color || 'rgba(255, 255, 255, 0.35)');
        ctx.lineWidth = isSelectedEdge ? 3.5 : (isConnected ? 2.5 : 1.5);
        ctx.globalAlpha = opacity;
        ctx.stroke();

        // Directional Arrow Indicator
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

        // Edge Text Label (ONLY when hovered, selected, or showEdgeLabels toggle is explicitly ON)
        if ((showEdgeLabels || isSelectedEdge || hoveredEdge?.id === e.id) && (isConnected || isSelectedEdge)) {
          const midX = (src.x + dst.x) / 2;
          const midY = (src.y + dst.y) / 2;
          ctx.font = '600 10px Inter';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.globalAlpha = 0.95;

          const textWidth = ctx.measureText(e.label).width;
          ctx.fillStyle = 'rgba(5, 8, 17, 0.9)';
          ctx.fillRect(midX - textWidth / 2 - 5, midY - 10, textWidth + 10, 15);

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
        const r = n.type === 'Drug' ? 36 : n.type === 'Disease' ? 34 : n.type === 'Target' ? 26 : 22;

        const opacity = hasActiveSelection ? (isConnected || isSelected || isHovered ? 1.0 : 0.15) : 1.0;
        ctx.globalAlpha = opacity;

        // Glowing Aura Halo
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 9, 0, 2 * Math.PI);
          ctx.fillStyle = n.color ? `${n.color}44` : 'rgba(0, 242, 254, 0.3)';
          ctx.fill();
        }

        // Draw Node Shape
        ctx.beginPath();
        if (n.type === 'Disease') {
          const size = r * 1.8;
          ctx.roundRect(p.x - size / 2, p.y - size / 2, size, size, 8);
        } else if (n.type === 'ClinicalTrial') {
          ctx.moveTo(p.x, p.y - r * 1.3);
          ctx.lineTo(p.x + r * 1.3, p.y);
          ctx.lineTo(p.x, p.y + r * 1.3);
          ctx.lineTo(p.x - r * 1.3, p.y);
          ctx.closePath();
        } else {
          ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
        }

        ctx.fillStyle = n.color || '#4facfe';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = isSelected ? 3.5 : 1.5;
        ctx.stroke();

        // Node Label Text (Truncated long names)
        const showLabel = !hasActiveSelection || isSelected || isConnected || isHovered;
        if (showLabel) {
          let labelText = n.label;
          if (labelText.length > 18) {
            labelText = labelText.substring(0, 16) + '...';
          }

          ctx.font = isSelected ? '700 12px Outfit' : '600 11px Outfit';
          ctx.fillStyle = opacity < 0.3 ? 'rgba(255, 255, 255, 0.2)' : '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(labelText, p.x, p.y + r + 16);

          ctx.font = '500 9px Inter';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.fillText(n.type, p.x, p.y + r + 28);
        }
      });

      ctx.restore();
      animId = requestAnimationFrame(runFrame);
    };

    animId = requestAnimationFrame(runFrame);
    return () => cancelAnimationFrame(animId);
  }, [nodes, edges, zoom, offset, selectedNode, hoveredNode, selectedEdge, hoveredEdge, connectedInfo, showEdgeLabels, draggedNode]);

  // Click & Mouse Handlers
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

    let clickedN = null;
    nodes.forEach(n => {
      const p = pos[n.id];
      if (!p) return;
      const r = n.type === 'Drug' ? 36 : n.type === 'Disease' ? 34 : n.type === 'Target' ? 26 : 22;
      if (Math.hypot(coords.x - p.x, coords.y - p.y) <= r) {
        clickedN = n;
      }
    });

    if (clickedN) {
      setSelectedNode(clickedN);
      setSelectedEdge(null);
      setDraggedNode(clickedN);
    } else {
      let clickedE = null;
      edges.forEach(eObj => {
        const p1 = pos[eObj.source];
        const p2 = pos[eObj.target];
        if (!p1 || !p2) return;

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

        if (Math.hypot(coords.x - xx, coords.y - yy) <= 8) {
          clickedE = eObj;
        }
      });

      if (clickedE) {
        setSelectedEdge(clickedE);
        setSelectedNode(null);
      } else {
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

    const coords = getCanvasCoords(e);
    const pos = physicsRef.current.positions;
    let hN = null;
    nodes.forEach(n => {
      const p = pos[n.id];
      const r = n.type === 'Drug' ? 36 : n.type === 'Disease' ? 34 : n.type === 'Target' ? 26 : 22;
      if (p && Math.hypot(coords.x - p.x, coords.y - p.y) <= r) {
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

  // Focus Viewport on Selected Node
  const handleFocusSelectedNode = () => {
    if (!selectedNode) return;
    const p = physicsRef.current.positions[selectedNode.id];
    if (p) {
      setZoom(1.2);
      setOffset({
        x: 400 - p.x * 1.2,
        y: 250 - p.y * 1.2,
      });
    }
  };

  // Search Action
  const handleSearchNode = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const found = rawNodes.find(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.id.toLowerCase().includes(searchQuery.toLowerCase()));
    if (found) {
      setSelectedNode(found);
      const p = physicsRef.current.positions[found.id];
      if (p) {
        setZoom(1.2);
        setOffset({
          x: 400 - p.x * 1.2,
          y: 250 - p.y * 1.2,
        });
      }
    }
  };

  const handleSelectNodeById = (nodeId) => {
    const targetN = rawNodes.find(n => n.id === nodeId);
    if (targetN) {
      setSelectedNode(targetN);
      const p = physicsRef.current.positions[targetN.id];
      if (p) {
        setOffset({
          x: 400 - p.x * zoom,
          y: 250 - p.y * zoom,
        });
      }
    }
  };

  return (
    <div className="glass-card" style={{ padding: '20px', position: 'relative' }} ref={containerRef}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', fontWeight: 700, margin: 0 }}>
              Biomedical Knowledge Graph
            </h3>
            <span className="badge" style={{ background: 'rgba(0, 242, 254, 0.15)', color: 'var(--primary-cyan)', border: '1px solid rgba(0,242,254,0.3)' }}>
              {nodes.length} Nodes · {edges.length} Edges
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
            Structured 2-hop investigation view backed by verified medbase.db relationships.
          </p>
        </div>

        {/* Header Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Search Node */}
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

          {/* Path Mode Toggle */}
          <button
            className={`btn-secondary ${pathMode ? 'active' : ''}`}
            style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => setPathMode(v => !v)}
            title="Toggle Path Mode to isolate selected path"
          >
            <Compass size={14} /> PATH MODE: {pathMode ? 'ON' : 'OFF'}
          </button>

          {/* Focus Button */}
          <button
            className="btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={handleFocusSelectedNode}
            disabled={!selectedNode}
            title="Center view on selected node"
          >
            <Target size={14} /> FOCUS
          </button>

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

          {/* Zoom & Reset Controls */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <button className="btn-secondary" style={{ padding: '6px 8px' }} onClick={() => setZoom(z => Math.min(3, z + 0.2))} title="Zoom In">
              <ZoomIn size={14} />
            </button>
            <button className="btn-secondary" style={{ padding: '6px 8px' }} onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} title="Zoom Out">
              <ZoomOut size={14} />
            </button>
            <button className="btn-secondary" style={{ padding: '6px 8px' }} onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} title="Reset Layout">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* CURRENT INVESTIGATION Banner Card */}
      {currentInvestigationPath && (
        <div style={{ background: 'rgba(0, 242, 254, 0.06)', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '0.82rem' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={12} color="var(--primary-cyan)" /> CURRENT INVESTIGATION PATHWAY
          </div>
          <div style={{ color: 'var(--primary-cyan)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            {currentInvestigationPath}
          </div>
        </div>
      )}

      {/* Node Type Filter Checkboxes Bar */}
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

      {/* Main Grid: Canvas + Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 310px', gap: '16px', minHeight: '500px' }}>
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

          <div style={{ position: 'absolute', bottom: '10px', left: '12px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>
            PRISM-Rx Medbase.db Graph · Layered Physics Layout · Click node or edge to inspect
          </div>
        </div>

        {/* Selected Node / Edge Details Inspector Panel */}
        <div style={{ height: '500px' }}>
          <NodeInspector
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            pathTrace={currentInvestigationPath}
            connectedNodesList={connectedNodesList}
            onSelectNodeById={handleSelectNodeById}
          />
        </div>
      </div>
    </div>
  );
}
