import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
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
  const [score1, setScore1] = useState("0");
  const [score2, setScore2] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const chosen = [team1Player1, team1Player2, team2Player1, team2Player2];

  const available = (currentValue: string) =>
    players.filter((p) => p === currentValue || !chosen.includes(p));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!team1Player1 || !team1Player2 || !team2Player1 || !team2Player2) {
      setError("Vänligen välj alla 4 spelare");
      return;
    }
    if (new Set(chosen).size !== 4) {
      setError("Alla 4 spelare måste vara unika");
      return;
    }

    const s1 = parseInt(score1);
    const s2 = parseInt(score2);
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      setError("Ange giltiga poäng");
      return;
    }
    if (s1 === s2) {
      setError("Oavgjort är inte möjligt — en sida måste vinna");
      return;
    }

    const winner: "team1" | "team2" = s1 > s2 ? "team1" : "team2";

    setIsSubmitting(true);
    try {
      await onSubmit({
        team1: { player1: team1Player1, player2: team1Player2 },
        team2: { player1: team2Player1, player2: team2Player2 },
        winner,
        score: { team1: s1, team2: s2 },
        password,
      });

      setTeam1Player1("");
      setTeam1Player2("");
      setTeam2Player1("");
      setTeam2Player2("");
      setScore1("0");
      setScore2("0");
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
    <form className="cabinet glow-yellow" onSubmit={handleSubmit}>
      <div className="crt">
        <div className="screen-head">
          <h2 className="screen-title">Lägg till nytt matchresultat</h2>
        </div>
        <div className="pitch">
          <div className="pitch-side">
            <h3>Lag Blå</h3>
            <label className="field">
              Back
              <select
                value={team1Player1}
                onChange={(e) => setTeam1Player1(e.target.value)}
              >
                <option value="">Välj spelare</option>
                {available(team1Player1).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Forward
              <select
                value={team1Player2}
                onChange={(e) => setTeam1Player2(e.target.value)}
              >
                <option value="">Välj spelare</option>
                {available(team1Player2).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="pitch-field">
            <label className="field">
              Blå
              <input
                type="number"
                min="0"
                value={score1}
                onChange={(e) => setScore1(e.target.value)}
                placeholder="0"
                className="pitch-score pitch-score-blue"
              />
            </label>
            <label className="field">
              Röd
              <input
                type="number"
                min="0"
                value={score2}
                onChange={(e) => setScore2(e.target.value)}
                placeholder="0"
                className="pitch-score pitch-score-red"
              />
            </label>
          </div>

          <div className="pitch-side pitch-side-red">
            <h3>Lag Röd</h3>
            <label className="field">
              Back
              <select
                value={team2Player1}
                onChange={(e) => setTeam2Player1(e.target.value)}
              >
                <option value="">Välj spelare</option>
                {available(team2Player1).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Forward
              <select
                value={team2Player2}
                onChange={(e) => setTeam2Player2(e.target.value)}
              >
                <option value="">Välj spelare</option>
                {available(team2Player2).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {error && <div className="message message-error">{error}</div>}
        {success && <div className="message message-ok">{success}</div>}
      </div>

      <div className="cabinet-deck">
        <button
          type="submit"
          disabled={isSubmitting}
          className="arcade-btn arcade-btn-wide"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="spin" />
              Lägger till...
            </>
          ) : (
            <>
              <Plus size={18} />
              Lägg till match
            </>
          )}
        </button>
      </div>
    </form>
  );
}
