import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Dna, Radar, Bot, Bookmark, Menu, X, GitMerge, Pill, Activity, FileCheck2, Radio, Bell, Settings, Search } from 'lucide-react';

export default function MobileNav({ savedCount = 0 }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const allNavItems = [
    { label: 'Dashboard Overview', icon: LayoutDashboard, path: '/' },
    { label: 'Signal Explorer', icon: Dna, path: '/signals' },
    { label: 'Opportunity Radar', icon: Radar, path: '/radar' },
    { label: 'Evidence Graph Topology', icon: GitMerge, path: '/graph-explorer' },
    { label: 'Drug Intelligence', icon: Pill, path: '/drugs-intel' },
    { label: 'Disease Intelligence', icon: Activity, path: '/diseases-intel' },
    { label: 'Clinical Trial Analytics', icon: FileCheck2, path: '/trials-intel' },
    { label: 'Real-Time Research Feed', icon: Radio, path: '/feed' },
    { label: 'Personalized Signal Alerts', icon: Bell, path: '/alerts' },
    { label: 'Saved Investigations', icon: Bookmark, path: '/saved', badge: savedCount },
    { label: 'PRISM Copilot AI', icon: Bot, path: '/copilot' },
    { label: 'Methodology & Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <>
      {/* Mobile Bottom Quick Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/signals" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Dna size={20} />
          <span>Signals</span>
        </NavLink>

        <NavLink to="/radar" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Radar size={20} />
          <span>Radar</span>
        </NavLink>

        <NavLink to="/copilot" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Bot size={20} />
          <span>Copilot</span>
        </NavLink>

        <NavLink to="/saved" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <div style={{ position: 'relative' }}>
            <Bookmark size={20} />
            {savedCount > 0 && (
              <span className="mobile-badge-count">{savedCount}</span>
            )}
          </div>
          <span>Saved</span>
        </NavLink>

        <button
          onClick={() => setDrawerOpen(true)}
          className="mobile-nav-item"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>

      {/* Slide-over Mobile Navigation Drawer */}
      {drawerOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Dna size={20} color="var(--primary-cyan)" />
                PRISM-<span className="text-cyan">Rx</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Menu Links List */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
              {allNavItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={idx}
                    to={item.path}
                    onClick={() => setDrawerOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: isActive ? 'var(--primary-cyan)' : 'var(--text-main)',
                      background: isActive ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                      border: isActive ? '1px solid var(--primary-cyan)' : '1px solid transparent',
                    })}
                  >
                    <Icon size={18} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="badge badge-strong" style={{ fontSize: '0.7rem' }}>{item.badge}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
