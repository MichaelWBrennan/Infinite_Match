// Infinite Match - Complete Game Logic and UI Interactions

class InfiniteMatchGame {
    constructor() {
        this.currentScreen = 'loading-screen';
        this.gameState = {
            score: 0,
            moves: 30,
            time: 60,
            level: 3,
            gems: 450,
            stars: 1250,
            achievements: [],
            settings: {
                music: true,
                sfx: true,
                highContrast: false,
                largeText: false,
                reduceAnimations: false
            }
        };
        this.gameBoard = [];
        this.selectedGem = null;
        this.isGameRunning = false;
        this.timerInterval = null;
        this.tutorialShown = false;
        this.achievements = [
            { id: 'first_match', name: 'Stellar Debut', description: 'Make your first cosmic gem match', unlocked: false },
            { id: 'score_1000', name: 'Galaxy Master', description: 'Score 1000 points in a single game', unlocked: false },
            { id: 'level_5', name: 'Cosmic Explorer', description: 'Reach level 5', unlocked: false },
            { id: 'perfect_level', name: 'Nebula Perfectionist', description: 'Get 3 stars on any level', unlocked: false }
        ];
        
        this.init();
    }

    init() {
        console.log('Game init started');
        
        try {
            // Initialize game board
            this.initializeGameBoard();
            
            // Add event listeners
            this.addEventListeners();
            
            // Check authentication status
            this.checkAuthStatus();
            
            // Initialize platform detection (non-blocking)
            this.initializePlatformDetection().catch(error => {
                console.warn('Platform detection failed:', error);
            });
            
            // Initialize account economy system (non-blocking)
            this.initializeAccountEconomy().catch(error => {
                console.warn('Account economy initialization failed:', error);
            });
            
            // Optimized loading - reduce timeout and add progress feedback
            this.startLoadingSequence();
            
            console.log('Game init completed');
        } catch (error) {
            console.error('Game initialization failed:', error);
            // Fallback to title screen even if initialization fails
            setTimeout(() => {
                this.showScreen('title-screen');
            }, 1000);
        }
    }
    
    startLoadingSequence() {
        let progress = 0;
        const loadingBar = document.getElementById('loading-bar-fill');
        const loadingText = document.getElementById('loading-text');
        const loadingPercentage = document.getElementById('loading-percentage');
        const loadingError = document.getElementById('loading-error');
        
        const updateProgress = (newProgress, text) => {
            progress = newProgress;
            if (loadingBar) {
                loadingBar.style.width = `${progress}%`;
            }
            if (loadingText) {
                loadingText.textContent = text || 'Loading...';
            }
            if (loadingPercentage) {
                loadingPercentage.textContent = `${progress}%`;
            }
        };
        
        // Simulate loading with progress updates
        const loadingSteps = [
            { progress: 15, text: 'Initializing game engine...', delay: 150 },
            { progress: 30, text: 'Loading game assets...', delay: 200 },
            { progress: 50, text: 'Setting up UI components...', delay: 150 },
            { progress: 70, text: 'Initializing platform detection...', delay: 200 },
            { progress: 85, text: 'Loading user data...', delay: 150 },
            { progress: 95, text: 'Finalizing setup...', delay: 100 },
            { progress: 100, text: 'Ready to play!', delay: 100 }
        ];
        
        let currentStep = 0;
        const runNextStep = () => {
            if (currentStep < loadingSteps.length) {
                const step = loadingSteps[currentStep];
                updateProgress(step.progress, step.text);
                currentStep++;
                setTimeout(runNextStep, step.delay);
            } else {
                // Loading complete
                setTimeout(() => {
                    console.log('Loading complete, switching to title screen');
                    this.showScreen('title-screen');
                }, 200);
            }
        };
        
        // Show error message if loading takes too long
        const errorTimeout = setTimeout(() => {
            if (loadingError) {
                loadingError.style.display = 'block';
            }
        }, 8000);
        
        // Clear error timeout when loading completes
        const originalRunNextStep = runNextStep;
        runNextStep = () => {
            clearTimeout(errorTimeout);
            originalRunNextStep();
        };
        
        runNextStep();
    }

