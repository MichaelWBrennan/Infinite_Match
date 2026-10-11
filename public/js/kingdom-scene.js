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
    // World-building is presentation only: server room levels, prices and stock are authoritative.
    const ROOM_DETAILS = Object.freeze({
        throne: { name: 'Throne Hall', title: 'The Hall of Echoes', noun: 'hall', captions,
            before: 'The hall has gone quiet. A thin line of daylight waits behind the shutters. One repair could let it in.',
            after: 'Morning has found the hall again. What should stand where the light falls?',
            chosen: 'The first room has become yours to shape.' },
        library: { name: 'Royal Library', title: 'The Library of Lanterns', noun: 'library', captions: libraryCaptions,
            before: 'The library doors have stood closed for years. One repair could bring the stories back into the light.',
            after: 'The shelves are waiting for their readers. Where should the first light fall?',
            chosen: 'A new chapter begins here.' },
        garden: { name: 'Royal Garden', title: 'The Garden of Seasons', noun: 'garden', captions: Object.freeze({
            tapestry: 'A woven path through the roses', mosaic: 'A sun at the garden gate', sconces: 'Lanterns among the leaves',
            banner: 'A banner above the hedge', statue: 'A quiet guardian in bloom', fountain: 'Water beneath the trees' }),
        before: 'The paths have grown wild. A first repair could open the garden gate again.',
        after: 'There is room to wander beneath the trees. What should welcome the next visitor?',
        chosen: 'The garden has a place to pause.' },
        armory: { name: 'Armory', title: 'The Armory of Dawn', noun: 'armory', captions: Object.freeze({
            tapestry: 'A banner of old adventures', mosaic: 'A bright star underfoot', sconces: 'Lights along the racks',
            banner: 'A crest beside the doors', statue: 'A guardian beside the gear', fountain: 'A quiet corner for rest' }),
        before: 'The old armory is dark and still. Repairing it will bring the room back into use.',
        after: 'The racks are ready, and the doors are open. Which look belongs here?',
        chosen: 'The armory is ready for a new story.' },
        gatehouse: { name: 'Gatehouse', title: 'The Gate of New Paths', noun: 'gatehouse', captions: Object.freeze({
            tapestry: 'A welcome above the road', mosaic: 'A sun at the threshold', sconces: 'Lights for returning travelers',
            banner: 'A crest above the gates', statue: 'A guardian at the entrance', fountain: 'A spring beside the road' }),
        before: 'The gate has been closed for too long. A repair could make a path home.',
        after: 'The road is open again. What should greet the next traveler?',
        chosen: 'The gatehouse welcomes everyone home.' },
        chapel: { name: 'Chapel', title: 'The Chapel of Starlight', noun: 'chapel', captions: Object.freeze({
            tapestry: 'A woven sky of wishes', mosaic: 'A sun beneath the windows', sconces: 'Stars beside the pillars',
            banner: 'A promise above the aisle', statue: 'A gentle guardian of the hall', fountain: 'A still pool of light' }),
        before: 'Dust covers the quiet windows. One repair could let the colors return.',
        after: 'The windows shine again. Where should the first color fall?',
        chosen: 'A peaceful place has found its light.' },
    });
    const ROOM_IDS = Object.freeze(Object.keys(ROOM_DETAILS));
    const ROOM_NAMES = Object.freeze(Object.fromEntries(ROOM_IDS.map((id) => [id, ROOM_DETAILS[id].name])));

    function roomView(data, roomId = 'throne') {
        const id = ROOM_IDS.includes(roomId) ? roomId : 'throne';
        const detail = ROOM_DETAILS[id];
        const words = detail.captions;
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
                    : level < (item?.requiresRoomLevel || 1) ? `Repair the ${detail.noun} first.`
                        : costCoins === null ? 'Unavailable.' : coins < costCoins ? 'More coins needed.' : null };
        });
        return {
            id, name: detail.name, title: detail.title, noun: detail.noun,
            level, selected, guest, choices, coins, coinBonus: Math.round((data?.coinBonus || 0) * 100),
            canRenovate: !guest && room.canRenovate === true, next: room.next || null,
            renovationReason: room.blockedBy || null,
            narrative: level === 0 ? detail.before : selected ? `${words[selected]}. ${detail.chosen}` : detail.after,
        };
    }

    // Markup contains only fixed, authored geometry. Server labels are inserted separately with textContent.
    function artwork(level, decorId, roomId = 'throne') {
        if (roomId === 'library') return libraryArtwork(level, decorId);
        if (ROOM_IDS.includes(roomId) && roomId !== 'throne') return otherRoomArtwork(level, decorId, roomId);
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
    // Fixed SVG geometry; no names, descriptions or identifiers from a server are interpolated.
    function otherRoomArtwork(level, decorId, roomId) {
        const stage = Math.max(0, Math.min(5, Number.isInteger(level) ? level : 0));
        const selected = Object.hasOwn(ROOM_DETAILS[roomId].captions, decorId) ? decorId : null;
        const sky = stage ? '#f4dbab' : '#718296';
        const scenes = {
            garden: `<path d="M0 0h800v480H0z" fill="${sky}"/><path d="M0 270q140-100 280 0t280 0t240 0v210H0z" fill="#34596a"/>
              <path d="M0 375q210-83 400 0t400 0v105H0z" fill="${stage ? '#497d63' : '#4a6267'}"/>
              <path d="M300 480 366 330h68l66 150" fill="#c3a879"/>
              <path d="M58 325V115m684 210V115" stroke="#846d58" stroke-width="31"/>
              <circle cx="64" cy="94" r="74" fill="${stage ? '#5a936c' : '#637b80'}"/>
              <circle cx="735" cy="85" r="79" fill="${stage ? '#5a936c' : '#637b80'}"/>
              <path d="M240 322V150q160-130 320 0v172" fill="none" stroke="#dec391" stroke-width="19"/>
              <path d="M245 190q86-58 150 7m160-7q-85-58-150 7" fill="none" stroke="#76a27c" stroke-width="16"/>
              ${stage ? '<circle cx="198" cy="351" r="14" fill="#f3cbb7"/><circle cx="613" cy="357" r="14" fill="#e9c4a9"/>' : '<path d="M130 375l37-25m452 24 36-22" stroke="#aab5af" stroke-width="7"/>'}`,
            armory: `<path d="M0 0h800v350H0z" fill="${stage ? '#505e66' : '#334452'}"/><path d="M0 350h800v130H0z" fill="#746465"/>
              <path d="M70 0v346M730 0v346M0 343h800" stroke="#bcaa8b" stroke-width="22"/>
              <path d="M102 115h185v205H102zM513 115h185v205H513z" fill="#293f4b" stroke="#af946f" stroke-width="12"/>
              <path d="M150 132v150m45-150v150m45-150v150m320-150v150m45-150v150m45-150v150" stroke="${stage ? '#d5c39d' : '#84969d'}" stroke-width="12"/>
              <path d="M305 338h190l-25 37H330zM340 375v69m120-69v69" fill="#95775c" stroke="#c5aa7f" stroke-width="9"/>
              <path d="M355 322l44-74 44 74z" fill="#b0adb1" stroke="#e5d6ac" stroke-width="7"/>
              ${stage ? '<path d="M330 70h140" stroke="#f1d29b" stroke-width="9"/>' : '<path d="M105 314l41-24m510 22 39-27" stroke="#93a0a1" stroke-width="7"/>'}`,
            gatehouse: `<path d="M0 0h800v480H0z" fill="${sky}"/><path d="M0 274q160-128 330 0t470-10v216H0z" fill="#506e72"/>
              <path d="M0 348h800v132H0z" fill="#8a7c6c"/>
              <path d="M88 357V86h135v271m354 0V86h135v271" fill="#887e78" stroke="#dac59a" stroke-width="14"/>
              <path d="M68 95h175V65H68zm489 0h175V65H557z" fill="#b5a17d"/>
              <path d="M209 370V156q191-146 382 0v214" fill="#4d5861" stroke="#e4cea1" stroke-width="16"/>
              <path d="M254 360V172q146-96 292 0v188" fill="${stage ? '#8fb2aa' : '#445b68'}"/>
              <path d="M0 480 262 362h276l262 118" fill="#b5a17d"/>
              ${stage ? '<path d="M266 363h268" stroke="#f6daa2" stroke-width="8"/>' : '<path d="M272 325l47-29m166 29 47-29" stroke="#9fb2ab" stroke-width="8"/>'}`,
            chapel: `<path d="M0 0h800v350H0z" fill="${stage ? '#485977' : '#354558'}"/><path d="M0 350h800v130H0z" fill="#78666e"/>
              <path d="M102 0v347M698 0v347M0 345h800" stroke="#d4b88f" stroke-width="18"/>
              <path d="M260 300V83q140-144 280 0v217" fill="#263e56" stroke="#edcf99" stroke-width="16"/>
              <path d="M290 283V95q110-95 220 0v188" fill="${stage ? '#be8193' : '#5a718c'}" opacity="${stage ? '.9' : '.38'}"/>
              <path d="M400 28v266M295 163h210" stroke="#e9c99b" stroke-width="12"/>
              <path d="M205 334h390l-50 28H255zM312 362v100m176-100v100" fill="#92745e" stroke="#e7cc9c" stroke-width="9"/>
              <path d="M350 330h100v-47H350z" fill="#f1dfb0"/>
              ${stage ? '<path d="M288 286h224" stroke="#fde6a9" stroke-width="8"/>' : '<path d="M130 325l32-29m475 30 33-27" stroke="#8e9bac" stroke-width="6"/>'}`,
        };
        const decor = {
            tapestry: '<path d="M350 84h100v154l-50-25-50 25z" fill="#a35d67" stroke="#f6d99d" stroke-width="7"/>',
            mosaic: '<circle cx="400" cy="405" r="40" fill="#eec57c" stroke="#fce4ac" stroke-width="11"/>',
            sconces: '<path d="M285 160v86m230-86v86" stroke="#f5d78c" stroke-width="12"/><circle cx="285" cy="172" r="17" fill="#ffe8a1"/><circle cx="515" cy="172" r="17" fill="#ffe8a1"/>',
            banner: '<path d="M342 76h116v180l-58-26-58 26z" fill="#4a718b" stroke="#f4d596" stroke-width="7"/>',
            statue: '<path d="M350 315h100l-20-47h-60z" fill="#e0dacf"/><circle cx="400" cy="255" r="30" fill="#e5e3d7"/>',
            fountain: '<ellipse cx="400" cy="400" rx="94" ry="25" fill="#79bec6" stroke="#f1d69e" stroke-width="8"/><path d="M400 299v86" stroke="#a9e5df" stroke-width="10"/>',
        }[selected] || '';
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" aria-hidden="true" focusable="false">${scenes[roomId]}${decor}</svg>`;
    }
    root.InfiniteKingdomScene = Object.freeze({ roomView, artwork, FIRST_LOOK_IDS, ROOM_IDS, ROOM_NAMES });
})(globalThis);
