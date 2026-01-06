// Game Engine and Character Classes
class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.currentLevel = 1;
    this.maxLevels = 5;
    this.gameMode = "competitive"; // 'competitive' or 'cooperative'
    this.gameState = "menu"; // 'menu', 'playing', 'paused', 'gameOver'

    this.fireboy = null;
    this.watergirl = null;
    this.projectiles = [];
    this.powerUps = [];
    this.platforms = [];
    this.goals = [];
    this.enemies = [];
    this.defenseWalls = []; // Active defense barriers
    this.effects = []; // Visual effects array
    this.acidRain = []; // Acid rain particles

    // Active defense system
    this.activeDefense = {
      fireboy: false,
      watergirl: false,
    };
    this.defenseCooldown = {
      fireboy: 0,
      watergirl: 0,
    };
    this.defenseStartTime = {
      fireboy: 0,
      watergirl: 0,
    };
    this.defenseDuration = 3000; // 3 seconds (in milliseconds for Date.now() comparison)
    this.defenseCooldownTime = 7; // 7 seconds cooldown (in seconds for deltaTime)

    this.fireboyScore = 0;
    this.watergirlScore = 0;

    this.keys = {};
    this.lastTime = 0;
    this.gameSpeed = 1;
    this.isTabVisible = true;
    this.maxDeltaTime = 1 / 30; // Cap delta time to 30 FPS minimum

    // Door system
    this.door = null;
    this.doorSpawnTime = 0;
    this.doorSpawnDelay = 0;
    this.doorActive = false;
    this.doorCountdown = 0;
    this.gameStartTime = 0;
    this.defenseCount = {
      fireboy: 0,
      watergirl: 0,
    };

    // Victory system
    this.victoryDeclared = false;
    this.victoryWinner = null;

    // Power-up spawning system
    this.lastPowerUpSpawn = 0;
    this.powerUpSpawnDelay = 8000; // 8 seconds between power-ups
    this.maxPowerUps = 3; // Maximum power-ups on screen at once
    this.ultimateReady = {
      fireboy: false,
      watergirl: false,
    };
    this.ultimateCooldown = {
      fireboy: 0,
      watergirl: 0,
    };

    // Sound effects (using Web Audio API)
    this.audioContext = null;
    this.sounds = {};

    // Game assets
    this.assets = {
      background: null,
      level2Background: null,
      level3Background: null,
      fireboySprite: null,
      watergirlSprite: null,
      doorSprite: null,
      platformSprite: null,
    };
    this.assetsLoaded = 0;
    this.totalAssets = 7;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initAudio();
    this.loadAssets();
    // Start game loop immediately
    this.gameLoop();
  }

  loadAssets() {
    // Load background image
    this.assets.background = new Image();
    this.assets.background.onload = () => {
      this.assetsLoaded++;
      this.checkAssetsLoaded();
    };
    this.assets.background.src = "assets/main-bg.png";

    // Load level 2 background image
    this.assets.level2Background = new Image();
    this.assets.level2Background.onload = () => {
      this.assetsLoaded++;
      this.checkAssetsLoaded();
    };
    this.assets.level2Background.src = "assets/lvl2bg.png";

    // Load level 3 background image
    this.assets.level3Background = new Image();
    this.assets.level3Background.onload = () => {
      this.assetsLoaded++;
      this.checkAssetsLoaded();
    };
    this.assets.level3Background.src = "assets/lvl3bg.png";

    // Load Fireboy sprite
    this.assets.fireboySprite = new Image();
    this.assets.fireboySprite.onload = () => {
      this.assetsLoaded++;
      this.checkAssetsLoaded();
    };
    this.assets.fireboySprite.src = "assets/fireboy.webp";

    // Load Watergirl sprite
    this.assets.watergirlSprite = new Image();
    this.assets.watergirlSprite.onload = () => {
      this.assetsLoaded++;
      this.checkAssetsLoaded();
    };
    this.assets.watergirlSprite.src = "assets/watergirl.webp";

    // Load Door sprite
    this.assets.doorSprite = new Image();
    this.assets.doorSprite.onload = () => {
      this.assetsLoaded++;
      this.checkAssetsLoaded();
    };
    this.assets.doorSprite.src = "assets/door.png";

    // Load Platform sprite
    this.assets.platformSprite = new Image();
    this.assets.platformSprite.onload = () => {
      this.assetsLoaded++;
      this.checkAssetsLoaded();
    };
    this.assets.platformSprite.src = "assets/platform.png";
  }

  checkAssetsLoaded() {
    if (this.assetsLoaded >= this.totalAssets) {
      this.createLevel(this.currentLevel);
    }
  }

  initAudio() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    } catch (e) {
      console.log("Web Audio API not supported");
    }
  }

  playSound(frequency, duration, type = "sine") {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(
      frequency,
      this.audioContext.currentTime
    );
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  addEffect(x, y, type, duration = 1000) {
    this.effects.push(new Effect(x, y, type, duration));
  }

  addTextEffect(x, y, text, color, duration = 2000) {
    this.effects.push(new TextEffect(x, y, text, color, duration));
  }

  createDefenseBarrier(defender) {
    // Create a defense barrier in the direction the character is facing
    if (defender === "fireboy" && this.fireboy) {
      let barrierX;
      if (this.fireboy.facingRight) {
        // Barrier in front when facing right (with 2px margin)
        barrierX = this.fireboy.x + this.fireboy.width + 10;
      } else {
        // Barrier in front when facing left (with 2px margin)
        barrierX = this.fireboy.x - 6; // 4px width + 2px margin
      }

      const barrier = new DefenseBarrier(
        barrierX,
        this.fireboy.y + this.fireboy.height / 2 - 25, // Center vertically
        defender
      );
      this.defenseWalls.push(barrier);
    } else if (defender === "watergirl" && this.watergirl) {
      let barrierX;
      if (this.watergirl.facingRight) {
        // Barrier in front when facing right (with 2px margin)
        barrierX = this.watergirl.x + this.watergirl.width + 2;
      } else {
        // Barrier in front when facing left (with 2px margin)
        barrierX = this.watergirl.x - 6; // 4px width + 2px margin
      }

      const barrier = new DefenseBarrier(
        barrierX,
        this.watergirl.y + this.watergirl.height / 2 - 25, // Center vertically
        defender
      );
      this.defenseWalls.push(barrier);
    }
  }

  setupEventListeners() {
    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      e.preventDefault();
    });

    document.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
      e.preventDefault();
    });

    // Button controls
    document
      .getElementById("startBtn")
      .addEventListener("click", () => this.startGame());
    document
      .getElementById("pauseBtn")
      .addEventListener("click", () => showPauseMenu());
    document
      .getElementById("resetBtn")
      .addEventListener("click", () => this.resetLevel());
    document
      .getElementById("nextLevelBtn")
      .addEventListener("click", () => this.nextLevel());
    document
      .getElementById("restartBtn")
      .addEventListener("click", () => this.restartGame());

    // Handle tab visibility changes
    document.addEventListener("visibilitychange", () => {
      this.isTabVisible = !document.hidden;
      if (!this.isTabVisible) {
        // Reset lastTime when tab becomes hidden to prevent large delta time
        this.lastTime = 0;
      }
    });
  }

  createLevel(level) {
    this.projectiles = [];
    this.powerUps = [];
    this.platforms = [];
    this.goals = [];
    this.enemies = [];
    this.defenseWalls = [];
    this.acidRain = [];

    // Reset defense system
    this.activeDefense = {
      fireboy: false,
      watergirl: false,
    };
    this.defenseCooldown = {
      fireboy: 0,
      watergirl: 0,
    };
    this.defenseStartTime = {
      fireboy: 0,
      watergirl: 0,
    };

    // Reset door system
    this.door = null;
    this.doorActive = false;
    this.doorCountdown = 0;
    this.gameStartTime = Date.now();
    this.doorSpawnDelay = 15000 + Math.random() * 15000; // 15-30 seconds

    // Reset power-up spawning system
    this.lastPowerUpSpawn = 0;

    // Reset defense counts
    this.defenseCount = {
      fireboy: 0,
      watergirl: 0,
    };

    // Reset victory system
    this.victoryDeclared = false;
    this.victoryWinner = null;
    // Reset ultimate skills
    this.ultimateReady = {
      fireboy: false,
      watergirl: false,
    };
    this.ultimateCooldown = {
      fireboy: 0,
      watergirl: 0,
    };

    // Create characters (always create them, even if assets aren't loaded)
    this.fireboy = new Fireboy(100, this.height - 150);
    this.watergirl = new Watergirl(this.width - 150, this.height - 150);

    // Level-specific setup
    switch (level) {
      case 1:
        this.setupCompetitiveLevel();
        break;
      case 2:
        this.setupCooperativeLevel();
        break;
      case 3:
        this.setupBossLevel();
        break;
      case 4:
        this.setupPuzzleLevel();
        break;
      case 5:
        this.setupFinalLevel();
        break;
    }

    this.updateUI();
  }

  setupCompetitiveLevel() {
    this.gameMode = "competitive";
    document.getElementById("currentMode").textContent = "Competitive";
    document.getElementById("objectiveText").textContent =
      "Defeat your opponent!";

    // Create platforms
    this.platforms = [
      new Platform(0, this.height - 50, this.width, 50, "#8B4513"),
      new Platform(200, this.height - 200, 200, 20, "#8B4513"),
      new Platform(600, this.height - 200, 200, 20, "#8B4513"),
      new Platform(400, this.height - 350, 200, 20, "#8B4513"),
    ];

    // Power-ups will be spawned randomly during gameplay
  }

  setupCooperativeLevel() {
    this.gameMode = "cooperative";
    document.getElementById("currentMode").textContent = "Cooperative";
    document.getElementById("objectiveText").textContent =
      "Work together to reach the goal!";

    // Create platforms
    this.platforms = [
      new Platform(0, this.height - 50, this.width, 50, "#8B4513"),
      new Platform(150, this.height - 200, 150, 20, "#8B4513"),
      new Platform(300, this.height - 350, 150, 20, "#8B4513"),
      new Platform(450, this.height - 500, 150, 20, "#8B4513"),
      new Platform(600, this.height - 350, 150, 20, "#8B4513"),
      new Platform(750, this.height - 200, 150, 20, "#8B4513"),
    ];

    // Create goal - REMOVED to prevent game freeze
    // this.goals.push(new Goal(850, this.height - 250, "both"));

    // Add enemies that both players must defeat
    this.enemies.push(new Enemy(400, this.height - 400, "fire"));
    this.enemies.push(new Enemy(500, this.height - 400, "water"));

    // Start acid rain for level 2
    this.startAcidRain();
  }

  setupBossLevel() {
    this.gameMode = "cooperative";
    document.getElementById("currentMode").textContent = "Boss Battle";
    document.getElementById("objectiveText").textContent =
      "Work together to defeat the boss!";

    // Disable door system for boss level
    this.door = null;
    this.doorActive = false;
    this.doorCountdown = 0;
    this.doorSpawnDelay = 0;

    // Create platforms
    this.platforms = [
      new Platform(0, this.height - 50, this.width, 50, "#8B4513"),
      new Platform(200, this.height - 200, 200, 20, "#8B4513"),
      new Platform(600, this.height - 200, 200, 20, "#8B4513"),
    ];

    // Add boss enemy
    this.enemies.push(new BossEnemy(this.width / 2 - 50, this.height - 300));
  }

  setupPuzzleLevel() {
    this.gameMode = "cooperative";
    document.getElementById("currentMode").textContent = "Puzzle";
    document.getElementById("objectiveText").textContent =
      "Solve the puzzle together!";

    // Create platforms
    this.platforms = [
      new Platform(0, this.height - 50, this.width, 50, "#8B4513"),
      new Platform(100, this.height - 200, 100, 20, "#8B4513"),
      new Platform(300, this.height - 200, 100, 20, "#8B4513"),
      new Platform(500, this.height - 200, 100, 20, "#8B4513"),
      new Platform(700, this.height - 200, 100, 20, "#8B4513"),
      new Platform(900, this.height - 200, 100, 20, "#8B4513"),
    ];

    // Create switches that both players need to activate
    this.goals.push(new Switch(150, this.height - 250, "fire"));
    this.goals.push(new Switch(350, this.height - 250, "water"));
    this.goals.push(new Switch(550, this.height - 250, "fire"));
    this.goals.push(new Switch(750, this.height - 250, "water"));
  }

  setupFinalLevel() {
    this.gameMode = "competitive";
    document.getElementById("currentMode").textContent = "Final Battle";
    document.getElementById("objectiveText").textContent = "Final showdown!";

    // Create platforms
    this.platforms = [
      new Platform(0, this.height - 50, this.width, 50, "#8B4513"),
      new Platform(200, this.height - 200, 200, 20, "#8B4513"),
      new Platform(600, this.height - 200, 200, 20, "#8B4513"),
      new Platform(400, this.height - 350, 200, 20, "#8B4513"),
    ];

    // Power-ups will be spawned randomly during gameplay
  }

  startGame() {
    this.gameState = "playing";
    document.getElementById("startBtn").style.display = "none";
    document.getElementById("pauseBtn").style.display = "inline-block";
  }

  resetLevel() {
    this.createLevel(this.currentLevel);
    this.gameState = "playing";
  }

  nextLevel() {
    if (this.currentLevel < this.maxLevels) {
      this.currentLevel++;
      this.createLevel(this.currentLevel);
      document.getElementById("nextLevelBtn").style.display = "none";
    }
  }

  restartGame() {
    this.currentLevel = 1;
    this.fireboyScore = 0;
    this.watergirlScore = 0;
    this.createLevel(this.currentLevel);
    this.gameState = "playing";
    document.getElementById("gameOverScreen").classList.add("hidden");
  }

  update(deltaTime) {
    if (this.gameState !== "playing") return;

    // Don't update physics when tab is not visible to prevent glitches
    if (!this.isTabVisible) return;

    // Update door system (skip for level 3 - boss battle)
    if (this.currentLevel !== 3) {
      this.updateDoorSystem(deltaTime);
    }

    // Update power-up spawning
    this.updatePowerUpSpawning(deltaTime);

    // Update ultimate skill cooldowns
    this.updateUltimateCooldowns(deltaTime);

    // Update defense system
    this.updateDefenseSystem(deltaTime);

    // Update characters (only if they exist)
    if (this.fireboy) {
      this.fireboy.update(deltaTime, this.keys, this.platforms);
    }
    if (this.watergirl) {
      this.watergirl.update(deltaTime, this.keys, this.platforms);
    }

    // Update projectiles
    this.projectiles.forEach((projectile, index) => {
      projectile.update(deltaTime);
      if (projectile.isOffScreen(this.width, this.height)) {
        this.projectiles.splice(index, 1);
      }
    });

    // Update enemies
    this.enemies.forEach((enemy) => {
      if (enemy instanceof BossEnemy) {
        enemy.update(deltaTime, this);
      } else {
        enemy.update(deltaTime);
      }
    });

    // Update effects
    this.effects.forEach((effect, index) => {
      effect.update(deltaTime);
      if (effect.isFinished()) {
        this.effects.splice(index, 1);
      }
    });

    // Update acid rain
    this.updateAcidRain(deltaTime);

    // Update defense walls
    this.defenseWalls.forEach((wall, index) => {
      if (!wall.update(deltaTime)) {
        this.defenseWalls.splice(index, 1);
      }
    });

    // Check collisions
    this.checkCollisions();

    // Check win conditions
    this.checkWinConditions();
  }

  updateDoorSystem(deltaTime) {
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.gameStartTime;

    // Check if it's time to spawn the door
    if (!this.doorActive && elapsedTime >= this.doorSpawnDelay) {
      this.spawnDoor();
    }

    // Update door countdown
    if (this.doorActive) {
      this.doorCountdown = Math.max(0, this.doorSpawnDelay - elapsedTime);
    }

    // Update door animation
    if (this.door) {
      this.door.update(deltaTime);
    }

    // Check door collision
    if (this.door && this.fireboy && this.watergirl) {
      this.checkDoorCollision();
    }
  }

  spawnDoor() {
    // Find a random platform to spawn the door on
    const availablePlatforms = this.platforms.filter(
      (platform) => platform.y < this.height - 100 && platform.width > 100
    );

    if (availablePlatforms.length > 0) {
      const randomPlatform =
        availablePlatforms[
          Math.floor(Math.random() * availablePlatforms.length)
        ];
      this.door = new Door(
        randomPlatform.x + (randomPlatform.width - 80) / 2,
        randomPlatform.y - 73,
        this.assets.doorSprite
      );
      this.doorActive = true;
      this.doorSpawnTime = Date.now();

      // Play door spawn sound
      this.playSound(500, 0.5, "triangle");

      // Add visual effect
      this.addEffect(this.door.x + 30, this.door.y + 30, "goal");
      this.addTextEffect(
        this.door.x + 30,
        this.door.y - 20,
        "DOOR APPEARED!",
        "#ffff00"
      );
    }
  }

  checkDoorCollision() {
    if (!this.door) return;

    // Check if Fireboy reaches the door (only if alive)
    if (
      this.fireboy &&
      this.fireboy.health > 0 &&
      this.door.checkCollision(this.fireboy)
    ) {
      this.handleDoorWin("fireboy");
    }
    // Check if Watergirl reaches the door (only if alive)
    else if (
      this.watergirl &&
      this.watergirl.health > 0 &&
      this.door.checkCollision(this.watergirl)
    ) {
      this.handleDoorWin("watergirl");
    }
  }

  handleDoorWin(winner) {
    // Add points using global point system
    if (window.pointSystem) {
      window.pointSystem.addPoints(winner, 1, "door");
    }

    // Update local scores
    if (winner === "fireboy") {
      this.fireboyScore++;
    } else {
      this.watergirlScore++;
    }

    // Play win sound
    this.playSound(800, 1.0, "sine");

    // Add visual effects
    this.addEffect(this.door.x + 30, this.door.y + 30, "goal");
    this.addTextEffect(
      this.door.x + 30,
      this.door.y - 20,
      `${winner.toUpperCase()} WINS!`,
      winner === "fireboy" ? "#ff6b35" : "#4a90e2"
    );

    // Reset door
    this.door = null;
    this.doorActive = false;
    this.doorCountdown = 0;
    this.doorSpawnDelay = 15000 + Math.random() * 15000; // Reset for next door

    // Update UI
    this.updateUI();

    // Automatically transition to next level after a short delay
    setTimeout(() => {
      if (this.currentLevel === 1) {
        window.location.href = "level2.html";
      } else if (this.currentLevel === 2) {
        window.location.href = "level3.html";
      } else if (this.currentLevel === 3) {
        // Level 3 is the final level, could redirect to main menu or show completion
        window.location.href = "main-menu.html";
      }
    }, 2000); // 2 second delay to show the win effect
  }

  updatePowerUpSpawning(deltaTime) {
    const currentTime = Date.now();

    // Check if it's time to spawn a new power-up
    if (
      currentTime - this.lastPowerUpSpawn >= this.powerUpSpawnDelay &&
      this.powerUps.length < this.maxPowerUps
    ) {
      this.spawnRandomPowerUp();
      this.lastPowerUpSpawn = currentTime;
    }
  }

  spawnRandomPowerUp() {
    // Available power-up types
    const powerUpTypes = ["health", "speed"];

    // Choose random type
    const randomType =
      powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

    // Find a safe spawn location (on a platform)
    const availablePlatforms = this.platforms.filter(
      (platform) => platform.y < this.height - 100 && platform.width > 60
    );

    if (availablePlatforms.length > 0) {
      const randomPlatform =
        availablePlatforms[
          Math.floor(Math.random() * availablePlatforms.length)
        ];

      // Spawn power-up on the platform
      const powerUp = new PowerUp(
        randomPlatform.x + Math.random() * (randomPlatform.width - 30),
        randomPlatform.y - 35,
        randomType
      );

      this.powerUps.push(powerUp);

      // Add visual effect
      this.addEffect(powerUp.x + 15, powerUp.y + 15, "powerup");
      this.addTextEffect(
        powerUp.x + 15,
        powerUp.y - 10,
        `${randomType.toUpperCase()} SPAWNED!`,
        "#ffff00"
      );

      // Play spawn sound
      this.playSound(400, 0.3, "triangle");
    }
  }

  updateUltimateCooldowns(deltaTime) {
    // Update ultimate cooldowns
    if (this.ultimateCooldown.fireboy > 0) {
      this.ultimateCooldown.fireboy -= deltaTime;
      if (this.ultimateCooldown.fireboy <= 0) {
        this.ultimateCooldown.fireboy = 0;
        // Don't set ultimateReady to false here - it should only be set to true when defenseCount >= 5
      }
    }
    if (this.ultimateCooldown.watergirl > 0) {
      this.ultimateCooldown.watergirl -= deltaTime;
      if (this.ultimateCooldown.watergirl <= 0) {
        this.ultimateCooldown.watergirl = 0;
        // Don't set ultimateReady to false here - it should only be set to true when defenseCount >= 5
      }
    }
  }

  updateDefenseSystem(deltaTime) {
    // Update defense cooldowns
    if (this.defenseCooldown.fireboy > 0) {
      this.defenseCooldown.fireboy -= deltaTime;
      if (this.defenseCooldown.fireboy <= 0) {
        this.defenseCooldown.fireboy = 0;
      }
    }
    if (this.defenseCooldown.watergirl > 0) {
      this.defenseCooldown.watergirl -= deltaTime;
      if (this.defenseCooldown.watergirl <= 0) {
        this.defenseCooldown.watergirl = 0;
      }
    }

    // Clear existing barriers
    this.defenseWalls = [];

    // Check if defense duration has expired first
    if (
      this.activeDefense.fireboy &&
      Date.now() - this.defenseStartTime.fireboy >= this.defenseDuration
    ) {
      this.activeDefense.fireboy = false;
      this.defenseCooldown.fireboy = this.defenseCooldownTime;
    }
    if (
      this.activeDefense.watergirl &&
      Date.now() - this.defenseStartTime.watergirl >= this.defenseDuration
    ) {
      this.activeDefense.watergirl = false;
      this.defenseCooldown.watergirl = this.defenseCooldownTime;
    }

    // Handle active defense for Fireboy
    if (
      this.keys["KeyQ"] &&
      this.defenseCooldown.fireboy <= 0 &&
      this.fireboy &&
      !this.activeDefense.fireboy
    ) {
      // Start new defense
      this.activeDefense.fireboy = true;
      this.defenseStartTime.fireboy = Date.now();
    }

    // Handle active defense for Watergirl
    if (
      this.keys["KeyP"] &&
      this.defenseCooldown.watergirl <= 0 &&
      this.watergirl &&
      !this.activeDefense.watergirl
    ) {
      // Start new defense
      this.activeDefense.watergirl = true;
      this.defenseStartTime.watergirl = Date.now();
    }

    // Create barriers for active defenses
    if (this.activeDefense.fireboy) {
      this.createDefenseBarrier("fireboy");
    }
    if (this.activeDefense.watergirl) {
      this.createDefenseBarrier("watergirl");
    }
  }

  checkProjectileCollisions() {
    // Check for projectile vs projectile collisions
    // Use a different approach to avoid array modification issues
    const projectilesToRemove = new Set();

    for (let i = 0; i < this.projectiles.length; i++) {
      if (projectilesToRemove.has(i)) continue; // Skip already marked projectiles

      for (let j = i + 1; j < this.projectiles.length; j++) {
        if (projectilesToRemove.has(j)) continue; // Skip already marked projectiles

        const proj1 = this.projectiles[i];
        const proj2 = this.projectiles[j];

        // Check if projectiles are different types and colliding
        if (proj1.type !== proj2.type && proj1.checkCollision(proj2)) {
          // Create explosion effect at collision point
          const collisionX = (proj1.x + proj2.x) / 2;
          const collisionY = (proj1.y + proj2.y) / 2;
          this.addEffect(collisionX, collisionY, "explosion");
          this.addTextEffect(
            collisionX,
            collisionY - 20,
            "DEFENSE WALL!",
            "#ffff00"
          );

          // Play collision sound
          this.playSound(300, 0.3, "square");

          // Determine who gets the defense point (the one who shot the projectile that was blocked)
          const defender = proj1.type === "fireball" ? "watergirl" : "fireboy";
          const attacker = proj1.type === "fireball" ? "fireboy" : "watergirl";

          // Add points for successful defense
          if (window.pointSystem) {
            window.pointSystem.addPoints(defender, 1, "defense");
          }

          // Track defense count
          this.defenseCount[defender]++;

          // Check if ultimate skill is ready
          if (
            this.defenseCount[defender] >= 5 &&
            !this.ultimateReady[defender] &&
            this.ultimateCooldown[defender] <= 0
          ) {
            this.ultimateReady[defender] = true;
            this.addTextEffect(
              this.fireboy.x +
                (defender === "fireboy"
                  ? 0
                  : this.watergirl.x - this.fireboy.x),
              this.fireboy.y - 50,
              `${defender.toUpperCase()} ULTIMATE READY!`,
              defender === "fireboy" ? "#ff6b35" : "#4a90e2"
            );
            this.playSound(400, 0.8, "triangle");
          }

          // Mark both projectiles for removal
          projectilesToRemove.add(i);
          projectilesToRemove.add(j);

          // Break out of inner loop since we found a collision
          break;
        }
      }
    }

    // Remove marked projectiles in reverse order to maintain correct indices
    const sortedIndices = Array.from(projectilesToRemove).sort((a, b) => b - a);
    for (const index of sortedIndices) {
      this.projectiles.splice(index, 1);
    }
  }

  checkProjectileNearMisses() {
    // Check for projectiles that are close to colliding (for visual effects)
    for (let i = 0; i < this.projectiles.length; i++) {
      for (let j = i + 1; j < this.projectiles.length; j++) {
        const proj1 = this.projectiles[i];
        const proj2 = this.projectiles[j];

        // Check if projectiles are different types and close to each other
        if (proj1.type !== proj2.type) {
          const distance = Math.sqrt(
            Math.pow(proj1.x - proj2.x, 2) + Math.pow(proj1.y - proj2.y, 2)
          );

          // If projectiles are close but not colliding, add a warning effect
          if (distance < 30 && distance > 15) {
            // Add a subtle warning effect between the projectiles
            const midX = (proj1.x + proj2.x) / 2;
            const midY = (proj1.y + proj2.y) / 2;

            // Only add effect occasionally to avoid spam
            if (Math.random() < 0.1) {
              this.addEffect(midX, midY, "warning");
            }
          }
        }
      }
    }
  }

  checkCollisions() {
    // Only check collisions if characters exist
    if (!this.fireboy || !this.watergirl) return;

    // Projectile vs Projectile collisions (defense system)
    this.checkProjectileCollisions();
    this.checkProjectileNearMisses();

    // Projectile vs Character collisions
    this.projectiles.forEach((projectile, projIndex) => {
      if (
        projectile.type === "fireball" &&
        this.watergirl.checkCollision(projectile)
      ) {
        const damage = projectile.damage || 20; // Use ultimate damage if available
        this.watergirl.takeDamage(damage);
        this.addEffect(this.watergirl.x, this.watergirl.y, "hit");
        this.playSound(200, 0.2, "sawtooth");

        // Add special effect for ultimate hits
        if (projectile.damage > 20) {
          this.addTextEffect(
            this.watergirl.x,
            this.watergirl.y - 30,
            "ULTIMATE HIT!",
            "#ff0000"
          );
          this.addEffect(this.watergirl.x, this.watergirl.y, "explosion");
        }

        this.projectiles.splice(projIndex, 1);
      } else if (
        projectile.type === "waterball" &&
        this.fireboy.checkCollision(projectile)
      ) {
        const damage = projectile.damage || 20; // Use ultimate damage if available
        this.fireboy.takeDamage(damage);
        this.addEffect(this.fireboy.x, this.fireboy.y, "hit");
        this.playSound(200, 0.2, "sawtooth");

        // Add special effect for ultimate hits
        if (projectile.damage > 20) {
          this.addTextEffect(
            this.fireboy.x,
            this.fireboy.y - 30,
            "ULTIMATE HIT!",
            "#ff0000"
          );
          this.addEffect(this.fireboy.x, this.fireboy.y, "explosion");
        }

        this.projectiles.splice(projIndex, 1);
      }
    });

    // Boss Projectile vs Character collisions
    this.projectiles.forEach((projectile, projIndex) => {
      if (projectile instanceof BossProjectile) {
        if (projectile.type === "fire" && this.fireboy.checkCollision(projectile)) {
          this.fireboy.takeDamage(15);
          this.addEffect(this.fireboy.x, this.fireboy.y, "hit");
          this.addTextEffect(this.fireboy.x, this.fireboy.y - 30, "BOSS HIT!", "#ff0000");
          this.playSound(200, 0.2, "sawtooth");
          this.projectiles.splice(projIndex, 1);
        } else if (projectile.type === "water" && this.watergirl.checkCollision(projectile)) {
          this.watergirl.takeDamage(15);
          this.addEffect(this.watergirl.x, this.watergirl.y, "hit");
          this.addTextEffect(this.watergirl.x, this.watergirl.y - 30, "BOSS HIT!", "#ff0000");
          this.playSound(200, 0.2, "sawtooth");
          this.projectiles.splice(projIndex, 1);
        }
      }
    });

    // Player Projectile vs Boss collisions
    this.projectiles.forEach((projectile, projIndex) => {
      if ((projectile.type === "fireball" || projectile.type === "waterball") && !(projectile instanceof BossProjectile)) {
        this.enemies.forEach((enemy, enemyIndex) => {
          if (enemy instanceof BossEnemy && projectile.checkCollision(enemy)) {
            const damage = projectile.damage || 20;
            enemy.takeDamage(damage);
            this.addEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "hit");
            this.addTextEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2 - 30, `-${damage}`, "#ffff00");
            this.playSound(300, 0.3, "square");
            this.projectiles.splice(projIndex, 1);
          }
        });
      }
    });

    // Projectile vs Defense Barrier collisions
    this.projectiles.forEach((projectile, projIndex) => {
      // Skip boss projectiles - they cannot be blocked by defense walls
      if (projectile instanceof BossProjectile) {
        return;
      }
      
      this.defenseWalls.forEach((barrier, barrierIndex) => {
        if (barrier.checkCollision(projectile) && barrier.active) {
          // Check if the projectile belongs to the same player as the barrier
          const projectileOwner =
            projectile.type === "fireball" ? "fireboy" : "watergirl";

          // Only block projectiles from the opposite player
          if (projectileOwner !== barrier.defender) {
            // Projectile hits active defense barrier - block it
            this.addEffect(projectile.x, projectile.y, "explosion");
            this.addTextEffect(
              projectile.x,
              projectile.y - 20,
              "BLOCKED!",
              "#ffff00"
            );
            this.playSound(300, 0.3, "square");

            // Award defense points only for successful blocks with active defense
            if (window.pointSystem) {
              window.pointSystem.addPoints(barrier.defender, 1, "defense");
            }

            // Track defense count for ultimate
            this.defenseCount[barrier.defender]++;

            // Remove the projectile
            this.projectiles.splice(projIndex, 1);
          }
        }
      });
    });

    // Character vs Power-up collisions
    this.powerUps.forEach((powerUp, index) => {
      if (this.fireboy.checkCollision(powerUp)) {
        powerUp.apply(this.fireboy);
        this.addEffect(powerUp.x, powerUp.y, "powerup");
        this.addTextEffect(
          powerUp.x,
          powerUp.y - 20,
          `+${powerUp.type.toUpperCase()}`,
          "#ff6b35"
        );
        this.playSound(400, 0.3, "square");
        this.powerUps.splice(index, 1);
      } else if (this.watergirl.checkCollision(powerUp)) {
        powerUp.apply(this.watergirl);
        this.addEffect(powerUp.x, powerUp.y, "powerup");
        this.addTextEffect(
          powerUp.x,
          powerUp.y - 20,
          `+${powerUp.type.toUpperCase()}`,
          "#4a90e2"
        );
        this.playSound(400, 0.3, "square");
        this.powerUps.splice(index, 1);
      }
    });

    // Character vs Goal collisions
    this.goals.forEach((goal) => {
      if (goal.checkCollision(this.fireboy, this.watergirl)) {
        goal.activate();
        this.addEffect(goal.x, goal.y, "goal");
        this.playSound(600, 0.5, "triangle");
      }
    });

    // Acid rain vs Character collisions
    this.acidRain.forEach((drop, dropIndex) => {
      if (this.fireboy && drop.checkCollision(this.fireboy)) {
        this.fireboy.takeDamage(drop.damage);
        this.addEffect(drop.x, drop.y, "hit");
        this.addTextEffect(drop.x, drop.y - 10, "ACID!", "#00ff00");
        this.acidRain.splice(dropIndex, 1);
      } else if (this.watergirl && drop.checkCollision(this.watergirl)) {
        this.watergirl.takeDamage(drop.damage);
        this.addEffect(drop.x, drop.y, "hit");
        this.addTextEffect(drop.x, drop.y - 10, "ACID!", "#00ff00");
        this.acidRain.splice(dropIndex, 1);
      }
    });
  }

  checkWinConditions() {
    // Only check win conditions if characters exist
    if (!this.fireboy || !this.watergirl) return;

    if (this.gameMode === "competitive") {
      // Check if a character has died and spawn door immediately
      if (
        (this.fireboy.health <= 0 || this.watergirl.health <= 0) &&
        !this.victoryDeclared
      ) {
        // If door hasn't spawned yet, spawn it immediately
        if (!this.door && !this.doorActive) {
          this.spawnDoor();
        }

        // Determine winner and show immediate victory
        let winner = null;
        if (this.fireboy.health <= 0 && this.watergirl.health > 0) {
          winner = "watergirl";
        } else if (this.watergirl.health <= 0 && this.fireboy.health > 0) {
          winner = "fireboy";
        }

        if (winner) {
          // Mark victory as declared to prevent looping
          this.victoryDeclared = true;
          this.victoryWinner = winner;

          // Show victory overlay
          this.showVictoryOverlay(winner);

          // Add points using global point system
          if (window.pointSystem) {
            window.pointSystem.addPoints(winner, 1, "victory");
          }

          // Update local scores
          if (winner === "fireboy") {
            this.fireboyScore++;
          } else {
            this.watergirlScore++;
          }

          // Play victory sound
          this.playSound(800, 1.0, "sine");

          // Add visual effects
          this.addEffect(this.width / 2, this.height / 2, "goal");

          // Update UI
          this.updateUI();
        }
      }
    } else if (this.gameMode === "cooperative") {
      // Check if a character has died and spawn door immediately
      if (this.fireboy.health <= 0 || this.watergirl.health <= 0) {
        // If door hasn't spawned yet, spawn it immediately
        if (!this.door && !this.doorActive) {
          this.spawnDoor();
        }
      }

      // Check if all goals are activated (only if there are goals)
      if (this.goals.length > 0) {
        const allGoalsActivated = this.goals.every((goal) => goal.activated);
        if (allGoalsActivated) {
          this.showLevelComplete();
        }
      }
    }

    // Check for boss defeat (level 3 specific)
    if (this.currentLevel === 3) {
      // Check if either character has died - this means level failed
      if ((this.fireboy.health <= 0 || this.watergirl.health <= 0) && !this.victoryDeclared) {
        this.victoryDeclared = true;
        this.showLevelFailed();
        return;
      }

      // Check for boss defeat
      const boss = this.enemies.find(enemy => enemy instanceof BossEnemy);
      if (boss && boss.health <= 0 && !this.victoryDeclared) {
        this.victoryDeclared = true;
        this.victoryWinner = "both";
        
        // Show victory overlay for both players
        this.showVictoryOverlay("both");
        
        // Add points for both players
        if (window.pointSystem) {
          window.pointSystem.addPoints("fireboy", 1, "boss_defeat");
          window.pointSystem.addPoints("watergirl", 1, "boss_defeat");
        }
        
        // Update local scores
        this.fireboyScore++;
        this.watergirlScore++;
        
        // Play victory sound
        this.playSound(800, 1.0, "sine");
        
        // Add visual effects
        this.addEffect(this.width / 2, this.height / 2, "explosion");
        this.addTextEffect(this.width / 2, this.height / 2 - 50, "BOSS DEFEATED!", "#ffff00");
        
        // Update UI
        this.updateUI();
      }
    }
  }

  showGameOver(winner) {
    this.gameState = "gameOver";
    document.getElementById("gameOverTitle").textContent = "Round Over!";
    document.getElementById("gameOverMessage").textContent = winner;
    document.getElementById("gameOverScreen").classList.remove("hidden");
    document.getElementById("nextLevelBtn").style.display = "inline-block";
  }

  showLevelComplete() {
    this.gameState = "gameOver";
    document.getElementById("gameOverTitle").textContent = "Level Complete!";
    document.getElementById("gameOverMessage").textContent = "Great teamwork!";
    document.getElementById("gameOverScreen").classList.remove("hidden");
    document.getElementById("nextLevelBtn").style.display = "inline-block";
  }

  showLevelFailed() {
    this.gameState = "gameOver";
    document.getElementById("gameOverTitle").textContent = "Level Failed";
    document.getElementById("gameOverMessage").textContent = "One of the heroes has fallen! Work together to defeat the boss!";
    document.getElementById("gameOverScreen").classList.remove("hidden");
    document.getElementById("nextLevelBtn").style.display = "none";
  }

  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Show loading screen if assets not loaded
    if (this.assetsLoaded < this.totalAssets) {
      this.drawLoadingScreen();
      return;
    }

    // Draw background
    this.drawBackground();

    // Draw platforms
    this.platforms.forEach((platform) => platform.render(this.ctx));

    // Draw goals
    this.goals.forEach((goal) => goal.render(this.ctx));

    // Draw power-ups
    this.powerUps.forEach((powerUp) => powerUp.render(this.ctx));

    // Draw enemies
    this.enemies.forEach((enemy) => {
      enemy.render(this.ctx);
      // Draw boss health bar if it's a boss
      if (enemy instanceof BossEnemy) {
        enemy.renderHealthBar(this.ctx, this.width);
      }
    });

    // Draw projectiles
    this.projectiles.forEach((projectile) => projectile.render(this.ctx));

    // Draw defense walls
    this.defenseWalls.forEach((wall) => wall.render(this.ctx));

    // Draw door
    if (this.door) {
      this.door.render(this.ctx);
    }

    // Draw characters (only if they exist)
    if (this.fireboy) {
      this.fireboy.render(this.ctx);
    }
    if (this.watergirl) {
      this.watergirl.render(this.ctx);
    }

    // Draw effects
    this.effects.forEach((effect) => effect.render(this.ctx));

    // Draw acid rain
    this.acidRain.forEach((drop) => drop.render(this.ctx));

    // Draw UI elements
    this.drawHealthBars();
    // Skip door UI for level 3 (boss battle)
    if (this.currentLevel !== 3) {
      this.drawDoorUI();
    }
    this.drawDefenseUI();
  }

  drawLoadingScreen() {
    // Draw background
    this.ctx.fillStyle = "#2c3e50";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw loading text
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 32px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "Loading Assets...",
      this.width / 2,
      this.height / 2 - 50
    );

    // Draw progress bar
    const progress = this.assetsLoaded / this.totalAssets;
    const barWidth = 400;
    const barHeight = 20;
    const barX = (this.width - barWidth) / 2;
    const barY = this.height / 2;

    // Background
    this.ctx.fillStyle = "#333";
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress
    this.ctx.fillStyle = "#ff6b35";
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Border
    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Progress text
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "16px Arial";
    this.ctx.fillText(
      `${Math.round(progress * 100)}%`,
      this.width / 2,
      barY + 40
    );

    this.ctx.textAlign = "left";
  }

  drawBackground() {
    if (this.currentLevel === 2 && this.assets.level2Background) {
      // Use level 2 background
      this.ctx.drawImage(
        this.assets.level2Background,
        0,
        0,
        this.width,
        this.height
      );
    } else if (this.currentLevel === 3 && this.assets.level3Background) {
      // Use level 3 background
      this.ctx.drawImage(
        this.assets.level3Background,
        0,
        0,
        this.width,
        this.height
      );
    } else if (this.assets.background) {
      // Draw background image scaled to fit canvas
      this.ctx.drawImage(this.assets.background, 0, 0, this.width, this.height);
    } else {
      // Fallback gradient background
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, "#87CEEB");
      gradient.addColorStop(0.5, "#98FB98");
      gradient.addColorStop(1, "#8FBC8F");
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawHealthBars() {
    // Only draw health bars if characters exist
    if (!this.fireboy || !this.watergirl) return;

    // Fireboy health bar background
    this.ctx.fillStyle = "#333";
    this.ctx.fillRect(18, 18, 204, 24);

    // Fireboy health bar
    const fireboyHealthWidth = (this.fireboy.health / 100) * 200;
    const fireboyGradient = this.ctx.createLinearGradient(
      20,
      20,
      20 + fireboyHealthWidth,
      20
    );
    fireboyGradient.addColorStop(0, "#ff0000");
    fireboyGradient.addColorStop(0.5, "#ff6b35");
    fireboyGradient.addColorStop(1, "#ffaa00");

    this.ctx.fillStyle = fireboyGradient;
    this.ctx.fillRect(20, 20, fireboyHealthWidth, 20);

    // Fireboy health bar border
    this.ctx.strokeStyle = "#ff6b35";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(20, 20, 200, 20);

    // Fireboy label
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 12px Arial";
    this.ctx.fillText("Fireboy", 64, 16);

    // Watergirl health bar background
    this.ctx.fillStyle = "#333";
    this.ctx.fillRect(this.width - 222, 18, 204, 24);

    // Watergirl health bar
    const watergirlHealthWidth = (this.watergirl.health / 100) * 200;
    const watergirlGradient = this.ctx.createLinearGradient(
      this.width - 220,
      20,
      this.width - 220 + watergirlHealthWidth,
      20
    );
    watergirlGradient.addColorStop(0, "#1e90ff");
    watergirlGradient.addColorStop(0.5, "#4a90e2");
    watergirlGradient.addColorStop(1, "#87CEEB");

    this.ctx.fillStyle = watergirlGradient;
    this.ctx.fillRect(this.width - 220, 20, watergirlHealthWidth, 20);

    // Watergirl health bar border
    this.ctx.strokeStyle = "#4a90e2";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.width - 220, 20, 200, 20);

    // Watergirl label
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 12px Arial";
    this.ctx.textAlign = "right";
    this.ctx.fillText("Watergirl", this.width - 20, 16);
    this.ctx.textAlign = "left";
  }

  showVictoryOverlay(winner) {
    // Show victory overlay
    document.getElementById("victoryOverlay").classList.remove("hidden");
    
    if (winner === "both") {
      document.getElementById("victoryWinner").textContent = "VICTORY!";
      document.getElementById("victoryWinner").style.color = "#ffff00";
    } else {
      document.getElementById("victoryWinner").textContent = `${winner.toUpperCase()} WINS!`;
      document.getElementById("victoryWinner").style.color =
        winner === "fireboy" ? "#ff6b35" : "#4a90e2";
    }
  }

  hideVictoryOverlay() {
    document.getElementById("victoryOverlay").classList.add("hidden");
  }

  proceedToLevel2() {
    this.hideVictoryOverlay();
    window.location.href = "level2.html";
  }

  proceedToLevel3() {
    this.hideVictoryOverlay();
    window.location.href = "level3.html";
  }

  returnToMainMenuFromVictory() {
    this.hideVictoryOverlay();
    document.getElementById("gameContainer").classList.add("hidden");
    document.getElementById("mainMenu").classList.remove("hidden");
  }

  drawDoorUI() {
    // Draw door countdown only if no one has won yet
    const hasWinner = this.victoryDeclared;

    if (this.doorActive && !hasWinner) {
      const timeLeft = Math.ceil(this.doorCountdown / 1000);
      this.ctx.fillStyle = "#ffff00";
      this.ctx.font = "bold 24px Arial";
      this.ctx.textAlign = "center";
      this.ctx.strokeStyle = "#000";
      this.ctx.lineWidth = 3;

      if (timeLeft <= 0) {
        this.ctx.strokeText("Door has appeared!", this.width / 2, 60);
        this.ctx.fillText("Door has appeared!", this.width / 2, 60);
      } else {
        this.ctx.strokeText(`DOOR: ${timeLeft}s`, this.width / 2, 60);
        this.ctx.fillText(`DOOR: ${timeLeft}s`, this.width / 2, 60);
      }
    } else if (!this.door && !hasWinner) {
      const timeUntilDoor = Math.ceil(
        (this.doorSpawnDelay - (Date.now() - this.gameStartTime)) / 1000
      );
      if (timeUntilDoor > 0) {
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 18px Arial";
        this.ctx.textAlign = "center";
        this.ctx.strokeStyle = "#000";
        this.ctx.lineWidth = 2;
        this.ctx.strokeText(
          `Next door in: ${timeUntilDoor}s`,
          this.width / 2,
          60
        );
        this.ctx.fillText(
          `Next door in: ${timeUntilDoor}s`,
          this.width / 2,
          60
        );
      }
    }

    // Draw ultimate skill indicators
    this.drawUltimateIndicators();

    this.ctx.textAlign = "left";
  }

  drawDefenseUI() {
    // Draw defense status for Fireboy
    if (this.fireboy) {
      const fireboyX = 20;
      const fireboyY = 95;

      // Defense status
      if (this.activeDefense.fireboy) {
        const timeLeft = Math.ceil(
          (this.defenseDuration -
            (Date.now() - this.defenseStartTime.fireboy)) /
            1000
        );
        this.ctx.fillStyle = "#ff6b35";
        this.ctx.font = "bold 14px Arial";
        this.ctx.textAlign = "left";
        this.ctx.fillText(`DEFENSE: ${timeLeft}s`, fireboyX, fireboyY);
      } else if (this.defenseCooldown.fireboy > 0) {
        const cooldownLeft = Math.ceil(this.defenseCooldown.fireboy);
        this.ctx.fillStyle = "#666";
        this.ctx.font = "bold 14px Arial";
        this.ctx.textAlign = "left";
        this.ctx.fillText(
          `DEFENSE COOLDOWN: ${cooldownLeft}s`,
          fireboyX,
          fireboyY
        );
      } else {
        this.ctx.fillStyle = "#ffff00";
        this.ctx.font = "bold 14px Arial";
        this.ctx.textAlign = "left";
        this.ctx.fillText("DEFENSE READY (Q)", fireboyX, fireboyY);
      }
    }

    // Draw defense status for Watergirl
    if (this.watergirl) {
      const watergirlX = this.width - 200;
      const watergirlY = 95;

      // Defense status
      if (this.activeDefense.watergirl) {
        const timeLeft = Math.ceil(
          (this.defenseDuration -
            (Date.now() - this.defenseStartTime.watergirl)) /
            1000
        );
        this.ctx.fillStyle = "#4a90e2";
        this.ctx.font = "bold 14px Arial";
        this.ctx.textAlign = "right";
        this.ctx.fillText(`DEFENSE: ${timeLeft}s`, this.width - 20, watergirlY);
      } else if (this.defenseCooldown.watergirl > 0) {
        const cooldownLeft = Math.ceil(this.defenseCooldown.watergirl);
        this.ctx.fillStyle = "#666";
        this.ctx.font = "bold 14px Arial";
        this.ctx.textAlign = "right";
        this.ctx.fillText(
          `DEFENSE COOLDOWN: ${cooldownLeft}s`,
          this.width - 20,
          watergirlY
        );
      } else {
        this.ctx.fillStyle = "#ffff00";
        this.ctx.font = "bold 14px Arial";
        this.ctx.textAlign = "right";
        this.ctx.fillText("DEFENSE READY (P)", this.width - 20, watergirlY);
      }
    }
  }

  drawUltimateButtons() {
    // Draw ultimate attack buttons on screen
    const buttonSize = 60;
    const buttonSpacing = 80;

    // Fireboy ultimate button
    if (this.fireboy) {
      const fireboyButtonX = 20;
      const fireboyButtonY = this.height - 100;

      // Button background
      if (this.ultimateReady.fireboy) {
        // Ready state - glowing effect
        this.ctx.shadowColor = "#ff6b35";
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = "#ff6b35";
      } else {
        // Not ready - dim
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = "#666";
      }

      this.ctx.fillRect(fireboyButtonX, fireboyButtonY, buttonSize, buttonSize);

      // Button border
      this.ctx.strokeStyle = this.ultimateReady.fireboy ? "#ff4500" : "#444";
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(
        fireboyButtonX,
        fireboyButtonY,
        buttonSize,
        buttonSize
      );

      // Button text
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "bold 20px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "E",
        fireboyButtonX + buttonSize / 2,
        fireboyButtonY + buttonSize / 2 + 7
      );

      // Ultimate label
      this.ctx.fillStyle = this.ultimateReady.fireboy ? "#ff6b35" : "#666";
      this.ctx.font = "bold 12px Arial";
      this.ctx.fillText(
        "ULTIMATE",
        fireboyButtonX + buttonSize / 2,
        fireboyButtonY - 5
      );

      // Reset shadow
      this.ctx.shadowBlur = 0;
    }

    // Watergirl ultimate button
    if (this.watergirl) {
      const watergirlButtonX = this.width - 80;
      const watergirlButtonY = this.height - 100;

      // Button background
      if (this.ultimateReady.watergirl) {
        // Ready state - glowing effect
        this.ctx.shadowColor = "#4a90e2";
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = "#4a90e2";
      } else {
        // Not ready - dim
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = "#666";
      }

      this.ctx.fillRect(
        watergirlButtonX,
        watergirlButtonY,
        buttonSize,
        buttonSize
      );

      // Button border
      this.ctx.strokeStyle = this.ultimateReady.watergirl ? "#2c5aa0" : "#444";
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(
        watergirlButtonX,
        watergirlButtonY,
        buttonSize,
        buttonSize
      );

      // Button text
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "bold 20px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "O",
        watergirlButtonX + buttonSize / 2,
        watergirlButtonY + buttonSize / 2 + 7
      );

      // Ultimate label
      this.ctx.fillStyle = this.ultimateReady.watergirl ? "#4a90e2" : "#666";
      this.ctx.font = "bold 12px Arial";
      this.ctx.fillText(
        "ULTIMATE",
        watergirlButtonX + buttonSize / 2,
        watergirlButtonY - 5
      );

      // Reset shadow
      this.ctx.shadowBlur = 0;
    }

    // Reset text alignment
    this.ctx.textAlign = "left";
  }

  drawUltimateIndicators() {
    // Fireboy ultimate indicator
    const fireboyX = 20;
    const fireboyY = 55;
    const fireboyProgress = Math.min(this.defenseCount.fireboy / 5, 1);

    // Background
    this.ctx.fillStyle = "#333";
    this.ctx.fillRect(fireboyX, fireboyY, 200, 20);

    // Progress bar
    this.ctx.fillStyle = fireboyProgress >= 1 ? "#ff6b35" : "#ffaa66";
    this.ctx.fillRect(fireboyX, fireboyY, 200 * fireboyProgress, 20);

    // Border
    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(fireboyX, fireboyY, 200, 20);

    // Text
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 12px Arial";
    this.ctx.textAlign = "left";

    if (this.defenseCount.fireboy >= 5) {
      this.ctx.fillStyle = "#ffff00";
      this.ctx.font = "bold 12px Arial";
      this.ctx.fillText(
        "Ultimate is Ready, Press E",
        fireboyX + 5,
        fireboyY + 14
      );
    } else {
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "bold 12px Arial";
      this.ctx.fillText(
        `Fireboy Ultimate: ${this.defenseCount.fireboy}/5`,
        fireboyX + 5,
        fireboyY + 14
      );
    }

    // Watergirl ultimate indicator
    const watergirlX = this.width - 220;
    const watergirlY = 55;
    const watergirlProgress = Math.min(this.defenseCount.watergirl / 5, 1);

    // Background
    this.ctx.fillStyle = "#333";
    this.ctx.fillRect(watergirlX, watergirlY, 200, 20);

    // Progress bar
    this.ctx.fillStyle = watergirlProgress >= 1 ? "#4a90e2" : "#87ceeb";
    this.ctx.fillRect(watergirlX, watergirlY, 200 * watergirlProgress, 20);

    // Border
    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(watergirlX, watergirlY, 200, 20);

    // Text
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 12px Arial";
    this.ctx.textAlign = "right";

    if (this.defenseCount.watergirl >= 5) {
      this.ctx.fillStyle = "#ffff00";
      this.ctx.font = "bold 12px Arial";
      this.ctx.fillText(
        "Ultimate is Ready, Press O",
        watergirlX + 195,
        watergirlY + 14
      );
    } else {
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "bold 12px Arial";
      this.ctx.fillText(
        `Watergirl Ultimate: ${this.defenseCount.watergirl}/5`,
        watergirlX + 195,
        watergirlY + 14
      );
    }
  }

  updateUI() {
    document.getElementById("currentLevel").textContent = this.currentLevel;
    document.getElementById(
      "fireboyScore"
    ).textContent = `Fireboy: ${this.fireboyScore}`;
    document.getElementById(
      "watergirlScore"
    ).textContent = `Watergirl: ${this.watergirlScore}`;
  }

  startAcidRain() {
    // Start acid rain only for level 2
    if (this.currentLevel === 2) {
      this.acidRainSpawnTimer = 0;
      this.acidRainSpawnRate = 0.5; // Spawn every 0.15 seconds (much more frequent)
    }
  }

  updateAcidRain(deltaTime) {
    if (this.currentLevel !== 2) return;

    // Update existing acid drops
    this.acidRain.forEach((drop, index) => {
      drop.update(deltaTime);

      // Check platform collisions
      this.platforms.forEach((platform) => {
        if (
          drop.x < platform.x + platform.width &&
          drop.x + drop.width > platform.x &&
          drop.y < platform.y + platform.height &&
          drop.y + drop.height > platform.y
        ) {
          drop.hitGround = true;
        }
      });

      // Remove drops that hit the ground or go off screen
      if (drop.y > this.height || drop.hitGround) {
        this.acidRain.splice(index, 1);
      }
    });

    // Spawn new acid drops
    this.acidRainSpawnTimer += deltaTime;
    if (this.acidRainSpawnTimer >= this.acidRainSpawnRate) {
      this.spawnAcidDrop();
      this.acidRainSpawnTimer = 0;
    }
  }

  spawnAcidDrop() {
    // Spawn 2-4 acid drops at once for more intense rain
    const dropCount = Math.floor(Math.random() * 3) + 2; // 2-4 drops

    for (let i = 0; i < dropCount; i++) {
      const drop = new AcidDrop(
        Math.random() * this.width, // Random x position
        -10 - i * 20, // Stagger drops vertically
        Math.random() * 100 + 150 // Random fall speed
      );
      this.acidRain.push(drop);
    }
  }

  gameLoop(currentTime = 0) {
    // Handle first frame
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
    }

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Cap delta time to prevent physics glitches
    const cappedDeltaTime = Math.min(deltaTime, this.maxDeltaTime);

    this.update(cappedDeltaTime);
    this.render();

    requestAnimationFrame((time) => this.gameLoop(time));
  }
}

