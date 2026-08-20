const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('API server unavailable');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch system stats');
  return res.json();
}

export async function fetchSignals(params = {}) {
  const query = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      query.append(key, params[key]);
    }
  });

  const res = await fetch(`${API_BASE}/signals?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch signals');
  return res.json();
}

export async function fetchSignalById(id) {
  const res = await fetch(`${API_BASE}/signals/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Signal '${id}' not found`);
  return res.json();
}

export async function fetchSignalGraph(id) {
  const res = await fetch(`${API_BASE}/graph/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to fetch graph data');
  return res.json();
}

export async function fetchSignalTrials(id) {
  const res = await fetch(`${API_BASE}/clinical-trials/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to fetch clinical trials');
  return res.json();
}

export async function fetchSignalEvidence(id) {
  const res = await fetch(`${API_BASE}/evidence/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to fetch evidence details');
  return res.json();
}

export async function fetchDrugs(q = '', limit = 20) {
  const res = await fetch(`${API_BASE}/drugs?q=${encodeURIComponent(q)}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to search drugs');
  return res.json();
}

export async function fetchDiseases(q = '', limit = 20) {
  const res = await fetch(`${API_BASE}/diseases?q=${encodeURIComponent(q)}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to search diseases');
  return res.json();
}

export function getExportUrl(format = 'csv', minScore = 40) {
  return `${API_BASE}/export?format=${format}&min_score=${minScore}`;
}
