import React from 'react';
import { useNavigate } from 'react-router-dom';


const MatchSummary = ({ match }) => {
  const navigate = useNavigate();
  if (match.status !== 'COMPLETED') return null;
  const handleexit = () => {
    navigate('/');
  };
  const allDeliveries = (match.innings || []).flatMap(i => i.deliveries || []);
  const batsmanStats = (pid) => {
    const balls = allDeliveries.filter(d => d.batsman === pid);
    const runs = balls.reduce((s, d) => s + (d.runs_batter || 0), 0);
    const ballCount = balls.filter(d => d.extra_type !== 'WD').length;
    const fours = balls.filter(d => d.runs_batter === 4).length;
    const sixes = balls.filter(d => d.runs_batter === 6).length;
    const sr = ballCount > 0 ? ((runs / ballCount) * 100).toFixed(1) : '0.0';
    return { runs, ballCount, fours, sixes, sr };
  };
  const bowlerStats = (pid) => {
    const balls = allDeliveries.filter(d => d.bowler === pid);
    let wickets = 0;
    let conceded = 0;
    let legal = 0;
    for (const d of balls) {
      if (d.is_wicket && d.wicket_type !== 'RUN_OUT') wickets += 1;
      let cost = d.runs_batter || 0;
      if (d.extra_type === 'WD' || d.extra_type === 'NB') cost += d.extras || 0;
      conceded += cost;
      if (d.extra_type !== 'WD' && d.extra_type !== 'NB') legal += 1;
    }
    const overs = `${Math.floor(legal / 6)}.${legal % 6}`;
    const econ = legal > 0 ? (conceded / (legal / 6)).toFixed(2) : '0.00';
    return { wickets, conceded, overs, econ };
  };
  const momId = match.man_of_match;
  const bbId = match.best_batsman;
  const bwId = match.best_bowler;
  const bb = bbId ? batsmanStats(bbId) : null;
  const bw = bwId ? bowlerStats(bwId) : null;
  const momBat = momId ? batsmanStats(momId) : null;
  const momBowl = momId ? bowlerStats(momId) : null;
  
  const marginText = () => {
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

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-black to-gray-900 p-8 rounded-3xl border border-white/20 max-w-2xl w-full text-center shadow-2xl relative overflow-hidden">
        {/* Confetti Effect Background (Simplified CSS) */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        
        <h2 className="text-4xl font-extrabold text-white mb-2">MATCH COMPLETED</h2>
        
        <div className="my-8 animate-bounce">
          <span className="text-6xl">🏆</span>
        </div>

        <h3 className="text-3xl font-bold text-white mb-2">
          {match.winner_details ? match.winner_details.name : 'Match Tied'} Won!
        </h3>
        <p className="text-gray-400 mb-2">Congratulations to the winning team</p>
        {marginText() && <p className="text-white font-semibold mb-8">{marginText()}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Man of the Match */}
          <div className="bg-white/10 p-4 rounded-xl border border-white/20 transform hover:scale-105 transition-transform">
            <div className="text-2xl mb-2">🎖️</div>
            <h4 className="text-white font-bold text-sm uppercase mb-1">Player of the Match</h4>
            <p className="text-white font-bold text-lg">{match.man_of_match_details?.name || '-'}</p>
            {momId && (
              <p className="text-gray-300 text-xs mt-1">
                Batting: {momBat.runs} ({momBat.ballCount}) SR {momBat.sr}
              </p>
            )}
            {momId && (
              <p className="text-gray-300 text-xs">
                Bowling: {momBowl.wickets}-{momBowl.conceded} in {momBowl.overs} Econ {momBowl.econ}
              </p>
            )}
          </div>

          {/* Best Batsman */}
          <div className="bg-white/10 p-4 rounded-xl border border-white/10 transform hover:scale-105 transition-transform">
            <div className="text-2xl mb-2">🏏</div>
            <h4 className="text-white font-bold text-sm uppercase mb-1">Best Batsman</h4>
            <p className="text-white font-bold text-lg">{match.best_batsman_details?.name || '-'}</p>
            {bbId && (
              <p className="text-gray-300 text-xs mt-1">
                {bb.runs} ({bb.ballCount}) • 4s {bb.fours}, 6s {bb.sixes} • SR {bb.sr}
              </p>
            )}
          </div>

          {/* Best Bowler */}
          <div className="bg-white/10 p-4 rounded-xl border border-white/10 transform hover:scale-105 transition-transform">
            <div className="text-2xl mb-2">⚾</div>
            <h4 className="text-white font-bold text-sm uppercase mb-1">Best Bowler</h4>
            <p className="text-white font-bold text-lg">{match.best_bowler_details?.name || '-'}</p>
            {bwId && (
              <p className="text-gray-300 text-xs mt-1">
                {bw.wickets}-{bw.conceded} in {bw.overs} • Econ {bw.econ}
              </p>
            )}
          </div>
        </div>

        <button 
          onClick={() => handleexit()} 
          className="mt-8 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold text-white transition"
        >
          Close Summary
        </button>
      </div>
    </div>
  );
};

export default MatchSummary;
