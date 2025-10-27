// Phaser 3 Match-3 Game with All Features
// Replaces Unity WebGL while keeping all existing functionality

class PhaserMatch3Game {
    constructor() {
        this.game = null;
        this.scene = null;
        this.board = [];
        this.boardSize = 8;
        this.gemTypes = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        this.selectedGem = null;
        this.isGameRunning = false;
        this.score = 0;
        this.moves = 30;
        this.time = 60;
        this.level = 3;
        this.gems = 450;
        this.stars = 1250;
        this.energy = 100;
        this.maxEnergy = 100;
        this.achievements = [];
        this.settings = {
            music: true,
            sfx: true,
            highContrast: false,
            largeText: false,
            reduceAnimations: false
        };
        this.timerInterval = null;
        this.tutorialShown = false;
        this.powerUps = {
            bomb: 3,
            rainbow: 1,
            lightning: 2,
            hammer: 1,
            shuffle: 1
        };
        this.achievements = [
            { id: 'first_match', name: 'Stellar Debut', description: 'Make your first cosmic gem match', unlocked: false },
            { id: 'score_1000', name: 'Galaxy Master', description: 'Score 1000 points in a single game', unlocked: false },
            { id: 'level_5', name: 'Cosmic Explorer', description: 'Reach level 5', unlocked: false },
            { id: 'perfect_level', name: 'Nebula Perfectionist', description: 'Get 3 stars on any level', unlocked: false }
        ];
        this.currentScreen = 'loading';
        this.isPaused = false;
        this.isAuthenticated = false;
        this.userData = null;
        this.platformInfo = null;
        this.analytics = {
            sessionStart: Date.now(),
            gamesPlayed: 0,
            totalScore: 0,
            totalTime: 0
        };
        
        this.init();
    }