// Character Classes
class Character {
  constructor(x, y, color, type) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;
    this.color = color;
    this.type = type;
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 200;
    this.jumpPower = 400;
    this.velocityX = 0;
    this.velocityY = 0;
    this.onGround = false;
    this.facingRight = true;
    this.lastShot = 0;
    this.shootCooldown = 500; // milliseconds
  }

  update(deltaTime, keys, platforms) {
    // Don't update if character is dead
    if (this.health <= 0) {
      // Make character fall and become unplayable
      this.velocityY += 800 * deltaTime; // gravity
      this.y += this.velocityY * deltaTime;
      this.velocityX = 0; // Stop horizontal movement
      return;
    }

    // Handle input
    this.handleInput(keys, deltaTime);

    // Apply gravity
    this.velocityY += 800 * deltaTime; // gravity

    // Update position
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;

    // Check platform collisions
    this.checkPlatformCollisions(platforms);

    // Keep character on screen
    this.x = Math.max(0, Math.min(this.x, 960));
    this.y = Math.max(0, Math.min(this.y, 540));
  }

  handleInput(keys, deltaTime) {
    // Override in subclasses
  }

  checkPlatformCollisions(platforms) {
    this.onGround = false;

    platforms.forEach((platform) => {
      if (
        this.x < platform.x + platform.width &&
        this.x + this.width > platform.x &&
        this.y < platform.y + platform.height &&
        this.y + this.height > platform.y
      ) {
        // Landing on top of platform
        if (this.velocityY > 0 && this.y < platform.y) {
          this.y = platform.y - this.height;
          this.velocityY = 0;
          this.onGround = true;
        }
      }
    });
  }

  jump() {
    if (this.onGround) {
      this.velocityY = -this.jumpPower;
      this.onGround = false;
    }
  }

  shoot(projectileType, game) {
    const currentTime = Date.now();
    if (currentTime - this.lastShot > this.shootCooldown) {
      const projectile = new Projectile(
        this.x + this.width / 2,
        this.y + this.height / 2,
        projectileType,
        this.facingRight ? 1 : -1
      );
      game.projectiles.push(projectile);
      this.lastShot = currentTime;

      // Play shooting sound
      if (projectileType === "fireball") {
        game.playSound(300, 0.1, "sawtooth");
      } else {
        game.playSound(250, 0.1, "triangle");
      }
    }
  }

  shootUltimate(projectileType, game) {
    const currentTime = Date.now();
    if (currentTime - this.lastShot > this.shootCooldown) {
      const projectile = new UltimateProjectile(
        this.x + this.width / 2,
        this.y + this.height / 2,
        projectileType,
        this.facingRight ? 1 : -1
      );
      game.projectiles.push(projectile);
      this.lastShot = currentTime;

      // Play ultimate shooting sound
      if (projectileType === "fireball") {
        game.playSound(500, 0.8, "triangle");
      } else {
        game.playSound(450, 0.8, "sawtooth");
      }
    }
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }

  checkCollision(other) {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }

  render(ctx) {
    ctx.save();

    // If character is dead, make them grayed out
    if (this.health <= 0) {
      ctx.globalAlpha = 0.5; // Make semi-transparent
      ctx.filter = "grayscale(100%)"; // Make grayscale
    }

    if (this.type === "fireboy" && window.game.assets.fireboySprite) {
      // Draw Fireboy sprite
      const targetHeight = 60; // Standard height
      const targetWidth = 40; // Standard width
      ctx.drawImage(
        window.game.assets.fireboySprite,
        this.x,
        this.y,
        targetWidth,
        targetHeight
      );
    } else if (
      this.type === "watergirl" &&
      window.game.assets.watergirlSprite
    ) {
      // Draw Watergirl sprite - match Fireboy's height exactly
      const targetHeight = 60; // Match Fireboy's height
      const targetWidth = 40; // Match Fireboy's width
      ctx.drawImage(
        window.game.assets.watergirlSprite,
        this.x,
        this.y,
        targetWidth,
        targetHeight
      );
    } else {
      // Fallback to colored rectangles if sprites not loaded
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Character face
      ctx.fillStyle = "#fff";
      ctx.fillRect(this.x + 10, this.y + 10, 20, 20);

      // Eyes
      ctx.fillStyle = "#000";
      ctx.fillRect(this.x + 15, this.y + 15, 5, 5);
      ctx.fillRect(this.x + 25, this.y + 15, 5, 5);
    }

    ctx.restore();
  }
}

