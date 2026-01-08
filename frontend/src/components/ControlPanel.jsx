import React, { useState } from 'react';
import WicketModal from './WicketModal';

const ControlPanel = ({ onBowl, striker, nonStriker, bowlingTeamPlayers, onUndo }) => {
  const [isWicketModalOpen, setIsWicketModalOpen] = useState(false);

  const handleRun = (runs) => {
    onBowl({ runs_batter: runs, extras: 0, extra_type: 'NONE', is_wicket: false });
  };

  const handleExtra = (type) => {
    // Simplified: 1 run for extra usually.
    onBowl({ runs_batter: 0, extras: 1, extra_type: type, is_wicket: false });
  };

  const confirmWicket = (type, playerOutId, incomingEnd, catcherId) => {
      onBowl({ 
        runs_batter: 0, 
        extras: 0, 
        extra_type: 'NONE', 
        is_wicket: true, 
        wicket_type: type,
        player_out_id: playerOutId,
        incoming_end: incomingEnd,
        catcher_id: catcherId
      });
  };

  return (
    <>
      <div className="bg-black/60 p-4 rounded-xl backdrop-blur-md border border-white/10">
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[0, 1, 2, 3, 4, 6].map(run => (
            <button 
              key={run}
              onClick={() => handleRun(run)}
              className="bg-white text-black font-bold text-xl py-4 rounded-full hover:bg-gray-200 hover:shadow-2xl transition transform hover:scale-105"
            >
              {run}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-2">
          <button onClick={() => handleExtra('WD')} className="border border-white/40 text.white font-bold py-2 rounded-full hover:bg-white hover:text-black transition">WD</button>
          <button onClick={() => handleExtra('NB')} className="border border-white/40 text-white font-bold py-2 rounded-full hover:bg-white hover:text-black transition">NB</button>
          <button onClick={() => handleExtra('B')} className="border border-white/40 text-white font-bold py-2 rounded-full hover:bg-white hover:text-black transition">Bye</button>
          <button onClick={() => handleExtra('LB')} className="border border-white/40 text-white font-bold py-2 rounded-full hover:bg-white hover:text-black transition">LB</button>
          <button onClick={() => setIsWicketModalOpen(true)} className="border border-white/60 text-white font-bold py-2 rounded-full hover:bg-white hover:text-black transition">WICKET</button>
          <button onClick={onUndo} className="border border-red-400 text-red-300 font-bold py-2 rounded-full hover:bg-red-500 hover:text-white transition">UNDO</button>
        </div>
      </div>
      <WicketModal 
        isOpen={isWicketModalOpen} 
        onClose={() => setIsWicketModalOpen(false)} 
        onSubmit={confirmWicket}
        striker={striker}
        nonStriker={nonStriker}
        bowlingTeamPlayers={bowlingTeamPlayers}
      />
    </>
  );
};

export default ControlPanel;