    addEventListeners() {
        // Settings toggles
        document.getElementById('music-toggle').addEventListener('change', (e) => {
            this.gameState.settings.music = e.target.checked;
            console.log('Music:', e.target.checked ? 'ON' : 'OFF');
        });

        document.getElementById('sfx-toggle').addEventListener('change', (e) => {
            this.gameState.settings.sfx = e.target.checked;
            console.log('Sound Effects:', e.target.checked ? 'ON' : 'OFF');
        });

        // Enhanced settings
        const contrastToggle = document.getElementById('contrast-toggle');
        const largeTextToggle = document.getElementById('large-text-toggle');
        const reduceAnimationsToggle = document.getElementById('reduce-animations-toggle');

        if (contrastToggle) {
            contrastToggle.addEventListener('change', (e) => {
                this.gameState.settings.highContrast = e.target.checked;
                document.body.classList.toggle('high-contrast', e.target.checked);
            });
        }

        if (largeTextToggle) {
            largeTextToggle.addEventListener('change', (e) => {
                this.gameState.settings.largeText = e.target.checked;
                document.body.classList.toggle('large-text', e.target.checked);
            });
        }

        if (reduceAnimationsToggle) {
            reduceAnimationsToggle.addEventListener('change', (e) => {
                this.gameState.settings.reduceAnimations = e.target.checked;
                document.body.classList.toggle('reduced-motion', e.target.checked);
            });
        }

        // Level cards - both .level-card and .level-card-royal
        document.querySelectorAll('.level-card, .level-card-royal').forEach((card, index) => {
            if (!card.classList.contains('locked')) {
                // Remove existing onclick to avoid conflicts
                card.removeAttribute('onclick');
                card.addEventListener('click', () => {
                    this.selectLevel(index + 1);
                });
            }
        });

        // Power-up buttons
        document.querySelectorAll('.power-up-btn').forEach(btn => {
            // Extract power-up type from onclick attribute before removing it
            const onclickAttr = btn.getAttribute('onclick');
            let powerType = null;
            if (onclickAttr) {
                const match = onclickAttr.match(/usePowerUp\('(\w+)'\)/);
                if (match) {
                    powerType = match[1];
                }
                // Remove onclick to avoid conflicts
                btn.removeAttribute('onclick');
            }
            
            if (powerType) {
                btn.addEventListener('click', (e) => {
                    this.usePowerUp(powerType);
                });
            }
        });
    }

    showScreen(screenId) {
        console.log('Switching to screen:', screenId);
        
        try {
            // Hide all screens
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });

