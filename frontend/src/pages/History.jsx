import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// This tells Vite: Use the Render variable if it exists, otherwise use localhost for development
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";


const History = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  const fetchMatches = async () => {
    setError(null);
    try {
      const resp = await axios.get(`${API_URL}/api/matches/`);
      const completed = (resp.data || []).filter(m => m.status === 'COMPLETED');
      setMatches(completed.reverse());
    } catch {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    fetchMatches();
  }, []);
 
  const dismissalText = (match, innings, playerId) => {
    const wicketBall = innings.deliveries?.find(d => d.is_wicket && d.player_out === playerId);
    if (!wicketBall) return 'not out';
    const bowlingTeam = match.team_a === innings.bowling_team ? match.team_a_details : match.team_b_details;
    const bowler = bowlingTeam.players.find(p => p.id === wicketBall.bowler);
    const bowlerName = bowler ? bowler.name : 'bowler';
    const catcher = wicketBall.catcher ? bowlingTeam.players.find(p => p.id === wicketBall.catcher) : null;
    const catcherName = catcher ? catcher.name : null;
    switch (wicketBall.wicket_type) {
      case 'BOWLED': return `b ${bowlerName}`;
      case 'CAUGHT': return catcherName ? `c ${catcherName} b ${bowlerName}` : `c b ${bowlerName}`;
      case 'LBW': return `lbw b ${bowlerName}`;
      case 'STUMPED': return `st b ${bowlerName}`;
      case 'RUN_OUT': return 'run out';
      case 'HIT_WICKET': return `hit wicket b ${bowlerName}`;
      default: return 'out';
    }
  };
 
  const calcBatting = (innings, playerId) => {
    const balls = innings.deliveries?.filter(d => d.batsman === playerId) || [];
    const runs = balls.reduce((s, d) => s + (d.runs_batter || 0), 0);
    const ballCount = balls.filter(d => d.extra_type !== 'WD').length;
    const fours = balls.filter(d => d.runs_batter === 4).length;
    const sixes = balls.filter(d => d.runs_batter === 6).length;
    const sr = ballCount > 0 ? ((runs / ballCount) * 100).toFixed(1) : '0.0';
    return { runs, ballCount, fours, sixes, sr };
  };
 
  const calcBowling = (innings, playerId) => {
    const balls = innings.deliveries?.filter(d => d.bowler === playerId) || [];
    let wickets = 0, conceded = 0, legal = 0;
    for (const d of balls) {
      if (d.is_wicket && d.wicket_type !== 'RUN_OUT') wickets += 1;
      let cost = d.runs_batter || 0;
      if (d.extra_type === 'WD' || d.extra_type === 'NB') cost += d.extras || 0;
      conceded += cost;
      if (d.extra_type !== 'WD' && d.extra_type !== 'NB') legal += 1;
    }
    const overs = `${Math.floor(legal / 6)}.${legal % 6}`;
    const econ = legal > 0 ? (conceded / (legal / 6)).toFixed(2) : '0.00';
    return { wickets, conceded, overs, econ, ballsBowled: legal };
  };
  
  const resultText = (match) => {
    const inn1 = match.innings.find(i => i.innings_number === 1);
    const inn2 = match.innings.find(i => i.innings_number === 2);
    if (!inn1 || !inn2) return null;
    if (inn1.total_runs === inn2.total_runs) return 'Match tied';
    const winnerId = match.winner_details?.id;
    if (!winnerId) return null;
    if (winnerId === inn1.batting_team) {
      const margin = inn1.total_runs - inn2.total_runs;
      return `Won by ${margin} runs`;
    }
    if (winnerId === inn2.batting_team) {
      const battingTeam = match.team_a === inn2.batting_team ? match.team_a_details : match.team_b_details;
      const teamSize = battingTeam.players.length;
      const wicketsLeft = Math.max(teamSize - inn2.total_wickets, 0);
      return `Won by ${wicketsLeft} wickets`;
    }
    return null;
  };
  
  const fallOfWickets = (match, innings) => {
    const battingTeam = match.team_a === innings.batting_team ? match.team_a_details : match.team_b_details;
    let score = 0;
    let count = 0;
    const entries = [];
    (innings.deliveries || []).forEach(d => {
      score += (d.runs_batter || 0) + (d.extras || 0);
      if (d.is_wicket && d.player_out) {
        count += 1;
        const player = battingTeam.players.find(p => p.id === d.player_out) || { name: 'Player' };
        entries.push(`${score}-${count} (${player.name}, ${d.over_number}.${d.ball_number})`);
      }
    });
    return entries;
  };
 
  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547347298-4074fc259a31?auto=format&fit=crop&w=1600&q=60')] bg-cover bg-center filter grayscale"></div>
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="relative p-3 md:p-4">
        <header className="flex justify-between items-center mb-3 md:mb-4 bg-white/10 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/10">
          <button onClick={() => navigate(-1)} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold">
            ← Back
          </button>
          <h1 className="text-lg md:text-xl font-bold">Match History</h1>
        </header>
 
        {loading && <div className="flex items-center justify-center h-40">Loading...</div>}
        {error && <div className="bg-red-500/80 text-white p-3 rounded mb-4 text-center">{error}</div>}
 
        <div className="grid grid-cols-1 gap-3">
          {matches.map(match => (
            <div key={match.id} className="bg-white/10 rounded-xl border border-white/10 p-3 md:p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold text-sm md:text-base break-words">{match.team_a_details.name} vs {match.team_b_details.name}/ Match{match.id}</div>
                <div className="text-xs md:text-sm text-gray-300">{match.format}</div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {match.innings.map(inn => {
                  const battingTeam = match.team_a === inn.batting_team ? match.team_a_details : match.team_b_details;
                  const bowlingTeam = match.team_a === inn.bowling_team ? match.team_a_details : match.team_b_details;
                  return (
                    <div key={inn.id} className="bg-black/20 rounded-lg p-2 md:p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm md:text-base font-bold">{inn.batting_team_name}</div>
                        <div className="text-sm md:text-base">{inn.total_runs}/{inn.total_wickets} • {inn.overs_bowled} ov</div>
                      </div>
                      <div className="mt-2">
                        <div className="grid grid-cols-12 text-[10px] md:text-xs text-gray-400 mb-1 uppercase font-bold">
                          <div className="col-span-6">Batsman</div>
                          <div className="col-span-1 text-center">R</div>
                          <div className="col-span-1 text-center">B</div>
                          <div className="col-span-1 text-center">4s</div>
                          <div className="col-span-1 text-center">6s</div>
                          <div className="col-span-2 text-center">SR</div>
                        </div>
                        <div className="space-y-1">
                          {battingTeam.players.map(p => {
                            const b = calcBatting(inn, p.id);
                            const dism = dismissalText(match, inn, p.id);
                            const show = b.ballCount > 0 || inn.deliveries?.some(d => d.player_out === p.id);
                            if (!show) return null;
                            return (
                              <div key={p.id} className="grid grid-cols-12 items-center p-1 rounded">
                                <div className="col-span-6">
                                  <span className="font-bold text-xs md:text-sm">{p.name}</span>
                                  <span className="text-gray-400 text-[10px] md:text-xs ml-1">• {dism}</span>
                                </div>
                                <div className="col-span-1 text-center font-bold">{b.runs}</div>
                                <div className="col-span-1 text-center">{b.ballCount}</div>
                                <div className="col-span-1 text-center text-gray-400">{b.fours}</div>
                                <div className="col-span-1 text-center text-gray-400">{b.sixes}</div>
                                <div className="col-span-2 text-center text-gray-300">{b.sr}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="grid grid-cols-12 text-[10px] md:text-xs text-gray-400 mb-1 uppercase font-bold">
                          <div className="col-span-6">Bowler</div>
                          <div className="col-span-2 text-center">O</div>
                          <div className="col-span-2 text-center">R</div>
                          <div className="col-span-2 text-center">W</div>
                        </div>
                        <div className="space-y-1">
                          {bowlingTeam.players.map(p => {
                            const bw = calcBowling(inn, p.id);
                            if (bw.ballsBowled === 0) return null;
                            return (
                              <div key={p.id} className="grid grid-cols-12 items-center p-1 rounded">
                                <div className="col-span-6 font-bold text-xs md:text-sm">{p.name}</div>
                                <div className="col-span-2 text-center">{bw.overs}</div>
                                <div className="col-span-2 text-center">{bw.conceded}</div>
                                <div className="col-span-2 text-center font-bold">{bw.wickets}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex justify-between items-center">
                <div className="text-xs md:text-sm text-gray-300">
                  Winner: {match.winner_details ? match.winner_details.name : 'Tie'}{resultText(match) ? ` • ${resultText(match)}` : ''}
                </div>
                <button
                  onClick={() => navigate(`/match/${match.id}`)}
                  className="px-3 py-2 bg-white text-black font-bold rounded-lg text-xs md:text-sm hover:bg-black hover:text-white border border-white/20 transition"
                >
                  View
                </button>
              </div>
              
              {match.innings.map(inn => {
                const fow = fallOfWickets(match, inn);
                if (!fow.length) return null;
                return (
                  <div key={`fow-${inn.id}`} className="mt-2 bg-black/20 p-2 rounded">
                    <div className="text-[10px] md:text-xs text-gray-400 uppercase font-bold mb-1">Fall of Wickets</div>
                    <div className="text-xs md:text-sm text-gray-200">{fow.join(', ')}</div>
                  </div>
                );
              })}
            </div>
          ))}
          {matches.length === 0 && !loading && (
            <div className="text-center text-gray-300">No completed matches yet</div>
          )}
        </div>
      </div>
    </div>
  );
};
 
export default History;
