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

export interface UnplayedGame {
  team1: Team;
  team2: Team;
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

export const api = {
  // Get all players
  async getPlayers(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/players`);
    if (!response.ok) throw new Error("Failed to fetch players");
    return response.json();
  },

  // Get all games
  async getGames(): Promise<Game[]> {
    const response = await fetch(`${API_BASE_URL}/games`);
    if (!response.ok) throw new Error("Failed to fetch games");
    return response.json();
  },

  // Get player stats
  async getStats(): Promise<Player[]> {
    const response = await fetch(`${API_BASE_URL}/stats`);
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
  },

  // Get unplayed games
  async getUnplayedGames(): Promise<UnplayedGame[]> {
    const response = await fetch(`${API_BASE_URL}/games/unplayed`);
    if (!response.ok) throw new Error("Failed to fetch unplayed games");
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