class Fireboy extends Character {
  constructor(x, y) {
    super(x, y, "#ff6b35", "fireboy");
  }

  handleInput(keys, deltaTime) {
    // Don't handle input if character is dead
    if (this.health <= 0) return;

    // Movement
    if (keys["KeyA"]) {
      this.velocityX = -this.speed;
      this.facingRight = false;
    } else if (keys["KeyD"]) {
      this.velocityX = this.speed;
      this.facingRight = true;
    } else {
      this.velocityX = 0;
    }

    // Jumping
    if (keys["KeyW"] && this.onGround) {
      this.jump();
    }

    // Shooting
    if (keys["Space"]) {
      this.shoot("fireball", window.game);
    }
    // Ultimate shooting
    if (keys["KeyE"] && window.game.defenseCount.fireboy >= 5) {
      this.shootUltimate("fireball", window.game);
      window.game.ultimateReady.fireboy = false;
      window.game.ultimateCooldown.fireboy = 10; // 10 second cooldown
      window.game.defenseCount.fireboy = 0; // Reset defense count
    }
  }
}

class Watergirl extends Character {
  constructor(x, y) {
    super(x, y, "#4a90e2", "watergirl");
  }

  handleInput(keys, deltaTime) {
    // Don't handle input if character is dead
    if (this.health <= 0) return;

    // Movement
    if (keys["ArrowLeft"]) {
      this.velocityX = -this.speed;
      this.facingRight = false;
    } else if (keys["ArrowRight"]) {
      this.velocityX = this.speed;
      this.facingRight = true;
    } else {
      this.velocityX = 0;
    }

    // Jumping
    if (keys["ArrowUp"] && this.onGround) {
      this.jump();
    }

    // Shooting
    if (keys["Enter"]) {
      this.shoot("waterball", window.game);
    }
    // Ultimate shooting
    if (keys["KeyO"] && window.game.defenseCount.watergirl >= 5) {
      this.shootUltimate("waterball", window.game);
      window.game.ultimateReady.watergirl = false;
      window.game.ultimateCooldown.watergirl = 10; // 10 second cooldown
      window.game.defenseCount.watergirl = 0; // Reset defense count
    }
  }
}

