// Shared cells for the two standings tables (ELO and Tabell)

// Swedish ordinals: 1:a, 2:a, 3:e, 4:e ...
export function Rank({ position }: { position: number }) {
  const last = position % 10;
  const teens = position % 100 === 11 || position % 100 === 12;
  const suffix = (last === 1 || last === 2) && !teens ? "a" : "e";
  return (
    <>
      {position}:{suffix}
    </>
  );
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
