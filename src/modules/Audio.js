// Audio management module for game sound effects

const SoundManager = {
  // Pre-created Audio objects for each sound
  sounds: {},
  
  // Base URL for audio files (same as textures)
  audioBaseURL: null,
  
  // Track if audio context is unlocked (requires user interaction)
  audioUnlocked: false,
  
  // Initialize audio system and load sounds remotely
  init: function() {
    // Use same base URL as textures
    this.audioBaseURL = Utils.INPUT_TEXTURES_URL;
    
    // Pre-create Audio objects for each sound
    this.sounds.explosion = this.createAudio('explosion.wav', 0.7);
    this.sounds.explosion_miss = this.createAudio('explosion_miss.wav', 0.7);
    this.sounds.radar = this.createAudio('radar.wav', 0.5);
    
    // Unlock audio on first user interaction
    this.setupAudioUnlock();
  },
  
  // Setup audio unlock on user interaction
  setupAudioUnlock: function() {
    var self = this;
    var unlockAudio = function() {
      self.audioUnlocked = true;
    };
    
    // Unlock on any user interaction (once)
    var onceOptions = { once: true, passive: true };
    document.addEventListener('keydown', unlockAudio, onceOptions);
    document.addEventListener('click', unlockAudio, onceOptions);
    document.addEventListener('touchstart', unlockAudio, onceOptions);
    document.addEventListener('mousedown', unlockAudio, onceOptions);
  },
  
  // Create and configure an Audio object
  createAudio: function(filename, volume) {
    var audio = new Audio(this.audioBaseURL + filename);
    audio.volume = volume;
    audio.preload = 'auto';
    
    // Load the audio
    audio.load();
    
    return audio;
  },
  
  // Play a sound effect (reuses Audio objects, clones only when overlapping)
  play: function(soundName) {
    var audio = this.sounds[soundName];
    if (!audio) {
      return;
    }
    
    try {
      var audioToPlay = audio;
      
      // If audio is currently playing, clone it to allow overlap
      if (!audio.paused && !audio.ended) {
        audioToPlay = audio.cloneNode();
        audioToPlay.volume = audio.volume;
      } else {
        // Reuse the existing Audio object - reset to start
        audio.currentTime = 0;
      }
      
      // Attempt to play
      var playPromise = audioToPlay.play();
      
      if (playPromise !== undefined) {
        playPromise.then(function() {
          // Audio is playing successfully
          SoundManager.audioUnlocked = true;
        }).catch(function(error) {
          // Browser autoplay policy blocked the play
          // This will work after first user interaction
        });
      }
    } catch (error) {
      // Silently handle errors
    }
  },
  
  // Play explosion sound (bullet hits tank)
  playExplosion: function() {
    this.play('explosion');
  },
  
  // Play explosion miss sound (bullet hits house)
  playExplosionMiss: function() {
    this.play('explosion_miss');
  },
  
  // Play radar sound
  playRadar: function() {
    this.play('radar');
  }
};

// Export for browser
if (typeof window !== 'undefined') {
  window.SoundManager = SoundManager;
  // Also export as Audio for backward compatibility, but use window.Audio for native constructor
  window.GameAudio = SoundManager;
}