class UltimateProjectile {
  constructor(x, y, type, direction) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.direction = direction;
    this.speed = 400; // Faster than regular projectiles
    this.width = 20; // Much larger than regular projectiles
    this.height = 20;
    this.velocityX = this.speed * direction;
    this.collisionRadius = 12; // Larger collision radius
    this.damage = 50; // Much more damage than regular projectiles
    this.glowIntensity = 0;
    this.glowDirection = 1;
  }

  update(deltaTime) {
    this.x += this.velocityX * deltaTime;

    // Animate glow effect
    this.glowIntensity += this.glowDirection * deltaTime * 0.003;
    if (this.glowIntensity >= 1 || this.glowIntensity <= 0) {
      this.glowDirection *= -1;
    }
  }

  isOffScreen(width, height) {
    return this.x < 0 || this.x > width || this.y < 0 || this.y > height;
  }

  checkCollision(other) {
    // Use circular collision detection for more accurate projectile collisions
    const distance = Math.sqrt(
      Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2)
    );
    return distance < this.collisionRadius + other.collisionRadius;
  }

  render(ctx) {
    if (this.type === "fireball") {
      // Create a massive fireball with enhanced effects
      const gradient = ctx.createRadialGradient(
        this.x + this.width / 2,
        this.y + this.height / 2,
        0,
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 2
      );
      gradient.addColorStop(0, "#ffff00");
      gradient.addColorStop(0.3, "#ff6600");
      gradient.addColorStop(0.6, "#ff0000");
      gradient.addColorStop(1, "#660000");

      // Glow effect
      ctx.shadowColor = "#ff6600";
      ctx.shadowBlur = 20 + this.glowIntensity * 10;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Inner core
      ctx.shadowBlur = 0;
      const innerGradient = ctx.createRadialGradient(
        this.x + this.width / 2,
        this.y + this.height / 2,
        0,
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 4
      );
      innerGradient.addColorStop(0, "#ffffff");
      innerGradient.addColorStop(1, "#ffff00");
      ctx.fillStyle = innerGradient;
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    } else {
      // Create a massive waterball with enhanced effects
      const gradient = ctx.createRadialGradient(
        this.x + this.width / 2,
        this.y + this.height / 2,
        0,
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 2
      );
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.3, "#4a90e2");
      gradient.addColorStop(0.6, "#2c5aa0");
      gradient.addColorStop(1, "#1a3d73");

      // Glow effect
      ctx.shadowColor = "#4a90e2";
      ctx.shadowBlur = 20 + this.glowIntensity * 10;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Inner core
      ctx.shadowBlur = 0;
      const innerGradient = ctx.createRadialGradient(
        this.x + this.width / 2,
        this.y + this.height / 2,
        0,
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 4
      );
      innerGradient.addColorStop(0, "#ffffff");
      innerGradient.addColorStop(1, "#87ceeb");
      ctx.fillStyle = innerGradient;
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}

