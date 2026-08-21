import React from 'react';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PRISM ErrorBoundary caught an exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '32px 24px', color: '#e2e8f0' }}>
          <div className="glass-card" style={{ padding: '36px', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '16px', background: 'rgba(13, 21, 39, 0.95)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#f87171', marginBottom: '16px' }}>
              <ShieldAlert size={28} />
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Signal Detail View Recovered</h2>
            </div>

            <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '24px' }}>
              An unexpected render issue occurred while rendering this candidate signal ({this.state.error?.message || 'Invalid candidate structure'}).
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => window.location.href = '/signals'}
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', cursor: 'pointer' }}
              >
                <ArrowLeft size={16} /> Back to Explorer
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', cursor: 'pointer' }}
              >
                <RefreshCw size={16} /> Retry View
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
