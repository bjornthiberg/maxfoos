import { useState } from "react";
import { api } from "../services/api";
import type { UnplayedGame } from "../services/api";

interface QuartetGameFinderProps {
  allPlayers: string[];
}

export default function QuartetGameFinder({
  allPlayers,
}: QuartetGameFinderProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);
  const [unplayedGames, setUnplayedGames] = useState<UnplayedGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...selectedPlayers];
    newPlayers[index] = value;
    setSelectedPlayers(newPlayers);
    setHasSearched(false);
    setError("");
  };

  const handleSearch = async () => {
    // Validate that all players are selected
    if (selectedPlayers.some((player) => !player)) {
      setError("Välj alla 4 spelare");
      return;
    }

    // Validate unique players
    const uniquePlayers = new Set(selectedPlayers);
    if (uniquePlayers.size !== 4) {
      setError("Alla 4 spelare måste vara olika");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const games = await api.getUnplayedGamesForQuartet(selectedPlayers);
      setUnplayedGames(games);
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte hämta matcher");
      setUnplayedGames([]);
      setHasSearched(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedPlayers(["", "", "", ""]);
    setUnplayedGames([]);
    setHasSearched(false);
    setError("");
  };

  const formatTeam = (team: { player1: string; player2: string }): string => {
    return `${team.player1} + ${team.player2}`;
  };

  // Get available players for a specific dropdown (exclude already selected players)
  const getAvailablePlayers = (currentIndex: number) => {
    const selectedOthers = selectedPlayers.filter(
      (player, index) => index !== currentIndex && player !== "",
    );
    return allPlayers.filter((player) => !selectedOthers.includes(player));
  };

  const isSearchDisabled =
    selectedPlayers.some((player) => !player) ||
    new Set(selectedPlayers).size !== 4;

  return (
    <div className="quartet-finder-container">
      <h2>Hitta matcher för 4 spelare</h2>
      <p className="quartet-description">
        Välj 4 spelare för att se vilka matcher (max 3) som inte har spelats
        mellan dem.
      </p>

      <div className="quartet-form">
        <div className="player-selectors">
          {selectedPlayers.map((player, index) => (
            <div key={index} className="form-group">
              <label>Spelare {index + 1}</label>
              <select
                value={player}
                onChange={(e) => handlePlayerChange(index, e.target.value)}
                className="player-select"
              >
                <option value="">Välj spelare...</option>
                {getAvailablePlayers(index).map((availPlayer) => (
                  <option key={availPlayer} value={availPlayer}>
                    {availPlayer}
                  </option>
                ))}
                {player && !getAvailablePlayers(index).includes(player) && (
                  <option value={player}>{player}</option>
                )}
              </select>
            </div>
          ))}
        </div>

        <div className="quartet-actions">
          <button
            onClick={handleSearch}
            disabled={isSearchDisabled || loading}
            className="submit-btn"
          >
            {loading ? "Söker..." : "Hitta matcher"}
          </button>
          <button
            onClick={handleReset}
            className="reset-btn"
            disabled={loading}
          >
            Rensa
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      {hasSearched && (
        <div className="quartet-results">
          <h3>
            Ospelade matcher för {selectedPlayers.filter((p) => p).join(", ")}
          </h3>
          {unplayedGames.length === 0 ? (
            <p className="no-games-message">
              Alla möjliga matcher mellan dessa spelare har redan spelats! 🎉
            </p>
          ) : (
            <>
              <p className="game-count">
                Antal ospelade matcher: {unplayedGames.length} av 3 möjliga
              </p>
              <table className="game-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Lag 1</th>
                    <th>Lag 2</th>
                  </tr>
                </thead>
                <tbody>
                  {unplayedGames.map((game, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{formatTeam(game.team1)}</td>
                      <td>{formatTeam(game.team2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
