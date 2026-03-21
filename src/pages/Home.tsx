import { useState, useEffect } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { api } from "../services/api";
import type { Player, Game, UnplayedGame } from "../services/api";
import PlayerTable from "../components/PlayerTable";
import EloTable from "../components/EloTable";
import GameList from "../components/GameList";
import QuartetGameFinder from "../components/QuartetGameFinder";

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [allPlayerNames, setAllPlayerNames] = useState<string[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [unplayedGames, setUnplayedGames] = useState<UnplayedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [standingsTab, setStandingsTab] = useState<"tabell" | "elo">("tabell");
  const [gamesTab, setGamesTab] = useState<"spelade" | "ospelade">("spelade");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsData, gamesData, unplayedData, playersData] =
        await Promise.all([
          api.getStats(),
          api.getGames(),
          api.getUnplayedGames(),
          api.getPlayers(),
        ]);

      setPlayers(statsData);
      setAllPlayerNames(playersData);
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
        <div className="loading">
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ marginTop: "1rem" }}>Laddar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">{error}</div>
        <button
          onClick={loadData}
          className="refresh-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            justifyContent: "center",
          }}
        >
          <RefreshCw size={18} />
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
        <div className="standings-section">
          <div className="tabs">
            <button
              className={`tab-btn ${standingsTab === "tabell" ? "active" : ""}`}
              onClick={() => setStandingsTab("tabell")}
            >
              Tabell
            </button>
            <button
              className={`tab-btn ${standingsTab === "elo" ? "active" : ""}`}
              onClick={() => setStandingsTab("elo")}
            >
              ELO
            </button>
          </div>
          {standingsTab === "tabell" ? (
            <PlayerTable players={players} recentGames={recentGames} />
          ) : (
            <div className="standings-content">
              <EloTable games={recentGames} players={players} />
            </div>
          )}
        </div>

        <div className="games-section">
          <div className="tabs">
            <button
              className={`tab-btn ${gamesTab === "spelade" ? "active" : ""}`}
              onClick={() => setGamesTab("spelade")}
            >
              Spelade matcher
            </button>
            <button
              className={`tab-btn ${gamesTab === "ospelade" ? "active" : ""}`}
              onClick={() => setGamesTab("ospelade")}
            >
              Ospelade matcher
            </button>
          </div>
          {gamesTab === "spelade" ? (
            <GameList games={recentGames} title="Spelade matcher" />
          ) : (
            <GameList unplayedGames={unplayedGames} title="Ospelade matcher" />
          )}
        </div>
      </div>

      <QuartetGameFinder allPlayers={allPlayerNames} />
    </div>
  );
}
