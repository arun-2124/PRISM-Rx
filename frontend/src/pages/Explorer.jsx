import React, { useState, useEffect } from 'react';
import { Filter, Search, Sliders, Download, RefreshCw, Bookmark } from 'lucide-react';
import { fetchSignals, getExportUrl } from '../api';
import { getSavedSignalIds, isSignalSaved } from '../utils/savedSignals';
import SignalCard from '../components/SignalCard';

export default function Explorer() {
  const [signals, setSignals] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'all' vs 'saved'
  const [activeTab, setActiveTab] = useState('all');
  const [savedIds, setSavedIds] = useState(getSavedSignalIds());

  // Filters
  const [drug, setDrug] = useState('');
  const [disease, setDisease] = useState('');
  const [target, setTarget] = useState('');
  const [minScore, setMinScore] = useState(30);
  const [category, setCategory] = useState('');
  const [clinicalOnly, setClinicalOnly] = useState(false);
  const [sortBy, setSortBy] = useState('score');
  const [limit] = useState(12);
  const [offset, setOffset] = useState(0);

  const loadSignals = () => {
    setLoading(true);
    fetchSignals({
      drug,
      disease,
      target,
      min_score: activeTab === 'saved' ? 0 : minScore,
      category,
      clinical_only: clinicalOnly,
      sort_by: sortBy,
      limit: activeTab === 'saved' ? 200 : limit + offset,
      offset: activeTab === 'saved' ? 0 : offset,
    })
      .then(data => {
        setSignals(data.signals || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load signals:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    const handleSavedChange = () => {
      setSavedIds(getSavedSignalIds());
    };
    window.addEventListener('prism_saved_signals_changed', handleSavedChange);
    return () => window.removeEventListener('prism_saved_signals_changed', handleSavedChange);
  }, []);

  useEffect(() => {
    loadSignals();
  }, [minScore, category, clinicalOnly, sortBy, offset, activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setOffset(0);
    loadSignals();
  };

  // Filter signals if saved tab active
  const displayedSignals = activeTab === 'saved'
    ? signals.filter(s => savedIds.includes(s.signal_id))
    : signals.slice(offset, offset + limit);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Signal Explorer</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Filter and prioritize candidate drug repurposing hypotheses across 819K candidate pairs.
          </p>
        </div>

        {/* Export Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <a
            href={getExportUrl('csv', minScore)}
            download
            className="btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <Download size={14} />
            Export CSV
          </a>
          <a
            href={getExportUrl('json', minScore)}
            download
            className="btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <Download size={14} />
            Export JSON
          </a>
        </div>
      </div>

      {/* Tab Switcher: All Candidate Signals vs Saved Hypotheses */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => { setActiveTab('all'); setOffset(0); }}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            border: activeTab === 'all' ? '1px solid var(--primary-cyan)' : '1px solid var(--border-color)',
            background: activeTab === 'all' ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'all' ? 'var(--primary-cyan)' : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}
        >
          All Candidate Signals
        </button>

        <button
          onClick={() => { setActiveTab('saved'); setOffset(0); }}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            border: activeTab === 'saved' ? '1px solid var(--primary-cyan)' : '1px solid var(--border-color)',
            background: activeTab === 'saved' ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'saved' ? 'var(--primary-cyan)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          <Bookmark size={16} fill={activeTab === 'saved' ? 'var(--primary-cyan)' : 'none'} />
          Saved Portfolio ({savedIds.length})
        </button>
      </div>

      {/* Main Grid: Sidebar Filters + Signal List */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
        {/* Left Sidebar Filter Panel */}
        <div className="glass-panel" style={{ padding: '20px', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-main)' }}>
            <Sliders size={18} color="var(--primary-cyan)" />
            Filter Controls
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Search Input */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                DRUG NAME / ID
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. Tg100-801, Aspirin..."
                value={drug}
                onChange={e => setDrug(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                DISEASE CONDITION
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. leukemia, cancer..."
                value={disease}
                onChange={e => setDisease(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                TARGET SYMBOL
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. FGR, BRCA1..."
                value={target}
                onChange={e => setTarget(e.target.value)}
              />
            </div>

            {/* Score Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>MIN PRIORITY SCORE</span>
                <span style={{ color: 'var(--primary-cyan)' }}>{minScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={minScore}
                onChange={e => { setMinScore(Number(e.target.value)); setOffset(0); }}
                style={{ width: '100%', accentColor: 'var(--primary-cyan)' }}
              />
            </div>

            {/* Category Select */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                SIGNAL CATEGORY
              </label>
              <select
                className="input-control"
                value={category}
                onChange={e => { setCategory(e.target.value); setOffset(0); }}
              >
                <option value="">All Categories</option>
                <option value="STRONG_RESEARCH_SIGNAL">STRONG SIGNAL (&ge;70)</option>
                <option value="MODERATE_RESEARCH_SIGNAL">MODERATE SIGNAL (40-69)</option>
                <option value="WEAK_RESEARCH_SIGNAL">WEAK SIGNAL (20-39)</option>
                <option value="CONTRADICTED">CONTRADICTED (Warnings)</option>
              </select>
            </div>

            {/* Clinical Evidence Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="clinicalToggle"
                checked={clinicalOnly}
                onChange={e => { setClinicalOnly(e.target.checked); setOffset(0); }}
                style={{ accentColor: 'var(--primary-cyan)' }}
              />
              <label htmlFor="clinicalToggle" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                Require Clinical Trial Evidence
              </label>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px', justifyContent: 'center' }}>
              Apply Filters
            </button>
          </form>
        </div>

        {/* Right Section: Sort Bar + Cards Grid */}
        <div>
          {/* Top Sort & Count Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing <strong>{displayedSignals.length}</strong> {activeTab === 'saved' ? 'saved portfolio hypotheses' : `of ${total} candidate research signals`}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Sort by:</span>
              <select
                className="input-control"
                style={{ width: 'auto', padding: '6px 10px' }}
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="score">Research Priority Score</option>
                <option value="diversity">Source Diversity</option>
                <option value="clinical">Clinical Trial Phase</option>
                <option value="evidence">Evidence Count</option>
              </select>
            </div>
          </div>

          {/* Signals Grid */}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: '12px' }} />
              <div>Querying Signal Intelligence Engine V2...</div>
            </div>
          ) : activeTab === 'saved' && displayedSignals.length === 0 ? (
            <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
              <Bookmark size={36} color="var(--primary-cyan)" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Saved Hypotheses Yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 16px auto' }}>
                Click the bookmark icon on any signal card or detail page to save high-priority repurposing hypotheses to your portfolio.
              </p>
              <button className="btn-secondary" onClick={() => setActiveTab('all')}>
                Browse All Candidate Signals
              </button>
            </div>
          ) : displayedSignals.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No research signals matched your specified filter criteria. Try lowering the minimum priority score.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {displayedSignals.map(sig => (
                <SignalCard key={sig.signal_id} signal={sig} />
              ))}
            </div>
          )}

          {/* Pagination Controls (Only for 'all' tab) */}
          {activeTab === 'all' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
              <button
                className="btn-secondary"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                Previous Page
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Page {Math.floor(offset / limit) + 1}
              </span>
              <button
                className="btn-secondary"
                disabled={offset + limit >= total}
                onClick={() => setOffset(offset + limit)}
              >
                Next Page
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
