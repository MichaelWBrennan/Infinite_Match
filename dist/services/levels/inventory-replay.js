/** Reconstruct inventory clear geometry from the pinned board and a bounded target.
 * Receipt authorization is deliberately handled by the account service/replayer.
 * This is not a browser RNG proof: random instant-effect locations are client reported.
 */
export const REPLAY_POWERUPS = Object.freeze(['blast', 'prism', 'bolt', 'facet', 'mark', 'nova', 'ray', 'spectrum']);
export function inventoryReplayEffect(definition, state, action) {
    const size = definition.boardSize;
    const type = action?.type;
    if (!REPLAY_POWERUPS.includes(type) || !Number.isSafeInteger(size) || size < 1 || size > 8)
        return null;
    const target = action.target;
    if (type === 'prism' ? target !== undefined
        : !Array.isArray(target)
            || (type === 'shift' ? target.length !== 4 : target.length !== 2)
            || target.some((n) => !Number.isSafeInteger(n) || n < 0 || n >= size)
            || (type === 'bolt' && target[0] !== 0))
        return null;
    const keys = new Set();
    const add = (r, c) => {
        if (r >= 0 && r < size && c >= 0 && c < size)
            keys.add(`${r},${c}`);
    };
    if (type === 'prism') {
        for (let r = 0; r < size; r++)
            for (let c = 0; c < size; c++)
                add(r, c);
    }
    else {
        const [r, c] = target;
        if (type === 'blast') {
            for (let dr = -1; dr <= 1; dr++)
                for (let dc = -1; dc <= 1; dc++)
                    add(r + dr, c + dc);
        }
        else if (type === 'bolt') {
            for (let row = 0; row < size; row++)
                add(row, c);
        }
        else if (type === 'facet') {
            const color = state.board[r]?.[c];
            if (!definition.gemTypes.includes(color))
                return null;
            for (let row = 0; row < size; row++)
                for (let col = 0; col < size; col++) {
                    if (state.board[row][col] === color)
                        add(row, col);
                }
        }
        else if (type === 'mark') {
            for (const [dr, dc] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]])
                add(r + dr, c + dc);
        }
        else if (type === 'nova') {
            for (let i = 0; i < size; i++) {
                add(r, i);
                add(i, c);
            }
        }
        else if (type === 'ray') {
            // Clears one full row (target[0] is the row).
            for (let col = 0; col < size; col++)
                add(r, col);
        }
        else if (type === 'spectrum') {
            // Clears all gems of the color at the anchor cell.
            const color = state.board[r]?.[c];
            if (!color || !definition.gemTypes.includes(color))
                return null;
            for (let row = 0; row < size; row++)
                for (let col = 0; col < size; col++) {
                    if (state.board[row][col] === color)
                        add(row, col);
                }
        }
    }
    return { keys, points: { blast: 100, prism: 500, bolt: 300, facet: 400, mark: 200, nova: 250, ray: 300, spectrum: 500 }[type] };
}
//# sourceMappingURL=inventory-replay.js.map