import React, { useState } from 'react';
import { Search, Dna, Activity, Layers, ArrowRight } from 'lucide-react';
import { fetchDrugs, fetchDiseases } from '../api';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [drugs, setDrugs] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    Promise.all([
      fetchDrugs(query, 10),
      fetchDiseases(query, 10),
    ])
      .then(([drugRes, diseaseRes]) => {
        setDrugs(drugRes.drugs || []);
        setDiseases(diseaseRes.diseases || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Search error:', err);
        setLoading(false);
      });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '12px' }}>
          Global Entity <span className="text-gradient">Search</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
          Search across 22,407 Drugs and 47,080 Diseases in the PRISM-Rx Knowledge Graph. Partial matching supported.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} style={{ maxWidth: '700px', margin: '0 auto 40px auto', display: 'flex', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-control"
            style={{ paddingLeft: '48px', height: '50px', fontSize: '1rem' }}
            placeholder="Search by drug name (e.g. Aspirin, Tg100-801) or disease (e.g. leukemia, cancer)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" style={{ padding: '0 28px', height: '50px' }}>
          Search
        </button>
      </form>

      {/* Search Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Searching entity database...</div>
      ) : searched && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Drugs Results */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Dna size={20} />
              Drug Entities ({drugs.length})
            </h3>

            {drugs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No drug entities found matching '{query}'.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {drugs.map(d => (
                  <div key={d.id} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{d.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ID: <code>{d.id}</code> | ChEMBL: {d.chembl_id} | Stage: {d.max_clinical_stage || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diseases Results */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} />
              Disease Entities ({diseases.length})
            </h3>

            {diseases.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No disease entities found matching '{query}'.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {diseases.map(dis => (
                  <div key={dis.id} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{dis.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ID: <code>{dis.id}</code> | Ontology ID: {dis.source_id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
