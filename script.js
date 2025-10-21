// Royal Match - Complete Game Logic and UI Interactions

class RoyalMatchGame {
    constructor() {
        this.currentScreen = 'loading-screen';
        this.gameState = {
            score: 0,
            moves: 30,
            time: 60,
            level: 3,
            gems: 450,
            stars: 1250
        };
        this.gameBoard = [];
        this.selectedGem = null;
        this.isGameRunning = false;
        this.timerInterval = null;
        
        this.init();
    }

    init() {
        // Simulate loading
        setTimeout(() => {
            this.showScreen('title-screen');
        }, 3000);

        // Initialize game board
        this.initializeGameBoard();
        
        // Add event listeners
        this.addEventListeners();
    }

    addEventListeners() {
        // Settings toggles
        document.getElementById('music-toggle').addEventListener('change', (e) => {
            console.log('Music:', e.target.checked ? 'ON' : 'OFF');
        });

        document.getElementById('sfx-toggle').addEventListener('change', (e) => {
            console.log('Sound Effects:', e.target.checked ? 'ON' : 'OFF');
        });

        // Level cards
        document.querySelectorAll('.level-card').forEach((card, index) => {
            if (!card.classList.contains('locked')) {
                card.addEventListener('click', () => {
                    this.selectLevel(index + 1);
                });
            }
        });

        // Power-up buttons
        document.querySelectorAll('.power-up-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const powerType = e.currentTarget.onclick.toString().match(/usePowerUp\('(\w+)'\)/)[1];
                this.usePowerUp(powerType);
            });
        });
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            
            // Add slide-in animation
            targetScreen.style.animation = 'slideIn 0.5s ease-out';
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
            1: 'First Steps',
            2: 'Royal Garden', 
            3: 'Castle Gate',
            4: 'Royal Hall',
            5: 'Throne Room',
            6: 'Royal Tower'
        };

        const levelDescriptions = {
            1: 'Learn the basics of royal matching',
            2: 'Match gems in the royal garden',
            3: 'Match gems to unlock the royal gate',
            4: 'Enter the magnificent royal hall',
            5: 'Reach the royal throne room',
            6: 'Climb the highest royal tower'
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
            gem.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                gem.remove();
            }, 500);
        });

        this.addScore(100);
    }

    activateRainbow() {
        // Clear entire row
        const gems = document.querySelectorAll('.game-gem');
        gems.forEach(gem => {
            gem.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                gem.remove();
            }, 500);
        });

        this.addScore(500);
    }

    activateLightning() {
        // Clear entire column
        const gems = document.querySelectorAll('.game-gem');
        gems.forEach(gem => {
            gem.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                gem.remove();
            }, 500);
        });

        this.addScore(300);
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
            gem: { icon: '💎', name: 'Royal Gem', desc: `+${amount} Gems added to your collection` },
            coin: { icon: '⭐', name: 'Royal Star', desc: `+${amount} Stars added to your collection` },
            power: { icon: '⚡', name: 'Power-up', desc: `+${amount} Power-ups added to your collection` }
        };

        const item = items[itemType] || items.gem;
        itemIcon.textContent = item.icon;
        itemName.textContent = item.name;
        itemDescription.textContent = item.desc;

        modal.classList.add('active');
    }
}

// Global functions for HTML onclick events
function showModeSelect() {
    game.showModeSelect();
}

function showSettings() {
    game.showSettings();
}

function showTitle() {
    game.showTitle();
}

function showLevelSelect() {
    game.showLevelSelect();
}

function showNews() {
    game.showNews();
}

function showOffers() {
    game.showOffers();
}

function showLeaderboard() {
    game.showLeaderboard();
}

function startGame() {
    game.startGame();
}

function pauseGame() {
    game.pauseGame();
}

function usePowerUp(type) {
    game.usePowerUp(type);
}

function nextLevel() {
    game.nextLevel();
}

function closeModal() {
    game.closeModal();
}

// Initialize game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new RoyalMatchGame();
});

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
            if (game.currentScreen === 'game-screen') {
                game.pauseGame();
            }
            break;
        case 'Enter':
            if (game.currentScreen === 'title-screen') {
                game.showModeSelect();
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