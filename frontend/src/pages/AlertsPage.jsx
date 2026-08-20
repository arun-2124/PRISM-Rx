import React, { useState } from 'react';
import { Bell, ShieldAlert, Zap, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([
    { id: 1, topic: 'Oncology / Leukemia Signals', threshold: 75, enabled: true },
    { id: 2, topic: 'Alzheimer & Neurodegenerative', threshold: 70, enabled: true },
    { id: 3, topic: 'Tg100-801 Momentum Acceleration', threshold: 80, enabled: true },
  ]);

  const [newTopic, setNewTopic] = useState('');
  const [newThreshold, setNewThreshold] = useState(75);

  const handleAddAlert = (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    setAlerts([...alerts, { id: Date.now(), topic: newTopic.trim(), threshold: newThreshold, enabled: true }]);
    setNewTopic('');
  };

  const handleRemoveAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={28} color="var(--primary-cyan)" />
          Personalized Signal Alerts & Notifications
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Configure automated triggers for high-momentum repurposing hypotheses and evidence contradictions.
        </p>
      </div>

      {/* Add Alert Rule Form */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} color="var(--primary-cyan)" />
          Create New Alert Trigger Rule
        </h3>

        <form onSubmit={handleAddAlert} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 140px', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              THERAPEUTIC AREA / DISEASE / DRUG TOPIC
            </label>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. Immunotherapy, Kinase Inhibitors, Parkinson's..."
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              MIN PRISM SCORE THRESHOLD ({newThreshold})
            </label>
            <input
              type="range"
              min="50"
              max="90"
              step="5"
              value={newThreshold}
              onChange={(e) => setNewThreshold(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary-cyan)' }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ justifyContent: 'center', height: '40px' }}>
            Add Alert Rule
          </button>
        </form>
      </div>

      {/* Configured Alert Triggers */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-main)' }}>
          Active Alert Subscriptions ({alerts.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.map((a) => (
            <div key={a.id} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '14px 20px',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{a.topic}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Triggers when PRISM Research Priority Score &ge; <strong style={{ color: 'var(--primary-cyan)' }}>{a.threshold} pts</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className="badge badge-strong">ACTIVE</span>
                <button
                  onClick={() => handleRemoveAlert(a.id)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
