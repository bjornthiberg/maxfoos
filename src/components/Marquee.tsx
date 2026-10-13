import { Link } from "react-router-dom";

// The neon sign that tops every page.
export default function Marquee() {
  return (
    <Link to="/" className="neon-sign" aria-label="MaxFoos, till startsidan">
      <span className="logo">
        <span className="logo-max">Max</span>
        <span className="logo-foos">Foos</span>
      </span>
    </Link>
  );
}
