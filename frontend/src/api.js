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

/**
 * Fetch live external literature preprints from Europe PMC REST API
 * Timeout handled gracefully via AbortController (5000ms limit).
 */
export async function fetchLiveEuropePMC(drugName, diseaseName) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  const query = `"${drugName}" AND "${diseaseName}"`;
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&pageSize=5&sort=PUB_DATE%20desc`;

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Europe PMC API error (${res.status})`);
    }

    const data = await res.json();
    const results = data.resultList?.result || [];

    return results.map(item => ({
      id: item.id || item.pmid || item.doi,
      pmid: item.pmid || null,
      doi: item.doi || null,
      title: item.title || 'Untitled Publication',
      authors: item.authorString || 'Unknown Authors',
      journal: item.journalTitle || item.bookTitle || 'Biomedical Journal',
      pubYear: item.pubYear || item.firstPublicationDate?.substring(0, 4) || 'N/A',
      abstractSnippet: item.abstractText ? item.abstractText.replace(/<[^>]+>/g, '').substring(0, 240) + '...' : null,
      url: item.pmid ? `https://europepmc.org/article/MED/${item.pmid}` : item.doi ? `https://doi.org/${item.doi}` : `https://europepmc.org/search?query=${encodeURIComponent(query)}`,
    }));
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Europe PMC API request timed out after 6 seconds.');
    }
    throw err;
  }
}
