import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Dna, Activity, Search, Info, ShieldAlert, Cpu, Bookmark } from 'lucide-react';
import { fetchHealth } from '../api';
import { getSavedSignalIds } from '../utils/savedSignals';

export default function Navbar() {
  const [healthy, setHealthy] = useState(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    fetchHealth()
      .then(() => setHealthy(true))
      .catch(() => setHealthy(false));

    const updateSavedCount = () => {
      setSavedCount(getSavedSignalIds().length);
    };

    updateSavedCount();
    window.addEventListener('prism_saved_signals_changed', updateSavedCount);
    return () => window.removeEventListener('prism_saved_signals_changed', updateSavedCount);
  }, []);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '12px 24px',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Brand */}
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary-cyan) 0%, var(--accent-purple) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 242, 254, 0.4)',
          }}>
            <Dna size={24} color="#040914" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              PRISM-<span className="text-cyan">Rx</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Biotech Arbitrage Engine
            </div>
          </div>
        </NavLink>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: isActive ? 'var(--primary-cyan)' : 'var(--text-muted)',
              background: isActive ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
              transition: 'all 0.2s',
            })}
          >
            <Activity size={16} />
            Dashboard
          </NavLink>

          <NavLink
            to="/signals"
            style={({ isActive }) => ({
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: isActive ? 'var(--primary-cyan)' : 'var(--text-muted)',
              background: isActive ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
              transition: 'all 0.2s',
            })}
          >
            <Cpu size={16} />
            Signal Explorer
            {savedCount > 0 && (
              <span className="badge badge-strong" style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '10px' }}>
                {savedCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/search"
            style={({ isActive }) => ({
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: isActive ? 'var(--primary-cyan)' : 'var(--text-muted)',
              background: isActive ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
              transition: 'all 0.2s',
            })}
          >
            <Search size={16} />
            Global Search
          </NavLink>

          <NavLink
            to="/about"
            style={({ isActive }) => ({
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: isActive ? 'var(--primary-cyan)' : 'var(--text-muted)',
              background: isActive ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
              transition: 'all 0.2s',
            })}
          >
            <Info size={16} />
            Methodology
          </NavLink>
        </nav>

        {/* API Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-color)',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: healthy === true ? '#10b981' : healthy === false ? '#ef4444' : '#f59e0b',
            boxShadow: healthy ? '0 0 8px #10b981' : 'none',
          }} />
          {healthy === true ? 'API ONLINE (medbase.db)' : healthy === false ? 'API OFFLINE' : 'Connecting...'}
        </div>
      </div>
    </header>
  );
}