            // Show target screen
            const targetScreen = document.getElementById(screenId);
            if (targetScreen) {
                targetScreen.classList.add('active');
                this.currentScreen = screenId;
                console.log('✅ Screen switched to:', screenId);
                
                // Add slide-in animation
                targetScreen.style.animation = 'slideIn 0.5s ease-out';
                
                // Debug: Log visible screens
                const visibleScreens = Array.from(document.querySelectorAll('.screen.active')).map(s => s.id);
                console.log('Currently visible screens:', visibleScreens);
            } else {
                console.error('❌ Screen not found:', screenId);
                console.error('Available screens:', Array.from(document.querySelectorAll('.screen')).map(s => s.id));
                
                // Fallback to title screen if target screen not found
                if (screenId !== 'title-screen') {
                    console.log('🔄 Falling back to title screen');
                    this.showScreen('title-screen');
                }
            }
        } catch (error) {
            console.error('Error switching screen:', error);
            // Emergency fallback
            document.getElementById('loading-screen').classList.remove('active');
            document.getElementById('title-screen').classList.add('active');
        }
    }

    showModeSelect() {
        this.showScreen('mode-select');
    }

    showSettings() {
        this.showScreen('settings-screen');
    }

    showTitle() {
        this.showScreen('title-screen');
    }

    showLevelSelect() {
        this.showScreen('level-select');
        this.updatePlayerStats();
    }

    showNews() {
        this.showScreen('news-screen');
    }

    showOffers() {
        this.showScreen('offers-screen');
    }

    showLeaderboard() {
        this.showScreen('leaderboard-screen');
    }

    selectLevel(levelNumber) {
        if (levelNumber <= this.gameState.level) {
            this.gameState.level = levelNumber;
            this.showScreen('pre-game-lobby');
            this.updateLevelInfo();
        }
    }

    updateLevelInfo() {
        const levelTitles = {
            1: 'Launch Pad',
            2: 'Asteroid Field', 
            3: 'Space Station Alpha',
            4: 'Nebula Gateway',
            5: 'Command Center',
            6: 'Cosmic Observatory'
        };

        const levelDescriptions = {
            1: 'Begin your cosmic journey at the launch pad',
            2: 'Navigate through the dangerous asteroid field',
            3: 'Dock at the space station and explore',
            4: 'Pass through the mysterious nebula gateway',
            5: 'Take command of the central command center',
            6: 'Reach the highest point in the cosmic observatory'
        };

        document.querySelector('#pre-game-lobby h2').textContent = `Level ${this.gameState.level}: ${levelTitles[this.gameState.level]}`;
        document.querySelector('.level-info h3').textContent = levelTitles[this.gameState.level];
        document.querySelector('.level-info p').textContent = levelDescriptions[this.gameState.level];
    }

    updatePlayerStats() {
        document.querySelector('.stat .stat-value').textContent = this.gameState.stars;
        document.querySelectorAll('.stat .stat-value')[1].textContent = this.gameState.gems;
    }

    startGame() {
        this.showScreen('game-screen');
        this.isGameRunning = true;
        this.startTimer();
        this.generateGameBoard();
        this.updateGameUI();
        
        // Show tutorial for first-time players
        if (!this.tutorialShown) {
            setTimeout(() => {
                this.showTutorial();
            }, 1000);
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.gameState.time--;
            document.getElementById('timer').textContent = this.gameState.time;
            
            if (this.gameState.time <= 0) {
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
        // In a real game, you'd show a pause menu
        alert('Game Paused! Click OK to resume.');
        this.startTimer();
        this.isGameRunning = true;
    }

    initializeGameBoard() {
        this.gemTypes = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        this.boardSize = 8;
    }

    generateGameBoard() {
        const board = document.getElementById('gem-board');
        board.innerHTML = '';

        for (let i = 0; i < this.boardSize * this.boardSize; i++) {
            const gem = document.createElement('div');
            const gemType = this.gemTypes[Math.floor(Math.random() * this.gemTypes.length)];
            
            gem.className = `game-gem ${gemType}`;
            gem.textContent = '💎';
            gem.dataset.index = i;
            gem.dataset.type = gemType;
            
            gem.addEventListener('click', () => this.selectGem(gem));
            
            board.appendChild(gem);
        }
    }

    selectGem(gem) {
        if (!this.isGameRunning) return;

        // Remove previous selection
        document.querySelectorAll('.game-gem.selected').forEach(g => {
            g.classList.remove('selected');
        });

        if (this.selectedGem === gem) {
            this.selectedGem = null;
            return;
        }

        this.selectedGem = gem;
        gem.classList.add('selected');
        gem.style.transform = 'scale(1.2)';
        gem.style.boxShadow = '0 0 20px rgba(243, 156, 18, 0.8)';
        
        // Add haptic feedback
        vibrate(50);
        
        // Play selection sound
        if (this.gameState.settings.sfx) {
            playSound('gem_select');
        }
    }

    usePowerUp(powerType) {
        if (!this.isGameRunning) return;

        const powerUpBtn = document.querySelector(`[onclick="usePowerUp('${powerType}')"]`);
        const countElement = powerUpBtn.querySelector('.power-count');
        let count = parseInt(countElement.textContent);

        if (count > 0) {
            count--;
            countElement.textContent = count;

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
        const gems = document.querySelectorAll('.game-gem');
        const randomGems = Array.from(gems).sort(() => 0.5 - Math.random()).slice(0, 5);
        
        randomGems.forEach(gem => {
            gem.classList.add('gem-match');
            gem.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                gem.remove();
            }, 500);
        });

        this.addScore(100);
        
        // Play bomb sound
        if (this.gameState.settings.sfx) {
            playSound('bomb_explode');
        }
    }

    activateRainbow() {
        // Clear entire row
        const gems = document.querySelectorAll('.game-gem');
        gems.forEach(gem => {
            gem.classList.add('gem-match');
            gem.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                gem.remove();
            }, 500);
        });

        this.addScore(500);
        
        // Play rainbow sound
        if (this.gameState.settings.sfx) {
            playSound('rainbow_clear');
        }
    }

    activateLightning() {
        // Clear entire column
        const gems = document.querySelectorAll('.game-gem');
        gems.forEach(gem => {
            gem.classList.add('gem-match');
            gem.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                gem.remove();
            }, 500);
        });

        this.addScore(300);
        
        // Play lightning sound
        if (this.gameState.settings.sfx) {
            playSound('lightning_strike');
        }
    }

    showPowerUpAnimation(powerType) {
        const animations = {
            bomb: '💥',
            rainbow: '🌈',
            lightning: '⚡'
        };

        const animation = document.createElement('div');
        animation.textContent = animations[powerType];
        animation.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 4rem;
            z-index: 1000;
            animation: powerUpAnimation 1s ease-out forwards;
            pointer-events: none;
        `;

        document.body.appendChild(animation);

        setTimeout(() => {
            animation.remove();
        }, 1000);
    }

    addScore(points) {
        this.gameState.score += points;
        this.updateGameUI();
    }

    updateGameUI() {
        document.getElementById('score').textContent = this.gameState.score.toLocaleString();
        document.getElementById('moves').textContent = this.gameState.moves;
        document.getElementById('timer').textContent = this.gameState.time;
    }

    endGame() {
        this.isGameRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        // Calculate stars based on score
        let stars = 0;
        if (this.gameState.score >= 5000) stars = 3;
        else if (this.gameState.score >= 3000) stars = 2;
        else if (this.gameState.score >= 1000) stars = 1;

        // Update final score display
        document.getElementById('final-score').textContent = this.gameState.score.toLocaleString();
        
        // Update stars display
        const starsElement = document.querySelector('.stars-earned');
        starsElement.textContent = '⭐'.repeat(stars);

        // Show completion screen
        this.showScreen('level-complete');

        // Add completion animation
        setTimeout(() => {
            document.querySelector('.completion-content').style.animation = 'fadeIn 0.5s ease-out';
        }, 100);
    }

    nextLevel() {
        this.gameState.level++;
        this.gameState.score = 0;
        this.gameState.moves = 30;
        this.gameState.time = 60;
        
        if (this.gameState.level <= 6) {
            this.showScreen('level-select');
            this.updatePlayerStats();
        } else {
            alert('Congratulations! You completed all levels!');
            this.showScreen('title-screen');
        }
    }

    closeModal() {
        document.getElementById('item-modal').classList.remove('active');
    }

    // Show item collection modal
    showItemModal(itemType, amount) {
        const modal = document.getElementById('item-modal');
        const itemIcon = modal.querySelector('.item-icon');
        const itemName = modal.querySelector('.item-name');
        const itemDescription = modal.querySelector('.item-description');

        const items = {
            gem: { icon: '💎', name: 'Infinite Gem', desc: `+${amount} Gems added to your collection` },
            coin: { icon: '⭐', name: 'Infinite Star', desc: `+${amount} Stars added to your collection` },
            power: { icon: '⚡', name: 'Power-up', desc: `+${amount} Power-ups added to your collection` }
        };

        const item = items[itemType] || items.gem;
        itemIcon.textContent = item.icon;
        itemName.textContent = item.name;
        itemDescription.textContent = item.desc;

        modal.classList.add('active');
    }

    // Enhanced Features
    showTutorial() {
        const tutorial = document.getElementById('tutorial-overlay');
        if (tutorial) {
            tutorial.classList.add('active');
            this.tutorialShown = true;
        }
    }

    closeTutorial() {
        const tutorial = document.getElementById('tutorial-overlay');
        if (tutorial) {
            tutorial.classList.remove('active');
        }
    }

    showAchievement(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.gameState.achievements.push(achievement);
            
            const popup = document.getElementById('achievement-popup');
            if (popup) {
                popup.querySelector('.achievement-name').textContent = achievement.name;
                popup.classList.add('active');
                
                setTimeout(() => {
                    popup.classList.remove('active');
                }, 3000);
            }
        }
    }

    checkAchievements() {
        // Check for first match
        if (this.gameState.score > 0 && !this.achievements.find(a => a.id === 'first_match').unlocked) {
            this.showAchievement('first_match');
        }

        // Check for score achievement
        if (this.gameState.score >= 1000 && !this.achievements.find(a => a.id === 'score_1000').unlocked) {
            this.showAchievement('score_1000');
        }

        // Check for level achievement
        if (this.gameState.level >= 5 && !this.achievements.find(a => a.id === 'level_5').unlocked) {
            this.showAchievement('level_5');
        }
    }

    showScorePopup(points, x, y) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${points}`;
        popup.style.left = x + 'px';
        popup.style.top = y + 'px';
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.remove();
        }, 1000);
    }

    addScore(points) {
        this.gameState.score += points;
        this.updateGameUI();
        this.checkAchievements();
        
        // Show score popup
        const gameBoard = document.getElementById('gem-board');
        if (gameBoard) {
            const rect = gameBoard.getBoundingClientRect();
            this.showScorePopup(points, rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
    }

    showAdvancedSettings() {
        this.showScreen('advanced-settings');
    }

    // Login Modal Functions
    showLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.add('active');
            // Reset forms
            this.resetLoginForms();
        } else {
            console.error('Login modal not found in DOM');
        }
    }

    closeLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    switchLoginTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[onclick="switchLoginTab('${tab}')"]`).classList.add('active');
        
        // Update forms
        document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
        document.getElementById(`${tab}-form`).classList.add('active');
    }

    resetLoginForms() {
        // Reset login form
        const loginPlayerId = document.getElementById('login-player-id');
        const loginPassword = document.getElementById('login-password');
        const rememberMe = document.getElementById('remember-me');
        
        if (loginPlayerId) loginPlayerId.value = '';
        if (loginPassword) loginPassword.value = '';
        if (rememberMe) rememberMe.checked = false;
        
        // Reset register form
        const registerPlayerId = document.getElementById('register-player-id');
        const registerEmail = document.getElementById('register-email');
        const registerPassword = document.getElementById('register-password');
        const registerConfirmPassword = document.getElementById('register-confirm-password');
        
        if (registerPlayerId) registerPlayerId.value = '';
        if (registerEmail) registerEmail.value = '';
        if (registerPassword) registerPassword.value = '';
        if (registerConfirmPassword) registerConfirmPassword.value = '';
        
        // Hide account status
        const accountStatus = document.getElementById('account-status');
        if (accountStatus) accountStatus.style.display = 'none';
    }

    async handleLogin() {
        const playerId = document.getElementById('login-player-id').value;
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        if (!playerId || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        const form = document.getElementById('login-form');
        form.classList.add('loading');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerId,
                    password,
                    deviceInfo: this.getDeviceInfo(),
                    rememberMe
                })
            });

            const data = await response.json();

            if (data.success) {
                // Store authentication data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('sessionId', data.sessionId);
                localStorage.setItem('playerId', playerId);
                
                this.showAccountStatus('Login successful!');
                this.updateAccountUI();
                
                setTimeout(() => {
                    this.closeLoginModal();
                }, 2000);
            } else {
                this.showError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            form.classList.remove('loading');
        }
    }

    async handleRegister() {
        const playerId = document.getElementById('register-player-id').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (!playerId || !email || !password || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        const form = document.getElementById('register-form');
        form.classList.add('loading');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerId,
                    email,
                    password,
                    deviceInfo: this.getDeviceInfo()
                })
            });

            const data = await response.json();

            if (data.success) {
                // Store authentication data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('sessionId', data.sessionId);
                localStorage.setItem('playerId', playerId);
                
                this.showAccountStatus('Account created successfully!');
                this.updateAccountUI();
                
                setTimeout(() => {
                    this.closeLoginModal();
                }, 2000);
            } else {
                this.showError(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            form.classList.remove('loading');
        }
    }

    async syncWithPlatform(platform) {
        try {
            // Initialize platform detector if not already done
            if (!window.platformDetector) {
                window.platformDetector = new PlatformDetector();
                await window.platformDetector.initialize();
            }

            const platformAPI = window.platformDetector.getUnifiedAPI();
            
            if (platform === window.platformDetector.currentPlatform) {
                // Current platform - get user info
                const userInfo = await platformAPI.getUserInfo();
                if (userInfo) {
                    // Sync with current platform
                    await this.syncAccountWithPlatform(platform, userInfo);
                } else {
                    this.showError('Unable to get platform user info');
                }
            } else {
                // Different platform - show instructions
                this.showPlatformInstructions(platform);
            }
        } catch (error) {
            console.error('Platform sync error:', error);
            this.showError('Platform sync failed. Please try again.');
        }
    }

    async syncAccountWithPlatform(platform, userInfo) {
        try {
            const response = await fetch('/api/auth/platform-sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    platform,
                    platformUserId: userInfo.id,
                    platformUsername: userInfo.name,
                    platformData: userInfo
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showAccountStatus(`Synced with ${platform} successfully!`);
                this.updateAccountUI();
            } else {
                this.showError(data.error || 'Platform sync failed');
            }
        } catch (error) {
            console.error('Platform sync error:', error);
            this.showError('Platform sync failed. Please try again.');
        }
    }

    showPlatformInstructions(platform) {
        const instructions = {
            kongregate: 'To sync with Kongregate, please play this game on Kongregate.com',
            poki: 'To sync with Poki, please play this game on Poki.com',
            gamecrazy: 'To sync with Game Crazy, please play this game on GameCrazy.com',
            facebook: 'To sync with Facebook, please play this game through Facebook Gaming'
        };

        this.showError(instructions[platform] || 'Platform sync not available');
    }

    showAccountStatus(message) {
        const status = document.getElementById('account-status');
        const statusText = status.querySelector('.status-text');
        statusText.textContent = message;
        status.style.display = 'flex';
    }

    showError(message) {
        // Create or update error message
        let errorDiv = document.querySelector('.login-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'login-error';
            errorDiv.style.cssText = `
                background: rgba(244, 67, 54, 0.2);
                border: 1px solid rgba(244, 67, 54, 0.5);
                color: #f44336;
                padding: 1rem;
                border-radius: 10px;
                margin: 1rem 0;
                text-align: center;
                font-weight: 600;
            `;
            document.querySelector('.login-modal-content .modal-body').appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    updateAccountUI() {
        const playerId = localStorage.getItem('playerId');
        if (playerId) {
            // Update any UI elements that show player info
            const playerNameElements = document.querySelectorAll('#player-name, .player-name');
            playerNameElements.forEach(el => {
                if (el.tagName === 'INPUT') {
                    el.value = playerId;
                } else {
                    el.textContent = playerId;
                }
            });
        }
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            timestamp: new Date().toISOString()
        };
    }

    // Check if user is already logged in
    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        const sessionId = localStorage.getItem('sessionId');
        const playerId = localStorage.getItem('playerId');
        
        if (token && sessionId && playerId) {
            this.updateAccountUI();
            return true;
        }
        return false;
    }

    // Initialize platform detection
    async initializePlatformDetection() {
        try {
            if (window.PlatformDetector) {
                window.platformDetector = new PlatformDetector();
                await window.platformDetector.initialize();
                console.log('🎮 Platform detection initialized');
            }
        } catch (error) {
            console.error('Failed to initialize platform detection:', error);
        }
    }

    // Initialize account economy system
    async initializeAccountEconomy() {
        try {
            const playerId = this.getPlayerId();
            if (!playerId) {
                console.warn('No player ID available for economy initialization');
                return;
            }

            // Initialize player economy
            const response = await fetch('/api/account-economy/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    platform: this.getCurrentPlatform()
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.economyData = data.data;
                console.log('💰 Account economy initialized:', this.economyData);
                this.updateEconomyUI();
            } else {
                console.error('Failed to initialize account economy');
            }
        } catch (error) {
            console.error('Failed to initialize account economy:', error);
        }
    }

    // Get player ID from auth system
    getPlayerId() {
        return localStorage.getItem('playerId') || 'guest_' + Date.now();
    }

    // Get auth token
    getAuthToken() {
        return localStorage.getItem('authToken') || '';
    }

    // Get current platform
    getCurrentPlatform() {
        if (window.platformDetector) {
            return window.platformDetector.getCurrentPlatform();
        }
        return 'local';
    }

    // Update currency
    async updateCurrency(currencyId, amount, operation = 'add', source = 'gameplay') {
        try {
            const response = await fetch('/api/account-economy/currency/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    currencyId,
                    amount,
                    operation,
                    source
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.economyData = await this.getPlayerEconomy();
                this.updateEconomyUI();
                return data.result;
            } else {
                console.error('Failed to update currency');
                return null;
            }
        } catch (error) {
            console.error('Failed to update currency:', error);
            return null;
        }
    }

    // Update inventory
    async updateInventory(category, itemId, quantity, operation = 'add') {
        try {
            const response = await fetch('/api/account-economy/inventory/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    category,
                    itemId,
                    quantity,
                    operation
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.economyData = await this.getPlayerEconomy();
                this.updateEconomyUI();
                return data.result;
            } else {
                console.error('Failed to update inventory');
                return null;
            }
        } catch (error) {
            console.error('Failed to update inventory:', error);
            return null;
        }
    }

    // Complete level with economy rewards
    async completeLevel(level, score, stars = 0) {
        try {
            const xpGained = Math.floor(score / 100) + (stars * 50);
            
            const response = await fetch('/api/account-economy/level/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    level,
                    score,
                    stars,
                    xpGained
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.economyData = await this.getPlayerEconomy();
                this.updateEconomyUI();
                return data.result;
            } else {
                console.error('Failed to complete level');
                return null;
            }
        } catch (error) {
            console.error('Failed to complete level:', error);
            return null;
        }
    }

    // Claim daily reward
    async claimDailyReward() {
        try {
            const response = await fetch('/api/account-economy/daily-reward/claim', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.economyData = await this.getPlayerEconomy();
                this.updateEconomyUI();
                this.showAccountStatus(`Daily reward claimed! Streak: ${data.result.streak}`);
                return data.result;
            } else {
                const errorData = await response.json();
                this.showError(errorData.error);
                return null;
            }
        } catch (error) {
            console.error('Failed to claim daily reward:', error);
            return null;
        }
    }

    // Get player economy data
    async getPlayerEconomy() {
        try {
            const response = await fetch('/api/account-economy/data', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.data;
            } else {
                console.error('Failed to get player economy data');
                return null;
            }
        } catch (error) {
            console.error('Failed to get player economy data:', error);
            return null;
        }
    }

    // Update economy UI
    updateEconomyUI() {
        if (!this.economyData) return;

        const currencies = this.economyData.currencies;
        if (currencies) {
            // Update coins display
            const coinsElement = document.querySelector('.coins-display');
            if (coinsElement && currencies.coins) {
                coinsElement.textContent = currencies.coins.amount.toLocaleString();
            }

            // Update stars display
            const starsElement = document.querySelector('.stars-display');
            if (starsElement && currencies.stars) {
                starsElement.textContent = currencies.stars.amount.toLocaleString();
            }

            // Update energy display
            const energyElement = document.querySelector('.energy-display');
            if (energyElement && currencies.energy) {
                energyElement.textContent = currencies.energy.amount;
            }
        }

        const progression = this.economyData.progression;
        if (progression) {
            const levelElement = document.querySelector('.level-display');
            if (levelElement) {
                levelElement.textContent = `Level ${progression.level}`;
            }

            const xpElement = document.querySelector('.xp-display');
            if (xpElement) {
                xpElement.textContent = `${progression.xp}/${progression.xpToNext} XP`;
            }
        }
    }
}

// Global functions for HTML onclick events
function showModeSelect() {
    console.log('🎮 showModeSelect called, game exists:', !!window.game);
    
    // Try to ensure game is ready first
    if (!window.game) {
        console.log('🔄 Game not ready, attempting to initialize...');
        if (typeof InfiniteMatchGame !== 'undefined') {
            try {
                window.game = new InfiniteMatchGame();
                console.log('✅ Game initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize game:', error);
            }
        }
    }
    
    if (window.game && typeof window.game.showModeSelect === 'function') {
        console.log('🎮 Calling window.game.showModeSelect()');
        window.game.showModeSelect();
    } else {
        console.error('❌ Game object not available or showModeSelect method missing');
        
        // Fallback: Try to show the mode select screen directly
        console.log('🔄 Attempting fallback mode select...');
        switchToScreen('mode-select');
    }
}

function showSettings() {
    console.log('⚙️ showSettings called, game exists:', !!window.game);
    
    // Try to ensure game is ready first
    if (!window.game) {
        console.log('🔄 Game not ready, attempting to initialize...');
        if (typeof InfiniteMatchGame !== 'undefined') {
            try {
                window.game = new InfiniteMatchGame();
                console.log('✅ Game initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize game:', error);
            }
        }
    }
    
    if (window.game && typeof window.game.showSettings === 'function') {
        console.log('⚙️ Calling window.game.showSettings()');
        window.game.showSettings();
    } else {
        console.error('❌ Game object not available or showSettings method missing');
        
        // Fallback: Try to show the settings screen directly
        console.log('🔄 Attempting fallback settings...');
        switchToScreen('settings-screen');
    }
}

function showTitle() {
    console.log('showTitle called, game exists:', !!window.game);
    
    // Try to ensure game is ready first
    if (!window.game) {
        console.log('🔄 Game not ready, attempting to initialize...');
        if (typeof InfiniteMatchGame !== 'undefined') {
            try {
                window.game = new InfiniteMatchGame();
                console.log('✅ Game initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize game:', error);
            }
        }
    }
    
    if (window.game && typeof window.game.showTitle === 'function') {
        window.game.showTitle();
    } else {
        console.error('Game object not available or showTitle method missing');
        
        // Fallback: Try to show the title screen directly
        console.log('🔄 Attempting fallback title...');
        switchToScreen('title-screen');
    }
}

function showLevelSelect() {
    console.log('showLevelSelect called, game exists:', !!window.game);
    
    // Try to ensure game is ready first
    if (!window.game) {
        console.log('🔄 Game not ready, attempting to initialize...');
        if (typeof InfiniteMatchGame !== 'undefined') {
            try {
                window.game = new InfiniteMatchGame();
                console.log('✅ Game initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize game:', error);
            }
        }
    }
    
    if (window.game && typeof window.game.showLevelSelect === 'function') {
        window.game.showLevelSelect();
    } else {
        console.error('Game object not available or showLevelSelect method missing');
        
        // Fallback: Try to show the level select screen directly
        console.log('🔄 Attempting fallback level select...');
        switchToScreen('level-select');
    }
}

function showNews() {
    console.log('📰 showNews called, game exists:', !!window.game);
    
    // Try to ensure game is ready first
    if (!window.game) {
        console.log('🔄 Game not ready, attempting to initialize...');
        if (typeof InfiniteMatchGame !== 'undefined') {
            try {
                window.game = new InfiniteMatchGame();
                console.log('✅ Game initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize game:', error);
            }
        }
    }
    
    if (window.game && typeof window.game.showNews === 'function') {
        console.log('📰 Calling window.game.showNews()');
        window.game.showNews();
    } else {
        console.error('❌ Game object not available or showNews method missing');
        
        // Fallback: Try to show the news screen directly
        console.log('🔄 Attempting fallback news...');
        switchToScreen('news-screen');
    }
}

function showOffers() {
    console.log('showOffers called, game exists:', !!window.game);
    if (ensureGameReady() && window.game && typeof window.game.showOffers === 'function') {
        window.game.showOffers();
    } else {
        console.error('Game object not available or showOffers method missing');
    }
}

function showLeaderboard() {
    console.log('showLeaderboard called, game exists:', !!window.game);
    if (ensureGameReady() && window.game && typeof window.game.showLeaderboard === 'function') {
        window.game.showLeaderboard();
    } else {
        console.error('Game object not available or showLeaderboard method missing');
    }
}

function startGame() {
    console.log('startGame called, game exists:', !!window.game);
    if (ensureGameReady() && window.game && typeof window.game.startGame === 'function') {
        window.game.startGame();
    } else {
        console.error('Game object not available or startGame method missing');
    }
}

function pauseGame() {
    if (window.game) window.game.pauseGame();
}

function usePowerUp(type) {
    if (window.game) window.game.usePowerUp(type);
}

function nextLevel() {
    if (window.game) window.game.nextLevel();
}

function closeModal() {
    if (window.game) window.game.closeModal();
}

function closeTutorial() {
    if (window.game) window.game.closeTutorial();
}

function showAdvancedSettings() {
    console.log('showAdvancedSettings called, game exists:', !!window.game);
    if (ensureGameReady() && window.game && typeof window.game.showAdvancedSettings === 'function') {
        window.game.showAdvancedSettings();
    } else {
        console.error('Game object not available or showAdvancedSettings method missing');
    }
}

// Login Modal Functions
function showLoginModal() {
    console.log('👤 showLoginModal called, game exists:', !!window.game);
    
    // Try to ensure game is ready first
    if (!window.game) {
        console.log('🔄 Game not ready, attempting to initialize...');
        if (typeof InfiniteMatchGame !== 'undefined') {
            try {
                window.game = new InfiniteMatchGame();
                console.log('✅ Game initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize game:', error);
            }
        }
    }
    
    if (window.game && typeof window.game.showLoginModal === 'function') {
        console.log('👤 Calling window.game.showLoginModal()');
        window.game.showLoginModal();
    } else {
        console.error('❌ Game object not available or showLoginModal method missing');
        
        // Fallback: Try to show the login modal directly
        console.log('🔄 Attempting fallback login modal...');
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.classList.add('active');
            console.log('✅ Fallback login modal successful');
        } else {
            console.error('❌ Fallback login modal failed - modal not found');
        }
    }
}

function closeLoginModal() {
    if (window.game) window.game.closeLoginModal();
}

function switchLoginTab(tab) {
    if (window.game) window.game.switchLoginTab(tab);
}

function handleLogin() {
    if (window.game) window.game.handleLogin();
}

function handleRegister() {
    if (window.game) window.game.handleRegister();
}

function syncWithPlatform(platform) {
    if (window.game) window.game.syncWithPlatform(platform);
}

function selectLevel(levelNumber) {
    if (window.game) window.game.selectLevel(levelNumber);
}

// Initialize game when page loads
let game;

// Robust game initialization function
function initializeGame() {
    if (typeof InfiniteMatchGame !== 'undefined' && (!window.game || typeof window.game === 'undefined')) {
        try {
            console.log('Initializing game...');
            window.game = new InfiniteMatchGame();
            game = window.game; // Keep local reference for compatibility
            console.log('✅ Game initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize game:', error);
            return false;
        }
    } else if (window.game && typeof window.game !== 'undefined') {
        game = window.game; // Keep local reference for compatibility
        console.log('Game already initialized');
        return true;
    } else {
        console.error('❌ InfiniteMatchGame class not available');
        return false;
    }
}

// Auto-initialize game when script loads
if (typeof InfiniteMatchGame !== 'undefined') {
    console.log('🚀 Auto-initializing game...');
    initializeGame();
} else {
    console.log('⏳ Waiting for InfiniteMatchGame class to be available...');
    // Try again after a short delay
    setTimeout(() => {
        if (typeof InfiniteMatchGame !== 'undefined') {
            console.log('🚀 Delayed auto-initialization...');
            initializeGame();
        }
    }, 100);
}

// Ensure game is ready before calling methods
function ensureGameReady() {
    if (!window.game || typeof window.game === 'undefined') {
        console.log('🔄 Game not ready, attempting to initialize...');
        const initialized = initializeGame();
        if (initialized) {
            console.log('✅ Game initialized successfully');
        } else {
            console.error('❌ Failed to initialize game');
        }
        return initialized;
    }
    game = window.game; // Keep local reference for compatibility
    return true;
}

// Make sure global functions are available immediately
window.showModeSelect = showModeSelect;
window.showSettings = showSettings;
window.showTitle = showTitle;
window.showLevelSelect = showLevelSelect;
window.showNews = showNews;
window.showOffers = showOffers;
window.showLeaderboard = showLeaderboard;
window.startGame = startGame;
window.pauseGame = pauseGame;
window.usePowerUp = usePowerUp;
window.nextLevel = nextLevel;
window.closeModal = closeModal;
window.closeTutorial = closeTutorial;
window.showAdvancedSettings = showAdvancedSettings;
window.showLoginModal = showLoginModal;
window.closeLoginModal = closeLoginModal;
window.switchLoginTab = switchLoginTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.syncWithPlatform = syncWithPlatform;
window.selectLevel = selectLevel;

// Add a simple screen switching function that works without the game object
function switchToScreen(screenId) {
    console.log('Switching to screen:', screenId);
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        console.log('✅ Screen switched to:', screenId);
    } else {
        console.error('❌ Screen not found:', screenId);
    }
}

// Make the screen switching function available globally
window.switchToScreen = switchToScreen;

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        to {
            opacity: 0;
            transform: scale(0.5);
        }
    }

    @keyframes powerUpAnimation {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
        }
    }

    .game-gem.selected {
        transform: scale(1.2) !important;
        box-shadow: 0 0 20px rgba(243, 156, 18, 0.8) !important;
        z-index: 10;
    }

    .level-card.current {
        animation: pulse 2s infinite;
    }

    .completion-content {
        animation: fadeIn 0.5s ease-out;
    }

    .screen {
        animation: slideIn 0.5s ease-out;
    }
`;
document.head.appendChild(style);

