// Regenerates test/data.json: deterministic sample data that exercises the
// different states of the UI. Run with: node test/generate-data.mjs
//
// What the active season (Säsong 2) is built to show:
//  - Torun has no games (listed in Tabell with zeros, absent from ELO)
//  - Oskar has only two games (form shorter than five)
//  - Ludvig ends on five straight wins, Moritz on five straight losses
//  - Björn vs Daniel is a long, even head-to-head rivalry
//  - Frallan has never lost to Matilda (one-sided head-to-head)
//  - Sabina and Leif have never met as opponents (empty head-to-head)
//  - Björn/Daniel/Ludvig/Herman: one team split played often, one a few
//    times, one never (Föreslå match)
//  - guest games, 10–0 blowouts, 10–9 thrillers, several games per day
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const outFile = path.join(path.dirname(fileURLToPath(import.meta.url)), "data.json");

// Seeded PRNG (mulberry32), same as the backend uses
let seed = 20261013;
const random = () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (list) => list[Math.floor(random() * list.length)];
const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const GUEST = "GÄST";
const ROSTER_S1 = ["Björn", "Daniel", "Frallan", "Herman", "Leif", "Ludvig", "Matilda", "Moritz", "Rickard", "Sabina"];
const ROSTER_S2 = ["Björn", "Daniel", "Frallan", "Herman", "Leif", "Ludvig", "Matilda", "Moritz", "Sabina", "Oskar", "Torun"];

const SKILL = {
  Björn: 0.82, Daniel: 0.8, Frallan: 0.7, Ludvig: 0.66, Herman: 0.52, Leif: 0.5,
  Sabina: 0.45, Rickard: 0.4, Moritz: 0.36, Matilda: 0.3, Oskar: 0.35, [GUEST]: 0.4,
};

// [back, forward] vs [back, forward]; score is [team1, team2]
const game = (t1, t2, score) => ({ t1, t2, score });
const loserGoals = () => pick([0, 2, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9]);
const result = (team1Wins, goals = loserGoals()) => (team1Wins ? [10, goals] : [goals, 10]);

const opposed = (g, a, b) =>
  (g.t1.includes(a) && g.t2.includes(b)) || (g.t1.includes(b) && g.t2.includes(a));
const sameTeam = (g, a, b) =>
  (g.t1.includes(a) && g.t1.includes(b)) || (g.t2.includes(a) && g.t2.includes(b));

function randomGame(pool, allowed = () => true) {
  for (;;) {
    const [a, b, c, d] = shuffle(pool);
    const g = game([a, b], [c, d], null);
    if (!allowed(g)) continue;
    const edge = (SKILL[a] + SKILL[b] - SKILL[c] - SKILL[d]) / 2;
    g.score = result(random() < 0.5 + edge * 1.1);
    return g;
  }
}

// ---- Säsong 1: a finished season, plain skill-weighted games ----
const s1Games = Array.from({ length: 52 }, () => randomGame(ROSTER_S1));

// ---- Säsong 2: scripted situations mixed into random games ----
const regulars = ["Björn", "Daniel", "Frallan", "Herman", "Leif", "Ludvig", "Matilda", "Moritz", "Sabina"];
const core = ["Björn", "Daniel", "Ludvig", "Herman"];

const scripted = [
  // the favourite split of the core quartet, played often
  ...[[true, 9], [false, 8], [true, 6], [true, 9], [false, 9], [true, 4], [false, 7]].map(([w, n]) =>
    game(["Björn", "Ludvig"], ["Daniel", "Herman"], result(w, n))),
  // the second split, a few times
  ...[[false, 9], [true, 8], [false, 5]].map(([w, n]) =>
    game(["Herman", "Björn"], ["Ludvig", "Daniel"], result(w, n))),
  // more Björn vs Daniel with other partners
  game(["Björn", "Sabina"], ["Daniel", "Moritz"], result(true, 9)),
  game(["Leif", "Daniel"], ["Björn", "Matilda"], result(true, 7)),
  // Frallan always gets the better of Matilda
  game(["Frallan", "Leif"], ["Matilda", "Herman"], result(true, 6)),
  game(["Matilda", "Daniel"], ["Sabina", "Frallan"], result(false, 9)),
  game(["Frallan", "Moritz"], ["Ludvig", "Matilda"], result(true, 8)),
  game(["Matilda", "Björn"], ["Frallan", "Herman"], result(false, 9)),
  // blowouts
  game(["Björn", "Daniel"], ["Moritz", "Matilda"], result(true, 0)),
  game(["Sabina", "Moritz"], ["Frallan", "Ludvig"], result(false, 0)),
  // guest appearances
  game(["Björn", GUEST], ["Herman", "Leif"], result(true, 7)),
  game(["Sabina", "Ludvig"], [GUEST, "Daniel"], result(false, 9)),
  game([GUEST, "Moritz"], ["Frallan", "Matilda"], result(false, 4)),
  // Oskar's only two games so far
  game(["Oskar", "Björn"], ["Leif", "Sabina"], result(true, 8)),
  game(["Herman", "Frallan"], ["Oskar", "Matilda"], result(true, 3)),
];

