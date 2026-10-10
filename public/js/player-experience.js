/* Native, responsive player UI around the unchanged deterministic Phaser core.
   No remote assets, trackers, paid SDKs or alternate match/scoring algorithm. */
(function (root) {
    'use strict';
    const visuals = Object.freeze({
        red: { color: '#ff6384', shape: 'heart', symbol: 'R' },
        blue: { color: '#62baff', shape: 'diamond', symbol: 'B' },
        green: { color: '#58dfa9', shape: 'square', symbol: 'G' },
        yellow: { color: '#ffe278', shape: 'triangle', symbol: 'Y' },
        purple: { color: '#be9cff', shape: 'hexagon', symbol: 'P' },
        orange: { color: '#ffad66', shape: 'star', symbol: 'O' },
    });

    function boardZoom(width, height, size, step = 54) {
        return Math.max(0.1, Math.min((width - 8) / (size * step), (height - 8) / (size * step), 1.35));
    }

    function swipeCells(row, col, deltaX, deltaY, size, threshold = 18) {
        if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < threshold) return null;
        const horizontal = Math.abs(deltaX) >= Math.abs(deltaY);
        const nextRow = row + (horizontal ? 0 : Math.sign(deltaY));
        const nextCol = col + (horizontal ? Math.sign(deltaX) : 0);
        if (nextRow < 0 || nextCol < 0 || nextRow >= size || nextCol >= size) return null;
        return [row, col, nextRow, nextCol];
    }

    function keyboardCell(row, col, key, size) {
        const direction = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[key];
        return direction ? [Math.max(0, Math.min(size - 1, row + direction[0])), Math.max(0, Math.min(size - 1, col + direction[1]))] : null;
    }

    function drawGem(context, type) {
        const style = visuals[type];
        context.clearRect(0, 0, 64, 64);
        context.beginPath();
        if (style.shape === 'heart') {
            context.moveTo(32, 57); context.bezierCurveTo(4, 39, 0, 18, 17, 9);
            context.bezierCurveTo(24, 5, 31, 11, 32, 15); context.bezierCurveTo(35, 6, 51, 4, 58, 17);
            context.bezierCurveTo(65, 34, 43, 49, 32, 57);
        } else if (style.shape === 'square') {
            context.roundRect(7, 7, 50, 50, 12);
        } else {
            const points = style.shape === 'diamond' ? [[32, 4], [60, 32], [32, 60], [4, 32]]
                : style.shape === 'triangle' ? [[32, 5], [60, 57], [4, 57]]
                    : Array.from({ length: style.shape === 'star' ? 10 : 6 }, (_, i) => {
                        const count = style.shape === 'star' ? 10 : 6;
                        const radius = style.shape === 'star' && i % 2 ? 17 : 29;
                        const angle = -Math.PI / 2 + i * Math.PI * 2 / count;
                        return [32 + Math.cos(angle) * radius, 32 + Math.sin(angle) * radius];
                    });
            points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
        }
        context.closePath();
        const gradient = context.createLinearGradient(0, 6, 0, 58);
        gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(0.22, style.color); gradient.addColorStop(1, style.color);
        context.fillStyle = gradient; context.fill();
        context.lineWidth = 3; context.strokeStyle = '#10213a'; context.stroke();
        context.fillStyle = '#10213a'; context.font = 'bold 22px system-ui, sans-serif';
        context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(style.symbol, 32, style.shape === 'triangle' ? 39 : 32);
    }

    function proxy(element) {
        let destroyed = false;
        const object = {
            get active() { return !destroyed && element.isConnected; },
            setText(text) { if (object.active) element.textContent = String(text); return object; },
            setColor(color) { element.style.color = color; return object; },
            setVisible(visible) { element.hidden = !visible; return object; },
            destroy() { destroyed = true; element.remove(); },
        };
        return object;
    }

    function mount(game, container) {
        if (!container || !root.document?.createElement) return null;
        const shell = document.createElement('section');
        shell.className = 'match-player-shell';
        shell.setAttribute('aria-label', 'Infinite Match game');
        shell.innerHTML = `
            <header class="match-player-header"><span class="match-wordmark">INFINITE <b>MATCH</b></span><span class="match-player-level"></span></header>
            <div class="match-player-stats"><span data-stat="score">Score: 0</span><span data-stat="moves">Moves: —</span><span data-stat="timer">Time: —</span></div>
            <div class="match-player-goal" data-stat="goal"></div>
            <progress class="match-goal-progress" aria-label="Level score goal" max="100" value="0"></progress>
            <div class="match-player-theme" data-stat="theme"></div>
            <div class="match-board-surface" tabindex="0" role="group" aria-label="Puzzle board. Tap two adjacent gems or swipe. Keyboard: arrows navigate, Enter or Space selects, H requests a free hint, Escape clears selection."></div>
            <footer class="match-player-footer">
                <div class="match-play-tools"><button type="button" data-action="hint">Hint <small>FREE</small></button><button type="button" data-action="pause">Pause</button><button type="button" data-action="preferences">Preferences</button><button type="button" data-action="menu">Explore</button><button type="button" data-action="bank" hidden>Bank Run</button></div>
                <div class="match-powerups" aria-label="Power-ups"></div>
                <div class="match-player-account"><span data-stat="energy"></span><span data-stat="stars"></span><button type="button" data-action="account">Account</button><button type="button" data-action="shop">Shop</button><button type="button" data-action="kingdom">Kingdom</button><button type="button" data-action="season">Season</button></div>
                <p class="match-instructions">Tap adjacent gems or swipe · shapes and letters identify colors · arrows + Enter also work</p>
            </footer>
            <div class="match-player-announcement" role="status" aria-live="polite" aria-atomic="true"></div>
            <dialog class="match-player-dialog" aria-labelledby="match-dialog-heading"><h2 id="match-dialog-heading"></h2><div class="match-dialog-content"></div><p class="match-dialog-status" role="status"></p></dialog>`;
        container.append(shell);
        const find = (selector) => shell.querySelector(selector);
        const surface = find('.match-board-surface');
        surface.id = 'match-board-surface';
        const dialog = find('dialog');
        const content = find('.match-dialog-content');
        const status = find('.match-dialog-status');
        const powerups = new Map();
        let focusedBeforeDialog = null;
        const getField = (name) => name === 'level' ? find('.match-player-level') : find(`[data-stat="${name}"]`);
        const fields = Object.fromEntries(['score', 'moves', 'timer', 'level', 'goal', 'theme', 'energy', 'stars'].map((name) => [name, proxy(getField(name))]));
        const writeTheme = fields.theme.setText;
        fields.theme.setText = (text) => {
            getField('theme').title = String(text);
            return writeTheme(String(text).split('\n').filter((line) => !/^\d{4}-\d{2}-\d{2}$/.test(line)).join(' · '));
        };
        const actions = {
            hint: () => game.showHint(), pause: () => { game.togglePause(); refresh(); },
            preferences: () => preferences(), menu: () => explore(), bank: () => game.endGame(),
            account: () => game.openSignIn(), shop: () => game.showShop(), kingdom: () => game.showKingdom(), season: () => game.showBattlePass(),
        };
        for (const [name, action] of Object.entries(actions)) find(`[data-action="${name}"]`).addEventListener('click', action);
        const powerupNames = { bomb: 'Burst', rainbow: 'Rainbow', lightning: 'Column', diamond: 'Color', target: 'Cross', star: 'Sweep' };
        for (const [type, name] of Object.entries(powerupNames)) {
            const button = document.createElement('button'); button.type = 'button';
            const count = document.createElement('span');
            button.dataset.powerup = type; button.append(document.createTextNode(`${name} `), count);
            button.addEventListener('click', () => { game.usePowerUp(type); refresh(); });
            find('.match-powerups').append(button);
            const data = { type, count: ({ bomb: 3, rainbow: 1, lightning: 2 })[type] ?? 1 };
            const slot = {
                btn: { getData: (key) => data[key], setData(key, value) { data[key] = value; refresh(); return this; },
                    setAlpha(value) { button.setAttribute('aria-pressed', String(value < 1)); return this; }, on() { return this; } },
                text: proxy(count),
            };
            count.textContent = String(data.count); powerups.set(type, slot);
        }
        surface.addEventListener('keydown', (event) => game.handleBoardKey(event));
        dialog.addEventListener('cancel', (event) => {
            event.preventDefault();
            // Escape invokes the same explicit close action as touch, never a second pause shortcut.
            const close = Array.from(content.querySelectorAll('button')).find((button) => /^(Back to game|Close|OK)$/.test(button.textContent));
            close?.click();
        });

        function announce(message) { find('.match-player-announcement').textContent = message; }
        function refresh() {
            const progress = find('progress'); progress.max = Math.max(1, game.targetScore || 1); progress.value = Math.min(game.score || 0, progress.max);
            find('[data-action="pause"]').textContent = game.isPaused ? 'Resume' : 'Pause';
            find('[data-action="hint"]').disabled = !game.isGameRunning || game.isPaused || game.powerUpPending || game.levelStarting;
            find('[data-action="pause"]').disabled = !game.isGameRunning || game.levelStarting;
            find('[data-action="menu"]').disabled = !!game.levelStarting || !!game.powerUpPending;
            find('[data-action="bank"]').disabled = !game.isGameRunning || game.isPaused || game.levelStarting || game.powerUpPending;
            for (const [type, slot] of powerups) {
                const button = find(`[data-powerup="${type}"]`);
                button.disabled = !game.isGameRunning || game.isPaused || game.levelStarting || game.powerUpPending || slot.btn.getData('count') <= 0;
                button.setAttribute('aria-label', `${powerupNames[type]} power-up, ${slot.btn.getData('count')} remaining`);
                button.setAttribute('aria-pressed', String(game.armedPowerUp === type));
            }
            shell.classList.toggle('match-paused', !!game.isPaused);
            shell.classList.toggle('match-high-contrast', !!game.settings?.highContrast);
            shell.classList.toggle('match-large-text', !!game.settings?.largeText);
            shell.classList.toggle('match-reduced-motion', game.animationsReduced());
            document.documentElement.classList.toggle('match-reduced-motion', game.animationsReduced());
        }
        function openOverlay(title) {
            if (!dialog.open) focusedBeforeDialog = document.activeElement;
            content.replaceChildren(); status.textContent = ''; find('h2').textContent = title;
            if (!dialog.open) dialog.showModal();
            return { destroy: closeOverlay };
        }
        function closeOverlay() {
            if (dialog.open) dialog.close();
            content.replaceChildren(); status.textContent = '';
            if (focusedBeforeDialog?.isConnected) focusedBeforeDialog.focus({ preventScroll: true });
            focusedBeforeDialog = null;
        }
        function overlayText(label) { const paragraph = document.createElement('p'); paragraph.textContent = label; content.append(paragraph); return proxy(paragraph); }
        function overlayButton(label, onClick) {
            const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
            button.addEventListener('click', onClick); content.append(button); return proxy(button);
        }
        function explore() {
            const wasRunning = game.isGameRunning && !game.isPaused;
            game.playerOverlayResume = wasRunning;
            if (wasRunning) game.pauseGame();
            game.openOverlay('Explore Infinite Match');
            overlayButton('Back to game', () => { game.closeOverlay(); delete game.playerOverlayResume; if (wasRunning) game.resumeGame(); refresh(); surface.focus(); });
            overlayButton('Play preferences', () => preferences(wasRunning));
            overlayButton('Game modes and local level settings', () => game.openMenu());
            overlayButton('Account / sign in', () => game.openSignIn());
            overlayButton('Shop', () => game.showShop());
            overlayButton('Kingdom', () => game.showKingdom());
            overlayButton('Season and community', () => game.showBattlePass());
        }
        function preferences(wasRunning = game.isGameRunning && !game.isPaused) {
            if (wasRunning) game.pauseGame();
            game.openOverlay('Play preferences');
            for (const [key, title] of Object.entries({ highContrast: 'High contrast', largeText: 'Larger HUD text', reduceAnimations: 'Reduced motion', haptics: 'Touch vibration' })) {
                const label = document.createElement('label'); const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
                checkbox.checked = !!game.settings[key]; checkbox.addEventListener('change', () => {
                    game.settings[key] = checkbox.checked; game.saveUserData(); refresh();
                });
                label.append(checkbox, document.createTextNode(title)); content.append(label);
            }
            overlayText('System reduced-motion preferences are respected. Hints are always free; sound is currently a placeholder.');
            overlayButton('Back to game', () => { game.closeOverlay(); delete game.playerOverlayResume; if (wasRunning) game.resumeGame(); refresh(); surface.focus(); });
        }
        refresh();
        return Object.freeze({ shell, surface, fields, powerups, announce, refresh, openOverlay, closeOverlay, overlayText, overlayButton,
            status: proxy(status), bankButton: proxy(find('[data-action="bank"]')) });
    }

    root.InfinitePlayerExperience = Object.freeze({ visuals, drawGem, boardZoom, swipeCells, keyboardCell, mount });
})(globalThis);
