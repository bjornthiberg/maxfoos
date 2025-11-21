import { useState, useEffect } from "react";
import { api } from "../services/api";
import type { Player, Game, UnplayedGame } from "../services/api";
import PlayerTable from "../components/PlayerTable";
import GameList from "../components/GameList";

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [unplayedGames, setUnplayedGames] = useState<UnplayedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsData, gamesData, unplayedData] = await Promise.all([
        api.getStats(),
        api.getGames(),
        api.getUnplayedGames(),
      ]);

      setPlayers(statsData);
      // Sort games by timestamp (most recent first)
      const sortedGames = [...gamesData].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setRecentGames(sortedGames);
      setUnplayedGames(unplayedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Laddar...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">{error}</div>
        <button onClick={loadData} className="refresh-btn">
          Försök igen
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="neon-title">
        <h1 className="neon">Max</h1>
        <h1 className="flux">Foos</h1>
      </div>

      <div className="home-layout">
        <PlayerTable players={players} />

        <div className="games-section">
          <GameList games={recentGames} title="Spelade matcher" />

          <GameList unplayedGames={unplayedGames} title="Ospelade matcher" />
        </div>

        <button onClick={loadData} className="refresh-btn">
          Uppdatera data
        </button>
      </div>
    </div>
  );
}
