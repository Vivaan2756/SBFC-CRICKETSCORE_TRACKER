import React, { useState, useEffect } from 'react';
import BattingCard from './BattingCard';
import BowlingCard from './BowlingCard';
import ControlPanel from './ControlPanel';
import axios from 'axios';

const Scoreboard = ({ match, onUpdate }) => {
  const currentInnings = match.innings.find(i => !i.is_completed) || match.innings[match.innings.length - 1];
  const isMatchComplete = match.status === 'COMPLETED';
  const maxOvers = match.custom_overs ? match.custom_overs : (match.format === 'T20' ? 20 : null);

  // State for current players
  const [striker, setStriker] = useState(null);
  const [nonStriker, setNonStriker] = useState(null);
  const [bowler, setBowler] = useState(null);
  const [showEndOfOver, setShowEndOfOver] = useState(false);
  const [showFire, setShowFire] = useState(false);
  const [fireName, setFireName] = useState('');
  const [showHattrick, setShowHattrick] = useState(false);
  const [hattrickName, setHattrickName] = useState('');
  
  // Derived state from deliveries
  useEffect(() => {
    if (currentInnings && currentInnings.deliveries && currentInnings.deliveries.length > 0) {
      const lastBall = currentInnings.deliveries[currentInnings.deliveries.length - 1];
      
      // Determine who is striker/non-striker based on last ball events
      // If run scored (odd), they swap.
      // If over changed, they swap? No, strike changes on over end.
      // Actually, relying on last ball might be complex because of swaps.
      // Simplest: The user sets them initially, and we update them locally after each ball, 
      // and re-sync if needed.
      // BUT, if we reload page, we lose state.
      // Better: Use the IDs from last delivery.
      
      // For now, if state is null, try to set from last ball.
      if (!striker) {
        // Logic to find current not-out batsmen is hard without backend help.
        // Let's assume for MVP: User must select if null.
        // Or simple heuristic: Last batsman and non-striker are still there unless out.
        if (lastBall.player_out) {
           // One of them is out.
        }
      }
    }
 }, [currentInnings]);

 const handleBowl = async (deliveryData) => {
    // 1. Calculate the CURRENT state before the new ball is processed
   const totalWickets = currentInnings ? currentInnings.total_wickets : 0;
   const battingTeamId = currentInnings ? currentInnings.batting_team : null;
   const teamDetails = battingTeamId ? (match.team_a === battingTeamId ? match.team_a_details : match.team_b_details) : null;
   const teamSize = teamDetails ? (teamDetails.players?.length || 0) : 0;
   const isLastManStanding = (match?.last_man_standing === true) && totalWickets >= Math.max(0, teamSize - 1);

   // 2. REFINED VALIDATION: Allow null nonStriker only if we are in solo mode
   if (!striker || (!nonStriker && !isLastManStanding) || !bowler) {
     alert("Please select Batters and Bowler first!");
     return;
   }

   // 3. Enforce new bowler at the start of each over
   const allDeliveries = currentInnings.deliveries || [];
   const legalBalls = allDeliveries.filter(d => !['WD', 'NB'].includes(d.extra_type)).length;
   const startOfOver = legalBalls % 6 === 0;
   const lastLegal = [...allDeliveries].reverse().find(d => !['WD', 'NB'].includes(d.extra_type));
   const prevOverBowlerId = lastLegal ? lastLegal.bowler : null;
   if (startOfOver && prevOverBowlerId && bowler.id === prevOverBowlerId) {
     alert("New over: select a different bowler.");
     return;
   }

   try {
     const payload = {
       ...deliveryData,
       batsman_id: striker.id,
       non_striker_id: nonStriker ? nonStriker.id : striker.id,
       bowler_id: bowler.id,
     };
      
      // Calculate over/ball logic
      const legalBalls = currentInnings.deliveries.filter(d => !['WD', 'NB'].includes(d.extra_type)).length;
      payload.over_number = Math.floor(legalBalls / 6);
      payload.ball_number = (legalBalls % 6) + 1;

      await axios.post(`http://localhost:8000/api/matches/${match.id}/bowl/`, payload);
      
      // --- WICKET HANDLING ---
      if (payload.is_wicket) {
        if (payload.player_out_id) {
          const survivor = (striker && payload.player_out_id === striker.id) ? nonStriker : striker;
          const incomingEnd = payload.incoming_end || ((striker && payload.player_out_id === striker.id) ? 'STRIKER' : 'NON_STRIKER');
          if (incomingEnd === 'STRIKER') {
            setStriker(null);
            setNonStriker(survivor || null);
          } else {
            setNonStriker(null);
            setStriker(survivor || null);
          }
        } else {
          setStriker(null); 
        }
      } else {
        // --- STRIKE ROTATION ---
        // Only swap if there is actually someone to swap with
        if (nonStriker) { 
          // Swap on odd runs
          if (payload.runs_batter % 2 !== 0) {
            setStriker(nonStriker);
            setNonStriker(striker);
          }

          // Swap at End of Over
          if (!['WD', 'NB'].includes(payload.extra_type)) {
             if ((legalBalls + 1) % 6 === 0) {
               setStriker(nonStriker);
               setNonStriker(striker);
               setBowler(null); 
               setShowEndOfOver(true);
             }
          }
        } else {
          // SOLO BATTING: Only reset the bowler, don't attempt to swap strikers
          if (!['WD', 'NB'].includes(payload.extra_type) && (legalBalls + 1) % 6 === 0) {
            setBowler(null);
            setShowEndOfOver(true);
          }
        }
      }
      
      const nextDeliveries = [
        ...(currentInnings.deliveries || []),
        {
          runs_batter: payload.runs_batter || 0,
          extras: payload.extras || 0,
          extra_type: payload.extra_type || 'NONE',
          is_wicket: !!payload.is_wicket,
          wicket_type: payload.wicket_type,
          batsman: striker.id,
          bowler: bowler.id
        }
      ];
      const batsmanBalls = nextDeliveries.filter(d => d.batsman === striker.id && !['WD','NB'].includes(d.extra_type));
      const lastThreeBatsman = batsmanBalls.slice(-3);
      if (lastThreeBatsman.length === 3 && lastThreeBatsman.every(d => d.runs_batter === 6)) {
        setFireName(striker.name || 'Batsman');
        setShowFire(true);
        setTimeout(() => setShowFire(false), 2000);
      }
      const bowlerBalls = nextDeliveries.filter(d => d.bowler === bowler.id && !['WD','NB'].includes(d.extra_type));
      const lastThreeBowler = bowlerBalls.slice(-3);
      if (lastThreeBowler.length === 3 && lastThreeBowler.every(d => d.is_wicket && d.wicket_type !== 'RUN_OUT')) {
        setHattrickName(bowler.name || 'Bowler');
        setShowHattrick(true);
        setTimeout(() => setShowHattrick(false), 2000);
      }
      
      onUpdate(); // Trigger parent refresh to get new wicket count from backend
    } catch (error) {
      console.error(error);
      alert("Error recording ball");
    }
  };
  
  const handleUndo = async () => {
    try {
      await axios.post(`http://localhost:8000/api/matches/${match.id}/undo/`);
      setShowEndOfOver(false);
      setShowFire(false);
      setShowHattrick(false);
      onUpdate();
    } catch (error) {
      console.error(error);
      alert("Error undoing last ball");
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Header Stats */}
      <div className="md:col-span-2 bg-white/10 p-3 md:p-4 rounded-xl flex justify-between items-center backdrop-blur-md gap-3 flex-wrap">
        <div className="min-w-0">
           <h2 className="text-2xl md:text-4xl font-bold">
             {currentInnings ? currentInnings.total_runs : 0}/{currentInnings ? currentInnings.total_wickets : 0}
           </h2>
           <p className="text-gray-300 text-sm md:text-base">Overs: {currentInnings ? currentInnings.overs_bowled : 0}</p>
           {currentInnings && currentInnings.innings_number === 2 && (
             <>
               {(() => {
                 const firstInn = match.innings.find(i => i.innings_number === 1);
                 const target = (firstInn?.total_runs || 0) + 1;
                 const deliveries = currentInnings.deliveries || [];
                 const legal = deliveries.filter(d => !['WD','NB'].includes(d.extra_type)).length;
                 const totalBalls = maxOvers ? maxOvers * 6 : null;
                 const ballsLeft = totalBalls !== null ? Math.max(totalBalls - legal, 0) : null;
                 const runsNeeded = Math.max(target - (currentInnings.total_runs || 0), 0);
                 return (
                   <div className="mt-1">
                     <p className="text-sm md:text-base font-semibold">Target: {target}</p>
                     {ballsLeft !== null && (
                       <p className="text-xs md:text-sm text-gray-300">Needs {runsNeeded} from {ballsLeft} balls</p>
                     )}
                   </div>
                 );
               })()}
             </>
           )}
        </div>
        <div className="text-right min-w-0">
          <p className="text-lg md:text-xl font-bold break-words">{currentInnings ? currentInnings.batting_team_name : 'Batting'}</p>
          <p className="text-xs md:text-sm text-gray-400">Run Rate: {currentInnings && currentInnings.overs_bowled > 0 ? (currentInnings.total_runs / currentInnings.overs_bowled).toFixed(2) : '0.00'}</p>
        </div>
      </div>

      <BattingCard 
        match={match} 
        innings={currentInnings} 
        striker={striker} 
        setStriker={setStriker}
        nonStriker={nonStriker}
        setNonStriker={setNonStriker}
      />
      
      <BowlingCard 
        match={match} 
        innings={currentInnings} 
        bowler={bowler}
        setBowler={setBowler}
      />

      <div className="md:col-span-2 bg-white/5 p-4 rounded-xl border border-white/10">
        <h3 className="text-sm font-bold mb-2 text-gray-400 uppercase">Recent Balls</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {currentInnings && currentInnings.deliveries && [...currentInnings.deliveries].reverse().slice(0, 12).map((ball, idx) => {
            const label = ball.is_wicket
              ? 'W'
              : (ball.extra_type === 'WD' ? 'WD'
                : (ball.extra_type === 'NB' ? 'NB'
                  : (ball.extra_type === 'B' ? 'B'
                    : (ball.extra_type === 'LB' ? 'LB'
                      : String(ball.runs_batter)))));
            return (
              <div key={idx} className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm border border-white/20">
                {label}
              </div>
            );
          })}
          {(!currentInnings || !currentInnings.deliveries || currentInnings.deliveries.length === 0) && <span className="text-gray-500 text-sm">No balls bowled yet</span>}
        </div>
      </div>

      {!isMatchComplete && (
        <div className="md:col-span-2">
          <ControlPanel 
            onBowl={handleBowl} 
            striker={striker}
            nonStriker={nonStriker}
            bowlingTeamPlayers={(match.team_a === (currentInnings?.bowling_team) ? match.team_a_details : match.team_b_details)?.players || []}
            onUndo={handleUndo}
          />
        </div>
      )}

      {/* End of Over Notification */}
      {showEndOfOver && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-8 rounded-2xl border border-white/20 shadow-2xl text-center transform scale-110 transition-transform">
            <h2 className="text-4xl font-extrabold text-white mb-2 tracking-wider">END OF OVER</h2>
            <div className="w-16 h-1 bg-yellow-400 mx-auto mb-6 rounded-full"></div>
            <p className="text-blue-200 mb-8 text-lg">Time to switch ends and choose a new bowler.</p>
            <button 
              onClick={() => setShowEndOfOver(false)}
              className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}
      
      {showFire && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
          <div className="p-8 rounded-2xl border border-white/20 shadow-2xl text-center bg-gradient-to-br from-red-800 via-orange-700 to-yellow-600 animate-pulse">
            <div className="text-5xl md:text-6xl font-extrabold text-white mb-2">{fireName}</div>
            <div className="text-2xl md:text-3xl font-bold text-yellow-200">ON FIRE! 🔥🔥🔥</div>
          </div>
        </div>
      )}
      
      {showHattrick && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
          <div className="p-8 rounded-2xl border border-white/20 shadow-2xl text-center bg-gradient-to-br from-green-800 to-emerald-600">
            <div className="text-5xl md:text-6xl font-extrabold text-white mb-2">{hattrickName}</div>
            <div className="text-2xl md:text-3xl font-bold text-green-200">HATTRICK! 🎯🎯🎯</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scoreboard;
