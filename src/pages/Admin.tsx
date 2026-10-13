import { useState, useEffect } from "react";
import { RefreshCw, LogOut, Loader2, Lock } from "lucide-react";
import { api } from "../services/api";
import type { Game, NewGameData } from "../services/api";
import Marquee from "../components/Marquee";
import AddGameForm from "../components/AddGameForm";
import GameList from "../components/GameList";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [players, setPlayers] = useState<string[]>([]);
  const [guests, setGuests] = useState<string[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsVerifying(true);

    try {
      const isValid = await api.verifyPassword(password);
      if (isValid) {
        setIsAuthenticated(true);
        loadData();
      } else {
        setLoginError("Ogiltigt lösenord");
        setPassword("");
      }
    } catch {
      setLoginError("Kunde inte verifiera lösenord");
    } finally {
      setIsVerifying(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [playersData, gamesData] = await Promise.all([
        api.getPlayers(),
        api.getGames(),
      ]);

      setPlayers(playersData.players);
      setGuests(playersData.guests);
      const sortedGames = [...gamesData].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setGames(sortedGames);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte ladda data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddGame = async (gameData: NewGameData) => {
    await api.addGame(gameData);
    await loadData();
  };

  const handleDeleteGame = async (id: string) => {
    if (!window.confirm("Är du säker på att du vill ta bort denna match?")) {
      return;
    }

    try {
      await api.deleteGame(id, password);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kunde inte ta bort match");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    setPlayers([]);
    setGuests([]);
    setGames([]);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container">
        <Marquee />
        <form className="cabinet glow-pink admin-login" onSubmit={handleLogin}>
          <div className="crt">
            <div className="screen-head">
              <h1 className="screen-title">
                <Lock size={22} /> Adminpanel
              </h1>
            </div>
            <label className="field">
              Lösenord
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ange adminlösenord"
                autoFocus
              />
            </label>
            {loginError && (
              <div className="message message-error">{loginError}</div>
            )}
          </div>
          <div className="cabinet-deck">
            <button
              type="submit"
              disabled={isVerifying || !password}
              className="arcade-btn arcade-btn-wide"
            >
              {isVerifying ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Verifierar...
                </>
              ) : (
                "Logga in"
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="container admin">
      <Marquee />
      <div className="admin-bar">
        <h1 className="screen-title">Adminpanel</h1>
        <div className="admin-bar-actions">
          <button onClick={loadData} className="arcade-btn arcade-btn-ghost">
            <RefreshCw size={16} />
            Uppdatera data
          </button>
          <button onClick={handleLogout} className="arcade-btn arcade-btn-ghost">
            <LogOut size={16} />
            Logga ut
          </button>
        </div>
      </div>

      {loading && players.length === 0 && (
        <div className="state-screen">
          <p className="state-loading">Laddar...</p>
        </div>
      )}
      {error && <div className="message message-error">{error}</div>}

      {/* stays mounted while data refreshes, so the form keeps its confirmation */}
      {!error && players.length > 0 && (
        <>
          <AddGameForm
            players={[...players, ...guests]}
            onSubmit={handleAddGame}
            password={password}
          />
          <GameList
            games={games}
            title={`Alla matcher (${games.length})`}
            onDelete={handleDeleteGame}
            showDelete={true}
          />
        </>
      )}
    </div>
  );
}
