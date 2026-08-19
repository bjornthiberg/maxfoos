import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://maxfoos.se",
      "http://maxfoos.se",
      "https://www.maxfoos.se",
      "http://www.maxfoos.se",
    ],
  }),
);
app.use(express.json());

// Data file path - use DATA_DIRECTORY env variable if set, otherwise use current directory
const dataDirectory = process.env.DATA_DIRECTORY || __dirname + "/..";
const dataFilePath = path.join(dataDirectory, "data.json");

// Ensure data directory exists
if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

// Helper function for deterministic shuffle using seeded random
function deterministicShuffle(array) {
  // Create a copy to avoid mutating the original
  const shuffled = [...array];

  // Simple seeded PRNG (mulberry32)
  let seed = 12345; // Fixed seed for deterministic results
  const random = () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Fisher-Yates shuffle with seeded random
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// "Gäst" is a hidden guest player: selectable when entering results, but
// excluded from stats/tables and always rated at the default ELO.
const GUEST = "GÄST";

const ROSTER_S1 = [
  "Björn",
  "Daniel",
  "Frallan",
  "Herman",
  "Leif",
  "Ludvig",
  "Matilda",
  "Moritz",
  "Rickard",
  "Sabina",
];

const ROSTER_S2 = [
  "Björn",
  "Daniel",
  "Frallan",
  "Herman",
  "Leif",
  "Ludvig",
  "Matilda",
  "Moritz",
  "Sabina",
  "Oskar",
  "Torun",
];

// Initialize data structure
const initData = {
  seasons: [
    {
      id: "s1",
      name: "Säsong 1",
      players: ROSTER_S1,
      guests: [],
      games: [],
    },
    {
      id: "s2",
      name: "Säsong 2",
      players: ROSTER_S2,
      guests: [GUEST],
      games: [],
    },
  ],
  activeSeasonId: "s2",
  adminPassword: process.env.ADMIN_PASSWORD || "maxfoos1337",
};

// Convert the old flat format (single season) into the season-based format.
// The old players/games become "Säsong 1", and a fresh "Säsong 2" is started.
function migrateData(raw) {
  if (raw && Array.isArray(raw.seasons)) {
    const migrated = { ...raw };
    migrated.seasons = raw.seasons.map((season) => ({
      id: season.id,
      name: season.name,
      players: season.players || [],
      guests: season.guests || [],
      games: season.games || [],
    }));
    if (
      !migrated.activeSeasonId ||
      !migrated.seasons.some((s) => s.id === migrated.activeSeasonId)
    ) {
      migrated.activeSeasonId = migrated.seasons[0]?.id;
    }
    migrated.adminPassword = raw.adminPassword || initData.adminPassword;
    return migrated;
  }
  return {
    seasons: [
      {
        id: "s1",
        name: "Säsong 1",
        players: raw?.players || ROSTER_S1,
        guests: [],
        games: raw?.games || [],
      },
      {
        id: "s2",
        name: "Säsong 2",
        players: ROSTER_S2,
        guests: [GUEST],
        games: [],
      },
    ],
    activeSeasonId: "s2",
    adminPassword: raw?.adminPassword || initData.adminPassword,
  };
}

// Load or create data file
function loadData() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const raw = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
      const data = migrateData(raw);
      saveData(data);
      return data;
    }
  } catch (error) {
    console.error("Error loading data:", error);
  }
  saveData(initData);
  return initData;
}

function saveData(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving data:", error);
  }
}

let data = loadData();

function getSeason(id) {
  return data.seasons.find((s) => s.id === id) || getActiveSeason();
}

function getActiveSeason() {
  return (
    data.seasons.find((s) => s.id === data.activeSeasonId) || data.seasons[0]
  );
}

function isPlayable(season, player) {
  return season.players.includes(player) || season.guests.includes(player);
}

// Routes

// Get all seasons
app.get("/api/seasons", (req, res) => {
  res.json({
    activeSeasonId: data.activeSeasonId,
    seasons: data.seasons.map((s) => ({
      id: s.id,
      name: s.name,
      gameCount: s.games.length,
      players: s.players,
      guests: s.guests,
    })),
  });
});

// Get players for a season (default: active)
app.get("/api/players", (req, res) => {
  const season = getSeason(req.query.season);
  res.json({ players: season.players, guests: season.guests });
});

// Get games for a season (default: active)
app.get("/api/games", (req, res) => {
  const season = getSeason(req.query.season);
  res.json(season.games);
});

