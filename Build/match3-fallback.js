// Match 3 Game Fallback Implementation
// This runs when Unity WebGL is not available

class Match3Game {
    constructor() {
        this.boardSize = 8;
        this.colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        this.board = [];
        this.score = 0;
        this.level = 1;
        this.moves = 30;
        this.selectedTile = null;
        this.isGameOver = false;
        this.isPaused = false;
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.renderBoard();
        this.setupEventListeners();
        this.updateUI();
        
        // Track game start
        if (window.trackEvent) {
            window.trackEvent('game_started', {
                level: this.level,
                platform: 'fallback'
            });
        }
    }
    
    createBoard() {
        this.board = [];
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                this.board[row][col] = {
                    color: this.colors[Math.floor(Math.random() * this.colors.length)],
                    row: row,
                    col: col
                };
            }
        }
    }
    
    renderBoard() {
        const container = document.getElementById('unity-container');
        
        // Remove existing board
        const existingBoard = document.querySelector('.match3-board');
        if (existingBoard) {
            existingBoard.remove();
        }
        
        // Create new board
        const board = document.createElement('div');
        board.className = 'match3-board';
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const tile = document.createElement('div');
                tile.className = `tile ${this.board[row][col].color}`;
                tile.dataset.row = row;
                tile.dataset.col = col;
                tile.onclick = () => this.selectTile(row, col);
                board.appendChild(tile);
            }
        }
        
        container.appendChild(board);
    }
    
    selectTile(row, col) {
        if (this.isPaused || this.isGameOver) return;
        
        const tile = this.board[row][col];
        
        if (this.selectedTile === null) {
            // First selection
            this.selectedTile = { row, col };
            this.updateTileSelection();
        } else {
            // Second selection
            const firstTile = this.board[this.selectedTile.row][this.selectedTile.col];
            
            if (this.isAdjacent(this.selectedTile, { row, col })) {
                // Swap tiles
                this.swapTiles(this.selectedTile, { row, col });
                
                // Check for matches
                const matches = this.findMatches();
                if (matches.length > 0) {
                    this.processMatches(matches);
                    if (window.trackEvent) {
                        window.trackEvent('match_made', {
                            match_type: matches.length,
                            pieces_matched: matches.reduce((sum, match) => sum + match.length, 0),
                            level: this.level
                        });
                    }
                } else {
                    // Swap back if no matches
                    this.swapTiles(this.selectedTile, { row, col });
                }
            }
            
            this.selectedTile = null;
            this.updateTileSelection();
        }
    }
    
    isAdjacent(tile1, tile2) {
        const rowDiff = Math.abs(tile1.row - tile2.row);
        const colDiff = Math.abs(tile1.col - tile2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    swapTiles(tile1, tile2) {
        const temp = this.board[tile1.row][tile1.col];
        this.board[tile1.row][tile1.col] = this.board[tile2.row][tile2.col];
        this.board[tile2.row][tile2.col] = temp;
        this.renderBoard();
    }
    
    findMatches() {
        const matches = [];
        const visited = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(false));
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (!visited[row][col]) {
                    const match = this.findMatchFromTile(row, col, visited);
                    if (match.length >= 3) {
                        matches.push(match);
                    }
                }
            }
        }
        
        return matches;
    }
    
    findMatchFromTile(row, col, visited) {
        const color = this.board[row][col].color;
        const match = [];
        const stack = [{ row, col }];
        
        while (stack.length > 0) {
            const { row: r, col: c } = stack.pop();
            
            if (visited[r][c] || this.board[r][c].color !== color) continue;
            
            visited[r][c] = true;
            match.push({ row: r, col: c });
            
            // Check adjacent tiles
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of directions) {
                const newRow = r + dr;
                const newCol = c + dc;
                
                if (newRow >= 0 && newRow < this.boardSize && 
                    newCol >= 0 && newCol < this.boardSize && 
                    !visited[newRow][newCol]) {
                    stack.push({ row: newRow, col: newCol });
                }
            }
        }
        
        return match;
    }
    
    processMatches(matches) {
        let totalScore = 0;
        
        matches.forEach(match => {
            // Calculate score
            const matchScore = match.length * 100 * this.level;
            totalScore += matchScore;
            
            // Mark tiles as matched
            match.forEach(({ row, col }) => {
                this.board[row][col] = null;
            });
            
            // Create particle effect
            this.createParticleEffect(match[0].row, match[0].col);
        });
        
        this.score += totalScore;
        this.moves--;
        
        // Fill empty spaces
        this.fillEmptySpaces();
        
        // Check for new matches
        const newMatches = this.findMatches();
        if (newMatches.length > 0) {
            setTimeout(() => this.processMatches(newMatches), 500);
        }
        
        this.updateUI();
        this.checkGameOver();
    }
    
    fillEmptySpaces() {
        for (let col = 0; col < this.boardSize; col++) {
            // Move existing tiles down
            let writeRow = this.boardSize - 1;
            for (let row = this.boardSize - 1; row >= 0; row--) {
                if (this.board[row][col] !== null) {
                    if (writeRow !== row) {
                        this.board[writeRow][col] = this.board[row][col];
                        this.board[row][col] = null;
                    }
                    writeRow--;
                }
            }
            
            // Fill empty spaces with new tiles
            for (let row = writeRow; row >= 0; row--) {
                this.board[row][col] = {
                    color: this.colors[Math.floor(Math.random() * this.colors.length)],
                    row: row,
                    col: col
                };
            }
        }
        
        this.renderBoard();
    }
    
    createParticleEffect(row, col) {
        const particles = document.getElementById('particles') || this.createParticlesContainer();
        const tileSize = 60;
        const boardOffset = 20;
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = (col * tileSize + boardOffset + tileSize / 2) + 'px';
            particle.style.top = (row * tileSize + boardOffset + tileSize / 2) + 'px';
            particle.style.left = (parseInt(particle.style.left) + (Math.random() - 0.5) * 20) + 'px';
            particle.style.top = (parseInt(particle.style.top) + (Math.random() - 0.5) * 20) + 'px';
            
            particles.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }
    
    createParticlesContainer() {
        const container = document.getElementById('unity-container');
        const particles = document.createElement('div');
        particles.id = 'particles';
        particles.className = 'particles';
        container.appendChild(particles);
        return particles;
    }
    
    updateTileSelection() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => tile.classList.remove('selected'));
        
        if (this.selectedTile) {
            const selectedTile = document.querySelector(`[data-row="${this.selectedTile.row}"][data-col="${this.selectedTile.col}"]`);
            if (selectedTile) {
                selectedTile.classList.add('selected');
            }
        }
    }
    
    updateUI() {
        // Create UI if it doesn't exist
        this.createUI();
        
        const scoreElement = document.getElementById('score');
        const levelElement = document.getElementById('level');
        const movesElement = document.getElementById('moves');
        
        if (scoreElement) scoreElement.textContent = this.score.toLocaleString();
        if (levelElement) levelElement.textContent = this.level;
        if (movesElement) movesElement.textContent = this.moves;
    }
    
    createUI() {
        const container = document.getElementById('unity-container');
        
        // Create game UI if it doesn't exist
        if (!document.querySelector('.game-ui')) {
            const gameUI = document.createElement('div');
            gameUI.className = 'game-ui';
            gameUI.innerHTML = `
                <div class="score">Score: <span id="score">0</span></div>
                <div class="level">Level: <span id="level">1</span></div>
                <div class="moves">Moves: <span id="moves">30</span></div>
            `;
            container.appendChild(gameUI);
        }
        
        // Create game controls if they don't exist
        if (!document.querySelector('.game-controls')) {
            const gameControls = document.createElement('div');
            gameControls.className = 'game-controls';
            gameControls.innerHTML = `
                <button class="btn" onclick="match3Game.startNewGame()">New Game</button>
                <button class="btn secondary" onclick="match3Game.pauseGame()">Pause</button>
                <button class="btn success" onclick="match3Game.usePowerUp()">Power Up</button>
            `;
            container.appendChild(gameControls);
        }
    }
    
    checkGameOver() {
        if (this.moves <= 0) {
            this.isGameOver = true;
            this.showGameOver();
            if (window.trackEvent) {
                window.trackEvent('game_ended', {
                    final_score: this.score,
                    level_reached: this.level,
                    moves_used: 30 - this.moves
                });
            }
        } else if (this.score >= this.level * 1000) {
            // Level up
            this.level++;
            this.moves += 10; // Bonus moves
            if (window.trackEvent) {
                window.trackEvent('level_completed', {
                    level: this.level - 1,
                    score: this.score,
                    moves_remaining: this.moves
                });
            }
        }
    }
    
    showGameOver() {
        const container = document.getElementById('unity-container');
        
        // Remove existing game over
        const existingGameOver = document.querySelector('.game-over');
        if (existingGameOver) {
            existingGameOver.remove();
        }
        
        const gameOver = document.createElement('div');
        gameOver.className = 'game-over';
        gameOver.innerHTML = `
            <h2>Game Over!</h2>
            <p>Final Score: <span>${this.score.toLocaleString()}</span></p>
            <p>Level Reached: <span>${this.level}</span></p>
            <button class="btn" onclick="match3Game.startNewGame()">Play Again</button>
        `;
        container.appendChild(gameOver);
    }
    
    startNewGame() {
        this.score = 0;
        this.level = 1;
        this.moves = 30;
        this.selectedTile = null;
        this.isGameOver = false;
        this.isPaused = false;
        
        // Remove game over screen
        const gameOver = document.querySelector('.game-over');
        if (gameOver) {
            gameOver.remove();
        }
        
        this.createBoard();
        this.renderBoard();
        this.updateUI();
        
        if (window.trackEvent) {
            window.trackEvent('game_started', {
                level: this.level,
                platform: 'fallback'
            });
        }
    }
    
    pauseGame() {
        this.isPaused = !this.isPaused;
        if (window.trackEvent) {
            window.trackEvent(this.isPaused ? 'game_paused' : 'game_resumed', {
                level: this.level,
                score: this.score
            });
        }
    }
    
    usePowerUp() {
        if (this.score >= 1000) {
            this.score -= 1000;
            this.moves += 5;
            this.updateUI();
            if (window.trackEvent) {
                window.trackEvent('powerup_used', {
                    powerup_type: 'extra_moves',
                    cost: 1000,
                    level: this.level
                });
            }
        }
    }
    
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.renderBoard();
        });
        
        // Handle visibility change (pause when tab is not visible)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !this.isPaused && !this.isGameOver) {
                this.pauseGame();
            }
        });
    }
}

// Initialize the game when the page loads
let match3Game;
document.addEventListener('DOMContentLoaded', () => {
    match3Game = new Match3Game();
});

// Make it globally available
window.match3Game = match3Game;