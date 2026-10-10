// Phaser 3 Match-3 Game with All Features
// Replaces Unity WebGL while keeping all existing functionality

// Legacy configuration for older standalone shells. The deployed web game uses
// the shared, certified generator in js/procedural-levels.js and /api/levels.
// New generated levels have bounded difficulty and reproducible boards.
// Tuning overrides from the server. Each level's target is multiplied by its override (1 when
// none). Loaded once when the page starts. The server applies the same overrides to every win.
let levelOverrides = { levels: {} };

// Overlay objects are boxes or texts. A button's label is kept on the box, so both go together.
function destroyOverlayObjects(objects) {
    (objects || []).forEach((obj) => {
        if (obj.labelText) obj.labelText.destroy();
        obj.destroy();
    });
}
if (typeof fetch === 'function') {
    fetch('/api/level-results/targets')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d && d.levels) levelOverrides = { levels: d.levels }; })
        .catch(() => {});
}

// Game modes. classic: the level's moves and a 60-second clock. timed: the clock only, with no
// move limit. endless: no target and no clock. A run ends when no move is left.
function levelConfig(level, mode = 'classic') {
    const n = Math.max(1, Math.floor(Number(level) || 1));
    const isBoss = n % 10 === 0;
    const multiplier = (levelOverrides && levelOverrides.levels && levelOverrides.levels[n]) || 1;
    const targetScore = Math.round((800 + n * 60) * (isBoss ? 2 : 1) * multiplier);
    const moves = Math.max(12, 30 - Math.floor(n / 25) - (isBoss ? 5 : 0));
    if (mode === 'timed') return { level: n, targetScore, moves: 999, isBoss, isDaily: false, mode, timeLimit: 60 };
    if (mode === 'endless') {
        return { level: n, targetScore: Number.MAX_SAFE_INTEGER, moves: Number.MAX_SAFE_INTEGER, isBoss: false, isDaily: false, mode, timeLimit: 0 };
    }
    return { level: n, targetScore, moves, isBoss, isDaily: false, mode: 'classic', timeLimit: 60 };
}

// Compatibility-only daily configuration for older shells without the shared asset.
// The live Daily button uses a unique regional/day seed, not this legacy fixed range.
function dailyChallengeLevel(dateString) {
    let hash = 2166136261;
    for (const ch of String(dateString)) {
        hash ^= ch.charCodeAt(0);
        hash = Math.imul(hash, 16777619) >>> 0;
    }
    const config = levelConfig(1 + (hash % 300));
    return { ...config, isDaily: true };
}

