/* Original, read-only room presentation. Purchases and placement always use /api/kingdom. */
(function (root) {
    'use strict';
    const FIRST_LOOK_IDS = Object.freeze(['tapestry', 'mosaic', 'sconces']);
    const captions = Object.freeze({
        tapestry: 'A woven path of light', mosaic: 'Sunlight set in stone', sconces: 'Stars beside the arch',
        banner: 'A banner for the hall', statue: 'A guardian in marble', fountain: 'A quiet fountain',
    });

    const libraryCaptions = Object.freeze({
        tapestry: 'A map for every journey', mosaic: 'A sunlit reading circle', sconces: 'Lights for late chapters',
        banner: 'A mark above the shelves', statue: 'A guardian of old tales', fountain: 'A spring of stories',
    });
    const ROOM_IDS = Object.freeze(['throne', 'library']);

    function roomView(data, roomId = 'throne') {
        const id = ROOM_IDS.includes(roomId) ? roomId : 'throne';
        const isLibrary = id === 'library';
        const words = isLibrary ? libraryCaptions : captions;
        const name = isLibrary ? 'Royal Library' : 'Throne Hall';
        const room = data?.kingdom?.rooms?.find((item) => item.id === id) || { level: 0, maxLevel: 5, next: { costCoins: 200, starsRequired: 0 } };
        const level = Math.max(0, Math.min(5, Number.isInteger(room.level) ? room.level : 0));
        const catalog = Array.isArray(data?.decor?.catalog) ? data.decor.catalog : [];
        const placed = data?.decor?.placed || {};
        const owned = data?.decor?.owned || {};
        const selected = Object.hasOwn(words, placed[id]) ? placed[id] : null;
        const coins = Number.isSafeInteger(data?.coins) ? data.coins : 0;
        const guest = !!data?.guest;
        const choices = FIRST_LOOK_IDS.map((id) => {
            const item = catalog.find((entry) => entry.id === id);
            const inStock = (owned[id] || 0) - Object.values(placed).filter((value) => value === id).length;
            const costCoins = selected === id || inStock > 0 ? 0 : item?.priceCoins ?? null;
            const eligible = !guest && !!item && level >= item.requiresRoomLevel && (costCoins === 0 || coins >= costCoins);
            return { id, name: item?.name || id, caption: words[id], costCoins,
                selected: selected === id, eligible, lockedBy: guest ? 'Sign in to keep this look.'
                    : level < (item?.requiresRoomLevel || 1) ? `Repair the ${isLibrary ? 'library' : 'hall'} first.`
                        : costCoins === null ? 'Unavailable.' : coins < costCoins ? 'More coins needed.' : null };
        });
        return {
            id, name, title: isLibrary ? 'The Library of Lanterns' : 'The Hall of Echoes',
            level, selected, guest, choices, coins, coinBonus: Math.round((data?.coinBonus || 0) * 100),
            canRenovate: !guest && room.canRenovate === true, next: room.next || null,
            renovationReason: room.blockedBy || null,
            narrative: isLibrary
                ? level === 0 ? 'The library doors have stood closed for years. One repair could bring the stories back into the light.'
                    : selected ? `${words[selected]}. A new chapter begins here.`
                        : 'The shelves are waiting for their readers. Where should the first light fall?'
                : level === 0 ? 'The hall has gone quiet. A thin line of daylight waits behind the shutters. One repair could let it in.'
                    : selected ? `${words[selected]}. The first room has become yours to shape.`
                        : 'Morning has found the hall again. What should stand where the light falls?',
        };
    }

    // Markup contains only fixed, authored geometry. Server labels are inserted separately with textContent.
    function artwork(level, decorId, roomId = 'throne') {
        if (roomId === 'library') return libraryArtwork(level, decorId);
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
    // A separate authored setting: books, reading table and a tall window. No server-supplied SVG.
    function libraryArtwork(level, decorId) {
        const stage = Math.max(0, Math.min(5, Number.isInteger(level) ? level : 0));
        const selected = Object.hasOwn(libraryCaptions, decorId) ? decorId : null;
        const detail = {
            tapestry: '<path d="M339 85h122v154l-61-22-61 22z" fill="#794568" stroke="#f3d49a" stroke-width="7"/><path d="M370 122l30 49 30-49m-60 65h60" fill="none" stroke="#f7dca5" stroke-width="7"/>',
            mosaic: '<circle cx="400" cy="385" r="75" fill="#47637a" stroke="#f4d79c" stroke-width="10"/><path d="M400 323l18 43 44 18-44 18-18 44-18-44-44-18 44-18z" fill="#edc97c"/>',
            sconces: '<path d="M300 103v95m200-95v95" stroke="#edca81" stroke-width="12"/><path d="M275 141h50l-10 38h-30zm200 0h50l-10 38h-30z" fill="#f5d592"/><circle cx="300" cy="153" r="9" fill="#fff8d4"/><circle cx="500" cy="153" r="9" fill="#fff8d4"/>',
            banner: '<path d="M347 72h106v174l-53-23-53 23z" fill="#427388" stroke="#f6d499" stroke-width="7"/><circle cx="400" cy="151" r="27" fill="#e8cb83"/>',
            statue: '<path d="M350 265h100v21H350zM369 256v-76l31-25 31 25v76z" fill="#d8e1d9" stroke="#fff2d3" stroke-width="5"/><circle cx="400" cy="160" r="20" fill="#e5ebe2"/>',
            fountain: '<ellipse cx="400" cy="385" rx="86" ry="24" fill="#80cad0" stroke="#f2d699" stroke-width="8"/><path d="M400 296v76m-32-34 32-42 32 42" fill="none" stroke="#b7f2e9" stroke-width="8"/>',
        }[selected] || '';
        const glow = stage ? '#ffe8ae' : '#67839b';
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" aria-hidden="true" focusable="false">
          <path d="M0 0h800v335H0z" fill="${stage ? '#365c68' : '#273e50'}"/><path d="M0 335h800v145H0z" fill="#6f5560"/>
          <path d="M120 0v339M680 0v339M0 337h800" stroke="#c8af83" stroke-width="18"/>
          <path d="M320 0v270q80 65 160 0V0" fill="#19394c" stroke="#d6b986" stroke-width="14"/>
          <path d="M347 0v239q53 40 106 0V0" fill="${glow}" opacity="${stage ? '.85' : '.18'}"/>
          <path d="M400 0v270M344 126h112" stroke="#bcab89" stroke-width="11"/>
          <path d="M40 74h227v236H40zM533 74h227v236H533z" fill="#483f49" stroke="#d4b782" stroke-width="13"/>
          <path d="M44 152h220M44 231h220M536 152h220M536 231h220" stroke="#bc9c72" stroke-width="10"/>
          <path d="M60 94h16v51H60zm23 15h17v36H83zm28-9h21v45h-21zm32 10h16v35h-16zm28-13h21v48h-21zm32 8h23v40h-23zM60 173h18v52H60zm28-10h21v62H88zm31 18h16v44h-16zm29-12h19v56h-19zm31 12h19v44h-19zm30-17h22v61h-22z" fill="${stage ? '#c49170' : '#77828a'}"/>
          <path d="M552 98h20v47h-20zm31 6h17v41h-17zm29-13h21v54h-21zm33 18h20v36h-20zm31-11h19v47h-19zm30 5h21v42h-21zM553 177h18v48h-18zm30-12h20v60h-20zm31 19h19v41h-19zm30-15h19v56h-19zm30 6h20v50h-20zm31-11h20v61h-20z" fill="${stage ? '#a5b6a7' : '#77828a'}"/>
          <path d="M123 480 273 343h254l150 137" fill="#987d69" opacity=".75"/>
          <path d="M301 335h198l-25 21H326zM330 356v60m140-60v60" fill="#a77957" stroke="#e0ba80" stroke-width="9"/>
          <path d="M365 340v-31l35 13 35-13v31l-35 13z" fill="#eed9a4" stroke="#af8a63" stroke-width="5"/>
          ${stage ? '<path d="M304 272h192" stroke="#ffebbb" stroke-width="6" opacity=".7"/>' : '<path d="M98 294l42-35m532 35 36-40" stroke="#728796" stroke-width="6"/>'}
          ${detail}
        </svg>`;
    }
    root.InfiniteKingdomScene = Object.freeze({ roomView, artwork, FIRST_LOOK_IDS, ROOM_IDS });
})(globalThis);
