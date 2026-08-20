import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Dna,
  LayoutDashboard,
  Cpu,
  Radar,
  GitMerge,
  Pill,
  Activity,
  FileCheck2,
  Radio,
  Bell,
  FolderBookmark,
  Bot,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar({ savedCount = 0 }) {
  const navItems = [
    { path: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
    { path: '/signals', label: 'Signal Explorer', icon: Cpu, badge: savedCount > 0 ? savedCount : null },
    { path: '/radar', label: 'Opportunity Radar', icon: Radar },
    { path: '/graph-explorer', label: 'Evidence Graph', icon: GitMerge },
    { path: '/drugs-intel', label: 'Drug Intelligence', icon: Pill },
    { path: '/diseases-intel', label: 'Disease Intelligence', icon: Activity },
    { path: '/trials-intel', label: 'Clinical Trials', icon: FileCheck2 },
    { path: '/feed', label: 'Research Feed', icon: Radio, pulse: true },
    { path: '/alerts', label: 'Alerts', icon: Bell, badge: '3' },
    { path: '/saved', label: 'Saved Investigations', icon: FolderBookmark },
    { path: '/copilot', label: 'PRISM Copilot', icon: Bot, highlight: true },
    { path: '/settings', label: 'Methodology & Settings', icon: Settings },
  ];

  return (
    <aside className="desktop-sidebar" style={{
      width: '260px',
      minWidth: '260px',
      background: '#090d16',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      userSelect: 'none',
    }}>
      {/* Brand Header */}
      <div>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary-cyan) 0%, var(--accent-purple) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 242, 254, 0.4)',
          }}>
            <Dna size={22} color="#040914" />
          </div>

          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
              PRISM-<span className="text-cyan">Rx</span>
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
              Biotech Arbitrage Engine
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: 'calc(100vh - 160px)' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                style={({ isActive }) => ({
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: isActive ? 'var(--primary-cyan)' : item.highlight ? 'var(--accent-purple)' : 'var(--text-muted)',
                  background: isActive ? 'rgba(0, 242, 254, 0.1)' : item.highlight ? 'rgba(157, 78, 221, 0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(0, 242, 254, 0.2)' : item.highlight ? '1px solid rgba(157, 78, 221, 0.2)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {item.pulse && (
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 6px #10b981',
                    }} />
                  )}
                  {item.badge && (
                    <span className="badge badge-strong" style={{ padding: '2px 6px', fontSize: '0.62rem', borderRadius: '10px' }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(0, 0, 0, 0.2)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.72rem',
          color: 'var(--accent-emerald)',
          fontWeight: 600,
        }}>
          <div className="pulse-dot" style={{ width: '6px', height: '6px' }} />
          All Systems Operational (medbase.db)
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '4px' }}>
          Open Targets 26.06 Snapshot | 819K Signals
        </div>
      </div>
    </aside>
  );
}
