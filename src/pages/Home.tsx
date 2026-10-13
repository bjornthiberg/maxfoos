import { useState, useEffect } from "react";
import { RefreshCw, Archive } from "lucide-react";
import { api } from "../services/api";
import type { Player, Game, Season } from "../services/api";
import Marquee from "../components/Marquee";
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
  const [standingsTab, setStandingsTab] = useState<"tabell" | "elo">("elo");

  const loadData = async (seasonId?: string) => {
    try {
      // Only the first load blanks the page; a season switch swaps in place
      if (!seasonId) setLoading(true);
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

  const seasonName = seasons.find((s) => s.id === selectedSeasonId)?.name;

  if (loading) {
    return (
      <div className="container">
        <Marquee />
        <div className="state-screen">
          <p className="state-loading">Laddar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <Marquee />
        <div className="state-screen">
          <div className="message message-error">{error}</div>
          <button onClick={() => loadData()} className="arcade-btn">
            <RefreshCw size={18} />
            Försök igen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Marquee />

      <section className="cabinet glow-pink">
        <div className="crt crt-boot">
          <div className="screen-head">
            <h1 className="screen-title">Topplista</h1>
            <span className="screen-note">
              {isArchive && <Archive size={16} />}
              {seasonName}
              {isArchive && " (arkiv)"}
            </span>
          </div>
          {standingsTab === "tabell" ? (
            <PlayerTable players={players} recentGames={recentGames} />
          ) : (
            <EloTable
              games={recentGames}
              players={players}
              excludedPlayers={guestNames}
            />
          )}
        </div>

        <div className="cabinet-deck">
          <div className="deck-buttons" role="group" aria-label="Rankning">
            <button
              className="deck-btn"
              aria-pressed={standingsTab === "elo"}
              onClick={() => setStandingsTab("elo")}
            >
              ELO
            </button>
            <button
              className="deck-btn"
              aria-pressed={standingsTab === "tabell"}
              onClick={() => setStandingsTab("tabell")}
            >
              Tabell
            </button>
          </div>
          <label className="deck-season">
            Säsong
            <select
              value={selectedSeasonId}
              onChange={(e) => handleSeasonChange(e.target.value)}
              className="select"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <GameList games={recentGames} title="Senast spelade" collapsible />
      <QuartetGameFinder allPlayers={allPlayerNames} games={recentGames} />
      <HeadToHead allPlayers={allPlayerNames} games={recentGames} />
    </div>
  );
}
