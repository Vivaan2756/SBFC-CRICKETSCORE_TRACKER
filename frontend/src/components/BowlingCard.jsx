import React from 'react';

const BowlingCard = ({ match, innings, bowler, setBowler }) => {
  if (!innings) return <div className="bg-white/5 p-4 rounded-xl">Waiting for Innings...</div>;

  const bowlingTeamId = innings.bowling_team;
  // Find team object
  const bowlingTeam = match.team_a === bowlingTeamId ? match.team_a_details : match.team_b_details;
  const players = bowlingTeam.players;

  // Compute previous over bowler from last legal ball
  const deliveries = innings.deliveries || [];
  const lastLegal = [...deliveries].reverse().find(d => !['WD', 'NB'].includes(d.extra_type));
  const prevOverBowlerId = lastLegal ? lastLegal.bowler : null;
  const legalCount = deliveries.filter(d => !['WD', 'NB'].includes(d.extra_type)).length;
  const startOfOver = legalCount % 6 === 0;

  const getStats = (playerId) => {
    if (!innings.deliveries) return { overs: 0, maidens: 0, runs: 0, wickets: 0 };
    
    const ballsBowled = innings.deliveries.filter(d => d.bowler === playerId);
    
    // Valid balls for overs count (exclude WD, NB)
    const validBalls = ballsBowled.filter(d => !['WD', 'NB'].includes(d.extra_type)).length;
    const overs = Math.floor(validBalls / 6);
    const balls = validBalls % 6;
    const oversDisplay = `${overs}.${balls}`;
    
    // Runs conceded: batter runs + extras (if bowled by bowler: WD, NB count, Byes/LB don't)
    // Simplified: All extras count against bowler in T20 usually except Byes/LB.
    const runsConceded = ballsBowled.reduce((sum, d) => {
        let r = d.runs_batter;
        if (['WD', 'NB'].includes(d.extra_type)) r += d.extras;
        return sum + r;
    }, 0);
    
    const wickets = ballsBowled.filter(d => d.is_wicket && d.wicket_type !== 'RUN_OUT').length;
    
    return { overs: oversDisplay, maidens: 0, runs: runsConceded, wickets };
  };

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
      <h3 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">Bowling Scorecard</h3>
      
      <div className="grid grid-cols-12 text-xs text-gray-400 mb-2 uppercase font-bold">
        <div className="col-span-6">Bowler</div>
        <div className="col-span-1 text-center">O</div>
        <div className="col-span-1 text-center">M</div>
        <div className="col-span-1 text-center">R</div>
        <div className="col-span-1 text-center">W</div>
        <div className="col-span-2 text-center">Econ</div>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {players.map(player => {
          const stats = getStats(player.id);
          // Filter out bowlers who haven't bowled yet unless active
          if (stats.overs === "0.0" && bowler?.id !== player.id) return null;
          
          const isCurrentBowler = bowler?.id === player.id;
          
          return (
            <div key={player.id} className={`grid grid-cols-12 items-center p-2 rounded ${isCurrentBowler ? 'bg-white/10' : ''}`}>
              <div className="col-span-6 flex items-center gap-2 min-w-0">
                <span className="truncate">{player.name}</span>
                {isCurrentBowler && <span className="text-white text-xs">●</span>}
              </div>
              <div className="col-span-1 text-center">{stats.overs}</div>
              <div className="col-span-1 text-center text-gray-400">{stats.maidens}</div>
              <div className="col-span-1 text-center">{stats.runs}</div>
              <div className="col-span-1 text-center font-bold">{stats.wickets}</div>
              <div className="col-span-2 text-center text-gray-400">-</div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <label className="text-xs text-gray-300">Current Bowler</label>
        <select 
          className="w-full bg-black/40 text-white rounded p-2 text-sm border border-white/20 hover:border-white/40 transition"
          value={bowler?.id || ''}
          onChange={(e) => setBowler(players.find(p => p.id === parseInt(e.target.value)))}
        >
          <option value="">Select Bowler</option>
          {players
            .filter(p => !(startOfOver && prevOverBowlerId && p.id === prevOverBowlerId))
            .map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
        </select>
        {startOfOver && prevOverBowlerId && (
          <p className="mt-2 text-[11px] text-gray-400">New over: previous bowler cannot bowl.</p>
        )}
      </div>
    </div>
  );
};

export default BowlingCard;
