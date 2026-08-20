import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dna, ArrowRight, ShieldCheck, Zap, Activity } from 'lucide-react';

export default function LandingModal({ onClose }) {
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2000,
      background: 'rgba(4, 7, 16, 0.92)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="glass-card" style={{
        maxWidth: '680px',
        width: '100%',
        padding: '48px 40px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(157, 78, 221, 0.08) 100%)',
        border: '1px solid rgba(0, 242, 254, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 242, 254, 0.2)',
      }}>
        {/* Brand Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, var(--primary-cyan) 0%, var(--accent-purple) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          boxShadow: '0 0 30px rgba(0, 242, 254, 0.5)',
        }}>
          <Dna size={36} color="#040914" />
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '12px', lineHeight: 1.2 }}>
          PRISM-<span className="text-cyan">Rx</span>
        </h1>

        <p style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-cyan)', marginBottom: '12px' }}>
          &ldquo;See the signal before it becomes the breakthrough.&rdquo;
        </p>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto 32px auto' }}>
          Predictive Repurposing Intelligence & Signal Monitoring for Rx. Continuously analyzes 819K candidate pairs across Open Targets 26.06, UniProt, and ClinicalTrials.gov datasets.
        </p>

        {/* Action Triggers */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            style={{ padding: '12px 28px', fontSize: '1rem' }}
            onClick={onClose}
          >
            ENTER DASHBOARD
            <ArrowRight size={18} />
          </button>

          <button
            className="btn-secondary"
            style={{ padding: '12px 24px', fontSize: '0.95rem' }}
            onClick={() => { onClose(); navigate('/signals'); }}
          >
            Explore 819K Signals
          </button>
        </div>

        {/* Footer Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '36px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          <span>🟢 1.31M Nodes</span>
          <span>🟢 1.08M Edges</span>
          <span>🟢 2.0M Database Records</span>
        </div>
      </div>
    </div>
  );
}
