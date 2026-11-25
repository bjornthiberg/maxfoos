// Shared cells for the two standings tables (ELO and Tabell)

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
