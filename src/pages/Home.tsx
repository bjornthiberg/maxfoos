import { useState, useEffect } from "react";
import { RefreshCw, Loader2, Archive } from "lucide-react";
import { api } from "../services/api";
import type { Player, Game, Season } from "../services/api";
import PlayerTable from "../components/PlayerTable";
import EloTable from "../components/EloTable";
import GameList from "../components/GameList";
import QuartetGameFinder from "../components/QuartetGameFinder";
import HeadToHead from "../components/HeadToHead";

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [allPlayerNames, setAllPlayerNames] = useState<string[]>([]);
  const [guestNames, setGuestNames] = useState<string[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeasonId, setActiveSeasonId] = useState("");
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [standingsTab, setStandingsTab] = useState<"tabell" | "elo">("tabell");

  const loadData = async (seasonId?: string) => {
    try {
      setLoading(true);
      setError("");

      let target = seasonId;
      if (!target) {
        const seasonsData = await api.getSeasons();
        setSeasons(seasonsData.seasons);
        setActiveSeasonId(seasonsData.activeSeasonId);
        target = seasonsData.activeSeasonId;
        setSelectedSeasonId(target);
      }

      const [statsData, gamesData, playersData] = await Promise.all([
        api.getStats(target),
        api.getGames(target),
        api.getPlayers(target),
      ]);

      setPlayers(statsData);
      setAllPlayerNames(playersData.players);
      setGuestNames(playersData.guests);
      const sortedGames = [...gamesData].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setRecentGames(sortedGames);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSeasonChange = (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    loadData(seasonId);
  };

  useEffect(() => {
    loadData();
  }, []);

  const isArchive = selectedSeasonId !== activeSeasonId && !!activeSeasonId;

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
          onClick={() => loadData()}
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

      <div className="season-selector">
        <select
          value={selectedSeasonId}
          onChange={(e) => handleSeasonChange(e.target.value)}
          className="player-select"
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {isArchive && (
          <span className="archive-badge">
            <Archive size={12} />
            Arkiv
          </span>
        )}
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
              <EloTable
                games={recentGames}
                players={players}
                excludedPlayers={guestNames}
              />
            </div>
          )}
        </div>

        <div className="games-section">
          <GameList games={recentGames} title="Senast spelade" collapsible />
        </div>
      </div>

      <QuartetGameFinder allPlayers={allPlayerNames} games={recentGames} />
      <HeadToHead allPlayers={allPlayerNames} games={recentGames} />
    </div>
  );
}
