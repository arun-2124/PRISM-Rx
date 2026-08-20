import React, { useState, useEffect } from 'react';
import { FolderBookmark, Bookmark, Trash2, ArrowRight } from 'lucide-react';
import { fetchSignals } from '../api';
import { getSavedSignalIds } from '../utils/savedSignals';
import SignalCard from '../components/SignalCard';

export default function SavedInvestigationsPage() {
  const [savedIds, setSavedIds] = useState(getSavedSignalIds());
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState('All');

  const folders = ['All', 'Oncology / Hematology', 'Neurodegenerative', 'Autoimmune', 'High Priority'];

  useEffect(() => {
    fetchSignals({ limit: 100 })
      .then((data) => {
        setSignals(data.signals || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    const handleSavedChange = () => {
      setSavedIds(getSavedSignalIds());
    };
    window.addEventListener('prism_saved_signals_changed', handleSavedChange);
    return () => window.removeEventListener('prism_saved_signals_changed', handleSavedChange);
  }, []);

  const savedSignalsList = signals.filter(s => savedIds.includes(s.signal_id));

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FolderBookmark size={28} color="var(--primary-cyan)" />
          Saved Investigations Portfolio
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Organize and track your saved drug repurposing hypotheses. Persisted in browser storage.
        </p>
      </div>

      {/* Folder Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {folders.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFolder(f)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              border: activeFolder === f ? '1px solid var(--primary-cyan)' : '1px solid var(--border-color)',
              background: activeFolder === f ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.02)',
              color: activeFolder === f ? 'var(--primary-cyan)' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Candidates List Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading saved portfolio...
        </div>
      ) : savedSignalsList.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <Bookmark size={36} color="var(--primary-cyan)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Saved Investigations Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 16px auto' }}>
            Click the bookmark icon on any signal card across the application to save candidate hypotheses to your portfolio.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {savedSignalsList.map((sig) => (
            <SignalCard key={sig.signal_id} signal={sig} />
          ))}
        </div>
      )}
    </div>
  );
}
