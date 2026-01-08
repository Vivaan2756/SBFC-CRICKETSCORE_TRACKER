import React from 'react';
import { useNavigate } from 'react-router-dom';


const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-black to-gray-900 p-4 text-white overflow-x-hidden">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 md:mb-12 text-white">Cricket Score Tracker</h1>
      <button
        onClick={() => navigate('/history')}
        className="mb-8 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition transform hover:scale-105 hover:shadow-2xl"
      >
        History
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <div 
          onClick={() => navigate('/config/TEST')}
          className="group cursor-pointer bg-white/10 backdrop-blur-md rounded-2xl p-8 hover:bg-white/20 transition-all transform hover:scale-105 hover:shadow-2xl border border-white/10"
        >
          <div className="h-40 flex items-center justify-center mb-6">
            <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center text-black">
               <span className="text-4xl">🏏</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center mb-4">Test Match</h2>
          <p className="text-gray-300 text-center">
            Traditional 4-innings format. Track leads, declarations, and classic stats.
          </p>
        </div>

        <div 
          onClick={() => navigate('/config/T20')}
          className="group cursor-pointer bg-white/10 backdrop-blur-md rounded-2xl p-8 hover:bg-white/20 transition-all transform hover:scale-105 hover:shadow-2xl border border-white/10"
        >
          <div className="h-40 flex items-center justify-center mb-6">
            <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center text-black">
              <span className="text-4xl">⚡</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center mb-4">Limited Overs / T20</h2>
          <p className="text-gray-300 text-center">
            Fast-paced action. Customize overs, track run rates and boundaries.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
