import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User, Activity, Clock, ShieldCheck, Check } from 'lucide-react';

export default function TopHeader({ onOpenNotifications }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header style={{
      height: '64px',
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 80,
    }}>
      {/* Global Search Input */}
      <form onSubmit={handleSearchSubmit} style={{ width: '380px', position: 'relative' }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          className="input-control"
          placeholder="Global search: drugs, diseases, targets, PMIDs, trials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '36px', height: '38px', fontSize: '0.82rem', borderRadius: '20px', background: 'rgba(255,255,255,0.03)' }}
        />
      </form>

      {/* Right Header Status Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Live Monitoring Badge */}
        <div className="live-pulse" style={{ fontSize: '0.7rem', padding: '4px 10px' }}>
          <div className="pulse-dot" />
          LIVE MONITORING (6 SOURCES)
        </div>

        {/* Live Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <Clock size={14} color="var(--primary-cyan)" />
          {timeString || 'LIVE'}
        </div>

        {/* Notifications Icon Button */}
        <button
          onClick={onOpenNotifications}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-main)',
            position: 'relative',
            transition: 'all 0.2s',
          }}
          title="Recent System Alerts"
        >
          <Bell size={16} />
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--primary-cyan)',
            boxShadow: '0 0 6px var(--primary-cyan)',
          }} />
        </button>

        {/* User Profile Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 12px 4px 6px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-purple), var(--primary-cyan))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 800,
            color: '#040914',
          }}>
            AB
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>Arun Balaji</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>Lead Biotech Analyst</div>
          </div>
        </div>
      </div>
    </header>
  );
}
