const STORAGE_KEY = 'prism_saved_signals';

export function getSavedSignalIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading saved signals from localStorage:', e);
    return [];
  }
}

export function isSignalSaved(signalId) {
  if (!signalId) return false;
  const saved = getSavedSignalIds();
  return saved.includes(signalId);
}

export function toggleSaveSignal(signalId) {
  if (!signalId) return false;
  const saved = getSavedSignalIds();
  let updated;
  let isNowSaved;

  if (saved.includes(signalId)) {
    updated = saved.filter(id => id !== signalId);
    isNowSaved = false;
  } else {
    updated = [...saved, signalId];
    isNowSaved = true;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('prism_saved_signals_changed'));
  } catch (e) {
    console.error('Error writing saved signals to localStorage:', e);
  }

  return isNowSaved;
}
