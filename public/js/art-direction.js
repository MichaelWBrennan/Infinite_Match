/* Infinite Match — Celestial Facets art direction.
 * One original, deterministic vector system for gems, badges, terrain, boosters,
 * and the brand mark. No downloaded tile pack, emoji font, or remote texture is
 * required. The shared level palette supplies identity; this module supplies the
 * consistent silhouette, lighting, outline, and export contract.
 */
(function (root) {
    'use strict';

    const VERSION = 'celestial-facets-v1';
    const SIZE = 64;
    const INK = '#10213a';
    const PAPER = '#f8fbff';
    const GOLD = '#f5d58b';
    const SHADOW = '#06152b';
    const SLOT_SHAPES = Object.freeze(['heart', 'diamond', 'square', 'triangle', 'hexagon', 'star']);
    const SPECIAL_TYPES = Object.freeze(['row', 'column', 'burst', 'prism']);
    const BOOSTERS = Object.freeze(['blast', 'ray', 'prism', 'bolt', 'facet', 'mark', 'nova', 'spectrum', 'shift', 'hammer']);
    const TERRAIN = Object.freeze(['blocker', 'locked', 'jelly', 'chocolate', 'liquorice', 'marmalade', 'frosting', 'delivery',
        'heat_haze', 'cloud_shadow', 'overcast', 'raindrop', 'snow_cover', 'ice', 'lightning', 'mist']);
    const FALLBACK_GEMS = Object.freeze([
        { id: 'red', color: '#ff6384', symbol: 'R' },
        { id: 'blue', color: '#62baff', symbol: 'B' },
        { id: 'green', color: '#58dfa9', symbol: 'G' },
        { id: 'yellow', color: '#ffe278', symbol: 'Y' },
        { id: 'purple', color: '#be9cff', symbol: 'P' },
        { id: 'orange', color: '#ffad66', symbol: 'O' },
    ]);

    function channels(hex) {
        const value = String(hex || '').replace('#', '');
        const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
        const n = Number.parseInt(full, 16);
        return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [98, 186, 255];
    }
    function hex(rgb) {
        return '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
    }
    function mix(a, b, t) {
        const x = channels(a); const y = channels(b);
        return hex(x.map((v, i) => v + (y[i] - v) * t));
    }
    function luminance(color) {
        const [r, g, b] = channels(color).map((v) => {
            const s = v / 255;
            return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    function contrast(a, b) {
        const x = luminance(a); const y = luminance(b);
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    }
    /** Keep every jewel in a readable luminance band while preserving its hue. */
    function jewelColor(color) {
        let value = /^#[0-9a-f]{6}$/i.test(color || '') ? color : '#62baff';
        const target = luminance(value) < 0.30 ? PAPER : INK;
        let low = 0; let high = 1;
        for (let i = 0; i < 14; i++) {
            const t = (low + high) / 2;
            const candidate = mix(value, target, t);
            const lum = luminance(candidate);
            if ((target === PAPER && lum < 0.30) || (target === INK && lum > 0.55)) low = t;
            else high = t;
        }
        value = mix(value, target, high);
        return contrast(value, INK) >= 4.5 ? value : mix(value, PAPER, 0.5);
    }

    function normalizeSet(gems, themeId) {
        const used = new Set();
        return gems.map((gem, slot) => {
            let symbol = String(gem.symbol || gem.id.charAt(0)).toUpperCase().charAt(0);
            if (used.has(symbol)) symbol = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((letter) => !used.has(letter)) || String(slot + 1);
            used.add(symbol);
            return Object.freeze({ ...gem, themeId, slot, shape: SLOT_SHAPES[slot % SLOT_SHAPES.length], symbol, color: jewelColor(gem.color) });
        });
    }
    function tileSets() {
        const levels = root.InfiniteLevels;
        if (!levels) return [{ id: 'standard', name: 'Standard', gems: FALLBACK_GEMS }];
        return [levels.DEFAULT_TILE_SET, ...Object.values(levels.SEASON_TILE_SETS || {}), ...Object.values(levels.EVENT_TILE_SETS || {}),
            ...Object.values(levels.WEATHER_TILE_SETS || {}), ...Object.values(levels.HOLIDAY_TILE_SETS || {})].filter(Boolean);
    }
    function visualsForSet(set) {
        return Object.freeze(Object.fromEntries(normalizeSet(set.gems, set.id).map((gem) => [gem.id, gem])));
    }
    function findGem(type) {
        for (const set of tileSets()) {
            const gem = set.gems.find((entry) => entry.id === type);
            if (gem) return gem;
        }
        return null;
    }
    function visualsForContext(context = {}, types = null) {
        const levels = root.InfiniteLevels;
        const set = levels?.tileSetForContext ? levels.tileSetForContext(context) : { id: 'standard', gems: FALLBACK_GEMS };
        if (!Array.isArray(types) || !types.length) return visualsForSet(set);
        // The generator may prioritize a legacy/base color outside the active theme.
        // Render the actual board palette, assigning the six accessible silhouettes
        // by board slot so every visible gem stays distinct.
        const used = new Set();
        const entries = types.map((type, slot) => {
            const source = set.gems.find((gem) => gem.id === type) || findGem(type) || FALLBACK_GEMS[slot % FALLBACK_GEMS.length];
            let symbol = String(source.symbol || type.charAt(0)).toUpperCase().charAt(0);
            if (used.has(symbol)) symbol = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((letter) => !used.has(letter)) || String(slot + 1);
            used.add(symbol);
            return [type, Object.freeze({ ...source, id: type, themeId: set.id, slot, shape: SLOT_SHAPES[slot % SLOT_SHAPES.length], symbol, color: jewelColor(source.color) })];
        });
        return Object.freeze(Object.fromEntries(entries));
    }
    function themeCatalog() {
        return tileSets().map((set) => ({ id: set.id, name: set.name, background: set.background || '#0c1445', accent: set.accent || GOLD,
            gems: normalizeSet(set.gems, set.id) }));
    }

    let current = visualsForContext({});
    function setContext(context, types = null) {
        current = visualsForContext(context || {}, types);
        return current;
    }
    function styleFor(type, override) {
        if (override && override[type]) return override[type];
        if (current[type]) return current[type];
        const gem = findGem(type);
        if (gem) return normalizeSet([gem], 'legacy')[0];
        const slot = Math.abs(String(type).split('').reduce((n, c) => n + c.charCodeAt(0), 0)) % 6;
        return normalizeSet(FALLBACK_GEMS, 'standard')[slot];
    }

    function polygon(context, points) {
        context.beginPath();
        points.forEach(([x, y], i) => i ? context.lineTo(x, y) : context.moveTo(x, y));
        context.closePath();
    }
    function starPoints(cx, cy, outer, inner, count = 5) {
        return Array.from({ length: count * 2 }, (_, i) => {
            const radius = i % 2 ? inner : outer;
            const angle = -Math.PI / 2 + i * Math.PI / count;
            return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
        });
    }
    function shapePath(context, shape) {
        context.beginPath();
        if (shape === 'heart') {
            context.moveTo(32, 57); context.bezierCurveTo(5, 40, 1, 20, 15, 10);
            context.bezierCurveTo(23, 5, 30, 10, 32, 16); context.bezierCurveTo(35, 7, 50, 5, 58, 17);
            context.bezierCurveTo(64, 33, 44, 49, 32, 57); context.closePath();
        } else if (shape === 'square') {
            context.roundRect(7, 7, 50, 50, 11);
        } else if (shape === 'diamond') {
            polygon(context, [[32, 4], [59, 32], [32, 60], [5, 32]]);
        } else if (shape === 'triangle') {
            polygon(context, [[32, 5], [60, 56], [4, 56]]);
        } else if (shape === 'star') {
            polygon(context, starPoints(32, 33, 29, 15));
        } else {
            polygon(context, Array.from({ length: 6 }, (_, i) => {
                const angle = -Math.PI / 2 + i * Math.PI / 3;
                return [32 + Math.cos(angle) * 28, 32 + Math.sin(angle) * 28];
            }));
        }
    }
    function line(context, points) {
        context.beginPath();
        points.forEach(([x, y], i) => i ? context.lineTo(x, y) : context.moveTo(x, y));
        context.stroke();
    }
    function badge(context, x, y, text, fill = INK, stroke = GOLD) {
        context.save();
        context.beginPath(); context.roundRect(x, y, 22, 22, 8);
        context.fillStyle = fill; context.fill();
        context.lineWidth = 2; context.strokeStyle = stroke; context.stroke();
        context.fillStyle = PAPER; context.font = 'bold 15px system-ui, sans-serif';
        context.textAlign = 'center'; context.textBaseline = 'middle';
        context.fillText(String(text), x + 11, y + 11.5);
        context.restore();
    }

    function drawGem(context, type, special = null, override = null) {
        const style = styleFor(type, override);
        context.save();
        context.clearRect(0, 0, SIZE, SIZE);
        context.lineJoin = 'round'; context.lineCap = 'round';
        shapePath(context, style.shape);
        const gradient = context.createLinearGradient(0, 5, 0, 59);
        gradient.addColorStop(0, mix(style.color, PAPER, 0.42));
        gradient.addColorStop(0.42, style.color);
        gradient.addColorStop(1, mix(style.color, SHADOW, 0.22));
        context.fillStyle = gradient; context.fill();
        context.lineWidth = 3; context.strokeStyle = INK; context.stroke();
        // One restrained bevel and one glint, identical for every theme.
        context.save(); context.clip();
        context.fillStyle = 'rgba(255,255,255,0.20)';
        polygon(context, [[5, 5], [42, 5], [18, 34]]); context.fill();
        context.fillStyle = 'rgba(6,21,43,0.12)';
        polygon(context, [[59, 28], [59, 61], [24, 61]]); context.fill();
        context.restore();
        shapePath(context, style.shape);
        context.lineWidth = 1.2; context.strokeStyle = 'rgba(255,255,255,0.58)'; context.stroke();
        context.beginPath(); context.moveTo(17, 17); context.lineTo(23, 12);
        context.lineWidth = 2.4; context.strokeStyle = 'rgba(255,255,255,0.82)'; context.stroke();
        const y = style.shape === 'triangle' ? 39 : 33;
        context.font = 'bold 21px system-ui, sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle';
        context.fillStyle = INK; context.fillText(style.symbol, 32, y);
        if (SPECIAL_TYPES.includes(special)) {
            context.beginPath(); context.roundRect(37, 37, 25, 25, 8);
            context.fillStyle = INK; context.fill(); context.lineWidth = 2; context.strokeStyle = GOLD; context.stroke();
            context.strokeStyle = PAPER; context.fillStyle = PAPER; context.lineWidth = 2.4;
            if (special === 'row') {
                line(context, [[42, 49.5], [57, 49.5]]); line(context, [[45, 46], [41.5, 49.5], [45, 53]]); line(context, [[54, 46], [57.5, 49.5], [54, 53]]);
            } else if (special === 'column') {
                line(context, [[49.5, 42], [49.5, 57]]); line(context, [[46, 45], [49.5, 41.5], [53, 45]]); line(context, [[46, 54], [49.5, 57.5], [53, 54]]);
            } else if (special === 'burst') {
                line(context, [[49.5, 42], [49.5, 57]]); line(context, [[42, 49.5], [57, 49.5]]);
                line(context, [[44, 44], [55, 55]]); line(context, [[55, 44], [44, 55]]);
            } else {
                polygon(context, starPoints(49.5, 49.5, 8, 3.4, 4)); context.fill();
            }
        }
        context.restore();
    }

    function drawShield(context, layers = 1) {
        context.save();
        context.lineJoin = 'round';
        context.beginPath(); context.roundRect(3, 3, 58, 58, 10);
        context.lineWidth = layers > 1 ? 4 : 2.5; context.strokeStyle = layers > 1 ? GOLD : '#cfe8ff'; context.stroke();
        context.fillStyle = INK;
        for (const [x, y] of [[7, 7], [57, 7], [7, 57], [57, 57]]) { context.beginPath(); context.arc(x, y, 2.2, 0, Math.PI * 2); context.fill(); }
        badge(context, 39, 1, layers);
        context.restore();
    }

    const TERRAIN_COLORS = Object.freeze({
        blocker: '#f5d58b', locked: '#ffd166', jelly: '#62baff', chocolate: '#c49170', liquorice: '#be9cff',
        marmalade: '#ffad66', frosting: '#cfe8ff', delivery: '#58dfa9', heat_haze: '#ffe278', cloud_shadow: '#b8c9dd',
        overcast: '#a9cce9', raindrop: '#83c9ff', snow_cover: '#e6f3ff', ice: '#9ee8f2', lightning: '#dcc0ff', mist: '#cfd8dc',
    });
    function terrainGlyph(context, kind, color) {
        context.save(); context.translate(8, 38); context.scale(0.55, 0.55);
        context.strokeStyle = color; context.fillStyle = color; context.lineWidth = 4; context.lineCap = 'round'; context.lineJoin = 'round';
        if (kind === 'lightning' || kind === 'bolt') polygon(context, [[20, 0], [4, 22], [16, 22], [10, 40], [32, 14], [19, 14]]), context.fill();
        else if (kind === 'raindrop' || kind === 'jelly') { context.beginPath(); context.moveTo(18, 1); context.bezierCurveTo(30, 17, 34, 25, 18, 36); context.bezierCurveTo(2, 25, 6, 17, 18, 1); context.fill(); }
        else if (kind === 'snow_cover' || kind === 'frosting' || kind === 'ice') { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; line(context, [[18, 18], [18 + Math.cos(a) * 17, 18 + Math.sin(a) * 17]]); } }
        else if (kind === 'locked') { context.beginPath(); context.roundRect(5, 15, 26, 22, 5); context.stroke(); context.beginPath(); context.arc(18, 15, 9, Math.PI, 0); context.stroke(); }
        else if (kind === 'delivery' || kind === 'blocker') { context.strokeRect(3, 5, 30, 28); line(context, [[3, 14], [33, 14]]); line(context, [[18, 5], [18, 33]]); }
        else if (kind === 'chocolate') { context.strokeRect(3, 3, 30, 30); line(context, [[18, 3], [18, 33]]); line(context, [[3, 18], [33, 18]]); }
        else if (kind === 'mist' || kind === 'heat_haze') { for (let i = 0; i < 3; i++) { context.beginPath(); context.moveTo(2, 8 + i * 10); context.bezierCurveTo(12, 2 + i * 10, 24, 14 + i * 10, 34, 8 + i * 10); context.stroke(); } }
        else if (kind === 'cloud_shadow' || kind === 'overcast') { context.beginPath(); context.arc(12, 22, 9, 0, Math.PI * 2); context.arc(22, 16, 11, 0, Math.PI * 2); context.arc(30, 24, 8, 0, Math.PI * 2); context.fill(); }
        else { polygon(context, starPoints(18, 18, 17, 8)); context.stroke(); }
        context.restore();
    }
    function drawTerrain(context, kind, value = 1) {
        const color = TERRAIN_COLORS[kind] || GOLD;
        context.save(); context.clearRect(0, 0, SIZE, SIZE);
        context.beginPath(); context.roundRect(3, 3, 58, 58, 10);
        context.fillStyle = 'rgba(6,21,43,0.16)'; context.fill();
        context.lineWidth = 2.5; context.strokeStyle = color; context.stroke();
        terrainGlyph(context, kind, color);
        const text = typeof value === 'string' ? (current[value]?.symbol || value.charAt(0).toUpperCase()) : value;
        badge(context, 39, 1, text, INK, color);
        context.restore();
    }

    function drawBooster(context, type) {
        const colors = { blast: '#ff6384', ray: '#62baff', prism: '#be9cff', bolt: '#ffe278', facet: '#58dfa9', mark: '#ffad66', nova: '#f5d58b', spectrum: '#9ee8f2', shift: '#b8c9dd', hammer: '#c49170' };
        const color = colors[type] || GOLD;
        context.save(); context.clearRect(0, 0, SIZE, SIZE);
        context.beginPath(); context.roundRect(4, 4, 56, 56, 14);
        const gradient = context.createLinearGradient(0, 4, 0, 60);
        gradient.addColorStop(0, '#25465b'); gradient.addColorStop(1, '#10213a');
        context.fillStyle = gradient; context.fill(); context.lineWidth = 2.5; context.strokeStyle = color; context.stroke();
        context.translate(32, 32); context.strokeStyle = color; context.fillStyle = color; context.lineWidth = 4; context.lineCap = 'round'; context.lineJoin = 'round';
        if (type === 'blast') { context.beginPath(); context.arc(0, 4, 14, 0, Math.PI * 2); context.fill(); line(context, [[5, -9], [10, -17], [17, -15]]); }
        else if (type === 'bolt') polygon(context, [[3, -22], [-13, 4], [-1, 4], [-6, 22], [14, -6], [2, -6]]), context.fill();
        else if (type === 'facet' || type === 'prism') { polygon(context, [[0, -20], [18, 0], [0, 20], [-18, 0]]); context.fill(); context.strokeStyle = INK; context.lineWidth = 2; line(context, [[-18, 0], [18, 0]]); line(context, [[0, -20], [0, 20]]); }
        else if (type === 'mark') { context.beginPath(); context.arc(0, 0, 17, 0, Math.PI * 2); context.stroke(); context.beginPath(); context.arc(0, 0, 7, 0, Math.PI * 2); context.fill(); }
        else if (type === 'nova') { polygon(context, starPoints(0, 0, 21, 9)); context.fill(); }
        else if (type === 'ray') { line(context, [[-20, 0], [20, 0]]); line(context, [[-13, -7], [-20, 0], [-13, 7]]); line(context, [[13, -7], [20, 0], [13, 7]]); }
        else if (type === 'spectrum') { ['#ff6384', '#ffe278', '#58dfa9', '#62baff'].forEach((c, i) => { context.strokeStyle = c; context.beginPath(); context.arc(0, 0, 18 - i * 4, Math.PI * 0.15, Math.PI * 1.65); context.stroke(); }); }
        else if (type === 'shift') { line(context, [[-18, -7], [18, -7], [11, -14]]); line(context, [[18, 7], [-18, 7], [-11, 14]]); }
        else if (type === 'hammer') { context.save(); context.rotate(-0.65); context.fillRect(-4, -4, 8, 26); context.beginPath(); context.roundRect(-16, -18, 32, 14, 4); context.fill(); context.restore(); }
        context.restore();
    }

    const UI_ICONS = Object.freeze(['bomb', 'coin', 'gear', 'hammer', 'heart', 'rocket', 'shop', 'shuffle', 'star', 'timer']);
    function drawUiIcon(context, name) {
        if (name === 'bomb') return drawBooster(context, 'blast');
        if (name === 'hammer') return drawBooster(context, 'hammer');
        if (name === 'shuffle') return drawBooster(context, 'shift');
        context.save(); context.clearRect(0, 0, SIZE, SIZE);
        context.beginPath(); context.roundRect(4, 4, 56, 56, 14);
        const gradient = context.createLinearGradient(0, 4, 0, 60);
        gradient.addColorStop(0, '#25465b'); gradient.addColorStop(1, '#10213a');
        context.fillStyle = gradient; context.fill(); context.lineWidth = 2.5; context.strokeStyle = GOLD; context.stroke();
        context.translate(32, 32); context.lineCap = 'round'; context.lineJoin = 'round'; context.lineWidth = 4;
        if (name === 'coin') { context.fillStyle = GOLD; context.beginPath(); context.arc(0, 0, 18, 0, Math.PI * 2); context.fill(); context.strokeStyle = INK; context.lineWidth = 2; context.beginPath(); context.arc(0, 0, 12, 0, Math.PI * 2); context.stroke(); }
        else if (name === 'star') { context.fillStyle = GOLD; polygon(context, starPoints(0, 0, 20, 9)); context.fill(); }
        else if (name === 'heart') { context.fillStyle = '#ff6384'; context.beginPath(); context.moveTo(0, 17); context.bezierCurveTo(-22, 2, -16, -16, -5, -13); context.bezierCurveTo(0, -11, 0, -6, 0, -5); context.bezierCurveTo(0, -6, 0, -11, 5, -13); context.bezierCurveTo(16, -16, 22, 2, 0, 17); context.fill(); }
        else if (name === 'gear') { context.strokeStyle = '#b8c9dd'; polygon(context, starPoints(0, 0, 20, 14, 8)); context.stroke(); context.beginPath(); context.arc(0, 0, 7, 0, Math.PI * 2); context.stroke(); }
        else if (name === 'rocket') { context.fillStyle = '#62baff'; polygon(context, [[0, -21], [10, 4], [6, 16], [-6, 16], [-10, 4]]); context.fill(); context.fillStyle = GOLD; polygon(context, [[-6, 16], [0, 24], [6, 16]]); context.fill(); }
        else if (name === 'shop') { context.strokeStyle = '#58dfa9'; context.strokeRect(-16, -4, 32, 22); context.beginPath(); context.moveTo(-20, -4); context.lineTo(-14, -18); context.lineTo(14, -18); context.lineTo(20, -4); context.closePath(); context.stroke(); }
        else if (name === 'timer') { context.strokeStyle = '#ffe278'; context.beginPath(); context.arc(0, 3, 17, 0, Math.PI * 2); context.stroke(); line(context, [[0, 3], [0, -8]]); line(context, [[0, 3], [9, 7]]); line(context, [[-6, -19], [6, -19]]); }
        context.restore();
    }

    function drawBrand(context, size = 512, options = {}) {
        const s = size / 64;
        context.save(); context.scale(s, s); context.clearRect(0, 0, 64, 64);
        if (!options.maskable) { context.beginPath(); context.roundRect(1, 1, 62, 62, 14); context.clip(); }
        const gradient = context.createLinearGradient(0, 0, 0, 64);
        gradient.addColorStop(0, '#203a66'); gradient.addColorStop(1, '#0c1445');
        context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
        context.fillStyle = 'rgba(248,251,255,0.55)';
        for (const [x, y, r] of [[12, 14, 0.7], [51, 12, 0.8], [45, 48, 0.6], [16, 49, 0.5]]) { context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2); context.fill(); }
        const markScale = options.maskable ? 0.78 : 1;
        context.translate(32, 32); context.scale(markScale, markScale); context.translate(-32, -32);
        context.lineJoin = 'round';
        polygon(context, [[14, 28], [18, 14], [26, 23], [32, 10], [38, 23], [46, 14], [50, 28]]);
        const gold = context.createLinearGradient(0, 10, 0, 31); gold.addColorStop(0, '#ffe9aa'); gold.addColorStop(1, '#d4af37');
        context.fillStyle = gold; context.fill(); context.lineWidth = 2; context.strokeStyle = INK; context.stroke();
        context.beginPath(); context.roundRect(14, 28, 36, 6, 2); context.fill(); context.stroke();
        context.save(); context.translate(32, 45);
        polygon(context, [[0, -13], [13, 0], [0, 13], [-13, 0]]);
        const gem = context.createLinearGradient(0, -13, 0, 13); gem.addColorStop(0, '#9ff5ec'); gem.addColorStop(1, '#3aa89f');
        context.fillStyle = gem; context.fill(); context.lineWidth = 2; context.strokeStyle = INK; context.stroke();
        context.strokeStyle = 'rgba(255,255,255,0.6)'; context.lineWidth = 1; line(context, [[-13, 0], [13, 0]]); line(context, [[0, -13], [0, 13]]);
        context.restore();
        context.restore();
    }

    root.InfiniteArt = Object.freeze({
        VERSION, SIZE, INK, PAPER, GOLD, SHADOW, SLOT_SHAPES, specialTypes: SPECIAL_TYPES, boosterTypes: BOOSTERS, terrainTypes: TERRAIN, uiIcons: UI_ICONS,
        get visuals() { return current; }, setContext, visualsForContext, visualsForSet, themeCatalog, styleFor,
        jewelColor, contrast, drawGem, drawShield, drawTerrain, drawBooster, drawUiIcon, drawBrand,
    });
})(globalThis);