// Get player stats for a season (default: active).
// Only non-guest players who have played at least one game are included.
app.get("/api/stats", (req, res) => {
  const season = getSeason(req.query.season);
  const stats = {};

  // Initialize stats for all roster players, guests and anyone appearing in games
  const names = new Set([...season.players, ...season.guests]);
  season.games.forEach((game) => {
    [
      game.team1.player1,
      game.team1.player2,
      game.team2.player1,
      game.team2.player2,
    ].forEach((player) => names.add(player));
  });

  names.forEach((player) => {
    stats[player] = {
      name: player,
      points: 0,
      gamesPlayed: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
    };
  });

  // Calculate stats from games
  season.games.forEach((game) => {
    const team1Players = [game.team1.player1, game.team1.player2];
    const team2Players = [game.team2.player1, game.team2.player2];

    team1Players.forEach((player) => stats[player].gamesPlayed++);
    team2Players.forEach((player) => stats[player].gamesPlayed++);

    if (game.winner === "team1") {
      // Team 1 wins
      team1Players.forEach((player) => {
        stats[player].points++;
        stats[player].goalsFor += game.score.team1;
        stats[player].goalsAgainst += game.score.team2;
      });
      team2Players.forEach((player) => {
        stats[player].goalsFor += game.score.team2;
        stats[player].goalsAgainst += game.score.team1;
      });
    } else {
      // Team 2 wins
      team2Players.forEach((player) => {
        stats[player].points++;
        stats[player].goalsFor += game.score.team2;
        stats[player].goalsAgainst += game.score.team1;
      });
      team1Players.forEach((player) => {
        stats[player].goalsFor += game.score.team1;
        stats[player].goalsAgainst += game.score.team2;
      });
    }
  });

  // Calculate goal difference
  Object.values(stats).forEach((player) => {
    player.goalDifference = player.goalsFor - player.goalsAgainst;
  });

  // Sort by points, then goal difference, then games played (descending)
  const sortedStats = Object.values(stats)
    .filter(
      (player) =>
        player.gamesPlayed > 0 && season.players.includes(player.name),
    )
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      return b.gamesPlayed - a.gamesPlayed;
    });

  res.json(sortedStats);
});

// Add a new game
app.post("/api/games", (req, res) => {
  const { team1, team2, winner, score, password } = req.body;

  // Verify admin password
  if (password !== data.adminPassword) {
    return res.status(401).json({ error: "Invalid password" });
  }

  // Validate input
  if (!team1 || !team2 || !winner || !score) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!team1.player1 || !team1.player2 || !team2.player1 || !team2.player2) {
    return res.status(400).json({ error: "Each team must have 2 players" });
  }

  // Check for duplicate players
  const allPlayers = [
    team1.player1,
    team1.player2,
    team2.player1,
    team2.player2,
  ];
  if (new Set(allPlayers).size !== 4) {
    return res.status(400).json({ error: "All 4 players must be unique" });
  }

  // Check if players exist in the active season's roster (including guests)
  const season = getActiveSeason();
  if (!allPlayers.every((player) => isPlayable(season, player))) {
    return res.status(400).json({ error: "Invalid player name" });
  }

  // Validate score
  if (winner !== "team1" && winner !== "team2") {
    return res.status(400).json({ error: "Winner must be team1 or team2" });
  }

  if (
    typeof score.team1 !== "number" ||
    typeof score.team2 !== "number" ||
    score.team1 < 0 ||
    score.team2 < 0 ||
    score.team1 === score.team2
  ) {
    return res
      .status(400)
      .json({ error: "Invalid score. Scores must be non-negative and not equal" });
  }

  const expectedWinner = score.team1 > score.team2 ? "team1" : "team2";
  if (winner !== expectedWinner) {
    return res.status(400).json({ error: "Winner does not match scores" });
  }

  // Add game
  const newGame = {
    id: Date.now().toString(),
    team1,
    team2,
    winner,
    score,
    timestamp: new Date().toISOString(),
  };

  season.games.push(newGame);
  saveData(data);

  res.status(201).json(newGame);
});

// Delete a game
app.delete("/api/games/:id", (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  // Verify admin password
  if (password !== data.adminPassword) {
    return res.status(401).json({ error: "Invalid password" });
  }

  let found = false;
  for (const season of data.seasons) {
    const gameIndex = season.games.findIndex((game) => game.id === id);
    if (gameIndex !== -1) {
      season.games.splice(gameIndex, 1);
      found = true;
      break;
    }
  }

  if (!found) {
    return res.status(404).json({ error: "Game not found" });
  }

  saveData(data);

  res.json({ message: "Game deleted successfully" });
});

// Verify admin password
app.post("/api/admin/verify", (req, res) => {
  const { password } = req.body;

  if (password === data.adminPassword) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
