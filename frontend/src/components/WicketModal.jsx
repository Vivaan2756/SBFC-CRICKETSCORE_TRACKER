import React, { useState } from 'react';

const WicketModal = ({ isOpen, onClose, onSubmit, striker, nonStriker, bowlingTeamPlayers = [] }) => {
  const [wicketType, setWicketType] = useState('BOWLED');
  const [playerOutId, setPlayerOutId] = useState(null);
  const [incomingEnd, setIncomingEnd] = useState('STRIKER');
  const [catcherId, setCatcherId] = useState(null);

  // Reset playerOutId when modal opens or striker changes
  React.useEffect(() => {
    if (isOpen) {
      const defaultOut = striker?.id ?? null;
      setPlayerOutId(defaultOut);
      setIncomingEnd(defaultOut === striker?.id ? 'STRIKER' : 'NON_STRIKER');
    }
  }, [isOpen, striker]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(wicketType, playerOutId, incomingEnd, catcherId);
    onClose();
  };

  const types = ['BOWLED', 'CAUGHT', 'LBW', 'RUN_OUT', 'STUMPED', 'HIT_WICKET'];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-green-800 p-6 rounded-2xl max-w-sm w-full border border-white/20 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Wicket Details</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-green-200 text-sm font-semibold mb-2">Wicket Type</label>
            <div className="grid grid-cols-2 gap-2">
              {types.map(type => (
                <button
                  key={type}
                  onClick={() => setWicketType(type)}
                  className={`py-2 rounded text-sm font-bold transition-all ${wicketType === type ? 'bg-red-600 text-white' : 'bg-black/30 hover:bg-black/40 text-gray-300'}`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Updated RUN_OUT section to handle Solo Batting */}
          {wicketType === 'RUN_OUT' && (
            <div className="animate-fade-in">
              <label className="block text-green-200 text-sm font-semibold mb-2">Who is Out?</label>
              <div className={`grid ${nonStriker ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                <button
                  onClick={() => setPlayerOutId(striker?.id)}
                  className={`py-3 rounded text-sm font-bold border-2 transition-all ${playerOutId === striker?.id ? 'bg-red-600 border-white text-white' : 'bg-black/30 border-transparent text-gray-300'}`}
                >
                  Striker: {striker?.name || 'Unknown'}
                </button>
                
                {/* Only show Non-Striker button if they exist */}
                {nonStriker && (
                  <button
                    onClick={() => setPlayerOutId(nonStriker.id)}
                    className={`py-3 rounded text-sm font-bold border-2 transition-all ${playerOutId === nonStriker.id ? 'bg-red-600 border-white text-white' : 'bg-black/30 border-transparent text-gray-300'}`}
                  >
                    Non-Striker: {nonStriker.name}
                  </button>
                )}
              </div>
              <label className="block text-green-200 text-sm font-semibold mt-4 mb-2">Incoming Batsman End</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIncomingEnd('STRIKER')}
                  className={`py-3 rounded text-sm font-bold border-2 transition-all ${incomingEnd === 'STRIKER' ? 'bg-blue-600 border-white text-white' : 'bg-black/30 border-transparent text-gray-300'}`}
                >
                  Batting End
                </button>
                <button
                  onClick={() => setIncomingEnd('NON_STRIKER')}
                  className={`py-3 rounded text-sm font-bold border-2 transition-all ${incomingEnd === 'NON_STRIKER' ? 'bg-blue-600 border-white text-white' : 'bg-black/30 border-transparent text-gray-300'}`}
                >
                  Bowling End
                </button>
              </div>
            </div>
          )}
          
          {wicketType === 'CAUGHT' && (
            <div className="animate-fade-in">
              <label className="block text-green-200 text-sm font-semibold mb-2">Who took the catch?</label>
              <select
                value={catcherId || ''}
                onChange={(e) => setCatcherId(parseInt(e.target.value))}
                className="w-full bg-black/30 rounded p-2 text-sm"
              >
                <option value="">Select Catcher</option>
                {bowlingTeamPlayers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-600 text-white font-bold py-2 rounded-lg hover:bg-gray-500"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-500"
          >
            Confirm Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default WicketModal;
