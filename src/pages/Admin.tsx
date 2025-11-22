import { useState, useEffect } from "react";
import { api } from "../services/api";
import type { Game, NewGameData, UnplayedGame } from "../services/api";
import AddGameForm from "../components/AddGameForm";
import GameList from "../components/GameList";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [players, setPlayers] = useState<string[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [unplayedGames, setUnplayedGames] = useState<UnplayedGame[]>([]);
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

      const [playersData, gamesData, unplayedData] = await Promise.all([
        api.getPlayers(),
        api.getGames(),
        api.getUnplayedGames(),
      ]);

      setPlayers(playersData);
      // Sort games by timestamp (most recent first)
      const sortedGames = [...gamesData].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setGames(sortedGames);
      setUnplayedGames(unplayedData);
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
    setGames([]);
    setUnplayedGames([]);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="admin-login">
          <h1>Adminpanel</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Lösenord:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ange adminlösenord"
                autoFocus
              />
            </div>
            {loginError && <div className="error-message">{loginError}</div>}
            <button
              type="submit"
              disabled={isVerifying || !password}
              className="submit-btn"
            >
              {isVerifying ? "Verifierar..." : "Logga in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1>Adminpanel</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logga ut
        </button>
      </div>

      {loading && <div className="loading">Laddar...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <div className="admin-content">
          <AddGameForm
            players={players}
            onSubmit={handleAddGame}
            password={password}
          />

          <div className="admin-section">
            <h2>Alla matcher ({games.length})</h2>
            <GameList
              games={games}
              title="Alla spelade matcher"
              onDelete={handleDeleteGame}
              showDelete={true}
            />
          </div>

          <div className="admin-section">
            <GameList unplayedGames={unplayedGames} title="Ospelade matcher" />
          </div>

          <button onClick={loadData} className="refresh-btn">
            Uppdatera data
          </button>
        </div>
      )}
    </div>
  );
}
