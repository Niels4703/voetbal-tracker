import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { hasSupabaseConfig, supabase } from './supabase';

const DEFAULT_PLAYERS = [
  { id: 1, name: 'Acro', fetched: 0, present: true, color: 'purple' },
  { id: 2, name: 'Henry', fetched: 0, present: true, color: 'teal' },
  { id: 3, name: 'Michel', fetched: 0, present: false, color: 'cyan' },
  { id: 4, name: 'Niels', fetched: 0, present: false, color: 'violet' },
  { id: 5, name: 'Sander', fetched: 0, present: false, color: 'red' },
  { id: 6, name: 'Robin', fetched: 0, present: false, color: 'blue' },
  { id: 7, name: 'William', fetched: 0, present: false, color: 'orange' },
  { id: 8, name: 'Anne', fetched: 0, present: false, color: 'pink' },
  { id: 9, name: 'Ewout', fetched: 0, present: false, color: 'green' },
  { id: 10, name: 'Gerold', fetched: 0, present: false, color: 'yellow' },
];

function normalizePlayers(players) {
  if (!Array.isArray(players) || players.length === 0) {
    return DEFAULT_PLAYERS;
  }

  return DEFAULT_PLAYERS.map((defaultPlayer) => {
    const savedPlayer = players.find((player) => player.id === defaultPlayer.id);

    if (!savedPlayer) {
      return defaultPlayer;
    }

    return {
      ...defaultPlayer,
      present: Boolean(savedPlayer.present),
      fetched: Math.max(0, Number(savedPlayer.fetched) || 0),
    };
  });
}

function FootballIcon() {
  return <span className="football-icon">⚽</span>;
}

function TrophyIcon() {
  return <span className="trophy-icon">♜</span>;
}

export default function App() {
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [guestCount, setGuestCount] = useState(0);
  const [activeTab, setActiveTab] = useState('match');
  const [syncStatus, setSyncStatus] = useState(hasSupabaseConfig ? 'loading' : 'missing-config');
  const [syncError, setSyncError] = useState('');

  const presentCount = players.filter((player) => player.present).length + guestCount;
  const allActive = presentCount >= 10;

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setSyncStatus('missing-config');
      setSyncError('Voeg VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY toe in .env.local om gedeelde sync te activeren.');
      return;
    }

    let isMounted = true;

    const loadState = async () => {
      try {
        setSyncStatus('loading');
        const { data, error } = await supabase
          .from('match_state')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (!isMounted) return;

        if (!data) {
          const payload = {
            id: 'default',
            players: DEFAULT_PLAYERS,
            guest_count: 0,
            updated_at: new Date().toISOString(),
          };

          const { error: insertError } = await supabase.from('match_state').insert(payload);
          if (insertError) {
            throw insertError;
          }

          setPlayers(DEFAULT_PLAYERS);
          setGuestCount(0);
          setSyncStatus('ready');
          return;
        }

        setPlayers(normalizePlayers(data.players || []));
        setGuestCount(Math.max(0, Number(data.guest_count) || 0));
        setSyncStatus('ready');
      } catch (error) {
        if (!isMounted) return;
        setSyncStatus('error');
        setSyncError(error.message || 'Kon de match-status niet laden.');
      }
    };

    const setupRealtime = async () => {
      const channel = supabase
        .channel('match_state_changes')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'match_state', filter: 'id=eq.default' },
          (payload) => {
            setPlayers(normalizePlayers(payload.new.players || []));
            setGuestCount(Math.max(0, Number(payload.new.guest_count) || 0));
          },
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'match_state', filter: 'id=eq.default' },
          (payload) => {
            setPlayers(normalizePlayers(payload.new.players || []));
            setGuestCount(Math.max(0, Number(payload.new.guest_count) || 0));
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    loadState();
    setupRealtime();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase || syncStatus !== 'ready') {
      return;
    }

    const syncState = async () => {
      try {
        const { error } = await supabase
          .from('match_state')
          .upsert(
            {
              id: 'default',
              players,
              guest_count: guestCount,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' },
          );

        if (error) {
          throw error;
        }
      } catch (error) {
        setSyncStatus('error');
        setSyncError(error.message || 'Kon de match-status niet synchroniseren.');
      }
    };

    syncState();
  }, [players, guestCount, syncStatus]);

  const rankedPlayers = useMemo(() => [...players].sort((a, b) => a.fetched - b.fetched), [players]);

  const togglePresence = (id) => {
    setPlayers((current) => current.map((player) => (
      player.id === id ? { ...player, present: !player.present } : player
    )));
  };

  const changeFetched = (id, amount) => {
    setPlayers((current) => current.map((player) => (
      player.id === id ? { ...player, fetched: Math.max(0, player.fetched + amount) } : player
    )));
  };

  return (
    <main className="phone-shell">
      <div className="status-bar"><span>10:17</span><span className="dynamic-island" /><span className="status-icons">▮▮▮　⌁　▱</span></div>

      {!hasSupabaseConfig && (
        <div className="setup-banner">{syncError}</div>
      )}

      {hasSupabaseConfig && syncStatus === 'error' && (
        <div className="setup-banner">{syncError}</div>
      )}

      {activeTab === 'match' ? (
        <section className="screen match-screen">
          <header className="page-header">
            <div><h1><FootballIcon /> Match Day</h1><p className="event-pill">Dinsdag 20:00 · De Burgthof</p></div>
            <button className="secondary-button" type="button">＋ <span>Speler</span></button>
          </header>

          <section className="turn-card">
            <span className="turn-label">♔ DRANKBEURT DEZE WEEK</span>
            <h2>{allActive ? 'Acro' : 'Niemand aangemeld'}</h2>
            {!allActive && <p>Zet de schakelaar op aanwezig bij een speler om de drankbeurt te bepalen.</p>}
            {allActive && <span className="present-tag">Aanwezig</span>}
          </section>

          <section className={`attendance-card ${allActive ? 'complete' : 'incomplete'}`}>
            <div>
              <strong>AANWEZIGHEID<br />MATCH DAY</strong>
              <div className="attendance-number">{presentCount} <small>/ 10 spelers</small></div>
              <p>{presentCount} vast + {guestCount} gast · {allActive ? 'Complete bezetting voor 5 tegen 5!' : `Nog ${Math.max(0, 10 - presentCount)} nodig voor 10 spelers`}</p>
            </div>
            <span className="attendance-status">{allActive ? '♧ Compleet (≥10)' : '⚠ Te weinig (<10)'}</span>
          </section>

          <div className="list-heading"><h3>Aanwezigheid &amp;<br />Beurtvolgorde</h3><span>Volgorde op laagste<br />ratio</span></div>
          <div className="players-list">
            <div className="guest-row">
              <span className="people-icon">♧</span>
              <div className="player-info"><b>Gastspelers /<br />Invallers</b><span>Tellen mee voor<br />opkomst</span></div>
              <span className="minus-label">-1</span>
              <span className="guest-count">{guestCount} gasten</span>
              <button className="round-button" type="button" onClick={() => setGuestCount((count) => count + 1)}>+1</button>
            </div>
            {players.map((player) => (
              <PlayerRow key={player.id} player={player} togglePresence={togglePresence} changeFetched={changeFetched} />
            ))}
          </div>
        </section>
      ) : (
        <Standings players={rankedPlayers} setActiveTab={setActiveTab} />
      )}

      <nav className="bottom-nav">
        <button className={activeTab === 'match' ? 'active' : ''} type="button" onClick={() => setActiveTab('match')}><FootballIcon /><span>Match Day</span></button>
        <button className={activeTab === 'stand' ? 'active' : ''} type="button" onClick={() => setActiveTab('stand')}><TrophyIcon /><span>Stand</span></button>
      </nav>
    </main>
  );
}

