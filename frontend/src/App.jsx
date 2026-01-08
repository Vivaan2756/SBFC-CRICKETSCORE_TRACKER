import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import MatchConfig from './pages/MatchConfig';
import Dashboard from './pages/Dashboard';
import History from './pages/History';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white font-sans">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/config/:format" element={<MatchConfig />} />
          <Route path="/match/:id" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
