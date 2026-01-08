import React from 'react';

const BattingCard = ({ match, innings, striker, setStriker, nonStriker, setNonStriker }) => {
  if (!innings) return <div className="bg-white/5 p-4 rounded-xl">Waiting for Innings...</div>;

  const battingTeamId = innings.batting_team;
  const battingTeam = match.team_a === battingTeamId ? match.team_a_details : match.team_b_details;
  const players = battingTeam.players;

  // Helper to get dismissal info for a player
  const getDismissalInfo = (playerId) => {
    const wicketBall = innings.deliveries?.find(d => d.is_wicket && d.player_out === playerId);
    if (!wicketBall) return null;

    const type = wicketBall.wicket_type;
    // Find bowler name from the team details
    const bowlingTeam = match.team_a === innings.bowling_team ? match.team_a_details : match.team_b_details;
    const bowler = bowlingTeam.players.find(p => p.id === wicketBall.bowler);
    const bowlerName = bowler ? bowler.name : 'bowler';
    const catcher = wicketBall.catcher ? bowlingTeam.players.find(p => p.id === wicketBall.catcher) : null;
    const catcherName = catcher ? catcher.name : null;

    switch (type) {
      case 'BOWLED': return `b ${bowlerName}`;
      case 'CAUGHT': return catcherName ? `c ${catcherName} b ${bowlerName}` : `c b ${bowlerName}`;
      case 'LBW': return `lbw b ${bowlerName}`;
      case 'STUMPED': return `st b ${bowlerName}`;
      case 'RUN_OUT': return `run out`;
      case 'HIT_WICKET': return `hit wicket b ${bowlerName}`;
      default: return 'out';
    }
  };

  const getStats = (playerId) => {
    if (!innings.deliveries) return { runs: 0, balls: 0, fours: 0, sixes: 0 };
    const ballsFaced = innings.deliveries.filter(d => d.batsman === playerId);
    const runs = ballsFaced.reduce((sum, d) => sum + d.runs_batter, 0);
    const balls = ballsFaced.filter(d => d.extra_type !== 'WD').length;
    const fours = ballsFaced.filter(d => d.runs_batter === 4).length;
    const sixes = ballsFaced.filter(d => d.runs_batter === 6).length;
    return { runs, balls, fours, sixes };
  };

  const outPlayerIds = innings?.deliveries
    ?.filter(d => d.is_wicket && d.player_out)
    .map(d => d.player_out) || [];

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
      <h3 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">Batting Scorecard</h3>
      
      <div className="grid grid-cols-12 text-xs text-gray-400 mb-2 uppercase font-bold">
        <div className="col-span-6">Batsman</div>
        <div className="col-span-1 text-center">R</div>
        <div className="col-span-1 text-center">B</div>
        <div className="col-span-1 text-center">4s</div>
        <div className="col-span-1 text-center">6s</div>
        <div className="col-span-2 text-center">SR</div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {players.map(player => {
          const stats = getStats(player.id);
          const isStriker = striker?.id === player.id;
          const isNonStriker = nonStriker?.id === player.id;
          const dismissal = getDismissalInfo(player.id);
          const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : '0.0';

          return (
            <div key={player.id} className={`grid grid-cols-12 items-start p-2 rounded ${isStriker || isNonStriker ? 'bg-white/10' : ''}`}>
              <div className="col-span-6 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${dismissal ? 'text-gray-400' : 'text-white'} truncate`}>
                    {player.name}
                  </span>
                  {isStriker && <span className="text-yellow-400 text-xs">★</span>}
                </div>
                {/* Dismissal Text Below Name */}
                {dismissal && (
                  <div className="text-[10px] text-red-400 italic leading-tight mt-0.5 break-words">
                    {dismissal}
                  </div>
                )}
                {!dismissal && (isStriker || isNonStriker) && (
                   <div className="text-[10px] text-green-400 font-bold mt-0.5 uppercase tracking-tighter">
                    Batting
                   </div>
                )}
              </div>
              <div className="col-span-1 text-center font-bold">{stats.runs}</div>
              <div className="col-span-1 text-center">{stats.balls}</div>
              <div className="col-span-1 text-center text-gray-400">{stats.fours}</div>
              <div className="col-span-1 text-center text-gray-400">{stats.sixes}</div>
              <div className="col-span-2 text-center text-gray-400">{sr}</div>
            </div>
          );
        })}
      </div>

    <div className="mt-4 grid grid-cols-2 gap-4">
  <div>
    <label className="text-xs text-gray-400">Striker (Active Batsman)</label>
    <select 
      className="w-full bg-black/30 rounded p-2 text-sm border border-yellow-500/50"
      value={striker?.id || ''}
      onChange={(e) => {
  const val = e.target.value;
  // Use == to match string/number IDs or cast to Number
  const player = players.find(p => p.id == val); 
  setStriker(player || null);
}}
    >
      <option value="">Select Striker</option>
      {players.map(p => (
        <option 
          key={p.id} 
          value={p.id} 
          disabled={outPlayerIds.includes(p.id)}
        >
          {p.name} {outPlayerIds.includes(p.id) ? '(Out)' : ''}
        </option>
      ))}
    </select>
  </div>
  
  <div>
    <label className="text-xs text-gray-400">Non-Striker (Optional)</label>
    <select 
      className="w-full bg-black/30 rounded p-2 text-sm border border-white/10"
      value={nonStriker?.id || ''}
      onChange={(e) => {
  const val = e.target.value;
  const player = players.find(p => p.id == val);
  setNonStriker(player || null);
}}
    >
      <option value="">No Non-Striker (Solo)</option>
      {players.map(p => (
        <option 
          key={p.id} 
          value={p.id} 
          disabled={striker?.id === p.id || outPlayerIds.includes(p.id)}
        >
          {p.name} {outPlayerIds.includes(p.id) ? '(Out)' : ''}
        </option>
      ))}
    </select>
  </div>
</div>
    </div>
  );
};

export default BattingCard;
