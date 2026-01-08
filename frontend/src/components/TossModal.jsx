import React, { useState } from 'react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TossModal = ({ match, onUpdate }) => {
  const [winner, setWinner] = useState(match.team_a);
  const [decision, setDecision] = useState('BAT');
  const [loading, setLoading] = useState(false);

  const handleToss = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/matches/${match.id}/toss/`, {
        winner_id: winner,
        decision: decision
      });
      onUpdate();
    } catch (error) {
      console.error("Error conducting toss:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-green-800 p-8 rounded-3xl max-w-md w-full border border-white/20 shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-6 text-white">Match Toss</h2>
        
        <div className="mb-6">
          <label className="block text-green-200 mb-2 font-semibold">Who won the toss?</label>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setWinner(match.team_a)}
              className={`p-4 rounded-xl border-2 transition-all ${winner === match.team_a ? 'border-yellow-400 bg-yellow-400/20' : 'border-white/20 hover:bg-white/10'}`}
            >
              {match.team_a_details.name}
            </button>
            <button 
              onClick={() => setWinner(match.team_b)}
              className={`p-4 rounded-xl border-2 transition-all ${winner === match.team_b ? 'border-yellow-400 bg-yellow-400/20' : 'border-white/20 hover:bg-white/10'}`}
            >
              {match.team_b_details.name}
            </button>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-green-200 mb-2 font-semibold">Decision?</label>
          <div className="flex gap-4">
            <button 
              onClick={() => setDecision('BAT')}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${decision === 'BAT' ? 'bg-white text-green-900' : 'bg-black/30 hover:bg-black/40'}`}
            >
              Bat
            </button>
            <button 
              onClick={() => setDecision('BOWL')}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${decision === 'BOWL' ? 'bg-white text-green-900' : 'bg-black/30 hover:bg-black/40'}`}
            >
              Bowl
            </button>
          </div>
        </div>

        <button 
          onClick={handleToss}
          disabled={loading}
          className="w-full bg-yellow-400 text-black font-bold text-xl py-4 rounded-full hover:bg-yellow-300 transition-transform hover:scale-105"
        >
          {loading ? 'Starting...' : 'Start Match'}
        </button>
      </div>
    </div>
  );
};

export default TossModal;
