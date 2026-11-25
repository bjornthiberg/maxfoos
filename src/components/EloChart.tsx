import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { START_RATING } from "../lib/elo";
import type { RatingPoint } from "../lib/elo";

const HEIGHT = 150;
const PAD = { top: 14, right: 48, bottom: 24, left: 40 };

const pad2 = (n: number) => String(n).padStart(2, "0");
function shortDate(timestamp: string): string {
  const d = new Date(timestamp);
  const date = d
    .toLocaleDateString("sv-SE", { day: "numeric", month: "short" })
    .replace(".", "");
  return `${date} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** A square marker, snapped to whole pixels. */
function PixelDot({ cx, cy }: { cx: number; cy: number }) {
  return (
    <rect
      className="elo-chart-dot"
      x={Math.round(cx) - 4}
      y={Math.round(cy) - 4}
      width={8}
      height={8}
    />
  );
}

/** A player's rating across the season: one line, 1000 as the reference. */
export default function EloChart({
  name,
  points,
}: {
  name: string;
  points: RatingPoint[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const fillId = useId();
  const tipRef = useRef<HTMLDivElement>(null);
  const [tipW, setTipW] = useState(0);

  // measure the tooltip so it can be kept inside the chart
  useLayoutEffect(() => {
    if (tipRef.current) setTipW(tipRef.current.offsetWidth);
  }, [active]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (points.length < 2) {
    return <p className="elo-chart-empty">Inga ELO-matcher än.</p>;
  }

  const ratings = points.map((p) => p.rating);
  const lo = Math.min(START_RATING, ...ratings);
  const hi = Math.max(START_RATING, ...ratings);
  const span = Math.max(hi - lo, 20);
  const yMin = lo - span * 0.08;
  const yMax = hi + span * 0.08;

  const plotW = Math.max(width - PAD.left - PAD.right, 1);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (points.length - 1)) * plotW;
  const y = (r: number) => PAD.top + ((yMax - r) / (yMax - yMin)) * plotH;

  // an 8-bit staircase on whole pixels: the rating holds until the next game
  const px = Math.round;
  const path = points
    .map((p, i) =>
      i ? `H${px(x(i))}V${px(y(p.rating))}` : `M${px(x(0))},${px(y(p.rating))}`,
    )
    .join("");

  const last = points.length - 1;
  const plotBottom = PAD.top + plotH;
  const area = `${path}V${px(plotBottom)}H${px(x(0))}Z`;

  // match numbers along the bottom: a round step that leaves ~36px per label
  const step =
    [1, 2, 5, 10, 20, 25, 50, 100].find((s) => (plotW / last) * s >= 36) ?? 100;
  const matchTicks: number[] = [];
  for (let m = step; m <= last; m += step) matchTicks.push(m);
  // label the latest match too, unless it would crowd the previous label
  if (last - (matchTicks.at(-1) ?? 0) >= step * 0.8) matchTicks.push(last);
  const current = Math.round(points[last].rating);
  const shown = active ?? null;
  const ap = shown !== null ? points[shown] : null;

  // beside the crosshair: right of it if it fits, else left, else clamped
  const tipLeft = (cx: number) => {
    const gap = 12;
    if (cx + gap + tipW <= width) return cx + gap;
    if (cx - gap - tipW >= 0) return cx - gap - tipW;
    return Math.max(0, Math.min(width - tipW, cx - tipW / 2));
  };

  const pick = (clientX: number) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const rel = (clientX - rect.left - PAD.left) / plotW;
    setActive(Math.min(last, Math.max(0, Math.round(rel * last))));
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const step = e.key === "ArrowLeft" ? -1 : 1;
      setActive((a) => Math.min(last, Math.max(0, (a ?? last) + step)));
    } else if (e.key === "Escape") {
      setActive(null);
    }
  };

  // axis labels: 1000, plus the season high and low when they don't crowd it
  const ticks = [START_RATING, Math.round(hi), Math.round(lo)].filter(
    (t, i, all) =>
      all.slice(0, i).every((prev) => Math.abs(y(prev) - y(t)) >= 16),
  );

  return (
    <div
      ref={wrapRef}
      className="elo-chart"
      tabIndex={0}
      role="img"
      aria-label={`${name}s ELO den här säsongen: från ${START_RATING} till ${current} över ${last} matcher, högst ${Math.round(hi)}, lägst ${Math.round(lo)}.`}
      onPointerMove={(e) => pick(e.clientX)}
      onPointerDown={(e) => pick(e.clientX)}
      onPointerLeave={() => setActive(null)}
      onFocus={() => setActive((a) => a ?? last)}
      onBlur={() => setActive(null)}
      onKeyDown={onKey}
    >
      {width > 0 && (
        <svg width={width} height={HEIGHT} aria-hidden>
          {ticks.map((t) => (
            <g key={t}>
              <line
                className={
                  t === START_RATING ? "elo-chart-base" : "elo-chart-grid"
                }
                x1={PAD.left}
                x2={PAD.left + plotW}
                y1={Math.round(y(t)) + 0.5}
                y2={Math.round(y(t)) + 0.5}
              />
              <text
                className="elo-chart-tick"
                x={PAD.left - 8}
                y={y(t)}
                dy="0.35em"
                textAnchor="end"
              >
                {t}
              </text>
            </g>
          ))}

          <defs>
            {/* 2px checkerboard dither, like old pixel-art shading */}
            <pattern
              id={fillId}
              width="4"
              height="4"
              patternUnits="userSpaceOnUse"
            >
              <rect className="elo-chart-dither" width="2" height="2" />
              <rect
                className="elo-chart-dither"
                x="2"
                y="2"
                width="2"
                height="2"
              />
            </pattern>
          </defs>
          <path className="elo-chart-fill" d={area} fill={`url(#${fillId})`} />
          <path className="elo-chart-line" d={path} />

          {/* current rating at the line's end */}
          <PixelDot cx={x(last)} cy={y(points[last].rating)} />
          <text
            className="elo-chart-end"
            x={x(last) + 9}
            y={y(points[last].rating)}
            dy="0.35em"
          >
            {current}
          </text>

          {matchTicks.map((m) => (
            <g key={m}>
              <line
                className="elo-chart-xtick"
                x1={Math.round(x(m)) + 0.5}
                x2={Math.round(x(m)) + 0.5}
                y1={plotBottom + 3}
                y2={plotBottom + 7}
              />
              <text
                className="elo-chart-axis"
                x={x(m)}
                y={HEIGHT - 3}
                textAnchor="middle"
              >
                {m}
              </text>
            </g>
          ))}

          {ap && shown !== null && (
            <g>
              <line
                className="elo-chart-cross"
                x1={Math.round(x(shown)) + 0.5}
                x2={Math.round(x(shown)) + 0.5}
                y1={PAD.top}
                y2={PAD.top + plotH}
              />
              <PixelDot cx={x(shown)} cy={y(ap.rating)} />
            </g>
          )}
        </svg>
      )}

      {ap && shown !== null && (
        <div
          ref={tipRef}
          className="elo-chart-tip"
          style={{ left: tipLeft(x(shown)), top: PAD.top }}
        >
          <strong>{Math.round(ap.rating)}</strong>
          {ap.timestamp ? (
            <>
              <span className={ap.delta >= 0 ? "elo-up" : "elo-down"}>
                {ap.delta > 0 ? "+" : ap.delta < 0 ? "−" : "±"}
                {Math.abs(ap.delta)} {ap.won ? "vinst" : "förlust"}
              </span>
              <span>
                Match {shown}, {shortDate(ap.timestamp)}
              </span>
            </>
          ) : (
            <span>Start</span>
          )}
        </div>
      )}
    </div>
  );
}
