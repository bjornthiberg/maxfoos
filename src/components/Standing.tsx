// Shared cells and rows for the two standings tables (ELO and Tabell)

import { Fragment } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { Game } from "../services/api";
import { positionStats } from "../lib/positions";

export function Rank({ position }: { position: number }) {
  return <>{position}</>;
}

export function FormPips({ form }: { form: ("W" | "L")[] }) {
  return (
    <span className="pips">
      {form.map((result, i) => (
        <span
          key={i}
          className={`pip ${result === "W" ? "pip-w" : "pip-l"}`}
          title={result === "W" ? "Vinst" : "Förlust"}
        />
      ))}
    </span>
  );
}

/**
 * A standings row that opens a back/forward breakdown nestled below it.
 * `cells` are the columns after the name.
 */
export function PlayerRow({
  rank,
  name,
  cells,
  columns,
  games,
  open,
  onToggle,
}: {
  rank: number;
  name: string;
  cells: ReactNode;
  columns: number;
  games: Game[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Fragment>
      <tr
        className={`player-row rank-${rank} ${open ? "is-open" : ""}`}
        onClick={onToggle}
      >
        <td>
          <Rank position={rank} />
        </td>
        <td className="score-name">
          <button
            type="button"
            className="row-toggle"
            aria-expanded={open}
            aria-label={`${open ? "Dölj" : "Visa"} positioner för ${name}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {name}
            <ChevronDown className="row-caret" size={14} aria-hidden />
          </button>
        </td>
        {cells}
      </tr>
      {open && (
        <tr className="position-row">
          <td />
          <td colSpan={columns - 1}>
            <PositionBreakdown name={name} games={games} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}

function PositionBreakdown({ name, games }: { name: string; games: Game[] }) {
  const stats = positionStats(name, games);
  return (
    <table className="positions">
      <thead>
        <tr>
          <th />
          <th>V%</th>
          <th>V</th>
          <th>F</th>
          <th>M</th>
          <th>+/-</th>
        </tr>
      </thead>
      <tbody>
        {(["back", "forward"] as const).map((pos) => {
          const s = stats[pos];
          const gd = s.goalDifference;
          return (
            <tr key={pos}>
              <th scope="row">{pos === "back" ? "Back" : "Forward"}</th>
              <td>
                {s.games > 0
                  ? `${((s.wins / s.games) * 100).toFixed(1)}%`
                  : "–"}
              </td>
              <td>{s.wins}</td>
              <td>{s.losses}</td>
              <td>{s.games}</td>
              <td className={gd < 0 ? "score-neg" : ""}>
                {gd > 0 ? "+" : ""}
                {gd}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