// Game Object Classes
class Platform {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }

  render(ctx) {
    // Use platform asset if available, otherwise fallback to gradient
    if (
      window.game &&
      window.game.assets &&
      window.game.assets.platformSprite
    ) {
      // Draw platform using the asset image
      ctx.drawImage(
        window.game.assets.platformSprite,
        this.x,
        this.y,
        this.width,
        this.height
      );
    } else {
      // Fallback to gradient platform if asset not loaded
      const gradient = ctx.createLinearGradient(
        this.x,
        this.y,
        this.x,
        this.y + this.height
      );
      gradient.addColorStop(0, "#8B4513");
      gradient.addColorStop(0.5, "#A0522D");
      gradient.addColorStop(1, "#654321");

      ctx.fillStyle = gradient;
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Add a subtle border
      ctx.strokeStyle = "#654321";
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x, this.y, this.width, this.height);

      // Add some texture lines
      ctx.strokeStyle = "#8B4513";
      ctx.lineWidth = 1;
      for (let i = 0; i < this.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(this.x + i, this.y);
        ctx.lineTo(this.x + i, this.y + this.height);
        ctx.stroke();
      }
    }
  }
}

class Projectile {
  constructor(x, y, type, direction) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.direction = direction;
    this.speed = 300;
    this.width = 12; // Slightly larger for easier collision
    this.height = 12;
    this.velocityX = this.speed * direction;
    this.collisionRadius = 8; // Collision detection radius
  }

  update(deltaTime) {
    this.x += this.velocityX * deltaTime;
  }

  isOffScreen(width, height) {
    return this.x < 0 || this.x > width || this.y < 0 || this.y > height;
  }

  checkCollision(other) {
    // Use circular collision detection for more accurate projectile collisions
    const projectileCenterX = this.x + this.width / 2;
    const projectileCenterY = this.y + this.height / 2;
    const otherCenterX = other.x + other.width / 2;
    const otherCenterY = other.y + other.height / 2;
    
    const distance = Math.sqrt(
      Math.pow(projectileCenterX - otherCenterX, 2) + Math.pow(projectileCenterY - otherCenterY, 2)
    );
    return distance < this.collisionRadius + other.collisionRadius;
  }

  render(ctx) {
    if (this.type === "fireball") {
      // Create a fireball with gradient and glow effect
      const gradient = ctx.createRadialGradient(
        this.x,
        this.y,
        0,
        this.x,
        this.y,
        this.width / 2
      );
      gradient.addColorStop(0, "#ffff00");
      gradient.addColorStop(0.5, "#ff6b35");
      gradient.addColorStop(1, "#ff0000");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
      ctx.fill();

      // Add glow effect
      ctx.shadowColor = "#ff6b35";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#ff6b35";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.width / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Create a waterball with gradient and glow effect
      const gradient = ctx.createRadialGradient(
        this.x,
        this.y,
        0,
        this.x,
        this.y,
        this.width / 2
      );
      gradient.addColorStop(0, "#87CEEB");
      gradient.addColorStop(0.5, "#4a90e2");
      gradient.addColorStop(1, "#1e90ff");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
      ctx.fill();

      // Add glow effect
      ctx.shadowColor = "#4a90e2";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#4a90e2";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.width / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.type = type;
    this.collected = false;
  }

  apply(character) {
    switch (this.type) {
      case "health":
        character.health = Math.min(character.maxHealth, character.health + 30);
        console.log(
          `${character.type} gained health! New health: ${character.health}`
        );
        break;
      case "speed":
        character.speed += 20;
        console.log(
          `${character.type} gained speed! New speed: ${character.speed}`
        );
        break;
      case "power":
        character.shootCooldown = Math.max(200, character.shootCooldown - 100);
        console.log(
          `${character.type} gained power! New cooldown: ${character.shootCooldown}ms`
        );
        break;
    }
    this.collected = true;
  }

  render(ctx) {
    if (this.collected) return;

    // Create a pulsing effect
    const time = Date.now() * 0.005;
    const pulse = Math.sin(time) * 0.1 + 1;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const radius = (this.width / 2) * pulse;

    if (this.type === "health") {
      // Health power-up with red gradient and cross symbol
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, "#ffaaaa");
      gradient.addColorStop(0.5, "#ff6666");
      gradient.addColorStop(1, "#ff0000");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw cross symbol
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - 8, centerY);
      ctx.lineTo(centerX + 8, centerY);
      ctx.moveTo(centerX, centerY - 8);
      ctx.lineTo(centerX, centerY + 8);
      ctx.stroke();
    } else if (this.type === "speed") {
      // Speed power-up with green gradient and lightning symbol
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, "#aaffaa");
      gradient.addColorStop(0.5, "#66ff66");
      gradient.addColorStop(1, "#00ff00");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw lightning symbol
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - 6, centerY - 8);
      ctx.lineTo(centerX + 2, centerY - 2);
      ctx.lineTo(centerX - 2, centerY + 2);
      ctx.lineTo(centerX + 6, centerY + 8);
      ctx.stroke();
    } else {
      // Power power-up with yellow gradient and star symbol
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, "#ffffaa");
      gradient.addColorStop(0.5, "#ffff66");
      gradient.addColorStop(1, "#ffff00");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw star symbol
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 8);
      ctx.lineTo(centerX + 3, centerY + 3);
      ctx.lineTo(centerX + 8, centerY + 3);
      ctx.lineTo(centerX + 4, centerY + 6);
      ctx.lineTo(centerX + 6, centerY + 10);
      ctx.lineTo(centerX, centerY + 7);
      ctx.lineTo(centerX - 6, centerY + 10);
      ctx.lineTo(centerX - 4, centerY + 6);
      ctx.lineTo(centerX - 8, centerY + 3);
      ctx.lineTo(centerX - 3, centerY + 3);
      ctx.closePath();
      ctx.stroke();
    }
  }
}

