/**
 * Kingdom decorations. A player buys a decoration with coins, then places it in one room. Each
 * room holds one decoration. A decoration needs its room to be at least a given level. The
 * server checks each step. Decorations are kept on the kingdom, not in the item inventory.
 */
import { KINGDOM_ROOMS } from './kingdom.js';
export const MAX_DECOR_OWNED = 5;
export const DECOR_CATALOG = Object.freeze({
    tapestry: { name: 'Tapestry', priceCoins: 200, requiresRoomLevel: 1 },
    banner: { name: 'Royal Banner', priceCoins: 120, requiresRoomLevel: 2 },
    statue: { name: 'Marble Statue', priceCoins: 300, requiresRoomLevel: 3 },
    fountain: { name: 'Fountain', priceCoins: 500, requiresRoomLevel: 4 },
});
export class DecorError extends Error {
    constructor(code) {
        super(code);
        this.code = code;
    }
}
/** Makes sure the kingdom has a decor record. Returns it. */
export function ensureDecor(kingdom) {
    if (!kingdom.decor || typeof kingdom.decor !== 'object')
        kingdom.decor = {};
    kingdom.decor.owned = kingdom.decor.owned || {};
    kingdom.decor.placed = kingdom.decor.placed || {};
    return kingdom.decor;
}
const placedCount = (decor, decorId) => Object.values(decor.placed).filter((id) => id === decorId).length;
/** Owned decorations of one kind that are not placed in a room. */
export function decorInStock(decor, decorId) {
    return (decor.owned[decorId] || 0) - placedCount(decor, decorId);
}
export function planBuyDecor(decor, decorId, coins) {
    const item = Object.prototype.hasOwnProperty.call(DECOR_CATALOG, decorId) ? DECOR_CATALOG[decorId] : null;
    if (!item)
        throw new DecorError('unknown_decor');
    if ((decor.owned[decorId] || 0) >= MAX_DECOR_OWNED)
        throw new DecorError('decor_limit');
    if (coins < item.priceCoins)
        throw new DecorError('insufficient_coins');
    return { costCoins: item.priceCoins };
}
export function planPlaceDecor(kingdom, decor, roomId, decorId) {
    const room = KINGDOM_ROOMS.find((r) => r.id === roomId);
    if (!room)
        throw new DecorError('unknown_room');
    const item = Object.prototype.hasOwnProperty.call(DECOR_CATALOG, decorId) ? DECOR_CATALOG[decorId] : null;
    if (!item)
        throw new DecorError('unknown_decor');
    if (decorInStock(decor, decorId) <= 0)
        throw new DecorError('decor_not_owned');
    if (decor.placed[roomId])
        throw new DecorError('room_occupied');
    if ((kingdom.rooms[roomId] || 0) < item.requiresRoomLevel)
        throw new DecorError('room_level_too_low');
    return { roomId, decorId };
}
export function planRemoveDecor(decor, roomId) {
    if (!decor.placed[roomId])
        throw new DecorError('room_empty');
    return { roomId, decorId: decor.placed[roomId] };
}
/** The decorations as the client shows them. */
export function decorView(decor) {
    return {
        catalog: Object.entries(DECOR_CATALOG).map(([id, item]) => ({
            id,
            name: item.name,
            priceCoins: item.priceCoins,
            requiresRoomLevel: item.requiresRoomLevel,
        })),
        owned: { ...decor.owned },
        placed: { ...decor.placed },
        maxOwned: MAX_DECOR_OWNED,
    };
}
//# sourceMappingURL=kingdom-decor.js.map