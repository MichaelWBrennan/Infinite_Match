/* Original, read-only room presentation. Purchases and placement always use /api/kingdom. */
(function (root) {
    'use strict';
    const FIRST_LOOK_IDS = Object.freeze(['tapestry', 'mosaic', 'sconces']);
    const captions = Object.freeze({
        tapestry: 'A woven path of light', mosaic: 'Sunlight set in stone', sconces: 'Stars beside the arch',
        banner: 'A banner for the hall', statue: 'A guardian in marble', fountain: 'A quiet fountain',
    });

    function roomView(data) {
        const room = data?.kingdom?.rooms?.find((item) => item.id === 'throne') || { level: 0, maxLevel: 5, next: { costCoins: 200, starsRequired: 0 } };
        const level = Math.max(0, Math.min(5, Number.isInteger(room.level) ? room.level : 0));
        const catalog = Array.isArray(data?.decor?.catalog) ? data.decor.catalog : [];
        const placed = data?.decor?.placed || {};
        const owned = data?.decor?.owned || {};
        const selected = Object.hasOwn(captions, placed.throne) ? placed.throne : null;
        const coins = Number.isSafeInteger(data?.coins) ? data.coins : 0;
        const guest = !!data?.guest;
        const choices = FIRST_LOOK_IDS.map((id) => {
            const item = catalog.find((entry) => entry.id === id);
            const inStock = (owned[id] || 0) - Object.values(placed).filter((value) => value === id).length;
            const costCoins = selected === id || inStock > 0 ? 0 : item?.priceCoins ?? null;
            const eligible = !guest && !!item && level >= item.requiresRoomLevel && (costCoins === 0 || coins >= costCoins);
            return { id, name: item?.name || id, caption: captions[id], costCoins,
                selected: selected === id, eligible, lockedBy: guest ? 'Sign in to keep this look.'
                    : level < (item?.requiresRoomLevel || 1) ? 'Repair the hall first.'
                        : costCoins === null ? 'Unavailable.' : coins < costCoins ? 'More coins needed.' : null };
        });
        return {
            level, selected, guest, choices, coins, coinBonus: Math.round((data?.coinBonus || 0) * 100),
            canRenovate: !guest && room.canRenovate === true, next: room.next || null,
            renovationReason: room.blockedBy || null,
            narrative: level === 0 ? 'The hall has gone quiet. A thin line of daylight waits behind the shutters. One repair could let it in.'
                : selected ? `${captions[selected]}. The first room has become yours to shape.`
                    : 'Morning has found the hall again. What should stand where the light falls?',
        };
    }

    // Markup contains only fixed, authored geometry. Server labels are inserted separately with textContent.
    function artwork(level, decorId) {
        const stage = Math.max(0, Math.min(5, Number.isInteger(level) ? level : 0));
        const selected = Object.hasOwn(captions, decorId) ? decorId : null;
        const detail = {
            tapestry: '<path d="M344 140h112v166l-56-23-56 23z" fill="#9e485d" stroke="#f4d393" stroke-width="6"/><path d="M357 159h86M400 180l26 47-26 40-26-40z" fill="none" stroke="#f7dfa4" stroke-width="7"/>',
            mosaic: '<circle cx="400" cy="218" r="72" fill="#193a54" stroke="#f4d393" stroke-width="9"/><circle cx="400" cy="218" r="38" fill="#eabf70"/><path d="M400 154v17m0 94v17m-64-64h17m94 0h17m-108-46 13 13m62 62 13 13m0-88-13 13m-62 62-13 13" stroke="#f5d994" stroke-width="9" stroke-linecap="round"/>',
            sconces: '<path d="M260 181v81m280-81v81" stroke="#f2d593" stroke-width="13"/><path d="M237 186h46l-9 46h-28zm280 0h46l-9 46h-28z" fill="#f3c979" stroke="#fff3cc" stroke-width="5"/><circle cx="260" cy="198" r="8" fill="#fff9d8"/><circle cx="540" cy="198" r="8" fill="#fff9d8"/>',
            banner: '<path d="M343 137h114v174l-57-28-57 28z" fill="#355f91" stroke="#f6d69a" stroke-width="6"/><circle cx="400" cy="213" r="30" fill="#e9d293"/>',
            statue: '<path d="M355 308h90l-8-28h-74z" fill="#b9c8d2"/><path d="M365 278v-90l35-35 35 35v90z" fill="#e4e6df"/><circle cx="400" cy="165" r="23" fill="#e4e6df"/>',
            fountain: '<ellipse cx="400" cy="307" rx="110" ry="30" fill="#74bec7" stroke="#e8d7ad" stroke-width="9"/><path d="M400 185v101m-46-43 46-58 46 58" fill="none" stroke="#a9eff0" stroke-width="9"/>',
        }[selected] || '<path d="M342 305h116l-13-26h-90z" fill="#9c805f" stroke="#d9bd8b" stroke-width="5"/>';
        const light = stage ? '#fff0b2' : '#6d88a9';
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" aria-hidden="true" focusable="false">
          <defs><linearGradient id="hall-wall-${stage}" x2="0" y2="1"><stop stop-color="${stage ? '#496b7b' : '#31475c'}"/><stop offset="1" stop-color="#233b50"/></linearGradient><linearGradient id="hall-floor-${stage}" x2="0" y2="1"><stop stop-color="#9c8268"/><stop offset="1" stop-color="#4f4860"/></linearGradient></defs>
          <path d="M0 0h800v348H0z" fill="url(#hall-wall-${stage})"/><path d="M0 348h800v132H0z" fill="url(#hall-floor-${stage})"/>
          <path d="M112 0v332M688 0v332M0 336h800" stroke="#d5c49c" stroke-width="18" opacity=".75"/>
          <path d="M175 329V82Q400-40 625 82v247" fill="#183447" stroke="#ead5a3" stroke-width="16"/>
          <path d="M229 317V103Q400 8 571 103v214" fill="${light}" opacity="${stage ? '.9' : '.2'}"/>
          <path d="M400 53v260M229 184h342" stroke="#34465e" stroke-width="15"/>
          <path d="M0 480 206 348h388l206 132" fill="#b3a17c" opacity=".5"/>
          <path d="M330 480 365 348h70l35 132" fill="#8c5264" opacity=".82"/>
          <path d="M68 78v246M732 78v246" stroke="#cdb489" stroke-width="30"/>
          ${stage ? '<path d="M244 341h312" stroke="#f7dfaa" stroke-width="9" opacity=".9"/>' : '<path d="M71 288l44-41m573 46 42-40" stroke="#688299" stroke-width="6"/>'}
          ${detail}
          <path d="M0 338h800" stroke="#f5dfa8" stroke-width="4" opacity=".65"/>
        </svg>`;
    }
    root.InfiniteKingdomScene = Object.freeze({ roomView, artwork, FIRST_LOOK_IDS });
})(globalThis);