class DefenseBarrier {
  constructor(x, y, defender) {
    this.x = x;
    this.y = y;
    this.width = 4; // Very thin barrier (now vertical)
    this.height = 60; // Barrier height
    this.defender = defender; // 'fireboy' or 'watergirl'
    this.alpha = 0.8;
    this.active = true;
  }

  update(deltaTime) {
    // Barrier stays active as long as the key is held
    return this.active;
  }

  checkCollision(projectile) {
    // Check if projectile hits the defense barrier
    return (
      projectile.x < this.x + this.width &&
      projectile.x + projectile.width > this.x &&
      projectile.y < this.y + this.height &&
      projectile.y + projectile.height > this.y
    );
  }

  render(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Create thin vertical barrier with character's element
    const gradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height
    );

    if (this.defender === "fireboy") {
      // Fire barrier
      gradient.addColorStop(0, "#ff0000");
      gradient.addColorStop(0.3, "#ff6b35");
      gradient.addColorStop(0.7, "#ff8c42");
      gradient.addColorStop(1, "#ff0000");
    } else {
      // Water barrier
      gradient.addColorStop(0, "#0000ff");
      gradient.addColorStop(0.3, "#4a90e2");
      gradient.addColorStop(0.7, "#6bb6ff");
      gradient.addColorStop(1, "#0000ff");
    }

