import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const MatchConfig = () => {
  const { format } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [config, setConfig] = useState({
    customOvers: format === 'T20' ? 20 : null,
    lastManStanding: false,
    teamA: { name: '', players: [] },
    teamB: { name: '', players: [] }
  });

  const [newPlayerA, setNewPlayerA] = useState('');
  const [newPlayerB, setNewPlayerB] = useState('');

  const addPlayer = (team, name, setName) => {
    if (!name.trim()) return;
    const newPlayer = { name: name, is_captain: false };
    setConfig(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        players: [...prev[team].players, newPlayer]
      }
    }));
    setName('');
  };

  const removePlayer = (team, index) => {
    setConfig(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        players: prev[team].players.filter((_, i) => i !== index)
      }
    }));
  };

  const toggleCaptain = (team, index) => {
    setConfig(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        players: prev[team].players.map((p, i) => ({
          ...p,
          is_captain: i === index // Only one captain
        }))
      }
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    if (config.teamA.players.length < 4 || config.teamB.players.length < 4) {
      setError("Both teams must have at least 4 players.");
      return;
    }
    if (!config.teamA.name || !config.teamB.name) {
      setError("Please enter team names.");
      return;
    }
    if (format === 'T20' && (!config.customOvers || config.customOvers <= 0)) {
      setError("Please set a valid number of overs.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        format: format,
        custom_overs: config.customOvers,
        last_man_standing: config.lastManStanding,
        team_a: {
          name: config.teamA.name,
          players: config.teamA.players
        },
        team_b: {
          name: config.teamB.name,
          players: config.teamB.players
        }
      };

      const response = await axios.post('http://localhost:8000/api/matches/', payload);
      navigate(`/match/${response.data.id}`);
    } catch (err) {
      setError("Failed to create match. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 flex flex-col items-center text-white overflow-x-hidden">
      <div className="w-full max-w-6xl bg-white/5 backdrop-blur-lg rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl border border-white/10">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-white/20 pb-3 md:pb-4">
          <button onClick={() => navigate(-1)} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold">
            ← Back
          </button>
          <h1 className="text-2xl md:text-3xl font-bold">New {format === 'TEST' ? 'Test Match' : 'T20'}</h1>
          {format === 'T20' && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <label className="font-semibold">Overs:</label>
                <input 
                  type="number" 
                  value={config.customOvers} 
                  onChange={(e) => setConfig({...config, customOvers: parseInt(e.target.value)})}
                  className="bg-black/30 text-white rounded px-3 py-1 w-16 md:w-20 text-center border border-white/30 focus:border-white/60"
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={config.lastManStanding}
                  onChange={(e) => setConfig({...config, lastManStanding: e.target.checked})}
                  className="w-5 h-5 accent-white"
                />
                <span className="font-semibold">Last Man Standing</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/80 text-white p-3 rounded mb-6 text-center animate-pulse">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Team A Section */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold mb-4 text-white">Team A</h2>
            <input 
              type="text" 
              placeholder="Team Name" 
              className="w-full bg-black/30 rounded-lg px-4 py-2 mb-4 border border-white/20 focus:outline-none focus:border-white/60 text-white"
              value={config.teamA.name}
              onChange={(e) => setConfig({...config, teamA: {...config.teamA, name: e.target.value}})}
            />
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Add Player" 
                className="flex-1 bg-black/30 rounded-lg px-4 py-2 border border-white/20 text-white"
                value={newPlayerA}
                onChange={(e) => setNewPlayerA(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPlayer('teamA', newPlayerA, setNewPlayerA)}
              />
              <button 
                onClick={() => addPlayer('teamA', newPlayerA, setNewPlayerA)}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-bold text-white border border-white/20 transition"
              >
                +
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {config.teamA.players.map((player, idx) => (
                <div key={idx} className="flex items-center justify-between bg-black/20 p-2 rounded">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-full text-xs">{idx + 1}</span>
                    <span>{player.name}</span>
                    {player.is_captain && <span className="text-yellow-400 text-xs font-bold border border-yellow-400 px-1 rounded">C</span>}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleCaptain('teamA', idx)}
                      className={`text-xs px-2 py-1 rounded ${player.is_captain ? 'bg-yellow-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                    >
                      {player.is_captain ? 'Captain' : 'Make C'}
                    </button>
                    <button onClick={() => removePlayer('teamA', idx)} className="text-red-400 hover:text-red-300">×</button>
                  </div>
                </div>
              ))}
              {config.teamA.players.length === 0 && <p className="text-gray-400 text-sm text-center italic">No players added yet</p>}
            </div>
            <p className="text-xs text-red-300 mt-2 h-4">{config.teamA.players.length < 4 && "Minimum 4 players required"}</p>
          </div>

          {/* Team B Section */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold mb-4 text-white">Team B</h2>
            <input 
              type="text" 
              placeholder="Team Name" 
              className="w-full bg-black/30 rounded-lg px-4 py-2 mb-4 border border-white/20 focus:outline-none focus:border-white/60 text-white"
              value={config.teamB.name}
              onChange={(e) => setConfig({...config, teamB: {...config.teamB, name: e.target.value}})}
            />
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Add Player" 
                className="flex-1 bg-black/30 rounded-lg px-4 py-2 border border-white/20 text-white"
                value={newPlayerB}
                onChange={(e) => setNewPlayerB(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPlayer('teamB', newPlayerB, setNewPlayerB)}
              />
              <button 
                onClick={() => addPlayer('teamB', newPlayerB, setNewPlayerB)}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-bold text-white border border-white/20 transition"
              >
                +
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {config.teamB.players.map((player, idx) => (
                <div key={idx} className="flex items-center justify-between bg-black/20 p-2 rounded">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-full text-xs">{idx + 1}</span>
                    <span>{player.name}</span>
                    {player.is_captain && <span className="text-yellow-400 text-xs font-bold border border-yellow-400 px-1 rounded">C</span>}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleCaptain('teamB', idx)}
                      className={`text-xs px-2 py-1 rounded ${player.is_captain ? 'bg-yellow-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                    >
                      {player.is_captain ? 'Captain' : 'Make C'}
                    </button>
                    <button onClick={() => removePlayer('teamB', idx)} className="text-red-400 hover:text-red-300">×</button>
                  </div>
                </div>
              ))}
              {config.teamB.players.length === 0 && <p className="text-gray-400 text-sm text-center italic">No players added yet</p>}
            </div>
            <p className="text-xs text-red-300 mt-2 h-4">{config.teamB.players.length < 4 && "Minimum 4 players required"}</p>
          </div>

        </div>

        <div className="mt-8 flex justify-center">
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="bg-white text-black font-bold text-xl px-12 py-3 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-xl"
          >
            {loading ? 'Starting Match...' : 'Start New Match'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default MatchConfig;
