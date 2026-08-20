import React, { useState, useEffect } from 'react';
import { Radar, Sliders, ArrowRight } from 'lucide-react';
import { fetchSignals } from '../api';
import OpportunityRadar from '../components/OpportunityRadar';
import SignalCard from '../components/SignalCard';

export default function OpportunityRadarPage() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignals({ limit: 18, min_score: 40 })
      .then((data) => {
        setSignals(data.signals || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Radar page fetch error:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Radar size={28} color="var(--primary-cyan)" />
          Repurposing Opportunity Radar
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Visualize candidate drug repurposing hypotheses along Evidence Strength (X-axis) and Novelty (Y-axis).
        </p>
      </div>

      {/* Main Scatter Plot */}
      <div style={{ marginBottom: '32px' }}>
        <OpportunityRadar candidateSignals={signals} />
      </div>

      {/* Priority Opportunities Showcase */}
      <div>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '16px' }}>
          Priority Opportunities (High Novelty / High Evidence)
        </h2>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading Opportunity Radar candidates...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {signals.slice(0, 6).map((sig) => (
              <SignalCard key={sig.signal_id} signal={sig} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
