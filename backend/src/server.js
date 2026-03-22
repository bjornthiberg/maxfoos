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

// Initialize data structure
const initData = {
  players: [
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
  ],
  games: [],
  adminPassword: process.env.ADMIN_PASSWORD || "maxfoos1337",
};

// Load or create data file
function loadData() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
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

// Routes

// Get all players
app.get("/api/players", (req, res) => {
  res.json(data.players);
});

// Get all games
app.get("/api/games", (req, res) => {
  res.json(data.games);
});

// Get player stats
app.get("/api/stats", (req, res) => {
  const stats = {};

  // Initialize stats for all players
  data.players.forEach((player) => {
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
  data.games.forEach((game) => {
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
  const sortedStats = Object.values(stats).sort((a, b) => {
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

  // Check if players exist
  if (!allPlayers.every((player) => data.players.includes(player))) {
    return res.status(400).json({ error: "Invalid player name" });
  }

  // Validate score
  if (winner !== "team1" && winner !== "team2") {
    return res.status(400).json({ error: "Winner must be team1 or team2" });
  }

  const winningScore = winner === "team1" ? score.team1 : score.team2;
  const losingScore = winner === "team1" ? score.team2 : score.team1;

  if (winningScore !== 10 || losingScore < 0 || losingScore > 9) {
    return res
      .status(400)
      .json({ error: "Invalid score. Winner must have 10 goals, loser 0-9" });
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

  data.games.push(newGame);
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

  const gameIndex = data.games.findIndex((game) => game.id === id);

  if (gameIndex === -1) {
    return res.status(404).json({ error: "Game not found" });
  }

  data.games.splice(gameIndex, 1);
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
