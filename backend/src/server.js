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
    "Ludvig",
    "Frallan",
    "Daniel",
    "Sabina",
    "Matilda",
    "Moritz",
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

// Helper function to normalize team (sort players)
function normalizeTeam(players) {
  return [...players].sort().join(",");
}

// Helper function to check if game already exists
function gameExists(team1Players, team2Players) {
  const normalizedTeam1 = normalizeTeam(team1Players);
  const normalizedTeam2 = normalizeTeam(team2Players);

  return data.games.some((game) => {
    const gameTeam1 = normalizeTeam([game.team1.player1, game.team1.player2]);
    const gameTeam2 = normalizeTeam([game.team2.player1, game.team2.player2]);

    return (
      (gameTeam1 === normalizedTeam1 && gameTeam2 === normalizedTeam2) ||
      (gameTeam1 === normalizedTeam2 && gameTeam2 === normalizedTeam1)
    );
  });
}

// Helper function to generate all possible games
function getAllPossibleGames() {
  const players = data.players;
  const allGames = [];

  // Generate all pairs of players (teams)
  const teams = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      teams.push([players[i], players[j]]);
    }
  }

  // Generate all possible matchups between teams
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const team1 = teams[i];
      const team2 = teams[j];

      // Check if teams don't share players
      if (!team1.includes(team2[0]) && !team1.includes(team2[1])) {
        allGames.push({
          team1: { player1: team1[0], player2: team1[1] },
          team2: { player1: team2[0], player2: team2[1] },
        });
      }
    }
  }

  return allGames;
}

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

// Get unplayed games
app.get("/api/games/unplayed", (req, res) => {
  const allPossibleGames = getAllPossibleGames();

  const unplayedGames = allPossibleGames.filter((possibleGame) => {
    return !gameExists(
      [possibleGame.team1.player1, possibleGame.team1.player2],
      [possibleGame.team2.player1, possibleGame.team2.player2],
    );
  });

  // Apply deterministic shuffle for consistent but random-looking order
  const shuffledUnplayedGames = deterministicShuffle(unplayedGames);

  res.json(shuffledUnplayedGames);
});

// Get unplayed games for specific quartet of players
app.post("/api/games/unplayed/quartet", (req, res) => {
  const { players } = req.body;

  // Validate input
  if (!players || !Array.isArray(players) || players.length !== 4) {
    return res.status(400).json({ error: "Must provide exactly 4 players" });
  }

  // Check for duplicate players
  if (new Set(players).size !== 4) {
    return res.status(400).json({ error: "All 4 players must be unique" });
  }

  // Check if players exist
  if (!players.every((player) => data.players.includes(player))) {
    return res.status(400).json({ error: "Invalid player name" });
  }

  // Generate all possible team combinations from the 4 players
  const possibleGames = [];

  // There are 3 ways to split 4 players into 2 teams of 2:
  // [0,1] vs [2,3]
  // [0,2] vs [1,3]
  // [0,3] vs [1,2]
  const combinations = [
    [
      [0, 1],
      [2, 3],
    ],
    [
      [0, 2],
      [1, 3],
    ],
    [
      [0, 3],
      [1, 2],
    ],
  ];

  combinations.forEach(([team1Indices, team2Indices]) => {
    const game = {
      team1: {
        player1: players[team1Indices[0]],
        player2: players[team1Indices[1]],
      },
      team2: {
        player1: players[team2Indices[0]],
        player2: players[team2Indices[1]],
      },
    };
    possibleGames.push(game);
  });

  // Filter to only unplayed games
  const unplayedGames = possibleGames.filter((game) => {
    return !gameExists(
      [game.team1.player1, game.team1.player2],
      [game.team2.player1, game.team2.player2],
    );
  });

  res.json(unplayedGames);
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

  // Check if game already exists
  if (
    gameExists([team1.player1, team1.player2], [team2.player1, team2.player2])
  ) {
    return res.status(400).json({ error: "This game has already been played" });
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
