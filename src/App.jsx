import { useState } from 'react';

export default function App() {
  // Dit is onze tijdelijke 'dummy' data om het scherm te vullen
  const [players, setPlayers] = useState([
    { id: 1, name: 'Acro', fetched: 0, ratio: 0.00, present: true },
    { id: 2, name: 'Henry', fetched: 0, ratio: 0.00, present: true },
    { id: 3, name: 'Michel', fetched: 0, ratio: 0.00, present: false },
    { id: 4, name: 'Niels', fetched: 0, ratio: 0.00, present: false },
  ]);

  // Bereken hoeveel spelers er op 'aanwezig' staan
  const presentCount = players.filter(p => p.present).length;

  // Functie om de schakelaar om te zetten
  const togglePresence = (id) => {
    setPlayers(players.map(p => 
      p.id === id ? { ...p, present: !p.present } : p
    ));
  };

  return (
    <div className="min-h-screen bg-app-bg text-white p-4 font-sans pb-24">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pt-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-app-green">⚽</span> Match Day
          </h1>
          <p className="text-gray-400 text-sm">Dinsdag 20:00 · De Burgthof</p>
        </div>
        <button className="bg-app-card px-3 py-1.5 rounded-lg text-sm border border-gray-700">
          + Speler
        </button>
      </div>

      {/* Grote Groene Kaart: Wie is er aan de beurt? */}
      <div className="bg-app-green rounded-2xl p-5 mb-4 shadow-lg shadow-app-green/20 relative overflow-hidden">
        <div className="text-green-900 font-bold text-xs mb-2 tracking-wider">DRANKBEURT DEZE WEEK</div>
        <h2 className="text-4xl font-extrabold text-white">Acro</h2>
      </div>

      {/* Aanwezigheid Status Kaart */}
      <div className="bg-app-card border border-app-green/30 rounded-2xl p-4 mb-6">
         <div className="text-app-green font-bold text-xs mb-1 uppercase tracking-wider">Aanwezigheid Match Day</div>
         <div className="flex justify-between items-end">
            <div>
                <span className="text-2xl font-bold text-app-green">{presentCount}</span>
                <span className="text-app-green"> / 10 spelers</span>
            </div>
            {presentCount >= 10 ? (
              <div className="bg-app-green/20 text-app-green px-2 py-1 rounded text-xs font-semibold">
                Compleet (≥10)
              </div>
            ) : (
              <div className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs font-semibold">
                Te weinig (&lt;10)
              </div>
            )}
         </div>
      </div>

      {/* Titel boven de lijst */}
      <div className="flex justify-between items-end mb-4">
        <h3 className="font-bold text-lg leading-tight">Aanwezigheid &<br/>Beurtvolgorde</h3>
        <span className="text-gray-400 text-xs text-right">Volgorde op laagste<br/>ratio</span>
      </div>

      {/* Spelerslijst met schakelaars */}
      <div className="bg-app-card rounded-2xl overflow-hidden">
        {players.map(player => (
          <div key={player.id} className="flex items-center justify-between p-4 border-b border-gray-800 last:border-0">
            <div className="flex items-center gap-3">
              
              {/* De Schakelaar (Toggle) */}
              <button
                onClick={() => togglePresence(player.id)}
                className={`w-12 h-6 rounded-full transition-colors relative ${player.present ? 'bg-app-green' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${player.present ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
              </button>
              
              <div>
                <div className="font-bold text-base">{player.name}</div>
                <div className="text-xs text-gray-400">{player.fetched}x gehaald · ratio {player.ratio.toFixed(2)}</div>
              </div>
            </div>
            
            {/* Knoppen om bier-aantal aan te passen */}
            <div className="flex items-center gap-2">
               <button className="bg-[#2a2a2a] w-8 h-8 rounded-lg flex items-center justify-center text-gray-400">-1</button>
               <div className="text-sm w-[45px] text-center text-gray-400">{player.fetched}x 🍺</div>
               <button className="bg-[#2a2a2a] w-8 h-8 rounded-lg flex items-center justify-center text-white">+1</button>
            </div>
          </div>
        ))}
      </div>

      {/* Navigatiebalk onderaan */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-app-card border border-gray-700 rounded-full px-8 py-3 flex gap-10 shadow-2xl z-50">
        <button className="flex flex-col items-center text-app-green">
           <span className="text-xl">⚽</span>
           <span className="text-[10px] mt-1 font-medium">Match Day</span>
        </button>
        <button className="flex flex-col items-center text-gray-500">
           <span className="text-xl">🏆</span>
           <span className="text-[10px] mt-1 font-medium">Stand</span>
        </button>
      </div>

    </div>
  );
}