// Add touch support for mobile
document.addEventListener('touchstart', (e) => {
    // Prevent default touch behavior for game elements
    if (e.target.classList.contains('game-gem')) {
        e.preventDefault();
    }
}, { passive: false });

// Add keyboard support
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'Escape':
            if (window.game && window.game.currentScreen === 'game-screen') {
                window.game.pauseGame();
            }
            break;
        case 'Enter':
            if (window.game && window.game.currentScreen === 'title-screen') {
                window.game.showModeSelect();
            }
            break;
    }
});

// Add sound effects (placeholder)
function playSound(soundType) {
    // In a real implementation, you would play actual sound files
    console.log(`Playing sound: ${soundType}`);
}

// Add haptic feedback for mobile
function vibrate(duration = 100) {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

// Add game analytics (placeholder)
function trackEvent(eventName, properties = {}) {
    console.log(`Analytics Event: ${eventName}`, properties);
}

// Initialize analytics
trackEvent('game_loaded', {
    screen: 'loading',
    timestamp: new Date().toISOString()
});

// Add performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
            console.log(`Performance: ${entry.name} took ${entry.duration}ms`);
        }
    }
});

performanceObserver.observe({ entryTypes: ['measure'] });

// Add error handling
window.addEventListener('error', (e) => {
    console.error('Game Error:', e.error);
    trackEvent('game_error', {
        error: e.error.message,
        stack: e.error.stack,
        timestamp: new Date().toISOString()
    });
});

// Add unhandled promise rejection handling
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
    trackEvent('promise_rejection', {
        reason: e.reason,
        timestamp: new Date().toISOString()
    });
});