    init() {
        console.log('🎮 Initializing Phaser 3 Match-3 Game...');
        
        // Initialize Phaser 3 game
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'phaser-game-container',
            backgroundColor: '#2c3e50',
            scene: {
                preload: this.preload.bind(this),
                create: this.create.bind(this),
                update: this.update.bind(this)
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0, x: 0 },
                    debug: false
                }
            },
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: 800,
                height: 600
            }
        };

        this.game = new Phaser.Game(config);
    }

    preload() {
        console.log('📦 Preloading Phaser 3 assets...');
        
        // Create gem textures programmatically
        this.createGemTextures();
        
        // Load UI assets
        this.loadUIAssets();
        
        // Load sound assets (placeholder)
        this.loadSoundAssets();
    }

    createGemTextures() {
        const gemColors = {
            red: 0xff4757,
            blue: 0x3742fa,
            green: 0x2ed573,
            yellow: 0xffa502,
            purple: 0x9c88ff,
            orange: 0xff6348
        };

        Object.keys(gemColors).forEach(color => {
            // Create gem texture
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(gemColors[color]);
            graphics.fillCircle(32, 32, 30);
            graphics.lineStyle(4, 0xffffff, 0.8);
            graphics.strokeCircle(32, 32, 30);
            graphics.generateTexture(`gem_${color}`, 64, 64);
            graphics.destroy();
        });
    }

    loadUIAssets() {
        // Create UI textures
        const graphics = this.scene.add.graphics();
        
        // Power-up textures
        graphics.fillStyle(0xff6b6b);
        graphics.fillRect(0, 0, 64, 64);
        graphics.generateTexture('powerup_bomb', 64, 64);
        
        graphics.clear();
        graphics.fillStyle(0x4ecdc4);
        graphics.fillRect(0, 0, 64, 64);
        graphics.generateTexture('powerup_rainbow', 64, 64);
        
        graphics.clear();
        graphics.fillStyle(0xffe66d);
        graphics.fillRect(0, 0, 64, 64);
        graphics.generateTexture('powerup_lightning', 64, 64);
        
        graphics.destroy();
    }

    loadSoundAssets() {
        // Placeholder for sound loading
        console.log('🔊 Sound assets loaded (placeholder)');
    }

    create() {
        console.log('🎯 Creating Phaser 3 game scene...');
        
        this.scene = this.scene;
        this.createGameBoard();
        this.createUI();
        this.createPowerUps();
        this.setupInput();
        this.setupAnimations();
        
        // Start the game
        this.startGame();
    }

    createGameBoard() {
        const boardX = 100;
        const boardY = 100;
        const gemSize = 60;
        const spacing = 5;
        
        this.board = [];
        this.gemSprites = [];
        
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            this.gemSprites[row] = [];
            
            for (let col = 0; col < this.boardSize; col++) {
                const gemType = this.gemTypes[Math.floor(Math.random() * this.gemTypes.length)];
                this.board[row][col] = gemType;
                
                const x = boardX + col * (gemSize + spacing);
                const y = boardY + row * (gemSize + spacing);
                
                const gem = this.scene.add.image(x, y, `gem_${gemType}`);
                gem.setDisplaySize(gemSize, gemSize);
                gem.setInteractive();
                gem.setData('row', row);
                gem.setData('col', col);
                gem.setData('type', gemType);
                
                this.gemSprites[row][col] = gem;
            }
        }
    }

    createUI() {
        // Score display
        this.scoreText = this.scene.add.text(50, 50, 'Score: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Moves display
        this.movesText = this.scene.add.text(50, 80, 'Moves: 30', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Timer display
        this.timerText = this.scene.add.text(50, 110, 'Time: 60', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Level display
        this.levelText = this.scene.add.text(50, 140, 'Level: 3', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Energy display
        this.energyText = this.scene.add.text(50, 170, 'Energy: 100/100', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Gems display
        this.gemsText = this.scene.add.text(50, 200, 'Gems: 450', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Stars display
        this.starsText = this.scene.add.text(50, 230, 'Stars: 1250', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Shop button
        this.shopBtn = this.scene.add.rectangle(700, 100, 120, 40, 0x4ecdc4);
        this.shopBtn.setInteractive();
        this.shopBtn.on('pointerdown', () => this.showShop());
        
        const shopText = this.scene.add.text(700, 100, 'Shop', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Battle Pass button
        this.battlePassBtn = this.scene.add.rectangle(700, 150, 120, 40, 0xffd700);
        this.battlePassBtn.setInteractive();
        this.battlePassBtn.on('pointerdown', () => this.showBattlePass());
        
        const battlePassText = this.scene.add.text(700, 150, 'Battle Pass', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Loot Box button
        this.lootBoxBtn = this.scene.add.rectangle(700, 200, 120, 40, 0xff6b6b);
        this.lootBoxBtn.setInteractive();
        this.lootBoxBtn.on('pointerdown', () => this.showLootBox());
        
        const lootBoxText = this.scene.add.text(700, 200, 'Loot Box', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Pause button
        this.pauseBtn = this.scene.add.rectangle(700, 250, 120, 40, 0x666666);
        this.pauseBtn.setInteractive();
        this.pauseBtn.on('pointerdown', () => this.togglePause());
        
        const pauseText = this.scene.add.text(700, 250, 'Pause', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    createPowerUps() {
        const powerUpY = 500;
        const powerUpSpacing = 100;
        
        // Bomb power-up
        this.bombBtn = this.scene.add.image(150, powerUpY, 'powerup_bomb');
        this.bombBtn.setDisplaySize(50, 50);
        this.bombBtn.setInteractive();
        this.bombBtn.setData('type', 'bomb');
        this.bombBtn.setData('count', 3);
        
        this.bombText = this.scene.add.text(150, powerUpY + 40, '3', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Rainbow power-up
        this.rainbowBtn = this.scene.add.image(250, powerUpY, 'powerup_rainbow');
        this.rainbowBtn.setDisplaySize(50, 50);
        this.rainbowBtn.setInteractive();
        this.rainbowBtn.setData('type', 'rainbow');
        this.rainbowBtn.setData('count', 1);
        
        this.rainbowText = this.scene.add.text(250, powerUpY + 40, '1', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Lightning power-up
        this.lightningBtn = this.scene.add.image(350, powerUpY, 'powerup_lightning');
        this.lightningBtn.setDisplaySize(50, 50);
        this.lightningBtn.setInteractive();
        this.lightningBtn.setData('type', 'lightning');
        this.lightningBtn.setData('count', 2);
        
        this.lightningText = this.scene.add.text(350, powerUpY + 40, '2', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    setupInput() {
        // Gem selection
        this.gemSprites.forEach(row => {
            row.forEach(gem => {
                gem.on('pointerdown', () => {
                    this.selectGem(gem);
                });
            });
        });
        
        // Power-up buttons
        this.bombBtn.on('pointerdown', () => this.usePowerUp('bomb'));
        this.rainbowBtn.on('pointerdown', () => this.usePowerUp('rainbow'));
        this.lightningBtn.on('pointerdown', () => this.usePowerUp('lightning'));
    }

    setupAnimations() {
        // Gem selection animation
        this.scene.tweens.add({
            targets: this.gemSprites,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 200,
            yoyo: true,
            repeat: -1,
            paused: true
        });
        
        // Gem match animation
        this.scene.tweens.add({
            targets: this.gemSprites,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: 500,
            paused: true
        });
    }

    selectGem(gem) {
        if (!this.isGameRunning) return;
        
        const row = gem.getData('row');
        const col = gem.getData('col');
        
        // Remove previous selection
        this.gemSprites.forEach(row => {
            row.forEach(g => {
                g.clearTint();
                g.setScale(1);
            });
        });
        
        if (this.selectedGem === gem) {
            this.selectedGem = null;
            return;
        }
        
        this.selectedGem = gem;
        gem.setTint(0xffd700); // Gold tint for selection
        gem.setScale(1.2);
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Play selection sound
        if (this.settings.sfx) {
            this.playSound('gem_select');
        }
    }

    usePowerUp(powerType) {
        if (!this.isGameRunning) return;
        
        let powerUpBtn, powerUpText;
        switch(powerType) {
            case 'bomb':
                powerUpBtn = this.bombBtn;
                powerUpText = this.bombText;
                break;
            case 'rainbow':
                powerUpBtn = this.rainbowBtn;
                powerUpText = this.rainbowText;
                break;
            case 'lightning':
                powerUpBtn = this.lightningBtn;
                powerUpText = this.lightningText;
                break;
        }
        
        let count = powerUpBtn.getData('count');
        if (count > 0) {
            count--;
            powerUpBtn.setData('count', count);
            powerUpText.setText(count.toString());
            
            // Apply power-up effect
            switch (powerType) {
                case 'bomb':
                    this.activateBomb();
                    break;
                case 'rainbow':
                    this.activateRainbow();
                    break;
                case 'lightning':
                    this.activateLightning();
                    break;
            }
            
            // Show power-up animation
            this.showPowerUpAnimation(powerType);
        }
    }

    activateBomb() {
        // Remove random gems
        const gems = [];
        this.gemSprites.forEach(row => {
            row.forEach(gem => {
                if (gem.visible) gems.push(gem);
            });
        });
        
        const randomGems = Phaser.Utils.Array.Shuffle(gems).slice(0, 5);
        randomGems.forEach(gem => {
            this.animateGemRemoval(gem);
        });
        
        this.addScore(100);
        this.playSound('bomb_explode');
    }

    activateRainbow() {
        // Clear entire board
        this.gemSprites.forEach(row => {
            row.forEach(gem => {
                if (gem.visible) {
                    this.animateGemRemoval(gem);
                }
            });
        });
        
        this.addScore(500);
        this.playSound('rainbow_clear');
    }

    activateLightning() {
        // Clear entire column
        const randomCol = Math.floor(Math.random() * this.boardSize);
        this.gemSprites.forEach(row => {
            const gem = row[randomCol];
            if (gem && gem.visible) {
                this.animateGemRemoval(gem);
            }
        });
        
        this.addScore(300);
        this.playSound('lightning_strike');
    }

    animateGemRemoval(gem) {
        this.scene.tweens.add({
            targets: gem,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: 500,
            onComplete: () => {
                gem.setVisible(false);
                this.fillEmptySpaces();
            }
        });
    }

    fillEmptySpaces() {
        // Move existing gems down
        for (let col = 0; col < this.boardSize; col++) {
            let writeRow = this.boardSize - 1;
            for (let row = this.boardSize - 1; row >= 0; row--) {
                if (this.gemSprites[row][col].visible) {
                    if (writeRow !== row) {
                        this.gemSprites[writeRow][col] = this.gemSprites[row][col];
                        this.gemSprites[row][col] = null;
                    }
                    writeRow--;
                }
            }
            
            // Fill empty spaces with new gems
            for (let row = writeRow; row >= 0; row--) {
                const gemType = this.gemTypes[Math.floor(Math.random() * this.gemTypes.length)];
                this.board[row][col] = gemType;
                
                const x = 100 + col * 65;
                const y = 100 + row * 65;
                
                const gem = this.scene.add.image(x, y, `gem_${gemType}`);
                gem.setDisplaySize(60, 60);
                gem.setInteractive();
                gem.setData('row', row);
                gem.setData('col', col);
                gem.setData('type', gemType);
                
                gem.on('pointerdown', () => {
                    this.selectGem(gem);
                });
                
                this.gemSprites[row][col] = gem;
            }
        }
    }

    showPowerUpAnimation(powerType) {
        const animations = {
            bomb: '💥',
            rainbow: '🌈',
            lightning: '⚡'
        };
        
        const animation = this.scene.add.text(400, 300, animations[powerType], {
            fontSize: '64px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: animation,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                animation.destroy();
            }
        });
    }

    addScore(points) {
        this.score += points;
        this.scoreText.setText(`Score: ${this.score.toLocaleString()}`);
        this.checkAchievements();
        
        // Show score popup
        this.showScorePopup(points);
    }

    showScorePopup(points) {
        const popup = this.scene.add.text(400, 200, `+${points}`, {
            fontSize: '32px',
            fill: '#ffd700',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: popup,
            y: popup.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                popup.destroy();
            }
        });
    }

    checkAchievements() {
        // Check for first match
        if (this.score > 0 && !this.achievements.find(a => a.id === 'first_match').unlocked) {
            this.showAchievement('first_match');
        }
        
        // Check for score achievement
        if (this.score >= 1000 && !this.achievements.find(a => a.id === 'score_1000').unlocked) {
            this.showAchievement('score_1000');
        }
        
        // Check for level achievement
        if (this.level >= 5 && !this.achievements.find(a => a.id === 'level_5').unlocked) {
            this.showAchievement('level_5');
        }
    }

    showAchievement(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            
            const popup = this.scene.add.text(400, 300, `🏆 ${achievement.name}`, {
                fontSize: '24px',
                fill: '#ffd700',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
            
            this.scene.tweens.add({
                targets: popup,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0,
                duration: 3000,
                onComplete: () => {
                    popup.destroy();
                }
            });
        }
    }

    async startGame() {
        console.log('🚀 Starting Phaser 3 game...');
        
        // Initialize platform and load user data
        await this.initializePlatform();
        
        this.isGameRunning = true;
        this.startTimer();
        this.updateUI();
        
        // Show tutorial for first-time players
        if (!this.tutorialShown) {
            setTimeout(() => {
                this.showTutorial();
            }, 1000);
        }
        
        // Track game start
        this.trackEvent('game_started', {
            level: this.level,
            energy: this.energy,
            platform: this.platformInfo?.name || 'unknown'
        });
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.time--;
            this.timerText.setText(`Time: ${this.time}`);
            
            if (this.time <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    pauseGame() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isGameRunning = false;
    }

    resumeGame() {
        this.isGameRunning = true;
        this.startTimer();
    }

    endGame() {
        this.isGameRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Calculate stars based on score
        let stars = 0;
        if (this.score >= 5000) stars = 3;
        else if (this.score >= 3000) stars = 2;
        else if (this.score >= 1000) stars = 1;
        
        console.log(`🎯 Game ended! Score: ${this.score}, Stars: ${stars}`);
        
        // Notify parent game system
        if (window.game && window.game.endGame) {
            window.game.endGame();
        }
    }

    updateUI() {
        this.scoreText.setText(`Score: ${this.score.toLocaleString()}`);
        this.movesText.setText(`Moves: ${this.moves}`);
        this.timerText.setText(`Time: ${this.time}`);
        this.levelText.setText(`Level: ${this.level}`);
        this.energyText.setText(`Energy: ${this.energy}/${this.maxEnergy}`);
        this.gemsText.setText(`Gems: ${this.gems}`);
        this.starsText.setText(`Stars: ${this.stars}`);
    }

    togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    showTutorial() {
        const tutorial = this.scene.add.text(400, 300, 'Tap gems to match them!', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: tutorial,
            alpha: 0,
            duration: 3000,
            onComplete: () => {
                tutorial.destroy();
            }
        });
        
        this.tutorialShown = true;
    }

    playSound(soundType) {
        // Placeholder for sound effects
        console.log(`🔊 Playing sound: ${soundType}`);
    }

    // Authentication and Platform Integration
    async initializePlatform() {
        try {
            // Detect platform
            this.platformInfo = this.detectPlatform();
            console.log('🌐 Platform detected:', this.platformInfo);
            
            // Initialize platform-specific features
            if (this.platformInfo.name === 'kongregate') {
                await this.initializeKongregate();
            } else if (this.platformInfo.name === 'poki') {
                await this.initializePoki();
            } else if (this.platformInfo.name === 'gamecrazy') {
                await this.initializeGameCrazy();
            }
            
            // Load user data
            await this.loadUserData();
            
        } catch (error) {
            console.error('❌ Platform initialization failed:', error);
        }
    }

    detectPlatform() {
        const hostname = window.location.hostname;
        const referrer = document.referrer;
        
        if (hostname.includes('kongregate.com') || referrer.includes('kongregate.com')) {
            return { name: 'kongregate', hasAds: true, hasLeaderboard: true, hasUserInfo: true };
        } else if (hostname.includes('poki.com') || referrer.includes('poki.com')) {
            return { name: 'poki', hasAds: true, hasLeaderboard: true, hasUserInfo: true };
        } else if (hostname.includes('gamecrazy.com') || referrer.includes('gamecrazy.com')) {
            return { name: 'gamecrazy', hasAds: true, hasLeaderboard: true, hasUserInfo: true };
        } else {
            return { name: 'local', hasAds: false, hasLeaderboard: false, hasUserInfo: false };
        }
    }

    async initializeKongregate() {
        if (typeof kongregateAPI !== 'undefined') {
            this.isAuthenticated = true;
            this.userData = {
                id: kongregateAPI.getUserId(),
                username: kongregateAPI.getUsername(),
                authToken: kongregateAPI.getAuthToken()
            };
            console.log('✅ Kongregate initialized');
        }
    }

    async initializePoki() {
        if (typeof PokiSDK !== 'undefined') {
            this.isAuthenticated = true;
            this.userData = {
                id: 'poki_user',
                username: 'Poki Player',
                authToken: 'poki_token'
            };
            console.log('✅ Poki initialized');
        }
    }

    async initializeGameCrazy() {
        if (typeof GameCrazyAPI !== 'undefined') {
            this.isAuthenticated = true;
            this.userData = {
                id: 'gamecrazy_user',
                username: 'Game Crazy Player',
                authToken: 'gamecrazy_token'
            };
            console.log('✅ Game Crazy initialized');
        }
    }

    async loadUserData() {
        try {
            // Load from localStorage
            const savedData = localStorage.getItem('phaser3_game_data');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.score = data.score || 0;
                this.level = data.level || 3;
                this.gems = data.gems || 450;
                this.stars = data.stars || 1250;
                this.energy = data.energy || 100;
                this.achievements = data.achievements || this.achievements;
                this.settings = { ...this.settings, ...data.settings };
                console.log('✅ User data loaded');
            }
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
        }
    }

    async saveUserData() {
        try {
            const data = {
                score: this.score,
                level: this.level,
                gems: this.gems,
                stars: this.stars,
                energy: this.energy,
                achievements: this.achievements,
                settings: this.settings,
                lastSaved: Date.now()
            };
            localStorage.setItem('phaser3_game_data', JSON.stringify(data));
            console.log('✅ User data saved');
        } catch (error) {
            console.error('❌ Failed to save user data:', error);
        }
    }

    // Analytics and Tracking
    trackEvent(eventName, data = {}) {
        const eventData = {
            ...data,
            timestamp: Date.now(),
            sessionId: this.analytics.sessionStart,
            platform: this.platformInfo?.name || 'unknown',
            userId: this.userData?.id || 'anonymous'
        };
        
        console.log(`📊 Event: ${eventName}`, eventData);
        
        // Send to platform analytics
        if (this.platformInfo?.name === 'kongregate' && typeof kongregateAPI !== 'undefined') {
            kongregateAPI.stats.submit(eventName, data.value || 0);
        }
        
        // Send to custom analytics
        if (typeof window.GameAPI !== 'undefined') {
            window.GameAPI.trackEvent(eventName, eventData);
        }
    }

    // Energy System
    consumeEnergy(amount = 1) {
        if (this.energy >= amount) {
            this.energy -= amount;
            this.updateEnergyDisplay();
            this.trackEvent('energy_consumed', { amount, remaining: this.energy });
            return true;
        }
        return false;
    }

    addEnergy(amount) {
        this.energy = Math.min(this.energy + amount, this.maxEnergy);
        this.updateEnergyDisplay();
        this.trackEvent('energy_gained', { amount, total: this.energy });
    }

    updateEnergyDisplay() {
        if (this.energyText) {
            this.energyText.setText(`Energy: ${this.energy}/${this.maxEnergy}`);
        }
    }

    // Monetization Features
    showShop() {
        this.pauseGame();
        this.currentScreen = 'shop';
        this.trackEvent('shop_opened');
        // Show shop UI
        this.createShopUI();
    }

    showBattlePass() {
        this.pauseGame();
        this.currentScreen = 'battlepass';
        this.trackEvent('battlepass_opened');
        // Show battle pass UI
        this.createBattlePassUI();
    }

    showLootBox() {
        this.pauseGame();
        this.currentScreen = 'lootbox';
        this.trackEvent('lootbox_opened');
        // Show loot box UI
        this.createLootBoxUI();
    }

    // Shop UI
    createShopUI() {
        // Create shop overlay
        const shopOverlay = this.scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        shopOverlay.setInteractive();
        
        const shopTitle = this.scene.add.text(400, 100, 'Shop', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Gems purchase
        const gemsBtn = this.scene.add.rectangle(200, 200, 150, 100, 0x4ecdc4);
        gemsBtn.setInteractive();
        gemsBtn.on('pointerdown', () => this.purchaseGems(100));
        
        const gemsText = this.scene.add.text(200, 200, '100 Gems\n$0.99', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Stars purchase
        const starsBtn = this.scene.add.rectangle(400, 200, 150, 100, 0xffd700);
        starsBtn.setInteractive();
        starsBtn.on('pointerdown', () => this.purchaseStars(50));
        
        const starsText = this.scene.add.text(400, 200, '50 Stars\n$1.99', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Energy purchase
        const energyBtn = this.scene.add.rectangle(600, 200, 150, 100, 0xff6b6b);
        energyBtn.setInteractive();
        energyBtn.on('pointerdown', () => this.purchaseEnergy(20));
        
        const energyText = this.scene.add.text(600, 200, '20 Energy\n$0.49', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Close button
        const closeBtn = this.scene.add.rectangle(400, 500, 100, 50, 0x666666);
        closeBtn.setInteractive();
        closeBtn.on('pointerdown', () => this.closeShop());
        
        const closeText = this.scene.add.text(400, 500, 'Close', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    purchaseGems(amount) {
        this.gems += amount;
        this.updateUI();
        this.trackEvent('gems_purchased', { amount, total: this.gems });
        this.saveUserData();
    }

    purchaseStars(amount) {
        this.stars += amount;
        this.updateUI();
        this.trackEvent('stars_purchased', { amount, total: this.stars });
        this.saveUserData();
    }

    purchaseEnergy(amount) {
        this.addEnergy(amount);
        this.trackEvent('energy_purchased', { amount, total: this.energy });
        this.saveUserData();
    }

    closeShop() {
        this.currentScreen = 'game';
        this.resumeGame();
        // Remove shop UI
        this.scene.children.list.forEach(child => {
            if (child.texture && child.texture.key === 'shop') {
                child.destroy();
            }
        });
    }

    // Battle Pass UI
    createBattlePassUI() {
        // Create battle pass overlay
        const bpOverlay = this.scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        bpOverlay.setInteractive();
        
        const bpTitle = this.scene.add.text(400, 100, 'Battle Pass', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Battle pass levels
        for (let i = 0; i < 10; i++) {
            const level = i + 1;
            const x = 100 + (i % 5) * 120;
            const y = 200 + Math.floor(i / 5) * 100;
            
            const levelBtn = this.scene.add.rectangle(x, y, 100, 80, 0x4ecdc4);
            levelBtn.setInteractive();
            
            const levelText = this.scene.add.text(x, y, `Level ${level}\n${level * 100} XP`, {
                fontSize: '14px',
                fill: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        }
        
        // Close button
        const closeBtn = this.scene.add.rectangle(400, 500, 100, 50, 0x666666);
        closeBtn.setInteractive();
        closeBtn.on('pointerdown', () => this.closeBattlePass());
        
        const closeText = this.scene.add.text(400, 500, 'Close', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    closeBattlePass() {
        this.currentScreen = 'game';
        this.resumeGame();
        // Remove battle pass UI
        this.scene.children.list.forEach(child => {
            if (child.texture && child.texture.key === 'battlepass') {
                child.destroy();
            }
        });
    }

    // Loot Box UI
    createLootBoxUI() {
        // Create loot box overlay
        const lbOverlay = this.scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        lbOverlay.setInteractive();
        
        const lbTitle = this.scene.add.text(400, 100, 'Loot Box', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Loot box options
        const commonBox = this.scene.add.rectangle(200, 250, 150, 200, 0x666666);
        commonBox.setInteractive();
        commonBox.on('pointerdown', () => this.openLootBox('common'));
        
        const commonText = this.scene.add.text(200, 250, 'Common Box\n100 Gems', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        const rareBox = this.scene.add.rectangle(400, 250, 150, 200, 0x4ecdc4);
        rareBox.setInteractive();
        rareBox.on('pointerdown', () => this.openLootBox('rare'));
        
        const rareText = this.scene.add.text(400, 250, 'Rare Box\n500 Gems', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        const epicBox = this.scene.add.rectangle(600, 250, 150, 200, 0xffd700);
        epicBox.setInteractive();
        epicBox.on('pointerdown', () => this.openLootBox('epic'));
        
        const epicText = this.scene.add.text(600, 250, 'Epic Box\n1000 Gems', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Close button
        const closeBtn = this.scene.add.rectangle(400, 500, 100, 50, 0x666666);
        closeBtn.setInteractive();
        closeBtn.on('pointerdown', () => this.closeLootBox());
        
        const closeText = this.scene.add.text(400, 500, 'Close', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    openLootBox(type) {
        const costs = { common: 100, rare: 500, epic: 1000 };
        const cost = costs[type];
        
        if (this.gems >= cost) {
            this.gems -= cost;
            this.updateUI();
            
            // Simulate loot box opening
            this.animateLootBoxOpening(type);
            
            this.trackEvent('lootbox_opened', { type, cost });
            this.saveUserData();
        }
    }

    animateLootBoxOpening(type) {
        // Create opening animation
        const particles = this.scene.add.particles(400, 300, 'gem_red', {
            speed: { min: 100, max: 300 },
            scale: { start: 1, end: 0 },
            lifespan: 1000
        });
        
        particles.explode(50);
        
        setTimeout(() => {
            particles.destroy();
            this.showLootBoxReward(type);
        }, 1000);
    }

    showLootBoxReward(type) {
        const rewards = {
            common: { gems: 50, stars: 10, energy: 5 },
            rare: { gems: 200, stars: 50, energy: 20 },
            epic: { gems: 500, stars: 100, energy: 50 }
        };
        
        const reward = rewards[type];
        this.gems += reward.gems;
        this.stars += reward.stars;
        this.addEnergy(reward.energy);
        
        this.updateUI();
        this.saveUserData();
        
        // Show reward popup
        const rewardText = this.scene.add.text(400, 300, `Reward!\n+${reward.gems} Gems\n+${reward.stars} Stars\n+${reward.energy} Energy`, {
            fontSize: '24px',
            fill: '#ffd700',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: rewardText,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 2000,
            onComplete: () => {
                rewardText.destroy();
            }
        });
    }

    closeLootBox() {
        this.currentScreen = 'game';
        this.resumeGame();
        // Remove loot box UI
        this.scene.children.list.forEach(child => {
            if (child.texture && child.texture.key === 'lootbox') {
                child.destroy();
            }
        });
    }

    // Integration with existing game system
    setGameState(state) {
        this.score = state.score || 0;
        this.moves = state.moves || 30;
        this.time = state.time || 60;
        this.level = state.level || 3;
        this.gems = state.gems || 450;
        this.stars = state.stars || 1250;
        this.energy = state.energy || 100;
        this.settings = { ...this.settings, ...state.settings };
        this.updateUI();
    }

    getGameState() {
        return {
            score: this.score,
            moves: this.moves,
            time: this.time,
            level: this.level,
            gems: this.gems,
            stars: this.stars,
            energy: this.energy,
            settings: this.settings
        };
    }

    // Screen management
    showScreen(screenName) {
        this.currentScreen = screenName;
        this.trackEvent('screen_changed', { screen: screenName });
    }

    // Pause/Resume
    pauseGame() {
        this.isPaused = true;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.trackEvent('game_paused');
    }

    resumeGame() {
        this.isPaused = false;
        if (this.isGameRunning) {
            this.startTimer();
        }
        this.trackEvent('game_resumed');
    }

    // End game with all features
    endGame() {
        this.isGameRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Calculate stars based on score
        let stars = 0;
        if (this.score >= 5000) stars = 3;
        else if (this.score >= 3000) stars = 2;
        else if (this.score >= 1000) stars = 1;
        
        // Update analytics
        this.analytics.gamesPlayed++;
        this.analytics.totalScore += this.score;
        this.analytics.totalTime += (60 - this.time);
        
        // Track game end
        this.trackEvent('game_ended', {
            score: this.score,
            stars: stars,
            level: this.level,
            duration: 60 - this.time
        });
        
        // Save user data
        this.saveUserData();
        
        console.log(`🎯 Game ended! Score: ${this.score}, Stars: ${stars}`);
        
        // Show end game screen
        this.showEndGameScreen(stars);
    }

    showEndGameScreen(stars) {
        // Create end game overlay
        const endOverlay = this.scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.9);
        endOverlay.setInteractive();
        
        const endTitle = this.scene.add.text(400, 150, 'Game Over!', {
            fontSize: '48px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        const scoreText = this.scene.add.text(400, 200, `Score: ${this.score.toLocaleString()}`, {
            fontSize: '24px',
            fill: '#ffd700',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        const starsText = this.scene.add.text(400, 250, `Stars: ${stars}/3`, {
            fontSize: '24px',
            fill: '#ffd700',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Play again button
        const playAgainBtn = this.scene.add.rectangle(300, 350, 150, 50, 0x4ecdc4);
        playAgainBtn.setInteractive();
        playAgainBtn.on('pointerdown', () => this.restartGame());
        
        const playAgainText = this.scene.add.text(300, 350, 'Play Again', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Main menu button
        const menuBtn = this.scene.add.rectangle(500, 350, 150, 50, 0x666666);
        menuBtn.setInteractive();
        menuBtn.on('pointerdown', () => this.returnToMenu());
        
        const menuText = this.scene.add.text(500, 350, 'Main Menu', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    restartGame() {
        // Reset game state
        this.score = 0;
        this.moves = 30;
        this.time = 60;
        this.energy = Math.max(this.energy - 1, 0);
        
        // Restart the game
        this.startGame();
        
        // Remove end game screen
        this.scene.children.list.forEach(child => {
            if (child.texture && child.texture.key === 'endgame') {
                child.destroy();
            }
        });
    }

    returnToMenu() {
        this.currentScreen = 'menu';
        this.pauseGame();
        // Remove end game screen
        this.scene.children.list.forEach(child => {
            if (child.texture && child.texture.key === 'endgame') {
                child.destroy();
            }
        });
    }

    destroy() {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }
    }
}

// Export for use
window.PhaserMatch3Game = PhaserMatch3Game;