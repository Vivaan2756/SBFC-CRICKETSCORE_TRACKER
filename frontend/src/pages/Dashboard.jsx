import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TossModal from '../components/TossModal';
import Scoreboard from '../components/Scoreboard';
import MatchSummary from '../components/MatchSummary';
// This tells Vite: Use the Render variable if it exists, otherwise use localhost for development
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";



const Dashboard = () => {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMatch = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/matches/${id}/`);
      setMatch(response.data);
    } catch (error) {
      console.error("Error fetching match:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
    const interval = setInterval(fetchMatch, 5000); // Poll every 5s for updates
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-black text-white overflow-x-hidden">Loading...</div>;
  if (!match) return <div className="flex h-screen items-center justify-center bg-black text-white overflow-x-hidden">Match not found</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans p-3 md:p-4 overflow-x-hidden">
      <header className="flex justify-between items-center mb-3 md:mb-4 bg-white/10 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/10">
        <button onClick={() => navigate(-1)} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold">
          ← Back
        </button>
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center text-xl md:text-2xl">🏏</div>
          <div className="text-right">
            <h1 className="text-lg md:text-xl font-bold break-words">{match.team_a_details.name} vs {match.team_b_details.name}</h1>
            <p className="text-xs md:text-sm text-gray-300">{match.format} • {match.status}</p>
          </div>
        </div>
      </header>

      {match.status === 'SETUP' && (
        <TossModal match={match} onUpdate={fetchMatch} />
      )}

      {(match.status === 'LIVE' || match.status === 'COMPLETED') && (
        <>
          <Scoreboard match={match} onUpdate={fetchMatch} />
          {match.status === 'COMPLETED' && <MatchSummary match={match} />}
        </>
      )}
      
    </div>
  );
};

export default Dashboard;
