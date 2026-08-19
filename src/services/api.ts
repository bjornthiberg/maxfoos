const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export interface Player {
  name: string;
  points: number;
  gamesPlayed: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface Team {
  player1: string;
  player2: string;
}

export interface Game {
  id: string;
  team1: Team;
  team2: Team;
  winner: "team1" | "team2";
  score: {
    team1: number;
    team2: number;
  };
  timestamp: string;
}

export interface NewGameData {
  team1: Team;
  team2: Team;
  winner: "team1" | "team2";
  score: {
    team1: number;
    team2: number;
  };
  password: string;
}

export interface Season {
  id: string;
  name: string;
  gameCount: number;
  players: string[];
  guests: string[];
}

export interface SeasonSummary {
  activeSeasonId: string;
  seasons: Season[];
}

export interface PlayerRoster {
  players: string[];
  guests: string[];
}

const seasonQuery = (seasonId?: string) =>
  seasonId ? `?season=${encodeURIComponent(seasonId)}` : "";

export const api = {
  // Get all seasons
  async getSeasons(): Promise<SeasonSummary> {
    const response = await fetch(`${API_BASE_URL}/seasons`);
    if (!response.ok) throw new Error("Failed to fetch seasons");
    return response.json();
  },

  // Get players for a season (default: active season)
  async getPlayers(seasonId?: string): Promise<PlayerRoster> {
    const response = await fetch(`${API_BASE_URL}/players${seasonQuery(seasonId)}`);
    if (!response.ok) throw new Error("Failed to fetch players");
    return response.json();
  },

  // Get games for a season (default: active season)
  async getGames(seasonId?: string): Promise<Game[]> {
    const response = await fetch(`${API_BASE_URL}/games${seasonQuery(seasonId)}`);
    if (!response.ok) throw new Error("Failed to fetch games");
    return response.json();
  },

  // Get player stats for a season (default: active season)
  async getStats(seasonId?: string): Promise<Player[]> {
    const response = await fetch(`${API_BASE_URL}/stats${seasonQuery(seasonId)}`);
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
  },

  // Add a new game
  async addGame(gameData: NewGameData): Promise<Game> {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gameData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to add game");
    }

    return response.json();
  },

  // Delete a game
  async deleteGame(id: string, password: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/games/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete game");
    }
  },

  // Verify admin password
  async verifyPassword(password: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.valid;
      }
      return false;
    } catch {
      return false;
    }
  },

};
