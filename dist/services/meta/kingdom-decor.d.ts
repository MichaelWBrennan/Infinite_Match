/** Makes sure the kingdom has a decor record. Returns it. */
export function ensureDecor(kingdom: any): any;
/** Owned decorations of one kind that are not placed in a room. */
export function decorInStock(decor: any, decorId: any): number;
export function planBuyDecor(decor: any, decorId: any, coins: any): {
    costCoins: any;
};
export function planPlaceDecor(kingdom: any, decor: any, roomId: any, decorId: any): {
    roomId: any;
    decorId: any;
};
export function planRemoveDecor(decor: any, roomId: any): {
    roomId: any;
    decorId: any;
};
/** The decorations as the client shows them. */
export function decorView(decor: any): {
    catalog: {
        id: string;
        name: string;
        priceCoins: number;
        requiresRoomLevel: number;
    }[];
    owned: any;
    placed: any;
    maxOwned: number;
};
export const MAX_DECOR_OWNED: 5;
export const DECOR_CATALOG: Readonly<{
    tapestry: {
        name: string;
        priceCoins: number;
        requiresRoomLevel: number;
    };
    banner: {
        name: string;
        priceCoins: number;
        requiresRoomLevel: number;
    };
    statue: {
        name: string;
        priceCoins: number;
        requiresRoomLevel: number;
    };
    fountain: {
        name: string;
        priceCoins: number;
        requiresRoomLevel: number;
    };
}>;
export class DecorError extends Error {
    constructor(code: any);
    code: any;
}
//# sourceMappingURL=kingdom-decor.d.ts.map