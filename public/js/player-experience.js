/* Native, responsive player UI around the shared deterministic Phaser core.
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

    const specialTypes = Object.freeze(['row', 'column', 'burst', 'prism']);
    const specialNames = Object.freeze({ row: 'Row Beam', column: 'Column Beam', burst: 'Burst', prism: 'Prism' });

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

    function drawGem(context, type, special = null) {
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
        if (specialTypes.includes(special)) {
            context.beginPath(); context.roundRect(36, 36, 27, 27, 9);
            context.fillStyle = '#10213a'; context.fill(); context.lineWidth = 2; context.strokeStyle = '#ffffff'; context.stroke();
            // Draw every badge as geometry: a missing Unicode font must never hide its identity.
            context.beginPath(); context.fillStyle = '#ffffff'; context.lineWidth = 2.5;
            context.lineCap = 'round'; context.lineJoin = 'round';
            const path = (points) => points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
            if (special === 'row') {
                path([[42, 49.5], [57, 49.5]]); path([[45, 46], [41.5, 49.5], [45, 53]]); path([[54, 46], [57.5, 49.5], [54, 53]]);
            } else if (special === 'column') {
                path([[49.5, 42], [49.5, 57]]); path([[46, 45], [49.5, 41.5], [53, 45]]); path([[46, 54], [49.5, 57.5], [53, 54]]);
            } else if (special === 'burst') {
                context.lineWidth = 3; path([[49.5, 43], [49.5, 56]]); path([[43, 49.5], [56, 49.5]]);
                for (const [x, y] of [[42, 42], [57, 42], [42, 57], [57, 57]]) { context.moveTo(x, y); context.lineTo(x + (x < 49.5 ? 2 : -2), y + (y < 49.5 ? 2 : -2)); }
            } else {
                path([[49.5, 40], [52, 47], [59, 49.5], [52, 52], [49.5, 59], [47, 52], [40, 49.5], [47, 47]]);
                context.closePath(); context.fill();
            }
            context.stroke(); context.lineCap = 'butt'; context.lineJoin = 'miter';
        }
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
            <progress class="match-goal-progress" aria-label="Level goal progress" max="100" value="0"></progress>
            <div class="match-player-theme" data-stat="theme"></div>
            <div class="match-board-surface" tabindex="-1" role="group" aria-label="Puzzle board. Tap two adjacent gems or swipe. Keyboard: arrows navigate, Space selects gems for swaps, Enter selects or activates specials, H requests a free hint, M toggles optional sound, Escape clears selection."></div>
            <footer class="match-player-footer">
                <div class="match-play-tools"><button type="button" data-action="hint">Hint <small>FREE</small></button><button type="button" data-action="pause">Pause</button><button type="button" data-action="preferences">Preferences</button><button type="button" data-action="menu">Explore</button><button type="button" data-action="bank" hidden>Bank Run</button></div>
                <div class="match-powerups" aria-label="Inventory boosters"></div>
                <div class="match-player-account"><span data-stat="energy"></span><span data-stat="stars"></span><button type="button" data-action="account">Account</button><button type="button" data-action="shop">Shop</button><button type="button" data-action="kingdom">Kingdom</button><button type="button" data-action="season">Season</button></div>
                <p class="match-instructions">Tap gems or swipe · 4+ earns free specials · swipe specials together · Explore has the guide</p>
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
        let goalKey = '';
        let goalLabels = [];
        const getField = (name) => name === 'level' ? find('.match-player-level') : find(`[data-stat="${name}"]`);
        const fields = Object.fromEntries(['score', 'moves', 'timer', 'level', 'goal', 'theme', 'energy', 'stars'].map((name) => [name, proxy(getField(name))]));
        const writeTheme = fields.theme.setText;
        fields.theme.setText = (text) => {
            getField('theme').title = String(text); getField('theme').setAttribute('aria-label', String(text));
            return writeTheme(String(text).split('\n').filter((line) => !/^\d{4}-\d{2}-\d{2}$/.test(line)).join(' · '));
        };
        const actions = {
            hint: () => game.showHint(), pause: () => { game.togglePause(); refresh(); },
            preferences: () => preferences(), menu: () => explore(), bank: () => game.endGame(),
            account: () => game.openSignIn(), shop: () => game.showShop(), kingdom: () => game.showKingdom(), season: () => game.showBattlePass(),
        };
        for (const [name, action] of Object.entries(actions)) find(`[data-action="${name}"]`).addEventListener('click', action);
        const powerupNames = { bomb: 'Bomb', rainbow: 'Board', lightning: 'Bolt', diamond: 'Color', target: 'Cross', star: 'Sweep' };
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
            const close = Array.from(content.querySelectorAll('button')).find((button) => /^(Back to game|Back to title|Close|OK)$/.test(button.textContent));
            close?.click();
        });

        function announce(message) { find('.match-player-announcement').textContent = message; }
        function renderGoals() {
            const progress = find('progress'); const area = getField('goal');
            const definition = game.generatedLevel;
            if (definition?.generatorVersion < 4 || !definition) {
                goalKey = ''; goalLabels = []; area.classList.remove('match-objectives'); area.removeAttribute('aria-label');
                progress.max = Math.max(1, game.targetScore || 1); progress.value = Math.min(game.score || 0, progress.max);
                progress.setAttribute('aria-valuetext', `${game.score || 0} of ${game.targetScore || 1} points`);
                return;
            }
            const state = root.InfiniteLevels.objectiveStatus(definition, game.score, game.objectiveProgress);
            const key = `${definition.id}|${JSON.stringify(definition.objectives)}`;
            area.classList.add('match-objectives');
            area.setAttribute('aria-label', 'Complete every goal. Cleared gems, including special effects and cascades, count.');
            if (key !== goalKey) {
                goalKey = key; area.replaceChildren(); goalLabels = [];
                for (const goal of state.items) {
                    const item = document.createElement('span'); item.className = 'match-objective';
                    item.dataset.objective = goal.type; if (goal.gemType) item.dataset.gemType = goal.gemType;
                    if (goal.type === 'collect') {
                        const icon = document.createElement('canvas'); icon.width = 64; icon.height = 64;
                        icon.setAttribute('aria-hidden', 'true'); drawGem(icon.getContext('2d'), goal.gemType); item.append(icon);
                    }
                    const text = document.createElement('span'); item.append(text); area.append(item); goalLabels.push({ item, text });
                }
            }
            state.items.forEach((goal, index) => {
                const slot = goalLabels[index]; if (!slot) return;
                const name = goal.type === 'collect' ? goal.gemType : 'Score';
                slot.text.textContent = `${name} ${Math.min(goal.current, goal.target).toLocaleString()}/${goal.target.toLocaleString()}`;
                slot.item.dataset.complete = String(goal.complete);
                slot.item.setAttribute('aria-label', `${goal.type === 'collect' ? `Collect ${goal.target} ${goal.gemType} ${visuals[goal.gemType].shape} gems` : `Score ${goal.target} points`}. ${goal.current} achieved, ${goal.remaining} remaining.`);
            });
            progress.max = 100; progress.value = state.fraction * 100;
            progress.setAttribute('aria-valuetext', root.InfiniteLevels.objectiveSummary(definition, game.score, game.objectiveProgress, true));
        }
        function soundLabel() {
            const state = game.getSoundStatus();
            return state.enabled ? 'Sound on — mute' : state.supported ? 'Sound off — enable' : 'Sound unavailable';
        }
        function renderSoundControls() {
            const state = game.getSoundStatus();
            const checkbox = find('[data-sound-choice]');
            if (checkbox) { checkbox.checked = !!game.settings.sfx; checkbox.disabled = !state.supported && !checkbox.checked; }
            const volume = find('[data-sound-volume]');
            if (volume) { volume.value = String(Math.round(state.volume * 100)); volume.disabled = !state.enabled || !state.supported; }
            const output = find('[data-sound-volume-label]'); if (output) output.textContent = `${Math.round(state.volume * 100)}%`;
            const test = find('[data-sound-test]'); if (test) test.disabled = !state.enabled || !state.supported || state.volume === 0;
            const toggle = find('[data-sound-toggle]'); if (toggle) { toggle.textContent = soundLabel(); toggle.disabled = !state.supported && !state.enabled; }
            const description = find('[data-sound-status]');
            if (description) description.textContent = state.state === 'unavailable' ? 'Sound is unavailable here. The game remains fully playable in silence.'
                : state.state === 'off' ? 'Sound is off. Enable it only if you want local effects; no music plays.'
                    : state.state === 'volume-zero' ? 'Sound volume is zero. Raise it to hear effects.'
                        : state.state === 'ready' ? 'Sound is on. Test the volume below; M mutes it while the board is focused.'
                            : 'Sound is on but needs a player gesture. Press Test sound; device mute or browser media policy may still silence it.';
            const legacy = document.getElementById('sfx-toggle'); if (legacy) legacy.checked = !!game.settings.sfx;
        }
        function refresh() {
            renderGoals();
            renderSoundControls();
            assistiveBoard?.sync();
            find('[data-action="pause"]').textContent = game.isPaused ? 'Resume' : 'Pause';
            find('[data-action="hint"]').disabled = !game.isGameRunning || game.isPaused || game.powerUpPending || game.levelStarting;
            find('[data-action="pause"]').disabled = !game.isGameRunning || game.levelStarting;
            find('[data-action="menu"]').disabled = !!game.levelStarting || !!game.powerUpPending;
            find('[data-action="bank"]').disabled = !game.isGameRunning || game.isPaused || game.levelStarting || game.powerUpPending;
            for (const [type, slot] of powerups) {
                const button = find(`[data-powerup="${type}"]`);
                button.disabled = !game.isGameRunning || game.isPaused || game.levelStarting || game.powerUpPending || slot.btn.getData('count') <= 0;
                button.setAttribute('aria-label', `${powerupNames[type]} inventory booster, ${slot.btn.getData('count')} remaining`);
                button.setAttribute('aria-pressed', String(game.armedPowerUp === type));
            }
            shell.classList.toggle('match-paused', !!game.isPaused);
            shell.classList.toggle('match-high-contrast', !!game.settings?.highContrast);
            shell.classList.toggle('match-large-text', !!game.settings?.largeText);
            shell.classList.toggle('match-reduced-motion', game.animationsReduced());
            document.documentElement.classList.toggle('match-reduced-motion', game.animationsReduced());
        }
        function focusBoard() { if (assistiveBoard) assistiveBoard.focus(); else surface.focus({ preventScroll: true }); }
        function openOverlay(title) {
            if (!dialog.open) focusedBeforeDialog = document.activeElement;
            content.replaceChildren(); status.textContent = ''; find('h2').textContent = title;
            if (!dialog.open) dialog.showModal();
            assistiveBoard?.sync();
            return { destroy: closeOverlay };
        }
        function closeOverlay() {
            if (dialog.open) dialog.close();
            content.replaceChildren(); status.textContent = '';
            if (focusedBeforeDialog?.isConnected) focusedBeforeDialog.focus({ preventScroll: true });
            focusedBeforeDialog = null;
            assistiveBoard?.sync();
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
            overlayButton('Back to game', () => { game.closeOverlay(); delete game.playerOverlayResume; if (wasRunning) game.resumeGame(); refresh(); focusBoard(); });
            overlayButton('Play preferences', () => preferences(wasRunning));
            overlayButton(soundLabel(), (event) => { game.setSoundEffects(!game.settings.sfx, event); refresh(); });
            content.lastElementChild.dataset.soundToggle = 'true';
            overlayButton(game.settings.textBoard === true ? 'Use visual board' : 'Use text board', () => {
                game.settings.textBoard = game.settings.textBoard !== true; game.saveUserData();
                game.closeOverlay(); delete game.playerOverlayResume; if (wasRunning) game.resumeGame(); refresh(); focusBoard();
            });
            overlayButton('Special gem guide', () => specialGuide(wasRunning));
            if (game.usesLevelObjectives()) overlayButton('Level goal guide', () => goalGuide(wasRunning));
            overlayButton('Game modes and local level settings', () => game.openMenu());
            overlayButton('Account / sign in', () => game.openSignIn());
            overlayButton('Shop', () => game.showShop());
            overlayButton('Kingdom', () => game.showKingdom());
            overlayButton('Season and community', () => game.showBattlePass());
        }
        function goalGuide(wasRunning) {
            game.openOverlay('Your level goals');
            overlayButton('Back to game', () => { game.closeOverlay(); delete game.playerOverlayResume; if (wasRunning) game.resumeGame(); refresh(); focusBoard(); });
            content.lastElementChild.className = 'match-guide-close';
            overlayText(root.InfiniteLevels.objectiveDescription(game.generatedLevel));
            overlayText(`${game.generatedLevel.theme.name} · ${game.generatedLevel.context.localDate} · ${game.generatedLevel.theme.environmentLabel}`);
            overlayText('Complete every goal above the board. Collect gems by clearing their color: matches, cascades, earned specials and optional inventory effects all count. New spawns, a newly earned gem that survives, and free board repairs do not count.');
            overlayText('On collection-only levels, score is not an extra win requirement. Completing the collection earns at least one star; score can earn extra stars. Mixed levels require both score and collection. Hints prefer useful progress on unfinished goals, but are not a guaranteed winning strategy.');
            overlayText(`Extra stars still require every goal: 2 stars at ${Math.ceil(game.targetScore * 1.5).toLocaleString()} points, 3 stars at ${(game.targetScore * 2).toLocaleString()} points. Collection-only completion earns at least 1 star even below the score rating baseline.`);
            overlayText('Goals stay fixed during this attempt. Replay starts new counters. Endless resets counters only when every stage goal is complete; Bank Run can finish a partial stage.');
        }
        function specialGuide(wasRunning) {
            game.openOverlay('Earned special gems');
            overlayButton('Back to game', () => { game.closeOverlay(); delete game.playerOverlayResume; if (wasRunning) game.resumeGame(); refresh(); focusBoard(); });
            content.lastElementChild.className = 'match-guide-close';
            overlayText('Earn these on the board, never from a purchase. Each activation or combination uses one ordinary move; inventory boosters are separate.');
            const legend = document.createElement('ul'); legend.className = 'match-special-guide';
            const rules = { row: '4 in a row: Row Beam clears one row.', column: '4 in a column: Column Beam clears one column.',
                burst: 'L/T or intersecting matches: Burst clears a 3×3 area.', prism: '5+ in a line: Prism clears a color.' };
            for (const [kind, description] of Object.entries(rules)) {
                const item = document.createElement('li'); const icon = document.createElement('canvas');
                icon.width = 64; icon.height = 64; icon.setAttribute('aria-hidden', 'true');
                drawGem(icon.getContext('2d'), 'blue', kind);
                const label = document.createElement('span'); label.textContent = description;
                item.append(icon, label); legend.append(item);
            }
            content.append(legend);
            overlayText('The moved gem is preferred as the creation anchor. Cascades can earn specials too.');
            overlayText('Tap a special to activate it, or swipe it with a neighbour. Space selects a special for a keyboard swap; Enter activates. A Prism taps its own color, or swaps to clear its neighbour’s color.');
            overlayText('Combine: two Beams make a cross; Beam + Burst clears three rows and columns; two Bursts clear 5×5; Prism + Beam/Burst turns that color into specials and fires them; two Prisms clear the whole board.');
            if (!game.usesEarnedSpecials()) overlayText('This frozen older level uses plain-gem rules. New version-3 levels support earned specials.');
        }
        function preferences(wasRunning = game.isGameRunning && !game.isPaused) {
            const returnToTitle = !!game.titleShowing;
            if (wasRunning) game.pauseGame();
            game.openOverlay('Play preferences');
            overlayButton(returnToTitle ? 'Back to title' : 'Back to game', () => {
                game.closeOverlay(); delete game.playerOverlayResume;
                if (returnToTitle) game.showTitleOverlay();
                else { if (wasRunning) game.resumeGame(); refresh(); focusBoard(); }
            });
            content.lastElementChild.className = 'match-guide-close';
            const soundLabel = document.createElement('label'); const soundChoice = document.createElement('input');
            soundChoice.type = 'checkbox'; soundChoice.dataset.soundChoice = 'true';
            soundChoice.addEventListener('change', (event) => { game.setSoundEffects(soundChoice.checked, event); refresh(); });
            soundLabel.append(soundChoice, document.createTextNode('Sound effects (optional)')); content.append(soundLabel);
            const volumeLabel = document.createElement('label'); volumeLabel.className = 'match-sound-volume';
            const volume = document.createElement('input'); volume.type = 'range'; volume.min = '0'; volume.max = '100'; volume.step = '1';
            volume.dataset.soundVolume = 'true'; volume.setAttribute('aria-label', 'Sound volume');
            const output = document.createElement('span'); output.dataset.soundVolumeLabel = 'true'; output.setAttribute('aria-hidden', 'true');
            volume.addEventListener('input', (event) => { game.setSoundVolume(Number(volume.value) / 100, event); refresh(); });
            volumeLabel.append(document.createTextNode('Sound volume'), volume, output); content.append(volumeLabel);
            overlayButton('Test sound', (event) => game.previewSound(event)); content.lastElementChild.dataset.soundTest = 'true';
            overlayText(''); content.lastElementChild.dataset.soundStatus = 'true'; content.lastElementChild.setAttribute('role', 'status');
            for (const [key, title] of Object.entries({ textBoard: 'Text board (named cells and larger targets)', highContrast: 'High contrast', largeText: 'Larger HUD text', reduceAnimations: 'Reduced motion', haptics: 'Touch vibration' })) {
                const label = document.createElement('label'); const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
                checkbox.checked = game.settings[key] === true; checkbox.disabled = key === 'textBoard' && !assistiveBoard; checkbox.addEventListener('change', () => {
                    game.settings[key] = checkbox.checked; game.saveUserData(); refresh();
                });
                label.append(checkbox, document.createTextNode(title)); content.append(label);
            }
            overlayText('Text board uses the same puzzle and rewards. Click two adjacent cells to swap; a special is selected rather than fired. Enter or Activate special fires it. Arrows, Home/End and Control Home/End navigate; Tab leaves. Narrow text boards scroll instead of shrinking targets. Keyboard focus reveals named cells even with this preference off.');
            overlayText('Sound is generated locally, with no downloads or microphone permission. System reduced motion is respected; sound and vibration are separate, optional preferences. Hints are always free.');
            refresh();
        }

        const assistiveBoard = root.InfiniteAssistiveBoard?.mount(game, surface, announce) || null;
        surface.tabIndex = assistiveBoard ? -1 : 0;
        refresh();
        return Object.freeze({ shell, surface, fields, powerups, announce, refresh, assistiveBoard, focusBoard, openOverlay, closeOverlay, overlayText, overlayButton,
            showPreferences: preferences, status: proxy(status), bankButton: proxy(find('[data-action="bank"]')) });
    }

    root.InfinitePlayerExperience = Object.freeze({ visuals, specialTypes, specialNames, drawGem, boardZoom, swipeCells, keyboardCell, mount });
})(globalThis);
