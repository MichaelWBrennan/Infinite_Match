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
                music: false,
                sfx: false,
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
        const loadingError = document.getElementById('loading-error');
        
        const updateProgress = (newProgress, text) => {
            progress = newProgress;
            if (loadingBar) {
                loadingBar.style.width = `${progress}%`;
            }
            if (loadingText) {
                loadingText.textContent = text || 'Loading...';
            }
        };
        
        // Simulate loading with progress updates
        const loadingSteps = [
            { progress: 25, text: 'Initializing game engine...', delay: 100 },
            { progress: 50, text: 'Loading game assets...', delay: 100 },
            { progress: 75, text: 'Setting up UI components...', delay: 100 },
            { progress: 100, text: 'Ready to play!', delay: 100 }
        ];
        
        let currentStep = 0;
        let runNextStep = () => {
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
        }, 3000);
        
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
            this.gameState.settings.sfx = window.game?.setSoundEffects(e.target.checked, e) || false;
            e.target.checked = this.gameState.settings.sfx;
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

    // ----- Community screen: season, friends, guild, and events. Values come from the server. -----
    // Text is set with textContent, never innerHTML, because names are chosen by players.
    showCommunity(tab = 'battlepass') {
        this.showScreen('community-screen');
        this.showCommunityTab(tab);
    }

    showCommunityTab(tab) {
        const tabs = ['battlepass', 'friends', 'guild', 'events'];
        const current = tabs.includes(tab) ? tab : 'battlepass';
        this.communityTab = current;
        document.querySelectorAll('.community-tab').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.tab === current);
        });
        const body = document.getElementById('community-body');
        if (!body) return;
        // A message from the last action (for example, a refused claim) shows once at the top.
        const flash = this.communityFlash;
        this.communityFlash = null;
        const show = (nodes) => {
            if (this.communityTab !== current) return; // a newer tab was opened while this loaded
            const top = flash ? [this.communityNote(flash)] : [];
            body.replaceChildren(...top, ...nodes);
        };
        show([this.communityNote('Loading…')]);
        const loaders = {
            battlepass: () => this.loadCommunitySeason(show),
            friends: () => this.loadCommunityFriends(show),
            guild: () => this.loadCommunityGuild(show),
            events: () => this.loadCommunityEvents(show),
        };
        loaders[current]().catch(() => {
            show([this.communityNote('Could not load this tab. Check your connection and try again.')]);
        });
    }

    communityEl(tag, text = '', className = '') {
        const el = document.createElement(tag);
        el.textContent = text === null || text === undefined ? '' : String(text);
        if (className) el.className = className;
        return el;
    }

    communityNote(text) {
        return this.communityEl('p', text, 'community-note');
    }

    communityButton(label, onClick) {
        const button = this.communityEl('button', label, 'community-btn');
        button.type = 'button';
        button.addEventListener('click', () => {
            Promise.resolve(onClick()).catch(() => {});
        });
        return button;
    }

    communityRow(text, buttonLabel, onClick) {
        const row = this.communityEl('div', '', 'community-row');
        row.appendChild(this.communityEl('span', text));
        if (buttonLabel) row.appendChild(this.communityButton(buttonLabel, onClick));
        return row;
    }

    communityForm(placeholder, buttonLabel, onSubmit) {
        const form = this.communityEl('div', '', 'community-form');
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = placeholder;
        input.maxLength = 40;
        input.className = 'community-input';
        const button = this.communityButton(buttonLabel, () => onSubmit(input.value.trim()));
        form.append(input, button);
        return form;
    }

    async communityRequest(url, options = {}) {
        const headers = { ...(options.headers || {}) };
        const token = this.getAuthToken();
        if (token) headers.Authorization = `Bearer ${token}`;
        if (options.body !== undefined) headers['Content-Type'] = 'application/json';
        const res = await fetch(url, { ...options, headers });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok && data.success !== false, data };
    }

    communityError(data) {
        return data && data.error ? String(data.error).replace(/_/g, ' ') : 'something went wrong';
    }

    // Runs a server action, remembers the outcome for the next render, and reloads the tab.
    async communityAction(url, method, tab, body) {
        const options = { method };
        if (body !== undefined) options.body = JSON.stringify(body);
        const result = await this.communityRequest(url, options);
        this.communityFlash = result.ok ? 'Done.' : `Not done: ${this.communityError(result.data)}.`;
        this.showCommunityTab(tab);
    }

    communityReward(reward) {
        if (!reward) return 'nothing';
        if (reward.coins !== undefined) return `${reward.coins} coins`;
        return `${reward.amount} × ${reward.item}`;
    }

    async loadCommunitySeason(show) {
        if (!this.getAuthToken()) return show([this.communityNote('Sign in to see your season progress.')]);
        const { ok, data } = await this.communityRequest('/api/battlepass/progress');
        if (!ok) return show([this.communityNote(`Season unavailable: ${this.communityError(data)}.`)]);
        const p = data.progress;
        const ends = p.status === 'active' && p.endsAt ? `ends ${new Date(p.endsAt).toLocaleDateString()}` : p.status;
        const nodes = [
            this.communityEl('h3', `${p.name} (${ends})`),
            this.communityNote(`Season XP ${p.xp} · tier ${p.tier}`),
        ];
        if (!p.premiumUnlocked) nodes.push(this.communityNote('The premium track is locked.'));
        for (const tier of p.tiers) {
            const row = this.communityEl('div', '', 'community-row');
            row.appendChild(this.communityEl('span', `Tier ${tier.level} · ${tier.xp} XP`));
            for (const track of ['free', 'premium']) {
                const reward = tier[track];
                const label = `${track}: ${this.communityReward(reward)}`;
                const claimed = (p.claimed[track] || []).includes(tier.level);
                const canClaim = reward && tier.reached && !claimed && (track === 'free' || p.premiumUnlocked);
                if (canClaim) {
                    row.appendChild(this.communityButton(`Claim ${label}`, () => this.claimCommunityTier(tier.level, track)));
                } else {
                    row.appendChild(this.communityEl('span', claimed ? `${label} (claimed)` : label));
                }
            }
            nodes.push(row);
        }
        show(nodes);
    }

    async claimCommunityTier(level, track) {
        await this.communityAction('/api/battlepass/claim', 'POST', 'battlepass', { level, track });
    }

    async loadCommunityFriends(show) {
        if (!this.getAuthToken()) return show([this.communityNote('Sign in to add friends.')]);
        const [me, friends, board] = await Promise.all([
            this.communityRequest('/api/social/me'),
            this.communityRequest('/api/social/friends'),
            this.communityRequest('/api/social/friends/leaderboard'),
        ]);
        if (!me.ok) return show([this.communityNote(`Friends unavailable: ${this.communityError(me.data)}.`)]);
        const profile = me.data.profile || {};
        const nodes = [this.communityNote(`Your friend code: ${profile.code || '—'}`)];
        nodes.push(this.communityForm('Display name (3–16 characters)', profile.name ? 'Change name' : 'Set name', (name) =>
            this.communityAction('/api/social/name', 'PUT', 'friends', { name })));
        nodes.push(this.communityForm('Friend code', 'Send request', (code) =>
            this.communityAction('/api/social/friends/request', 'POST', 'friends', { code })));

        nodes.push(this.communityEl('h3', 'Requests'));
        const incoming = (friends.ok && friends.data.incoming) || [];
        if (incoming.length === 0) nodes.push(this.communityNote('No pending requests.'));
        for (const r of incoming) {
            const row = this.communityEl('div', '', 'community-row');
            row.appendChild(this.communityEl('span', r.label));
            const id = encodeURIComponent(r.playerId);
            row.appendChild(this.communityButton('Accept', () => this.communityAction(`/api/social/friends/${id}/accept`, 'POST', 'friends')));
            row.appendChild(this.communityButton('Decline', () => this.communityAction(`/api/social/friends/${id}/decline`, 'POST', 'friends')));
            nodes.push(row);
        }

        nodes.push(this.communityEl('h3', 'Friends'));
        const list = (friends.ok && friends.data.friends) || [];
        if (list.length === 0) nodes.push(this.communityNote('No friends yet. Share your code to add them.'));
        for (const f of list) {
            const id = encodeURIComponent(f.playerId);
            nodes.push(this.communityRow(`${f.label} · best ${f.bestScore || 0}`, 'Remove', () =>
                this.communityAction(`/api/social/friends/${id}`, 'DELETE', 'friends')));
        }

        nodes.push(this.communityEl('h3', 'Best scores'));
        const rows = (board.ok && board.data.leaderboard) || [];
        if (rows.length === 0) nodes.push(this.communityNote('Add friends to see a board.'));
        for (const row of rows) {
            nodes.push(this.communityNote(`${row.rank}. ${row.label}${row.isYou ? ' (you)' : ''} — ${row.score}`));
        }
        show(nodes);
    }

    async loadCommunityGuild(show) {
        if (!this.getAuthToken()) return show([this.communityNote('Sign in to join a guild.')]);
        const mine = await this.communityRequest('/api/social/guilds/mine');
        if (!mine.ok) return show([this.communityNote(`Guilds unavailable: ${this.communityError(mine.data)}.`)]);
        const guild = mine.data.guild;
        if (guild) {
            const nodes = [
                this.communityEl('h3', `${guild.name} · ${guild.memberCount} members`),
                this.communityNote(guild.isOwner ? 'You lead this guild.' : 'You are a member.'),
            ];
            for (const m of guild.members || []) {
                nodes.push(this.communityNote(`${m.label}${m.isYou ? ' (you)' : ''} — best ${m.bestScore || 0}`));
            }
            nodes.push(this.communityButton('Leave guild', () => this.communityAction('/api/social/guilds/leave', 'POST', 'guild')));
            return show(nodes);
        }
        const nodes = [
            this.communityNote('You are not in a guild.'),
            this.communityForm('New guild name (3–16 characters)', 'Create guild', (name) =>
                this.communityAction('/api/social/guilds', 'POST', 'guild', { name })),
            this.communityEl('h3', 'Guilds to join'),
        ];
        const list = await this.communityRequest('/api/social/guilds');
        const guilds = (list.ok && list.data.guilds) || [];
        if (guilds.length === 0) nodes.push(this.communityNote('No guilds yet.'));
        for (const g of guilds) {
            const id = encodeURIComponent(g.id);
            nodes.push(this.communityRow(`${g.name} · ${g.memberCount} members`, 'Join', () =>
                this.communityAction(`/api/social/guilds/${id}/join`, 'POST', 'guild')));
        }
        show(nodes);
    }

    async loadCommunityEvents(show) {
        const signedIn = !!this.getAuthToken();
        const weekly = await this.communityRequest(signedIn ? '/api/live-ops/weekly' : '/api/live-ops/weekly/preview');
        const nodes = [this.communityEl('h3', 'This week’s free event')];
        if (!weekly.ok) {
            nodes.push(this.communityNote('Weekly event unavailable. Check your connection and try again.'));
        } else if (weekly.data.disabled) {
            nodes.push(this.communityNote('The weekly event is paused. Puzzles remain playable.'));
        } else if (!weekly.data.event) {
            nodes.push(this.communityNote('No weekly event is scheduled. Check back soon.'));
        } else {
            const event = weekly.data.event;
            nodes.push(this.communityEl('h4', event.name));
            nodes.push(this.communityNote(event.description));
            nodes.push(this.communityNote(event.status === 'upcoming'
                ? `Starts ${new Date(event.startsAt).toLocaleString()} (your time).`
                : `Ends ${new Date(event.endsAt).toLocaleString()} (your time). Claim before it ends; no late grants.`));
            nodes.push(this.communityNote('Weekly windows run Monday 00:00 UTC to the next Monday 00:00 UTC. Only server replay-verified classic/daily wins count; assisted wins remain unranked.'));
            if (!signedIn) nodes.push(this.communityNote('Sign in to save progress and claim free milestones. Guest puzzles remain playable.'));
            else if (event.status === 'active') {
                const meter = this.communityEl('progress');
                meter.max = Math.max(1, ...event.milestones.map((m) => m.wins));
                meter.value = Math.min(event.wins, meter.max);
                meter.setAttribute('aria-label', `${event.wins} verified wins toward ${meter.max}`);
                nodes.push(meter, this.communityNote(`${event.wins} replay-verified wins this week.`));
            }
            for (const milestone of event.milestones) {
                const label = `${milestone.wins} ${milestone.wins === 1 ? 'win' : 'wins'} · ${milestone.coins} coins${milestone.claimed ? ' · claimed' : ''}`;
                nodes.push(this.communityRow(label, milestone.canClaim ? 'Claim free coins' : null, milestone.canClaim
                    ? () => this.claimWeekly(event.id, milestone.wins) : null));
            }
        }
        if (!signedIn) return show(nodes);
        const [comp, today] = await Promise.all([
            this.communityRequest('/api/live-ops/competitions'),
            this.communityRequest('/api/live-ops/today'),
        ]);
        if (!comp.ok) { nodes.push(this.communityNote(`Other events unavailable: ${this.communityError(comp.data)}.`)); return show(nodes); }
        nodes.push(this.communityEl('h3', 'Tournaments'));
        const tournaments = comp.data.tournaments || [];
        if (tournaments.length === 0) nodes.push(this.communityNote('No tournament is running.'));
        for (const t of tournaments) {
            nodes.push(this.communityEl('p', `${t.name}${t.endsAt ? ` · ends ${new Date(t.endsAt).toLocaleDateString()}` : ''}`));
            for (const e of t.entries || []) nodes.push(this.communityNote(`${e.rank}. ${e.label} — ${e.score}`));
            const you = t.you;
            nodes.push(this.communityNote(you && you.rank ? `Your place: ${you.rank}` : 'Win a level to enter the board.'));
        }
        nodes.push(this.communityEl('h3', 'Community challenges'));
        const challenges = comp.data.challenges || [];
        if (challenges.length === 0) nodes.push(this.communityNote('No challenge is running.'));
        for (const c of challenges) {
            const label = `${c.name}: ${c.progress}/${c.goal} wins`;
            if (c.canClaim) {
                nodes.push(this.communityRow(label, 'Claim reward', () =>
                    this.communityAction(`/api/live-ops/challenges/${encodeURIComponent(c.id)}/claim`, 'POST', 'events')));
            } else {
                nodes.push(this.communityRow(c.claimed ? `${label} (reward claimed)` : label));
            }
        }
        nodes.push(this.communityEl('h3', 'Deals'));
        const deals = (today.ok && today.data.deals) || [];
        if (deals.length === 0) nodes.push(this.communityNote('No deals right now.'));
        for (const d of deals) {
            const price = (d.priceCents / 100).toFixed(2);
            const was = (d.catalogPriceCents / 100).toFixed(2);
            nodes.push(this.communityNote(`${d.productId}: $${price} (was $${was})`));
        }
        const events = (today.ok && today.data.activeEvents) || [];
        if (events.length > 0) nodes.push(this.communityEl('h3', 'Live events'));
        for (const e of events) nodes.push(this.communityNote(`${e.name} — ${e.description || ''}`));
        show(nodes);
    }

    async claimWeekly(eventId, wins) {
        if (this.weeklyClaimPending) return;
        this.weeklyClaimPending = true;
        try {
            const { ok, data } = await this.communityRequest('/api/live-ops/weekly/claim', {
                method: 'POST', body: JSON.stringify({ eventId, wins }),
            });
            this.communityFlash = ok ? data.result.duplicate ? 'Already claimed. No second reward.'
                : `+${data.result.coins} free coins. Balance: ${data.result.balance}.`
                : data.error === 'weekly_wallet_full' ? 'Coin wallet full. Spend some coins and claim before the week ends.'
                    : data.error === 'weekly_event_closed' ? 'The week has ended or the event is paused; no new claim was granted.'
                        : `Not claimed: ${this.communityError(data)}.`;
        } catch (error) {
            this.communityFlash = 'Could not confirm the claim. Reopen Events to check it before retrying.';
        } finally {
            this.weeklyClaimPending = false;
            if (this.communityTab === 'events') this.showCommunityTab('events');
        }
    }

    // ----- Offers: coin packs and deals at the server's current prices, and live events. -----
    // Prices come from GET /api/live-ops/offers, the same catalog the server charges from.
    showOffers() {
        this.showScreen('offers-screen');
        this.loadOffers();
    }

    setOffersStatus(text) {
        const el = document.getElementById('offers-status');
        if (el) el.textContent = text;
    }

    async loadOffers() {
        const list = document.getElementById('offers-list');
        if (!list) return;
        list.replaceChildren(this.communityNote('Loading offers…'));
        try {
            const res = await fetch('/api/live-ops/offers');
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                return list.replaceChildren(this.communityNote('Offers are not available right now.'));
            }
            const nodes = [this.communityEl('h3', 'Coin packs')];
            for (const pack of data.coinPacks || []) {
                const price = `$${(pack.priceCents / 100).toFixed(2)}`;
                const was = pack.deal ? ` (was $${(pack.catalogPriceCents / 100).toFixed(2)})` : '';
                const ends = pack.endsAt ? ` · deal ends ${new Date(pack.endsAt).toLocaleString()}` : '';
                nodes.push(this.communityRow(
                    `${Number(pack.coins).toLocaleString()} coins · ${price}${was}${ends}`,
                    'Buy',
                    () => this.buyCoinPack(pack.productId),
                ));
            }
            if (!this.getAuthToken()) nodes.push(this.communityNote('Sign in to buy coins.'));

            const events = [...(data.activeEvents || [])];
            nodes.push(this.communityEl('h3', 'Live events'));
            if (events.length === 0) nodes.push(this.communityNote('No event is running right now.'));
            for (const e of events) {
                nodes.push(this.communityNote(`${e.name} — ${e.description || ''} (ends ${new Date(e.endsAt).toLocaleString()})`));
            }
            if ((data.upcomingEvents || []).length > 0) {
                nodes.push(this.communityEl('h3', 'Coming up'));
                for (const e of data.upcomingEvents) {
                    nodes.push(this.communityNote(`${e.name} — starts ${new Date(e.startsAt).toLocaleString()}`));
                }
            }
            list.replaceChildren(...nodes);
        } catch (error) {
            list.replaceChildren(this.communityNote('Could not load offers. Check your connection and try again.'));
        }
    }

    // Starts a hosted Stripe Checkout for one coin pack. The server sets the price and credits the coins.
    async buyCoinPack(productId) {
        if (!this.getAuthToken()) return this.setOffersStatus('Sign in to buy coins.');
        this.setOffersStatus('Opening checkout…');
        try {
            const { ok, data } = await this.communityRequest('/api/stripe/checkout-session', {
                method: 'POST',
                body: JSON.stringify({ productId }),
            });
            if (!ok || !data.url) return this.setOffersStatus(`Not done: ${this.communityError(data)}.`);
            window.location.href = data.url;
        } catch (error) {
            this.setOffersStatus('Could not reach the store. Try again.');
        }
    }

    // ----- Mini-games: one paid play per game per UTC day. The server pays for the score. -----
    showMiniGames() {
        this.showScreen('minigames-screen');
        this.loadMiniGames();
    }

    async loadMiniGames() {
        const list = document.getElementById('minigames-list');
        if (!list) return;
        const games = [
            { id: 'memory', name: 'Memory Match', blurb: 'Find all 8 pairs. Fewer moves score more (up to 100).' },
            { id: 'treasure', name: 'Treasure Dig', blurb: 'Dig to find the treasure. Each dig shows how far it is (up to 12).' },
            { id: 'rhythm', name: 'Rhythm Tap', blurb: 'Tap on the beat, 16 beats in all (up to 16).' },
        ];
        let played = {};
        if (this.getAuthToken()) {
            const r = await this.communityRequest('/api/minigames');
            if (r.ok) played = Object.fromEntries(r.data.games.map((g) => [g.id, g.playedToday]));
        }
        const nodes = [];
        if (!this.getAuthToken()) nodes.push(this.communityNote('Sign in to be paid for mini-games. You can still play.'));
        for (const g of games) {
            const paid = played[g.id] ? ' (paid today)' : '';
            nodes.push(this.communityRow(`${g.name}${paid}: ${g.blurb}`, 'Play', () => this.startMinigame(g.id)));
        }
        list.replaceChildren(...nodes);
    }

    startMinigame(id) {
        const stage = document.getElementById('minigame-stage');
        if (!stage) return;
        if (id === 'memory') this.runMemoryGame(stage);
        else if (id === 'treasure') this.runTreasureGame(stage);
        else if (id === 'rhythm') this.runRhythmGame(stage);
    }

    // Sends the score to the server, shows what was paid, and offers to go back to the list.
    async finishMinigame(gameId, score, stage, summary) {
        const nodes = [this.communityEl('h3', `Score ${score}`), this.communityNote(summary)];
        if (!this.getAuthToken()) {
            nodes.push(this.communityNote('Sign in to be paid for this score.'));
        } else {
            try {
                const r = await this.communityRequest(`/api/minigames/${encodeURIComponent(gameId)}/complete`, {
                    method: 'POST',
                    body: JSON.stringify({ score }),
                });
                if (r.ok) {
                    nodes.push(this.communityNote(`+${r.data.result.coins} coins. Balance ${r.data.result.balance}.`));
                } else if (r.data.error === 'already_played_today') {
                    nodes.push(this.communityNote('You have already been paid for this game today.'));
                } else {
                    nodes.push(this.communityNote(`Not paid: ${this.communityError(r.data)}.`));
                }
            } catch (error) {
                nodes.push(this.communityNote('Could not reach the server. This score was not paid.'));
            }
        }
        nodes.push(this.communityButton('Back to mini-games', () => {
            stage.replaceChildren();
            this.loadMiniGames();
        }));
        stage.replaceChildren(...nodes);
    }

    // Memory: flip two cards at a time. Score 100 at 8 moves, minus 5 for each extra move.
    runMemoryGame(stage) {
        const symbols = ['★', '♛', '♦', '♣', '♥', '☀', '☾', '✿'];
        const deck = [...symbols, ...symbols];
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        let first = null;
        let busy = false;
        let moves = 0;
        let matched = 0;
        const status = this.communityNote('Moves: 0 · Pairs: 0 / 8');
        const grid = this.communityEl('div', '', 'minigame-grid');
        grid.style.gridTemplateColumns = 'repeat(4, 64px)';
        for (const symbol of deck) {
            const card = this.communityEl('button', '?', 'minigame-card');
            card.type = 'button';
            card.addEventListener('click', () => {
                if (busy || card.classList.contains('open') || card.classList.contains('matched')) return;
                card.textContent = symbol;
                card.classList.add('open');
                if (!first) {
                    first = { card, symbol };
                    return;
                }
                const other = first;
                first = null;
                moves++;
                if (other.symbol === symbol) {
                    other.card.classList.add('matched');
                    card.classList.add('matched');
                    matched++;
                } else {
                    busy = true;
                    setTimeout(() => {
                        for (const c of [other.card, card]) {
                            c.textContent = '?';
                            c.classList.remove('open');
                        }
                        busy = false;
                    }, 700);
                }
                status.textContent = `Moves: ${moves} · Pairs: ${matched} / ${symbols.length}`;
                if (matched === symbols.length) {
                    const score = Math.max(0, 100 - 5 * Math.max(0, moves - symbols.length));
                    this.finishMinigame('memory', score, stage, `Found all ${symbols.length} pairs in ${moves} moves.`);
                }
            });
            grid.appendChild(card);
        }
        stage.replaceChildren(this.communityEl('h3', 'Memory Match'), status, grid);
    }

    // Treasure: one hidden tile in a 5 by 5 field, 12 digs. Each dig shows the distance to the
    // treasure (0 is the treasure). Score is the digs left plus one: 1 to 12.
    runTreasureGame(stage) {
        const size = 5;
        const digsTotal = 12;
        const treasure = Math.floor(Math.random() * size * size);
        const tr = Math.floor(treasure / size);
        const tc = treasure % size;
        let digs = 0;
        let done = false;
        const status = this.communityNote(`Digs left: ${digsTotal}. Each dig shows how far the treasure is.`);
        const grid = this.communityEl('div', '', 'minigame-grid');
        grid.style.gridTemplateColumns = `repeat(${size}, 56px)`;
        for (let i = 0; i < size * size; i++) {
            const cell = this.communityEl('button', '', 'minigame-card');
            cell.type = 'button';
            cell.addEventListener('click', () => {
                if (done || cell.classList.contains('dug')) return;
                digs++;
                cell.classList.add('dug');
                const distance = Math.abs(Math.floor(i / size) - tr) + Math.abs((i % size) - tc);
                const left = digsTotal - digs;
                if (distance === 0) {
                    done = true;
                    cell.textContent = '★';
                    return this.finishMinigame('treasure', left + 1, stage, `Found the treasure with ${digs} digs.`);
                }
                cell.textContent = String(distance);
                if (left === 0) {
                    done = true;
                    return this.finishMinigame('treasure', 0, stage, 'Out of digs. The treasure was not found.');
                }
                status.textContent = `Digs left: ${left}. Last dig: ${distance} away.`;
            });
            grid.appendChild(cell);
        }
        stage.replaceChildren(this.communityEl('h3', 'Treasure Dig'), status, grid);
    }

    // Rhythm: 16 beats, 600 ms apart. A tap within 150 ms of a beat scores it, once per beat.
    runRhythmGame(stage) {
        const beats = 16;
        const interval = 600;
        const window = 150;
        const lead = 1200;
        const hitBeats = new Set();
        let hits = 0;
        let started = false;
        let finished = false;
        let t0 = 0;
        const status = this.communityNote('Get ready…');
        const pad = this.communityButton('TAP', () => onTap());
        pad.classList.add('minigame-pad');
        const onTap = () => {
            if (!started || finished) return;
            const now = performance.now();
            const i = Math.round((now - t0) / interval);
            if (i >= 0 && i < beats && !hitBeats.has(i) && Math.abs(now - (t0 + i * interval)) <= window) {
                hitBeats.add(i);
                hits++;
                status.textContent = `Hit ${hits} / ${beats}`;
            } else {
                status.textContent = `Off the beat. Hit ${hits} / ${beats}`;
            }
        };
        stage.replaceChildren(this.communityEl('h3', 'Rhythm Tap'), status, pad);
        setTimeout(() => {
            t0 = performance.now();
            started = true;
            status.textContent = 'Tap on the beat.';
            for (let i = 0; i < beats; i++) {
                setTimeout(() => {
                    pad.classList.add('beat');
                    setTimeout(() => pad.classList.remove('beat'), 150);
                }, i * interval);
            }
            setTimeout(() => {
                finished = true;
                this.finishMinigame('rhythm', hits, stage, `Hit ${hits} of ${beats} beats.`);
            }, beats * interval + window + 200);
        }, lead);
    }

    showLevelSelect() {
        this.showScreen('level-select');
        const current = window.game?.campaignLevel || window.game?.level || 1;
        this.levelWindow = Math.max(1, current - 2);
        this.renderProceduralLevels();
    }

    renderProceduralLevels() {
        const grid = document.getElementById('procedural-level-grid');
        if (!grid) return;
        grid.replaceChildren();
        const start = this.levelWindow || 1;
        const end = Math.min(Number.MAX_SAFE_INTEGER, start + 19);
        for (let number = start; number <= end; number++) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'level-card-royal procedural-level-card';
            button.textContent = `${number % 10 === 0 ? 'Boss' : 'Level'} ${number}`;
            button.addEventListener('click', () => window.selectLevel(number));
            grid.append(button);
        }
        document.getElementById('level-page-label').textContent = `${start}–${end}`;
        document.getElementById('next-level-page').disabled = end === Number.MAX_SAFE_INTEGER;
    }

    pageLevels(direction) {
        this.levelWindow = Math.max(1, Math.min(Number.MAX_SAFE_INTEGER - 19, (this.levelWindow || 1) + direction * 20));
        this.renderProceduralLevels();
    }

    jumpToGeneratedLevel() {
        const number = Number(document.getElementById('generated-level-number').value);
        const message = document.getElementById('generated-level-message');
        if (!Number.isSafeInteger(number) || number < 1) {
            message.textContent = 'Enter a positive whole level number.';
            return;
        }
        message.textContent = '';
        return window.selectLevel(number);
    }

    showNews() {
        this.showScreen('news-screen');
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
            if (typeof modal.showModal === 'function' && !modal.open) modal.showModal();
            // Reset forms
            this.resetLoginForms();
            document.getElementById('login-player-id')?.focus();
        } else {
            console.error('Login modal not found in DOM');
        }
    }

    closeLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.remove('active');
            if (modal.open && typeof modal.close === 'function') modal.close();
        }
        window.game?.closeSignIn?.();
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
                // Lets the canvas game refresh its energy and title for the new session.
                window.dispatchEvent(new Event('auth:changed'));
                
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
                // Lets the canvas game refresh its energy and title for the new session.
                window.dispatchEvent(new Event('auth:changed'));
                
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

            // Economy endpoints require a signed-in session. Guests have no
            // token, so skip the sync instead of calling a route that will 401.
            if (!this.getAuthToken()) {
                console.log('Guest session: account economy sync starts after login');
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
        // platform-detection.js exposes the detected platform as a property;
        // it has no getCurrentPlatform() method.
        if (window.platformDetector && window.platformDetector.currentPlatform) {
            return window.platformDetector.currentPlatform;
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

// Global functions for HTML onclick events.
//
// Two objects, one job each:
//   window.ui   the DOM controller (InfiniteMatchGame). Menus, settings, login, and register.
//   window.game the Phaser game (PhaserMatch3Game). Gameplay and everything drawn on the canvas.
// Each wrapper goes to exactly one of them. Before this split, menu calls reached the Phaser game,
// which had no such methods, and handleLogin() threw a TypeError.

// Creates the DOM controller once. The page never creates a second one: each new instance runs
// its own loading sequence and timers.
function initializeGame() {
    if (window.ui) return true;
    if (typeof InfiniteMatchGame === 'undefined') {
        console.error('❌ InfiniteMatchGame class not available');
        return false;
    }
    try {
        window.ui = new InfiniteMatchGame();
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize the menu controller:', error);
        return false;
    }
}

// Calls a DOM controller method. Logs and does nothing if the method is missing.
function callUi(method, ...args) {
    if (!initializeGame() || typeof window.ui[method] !== 'function') {
        console.error(`Menu controller cannot run ${method}`);
        return undefined;
    }
    return window.ui[method](...args);
}

// Calls a Phaser game method. Logs and does nothing before the game exists.
function callGame(method, ...args) {
    if (!window.game || typeof window.game[method] !== 'function') {
        console.warn(`The game is not ready for ${method}`);
        return undefined;
    }
    return window.game[method](...args);
}

// Menus, settings, and account (DOM controller).
function showModeSelect() { return callUi('showModeSelect'); }
function showSettings() { return callUi('showSettings'); }
function showTitle() { return callUi('showTitle'); }
function showLevelSelect() { return callUi('showLevelSelect'); }
function showNews() { return callUi('showNews'); }
function showOffers() { return callUi('showOffers'); }
function showLeaderboard() { return callUi('showLeaderboard'); }
function showCommunity(tab) { return callUi('showCommunity', tab); }
function showMiniGames() { return callUi('showMiniGames'); }
// Mode cards. Classic and timed open the level list; endless starts a run at once.
function chooseMode(mode) {
    callGame('setMode', mode);
    if (mode === 'endless') {
        revealCanvas();
        return callGame('startEndless');
    }
    if (mode === 'daily') {
        revealCanvas();
        return callGame('startDaily');
    }
    return callUi('showLevelSelect');
}
function closeModal() { return callUi('closeModal'); }
function closeTutorial() { return callUi('closeTutorial'); }
function showAdvancedSettings() { return callUi('showAdvancedSettings'); }
function closeLoginModal() { return callUi('closeLoginModal'); }
function switchLoginTab(tab) { return callUi('switchLoginTab', tab); }
function handleLogin() { return callUi('handleLogin'); }
function handleRegister() { return callUi('handleRegister'); }
function syncWithPlatform(platform) { return callUi('syncWithPlatform', platform); }

function showLoginModal() {
    if (initializeGame() && typeof window.ui.showLoginModal === 'function') {
        return window.ui.showLoginModal();
    }
    // Last resort when the controller is missing: show the modal markup directly.
    const loginModal = document.getElementById('login-modal');
    if (loginModal) loginModal.classList.add('active');
    else console.error('❌ Login modal not found');
    return undefined;
}

// Gameplay (Phaser game).
// Gameplay entry points bring the canvas back if a DOM menu hid it.
function revealCanvas() {
    if (typeof window.showGameCanvas === 'function') window.showGameCanvas();
}

function startGame() { revealCanvas(); return callGame('requestStart'); }
function pauseGame() { return callGame('pauseGame'); }
function usePowerUp(type) { return callGame('usePowerUp', type); }
function nextLevel() { revealCanvas(); return callGame('nextLevel'); }
function selectLevel(levelNumber) { revealCanvas(); return callGame('selectLevel', levelNumber); }

// Create the DOM controller as soon as this script loads, so menus work before any click.
initializeGame();

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
    // Native dialogs/forms own their Enter/Escape actions; do not also start or pause a game.
    if (e.defaultPrevented || e.target?.closest?.('input, textarea, select, button, dialog, [contenteditable="true"]')) return;
    switch(e.key) {
        case 'Escape':
            if (window.game && window.game.isGameRunning) {
                window.game.pauseGame();
            }
            break;
        case 'Enter':
            // On the canvas title screen, Enter presses Play.
            if (window.game && window.game.titleShowing) {
                window.game.requestStart();
            }
            break;
    }
});

// Compatibility forwarding: the playable Phaser controller owns opt-in local audio.
function playSound(soundType) {
    return window.game?.playSound(soundType) || false;
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