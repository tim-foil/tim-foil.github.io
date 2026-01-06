// Global Settings Manager
class GameSettings {
    constructor() {
        this.settings = {
            backgroundMusic: true,
            soundEffects: true,
            particles: true,
            musicVolume: 0.7,
            effectsVolume: 0.8
        };
        
        this.loadSettings();
    }

    // Load settings from localStorage
    loadSettings() {
        const savedSettings = localStorage.getItem('gameSettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                this.settings = { ...this.settings, ...parsed };
            } catch (e) {
                console.warn('Failed to load settings, using defaults');
            }
        }
    }

    // Save settings to localStorage
    saveSettings() {
        localStorage.setItem('gameSettings', JSON.stringify(this.settings));
    }

    // Get a setting value
    getSetting(key) {
        return this.settings[key] !== undefined ? this.settings[key] : null;
    }

    // Set a setting value
    setSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.notifyChange(key, value);
    }

    // Toggle a boolean setting
    toggleSetting(key) {
        if (typeof this.settings[key] === 'boolean') {
            this.setSetting(key, !this.settings[key]);
        }
    }

    // Notify other parts of the game about setting changes
    notifyChange(key, value) {
        // Dispatch custom event for setting changes
        window.dispatchEvent(new CustomEvent('settingChanged', {
            detail: { key, value }
        }));

        // Handle specific setting changes
        switch (key) {
            case 'backgroundMusic':
                this.handleMusicToggle(value);
                break;
            case 'soundEffects':
                this.handleEffectsToggle(value);
                break;
            case 'particles':
                this.handleParticlesToggle(value);
                break;
            case 'musicVolume':
                this.handleVolumeChange('music', value);
                break;
            case 'effectsVolume':
                this.handleVolumeChange('effects', value);
                break;
        }
    }

    // Handle music toggle
    handleMusicToggle(enabled) {
        if (enabled) {
            this.playBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
    }

    // Handle effects toggle
    handleEffectsToggle(enabled) {
        // Effects will be handled by individual game components
        console.log('Sound effects:', enabled ? 'ON' : 'OFF');
    }

    // Handle particles toggle
    handleParticlesToggle(enabled) {
        // Particles will be handled by individual game components
        console.log('Particles:', enabled ? 'ON' : 'OFF');
    }

    // Handle volume changes
    handleVolumeChange(type, volume) {
        console.log(`${type} volume set to:`, volume);
    }

    // Play background music (placeholder - you can add actual audio)
    playBackgroundMusic() {
        // This is a placeholder - you can add actual background music here
        console.log('Background music started');
    }

    // Stop background music
    stopBackgroundMusic() {
        // This is a placeholder - you can add actual background music stopping here
        console.log('Background music stopped');
    }

    // Get all settings
    getAllSettings() {
        return { ...this.settings };
    }

    // Reset to default settings
    resetToDefaults() {
        this.settings = {
            backgroundMusic: true,
            soundEffects: true,
            particles: true,
            musicVolume: 0.7,
            effectsVolume: 0.8
        };
        this.saveSettings();
        
        // Notify all changes
        Object.keys(this.settings).forEach(key => {
            this.notifyChange(key, this.settings[key]);
        });
    }
}

// Create global settings instance
window.gameSettings = new GameSettings();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameSettings;
}