    // Draw the thin barrier
    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Add glow effect
    const time = Date.now() * 0.01;
    const glow = Math.sin(time * 2) * 0.3 + 0.7;
    ctx.shadowColor = this.defender === "fireboy" ? "#ff6b35" : "#4a90e2";
    ctx.shadowBlur = 10 * glow;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.restore();
  }
}

class Goal {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.type = type; // 'fire', 'water', 'both'
    this.activated = false;
  }

  checkCollision(fireboy, watergirl) {
    if (this.type === "fire" && fireboy.checkCollision(this)) {
      this.activated = true;
      return true;
    } else if (this.type === "water" && watergirl.checkCollision(this)) {
      this.activated = true;
      return true;
    } else if (
      this.type === "both" &&
      (fireboy.checkCollision(this) || watergirl.checkCollision(this))
    ) {
      this.activated = true;
      return true;
    }
    return false;
  }

  render(ctx) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    if (this.activated) {
      // Activated goal with green gradient and checkmark
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        this.width / 2
      );
      gradient.addColorStop(0, "#aaffaa");
      gradient.addColorStop(0.5, "#66ff66");
      gradient.addColorStop(1, "#00ff00");

      ctx.fillStyle = gradient;
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Draw checkmark
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(centerX - 8, centerY);
      ctx.lineTo(centerX - 2, centerY + 6);
      ctx.lineTo(centerX + 8, centerY - 6);
      ctx.stroke();
    } else {
      // Inactive goal with yellow gradient and question mark
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        this.width / 2
      );
      gradient.addColorStop(0, "#ffffaa");
      gradient.addColorStop(0.5, "#ffff66");
      gradient.addColorStop(1, "#ffff00");

      ctx.fillStyle = gradient;
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Draw question mark
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText("?", centerX, centerY + 5);
    }

    // Add border
    ctx.strokeStyle = this.activated ? "#00aa00" : "#aaaa00";
    ctx.lineWidth = 3;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
}

class Switch extends Goal {
  constructor(x, y, type) {
    super(x, y, type);
    this.width = 40;
    this.height = 20;
  }

  render(ctx) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    if (this.activated) {
      // Activated switch with green gradient
      const gradient = ctx.createLinearGradient(
        this.x,
        this.y,
        this.x,
        this.y + this.height
      );
      gradient.addColorStop(0, "#aaffaa");
      gradient.addColorStop(0.5, "#66ff66");
      gradient.addColorStop(1, "#00ff00");

      ctx.fillStyle = gradient;
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Draw "ON" text
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.fillText("ON", centerX, centerY + 3);
    } else {
      // Inactive switch with red gradient
      const gradient = ctx.createLinearGradient(
        this.x,
        this.y,
        this.x,
        this.y + this.height
      );
      gradient.addColorStop(0, "#ffaaaa");
      gradient.addColorStop(0.5, "#ff6666");
      gradient.addColorStop(1, "#ff0000");

      ctx.fillStyle = gradient;
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Draw "OFF" text
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.fillText("OFF", centerX, centerY + 3);
    }

    // Add border
    ctx.strokeStyle = this.activated ? "#00aa00" : "#aa0000";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
}

class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.type = type;
    this.health = 50;
    this.speed = 50;
    this.direction = 1;
    this.collisionRadius = 20; // For circular collision detection with projectiles
  }

  update(deltaTime) {
    this.x += this.speed * this.direction * deltaTime;

    // Simple AI - reverse direction at edges
    if (this.x <= 0 || this.x >= 960) {
      this.direction *= -1;
    }
  }

  render(ctx) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    if (this.type === "fire") {
      // Fire enemy with gradient and flame effect
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        this.width / 2
      );
      gradient.addColorStop(0, "#ffff00");
      gradient.addColorStop(0.5, "#ff6b35");
      gradient.addColorStop(1, "#ff0000");

      ctx.fillStyle = gradient;
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Add flame details
      ctx.fillStyle = "#ffaa00";
      ctx.fillRect(this.x + 5, this.y + 5, 10, 15);
      ctx.fillRect(this.x + 15, this.y + 8, 8, 12);
      ctx.fillRect(this.x + 25, this.y + 6, 10, 14);
    } else {
      // Water enemy with gradient and wave effect
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        this.width / 2
      );
      gradient.addColorStop(0, "#87CEEB");
      gradient.addColorStop(0.5, "#4a90e2");
      gradient.addColorStop(1, "#1e90ff");

      ctx.fillStyle = gradient;
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Add wave details
      ctx.strokeStyle = "#87CEEB";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x + 5, this.y + 10);
      ctx.quadraticCurveTo(this.x + 15, this.y + 5, this.x + 25, this.y + 10);
      ctx.quadraticCurveTo(this.x + 35, this.y + 15, this.x + 35, this.y + 20);
      ctx.stroke();
    }

    // Add border
    ctx.strokeStyle = this.type === "fire" ? "#ff0000" : "#1e90ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }

  checkCollision(other) {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }
}

class BossEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, "boss");
    this.width = 80;
    this.height = 80;
    this.health = 200;
    this.maxHealth = 200;
    this.speed = 30;
    this.direction = 1; // 1 for right, -1 for left
    this.moveSpeed = 50; // Horizontal movement speed
    this.lastAttack = 0;
    this.attackCooldown = 2000; // Attack every 2 seconds
    this.collisionRadius = 40; // For circular collision detection with projectiles
  }

  update(deltaTime, game) {
    // Move horizontally
    this.x += this.direction * this.moveSpeed * deltaTime;
    
    // Reverse direction at screen edges
    if (this.x <= 0 || this.x >= game.width - this.width) {
      this.direction *= -1;
    }
    
    // Attack players
    const currentTime = Date.now();
    if (currentTime - this.lastAttack > this.attackCooldown) {
      this.attack(game);
      this.lastAttack = currentTime;
    }
  }

  attack(game) {
    // Create boss projectiles that target both players
    if (game.fireboy && game.watergirl) {
      // Fire projectile at fireboy
      const fireboyDir = Math.sign(game.fireboy.x - this.x);
      const bossProjectile1 = new BossProjectile(
        this.x + this.width / 2,
        this.y + this.height / 2,
        fireboyDir,
        "fire"
      );
      game.projectiles.push(bossProjectile1);
      
      // Fire projectile at watergirl
      const watergirlDir = Math.sign(game.watergirl.x - this.x);
      const bossProjectile2 = new BossProjectile(
        this.x + this.width / 2,
        this.y + this.height / 2,
        watergirlDir,
        "water"
      );
      game.projectiles.push(bossProjectile2);
    }
  }

  render(ctx) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Create a menacing boss with multiple layers
    const outerGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      this.width / 2
    );
    outerGradient.addColorStop(0, "#ff0000");
    outerGradient.addColorStop(0.5, "#8B0000");
    outerGradient.addColorStop(1, "#4B0000");

    ctx.fillStyle = outerGradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Inner core
    const innerGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      this.width / 3
    );
    innerGradient.addColorStop(0, "#ffff00");
    innerGradient.addColorStop(0.5, "#ff6600");
    innerGradient.addColorStop(1, "#ff0000");

    ctx.fillStyle = innerGradient;
    ctx.fillRect(this.x + 15, this.y + 15, this.width - 30, this.height - 30);

    // Add menacing eyes
    ctx.fillStyle = "#000";
    ctx.fillRect(this.x + 20, this.y + 20, 8, 8);
    ctx.fillRect(this.x + 52, this.y + 20, 8, 8);

    // Add glowing effect
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 15;
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 3;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;
  }

  renderHealthBar(ctx, gameWidth) {
    const barWidth = 200;
    const barHeight = 20;
    const barX = (gameWidth - barWidth) / 2;
    const barY = 20;

    // Health bar background
    ctx.fillStyle = "#333";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health bar
    const healthWidth = (this.health / this.maxHealth) * barWidth;
    const healthGradient = ctx.createLinearGradient(barX, barY, barX + healthWidth, barY);
    healthGradient.addColorStop(0, "#ff0000");
    healthGradient.addColorStop(0.5, "#ff6600");
    healthGradient.addColorStop(1, "#ffff00");

    ctx.fillStyle = healthGradient;
    ctx.fillRect(barX, barY, healthWidth, barHeight);

    // Health bar border
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Boss label and health percentage
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("BOSS", gameWidth / 2, barY - 5);
    
    // Health percentage
    ctx.font = "bold 12px Arial";
    const healthPercent = Math.round((this.health / this.maxHealth) * 100);
    ctx.fillText(`${this.health}/${this.maxHealth} (${healthPercent}%)`, gameWidth / 2, barY + barHeight + 15);
    ctx.textAlign = "left";
  }
}

// Boss Projectile class
class BossProjectile {
  constructor(x, y, direction, type) {
    this.x = x;
    this.y = y;
    this.width = 15;
    this.height = 15;
    this.speed = 200;
    this.direction = direction;
    this.type = type;
  }

  update(deltaTime) {
    this.x += this.direction * this.speed * deltaTime;
  }

  render(ctx) {
    if (this.type === "fire") {
      // Fire projectile
      const gradient = ctx.createRadialGradient(
        this.x + this.width / 2,
        this.y + this.height / 2,
        0,
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 2
      );
      gradient.addColorStop(0, "#ffff00");
      gradient.addColorStop(0.5, "#ff6600");
      gradient.addColorStop(1, "#ff0000");
      
      ctx.fillStyle = gradient;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    } else {
      // Water projectile
      const gradient = ctx.createRadialGradient(
        this.x + this.width / 2,
        this.y + this.height / 2,
        0,
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 2
      );
      gradient.addColorStop(0, "#87CEEB");
      gradient.addColorStop(0.5, "#4a90e2");
      gradient.addColorStop(1, "#1e90ff");
      
      ctx.fillStyle = gradient;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  isOffScreen(width, height) {
    return this.x < 0 || this.x > width || this.y < 0 || this.y > height;
  }

  checkCollision(other) {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }
}

// Effect class for visual feedback
class Effect {
  constructor(x, y, type, duration) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.duration = duration;
    this.startTime = Date.now();
    this.radius = 10;
    this.alpha = 1;
  }

  update(deltaTime) {
    const elapsed = Date.now() - this.startTime;
    this.alpha = 1 - elapsed / this.duration;

    if (this.type === "hit") {
      this.radius += 50 * deltaTime;
    } else if (this.type === "powerup") {
      this.radius += 30 * deltaTime;
    } else if (this.type === "goal") {
      this.radius += 40 * deltaTime;
    } else if (this.type === "explosion") {
      this.radius += 80 * deltaTime;
    } else if (this.type === "warning") {
      this.radius += 20 * deltaTime;
    }
  }

  isFinished() {
    return Date.now() - this.startTime >= this.duration;
  }

  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    if (this.type === "hit") {
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === "powerup") {
      ctx.fillStyle = "#ffff00";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === "goal") {
      ctx.fillStyle = "#00ff00";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === "explosion") {
      // Create a multi-colored explosion effect
      const gradient = ctx.createRadialGradient(
        this.x,
        this.y,
        0,
        this.x,
        this.y,
        this.radius
      );
      gradient.addColorStop(0, "#ffff00");
      gradient.addColorStop(0.3, "#ff6600");
      gradient.addColorStop(0.6, "#ff0000");
      gradient.addColorStop(1, "#660000");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Add some spark effects
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const sparkX = this.x + Math.cos(angle) * this.radius * 0.7;
        const sparkY = this.y + Math.sin(angle) * this.radius * 0.7;
        ctx.fillRect(sparkX - 1, sparkY - 1, 2, 2);
      }
    } else if (this.type === "warning") {
      // Create a pulsing warning effect
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }
}

// TextEffect class for floating text
class TextEffect {
  constructor(x, y, text, color, duration) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.duration = duration;
    this.startTime = Date.now();
    this.alpha = 1;
    this.velocityY = -50; // Move upward
  }

  update(deltaTime) {
    const elapsed = Date.now() - this.startTime;
    this.alpha = 1 - elapsed / this.duration;
    this.y += this.velocityY * deltaTime;
  }

  isFinished() {
    return Date.now() - this.startTime >= this.duration;
  }

  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;

    // Draw text with outline
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);

    ctx.restore();
  }
}

// Door class for the door system
class Door {
  constructor(x, y, sprite) {
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 80;
    this.sprite = sprite;
    this.glowIntensity = 0;
    this.glowDirection = 1;
  }

  update(deltaTime) {
    // Animate glow effect
    this.glowIntensity += this.glowDirection * deltaTime * 0.002;
    if (this.glowIntensity >= 1) {
      this.glowIntensity = 1;
      this.glowDirection = -1;
    } else if (this.glowIntensity <= 0) {
      this.glowIntensity = 0;
      this.glowDirection = 1;
    }
  }

  render(ctx) {
    ctx.save();

    // Draw door sprite or fallback rectangle
    if (this.sprite) {
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    } else {
      // Fallback door design
      const gradient = ctx.createLinearGradient(
        this.x,
        this.y,
        this.x + this.width,
        this.y + this.height
      );
      gradient.addColorStop(0, "#8B4513");
      gradient.addColorStop(0.5, "#A0522D");
      gradient.addColorStop(1, "#654321");

      ctx.fillStyle = gradient;
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Door frame
      ctx.strokeStyle = "#654321";
      ctx.lineWidth = 3;
      ctx.strokeRect(this.x, this.y, this.width, this.height);

      // Door handle
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(
        this.x + this.width - 15,
        this.y + this.height / 2,
        5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.restore();
  }

  checkCollision(other) {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }
}

// AcidDrop class for acid rain
class AcidDrop {
  constructor(x, y, fallSpeed) {
    this.x = x;
    this.y = y;
    this.width = 4;
    this.height = 6;
    this.fallSpeed = fallSpeed;
    this.damage = 5; // Damage per hit
    this.hitGround = false;
    this.alpha = 0.8;
    this.glowIntensity = 0;
  }

  update(deltaTime) {
    // Fall downward
    this.y += this.fallSpeed * deltaTime;

    // Animate glow effect
    this.glowIntensity += deltaTime * 0.01;
    if (this.glowIntensity > Math.PI * 2) {
      this.glowIntensity = 0;
    }

    // Check if hit ground (platforms)
    // This will be handled in the collision detection
  }

  checkCollision(character) {
    return (
      this.x < character.x + character.width &&
      this.x + this.width > character.x &&
      this.y < character.y + character.height &&
      this.y + this.height > character.y
    );
  }

  render(ctx) {
    ctx.save();

    // Create acid drop with green gradient and glow
    const gradient = ctx.createRadialGradient(
      this.x + this.width / 2,
      this.y + this.height / 2,
      0,
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width / 2
    );
    gradient.addColorStop(0, "#00ff00");
    gradient.addColorStop(0.5, "#00cc00");
    gradient.addColorStop(1, "#008800");

    // Add glow effect
    const glow = Math.sin(this.glowIntensity) * 0.3 + 0.7;
    ctx.shadowColor = "#00ff00";
    ctx.shadowBlur = 5 * glow;
    ctx.globalAlpha = this.alpha;

    // Draw the acid drop
    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Add inner highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#88ff88";
    ctx.fillRect(this.x + 1, this.y + 1, this.width - 2, 2);

    ctx.restore();
  }
}

// Initialize game when page loads
window.addEventListener("load", () => {
  window.game = new Game();
});
