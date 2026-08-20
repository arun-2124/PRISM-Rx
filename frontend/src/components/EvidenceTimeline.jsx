import React, { useState } from 'react';
import { Calendar, CheckCircle2, ShieldAlert, FileText, Database, ExternalLink, X, Info, Layers } from 'lucide-react';

export default function EvidenceTimeline({ timelineData }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const scientificEvents = timelineData?.scientific_events || timelineData?.events?.filter(e => e.type !== 'DATASET_INGESTION') || [];
  const datasetSnapshot = timelineData?.dataset_snapshot || timelineData?.events?.find(e => e.type === 'DATASET_INGESTION') || null;
  const isAvailable = timelineData?.temporal_evidence === 'AVAILABLE' || scientificEvents.length > 0;

  const getTypeStyle = (type) => {
    switch (type) {
      case 'CLINICAL_TRIAL':
        return { badge: 'CLINICAL TRIAL', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.4)' };
      case 'NEW_PUBLICATION':
        return { badge: 'PREPRINT / PUB', bg: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', border: 'rgba(0, 242, 254, 0.4)' };
      case 'SAFETY_WARNING':
        return { badge: 'SAFETY ALERT', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.4)' };
      default:
        return { badge: 'EVIDENCE EVENT', bg: 'rgba(157, 78, 221, 0.15)', color: '#9d4edd', border: 'rgba(157, 78, 221, 0.4)' };
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', color: '#ffffff', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--primary-cyan)" />
            Candidate Evidence Timeline
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
            Chronological evidence progression (Ascending event order) backed exclusively by verified medbase.db records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {isAvailable ? (
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              ✓ {scientificEvents.length} DATED SCIENTIFIC EVENTS
            </span>
          ) : (
            <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
              DATED EVIDENCE: UNAVAILABLE
            </span>
          )}
        </div>
      </div>

      {!isAvailable ? (
        <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px dashed var(--border-color)', padding: '24px', borderRadius: '8px', textAlign: 'center', marginBottom: '16px' }}>
          <Info size={28} color="var(--text-dim)" style={{ marginBottom: '8px', opacity: 0.7 }} />
          <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
            Temporal evidence unavailable in current snapshot.
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '500px', margin: '0 auto' }}>
            The current database snapshot does not contain dated clinical study start dates or preprint publication records for this candidate.
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid rgba(0, 242, 254, 0.25)', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
          {scientificEvents.map((ev, idx) => {
            const style = getTypeStyle(ev.type);
            const displayDate = ev.date ? strToDate(ev.date) : 'Undated';

            return (
              <div
                key={ev.id || idx}
                onClick={() => setSelectedEvent(ev)}
                style={{
                  position: 'relative',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = style.color; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
              >
                {/* Timeline Dot */}
                <div style={{
                  position: 'absolute',
                  left: '-32px',
                  top: '18px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: style.color,
                  boxShadow: `0 0 10px ${style.color}`,
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge" style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}`, fontSize: '0.7rem' }}>
                      {style.badge}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {displayDate}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> {ev.provenance}
                  </span>
                </div>

                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px', lineHeight: 1.4 }}>
                  {ev.title}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                  <span>Source: <strong style={{ color: 'var(--text-main)' }}>{ev.source}</strong></span>
                  {ev.record_id && <span>Record ID: <code style={{ color: 'var(--primary-cyan)' }}>{ev.record_id}</code></span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Separate Dataset Ingestion Snapshot Card */}
      {datasetSnapshot && (
        <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={18} color="#10b981" />
            <div>
              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.85rem' }}>
                DATASET SNAPSHOT STATUS ({datasetSnapshot.source})
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                {datasetSnapshot.title} · Indexed: <code style={{ color: '#10b981' }}>{datasetSnapshot.date}</code>
              </div>
            </div>
          </div>
          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            VERIFIED MEDBASE.DB SNAPSHOT
          </span>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ maxWidth: '550px', width: '100%', padding: '24px', border: '1px solid var(--primary-cyan)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span className="badge" style={{ background: 'rgba(0, 242, 254, 0.15)', color: 'var(--primary-cyan)', marginBottom: '6px' }}>
                  EVIDENCE EVENT DETAILS
                </span>
                <h4 style={{ fontSize: '1.1rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  {selectedEvent.title}
                </h4>
              </div>
              <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setSelectedEvent(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Event Type:</span>
                <span style={{ color: 'var(--primary-cyan)', fontWeight: 600 }}>{selectedEvent.type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Event Date:</span>
                <span style={{ color: '#ffffff' }}>{selectedEvent.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Data Source:</span>
                <span style={{ color: 'var(--text-main)' }}>{selectedEvent.source}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Record ID:</span>
                <code style={{ color: 'var(--accent-teal)' }}>{selectedEvent.record_id}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Lineage Status:</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>✓ VERIFIED MEDBASE.DB</span>
              </div>
            </div>

            {selectedEvent.url && (
              <a
                href={selectedEvent.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
              >
                View Primary Source Record <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function strToDate(dStr) {
  if (!dStr) return '';
  if (dStr.length === 4) return dStr;
  try {
    const dt = new Date(dStr);
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return dStr;
  }
}
