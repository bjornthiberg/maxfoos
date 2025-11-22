import { useState } from "react";
import { Plus, Loader2, Users } from "lucide-react";
import type { NewGameData } from "../services/api";

interface AddGameFormProps {
  players: string[];
  onSubmit: (gameData: NewGameData) => Promise<void>;
  password: string;
}

export default function AddGameForm({
  players,
  onSubmit,
  password,
}: AddGameFormProps) {
  const [team1Player1, setTeam1Player1] = useState("");
  const [team1Player2, setTeam1Player2] = useState("");
  const [team2Player1, setTeam2Player1] = useState("");
  const [team2Player2, setTeam2Player2] = useState("");
  const [winner, setWinner] = useState<"team1" | "team2">("team1");
  const [loserScore, setLoserScore] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!team1Player1 || !team1Player2 || !team2Player1 || !team2Player2) {
      setError("Vänligen välj alla 4 spelare");
      return;
    }

    const selectedPlayers = [
      team1Player1,
      team1Player2,
      team2Player1,
      team2Player2,
    ];
    const uniquePlayers = new Set(selectedPlayers);

    if (uniquePlayers.size !== 4) {
      setError("Alla 4 spelare måste vara unika");
      return;
    }

    const loserScoreNum = parseInt(loserScore);
    if (isNaN(loserScoreNum) || loserScoreNum < 0 || loserScoreNum > 9) {
      setError("Förlorarens poäng måste vara mellan 0 och 9");
      return;
    }

    setIsSubmitting(true);

    try {
      const gameData: NewGameData = {
        team1: {
          player1: team1Player1,
          player2: team1Player2,
        },
        team2: {
          player1: team2Player1,
          player2: team2Player2,
        },
        winner,
        score: {
          team1: winner === "team1" ? 10 : loserScoreNum,
          team2: winner === "team2" ? 10 : loserScoreNum,
        },
        password,
      };

      await onSubmit(gameData);

      // Reset form
      setTeam1Player1("");
      setTeam1Player2("");
      setTeam2Player1("");
      setTeam2Player2("");
      setWinner("team1");
      setLoserScore("0");
      setSuccess("Matchen har lagts till!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunde inte lägga till match",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-game-form">
      <h2>➕ Lägg till nytt matchresultat</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>
            <Users
              size={18}
              style={{
                display: "inline",
                verticalAlign: "text-bottom",
                marginRight: "0.5rem",
              }}
            />
            Lag 1
          </h3>
          <div className="form-group">
            <label>Spelare 1:</label>
            <select
              value={team1Player1}
              onChange={(e) => setTeam1Player1(e.target.value)}
            >
              <option value="">Välj spelare</option>
              {players.map((player) => (
                <option key={player} value={player}>
                  {player}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Spelare 2:</label>
            <select
              value={team1Player2}
              onChange={(e) => setTeam1Player2(e.target.value)}
            >
              <option value="">Välj spelare</option>
              {players.map((player) => (
                <option key={player} value={player}>
                  {player}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>
            <Users
              size={18}
              style={{
                display: "inline",
                verticalAlign: "text-bottom",
                marginRight: "0.5rem",
              }}
            />
            Lag 2
          </h3>
          <div className="form-group">
            <label>Spelare 1:</label>
            <select
              value={team2Player1}
              onChange={(e) => setTeam2Player1(e.target.value)}
            >
              <option value="">Välj spelare</option>
              {players.map((player) => (
                <option key={player} value={player}>
                  {player}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Spelare 2:</label>
            <select
              value={team2Player2}
              onChange={(e) => setTeam2Player2(e.target.value)}
            >
              <option value="">Välj spelare</option>
              {players.map((player) => (
                <option key={player} value={player}>
                  {player}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Resultat</h3>
          <div className="form-group">
            <label>Vinnare:</label>
            <select
              value={winner}
              onChange={(e) => setWinner(e.target.value as "team1" | "team2")}
            >
              <option value="team1">Lag 1</option>
              <option value="team2">Lag 2</option>
            </select>
          </div>
          <div className="form-group">
            <label>Förlorarens poäng (0-9):</label>
            <input
              type="number"
              min="0"
              max="9"
              value={loserScore}
              onChange={(e) => setLoserScore(e.target.value)}
            />
            <small>Vinnaren får alltid 10 poäng</small>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="submit-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            justifyContent: "center",
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2
                size={18}
                style={{ animation: "spin 1s linear infinite" }}
              />
              <style>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
              Lägger till...
            </>
          ) : (
            <>
              <Plus size={18} />
              Lägg till match
            </>
          )}
        </button>
      </form>
    </div>
  );
}
