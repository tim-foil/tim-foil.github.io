// Global Point System for Fireboy vs Watergirl Game
class PointSystem {
  constructor() {
    this.fireboyPoints = 0;
    this.watergirlPoints = 0;
    this.totalRounds = 0;
    this.doorWins = {
      fireboy: 0,
      watergirl: 0,
    };

    // Load saved data from localStorage
    this.loadFromStorage();
  }

  // Add points to a player
  addPoints(player, points = 1, reason = "door") {
    if (player === "fireboy") {
      this.fireboyPoints += points;
      if (reason === "door") {
        this.doorWins.fireboy++;
      }
    } else if (player === "watergirl") {
      this.watergirlPoints += points;
      if (reason === "door") {
        this.doorWins.watergirl++;
      }
    }

    this.totalRounds++;
    this.saveToStorage();
    this.notifyPointsUpdate();
  }

  // Get points for a player
  getPoints(player) {
    return player === "fireboy" ? this.fireboyPoints : this.watergirlPoints;
  }

  // Get door wins for a player
  getDoorWins(player) {
    return player === "fireboy"
      ? this.doorWins.fireboy
      : this.doorWins.watergirl;
  }

  // Get total rounds played
  getTotalRounds() {
    return this.totalRounds;
  }

  // Reset all points
  resetPoints() {
    this.fireboyPoints = 0;
    this.watergirlPoints = 0;
    this.totalRounds = 0;
    this.doorWins = {
      fireboy: 0,
      watergirl: 0,
    };
    this.saveToStorage();
    this.notifyPointsUpdate();
  }

  // Get leaderboard data
  getLeaderboard() {
    return {
      fireboy: {
        totalPoints: this.fireboyPoints,
        doorWins: this.doorWins.fireboy,
        winRate:
          this.totalRounds > 0
            ? ((this.doorWins.fireboy / this.totalRounds) * 100).toFixed(1)
            : 0,
      },
      watergirl: {
        totalPoints: this.watergirlPoints,
        doorWins: this.doorWins.watergirl,
        winRate:
          this.totalRounds > 0
            ? ((this.doorWins.watergirl / this.totalRounds) * 100).toFixed(1)
            : 0,
      },
    };
  }

  // Save to localStorage
  saveToStorage() {
    const data = {
      fireboyPoints: this.fireboyPoints,
      watergirlPoints: this.watergirlPoints,
      totalRounds: this.totalRounds,
      doorWins: this.doorWins,
      lastUpdated: Date.now(),
    };
    localStorage.setItem("fireboyWatergirlPoints", JSON.stringify(data));
  }

  // Load from localStorage
  loadFromStorage() {
    try {
      const data = localStorage.getItem("fireboyWatergirlPoints");
      if (data) {
        const parsed = JSON.parse(data);
        this.fireboyPoints = parsed.fireboyPoints || 0;
        this.watergirlPoints = parsed.watergirlPoints || 0;
        this.totalRounds = parsed.totalRounds || 0;
        this.doorWins = parsed.doorWins || { fireboy: 0, watergirl: 0 };
      }
    } catch (error) {
      console.log("Could not load saved points:", error);
    }
  }

  // Notify other parts of the game about points update
  notifyPointsUpdate() {
    // Dispatch custom event for other parts of the game to listen to
    window.dispatchEvent(
      new CustomEvent("pointsUpdated", {
        detail: {
          fireboyPoints: this.fireboyPoints,
          watergirlPoints: this.watergirlPoints,
          totalRounds: this.totalRounds,
          doorWins: this.doorWins,
        },
      })
    );
  }

  // Export data for sharing or backup
  exportData() {
    return {
      fireboyPoints: this.fireboyPoints,
      watergirlPoints: this.watergirlPoints,
      totalRounds: this.totalRounds,
      doorWins: this.doorWins,
      leaderboard: this.getLeaderboard(),
      exportedAt: new Date().toISOString(),
    };
  }

  // Import data from backup
  importData(data) {
    if (data.fireboyPoints !== undefined)
      this.fireboyPoints = data.fireboyPoints;
    if (data.watergirlPoints !== undefined)
      this.watergirlPoints = data.watergirlPoints;
    if (data.totalRounds !== undefined) this.totalRounds = data.totalRounds;
    if (data.doorWins) this.doorWins = data.doorWins;

    this.saveToStorage();
    this.notifyPointsUpdate();
  }
}

// Create global instance
window.pointSystem = new PointSystem();

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = PointSystem;
}
