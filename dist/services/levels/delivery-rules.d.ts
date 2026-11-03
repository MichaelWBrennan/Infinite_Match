export function validDelivery(delivery: any, size: any, gemTypes: any): boolean;
export function deliveryCount(delivery: any): any;
export function blankDelivery(size: any): any[][];
/** Apply delivery clearing to a move result. A delivery cell is cleared when
 *  the gem type at that cell (before clearing) matches the required type.
 *  `board` is the pre-move board state. Never mutates input. */
export function applyDeliveryClear(result: any, initialDelivery: any, board: any): {
    delivery: any;
    deliveryCleared: number;
} | null;
/** Place delivery cells only on cells the no-inventory witness actually clears
 *  with the required gem type, up to DELIVERY_CAP. Same existence-proof pattern
 *  as witnessedShields. */
export function witnessedDelivery(board: any, refillState: any, palette: any, weights: any, specials: any, witness: any, seed: any, gemTypes: any): any[][];
/** Certify a delivery level: run the no-inventory witness and confirm every
 *  delivery cell is cleared by the witness path. Returns { score, collected,
 *  deliveryCleared, events }. */
export function certifyDeliveryBoard(definition: any): {
    score: number;
    collected: {
        [k: string]: any;
    };
    deliveryCleared: number;
    events: never[];
};
export const DELIVERY_CAP: 5;
//# sourceMappingURL=delivery-rules.d.ts.map