const fillAllowed = (g) =>
  !opposed(g, "Sabina", "Leif") &&
  !opposed(g, "Frallan", "Matilda") &&
  // keep the scripted counts for the core quartet exact
  !core.every((p) => g.t1.includes(p) || g.t2.includes(p)) &&
  !sameTeam(g, "Björn", "Daniel");

const fill = Array.from({ length: 44 }, () => randomGame(regulars, fillAllowed));

// The run-in: Ludvig wins five straight, Moritz loses five straight
const runIn = [
  game(["Ludvig", "Frallan"], ["Moritz", "Herman"], result(true, 7)),
  game(["Sabina", "Ludvig"], ["Moritz", "Matilda"], result(true, 5)),
  game(["Moritz", "Leif"], ["Daniel", "Ludvig"], result(false, 9)),
  game(["Ludvig", "Herman"], ["Björn", "Moritz"], result(true, 9)),
  game(["Moritz", "Sabina"], ["Ludvig", "Frallan"], result(false, 2)),
];

const s2Games = [...shuffle([...scripted, ...fill]), ...runIn];

// ---- Timestamps: weekday lunch and fika sessions, ending on lastDay ----
function schedule(games, lastDay) {
  const sessions = []; // sizes, newest first
  for (let left = games.length; left > 0; ) {
    // a 0 is a day without games; the last day always has some
    const size = Math.min(left, pick(sessions.length ? [0, 1, 1, 2, 2, 3, 3, 4, 5] : [2, 3]));
    sessions.push(size);
    left -= size;
  }
  const day = new Date(`${lastDay}T00:00:00Z`);
  const stamps = [];
  for (const size of sessions) {
    while (day.getUTCDay() === 0 || day.getUTCDay() === 6) day.setUTCDate(day.getUTCDate() - 1);
    const lunch = 9 * 60 + 45 + Math.floor(random() * 20); // UTC, ~11:45 local
    const slots = [];
    for (let i = 0; i < size; i++) {
      const fika = i >= 3; // long days continue after the afternoon coffee
      slots.push((fika ? 13 * 60 + 5 : lunch) + (fika ? i - 3 : i) * (9 + Math.floor(random() * 5)));
    }
    stamps.unshift(...slots.map((m) => new Date(day.getTime() + m * 60000 + Math.floor(random() * 60000))));
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return games.map((g, i) => ({
    id: stamps[i].getTime().toString(),
    team1: { player1: g.t1[0], player2: g.t1[1] },
    team2: { player1: g.t2[0], player2: g.t2[1] },
    winner: g.score[0] > g.score[1] ? "team1" : "team2",
    score: { team1: g.score[0], team2: g.score[1] },
    timestamp: stamps[i].toISOString(),
  }));
}

const data = {
  seasons: [
    { id: "s1", name: "Säsong 1", players: ROSTER_S1, guests: [], games: schedule(s1Games, "2026-06-18") },
    { id: "s2", name: "Säsong 2", players: ROSTER_S2, guests: [GUEST], games: schedule(s2Games, "2026-10-13") },
  ],
  activeSeasonId: "s2",
  adminPassword: "lalaland",
};

// Same formatting as the backend's saveData, so loading it causes no diff
fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
console.log(`Wrote ${outFile}: ${data.seasons.map((s) => `${s.name} ${s.games.length} games`).join(", ")}`);