// Power-ups that need a tapped gem. They arm on press and fire on the next tap.
const TARGETED_POWERUPS = ['diamond', 'target', 'star'];
const POWERUP_TYPES = ['bomb', 'rainbow', 'lightning', 'diamond', 'target', 'star'];

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
        // Game mode and clock. timeLimit 0 means no clock (endless).
        this.mode = 'classic';
        this.timeLimit = 60;
        this.runStartedAt = 0;
        this.level = 1;
        this.campaignLevel = 1;
        try {
            const saved = JSON.parse(localStorage.getItem('phaser3_game_data') || '{}');
            if (Number.isSafeInteger(saved.level) && saved.level > 0) this.level = this.campaignLevel = saved.level;
        } catch { /* Storage is optional; generation is not. */ }
        this.endlessTotalScore = 0;
        this.targetScore = 1000; // score that wins the level
        // Stars belong to the server. Guests have none, and signed-in players see the synced value.
        this.stars = 0;
        this.energy = 100;
        this.maxEnergy = 100;
        this.achievements = [];
        this.settings = {
            music: false,
            sfx: false,
            soundChoiceVersion: 1,
            soundVolume: 0.55,
            highContrast: false,
            largeText: false,
            reduceAnimations: false,
            haptics: false,
            textBoard: false
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
        const self = this;
        this.loadUserData(); // Local preferences are available on the title, not only after Play.
        this.soundEffects = window.InfiniteSoundEffects?.create(this.settings) || null;
        this.playerUI = window.InfinitePlayerExperience?.mount(this, document.getElementById('phaser-game-container')) || null;
        
        // Initialize Phaser 3 game
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: this.playerUI ? 'match-board-surface' : 'phaser-game-container',
            backgroundColor: '#2c3e50',
            // Phaser invokes these with the Scene as `this`. The methods below
            // reach the scene through `this.scene`, which was never assigned
            // (preload threw "Cannot read properties of null"), so each callback
            // records the scene before delegating.
            scene: {
                preload: function () { self.scene = this; self.preload(); },
                create: function () { self.scene = this; self.create(); }
            },
            audio: { noAudio: true }, // Local opt-in Web Audio controller; no eager Phaser context.
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0, x: 0 },
                    debug: false
                }
            },
            scale: {
                mode: this.playerUI ? Phaser.Scale.RESIZE : Phaser.Scale.FIT,
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
        
    }

    createGemTextures() {
        if (window.InfinitePlayerExperience && this.scene.textures?.createCanvas) {
            for (const type of Object.keys(window.InfinitePlayerExperience.visuals)) {
                for (const special of [null, ...window.InfinitePlayerExperience.specialTypes]) {
                    for (const shield of [0, 1, 2]) {
                        const texture = this.scene.textures.createCanvas(this.gemTexture(type, special, shield), 64, 64);
                        const context = texture.getContext();
                        window.InfinitePlayerExperience.drawGem(context, type, special);
                        if (shield) {
                            // A numbered ice-blue frame is readable without hue or animation.
                            context.save();
                            context.strokeStyle = '#e8fbff'; context.lineWidth = shield === 2 ? 4 : 2;
                            context.strokeRect(2, 2, 60, 60);
                            context.fillStyle = '#12354b'; context.fillRect(41, 0, 23, 23);
                            context.fillStyle = '#ffffff'; context.font = 'bold 17px sans-serif';
                            context.textAlign = 'center'; context.textBaseline = 'middle';
                            context.fillText(String(shield), 52, 12); context.restore();
                        }
                        texture.refresh();
                    }
                }
            }
            return;
        }
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

        graphics.clear();
        graphics.fillStyle(0x9b59b6);
        graphics.fillRect(0, 0, 64, 64);
        graphics.generateTexture('powerup_diamond', 64, 64);

        graphics.clear();
        graphics.fillStyle(0xe67e22);
        graphics.fillRect(0, 0, 64, 64);
        graphics.generateTexture('powerup_target', 64, 64);

        graphics.clear();
        graphics.fillStyle(0xf1c40f);
        graphics.fillRect(0, 0, 64, 64);
        graphics.generateTexture('powerup_star', 64, 64);
        
        graphics.destroy();
    }

    create() {
        console.log('🎯 Creating Phaser 3 game scene...');
        
        this.createGameBoard();
        this.createUI();
        this.createPowerUps();
        this.setupInput();
        this.setupAnimations();
        this.matchFeedback?.destroy();
        this.matchFeedback = window.InfiniteMatchFeedback?.create(this) || null;
        if (this.playerUI) {
            this.boardResizeObserver?.disconnect();
            // A goal/status row can move the canvas without changing its size.
            // Refresh cached input bounds BEFORE Phaser hit-tests the native event.
            for (const type of ['pointerdown', 'touchstart', 'mousedown']) {
                if (this.onBoardPointerBounds) this.playerUI.surface.removeEventListener(type, this.onBoardPointerBounds, true);
            }
            this.onBoardPointerBounds = () => this.refreshBoardInputBounds();
            for (const type of ['pointerdown', 'touchstart', 'mousedown']) this.playerUI.surface.addEventListener(type, this.onBoardPointerBounds, true);
            this.scene.scale.on('resize', () => this.fitBoardViewport());
            this.boardResizeObserver = new ResizeObserver(() => {
                const { clientWidth: width, clientHeight: height } = this.playerUI.surface;
                if (width > 0 && height > 0) { this.game.scale.resize(width, height); this.fitBoardViewport(); }
            });
            this.boardResizeObserver.observe(this.playerUI.surface);
            this.fitBoardViewport();
        }
        
        // Nothing starts on load. The title overlay waits for Play, which claims an attempt first.
        this.showTitleOverlay();
        this.syncAccountFromServer();
        // Signing in happens in the DOM login modal. When it finishes, refresh energy and the title.
        this.onAuthChanged = () => {
            this.syncAccountFromServer();
            if (this.titleShowing && !this.signInReturnState) this.showTitleOverlay();
        };
        window.addEventListener('auth:changed', this.onAuthChanged);
        window.dispatchEvent?.(new Event('match:ready'));
    }

    // Title screen, drawn on the canvas. Play starts the first board; sign-in opens the login modal.
    showTitleOverlay() {
        this.titleShowing = true;
        const signedIn = !!this.getAuthToken();
        this.openOverlay('Infinite Match');
        this.overlayText(400, 150, this.playerUI ? 'Match gems to complete every displayed goal. Sound is optional; Play preferences has local effects (off by default).' : 'Match gems, clear the board, and build your kingdom.', { size: 20, width: 600 });
        this.overlayText(400, 200, signedIn
            ? 'Signed in. Energy, coins, and rewards are saved to your account.'
            : 'Sign in to save energy, coins, and purchases to your account.', { size: 16, width: 600 });
        this.overlayButton(400, 300, 300, 60, 0x4ecdc4, 'Play', () => this.requestStart());
        this.overlayButton(400, 380, 300, 60, 0x9b59b6, signedIn ? 'Switch account' : 'Sign in / Register', () => this.openSignIn());
        this.overlayButton(400, 460, 300, 55, 0xe09d54, 'Today’s Local Level', () => this.startDaily());
        if (this.playerUI) this.overlayButton(400, 530, 300, 55, 0x555555, 'Play preferences', () => this.playerUI.showPreferences());
    }

    // Opens the DOM login modal. It sits above the canvas (z-index 2000).
    openSignIn() {
        if (this.playerUI) {
            this.signInReturnState = { title: !!this.titleShowing,
                resume: this.playerOverlayResume ?? (this.isGameRunning && !this.isPaused) };
            delete this.playerOverlayResume;
            this.closeOverlay();
            this.pauseGame();
        }
        if (typeof window.showLoginModal === 'function') window.showLoginModal();
    }

    closeSignIn() {
        if (!this.signInReturnState) return;
        const state = this.signInReturnState;
        this.signInReturnState = null;
        if (state.title) this.showTitleOverlay();
        else {
            if (state.resume) this.resumeGame();
            this.playerUI?.surface.focus({ preventScroll: true });
        }
    }

    // The Play button. Starts the current level: applies its target and move limit, and claims
    // an attempt first when signed in.
    async requestStart() {
        this.titleShowing = false;
        this.closeOverlay();
        if (this.mode === 'classic' || this.mode === 'timed') this.level = this.campaignLevel || this.level;
        return this.selectLevel(Math.floor(this.level));
    }

    // Advances to the next numbered level. Used by the DOM controller's "next level" control.
    nextLevel() {
        return Promise.resolve(this.rewardSubmission).then(() => {
            if (this.mode === 'daily') return this.startDaily();
            return this.selectLevel(Math.floor(this.level) + 1);
        });
    }

    // ----- Match-3 core ---------------------------------------------------
    // The board model (this.board: boardSize x boardSize array of gem type
    // strings, or null for an empty cell) is the source of truth. Sprites in
    // this.gemSprites are views of it: each sprite's texture and position follow
    // the model cell it occupies.

    cellX(col) {
        return this.boardX + col * this.cellStep;
    }

    cellY(row) {
        return this.boardY + row * this.cellStep;
    }

    randomGem() {
        if (this.generatedLevel && this.levelRng) {
            return globalThis.InfiniteLevels.pickGem(this.levelRng, this.gemTypes, this.generatedLevel.gemWeights);
        }
        return this.gemTypes[Math.floor(Math.random() * this.gemTypes.length)];
    }

    isInBounds(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }

    isAdjacent(r1, c1, r2, c2) {
        return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
    }

    createGameBoard() {
        this.matchFeedback?.finish('new-board', false);
        this.feedbackEndPending = false;
        this.feedbackResultStars = null;
        this.boardEpoch = (this.boardEpoch || 0) + 1;
        this.gestureStart = null; this.hintCells = null; this.keyboardCursor = null;
        this.boardX = this.generatedLevel ? 450 - (this.boardSize - 1) * 54 / 2 : 250;
        this.boardY = this.generatedLevel ? 280 - (this.boardSize - 1) * 54 / 2 : 80;
        this.gemSize = 50;
        this.cellStep = 54;
        this.gemScale = this.gemSize / 64; // gem textures are 64px
        this.selectedGem = null;

        const n = this.boardSize;
        this.board = Array.from({ length: n }, () => new Array(n).fill(null));
        this.gemSprites = Array.from({ length: n }, () => new Array(n).fill(null));
        this.specials = this.usesEarnedSpecials() ? (this.generatedLevel.specials || globalThis.InfiniteLevels.blankSpecials(n)).map((row) => row.slice()) : null;
        this.shields = this.generatedLevel?.generatorVersion >= 5 ? this.generatedLevel.shields.map((row) => row.slice()) : null;

        if (this.generatedLevel) {
            this.board = this.generatedLevel.board.map((row) => row.slice());
        } else {
            // Compatibility with older standalone shells without the generator asset.
            for (let row = 0; row < n; row++) {
                for (let col = 0; col < n; col++) this.board[row][col] = this.randomGemAvoidingMatch(row, col);
            }
        }

        for (let row = 0; row < n; row++) {
            for (let col = 0; col < n; col++) {
                this.gemSprites[row][col] = this.createGemSprite(row, col, this.board[row][col]);
            }
        }
        this.playerUI?.assistiveBoard?.sync();
    }

    usesEarnedSpecials() {
        return this.generatedLevel?.generatorVersion >= 3 && !!globalThis.InfiniteLevels?.simulateSpecialMove;
    }

    gemTexture(type, special = null, shield = 0) {
        const base = special && window.InfinitePlayerExperience ? `gem_${type}_${special}` : `gem_${type}`;
        return shield && window.InfinitePlayerExperience ? `${base}_shield${shield}` : base;
    }

    activateEarnedSpecial(row, col) {
        if (!this.canInteractWithBoard() || !this.usesEarnedSpecials() || !this.specials[row]?.[col]) return null;
        return this.commitEarnedAction([row, col]);
    }

    commitEarnedAction(cells) {
        if (!this.canInteractWithBoard()) return null;
        const result = globalThis.InfiniteLevels.simulateLevelMove(this.generatedLevel,
            { board: this.board, specials: this.specials, shields: this.shields, refillState: this.levelRng.state, objectiveProgress: this.objectiveProgress }, cells, this.generatedLevel.generatorVersion < 5 && this.matchFeedback?.canStage() === true);
        if (!result) {
            if (cells.length === 4) this.shake([this.gemSprites[cells[0]][cells[1]], this.gemSprites[cells[2]][cells[3]]]);
            this.playerUI?.announce('That swap does not make a match. No move spent.');
            this.playSound('invalid');
            return null;
        }
        this.moves--;
        if (this.replayEligible) this.attemptMoves.push(cells.slice());
        this.renderEarnedTransition(result);
        this.checkEndConditions();
        return result;
    }

    renderEarnedTransition(result, soundCue = null) {
        this.matchFeedback?.finish('new-action', false);
        const animateFallback = !this.matchFeedback && !this.namedBoardActive();
        this.inputLockedUntil = 0;
        this.setSelectedGem(null); this.hintCells = null;
        const previous = this.gemSprites;
        const kept = new Set(result.origins.flat().filter(Boolean).map((key) => {
            const [r, c] = key.split(',').map(Number); return previous[r][c];
        }));
        const free = previous.flat().filter((sprite) => !kept.has(sprite));
        const drops = new Array(this.boardSize).fill(0);
        this.board = result.board; this.specials = result.specials; if (result.shields) this.shields = result.shields; this.levelRng.state = result.refillState;
        this.gemSprites = result.board.map((row, r) => row.map((type, c) => {
            const origin = result.origins[r][c];
            const [oldRow, oldCol] = origin ? origin.split(',').map(Number) : [];
            const sprite = origin ? previous[oldRow][oldCol] : free.shift();
            this.scene.tweens.killTweensOf(sprite);
            if (!origin) sprite.setPosition(this.cellX(c), this.cellY(-1 - drops[c]++));
            sprite.setTexture(this.gemTexture(type, this.specials[r][c], this.shields?.[r]?.[c]));
            sprite.setData('type', type); sprite.setData('special', this.specials[r][c]);
            sprite.setVisible(true); sprite.setAlpha(1); sprite.setScale(this.gemScale); sprite.clearTint();
            this.placeSprite(sprite, r, c, animateFallback);
            return sprite;
        }));
        if (result.objectiveProgress) this.objectiveProgress = result.objectiveProgress;
        this.addScore(result.score);
        this.matchFeedback?.play(result);
        this.showEarnedFeedback(result);
        this.playSound(soundCue || window.InfiniteSoundEffects?.cueForTransition(result) || 'match');
        if (animateFallback && this.playerUI && !this.animationsReduced()) this.inputLockedUntil = Date.now() + 220;
        const earned = result.events.flatMap((event) => event.created);
        const activated = result.events.flatMap((event) => event.activated);
        const combo = result.events.find((event) => event.combo)?.combo;
        const names = window.InfinitePlayerExperience?.specialNames || {};
        const description = combo ? ` · ${combo.split('+').map((kind) => names[kind] || (kind === 'beam' ? 'Beam' : kind)).join(' + ')} combo` : activated.length ? ` · ${activated.length} special${activated.length === 1 ? '' : 's'} activated` : '';
        this.playerUI?.announce(`${result.score} points${result.cascades > 1 ? ` · ${result.cascades} waves` : ''}${description}${earned.length ? ` · Earned ${[...new Set(earned.map((item) => names[item.type] || item.type))].join(', ')}` : ''}. ${['classic', 'daily'].includes(this.mode) ? `${this.moves} moves left.` : ''}${result.reshuffled ? ' Free board repair.' : ''}${this.usesLevelObjectives() ? ` ${globalThis.InfiniteLevels.objectiveSummary(this.generatedLevel, this.score, this.objectiveProgress)}` : ''}`);
        this.updateUI();
    }

    showEarnedFeedback(result) {
        const first = result.events[0];
        if (!this.playerUI || !first) return;
        if (this.settings.haptics && navigator.vibrate) navigator.vibrate(first.combo ? [15, 25, 15] : 15);
        if (this.matchFeedback || this.namedBoardActive() || this.animationsReduced() || !this.scene.add.graphics) return;
        // Compatibility-only footprint when the staged renderer is unavailable.
        // One soft footprint, not a strobing effect per cascade; no input hit area.
        const effect = this.scene.add.graphics().setDepth(2);
        effect.fillStyle(first.combo ? 0xffdf87 : 0xffffff, 0.18);
        for (const key of first.cleared) {
            const [r, c] = key.split(',').map(Number);
            effect.fillRoundedRect(this.cellX(c) - 24, this.cellY(r) - 24, 48, 48, 8);
        }
        this.scene.tweens.add({ targets: effect, alpha: 0, duration: 180, onComplete: () => effect.destroy() });
    }

    refreshBoardInputBounds() {
        this.game?.scale?.updateBounds?.();
    }

    fitBoardViewport() {
        if (!this.playerUI || !this.boardSize) return;
        const { clientWidth: width, clientHeight: height } = this.playerUI.surface;
        if (width <= 0 || height <= 0) return;
        const camera = this.scene.cameras.main;
        camera.setZoom(window.InfinitePlayerExperience.boardZoom(width, height, this.boardSize, this.cellStep));
        camera.centerOn(this.boardX + (this.boardSize - 1) * this.cellStep / 2, this.boardY + (this.boardSize - 1) * this.cellStep / 2);
    }

    animationsReduced() {
        return !!this.settings?.reduceAnimations || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    }

    namedBoardActive() {
        return this.settings?.textBoard === true || !!this.playerUI?.surface?.classList?.contains('match-text-board-active');
    }

    onMatchFeedbackSettled(epoch) {
        if (epoch !== this.boardEpoch) return;
        if (this.feedbackResultStars !== null && this.feedbackResultStars !== undefined) {
            const stars = this.feedbackResultStars; this.feedbackResultStars = null;
            this.showEndGameScreen(stars);
        }
        if (this.feedbackEndPending && this.isGameRunning && !this.isPaused) this.checkEndConditions();
        this.playerUI?.refresh();
    }

    canInteractWithBoard() {
        return !!this.isGameRunning && !this.isPaused && !this.powerUpPending && !this.levelStarting
            && !this.matchFeedback?.isActive() && !this.feedbackEndPending && !(this.inputLockedUntil > Date.now()) && !(this.playerUI?.shell.querySelector('dialog').open);
    }

    beginGemGesture(gem, pointer) {
        if (!this.canInteractWithBoard() || (this.gestureStart && this.gestureStart.id !== pointer.id)) return;
        this.playerUI?.surface.focus({ preventScroll: true });
        this.gestureStart = { gem, row: gem.getData('row'), col: gem.getData('col'), x: pointer.x, y: pointer.y, id: pointer.id, epoch: this.boardEpoch };
    }

    endGemGesture(pointer, cancelled = false) {
        const gesture = this.gestureStart;
        if (!gesture || gesture.id !== pointer.id) return;
        this.gestureStart = null;
        if (cancelled || /cancel/i.test(pointer.event?.type || '') || gesture.epoch !== this.boardEpoch || !this.canInteractWithBoard()) return;
        const cells = window.InfinitePlayerExperience.swipeCells(gesture.row, gesture.col,
            pointer.x - gesture.x, pointer.y - gesture.y, this.boardSize);
        if (cells) { this.setSelectedGem(null); this.trySwap(...cells); }
        else if (Math.max(Math.abs(pointer.x - gesture.x), Math.abs(pointer.y - gesture.y)) < 18) this.selectGem(gesture.gem);
    }

    handleBoardKey(event) {
        if (event.key.toLowerCase() === 'm' && !event.ctrlKey && !event.altKey && !event.metaKey) {
            event.preventDefault(); event.stopPropagation();
            if (!event.repeat) this.setSoundEffects(!this.settings.sfx, event);
            return;
        }
        if (!this.canInteractWithBoard()) {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape'].includes(event.key) || event.key.toLowerCase() === 'h') {
                event.preventDefault(); event.stopPropagation();
            }
            return;
        }
        const [row, col] = this.keyboardCursor || [0, 0];
        const cell = window.InfinitePlayerExperience.keyboardCell(row, col, event.key, this.boardSize);
        if (cell) {
            event.preventDefault(); event.stopPropagation(); this.keyboardCursor = cell;
            const gem = this.gemSprites[cell[0]][cell[1]];
            this.setSelectedGem(this.selectedGem);
            gem.setScale(this.gemScale * 1.08);
            const type = gem.getData('type');
            this.playerUI?.announce(`Row ${cell[0] + 1}, column ${cell[1] + 1}: ${type} ${window.InfinitePlayerExperience.visuals[type].shape}${gem.getData('special') ? ` · ${window.InfinitePlayerExperience.specialNames[gem.getData('special')]}` : ''}. Space selects; Enter selects or activates.`);
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault(); event.stopPropagation(); this.selectGem(this.gemSprites[row][col], { selectOnly: event.key === ' ' });
            if (this.selectedGem) this.playerUI?.announce(`Selected row ${row + 1}, column ${col + 1}. Choose an adjacent gem.`);
        } else if (event.key.toLowerCase() === 'h') {
            event.preventDefault(); event.stopPropagation(); this.showHint();
        } else if (event.key === 'Escape') {
            event.preventDefault(); event.stopPropagation(); this.setSelectedGem(null); this.disarmPowerUp();
            this.playerUI?.announce('Selection cleared.');
        }
    }

    showHint() {
        if (!this.canInteractWithBoard() || !globalThis.InfiniteLevels) return null;
        const moves = globalThis.InfiniteLevels.levelActions(this.generatedLevel, this.board, this.specials, this.objectiveProgress, this.score, this.shields, this.levelRng.state);
        moves.sort((a, b) => (b.priority || 0) - (a.priority || 0) || b.count - a.count);
        if (!moves.length) return null;
        this.hintsUsed = Math.min(99, (this.hintsUsed || 0) + 1); // Diagnostic only; hints stay free.
        const cells = moves[0].cells;
        this.disarmPowerUp();
        this.playerUI?.refresh();
        this.setSelectedGem(null); this.hintCells = cells;
        for (const [r, c] of (cells.length === 2 ? [[cells[0], cells[1]]] : [[cells[0], cells[1]], [cells[2], cells[3]]])) this.gemSprites[r][c].setScale(this.gemScale * 1.08);
        const message = cells.length === 2 ? `Free hint: tap the special at row ${cells[0] + 1}, column ${cells[1] + 1}. No move or charge spent.` : `Free hint: ${this.specials?.[cells[0]]?.[cells[1]] || this.specials?.[cells[2]]?.[cells[3]] ? 'swipe' : 'swap'} row ${cells[0] + 1}, column ${cells[1] + 1} with row ${cells[2] + 1}, column ${cells[3] + 1}. No move or charge spent.`;
        this.playerUI?.announce(message + (this.usesLevelObjectives() ? ` ${globalThis.InfiniteLevels.objectiveSummary(this.generatedLevel, this.score, this.objectiveProgress, true)}` : ''));
        this.playSound('hint');
        this.playerUI?.assistiveBoard?.sync();
        return cells;
    }

    createGemSprite(row, col, type) {
        const gem = this.scene.add.image(this.cellX(col), this.cellY(row), this.gemTexture(type, this.specials?.[row]?.[col], this.shields?.[row]?.[col]));
        gem.setScale(this.gemScale);
        // Full cell hit area; shape/symbol is visual, not a smaller touch target.
        if (this.playerUI && window.Phaser?.Geom) gem.setInteractive(new Phaser.Geom.Rectangle(-3, -3, 70, 70), Phaser.Geom.Rectangle.Contains);
        else gem.setInteractive();
        gem.setData('row', row);
        gem.setData('col', col);
        gem.setData('type', type);
        gem.setData('special', this.specials?.[row]?.[col] || null);
        gem.on('pointerdown', (pointer) => this.playerUI ? this.beginGemGesture(gem, pointer) : this.selectGem(gem));
        return gem;
    }

    // Picks a gem type for (row, col) that does not complete a run with the two
    // cells above or to the left (those are already filled when dealing).
    randomGemAvoidingMatch(row, col) {
        const b = this.board;
        const banned = new Set();
        if (col >= 2 && b[row][col - 1] === b[row][col - 2]) banned.add(b[row][col - 1]);
        if (row >= 2 && b[row - 1][col] === b[row - 2][col]) banned.add(b[row - 1][col]);
        const options = this.gemTypes.filter(t => !banned.has(t));
        return options[Math.floor(Math.random() * options.length)];
    }

    // Returns a Set of "row,col" keys for every gem that is part of a run of
    // three or more identical gems, horizontally or vertically.
    findMatches() {
        const n = this.boardSize;
        const b = this.board;
        const found = new Set();
        const scan = (cells) => {
            let i = 0;
            while (i < cells.length) {
                const t = b[cells[i][0]][cells[i][1]];
                let j = i + 1;
                while (t && j < cells.length && b[cells[j][0]][cells[j][1]] === t) j++;
                if (t && j - i >= 3) {
                    for (let k = i; k < j; k++) found.add(`${cells[k][0]},${cells[k][1]}`);
                }
                i = j;
            }
        };
        for (let r = 0; r < n; r++) {
            scan(Array.from({ length: n }, (_, c) => [r, c]));
        }
        for (let c = 0; c < n; c++) {
            scan(Array.from({ length: n }, (_, r) => [r, c]));
        }
        return found;
    }

    hasPossibleMove() {
        if (this.usesEarnedSpecials()) return this.specials.some((row) => row.some(Boolean)) || globalThis.InfiniteLevels.legalSwaps(this.board).length > 0;
        const n = this.boardSize;
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                for (const [dr, dc] of [[0, 1], [1, 0]]) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (!this.isInBounds(nr, nc)) continue;
                    this.swapModel(r, c, nr, nc);
                    const ok = this.findMatches().size > 0;
                    this.swapModel(r, c, nr, nc);
                    if (ok) return true;
                }
            }
        }
        return false;
    }

    // Re-deals gem types across the board until it has no formed match and at
    // least one legal move. Used when the board is deadlocked or after restart.
    reshuffleBoard() {
        const n = this.boardSize;
        if (this.generatedLevel) {
            this.board = globalThis.InfiniteLevels.dealPlayableBoard(n, this.gemTypes, this.generatedLevel.gemWeights, this.levelRng);
        } else for (let attempt = 0; attempt < 200; attempt++) {
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    this.board[r][c] = this.randomGem();
                }
            }
            if (this.findMatches().size === 0 && this.hasPossibleMove()) break;
        }
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const sprite = this.gemSprites[r][c];
                sprite.setTexture(`gem_${this.board[r][c]}`);
                sprite.setData('type', this.board[r][c]);
            }
        }
    }

    selectGem(gem, { selectOnly = false } = {}) {
        if (!this.canInteractWithBoard()) return;

        if (this.armedPowerUp) {
            this.fireTargetedPowerUp(gem);
            return;
        }

        if (!this.selectedGem) {
            if (this.usesEarnedSpecials() && gem.getData('special') && !selectOnly) {
                this.activateEarnedSpecial(gem.getData('row'), gem.getData('col')); return;
            }
            this.setSelectedGem(gem);
            return;
        }
        if (this.selectedGem === gem) {
            if (this.usesEarnedSpecials() && gem.getData('special') && !selectOnly) {
                this.activateEarnedSpecial(gem.getData('row'), gem.getData('col')); return;
            }
            this.setSelectedGem(null);
            return;
        }

        const first = this.selectedGem;
        const r1 = first.getData('row');
        const c1 = first.getData('col');
        const r2 = gem.getData('row');
        const c2 = gem.getData('col');

        if (this.isAdjacent(r1, c1, r2, c2)) {
            this.setSelectedGem(null);
            this.trySwap(r1, c1, r2, c2);
        } else {
            // Not adjacent: treat the tap as a new selection.
            this.setSelectedGem(gem);
        }
    }

    setSelectedGem(gem) {
        this.gemSprites.forEach(row => row.forEach(g => {
            if (g) {
                g.clearTint();
                g.setScale(this.gemScale);
            }
        }));
        this.selectedGem = gem;
        this.playerUI?.assistiveBoard?.sync();
        if (!gem) return;

        gem.setTint(0xffd700);
        gem.setScale(this.gemScale * 1.2);

        if (this.settings.haptics && navigator.vibrate) {
            navigator.vibrate(50);
        }
        if (this.settings.sfx) {
            this.playSound('gem_select');
        }
    }

    swapModel(r1, c1, r2, c2) {
        const t = this.board[r1][c1];
        this.board[r1][c1] = this.board[r2][c2];
        this.board[r2][c2] = t;
    }

    swapSprites(r1, c1, r2, c2) {
        const a = this.gemSprites[r1][c1];
        const b = this.gemSprites[r2][c2];
        this.gemSprites[r1][c1] = b;
        this.gemSprites[r2][c2] = a;
        this.placeSprite(b, r1, c1, true);
        this.placeSprite(a, r2, c2, true);
    }

    // Records a sprite's cell and moves it there (tweened or instant).
    placeSprite(sprite, row, col, animate) {
        sprite.setData('row', row);
        sprite.setData('col', col);
        this.scene.tweens.killTweensOf(sprite);
        if (animate && !this.animationsReduced() && !this.namedBoardActive()) {
            this.scene.tweens.add({
                targets: sprite,
                x: this.cellX(col),
                y: this.cellY(row),
                duration: 200,
                ease: 'Quad.easeOut',
            });
        } else {
            sprite.setPosition(this.cellX(col), this.cellY(row));
        }
    }

    shake(sprites) {
        if (this.animationsReduced()) return;
        sprites.forEach(s => {
            const x = s.x;
            this.scene.tweens.add({ targets: s, x: x + 6, duration: 40, yoyo: true, repeat: 2 });
        });
    }

    trySwap(r1, c1, r2, c2) {
        if (!this.canInteractWithBoard() || !this.isInBounds(r1, c1) || !this.isInBounds(r2, c2) || !this.isAdjacent(r1, c1, r2, c2)) return;
        this.hintCells = null;
        if (this.usesEarnedSpecials()) return this.commitEarnedAction([r1, c1, r2, c2]);

        this.swapModel(r1, c1, r2, c2);
        if (this.findMatches().size === 0) {
            // Not a match: undo and shake to show the swap was refused. Moves are
            // not spent.
            this.swapModel(r1, c1, r2, c2);
            this.shake([this.gemSprites[r1][c1], this.gemSprites[r2][c2]]);
            this.playerUI?.announce('That swap does not make a match. No move spent.');
            this.playSound('invalid');
            return;
        }

        this.swapSprites(r1, c1, r2, c2);
        this.moves--;
        const scoreBefore = this.score;
        const chain = this.resolveBoard();
        this.playSound(chain > 1 ? 'cascade' : 'match');
        if (!this.hasPossibleMove()) {
            this.reshuffleBoard();
        }
        if (this.playerUI && !this.animationsReduced() && !this.namedBoardActive()) this.inputLockedUntil = Date.now() + 220;
        this.playerUI?.announce(`${this.score - scoreBefore} points${chain > 1 ? ` · ${chain} cascades` : ''}. ${['classic', 'daily'].includes(this.mode) ? `${this.moves} moves left.` : 'Nice match.'}`);
        this.updateUI();
        this.checkEndConditions();
    }

    // Clears every formed match, drops gems to fill the gaps, and repeats until
    // the board is stable. Each cascade step multiplies the points.
    resolveBoard() {
        let chain = 0;
        let matches = this.findMatches();
        while (matches.size > 0 && chain < 64) {
            chain++;
            this.addScore(matches.size * 10 * chain);
            this.removeCells(matches);
            this.collapseColumns();
            matches = this.findMatches();
        }
        if (matches.size) this.reshuffleBoard(); // Same bounded cascade repair as the certifier.
        return chain;
    }

    removeCells(keys) {
        keys.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            this.board[r][c] = null;
            const sprite = this.gemSprites[r][c];
            this.scene.tweens.killTweensOf(sprite);
            if (this.animationsReduced()) { sprite.setVisible(false); return; }
            this.scene.tweens.add({
                targets: sprite,
                alpha: 0,
                scaleX: 0,
                scaleY: 0,
                duration: 150,
                onComplete: () => sprite.setVisible(false),
            });
        });
    }

    // Gravity: survivors keep their order and fall to the bottom of each column;
    // the freed sprites are reused as new gems dropping in from above.
    collapseColumns() {
        const n = this.boardSize;
        for (let col = 0; col < n; col++) {
            const survivors = [];
            const freed = [];
            for (let row = n - 1; row >= 0; row--) {
                if (this.board[row][col] !== null) {
                    survivors.push({ type: this.board[row][col], sprite: this.gemSprites[row][col] });
                } else {
                    freed.push(this.gemSprites[row][col]);
                }
            }

            for (let row = n - 1, i = 0; row >= 0; row--, i++) {
                if (i < survivors.length) {
                    const { type, sprite } = survivors[i];
                    this.board[row][col] = type;
                    this.gemSprites[row][col] = sprite;
                    this.placeSprite(sprite, row, col, true);
                    sprite.setData('type', type);
                } else {
                    const type = this.randomGem();
                    const sprite = freed[i - survivors.length];
                    this.board[row][col] = type;
                    this.gemSprites[row][col] = sprite;
                    this.scene.tweens.killTweensOf(sprite);
                    sprite.setTexture(`gem_${type}`);
                    sprite.setAlpha(1);
                    sprite.setScale(this.gemScale);
                    sprite.setVisible(true);
                    sprite.setData('type', type);
                    const dropFromRow = -1 - (i - survivors.length);
                    sprite.setPosition(this.cellX(col), this.cellY(dropFromRow));
                    this.placeSprite(sprite, row, col, true);
                }
            }
        }
    }

    usesLevelObjectives() {
        return this.generatedLevel?.generatorVersion >= 4;
    }

    hasWonLevel() {
        return this.usesLevelObjectives() ? globalThis.InfiniteLevels.objectiveStatus(this.generatedLevel, this.score, this.objectiveProgress).complete
            : this.score >= this.targetScore;
    }

    checkEndConditions() {
        if (!this.isGameRunning) return;
        if (this.matchFeedback?.isActive()) {
            // Finalize ordinary results/rewards NOW, exactly as instant play does.
            // Only their result screen waits for the read-only visual layer.
            if (this.mode !== 'endless' && (this.hasWonLevel() || this.moves <= 0)) { this.endGame(true); return; }
            this.feedbackEndPending = true; return;
        }
        if (this.isPaused && this.feedbackEndPending) return;
        this.feedbackEndPending = false;
        if (this.mode === 'endless' && this.generatedLevel) {
            if (this.hasWonLevel()) this.advanceEndlessStage();
            return;
        }
        if (this.hasWonLevel() || this.moves <= 0) {
            this.endGame();
            return;
        }
        // An endless run ends when no move is left on the board.
        if (this.mode === 'endless' && !this.hasPossibleMove()) this.endGame();
    }

    // Clears the given cells (power-up effects), then resolves any cascades.
    clearAndCascade(keys, points, soundCue = 'inventory', inventoryAction = null) {
        // A signed-in effect is replayable only when its server receipt is bound to this
        // attempt. Legacy and guest spends remain playable but cannot claim replay.
        const receipt = this.powerReceipt;
        const track = this.replayEligible && receipt?.receiptId && inventoryAction?.type === receipt.type;
        if (!track) this.replayEligible = false;
        if (this.usesEarnedSpecials()) {
            const result = this.usesLevelObjectives()
                ? globalThis.InfiniteLevels.simulateObjectiveClear(this.generatedLevel,
                    { board: this.board, specials: this.specials, shields: this.shields, refillState: this.levelRng.state, objectiveProgress: this.objectiveProgress }, keys, points, this.generatedLevel.generatorVersion < 5 && this.matchFeedback?.canStage() === true)
                : globalThis.InfiniteLevels.simulateSpecialClear(this.board, this.levelRng.state, this.gemTypes, this.generatedLevel.gemWeights, keys, this.specials, points, false, this.matchFeedback?.canStage() === true);
            if (result) {
                if (track) this.attemptMoves.push({ receiptId: receipt.receiptId, ...inventoryAction });
                this.renderEarnedTransition(result, soundCue); this.checkEndConditions();
            } else this.replayEligible = false;
            return;
        }
        this.setSelectedGem(null);
        this.addScore(points);
        this.removeCells(keys);
        this.collapseColumns();
        this.resolveBoard();
        if (!this.hasPossibleMove()) {
            this.reshuffleBoard();
        }
        this.updateUI();
        this.playSound(soundCue);
        this.checkEndConditions();
    }

    allCellKeys() {
        const keys = new Set();
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                keys.add(`${r},${c}`);
            }
        }
        return keys;
    }

    activateBomb() {
        // 3x3 blast around a random gem.
        const n = this.boardSize;
        const r0 = Math.floor(Math.random() * n);
        const c0 = Math.floor(Math.random() * n);
        const keys = new Set();
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = r0 + dr;
                const c = c0 + dc;
                if (this.isInBounds(r, c)) keys.add(`${r},${c}`);
            }
        }
        this.clearAndCascade(keys, 100, 'burst', { type: 'bomb', target: [r0, c0] });
    }

    activateRainbow() {
        // Clears the whole board.
        this.clearAndCascade(this.allCellKeys(), 500, 'prism', { type: 'rainbow' });
    }

    activateLightning() {
        // Clears one random column.
        const col = Math.floor(Math.random() * this.boardSize);
        const keys = new Set();
        for (let r = 0; r < this.boardSize; r++) keys.add(`${r},${col}`);
        this.clearAndCascade(keys, 300, 'beam', { type: 'lightning', target: [0, col] });
    }

    createUI() {
        if (this.playerUI) {
            for (const field of ['score', 'moves', 'timer', 'level', 'energy', 'stars', 'goal', 'theme']) this[`${field}Text`] = this.playerUI.fields[field];
            this.bankRunButton = this.playerUI.bankButton; this.bankRunLabel = this.playerUI.bankButton;
            this.updateUI(); return;
        }
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
        
        // Stars display
        this.starsText = this.scene.add.text(50, 230, 'Stars: 0', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Shop button
        this.shopBtn = this.scene.add.rectangle(735, 100, 110, 40, 0x4ecdc4);
        this.shopBtn.setInteractive();
        this.shopBtn.on('pointerdown', () => this.showShop());
        
        const shopText = this.scene.add.text(735, 100, 'Shop', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Battle Pass button
        this.battlePassBtn = this.scene.add.rectangle(735, 150, 110, 40, 0xffd700);
        this.battlePassBtn.setInteractive();
        this.battlePassBtn.on('pointerdown', () => this.showBattlePass());
        
        const battlePassText = this.scene.add.text(735, 150, 'Battle Pass', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Loot Box button
        this.lootBoxBtn = this.scene.add.rectangle(735, 200, 110, 40, 0xff6b6b);
        this.lootBoxBtn.setInteractive();
        this.lootBoxBtn.on('pointerdown', () => this.showLootBox());
        
        const lootBoxText = this.scene.add.text(735, 200, 'Loot Box', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Kingdom button
        this.kingdomBtn = this.scene.add.rectangle(735, 300, 110, 40, 0x9b59b6);
        this.kingdomBtn.setInteractive();
        this.kingdomBtn.on('pointerdown', () => this.showKingdom());
        
        this.scene.add.text(735, 300, 'Kingdom', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Account button: opens the sign-in form from the canvas. Sign-in is the DOM login modal.
        this.accountBtn = this.scene.add.rectangle(735, 400, 110, 40, 0x9b59b6);
        this.accountBtn.setInteractive();
        this.accountBtn.on('pointerdown', () => this.openSignIn());

        this.scene.add.text(735, 400, this.getAuthToken() ? 'Account' : 'Sign in', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Pause button
        // Menu button: news, offers, leaderboard, settings, and login are DOM screens. They open here.
        this.menuBtn = this.scene.add.rectangle(735, 450, 110, 40, 0x555555);
        this.menuBtn.setInteractive();
        this.menuBtn.on('pointerdown', () => this.openMenu());
        this.scene.add.text(735, 450, 'Menu', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.pauseBtn = this.scene.add.rectangle(735, 250, 110, 40, 0x666666);
        this.pauseBtn.setInteractive();
        this.pauseBtn.on('pointerdown', () => this.togglePause());
        
        const pauseText = this.scene.add.text(735, 250, 'Pause', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.goalText = this.scene.add.text(50, 270, '', { fontSize: '17px', fill: '#ffe082', wordWrap: { width: 180 } });
        this.themeText = this.scene.add.text(50, 320, '', { fontSize: '15px', fill: '#cfe5ff', wordWrap: { width: 180 } });
        this.bankRunButton = this.scene.add.rectangle(735, 350, 110, 40, 0xe09d54).setInteractive().setVisible(false);
        this.bankRunButton.on('pointerdown', () => { if (this.mode === 'endless' && this.isGameRunning && !this.levelStarting && !this.powerUpPending) this.endGame(); });
        this.bankRunLabel = this.scene.add.text(735, 350, 'Bank Run', { fontSize: '16px', fill: '#ffffff' }).setOrigin(0.5).setVisible(false);
    }

    createPowerUps() {
        if (this.playerUI) {
            for (const type of ['bomb', 'rainbow', 'lightning']) {
                const slot = this.playerUI.powerups.get(type); this[`${type}Btn`] = slot.btn; this[`${type}Text`] = slot.text;
            }
            this.powerButtons = Object.fromEntries(['diamond', 'target', 'star'].map((type) => [type, this.playerUI.powerups.get(type)]));
            return;
        }
        const powerUpY = 530;
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

        // Targeted power-ups: press to arm, then tap a gem.
        const targeted = [
            { type: 'diamond', x: 450, count: 1 },
            { type: 'target', x: 550, count: 1 },
            { type: 'star', x: 650, count: 1 },
        ];
        for (const { type, x, count } of targeted) {
            const btn = this.scene.add.image(x, powerUpY, `powerup_${type}`);
            btn.setDisplaySize(50, 50);
            btn.setInteractive();
            btn.setData('type', type);
            btn.setData('count', count);
            const text = this.scene.add.text(x, powerUpY + 40, String(count), {
                fontSize: '16px',
                fill: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
            this.powerButtons = this.powerButtons || {};
            this.powerButtons[type] = { btn, text };
        }
    }

    setupInput() {
        if (this.playerUI) {
            this.scene.input.on('pointerup', (pointer) => this.endGemGesture(pointer));
            this.scene.input.on('pointerupoutside', (pointer) => this.endGemGesture(pointer, true));
        }
        // Gems bind their own pointerdown handler in createGemSprite().
        this.bombBtn.on('pointerdown', () => this.usePowerUp('bomb'));
        this.rainbowBtn.on('pointerdown', () => this.usePowerUp('rainbow'));
        this.lightningBtn.on('pointerdown', () => this.usePowerUp('lightning'));
        for (const type of ['diamond', 'target', 'star']) {
            this.powerButtons[type].btn.on('pointerdown', () => this.usePowerUp(type));
        }
    }

    setupAnimations() {
        if (this.playerUI || this.animationsReduced()) return;
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

    usePowerUp(powerType) {
        if (!this.canInteractWithBoard()) return;

        if (TARGETED_POWERUPS.includes(powerType)) {
            this.toggleArmedPowerUp(powerType);
            return;
        }

        const slot = this.powerSlot(powerType);
        if (!slot || slot.btn.getData('count') <= 0) return;

        this.spendPowerUp(powerType, () => {
            this.applyInstantPowerUp(powerType);
            this.showPowerUpAnimation(powerType);
        });
    }

    // Maps a power-up type to its button and count label.
    powerSlot(type) {
        const direct = {
            bomb: { btn: this.bombBtn, text: this.bombText },
            rainbow: { btn: this.rainbowBtn, text: this.rainbowText },
            lightning: { btn: this.lightningBtn, text: this.lightningText },
        };
        return direct[type] || (this.powerButtons && this.powerButtons[type]) || null;
    }

    setPowerCount(type, count) {
        const slot = this.powerSlot(type);
        if (!slot) return;
        slot.btn.setData('count', count);
        slot.text.setText(String(count));
    }

    applyInstantPowerUp(type) {
        switch (type) {
            case 'bomb': this.activateBomb(); break;
            case 'rainbow': this.activateRainbow(); break;
            case 'lightning': this.activateLightning(); break;
        }
    }

    getAuthToken() {
        try {
            return (typeof localStorage !== 'undefined' && localStorage.getItem('authToken')) || '';
        } catch (error) {
            return '';
        }
    }

    // Spends one charge, then runs the effect. Signed-in players are checked against
    // the server first, so the effect runs only when the server agrees. Guests spend locally.
    spendPowerUp(type, effect) {
        const token = this.getAuthToken();
        if (!token) {
            this.setPowerCount(type, this.powerSlot(type).btn.getData('count') - 1);
            effect();
            return;
        }

        // A stable per-tap key makes a lost response safe to retry: the server
        // returns the original receipt instead of taking a second charge.
        const boundAttemptId = this.attemptId && this.replayEligible ? this.attemptId : null;
        const useId = boundAttemptId ? globalThis.crypto?.randomUUID?.()
            || `use-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}` : null;
        const epoch = this.boardEpoch;
        const spend = () => this.consumePowerUpOnServer(type, token, useId, boundAttemptId);
        this.powerUpPending = true;
        this.playerUI?.refresh();
        spend().catch((error) => {
            if (!useId) throw error;
            return spend(); // One bounded retry only, with the SAME attempt and use id.
        })
            .then((confirmation) => {
                if (epoch !== this.boardEpoch || (boundAttemptId && boundAttemptId !== this.attemptId)) {
                    return this.syncPowerUpInventory(); // Never apply a stale confirmation to a new board.
                }
                if (confirmation === true || confirmation?.ok) {
                    this.setPowerCount(type, this.powerSlot(type).btn.getData('count') - 1);
                    this.powerReceipt = confirmation?.receiptId ? { type, receiptId: confirmation.receiptId } : null;
                    try { effect(); } finally { this.powerReceipt = null; }
                } else {
                    return this.syncPowerUpInventory();
                }
            })
            .catch((error) => {
                // A lost response may have spent a charge and minted a receipt we did not see.
                // Preserve ordinary rewards without claiming a possibly incomplete replay.
                this.replayEligible = false;
                console.warn('Power-up not spent on server:', error);
                return this.syncPowerUpInventory();
            })
            .finally(() => {
                this.powerUpPending = false;
                this.playerUI?.refresh();
            });
    }

    async consumePowerUpOnServer(type, token, useId = null, requestedAttemptId = this.attemptId) {
        const response = await fetch('/api/account-economy/powerup/use', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ powerupId: type, quantity: 1,
                ...(requestedAttemptId && this.replayEligible ? { attemptId: requestedAttemptId,
                    ...(useId ? { useId } : {}) } : {}) })
        });
        if (!response.ok) {
            // A 5xx/timeout may occur after the charge was saved; recover by retrying
            // the same use id. An explicit 4xx rule refusal is not a charge.
            if (response.status >= 500 || [408, 429].includes(response.status)) throw new Error('powerup_response_uncertain');
            return { ok: false };
        }
        const payload = await response.json();
        if (payload.success !== true || (requestedAttemptId && this.replayEligible && !payload.result?.receiptId)) {
            throw new Error('powerup_receipt_missing');
        }
        return { ok: true, receiptId: payload.result?.receiptId };
    }

    // Loads power-up counts from the player's server inventory. Guests keep local counts.
    async syncPowerUpInventory() {
        const token = this.getAuthToken();
        if (!token) return;
        try {
            const response = await fetch('/api/account-economy/data', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return;
            const body = await response.json();
            const powerups = body?.data?.inventory?.powerups || {};
            for (const type of POWERUP_TYPES) {
                const count = powerups[type]?.count;
                if (Number.isInteger(count) && count >= 0) this.setPowerCount(type, count);
            }
        } catch (error) {
            console.warn('Could not load power-up inventory:', error);
        }
    }

    toggleArmedPowerUp(type) {
        const { btn } = this.powerButtons[type];
        if (this.armedPowerUp === type) {
            this.disarmPowerUp();
            return;
        }
        if (btn.getData('count') <= 0) return;
        this.disarmPowerUp();
        this.setSelectedGem(null);
        this.armedPowerUp = type;
        btn.setAlpha(0.5);
        this.playerUI?.announce({ diamond: 'Color: tap a gem to clear that color.', target: 'Cross: tap a gem to clear it and its neighbours.', star: 'Sweep: tap a gem to clear its row and column.' }[type]);
    }

    disarmPowerUp() {
        if (!this.armedPowerUp) return;
        this.powerButtons[this.armedPowerUp].btn.setAlpha(1);
        this.armedPowerUp = null;
    }

    // Which cells a targeted power-up clears, given the tapped gem. Pure: it
    // reads the board and returns keys, so it can be tested without sprites.
    powerUpKeys(type, r, c) {
        const n = this.boardSize;
        const keys = new Set();
        if (type === 'diamond') {
            const gemType = this.board[r][c];
            for (let rr = 0; rr < n; rr++) {
                for (let cc = 0; cc < n; cc++) {
                    if (this.board[rr][cc] === gemType) keys.add(`${rr},${cc}`);
                }
            }
        } else if (type === 'target') {
            // The tapped gem and its four orthogonal neighbours.
            const offsets = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
            for (const [dr, dc] of offsets) {
                if (this.isInBounds(r + dr, c + dc)) keys.add(`${r + dr},${c + dc}`);
            }
        } else if (type === 'star') {
            // The tapped gem's whole row and column.
            for (let i = 0; i < n; i++) {
                keys.add(`${r},${i}`);
                keys.add(`${i},${c}`);
            }
        }
        return keys;
    }

    fireTargetedPowerUp(gem) {
        const type = this.armedPowerUp;
        const r = gem.getData('row');
        const c = gem.getData('col');
        this.disarmPowerUp();

        this.spendPowerUp(type, () => {
            const keys = this.powerUpKeys(type, r, c);
            const points = { diamond: 400, target: 200, star: 250 }[type];
            this.clearAndCascade(keys, points, type === 'diamond' ? 'prism' : 'beam', { type, target: [r, c] });
            this.showPowerUpAnimation(type);
        });
    }

    showPowerUpAnimation(powerType) {
        if (this.playerUI) {
            this.playerUI.announce(`${powerType} power-up used.${this.powerReceipt?.receiptId ? ' Booster-assisted wins earn rewards but do not rank in competitions.' : ''}`);
            return;
        }
        if (this.animationsReduced()) return;
        const animations = {
            bomb: '💥',
            rainbow: '🌈',
            lightning: '⚡',
            diamond: '💎',
            target: '🎯',
            star: '🌟'
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
        this.scoreText.setText(this.mode === 'endless' && this.playerUI ? `Run: ${(this.score + (this.endlessTotalScore || 0)).toLocaleString()}` : `Score: ${this.score.toLocaleString()}`);
        this.checkAchievements();
        
        // Show score popup
        this.showScorePopup(points);
    }

    showScorePopup(points) {
        if (this.playerUI || this.animationsReduced()) return;
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
            if (this.playerUI || this.animationsReduced()) { this.playerUI?.announce(`Achievement unlocked: ${achievement.name}.`); return; }
            
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

    // Starts the first board on page load, if the player may play.
    // Spends one attempt's energy on the server. Returns true if the attempt may start.
    // Guests have no server economy, so they are not gated.
    async claimAttempt(level = this.level, mode = undefined, location = undefined) {
        if (!this.getAuthToken()) return true;
        if (this.attemptPending) return false;
        this.attemptPending = true;
        try {
            const { ok, data, status } = await this.fetchJson('/api/account-economy/energy/spend', {
                method: 'POST',
                body: JSON.stringify({ level: Math.floor(level), ...(mode ? { mode, location, rulesVersion: globalThis.InfiniteLevels.GENERATOR_VERSION } : {}) }),
                signal: AbortSignal.timeout(10000),
            });
            if (ok && data.success) {
                this.energy = data.result.energy;
                // The attempt id is needed to claim this level's reward when it is won.
                this.attemptId = data.result.attemptId;
                this.attemptLevel = data.result.level;
                this.claimedDefinition = data.result.generatedLevel || null;
                this.claimedLegacyTarget = Number.isSafeInteger(data.result.legacyTarget) ? data.result.legacyTarget : null;
                this.claimedServerTime = data.serverTime || null;
                if (mode && !this.claimedDefinition) {
                    this.showAttemptError('Update the game server to enable generated levels.');
                    return false;
                }
                this.updateEnergyDisplay();
                return true;
            }
            if (status === 429) {
                this.showAttemptError('The server is busy. Wait a moment and try again. No new board was started.');
            } else if (data.error === 'energy_empty') {
                await this.showNoEnergy();
            } else {
                this.showAttemptError(this.ruleMessage(data.error));
            }
            return false;
        } catch (error) {
            this.showAttemptError('Could not reach the server. Check your connection and try again.');
            return false;
        } finally {
            this.attemptPending = false;
        }
    }

    showAttemptError(message) {
        this.openOverlay('Cannot Start');
        this.overlayText(400, 280, message, { size: 20, width: 600 });
        this.overlayButton(400, 380, 240, 60, 0x555555, 'OK', () => { this.closeOverlay(); if (this.playerUI && !this.isGameRunning) this.showTitleOverlay(); });
    }

    // Out of energy: offer a refill at the server price for the energy that is missing.
    async showNoEnergy() {
        this.openOverlay('Out of Energy');
        this.overlayText(400, 200, 'Each attempt uses 1 energy. Energy comes back 1 point every minute.', { size: 20, width: 600 });
        const { ok, data } = await this.fetchJson('/api/account-economy/data');
        const energy = ok && data.success ? data.data.currencies.energy : null;
        const missing = energy ? energy.maxAmount - energy.amount : 0;
        const cost = missing * 10;
        this.overlayButton(400, 300, 380, 60, 0x4ecdc4, `Refill energy (${cost} coins)`, () => this.refillEnergy());
        this.overlayButton(400, 380, 240, 60, 0x555555, 'Close', () => this.closeOverlay());
    }

    // Shows the energy the server holds now (it regenerates while the player is away).
    async syncAccountFromServer() {
        if (!this.getAuthToken()) return;
        try {
            const { ok, data } = await this.fetchJson('/api/account-economy/data');
            if (ok && data.success) {
                this.energy = data.data.currencies.energy.amount;
                this.maxEnergy = data.data.currencies.energy.maxAmount;
                this.stars = data.data.currencies.stars.amount;
                this.updateEnergyDisplay();
                this.updateUI();
            }
        } catch (error) {
            // Keep the last known value. The server still checks every attempt.
        }
    }

    // A win pays out once, for the attempt that was spent. Losses pay nothing.
    async submitLevelWin(stars) {
        const attemptId = this.attemptId;
        this.attemptId = null;
        if (!attemptId || stars <= 0 || !this.getAuthToken()) return;
        try {
            const { ok, data } = await this.fetchJson('/api/account-economy/level/complete', {
                method: 'POST',
                body: JSON.stringify({
                    level: this.attemptLevel,
                    score: Math.min(1000000, Math.max(0, Math.floor(this.score))),
                    ...(this.usesLevelObjectives() ? { objectiveProgress: this.objectiveProgress } : {}),
                    ...(this.replayEligible && this.attemptMoves?.length ? { moves: this.attemptMoves } : {}),
                    ...(this.hintsUsed > 0 ? { hintsUsed: this.hintsUsed } : {}),
                    attemptId,
                }),
            });
            if (ok && data.success) {
                // The server works out the stars. Show its count, not the client's.
                this.stars = data.result.balances.stars;
                this.updateUI();
            } else {
                console.warn('Level reward not granted:', data.error);
            }
        } catch (error) {
            console.warn('Could not reach the server for the level reward.', error);
        }
    }

    // A reported loss or quit closes the paid attempt without a reward. Hint/move counts
    // are untrusted diagnostics; only server replay can verify a win.
    async reportAttemptOutcome(outcome) {
        const attemptId = this.attemptId;
        this.attemptId = null;
        if (!attemptId || !this.getAuthToken()) return;
        try {
            await this.fetchJson('/api/account-economy/attempt/close', {
                method: 'POST', body: JSON.stringify({ attemptId, outcome,
                    movesUsed: this.generatedLevel && Number.isFinite(this.generatedLevel.moves)
                        ? Math.min(1000, Math.max(0, this.generatedLevel.moves - this.moves)) : undefined,
                    hintsUsed: this.hintsUsed || 0 }),
            });
        } catch (error) {
            // A later attempt replaces the outstanding server attempt if this request was lost.
        }
    }

    // Refills energy on the server. The player then starts the attempt themselves.
    async refillEnergy() {
        const { ok, data } = await this.fetchJson('/api/account-economy/energy/refill', { method: 'POST' });
        if (!ok || !data.success) return this.setOverlayStatus(this.ruleMessage(data.error));
        this.energy = data.result.energy;
        this.updateEnergyDisplay();
        this.closeOverlay();
    }

    // Start a numbered level. Applies its target and move limit, then restarts.
    selectLevel(levelNumber) {
        if (globalThis.InfiniteLevels) return this.startProceduralLevel(levelNumber, this.mode);
        const config = levelConfig(levelNumber, this.mode);
        const start = () => {
            this.level = config.level;
            this.targetScore = config.targetScore;
            this.moves = config.moves;
            this.isBossLevel = config.isBoss;
            this.restartGame(true);
        };
        // Guests have no server economy, so the level starts at once. Signed-in players claim an
        // attempt first, so a refused attempt does not change the target under the old board.
        if (!this.getAuthToken()) {
            start();
            return Promise.resolve();
        }
        return this.claimAttempt(config.level).then((ok) => {
            if (ok) start();
        });
    }

    getLevelLocation() {
        if (window.InfiniteLevelLocation) return window.InfiniteLevelLocation.current();
        return { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', holidayThemes: true };
    }

    // Guests may play an offline board; signed-in rewards always require the server's
    // definition from the atomic energy spend. Never send a client-authored target.
    async startProceduralLevel(levelNumber, mode = 'classic') {
        const number = Number(levelNumber);
        if (!Number.isSafeInteger(number) || number < 1 || this.levelStarting || this.powerUpPending) return false;
        this.levelStarting = true;
        this.playerUI?.refresh();
        this.playerUI?.announce('Preparing your level…');
        try {
            await this.rewardSubmission; // Do not overwrite an attempt whose reward is still being saved.
            const location = this.getLevelLocation();
            let definition;
            let serverTime = null;
            if (this.getAuthToken()) {
                if (!(await this.claimAttempt(mode === 'daily' ? 1 : number, mode, location))) return false;
                definition = this.claimedDefinition;
                serverTime = this.claimedServerTime;
            } else {
                this.attemptId = null;
                const query = new URLSearchParams({ ...location, mode, rulesVersion: String(globalThis.InfiniteLevels.GENERATOR_VERSION) }).toString();
                try {
                    const path = mode === 'daily' ? 'daily' : String(number);
                    const result = await this.fetchJson(`/api/levels/${path}?${query}`, { signal: AbortSignal.timeout(10000) });
                    if (!result.ok || !result.data.success) {
                        if (result.status < 500 && ![408, 429].includes(result.status)) {
                            this.showAttemptError('Check your level number and region settings, then try again.');
                            return false;
                        }
                        throw new Error('Level service unavailable');
                    }
                    definition = result.data.level;
                    serverTime = result.data.serverTime;
                } catch {
                    let context;
                    if (window.InfiniteLevelLocation) context = window.InfiniteLevelLocation.offlineContext(location);
                    else {
                        const date = new Date();
                        const month = date.getUTCMonth() + 1;
                        context = { localDate: date.toISOString().slice(0, 10), timeZone: 'UTC', country: null,
                            region: null, hemisphere: 'north', month, holidays: [], offline: true,
                            season: ['winter', 'spring', 'summer', 'autumn'][Math.floor((month % 12) / 3)] };
                    }
                    definition = globalThis.InfiniteLevels.generateLevel(number, context, mode);
                }
            }
            this.endlessTotalScore = 0;
            this.applyGeneratedDefinition(definition, serverTime);
            await this.startGame();
            return true;
        } catch (error) {
            console.warn('Could not start a generated level:', error);
            this.showAttemptError('Could not generate a board. Check your connection and try again.');
            return false;
        } finally {
            this.levelStarting = false;
            this.playerUI?.refresh();
        }
    }

    applyGeneratedDefinition(definition, serverTime = null) {
        this.feedbackEndPending = false;
        this.feedbackResultStars = null;
        this.matchFeedback?.finish('new-definition', false);
        this.soundEffects?.stop();
        if (this.timerInterval) clearInterval(this.timerInterval);
        for (const row of this.gemSprites || []) {
            for (const sprite of row) {
                if (!sprite) continue;
                this.scene.tweens.killTweensOf(sprite);
                if (typeof sprite.destroy === 'function') sprite.destroy();
            }
        }
        this.closeOverlay();
        this.inputLockedUntil = 0;
        this.generatedLevel = definition;
        this.attemptMoves = [];
        this.hintsUsed = 0;
        this.replayEligible = definition.generatorVersion >= 4 && ['classic', 'daily'].includes(definition.mode);
        window.InfiniteLevelLocation?.rememberContext(definition.context, this.getLevelLocation(), serverTime);
        this.level = definition.level;
        this.mode = definition.mode;
        if (this.mode === 'classic' || this.mode === 'timed') this.campaignLevel = Math.max(this.campaignLevel || 1, this.level);
        this.boardSize = definition.boardSize;
        this.gemTypes = definition.gemTypes.slice();
        this.levelRng = { state: definition.refillState };
        this.score = 0;
        this.objectiveProgress = definition.generatorVersion >= 4 ? globalThis.InfiniteLevels.initialObjectiveProgress(definition) : null;
        this.moves = definition.moves;
        this.targetScore = definition.targetScore;
        this.timeLimit = definition.timeLimit;
        this.time = definition.timeLimit;
        this.isBossLevel = definition.isBoss;
        this.isPaused = false;
        this.titleShowing = false;
        this.armedPowerUp = null;
        this.createGameBoard();
        this.fitBoardViewport();
        this.scene.cameras?.main?.setBackgroundColor(definition.theme.background);
        if (!this.playerUI) this.themeText?.setColor?.(definition.theme.accent);
        this.playerUI?.shell.style.setProperty('--match-level-background', definition.theme.background);
        this.playerUI?.announce?.(this.usesLevelObjectives() ? definition.objectives.some((goal) => goal.type === 'clear-shields')
            ? 'Clear each numbered shield with the shown number of gem clears, including specials. Meet every goal.'
            : definition.objectives.some((goal) => goal.type === 'collect')
                ? 'Clear the shown colors. Meet every goal.' : 'Reach the displayed score goal.' : '');
        this.updateUI();
    }

    startDaily() {
        if (globalThis.InfiniteLevels) return this.startProceduralLevel(1, 'daily');
        const config = dailyChallengeLevel(new Date().toISOString().slice(0, 10));
        this.setMode('classic');
        return this.selectLevel(config.level);
    }

    // One paid attempt, unlimited generated stages. Each new board is certified on
    // this device using the same algorithm. Time/weather update only at stage boundaries.
    advanceEndlessStage() {
        const total = (this.endlessTotalScore || 0) + this.score;
        const startedAt = this.runStartedAt;
        const nextNumber = this.level + 1;
        if (!Number.isSafeInteger(nextNumber)) { this.endGame(); return; }
        const context = window.InfiniteLevelLocation?.contextForNewStage(this.getLevelLocation()) || this.generatedLevel.context;
        const next = globalThis.InfiniteLevels.generateLevel(nextNumber, context, 'endless', this.generatedLevel.generatorVersion || 2);
        this.applyGeneratedDefinition(next);
        this.endlessTotalScore = total;
        this.runStartedAt = startedAt;
        this.isGameRunning = true;
        this.updateUI();
        this.playSound('stage');
        this.trackEvent('endless_stage_started', { stage: this.level, totalScore: total });
    }

    // The result of this level, as the server expects it for difficulty tuning.
    levelResultPayload(stars) {
        const target = this.targetScore || 1000;
        return {
            level: Math.floor(this.level),
            outcome: stars > 0 ? 'won' : 'lost',
            score: Math.max(0, Math.floor(this.score)),
            targetScore: Math.max(1, Math.floor(target)),
            movesLeft: Math.max(0, Math.floor(this.moves)),
            durationSeconds: this.runSeconds(),
            isBoss: !!this.isBossLevel,
        };
    }

    // Sends the level result for tuning. Signed-in players only. The server checks the
    // report and recomputes the stars; a failed request never affects play.
    reportLevelResult(stars) {
        // Do not mix date/region variants into the legacy per-number tuning pool.
        if (this.generatedLevel) return;
        const token = this.getAuthToken();
        if (!token || typeof fetch !== 'function') return;
        fetch('/api/level-results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(this.levelResultPayload(stars))
        }).catch(() => {});
    }

    // Stars are relative to the level target: 1x, 1.5x, 2x.
    starsFor(score) {
        if (this.usesLevelObjectives()) return globalThis.InfiniteLevels.objectiveStars(this.generatedLevel, score, this.objectiveProgress);
        const target = this.targetScore || 1000;
        if (score >= target * 2) return 3;
        if (score >= target * 1.5) return 2;
        if (score >= target) return 1;
        return 0;
    }

    async startGame() {
        console.log('🚀 Starting Phaser 3 game...');
        
        // Initialize platform and load user data
        await this.initializePlatform();
        await this.syncPowerUpInventory();
        
        this.isGameRunning = true;
        this.hintsUsed = 0;
        this.runStartedAt = Date.now();
        this.startTimer();
        this.updateUI();
        this.playSound('stage');
        
        // Show tutorial for first-time players
        if (!this.tutorialShown) {
            if (this.playerUI) this.showTutorial(); // Never overwrite a player's later hint with a delayed intro.
            else setTimeout(() => this.showTutorial(), 1000);
        }
        
        // Track game start
        this.trackEvent('game_started', {
            level: this.level,
            energy: this.energy,
            platform: this.platformInfo?.name || 'unknown'
        });
    }

    // Generated classic/daily use moves without a clock; timed uses 60 seconds.
    // Generated endless advances through finite stage goals without a clock or move limit.
    setMode(mode) {
        this.mode = ['classic', 'timed', 'daily', 'endless'].includes(mode) ? mode : 'classic';
    }

    startEndless() {
        this.setMode('endless');
        return this.selectLevel(1);
    }

    // Seconds the run has lasted: counted down on the clock, or measured from the start.
    runSeconds() {
        if (this.timeLimit > 0 || (this.timeLimit === undefined && this.mode !== 'endless')) {
            return Math.min(3600, Math.max(0, (this.timeLimit || 60) - this.time));
        }
        return Math.min(3600, Math.max(0, Math.floor((Date.now() - (this.runStartedAt || Date.now())) / 1000)));
    }

    // An endless run has no target, so it is never a level win. The server pays for the score.
    async finishEndless() {
        const score = Math.max(0, Math.floor(this.score + (this.endlessTotalScore || 0)));
        this.analytics.gamesPlayed++;
        this.analytics.totalScore += score;
        this.trackEvent('endless_ended', { score, duration: this.runSeconds() });
        this.playSound('bank');
        const payment = this.submitEndlessRun(score);
        this.rewardSubmission = payment;
        const result = await payment;
        this.saveUserData();
        let subtitle = 'Sign in to be paid for endless runs.';
        if (result) subtitle = `+${result.reward.coins} coins, +${result.reward.xp} XP (best ${result.endlessBest})`;
        this.showEndGameScreen(0, { title: 'Run Over', subtitle });
    }

    async submitEndlessRun(score) {
        const attemptId = this.attemptId;
        this.attemptId = null;
        if (!attemptId || !this.getAuthToken()) return null;
        try {
            const { ok, data } = await this.fetchJson('/api/account-economy/endless/complete', {
                method: 'POST',
                body: JSON.stringify({ score: Math.min(1000000, score), attemptId }),
            });
            if (ok && data.success) {
                if (typeof this.syncAccountFromServer === 'function') this.syncAccountFromServer();
                this.updateUI();
                return data.result;
            }
            console.warn('Endless run not paid:', data.error);
        } catch (error) {
            console.warn('Could not reach the server for the endless run.', error);
        }
        return null;
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.timeLimit === 0 || this.mode === 'endless') return;
        this.timerInterval = setInterval(() => {
            if (this.levelStarting || this.isPaused) return;
            this.time--;
            this.timerText.setText(`Time: ${this.time}`);
            
            if (this.time <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    updateUI() {
        this.scoreText.setText(this.mode === 'endless' && this.playerUI ? `Run: ${(this.score + (this.endlessTotalScore || 0)).toLocaleString()}` : `Score: ${this.score.toLocaleString()}`);
        this.movesText.setText(['classic', 'daily'].includes(this.mode) ? `Moves: ${this.moves}` : 'Moves: ∞');
        this.timerText.setText(this.timeLimit === 0 || this.mode === 'endless' ? 'Time: ∞' : `Time: ${this.time}`);
        this.levelText.setText(this.mode === 'daily' ? 'Daily Challenge' : `${this.mode === 'endless' ? 'Stage' : 'Level'}: ${this.level}`);
        if (this.goalText && (!this.usesLevelObjectives() || !this.playerUI)) this.goalText.setText(this.usesLevelObjectives()
            ? globalThis.InfiniteLevels.objectiveSummary(this.generatedLevel, this.score, this.objectiveProgress)
            : `Goal: ${this.targetScore.toLocaleString()} points` + (this.mode === 'endless' ? `\nRun: ${(this.score + (this.endlessTotalScore || 0)).toLocaleString()}` : ''));
        if (this.themeText) this.themeText.setText(this.generatedLevel ? `${this.generatedLevel.theme.name}\n${this.generatedLevel.context.localDate}\n${this.generatedLevel.theme.environmentLabel || ''}${this.generatedLevel.context.offline ? '\nOffline guest level' : ''}` : '');
        if (this.bankRunButton) this.bankRunButton.setVisible(this.mode === 'endless');
        if (this.bankRunLabel) this.bankRunLabel.setVisible(this.mode === 'endless');
        this.energyText.setText(`Energy: ${this.energy}/${this.maxEnergy}`);
        this.starsText.setText(this.getAuthToken() ? `Stars: ${this.stars}` : 'Guest · no paid rewards');
        this.playerUI?.refresh();
    }

    togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    showTutorial() {
        if (this.playerUI) { this.playerUI.announce(this.usesLevelObjectives() ? 'Complete every goal above. Match 3; 4+ earns specials. Tap specials or swipe them together. Explore has guides; hints are free.' : this.usesEarnedSpecials() ? 'Match 3 to score, 4+ to earn free special gems. Tap a special to activate; swipe specials together to combine. Explore has the guide. Hints are free.' : 'Match three or more. Tap two adjacent gems or swipe. Need help? The Hint button is free.'); this.tutorialShown = true; return; }
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
        if (this.isPaused || !this.settings.sfx) return false;
        try { return this.soundEffects?.play(soundType) || false; } catch { return false; }
    }

    getSoundStatus() {
        return this.soundEffects?.status() || { state: 'unavailable', supported: false, enabled: false, volume: 0.55 };
    }

    setSoundEffects(enabled, event) {
        this.settings.sfx = enabled === true && this.getSoundStatus().supported;
        this.settings.soundChoiceVersion = window.InfiniteSoundEffects?.SETTINGS_VERSION || 1;
        this.soundEffects?.configure(this.settings);
        this.saveUserData(); this.playerUI?.refresh();
        this.playerUI?.announce(this.getSoundStatus().supported ? this.settings.sfx ? 'Sound on. M mutes it on the board.' : 'Sound off.' : 'Sound is unavailable in this browser. Play stays silent.');
        if (this.settings.sfx) this.previewSound(event);
        return this.settings.sfx;
    }

    setSoundVolume(volume, event) {
        if (!Number.isFinite(volume)) return;
        this.settings.soundVolume = Math.max(0, Math.min(1, volume));
        this.soundEffects?.configure(this.settings);
        this.saveUserData(); this.playerUI?.refresh();
        this.soundEffects?.unlock(event);
    }

    async previewSound(event) {
        const accepted = await this.soundEffects?.unlock(event);
        const played = accepted && this.soundEffects.play('test');
        this.playerUI?.refresh();
        return !!played;
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
                // An old saved score/level must not overwrite a freshly generated attempt.
                // Energy is not restored from localStorage: signed-in energy comes from the server.
                this.achievements = data.achievements || this.achievements;
                this.settings = { ...this.settings, ...data.settings, ...(window.InfiniteSoundEffects?.normaliseSettings(data.settings) || { sfx: false, soundChoiceVersion: 1, soundVolume: 0.55 }) };
                console.log('✅ User data loaded');
            }
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
        }
        this.soundEffects?.configure(this.settings);
    }

    async saveUserData() {
        try {
            const data = {
                score: this.score,
                level: this.campaignLevel || this.level,
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

    // Energy System. Energy is spent only on the server (claimAttempt). There is no local spend.
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

    // The battle pass lives in the DOM community screen, so it opens like the other DOM menus.
    showBattlePass() {
        this.openMenu();
        this.trackEvent('battlepass_opened');
        if (window.ui && typeof window.ui.showCommunity === 'function') window.ui.showCommunity('battlepass');
    }

    showWeeklyEvent() {
        this.openMenu();
        this.trackEvent('weekly_event_opened');
        if (window.ui && typeof window.ui.showCommunity === 'function') window.ui.showCommunity('events');
    }

    showLootBox() {
        this.pauseGame();
        this.currentScreen = 'lootbox';
        this.trackEvent('lootbox_opened');
        // Show loot box UI
        this.createLootBoxUI();
    }

    // Shop UI
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
    // ---- Server-backed shop, loot boxes and kingdom ---------------------------------
    // Every price and reward is decided on the server. The client only shows the result.
    // Each screen is one container, so closing it removes all of its pieces.

    openOverlay(title) {
        if (this.matchFeedback?.isActive()) this.pauseGame();
        this.closeOverlay();
        if (this.playerUI) {
            this.activeOverlay = this.playerUI.openOverlay(title); this.overlayStatus = this.playerUI.status; return this.activeOverlay;
        }
        const background = this.scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.85).setInteractive();
        const heading = this.scene.add.text(400, 40, title, { fontSize: '32px', fill: '#ffffff', fontFamily: 'Arial' }).setOrigin(0.5);
        this.activeOverlay = this.scene.add.container(0, 0, [background, heading]);
        this.activeOverlay.setDepth(1000);
        this.overlayStatus = this.overlayText(400, 540, '', { size: 16, color: '#ffd700', width: 700 });
        return this.activeOverlay;
    }

    overlayText(x, y, label, { size = 16, color = '#ffffff', origin = 0.5, width = null } = {}) {
        if (this.playerUI) return this.playerUI.overlayText(label);
        const style = { fontSize: `${size}px`, fill: color, fontFamily: 'Arial', align: 'center' };
        if (width) style.wordWrap = { width };
        const text = this.scene.add.text(x, y, label, style).setOrigin(origin, 0.5);
        this.activeOverlay.add(text);
        return text;
    }

    overlayButton(x, y, width, height, color, label, onClick) {
        if (this.playerUI) return this.playerUI.overlayButton(label, onClick);
        const box = this.scene.add.rectangle(x, y, width, height, color).setInteractive();
        box.on('pointerdown', onClick);
        this.activeOverlay.add(box);
        box.labelText = this.overlayText(x, y, label);
        return box;
    }

    setOverlayStatus(message) {
        if (this.overlayStatus) this.overlayStatus.setText(message);
    }

    closeOverlay() {
        if (this.playerUI) { this.playerUI.closeOverlay(); this.activeOverlay = null; this.overlayStatus = null; return; }
        if (this.activeOverlay) {
            this.activeOverlay.destroy();
            this.activeOverlay = null;
            this.overlayStatus = null;
        }
    }

    async fetchJson(url, options = {}) {
        const token = this.getAuthToken();
        const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        if (token) headers.Authorization = `Bearer ${token}`;
        const response = await fetch(url, { ...options, headers });
        const data = await response.json().catch(() => ({}));
        return { ok: response.ok, status: response.status, data };
    }

    // Plain-language messages for the error codes the server returns.
    ruleMessage(code) {
        const messages = {
            insufficient_coins: 'Not enough coins yet. Win levels to earn more.',
            unknown_lootbox: 'That loot box is not available.',
            unknown_product: 'That pack is not available.',
            checkout_not_configured: 'Purchases are not available right now.',
            checkout_failed: 'Could not start checkout. Try again.',
            stars_required: 'Earn more stars first.',
            room_max_level: 'This room is already at its highest level.',
            unknown_room: 'That room does not exist.',
            energy_empty: 'Out of energy.',
            energy_full: 'Energy is already full.',
            decor_limit: 'You already own the most of this decoration.',
            decor_not_owned: 'Buy this decoration first.',
            room_occupied: 'That room already has a decoration.',
            room_level_too_low: 'That room needs a higher level for this decoration.',
            room_empty: 'Nothing is in that room.',
            unknown_decor: 'That decoration is not available.',
        };
        return messages[code] || 'Something went wrong. Try again.';
    }

    createShopUI() {
        this.openOverlay('Shop');
        this.shopCoinsText = this.overlayText(400, 100, 'Sign in to buy coins', { size: 20, color: '#ffd700' });
        // The button shows the coins. The price is read from the server (GET /api/live-ops/offers),
        // so it always matches what the server charges, including any active deal.
        const packs = [
            { productId: 'coins_small', label: '500 coins', color: 0x4ecdc4, x: 200 },
            { productId: 'coins_medium', label: '3,000 coins', color: 0xffd700, x: 400 },
            { productId: 'coins_large', label: '8,000 coins', color: 0xff6b6b, x: 600 },
        ];
        packs.forEach((pack) => {
            this.overlayButton(pack.x, 240, 150, 100, pack.color, pack.label, () => this.buyCoinPack(pack.productId));
        });
        this.overlayButton(400, 500, 100, 50, 0x666666, 'Close', () => this.closeShop());
        this.refreshCoinBalance(this.shopCoinsText);
        this.loadShopPrices(packs);
    }

    async loadShopPrices(packs) {
        const overlay = this.activeOverlay;
        try {
            const res = await fetch('/api/live-ops/offers');
            const data = await res.json();
            if (!data.success || this.activeOverlay !== overlay || !this.shopCoinsText || !this.shopCoinsText.active) return;
            for (const pack of packs) {
                const offer = (data.coinPacks || []).find((p) => p.productId === pack.productId);
                if (!offer) continue;
                const price = `$${(offer.priceCents / 100).toFixed(2)}${offer.deal ? ' (deal)' : ''}`;
                this.overlayText(pack.x, 310, price, { size: 18, color: '#ffd700' });
            }
        } catch (error) {
            console.warn('Could not load shop prices:', error);
        }
    }

    async refreshCoinBalance(textObject) {
        if (!this.getAuthToken()) return;
        try {
            const { ok, data } = await this.fetchJson('/api/account-economy/data');
            if (ok && textObject && textObject.active) {
                textObject.setText(`Coins: ${data.data.currencies.coins.amount}`);
            }
        } catch (error) {
            console.warn('Could not load coin balance:', error);
        }
    }

    // Starts a hosted Stripe Checkout for one coin pack. Coins are credited by the server after payment.
    async buyCoinPack(productId) {
        if (!this.getAuthToken()) return this.setOverlayStatus('Sign in to buy coins.');
        this.setOverlayStatus('Opening checkout...');
        try {
            const { ok, data } = await this.fetchJson('/api/stripe/checkout-session', {
                method: 'POST',
                body: JSON.stringify({ productId }),
            });
            if (!ok || !data.url) return this.setOverlayStatus(this.ruleMessage(data.error));
            this.trackEvent('checkout_started', { productId });
            window.location.href = data.url;
        } catch (error) {
            this.setOverlayStatus('Could not reach the store. Try again.');
        }
    }

    closeShop() {
        this.closeOverlay();
        this.currentScreen = 'game';
        this.resumeAfterOverlay();
    }

    createLootBoxUI() {
        this.openOverlay('Loot Box');
        this.lootCoinsText = this.overlayText(400, 100, 'Sign in to open loot boxes', { size: 20, color: '#ffd700' });
        const boxes = [
            { type: 'common', label: 'Common\n100 coins', color: 0x4ecdc4, x: 200 },
            { type: 'rare', label: 'Rare\n500 coins', color: 0xffd700, x: 400 },
            { type: 'epic', label: 'Epic\n1000 coins', color: 0xff6b6b, x: 600 },
        ];
        boxes.forEach((box) => {
            this.overlayButton(box.x, 240, 150, 100, box.color, box.label, () => this.openLootBox(box.type));
        });
        this.overlayButton(400, 500, 100, 50, 0x666666, 'Close', () => this.closeLootBox());
        this.refreshCoinBalance(this.lootCoinsText);
    }

    // Buys one loot box. The server charges coins, rolls the reward, and grants it.
    async openLootBox(type) {
        if (!this.getAuthToken()) return this.setOverlayStatus('Sign in to open loot boxes.');
        if (this.lootBoxPending) return;
        this.lootBoxPending = true;
        this.setOverlayStatus('Opening...');
        try {
            const { ok, data } = await this.fetchJson('/api/account-economy/lootbox/open', {
                method: 'POST',
                body: JSON.stringify({ type }),
            });
            if (!ok || !data.success) return this.setOverlayStatus(this.ruleMessage(data.error));
            const { reward, coins, energy } = data.result;
            if (this.lootCoinsText && this.lootCoinsText.active) this.lootCoinsText.setText(`Coins: ${coins}`);
            // The server has already granted the reward, so take its energy total rather than adding again.
            if (typeof energy === 'number') {
                this.energy = energy;
                this.updateEnergyDisplay();
            }
            this.applyLootReward(reward);
            this.trackEvent('lootbox_opened', { type, reward: reward.id });
            this.setOverlayStatus(`You got: ${this.describeReward(reward)}`);
        } catch (error) {
            this.setOverlayStatus('Could not reach the server. Try again.');
        } finally {
            this.lootBoxPending = false;
        }
    }

    describeReward(reward) {
        if (reward.type === 'currency') return `${reward.amount} ${reward.currencyId}`;
        return `${reward.amount} x ${reward.itemId}`;
    }

    // Puts a server-granted reward into the on-screen counters the player sees.
    applyLootReward(reward) {
        // The server granted it. Re-read the balance rather than adding it here.
        if (reward.type === 'currency' && reward.currencyId === 'stars') {
            this.syncAccountFromServer();
        }
    }

    closeLootBox() {
        this.closeOverlay();
        this.currentScreen = 'game';
        this.resumeAfterOverlay();
    }

    showKingdom() {
        this.pauseGame();
        this.currentScreen = 'kingdom';
        this.trackEvent('kingdom_opened');
        this.createKingdomUI();
    }

    createKingdomUI() {
        this.openOverlay('Kingdom');
        this.kingdomRowObjects = [];
        if (this.playerUI?.renderKingdomScene) { this.renderKingdom(); return; }
        this.kingdomCoinsText = this.overlayText(400, 80, '', { size: 20, color: '#ffd700' });
        this.overlayButton(250, 500, 100, 50, 0x9b59b6, 'Decor', () => this.openDecor());
        this.overlayButton(400, 500, 100, 50, 0x666666, 'Close', () => this.closeKingdom());
        this.renderKingdom();
    }

    // The decoration screen is its own overlay. It is rebuilt after each action, so it always shows
    // the server's state. Back returns to the Kingdom overlay.
    openDecor(message = '') {
        this.openOverlay('Decorate');
        this.decorRowObjects = [];
        this.decorCoinsText = this.overlayText(400, 80, '', { size: 20, color: '#ffd700' });
        this.overlayText(400, 110, 'Buy a decoration, select it, then place it in a room. Each room holds one.', { size: 14 });
        this.overlayButton(400, 500, 100, 40, 0x666666, 'Back', () => this.createKingdomUI());
        this.setOverlayStatus(message || 'Loading...');
        this.loadDecor();
    }

    async loadDecor() {
        const overlay = this.activeOverlay;
        if (!this.getAuthToken()) return this.setOverlayStatus('Sign in to decorate your kingdom.');
        try {
            const { ok, data } = await this.fetchJson('/api/kingdom');
            if (this.activeOverlay !== overlay) return;
            if (!ok || !data.success) return this.setOverlayStatus('Could not load your kingdom.');
            if (this.activeOverlay !== overlay || !this.activeOverlay || !this.decorCoinsText || !this.decorCoinsText.active) return;
            const { decor, kingdom } = data;
            this.decorCoinsText.setText(`Coins: ${data.coins}`);
            const selected = this.decorSelected && decor.catalog.some((item) => item.id === this.decorSelected)
                ? this.decorSelected : null;
            this.decorSelected = selected;

            decor.catalog.forEach((item, index) => {
                const y = 145 + index * 31;
                const owned = decor.owned[item.id] || 0;
                this.overlayText(60, y, `${item.name} · ${item.priceCoins} coins · room lvl ${item.requiresRoomLevel}+ · owned ${owned}/${decor.maxOwned}`, { origin: 0, size: 13 });
                this.overlayButton(600, y, 90, 26, 0xffd700, 'Buy', () => this.decorAction('/api/kingdom/decor/buy', { decorId: item.id }, `Bought ${item.name}.`));
                this.overlayButton(710, y, 90, 26, selected === item.id ? 0x4ecdc4 : 0x9b59b6, selected === item.id ? 'Selected' : 'Select', () => {
                    this.decorSelected = item.id;
                    this.openDecor();
                });
            });

            this.overlayText(60, 330, 'Rooms', { origin: 0, size: 16, color: '#4ecdc4' });
            kingdom.rooms.forEach((room, index) => {
                const y = 355 + index * 24;
                const placedId = decor.placed[room.id];
                const placedItem = placedId ? decor.catalog.find((item) => item.id === placedId) : null;
                this.overlayText(60, y, `${room.name} · lvl ${room.level} · ${placedItem ? placedItem.name : 'empty'}`, { origin: 0, size: 14 });
                if (placedItem) {
                    this.overlayButton(710, y, 90, 22, 0xe74c3c, 'Remove', () => this.decorAction('/api/kingdom/decor/remove', { roomId: room.id }, `Removed ${placedItem.name}.`));
                } else if (selected) {
                    const item = decor.catalog.find((c) => c.id === selected);
                    this.overlayButton(710, y, 90, 22, 0x4ecdc4, 'Place', () => {
                        this.decorSelected = null;
                        this.decorAction('/api/kingdom/decor/place', { roomId: room.id, decorId: item.id }, `${item.name} placed in ${room.name}.`);
                    });
                } else {
                    this.overlayButton(710, y, 90, 22, 0x666666, 'Pick one', () => this.setOverlayStatus('Select a decoration first.'));
                }
            });
        } catch (error) {
            if (this.activeOverlay === overlay) this.setOverlayStatus('Could not load your kingdom.');
        }
    }

    // One decoration action. The screen is rebuilt with the server's answer and a message.
    async decorAction(url, body, okMessage) {
        if (this.decorPending) return;
        const overlay = this.activeOverlay;
        this.decorPending = true;
        this.setOverlayStatus('Working...');
        try {
            const { ok, data } = await this.fetchJson(url, { method: 'POST', body: JSON.stringify(body) });
            this.decorPending = false;
            if (this.activeOverlay === overlay) this.openDecor(ok && data.success ? okMessage : this.ruleMessage(data.error));
        } catch (error) {
            if (this.activeOverlay === overlay) this.setOverlayStatus('Could not reach the server. Try again.');
        } finally {
            this.decorPending = false;
        }
    }

    kingdomSceneCallbacks(focusChoice = null) {
        return {
            close: () => this.closeKingdom(), signIn: () => this.openSignIn(),
            renovate: () => this.renovateRoom('throne'),
            choose: (decorId) => this.chooseKingdomDecor(decorId),
            more: () => this.openDecor(), focusChoice,
        };
    }

    async chooseKingdomDecor(decorId) {
        if (this.kingdomPending || !this.getAuthToken()) return;
        const overlay = this.activeOverlay;
        this.kingdomPending = true;
        this.setOverlayStatus('Preparing your chosen look...');
        try {
            const { ok, data } = await this.fetchJson('/api/kingdom/decor/choose', {
                method: 'POST', body: JSON.stringify({ roomId: 'throne', decorId }),
            });
            if (this.activeOverlay !== overlay) return;
            if (!ok || !data.success) return this.setOverlayStatus(this.ruleMessage(data.error));
            this.kingdomFocusChoice = decorId;
            await this.renderKingdom();
            if (this.activeOverlay === overlay) {
                this.setOverlayStatus(data.result.unchanged ? 'That look is already on display.'
                    : `Your chosen look brightens the hall.${data.result.costCoins ? ` ${data.result.costCoins} coins spent.` : ' Used an owned decoration.'}`);
                this.trackEvent('kingdom_look_chosen', { decorId, bought: data.result.buy });
            }
        } catch (error) {
            if (this.activeOverlay === overlay) this.setOverlayStatus('Could not reach the server. Check your room before retrying.');
        } finally {
            this.kingdomPending = false;
        }
    }

    async renderKingdom() {
        const overlay = this.activeOverlay;
        destroyOverlayObjects(this.kingdomRowObjects);
        this.kingdomRowObjects = [];
        if (!this.getAuthToken()) {
            if (this.playerUI?.renderKingdomScene) this.playerUI.renderKingdomScene({ guest: true }, this.kingdomSceneCallbacks());
            return this.setOverlayStatus('Sign in to save room upgrades. Guest puzzles are always playable.');
        }
        try {
            const { ok, data } = await this.fetchJson('/api/kingdom');
            if (this.activeOverlay !== overlay) return;
            if (!ok || !data.success) return this.setOverlayStatus('Could not load your kingdom.');
            if (!this.activeOverlay || this.activeOverlay !== overlay) return;
            if (this.playerUI?.renderKingdomScene) {
                this.playerUI.renderKingdomScene(data, this.kingdomSceneCallbacks(this.kingdomFocusChoice));
                this.kingdomFocusChoice = null;
                return;
            }
            const bonus = Math.round((data.coinBonus || 0) * 100);
            this.kingdomCoinsText.setText(`Coins: ${data.coins}${bonus > 0 ? `   Room bonus +${bonus}% coins` : ''}`);
            data.kingdom.rooms.forEach((room, index) => {
                const y = 140 + index * 55;
                let detail = `${room.name}   Level ${room.level}/${room.maxLevel}`;
                if (room.next) {
                    detail += `   next: ${room.next.costCoins} coins`;
                    if (room.next.starsRequired) detail += `, ${room.next.starsRequired} stars`;
                }
                this.kingdomRowObjects.push(this.overlayText(60, y, detail, { origin: 0 }));
                if (room.canRenovate) {
                    this.kingdomRowObjects.push(
                        this.overlayButton(680, y, 130, 36, 0x9b59b6, 'Upgrade', () => this.renovateRoom(room.id)),
                    );
                } else {
                    const reasons = {
                        room_max_level: 'Maxed',
                        stars_required: 'Needs stars',
                        insufficient_coins: 'Needs coins',
                    };
                    this.kingdomRowObjects.push(this.overlayText(680, y, reasons[room.blockedBy] || 'Locked'));
                }
            });
        } catch (error) {
            if (this.activeOverlay === overlay) this.setOverlayStatus('Could not load your kingdom.');
        }
    }

    async renovateRoom(roomId) {
        if (this.kingdomPending) return;
        const overlay = this.activeOverlay;
        this.kingdomPending = true;
        this.setOverlayStatus('Renovating...');
        try {
            const { ok, data } = await this.fetchJson('/api/kingdom/renovate', {
                method: 'POST',
                body: JSON.stringify({ roomId }),
            });
            if (this.activeOverlay !== overlay) return;
            if (!ok || !data.success) {
                this.setOverlayStatus(this.ruleMessage(data.error));
            } else {
                const { result } = data;
                this.setOverlayStatus(`Level ${result.level} reached.${result.milestone ? ' Milestone reward granted.' : ''}`);
                this.trackEvent('kingdom_renovated', { roomId, level: result.level });
            }
            await this.renderKingdom();
        } catch (error) {
            if (this.activeOverlay === overlay) this.setOverlayStatus('Could not reach the server. Try again.');
        } finally {
            this.kingdomPending = false;
        }
    }

    closeKingdom() {
        this.closeOverlay();
        this.currentScreen = 'game';
        this.resumeAfterOverlay();
    }

    // Integration with existing game system
    setGameState(state) {
        this.score = state.score || 0;
        this.moves = state.moves || 30;
        this.time = state.time || 60;
        this.level = state.level || 3;
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
        this.soundEffects?.interrupt();
        this.isPaused = true;
        this.matchFeedback?.finish('pause');
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.gestureStart = null;
        this.playerUI?.refresh();
        this.trackEvent('game_paused');
    }

    resumeGame() {
        this.isPaused = false;
        if (this.feedbackEndPending) this.checkEndConditions();
        if (this.isGameRunning) {
            this.startTimer();
        }
        this.playerUI?.refresh();
        this.trackEvent('game_resumed');
    }

    resumeAfterOverlay() {
        const resume = this.playerOverlayResume !== false;
        delete this.playerOverlayResume;
        if (resume) this.resumeGame();
        else this.playerUI?.refresh();
        if (this.playerUI?.focusBoard) this.playerUI.focusBoard();
        else this.playerUI?.surface.focus({ preventScroll: true });
    }

    // End game with all features
    endGame(deferResultScreen = false) {
        if (!this.isGameRunning) return;
        this.isGameRunning = false;
        this.feedbackEndPending = false;
        this.feedbackResultStars = null;
        const presenting = deferResultScreen && this.mode !== 'endless' && this.matchFeedback?.isActive();
        if (!presenting) this.matchFeedback?.finish('result', false);
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        if (this.mode === 'endless') {
            this.finishEndless();
            return;
        }

        // Calculate stars based on score
        let stars = 0;
        stars = this.starsFor(this.score);
        this.playSound(stars > 0 ? 'win' : 'loss');
        
        this.reportLevelResult(stars);
        this.rewardSubmission = stars > 0 || !this.getAuthToken() || !this.attemptId
            ? this.submitLevelWin(stars) : this.reportAttemptOutcome('lost');
        if (stars > 0 && this.mode !== 'daily') this.campaignLevel = Math.max(this.campaignLevel || 1, this.level + 1);

        // Update analytics
        this.analytics.gamesPlayed++;
        this.analytics.totalScore += this.score;
        this.analytics.totalTime += this.runSeconds();
        
        // Track game end
        this.trackEvent('game_ended', {
            score: this.score,
            stars: stars,
            level: this.level,
            duration: this.runSeconds()
        });
        
        // Save user data
        this.saveUserData();
        
        console.log(`🎯 Game ended! Score: ${this.score}, Stars: ${stars}`);
        
        // Financial/result operations above are independent of animation timing.
        if (presenting) { this.feedbackResultStars = stars; this.playerUI?.refresh(); }
        else this.showEndGameScreen(stars);
    }

    showEndGameScreen(stars, { title = null, subtitle = null } = {}) {
        this.openOverlay(title || (stars > 0 ? 'Level Complete!' : 'Level Failed'));
        const total = this.mode === 'endless' ? this.score + (this.endlessTotalScore || 0) : this.score;
        this.overlayText(400, 170, `Score: ${total.toLocaleString()}`, { size: 26 });
        this.overlayText(400, 245, subtitle || `Stars: ${stars}/3`, { size: 20, width: 650 });
        if (this.usesLevelObjectives()) this.overlayText(400, 292, globalThis.InfiniteLevels.objectiveSummary(this.generatedLevel, this.score, this.objectiveProgress, true), { size: 16, width: 650 });
        if (stars > 0 && this.mode !== 'daily' && this.mode !== 'endless') {
            this.overlayButton(260, 350, 220, 55, 0x4ecdc4, 'Next Level', () => this.nextLevel());
            this.overlayButton(540, 350, 220, 55, 0x555555, 'Replay', () => this.restartGame());
        } else {
            this.overlayButton(400, 350, 250, 55, 0x4ecdc4, this.mode === 'endless' ? 'New Run' : 'Replay', () => this.restartGame());
        }
        this.overlayButton(400, 435, 250, 55, 0x555555, 'Main Menu', () => this.returnToMenu());
    }

    // Every attempt spends energy on the server first. Nothing resets until the spend succeeds.
    async restartGame(attemptClaimed = false) {
        if (globalThis.InfiniteLevels && !attemptClaimed) {
            await this.rewardSubmission;
            return this.selectLevel(this.mode === 'endless' || this.mode === 'daily' ? 1 : this.level);
        }
        if (!attemptClaimed && !(await this.claimAttempt())) return;

        // Reset game state. The move limit belongs to the level, not to a fixed 30.
        this.score = 0;
        const config = levelConfig(this.level, this.mode);
        this.moves = config.moves;
        this.targetScore = !this.generatedLevel && this.getAuthToken() && Number.isSafeInteger(this.claimedLegacyTarget)
            ? this.claimedLegacyTarget : config.targetScore;
        this.timeLimit = config.timeLimit;
        this.time = config.timeLimit;
        this.setSelectedGem(null);
        this.reshuffleBoard();
        
        // Restart the game
        this.startGame();
        
        // Remove end game screen
        this.scene.children.list.forEach(child => {
            if (child.texture && child.texture.key === 'endgame') {
                child.destroy();
            }
        });
    }

    // Hides the canvas and shows the DOM menu. A running level is paused until closeMenu().
    openMenu() {
        this.menuPausedRun = this.playerOverlayResume ?? (!!this.isGameRunning && !this.isPaused);
        delete this.playerOverlayResume;
        this.closeOverlay();
        this.pauseGame();
        if (typeof window.openDomMenu === 'function') window.openDomMenu();
    }

    // Called when the player returns to the canvas. Resumes the level if the menu paused it.
    closeMenu() {
        if (this.menuPausedRun) {
            this.menuPausedRun = false;
            this.resumeGame();
        }
    }

    returnToMenu() {
        this.currentScreen = 'menu';
        // Remove end game screen
        this.scene.children.list.forEach(child => {
            if (child.texture && child.texture.key === 'endgame') {
                child.destroy();
            }
        });
        this.openMenu();
    }

    destroy() {
        this.isGameRunning = false;
        this.feedbackEndPending = false;
        this.feedbackResultStars = null;
        this.matchFeedback?.destroy();
        this.soundEffects?.destroy();
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.boardResizeObserver?.disconnect();
        if (this.onBoardPointerBounds) for (const type of ['pointerdown', 'touchstart', 'mousedown']) this.playerUI?.surface?.removeEventListener(type, this.onBoardPointerBounds, true);
        this.onBoardPointerBounds = null;
        if (this.onAuthChanged) window.removeEventListener('auth:changed', this.onAuthChanged);
        this.playerUI?.assistiveBoard?.destroy();
        this.playerUI?.closeOverlay();
        this.playerUI?.shell.remove();
        this.playerUI = null;
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }
    }
}

// Export for use
window.PhaserMatch3Game = PhaserMatch3Game;