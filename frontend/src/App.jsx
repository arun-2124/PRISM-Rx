import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Dashboard from './pages/Dashboard';
import Explorer from './pages/Explorer';
import SignalDetails from './pages/SignalDetails';
import GlobalSearch from './pages/GlobalSearch';
import About from './pages/About';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/signals" element={<Explorer />} />
            <Route path="/signals/:id" element={<SignalDetails />} />
            <Route path="/search" element={<GlobalSearch />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
