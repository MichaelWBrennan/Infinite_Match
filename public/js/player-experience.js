/* Native, responsive player UI around the shared deterministic Phaser core.
   No remote assets, trackers, paid SDKs or alternate match/scoring algorithm. */
(function (root) {
    'use strict';

    // Code splitting: preload assistive-board in the background (needed during mount()).
    // kingdom-scene is loaded on demand when the player opens the kingdom.
    if (typeof window !== 'undefined' && window.lazyLoad) {
        void window.lazyLoad('assistive-board').catch(() => {});
    }

    // The shared art module is the single source of truth for gem silhouettes,
    // colors, letters, lighting, and badges. It reads the same tile-set catalog
    // as the server, so themed boards never fall back to an unrelated pack.
    const art = root.InfiniteArt;
    let visuals = art ? art.visuals : {};
    function setVisuals(next) { visuals = next || (art ? art.visuals : {}); }

    const specialTypes = art ? art.specialTypes : Object.freeze(['row', 'column', 'burst', 'prism']);
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
        if (art && context) art.drawGem(context, type, special, visuals);
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
            <div class="match-board-surface" tabindex="-1" role="group" aria-label="Puzzle board. Tap two adjacent gems or swipe. Keyboard: arrows navigate, Space selects gems for swaps, Enter selects or activates specials, H requests a free hint, M toggles optional sound, Escape clears selection." style="touch-action: none;"></div>
            <footer class="match-player-footer">
                <div class="match-play-tools"><button type="button" data-action="hint">Hint <small>FREE</small></button><button type="button" data-action="finish-feedback" aria-label="Finish match animation" hidden>Finish <small>ANIMATION</small></button><button type="button" data-action="pause">Pause</button><button type="button" data-action="preferences">Preferences</button><button type="button" data-action="menu">Explore</button><button type="button" data-action="bank" hidden>Bank Run</button></div>
                <p class="match-endless-terms" hidden></p>
                <div class="match-powerups" aria-label="Inventory boosters"></div>
                <div class="match-player-account"><span data-stat="energy"></span><span data-stat="stars"></span><button type="button" data-action="account">Account</button><button type="button" data-action="shop">Shop</button><button type="button" data-action="kingdom">Kingdom</button><button type="button" data-action="season">Season</button></div>
                <p class="match-instructions">Tap gems or swipe · 4+ earns free specials · swipe specials together · Explore has the guide</p>
            </footer>
            <div class="match-player-announcement"><span class="match-announcement-message" role="status" aria-live="polite" aria-atomic="true"></span><span class="match-resolution-label" aria-hidden="true" hidden></span></div>
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
        let resolutionBusy = false;
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
            'finish-feedback': () => game.matchFeedback?.finish('skip'),
            hint: () => game.showHint(), pause: () => { game.togglePause(); refresh(); },
            preferences: () => preferences(), menu: () => explore(), bank: () => game.endGame(),
            account: () => game.openSignIn(), shop: () => game.showShop(), kingdom: () => game.showKingdom(), season: () => game.showBattlePass(),
        };
        for (const [name, action] of Object.entries(actions)) find(`[data-action="${name}"]`).addEventListener('click', () => {
            // A result has already been finalized. Finish its picture instead of
            // replacing the imminent result screen with an unrelated menu.
            if (game.feedbackResultStars !== null && game.feedbackResultStars !== undefined && name !== 'finish-feedback') game.matchFeedback?.finish('result');
            else action();
        });
        const powerupNames = { blast: 'Blast', ray: 'Ray', prism: 'Prism', bolt: 'Bolt', facet: 'Facet', mark: 'Mark', nova: 'Nova', spectrum: 'Spectrum', shift: 'Shift', hammer: 'Hammer' };
        for (const [type, name] of Object.entries(powerupNames)) {
            const button = document.createElement('button'); button.type = 'button';
            const count = document.createElement('span');
            const icon = document.createElement('canvas'); icon.width = 64; icon.height = 64; icon.setAttribute('aria-hidden', 'true');
            const iconContext = icon.getContext('2d');
            if (art && iconContext) art.drawBooster(iconContext, type);
            button.dataset.powerup = type; button.append(icon, document.createTextNode(`${name} `), count);
            button.addEventListener('click', () => { game.usePowerUp(type); refresh(); });
            find('.match-powerups').append(button);
            const data = { type, count: ({ blast: 3, ray: 2, prism: 1, bolt: 1, facet: 0, mark: 0, nova: 0, spectrum: 0, shift: 0, hammer: 0 })[type] ?? 1 };
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

        function announce(message) { find('.match-announcement-message').textContent = message || ''; }
        function objectiveTerrainKind(type, definition) {
            if (type === 'clear-weather-hazards') {
                return root.InfiniteLevels?.environmentRules?.(definition.context || {}).hazard?.type || 'mist';
            }
            return { 'clear-blockers': 'blocker', 'clear-locked-gems': 'locked', 'clear-jelly': 'jelly', 'clear-chocolate': 'chocolate',
                'clear-liquorice': 'liquorice', 'clear-marmalade': 'marmalade', 'clear-frosting': 'frosting', 'clear-delivery': 'delivery' }[type] || 'blocker';
        }
        function objectiveLabel(goal) {
            if (goal.type === 'collect') return goal.gemType;
            return { 'clear-shields': 'Shields', 'clear-blockers': 'Blockers', 'clear-locked-gems': 'Locks', 'clear-jelly': 'Jelly',
                'clear-chocolate': 'Chocolate', 'clear-liquorice': 'Liquorice', 'clear-marmalade': 'Marmalade', 'clear-frosting': 'Frosting',
                'clear-delivery': 'Delivery', 'clear-weather-hazards': 'Weather' }[goal.type] || 'Score';
        }
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
            area.setAttribute('aria-label', 'Complete every goal. Cleared gems, including special effects and cascades, count. Numbered shields take hits when gems on their fixed cells clear.');
            if (key !== goalKey) {
                goalKey = key; area.replaceChildren(); goalLabels = [];
                for (const goal of state.items) {
                    const item = document.createElement('span'); item.className = 'match-objective';
                    item.dataset.objective = goal.type; if (goal.gemType) item.dataset.gemType = goal.gemType;
                    if (goal.type === 'collect' || goal.type.startsWith('clear-')) {
                        const icon = document.createElement('canvas'); icon.width = 64; icon.height = 64;
                        icon.setAttribute('aria-hidden', 'true');
                        const goalContext = icon.getContext('2d');
                        if (goalContext) {
                            if (goal.type === 'collect') drawGem(goalContext, goal.gemType);
                            else if (art && goal.type === 'clear-shields') art.drawShield(goalContext, 2);
                            else if (art) art.drawTerrain(goalContext, objectiveTerrainKind(goal.type, definition), 1);
                        }
                        item.append(icon);
                    }
                    const text = document.createElement('span'); item.append(text); area.append(item); goalLabels.push({ item, text });
                }
            }
            state.items.forEach((goal, index) => {
                const slot = goalLabels[index]; if (!slot) return;
                const name = objectiveLabel(goal);
                slot.text.textContent = `${name} ${Math.min(goal.current, goal.target).toLocaleString()}/${goal.target.toLocaleString()}`;
                slot.item.dataset.complete = String(goal.complete);
                const description = goal.type === 'collect' ? `Collect ${goal.target} ${goal.gemType} ${visuals[goal.gemType]?.shape || ''} gems`
                    : goal.type === 'score' ? `Score ${goal.target.toLocaleString()} points` : `Clear ${goal.target} ${name.toLowerCase()}`;
                slot.item.setAttribute('aria-label', `${description}. ${goal.current} achieved, ${goal.remaining} remaining.`);
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
                        : state.state === 'ready' ? (state.enabled ? 'Sound is on. Test the volume below; M mutes it while the board is focused.'
                            : 'Music is on; sound effects are off. Enable sound effects separately if you want them.')
                            : (state.enabled || state.music ? 'Audio is on but needs a player gesture. Press Test sound or toggle music; device mute or browser media policy may still silence it.'
                                : 'Sound is off. Enable it only if you want local effects; no music plays.');
            const legacy = document.getElementById('sfx-toggle'); if (legacy) legacy.checked = !!game.settings.sfx;
            const musicCheckbox = find('[data-music-choice]');
            if (musicCheckbox) { musicCheckbox.checked = !!game.settings.music; musicCheckbox.disabled = !state.supported && !musicCheckbox.checked; }
            const musicVolume = find('[data-music-volume]');
            if (musicVolume) { musicVolume.value = String(Math.round((state.musicVolume ?? 0.5) * 100)); musicVolume.disabled = !state.music || !state.supported; }
            const musicOutput = find('[data-music-volume-label]'); if (musicOutput) musicOutput.textContent = `${Math.round((state.musicVolume ?? 0.5) * 100)}%`;
        }
        function refresh() {
            renderGoals();
            renderSoundControls();
            assistiveBoard?.sync();
            find('[data-action="pause"]').textContent = game.isPaused ? 'Resume' : 'Pause';
            find('[data-action="hint"]').disabled = !game.canInteractWithBoard();
            find('[data-action="pause"]').disabled = !game.isGameRunning || game.levelStarting;
            find('[data-action="menu"]').disabled = !!game.levelStarting || !!game.powerUpPending || !!game.endlessCheckpointPending || (!!game.matchFeedback?.isActive() && !game.isGameRunning);
            find('[data-action="bank"]').disabled = !game.isGameRunning || game.isPaused || game.levelStarting || game.powerUpPending || !!game.endlessCheckpointPending;
            for (const name of ['account', 'shop', 'kingdom', 'season']) find(`[data-action="${name}"]`).disabled = !!game.endlessCheckpointPending;
            const terms = find('.match-endless-terms');
            terms.hidden = game.mode !== 'endless' || !game.isGameRunning;
            if (!terms.hidden) terms.textContent = game.getAuthToken()
                ? `Bank within 3 hours for rewards (max 300 coins / 500 XP per run). Auto-checkpoints ${game.settings?.endlessAutoContinue === true ? 'on' : 'off'}; each new run costs 1 energy.`
                : 'Guest Endless has no clock, energy cost or account payout. Bank Run ends this run.';
            for (const [type, slot] of powerups) {
                const button = find(`[data-powerup="${type}"]`);
                button.disabled = !game.canInteractWithBoard() || slot.btn.getData('count') <= 0;
                button.setAttribute('aria-label', `${powerupNames[type]} inventory booster, ${slot.btn.getData('count')} remaining`);
                button.setAttribute('aria-pressed', String(game.armedPowerUp === type));
            }
            shell.classList.toggle('match-paused', !!game.isPaused);
            shell.classList.toggle('match-high-contrast', !!game.settings?.highContrast);
            shell.classList.toggle('match-large-text', !!game.settings?.largeText);
            shell.classList.toggle('match-reduced-motion', game.animationsReduced());
            document.documentElement.classList.toggle('match-reduced-motion', game.animationsReduced());
        }
        function setResolution(value) {
            const busy = value?.busy === true;
            const label = find('.match-resolution-label');
            const text = value?.text || '';
            if (label.textContent !== text) label.textContent = text;
            const phase = value?.phase || 'idle';
            if (label.dataset.phase !== phase) label.dataset.phase = phase;
            if (resolutionBusy === busy) return; // Do not rewrite goals/64 named cells for every visual phase.
            resolutionBusy = busy;
            const finish = find('[data-action="finish-feedback"]');
            const returnFocus = !busy && document.activeElement === finish;
            finish.hidden = !busy; find('[data-action="hint"]').hidden = busy;
            label.hidden = !busy;
            find('.match-player-announcement').classList.toggle('match-announcement-resolving', busy);
            surface.setAttribute('aria-busy', String(busy));
            refresh();
            if (returnFocus && game.isGameRunning) {
                if (game.settings?.textBoard === true) focusBoard();
                else surface.focus({ preventScroll: true });
            }
        }
        function focusBoard() { if (assistiveBoard) assistiveBoard.focus(); else surface.focus({ preventScroll: true }); }
        function openOverlay(title) {
            if (!dialog.open) focusedBeforeDialog = document.activeElement;
            content.replaceChildren(); status.textContent = ''; find('h2').textContent = title;
            dialog.classList.toggle('kingdom-room-dialog', title === 'Kingdom');
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
        function renderKingdomPayoff(payload, callbacks = {}) {
            const existing = content.querySelector('[data-kingdom-payoff]');
            if (existing) existing.remove();
            const api = root.InfiniteKingdomPayoff;
            if (!api) return null;
            const host = document.createElement('div');
            host.className = 'kingdom-payoff-host';
            content.append(host);
            return api.render(host, payload, callbacks);
        }
        function renderLossReview(payload, callbacks = {}) {
            const existing = content.querySelector('[data-loss-review]');
            if (existing) existing.remove();
            const api = root.InfiniteLossReview;
            if (!api) return null;
            const host = document.createElement('div');
            host.className = 'loss-review-host';
            content.append(host);
            return api.render(host, payload, callbacks);
        }
        let kingdomStorySkipped = false;
        async function renderKingdomScene(data, callbacks = {}) {
            // Lazy-load kingdom-scene on demand when the player opens the kingdom.
            if (!root.InfiniteKingdomScene) {
                try {
                    const lazyLoad = (typeof window !== 'undefined' && window.lazyLoad);
                    if (lazyLoad) {
                        await lazyLoad('kingdom-scene');
                    }
                } catch (e) {
                    console.warn('Failed to lazy-load kingdom-scene:', e.message);
                }
            }
            const scene = root.InfiniteKingdomScene;
            if (!scene) return false;
            const view = scene.roomView(data, callbacks.roomId);
            content.replaceChildren();
            const heading = find('h2');
            heading.textContent = view.title;
            const back = document.createElement('button');
            back.type = 'button'; back.className = 'match-guide-close'; back.textContent = 'Back to game';
            back.addEventListener('click', () => callbacks.close?.()); content.append(back);
            const rooms = document.createElement('nav'); rooms.className = 'kingdom-room-nav';
            rooms.setAttribute('aria-label', 'Kingdom rooms');
            for (const id of scene.ROOM_IDS) {
                const name = scene.ROOM_NAMES[id];
                const button = document.createElement('button'); button.type = 'button';
                button.dataset.roomId = id; button.textContent = name;
                button.setAttribute('aria-pressed', String(view.id === id));
                button.addEventListener('click', () => callbacks.selectRoom?.(id));
                rooms.append(button);
            }
            content.append(rooms);
            const summary = document.createElement('p'); summary.className = 'kingdom-room-summary';
            summary.textContent = view.guest ? 'A glimpse of your future kingdom · Play without signing in.'
                : `${view.name} · Level ${view.level}/5 · ${view.coins} coins · +${view.coinBonus}% room bonus`;
            content.append(summary);
            const figure = document.createElement('figure'); figure.className = 'kingdom-room-art';
            figure.setAttribute('role', 'img');
            figure.setAttribute('aria-label', view.level === 0 ? `The unlit ${view.name} awaits its first repair.`
                : `The restored ${view.name}${view.selected ? ` with ${view.choices.find((choice) => choice.id === view.selected)?.name || view.selected}` : ' with an empty display'}.`);
            figure.innerHTML = scene.artwork(view.level, view.selected, view.id); content.append(figure);
            if (!kingdomStorySkipped) {
                const story = document.createElement('div'); story.className = 'kingdom-room-story';
                const words = document.createElement('p'); words.textContent = view.narrative;
                const skip = document.createElement('button'); skip.type = 'button'; skip.textContent = 'Skip story';
                skip.addEventListener('click', () => { kingdomStorySkipped = true; story.remove(); content.querySelector('.kingdom-room-choices h3')?.focus(); });
                story.append(words, skip); content.append(story);
            }
            const renovation = document.createElement('div'); renovation.className = 'kingdom-room-renovate';
            if (view.guest) {
                const signIn = document.createElement('button'); signIn.type = 'button'; signIn.textContent = `Sign in to save your ${view.noun}`;
                signIn.addEventListener('click', () => callbacks.signIn?.()); renovation.append(signIn);
            } else if (view.next) {
                const upgrade = document.createElement('button'); upgrade.type = 'button'; upgrade.disabled = !view.canRenovate;
                upgrade.textContent = `Repair ${view.noun} · ${view.next.costCoins} coins${view.next.starsRequired ? ` · ${view.next.starsRequired} lifetime stars` : ''}`;
                upgrade.addEventListener('click', () => callbacks.renovate?.(view.id)); renovation.append(upgrade);
                if (!view.canRenovate) {
                    const reason = document.createElement('span');
                    reason.textContent = view.renovationReason === 'stars_required' ? 'Earn stars by winning levels.' : 'Earn more coins to repair.';
                    renovation.append(reason);
                }
            } else {
                renovation.textContent = `The ${view.noun} is fully restored.`;
            }
            content.append(renovation);
            const choices = document.createElement('section'); choices.className = 'kingdom-room-choices';
            const title = document.createElement('h3'); title.textContent = 'Choose the first look'; title.tabIndex = -1;
            choices.append(title);
            const note = document.createElement('p'); note.textContent = 'One display at a time. Owned décor can be used again without paying twice.';
            choices.append(note);
            const cards = document.createElement('div'); cards.className = 'kingdom-room-cards';
            for (const choice of view.choices) {
                const button = document.createElement('button'); button.type = 'button';
                button.className = 'kingdom-room-choice'; button.dataset.decorId = choice.id;
                button.disabled = !choice.eligible; // Keep the selected look keyboard-focusable; the server treats reselection as a free no-op.
                button.setAttribute('aria-pressed', String(choice.selected));
                const preview = document.createElement('span'); preview.className = 'kingdom-room-choice-art';
                preview.setAttribute('aria-hidden', 'true'); preview.innerHTML = scene.artwork(Math.max(1, view.level), choice.id, view.id);
                const name = document.createElement('strong'); name.textContent = choice.name;
                const detail = document.createElement('span'); detail.textContent = choice.caption;
                const price = document.createElement('span'); price.className = 'kingdom-room-price';
                price.textContent = choice.selected ? 'On display' : choice.lockedBy || (choice.costCoins ? `${choice.costCoins} coins · Choose` : 'Owned · Choose');
                button.append(preview, name, detail, price);
                button.addEventListener('click', () => callbacks.choose?.(choice.id, view.id));
                cards.append(button);
            }
            choices.append(cards); content.append(choices);
            const more = document.createElement('button'); more.type = 'button'; more.textContent = 'Explore all rooms and décor';
            more.addEventListener('click', () => callbacks.more?.()); content.append(more);
            if (callbacks.focusRoom) rooms.querySelector(`[data-room-id="${view.id}"]`)?.focus({ preventScroll: true });
            if (callbacks.focusChoice) cards.querySelector(`[data-decor-id="${callbacks.focusChoice}"]`)?.focus({ preventScroll: true });
            return true;
        }
        function explore() {
            const wasRunning = game.isGameRunning && !game.isPaused;
            game.playerOverlayResume = wasRunning;
            if (wasRunning) game.pauseGame();
            game.openOverlay('Explore Infinite Match');
            overlayButton('Back to game', () => { game.closeOverlay(); delete game.playerOverlayResume; if (wasRunning) game.resumeGame(); refresh(); focusBoard(); });
            overlayButton('Play preferences', () => preferences(wasRunning));
            overlayButton('This week: event, rhythm, offline', () => thisWeek(wasRunning));
            renderFlowCard(wasRunning);
            overlayButton(soundLabel(), (event) => { game.setSoundEffects(!game.settings.sfx, event); refresh(); });
            content.lastElementChild.dataset.soundToggle = 'true';
            overlayButton(game.settings.music ? 'Music on — mute' : 'Music off — enable', (event) => { game.setMusic(!game.settings.music, event); refresh(); });
            content.lastElementChild.dataset.musicToggle = 'true';
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
            overlayButton('Weekly event', () => game.showWeeklyEvent());
            const challengeLine = document.createElement('p'); challengeLine.className = 'match-score-challenge';
            challengeLine.textContent = 'Personal score challenge: checking…'; content.append(challengeLine);
            overlayButton('Personal score challenge and points', () => game.showWeeklyEvent());
            loadScoreChallengeLine(challengeLine);
            overlayButton('Help improve the game (optional)', () => game.showRetentionResearch());
            overlayButton('Season and community', () => game.showBattlePass());
            overlayButton('Credits & Attribution', () => { credits(wasRunning); });
        }
        function renderFlowCard(wasRunning) {
            const flow = root.InfinitePlayFlow;
            if (!flow || typeof game.flowRecommendation !== 'function') return;
            const card = document.createElement('section');
            card.className = 'play-flow-card';
            card.setAttribute('data-play-flow-card', 'true');
            const heading = document.createElement('h3');
            heading.textContent = 'Suggested for this session';
            card.append(heading);
            const recommendation = game.flowRecommendation();
            for (const line of flow.cardLines(recommendation)) {
                const p = document.createElement('p');
                p.textContent = line;
                card.append(p);
            }
            if (recommendation) {
                if (game.isGameRunning || wasRunning) {
                    const note = document.createElement('p');
                    note.textContent = 'Finish or bank your current run first; suggestions never interrupt play.';
                    card.append(note);
                } else {
                    const play = document.createElement('button');
                    play.type = 'button';
                    play.dataset.playFlowAccept = 'true';
                    play.textContent = `Play ${recommendation.title}`;
                    play.addEventListener('click', () => { void game.playFlowRecommendation(); });
                    card.append(play);
                }
            }
            const settingsButton = document.createElement('button');
            settingsButton.type = 'button';
            settingsButton.textContent = 'Flow preferences';
            settingsButton.addEventListener('click', () => preferences(wasRunning));
            card.append(settingsButton);
            content.append(card);
        }
        function thisWeek(wasRunning = game.isGameRunning && !game.isPaused) {
            const returnToTitle = !!game.titleShowing;
            if (wasRunning) game.pauseGame();
            const overlay = game.openOverlay('This week');
            overlayButton(returnToTitle ? 'Back to title' : 'Back to game', () => {
                game.closeOverlay(); delete game.playerOverlayResume;
                if (returnToTitle) game.showTitleOverlay();
                else { if (wasRunning) game.resumeGame(); refresh(); focusBoard(); }
            });
            content.lastElementChild.className = 'match-guide-close';
            const host = document.createElement('div');
            host.className = 'weekly-hub-host';
            content.append(host);
            const hub = root.InfiniteWeeklyHub;
            if (!hub) {
                overlayText('This week is unavailable in this shell. Guest play and the full Events tab still work.');
                overlayButton('Open full events', () => game.showWeeklyEvent());
                return;
            }
            let weekly = { state: 'loading', lines: ['Checking the weekly event…'] };
            let claimPending = false;
            const signedIn = !!game.getAuthToken();
            const pwaStatus = () => root.InfinitePWA?.status?.() || {};
            const draw = () => {
                if (game.activeOverlay !== overlay || !host.isConnected) return;
                hub.render(host, {
                    weekly,
                    signedIn,
                    rhythm: hub.rhythmView(game.weeklyRhythmDays || [], Date.now()),
                    rhythmEnabled: game.settings.weeklyRhythmEnabled === true,
                    pwa: pwaStatus(),
                }, {
                    claim: (eventId, wins) => claim(eventId, wins),
                    signIn: () => game.openSignIn(),
                    openEvents: () => game.showWeeklyEvent(),
                    setRhythmEnabled: (enabled) => {
                        game.settings.weeklyRhythmEnabled = enabled === true;
                        game.saveUserData();
                        draw();
                    },
                    clearRhythm: () => { game.clearWeeklyRhythm(); draw(); },
                    install: async () => { await root.InfinitePWA?.promptInstall?.(); draw(); },
                    applyUpdate: () => {
                        if (game.isGameRunning || game.levelStarting || game.powerUpPending || game.endlessCheckpointPending) {
                            status.textContent = 'Finish or bank the current run before restarting. The update will wait.';
                            return;
                        }
                        root.InfinitePWA?.applyUpdate?.();
                    },
                });
            };
            async function load() {
                try {
                    const { ok, data } = await game.fetchJson(signedIn ? '/api/live-ops/weekly' : '/api/live-ops/weekly/preview');
                    if (game.activeOverlay !== overlay) return;
                    weekly = ok && data.success !== false
                        ? hub.weeklySummary(data, signedIn, Date.now())
                        : { state: 'unavailable', lines: ['Weekly event unavailable right now. Guest puzzles remain playable.'] };
                } catch {
                    if (game.activeOverlay !== overlay) return;
                    weekly = { state: 'unavailable', lines: ['Weekly event unavailable offline. Guest puzzles remain playable.'] };
                }
                draw();
            }
            async function claim(eventId, wins) {
                if (claimPending) return;
                claimPending = true;
                status.textContent = 'Claiming free milestone…';
                try {
                    const { ok, data } = await game.fetchJson('/api/live-ops/weekly/claim', {
                        method: 'POST', body: JSON.stringify({ eventId, wins }),
                    });
                    if (game.activeOverlay !== overlay) return;
                    status.textContent = ok
                        ? data.result?.duplicate ? 'Already claimed. No second reward.' : `+${data.result?.coins || 0} free coins claimed.`
                        : data.error === 'weekly_wallet_full' ? 'Coin wallet full. Spend some coins and claim before the week ends.'
                            : data.error === 'weekly_event_closed' ? 'The week has ended or is paused; no new claim was granted.'
                                : `Not claimed: ${data.error || 'server unavailable'}.`;
                    await load();
                } catch {
                    if (game.activeOverlay === overlay) status.textContent = 'Could not confirm the claim. Reopen This week before retrying.';
                } finally {
                    claimPending = false;
                }
            }
            draw();
            void root.InfinitePWA?.refresh?.().then(draw);
            void load();
        }
        function flowSelect(labelText, key, options) {
            const label = document.createElement('label');
            const select = document.createElement('select');
            select.dataset[key] = 'true';
            select.setAttribute('aria-label', labelText);
            for (const [value, title] of options) {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = title;
                option.selected = value === game.settings[key];
                select.append(option);
            }
            select.addEventListener('change', () => {
                game.settings[key] = select.value;
                game.saveUserData();
                refresh();
            });
            label.append(document.createTextNode(labelText), select);
            content.append(label);
        }
        function credits(wasRunning = game.isGameRunning && !game.isPaused) {
            const returnToTitle = !!game.titleShowing;
            if (wasRunning) game.pauseGame();
            game.openOverlay('Credits & Attribution');
            overlayButton(returnToTitle ? 'Back to title' : 'Back to game', () => {
                game.closeOverlay(); delete game.playerOverlayResume;
                if (returnToTitle) game.showTitleOverlay();
                else { if (wasRunning) game.resumeGame(); refresh(); focusBoard(); }
            });
            content.lastElementChild.className = 'match-guide-close';

            overlayText('Infinite Match uses free-to-use / Creative Commons assets. Third-party tile sets are credited below; full license texts are in assets/licenses/.');

            overlayText('');
            overlayText('CC-BY 4.0 tile sets (attribution required):');
            const tileSets = window.InfiniteLevels?.EVENT_TILE_SETS;
            if (tileSets) {
                const ccbySets = Object.values(tileSets).filter((ts) => ts.license === 'CC-BY');
                for (const ts of ccbySets) {
                    const p = document.createElement('p');
                    p.textContent = `${ts.name} (${ts.id}) — Attribution: ${ts.attribution}. Source: ${ts.sourceUrl}`;
                    content.append(p);
                }
            } else {
                overlayText('diwali_2026 — Attribution: OpenGameArt.org community — https://opengameart.org/content/diwali-gem-tileset');
                overlayText('lunar_new_year_2027 — Attribution: OpenGameArt.org community — https://opengameart.org/content/lunar-new-year-gem-tileset');
                overlayText('womens_day_mar — Attribution: OpenGameArt.org community — https://opengameart.org/content/womens-day-gem-tileset');
            }

            overlayText('');
            overlayText('CC0 tile sets (no attribution required): Kenney.nl asset packs (Match-3, Winter, Spring, Summer, Autumn, Christmas, Halloween, St. Patrick, Valentine\'s, Easter, Holiday, Blocker, UI).');
            overlayText('All asset licenses and full license texts: assets/licenses/CC0-1.0.txt and assets/licenses/CC-BY-4.0.txt');
            overlayText('See THIRD_PARTY_NOTICES.md for the complete third-party asset inventory.');
        }
        // Fills the Explore card with the same wording as the Community events tab. Stale replies are dropped.
        function loadScoreChallengeLine(line) {
            const card = root.ScoreChallengeCard;
            if (!card) { line.textContent = 'Personal score challenge: unavailable right now.'; return; }
            const token = typeof game.getAuthToken === 'function' ? game.getAuthToken() : null;
            card.fetchView(token).then(({ ok, data }) => {
                if (!line.isConnected) return;
                line.textContent = ok
                    ? card.cardLines(data, card.clockNow(card.clockOffset(data.serverNow))).join(' ')
                    : 'Personal score challenge: unavailable right now.';
            }).catch(() => { if (line.isConnected) line.textContent = 'Personal score challenge: unavailable right now.'; });
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
            const musicLabel = document.createElement('label'); const musicChoice = document.createElement('input');
            musicChoice.type = 'checkbox'; musicChoice.dataset.musicChoice = 'true';
            musicChoice.checked = game.settings.music === true;
            musicChoice.addEventListener('change', (event) => { game.setMusic(musicChoice.checked, event); refresh(); });
            musicLabel.append(musicChoice, document.createTextNode('Music (optional, procedural)')); content.append(musicLabel);
            const musicVolumeLabel = document.createElement('label'); musicVolumeLabel.className = 'match-sound-volume';
            const musicVolume = document.createElement('input'); musicVolume.type = 'range'; musicVolume.min = '0'; musicVolume.max = '100'; musicVolume.step = '1';
            musicVolume.dataset.musicVolume = 'true'; musicVolume.setAttribute('aria-label', 'Music volume');
            const musicOutput = document.createElement('span'); musicOutput.dataset.musicVolumeLabel = 'true'; musicOutput.setAttribute('aria-hidden', 'true');
            musicVolume.addEventListener('input', (event) => { game.setMusicVolume(Number(musicVolume.value) / 100, event); refresh(); });
            musicVolumeLabel.append(document.createTextNode('Music volume'), musicVolume, musicOutput); content.append(musicVolumeLabel);
            for (const [key, title] of Object.entries({ textBoard: 'Text board (named cells and larger targets)', highContrast: 'High contrast', largeText: 'Larger HUD text', reduceAnimations: 'Reduced motion', impactEffects: 'Impact effects (particles and camera shake)', haptics: 'Touch vibration' })) {
                const label = document.createElement('label'); const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
                checkbox.checked = game.settings[key] === true; checkbox.disabled = key === 'textBoard' && !assistiveBoard; checkbox.addEventListener('change', () => {
                    game.settings[key] = checkbox.checked; game.saveUserData(); refresh();
                });
                label.append(checkbox, document.createTextNode(title)); content.append(label);
            }
            const endlessLabel = document.createElement('label'); const endlessChoice = document.createElement('input');
            endlessChoice.type = 'checkbox'; endlessChoice.dataset.endlessAutoContinue = 'true';
            endlessChoice.checked = game.settings.endlessAutoContinue === true;
            endlessChoice.addEventListener('change', () => {
                game.settings.endlessAutoContinue = endlessChoice.checked; game.saveUserData(); refresh();
            });
            endlessLabel.append(endlessChoice, document.createTextNode('Auto-bank signed-in Endless at a completed stage near 100,000 points or 3 hours, then start another run using 1 energy (no automatic refill). Only after the bank is confirmed. Optional, off by default.'));
            content.append(endlessLabel);
            const flowLabel = document.createElement('label'); const flowChoice = document.createElement('input');
            flowChoice.type = 'checkbox'; flowChoice.dataset.flowEnabled = 'true';
            flowChoice.checked = game.settings.flowEnabled !== false;
            flowChoice.addEventListener('change', () => {
                game.settings.flowEnabled = flowChoice.checked; game.saveUserData(); refresh();
            });
            flowLabel.append(flowChoice, document.createTextNode('Local flow suggestions (optional, no network, no difficulty changes)'));
            content.append(flowLabel);
            flowSelect('Session length', 'flowSession', [['short', 'Short (about 5 minutes)'], ['medium', 'Standard (about 15 minutes)'], ['long', 'Long (about 30 minutes)']]);
            flowSelect('Challenge preference', 'flowChallenge', [['relaxed', 'Relaxed (avoid clocks)'], ['steady', 'Steady'], ['spicy', 'Spicy (clocks are okay)']]);
            flowSelect('Preferred mode', 'flowMode', [['auto', 'Let flow suggest'], ['classic', 'Classic'], ['daily', 'Today’s Local Level'], ['timed', 'Timed'], ['endless', 'Endless']]);
            overlayButton('Clear local flow history', () => { game.clearFlowHistory(); });
            overlayText('Flow only suggests a mode and session shape from your explicit preferences and up to 20 recent local results. It never changes boards, difficulty, rewards, prices, energy, or offers, and it never starts a run by itself.');
            overlayText('Text board uses the same puzzle and rewards. Click two adjacent cells to swap; a special is selected rather than fired. Enter or Activate special fires it. Arrows, Home/End and Control Home/End navigate; Tab leaves. Narrow text boards scroll instead of shrinking targets. Keyboard focus reveals named cells even with this preference off.');
            overlayText('Sound is generated locally, with no downloads or microphone permission. System reduced motion is respected; sound and vibration are separate, optional preferences. Hints are always free.');
            refresh();
        }

        const assistiveBoard = root.InfiniteAssistiveBoard?.mount(game, surface, announce) || null;
        surface.tabIndex = assistiveBoard ? -1 : 0;
        refresh();
        return Object.freeze({ shell, surface, fields, powerups, announce, refresh, assistiveBoard, focusBoard, setResolution, openOverlay, closeOverlay, overlayText, overlayButton, renderKingdomPayoff, renderLossReview, renderKingdomScene,
            showPreferences: preferences, showThisWeek: thisWeek, status: proxy(status), bankButton: proxy(find('[data-action="bank"]')) });
    }

    root.InfinitePlayerExperience = Object.freeze({ get visuals() { return visuals; }, setVisuals, specialTypes, specialNames, drawGem, boardZoom, swipeCells, keyboardCell, mount });
})(globalThis);
