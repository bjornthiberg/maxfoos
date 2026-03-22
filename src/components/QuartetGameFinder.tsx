import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";

interface QuartetGameFinderProps {
  allPlayers: string[];
}

interface Combo {
  team1: { player1: string; player2: string };
  team2: { player1: string; player2: string };
}

function getCombos(players: string[]): Combo[] {
  const [a, b, c, d] = players;
  return [
    { team1: { player1: a, player2: b }, team2: { player1: c, player2: d } },
    { team1: { player1: a, player2: c }, team2: { player1: b, player2: d } },
    { team1: { player1: a, player2: d }, team2: { player1: b, player2: c } },
  ];
}

function formatTeam(team: { player1: string; player2: string }): string {
  return `${team.player1} + ${team.player2}`;
}

export default function QuartetGameFinder({
  allPlayers,
}: QuartetGameFinderProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(["", "", "", ""]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [suggestedIndex, setSuggestedIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...selectedPlayers];
    newPlayers[index] = value;
    setSelectedPlayers(newPlayers);
    setHasSearched(false);
    setError("");
  };

  const handleSearch = () => {
    if (selectedPlayers.some((p) => !p)) {
      setError("Välj alla 4 spelare");
      return;
    }
    if (new Set(selectedPlayers).size !== 4) {
      setError("Alla 4 spelare måste vara olika");
      return;
    }
    const results = getCombos(selectedPlayers);
    setCombos(results);
    setSuggestedIndex(Math.floor(Math.random() * results.length));
    setHasSearched(true);
    setError("");
  };

  const handleReset = () => {
    setSelectedPlayers(["", "", "", ""]);
    setCombos([]);
    setSuggestedIndex(null);
    setHasSearched(false);
    setError("");
  };

  const getAvailablePlayers = (currentIndex: number) => {
    const selectedOthers = selectedPlayers.filter(
      (p, i) => i !== currentIndex && p !== "",
    );
    return allPlayers.filter((p) => !selectedOthers.includes(p));
  };

  const isSearchDisabled =
    selectedPlayers.some((p) => !p) || new Set(selectedPlayers).size !== 4;

  return (
    <div className="quartet-finder-container">
      <h2>Hitta matcher för 4 spelare</h2>
      <p className="quartet-description">
        Välj 4 spelare för att se alla 3 möjliga lagkombinationer.
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
                {getAvailablePlayers(index).map((p) => (
                  <option key={p} value={p}>
                    {p}
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
            disabled={isSearchDisabled}
            className="submit-btn"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}
          >
            <Search size={18} />
            Hitta matcher
          </button>
          <button
            onClick={handleReset}
            className="reset-btn"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}
          >
            <RotateCcw size={18} />
            Rensa
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      {hasSearched && (
        <div className="quartet-results">
          <h3>Kombinationer för {selectedPlayers.filter((p) => p).join(", ")}</h3>
          {suggestedIndex !== null && (
            <div className="suggested-game">
              <div className="suggested-game-label">Förslag</div>
              <div className="suggested-game-teams">
                <span>{formatTeam(combos[suggestedIndex].team1)}</span>
                <span className="vs">vs</span>
                <span>{formatTeam(combos[suggestedIndex].team2)}</span>
              </div>
            </div>
          )}
          <table className="game-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Lag 1</th>
                <th>Lag 2</th>
              </tr>
            </thead>
            <tbody>
              {combos.map((combo, index) => (
                <tr key={index} className={index === suggestedIndex ? "suggested-row" : ""}>
                  <td>{index + 1}</td>
                  <td>{formatTeam(combo.team1)}</td>
                  <td>{formatTeam(combo.team2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
