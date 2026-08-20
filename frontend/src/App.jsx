import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

// Layout Components
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import Footer from './components/Footer';
import LandingModal from './components/LandingModal';

// Utility
import { getSavedSignalIds } from './utils/savedSignals';

// Pages
import Dashboard from './pages/Dashboard';
import Explorer from './pages/Explorer';
import SignalDetails from './pages/SignalDetails';
import OpportunityRadarPage from './pages/OpportunityRadarPage';
import EvidenceGraphPage from './pages/EvidenceGraphPage';
import DrugIntelligencePage from './pages/DrugIntelligencePage';
import DiseaseIntelligencePage from './pages/DiseaseIntelligencePage';
import ClinicalTrialsPage from './pages/ClinicalTrialsPage';
import ResearchFeedPage from './pages/ResearchFeedPage';
import AlertsPage from './pages/AlertsPage';
import SavedInvestigationsPage from './pages/SavedInvestigationsPage';
import CopilotPage from './pages/CopilotPage';
import SettingsPage from './pages/SettingsPage';
import GlobalSearch from './pages/GlobalSearch';
import About from './pages/About';

export default function App() {
  const [savedCount, setSavedCount] = useState(0);
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    const updateSavedCount = () => {
      setSavedCount(getSavedSignalIds().length);
    };
    updateSavedCount();
    window.addEventListener('prism_saved_signals_changed', updateSavedCount);
    return () => window.removeEventListener('prism_saved_signals_changed', updateSavedCount);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Persistent Left Sidebar Navigation */}
      <Sidebar savedCount={savedCount} />

      {/* Main Content Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Navigation */}
        <TopHeader onOpenNotifications={() => {}} />

        {/* Dynamic Route Pages */}
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/signals" element={<Explorer />} />
            <Route path="/signals/:id" element={<SignalDetails />} />
            <Route path="/radar" element={<OpportunityRadarPage />} />
            <Route path="/graph-explorer" element={<EvidenceGraphPage />} />
            <Route path="/drugs-intel" element={<DrugIntelligencePage />} />
            <Route path="/diseases-intel" element={<DiseaseIntelligencePage />} />
            <Route path="/trials-intel" element={<ClinicalTrialsPage />} />
            <Route path="/feed" element={<ResearchFeedPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/saved" element={<SavedInvestigationsPage />} />
            <Route path="/copilot" element={<CopilotPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/search" element={<GlobalSearch />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>

      {/* Optional Landing Splash Modal */}
      {showLanding && <LandingModal onClose={() => setShowLanding(false)} />}
    </div>
  );
}
