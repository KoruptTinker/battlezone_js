// Game State management module
// Handles game states like playing, dead, resetting

const GameState = {
  // Game states
  STATES: {
    PLAYING: 'playing',
    PLAYER_DEAD: 'player_dead',
    RESETTING: 'resetting'
  },
  
  currentState: 'playing',
  
  // Reset delay after player death (seconds)
  resetDelay: 2.0,
  resetTimer: 0,
  
  // Player death flag
  playerDead: false,
  
  // Score tracking
  score: 0,
  tanksDestroyed: 0,
  
  // Initialize the game state
  init: function() {
    this.currentState = this.STATES.PLAYING;
    this.resetTimer = 0;
    this.playerDead = false;
  },
  
  // Update game state (called each frame)
  update: function(deltaTime) {
    if (this.currentState === this.STATES.PLAYER_DEAD) {
      this.resetTimer -= deltaTime;
      if (this.resetTimer <= 0) {
        this.resetGame();
      }
    }
  },
  
  // Called when player is hit by enemy bullet
  onPlayerDeath: function() {
    if (this.currentState !== this.STATES.PLAYING) return;
    
    this.currentState = this.STATES.PLAYER_DEAD;
    this.playerDead = true;
    this.resetTimer = this.resetDelay;
    
    // Visual feedback - could add screen flash or other effects here
    this.showDeathMessage();
  },
  
  // Show death message to player
  showDeathMessage: function() {
    var deathOverlay = document.getElementById('deathOverlay');
    if (deathOverlay) {
      deathOverlay.style.display = 'flex';
    }
  },
  
  // Hide death message
  hideDeathMessage: function() {
    var deathOverlay = document.getElementById('deathOverlay');
    if (deathOverlay) {
      deathOverlay.style.display = 'none';
    }
  },
  
  // Reset the entire game
  resetGame: function() {
    this.currentState = this.STATES.RESETTING;
    
    // Hide death message
    this.hideDeathMessage();
    
    // Reset camera to initial position
    Camera.resetViewingCoordinates();
    
    // Reset all tanks
    Models.resetAllTanks();
    
    // Reset all bullets (player and enemy)
    this.resetAllBullets();
    
    // Reset game state
    this.currentState = this.STATES.PLAYING;
    this.playerDead = false;
    this.resetTimer = 0;
  },
  
  // Reset all bullets in the game
  resetAllBullets: function() {
    // Reset player bullet
    for (var i = 0; i < Models.gameObjects.length; i++) {
      var obj = Models.gameObjects[i];
      if (obj.type === 'player_bullet' && obj.reset) {
        obj.completeReset();
      }
    }
    
    // Reset enemy bullets
    for (var i = 0; i < Models.enemyBullets.length; i++) {
      var bullet = Models.enemyBullets[i];
      if (bullet && bullet.completeReset) {
        bullet.completeReset();
      }
    }
  },
  
  // Called when an enemy tank is destroyed
  onTankDestroyed: function(tankIndex) {
    this.tanksDestroyed++;
    this.score += 100;
    
    // Update score display if exists
    this.updateScoreDisplay();
    
    // Respawn the tank after a delay
    Models.scheduleTankRespawn(tankIndex);
  },
  
  // Update score display on screen
  updateScoreDisplay: function() {
    var scoreElement = document.getElementById('scoreDisplay');
    if (scoreElement) {
      scoreElement.textContent = 'Score: ' + this.score;
    }
  },
  
  // Check if game is currently playable
  isPlaying: function() {
    return this.currentState === this.STATES.PLAYING;
  }
};

// Export for browser
if (typeof window !== 'undefined') {
  window.GameState = GameState;
}