function PlayerRow({ player, togglePresence, changeFetched }) {
  return (
    <div className="player-row">
      <button className={`toggle ${player.present ? 'on' : ''}`} onClick={() => togglePresence(player.id)} type="button" aria-label={`Aanwezigheid ${player.name}`}>
        <span />
      </button>
      <div className="player-info">
        <b>{player.name}</b>
        <span>{player.fetched}x gehaald · ratio {player.fetched.toFixed(2)}</span>
      </div>
      <span className="minus-label">-1</span>
      <button className="beer-count" type="button" onClick={() => changeFetched(player.id, -1)}>-1</button>
      <button className="beer-count" type="button" onClick={() => changeFetched(player.id, 0)}>{player.fetched}x 🍺</button>
      <button className="round-button" type="button" onClick={() => changeFetched(player.id, 1)}>+1</button>
    </div>
  );
}

function Standings({ players, setActiveTab }) {
  return (
    <section className="screen standings-screen">
      <header className="stand-header">
        <div><h1>Drankstand</h1><p>Ranglijst op basis van beurt-ratio</p></div>
        <button className="secondary-button" type="button" onClick={() => setActiveTab('match')}>Match Day →</button>
      </header>

      <div className="next-player">
        <span className="beer-avatar">🍺</span>
        <div>
          <strong>EERST AAN DE BEURT</strong>
          <b>{players[0].name} <small>(0% beurt-ratio)</small></b>
        </div>
        <span>0x gehaald</span>
      </div>

      <div className="stat-grid">
        <div>Gem. beurt-ratio<strong>0%</strong><small>Lager = sneller aan de beurt</small></div>
        <div>Actieve spelers<strong>18</strong><small>In de zaalvoetbalgroep</small></div>
      </div>

      <div className="ranking-title">
        <h2>Ranglijst (laag naar hoog)</h2>
        <p>Wie de laagste ratio heeft betaalt of haalt de volgende bak na de wedstrijd.</p>
      </div>

      <div className="ranking-list">
        {players.map((player, index) => (
          <div className="ranking-row" key={player.id}>
            <em>{index + 1}</em>
            <span className={`initial ${player.color}`}>{player.name[0]}</span>
            <div>
              <b>{player.name}</b>
              <small>0x gehaald · 0 duels gespeeld</small>
            </div>
            <strong>0.00<small>0% ratio</small></strong>
          </div>
        ))}
      </div>
    </section>
  );
}
