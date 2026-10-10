/** Frozen v1/v2 plain-gem rules. Shared helpers also underpin earned-special v3. */
export function hashSeed(text) {
    let hash = 2166136261;
    for (const ch of String(text)) {
        hash ^= ch.charCodeAt(0);
        hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash >>> 0;
}
/** The serializable state is also used for the game's refill stream. */
export function nextRandom(rng) {
    rng.state = (rng.state + 0x6d2b79f5) >>> 0;
    let t = rng.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function pickGem(rng, palette, weights = {}) {
    const total = palette.reduce((sum, color) => sum + (weights[color] || 1), 0);
    let roll = nextRandom(rng) * total;
    for (const color of palette) {
        roll -= weights[color] || 1;
        if (roll < 0)
            return color;
    }
    return palette[palette.length - 1];
}
export function matchingCells(board) {
    const found = new Set();
    const n = board.length;
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n;) {
            const color = board[r][c];
            let end = c + 1;
            while (color && end < n && board[r][end] === color)
                end++;
            if (color && end - c >= 3)
                for (let k = c; k < end; k++)
                    found.add(`${r},${k}`);
            c = end;
        }
    }
    for (let c = 0; c < n; c++) {
        for (let r = 0; r < n;) {
            const color = board[r][c];
            let end = r + 1;
            while (color && end < n && board[end][c] === color)
                end++;
            if (color && end - r >= 3)
                for (let k = r; k < end; k++)
                    found.add(`${k},${c}`);
            r = end;
        }
    }
    return found;
}
export function legalSwaps(board) {
    const moves = [];
    const n = board.length;
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            for (const [dr, dc] of [[0, 1], [1, 0]]) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= n || nc >= n || board[r][c] === board[nr][nc])
                    continue;
                [board[r][c], board[nr][nc]] = [board[nr][nc], board[r][c]];
                const count = matchingCells(board).size;
                [board[r][c], board[nr][nc]] = [board[nr][nc], board[r][c]];
                if (count)
                    moves.push({ cells: [r, c, nr, nc], count });
            }
        }
    }
    return moves;
}
/** Stable AND playable, including the fallback; no unbounded rejection loop. */
export function dealPlayableBoard(size, palette, weights, rng) {
    for (let attempt = 0; attempt <= 12; attempt++) {
        const board = Array.from({ length: size }, () => new Array(size).fill(null));
        // This motif guarantees a legal swap if random dealing repeatedly deadlocks.
        const motif = [[palette[0], palette[1], palette[0]], [palette[2], palette[0], palette[2]]];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (attempt === 12 && r < 2 && c < 3) {
                    board[r][c] = motif[r][c];
                    continue;
                }
                const banned = new Set();
                if (c > 1 && board[r][c - 1] === board[r][c - 2])
                    banned.add(board[r][c - 1]);
                if (r > 1 && board[r - 1][c] === board[r - 2][c])
                    banned.add(board[r - 1][c]);
                board[r][c] = pickGem(rng, palette.filter((color) => !banned.has(color)), weights);
            }
        }
        if (legalSwaps(board).length)
            return board;
    }
    throw new Error('Unable to generate a playable board');
}
/** Identical column/refill order and cascade scoring to the Phaser match-3 core. */
export function simulateMove(initialBoard, refillState, palette, weights, cells) {
    const board = initialBoard.map((row) => row.slice());
    const rng = { state: refillState >>> 0 };
    const [r, c, nr, nc] = cells;
    const n = board.length;
    if (![r, c, nr, nc].every((v) => Number.isInteger(v) && v >= 0 && v < n)
        || Math.abs(r - nr) + Math.abs(c - nc) !== 1)
        return null;
    [board[r][c], board[nr][nc]] = [board[nr][nc], board[r][c]];
    let matches = matchingCells(board);
    if (!matches.size)
        return null;
    let score = 0;
    let chain = 0;
    while (matches.size && chain < 64) {
        chain++;
        score += matches.size * 10 * chain;
        for (const key of matches) {
            const [row, col] = key.split(',').map(Number);
            board[row][col] = null;
        }
        for (let col = 0; col < n; col++) {
            const survivors = [];
            for (let row = n - 1; row >= 0; row--)
                if (board[row][col])
                    survivors.push(board[row][col]);
            for (let row = n - 1, i = 0; row >= 0; row--, i++) {
                board[row][col] = i < survivors.length ? survivors[i] : pickGem(rng, palette, weights);
            }
        }
        matches = matchingCells(board);
    }
    // A pathological cascade or deadlock is repaired for free, never sold as a shuffle.
    const stable = matches.size || !legalSwaps(board).length
        ? dealPlayableBoard(n, palette, weights, rng) : board;
    return { board: stable, refillState: rng.state, score, cascades: chain };
}
/** Existence proof, not a claim that every choice wins or that humans meet a timed deadline. */
export function certifyBoard(board, refillState, palette, weights, moveBudget) {
    let state = { board, refillState, score: 0 };
    let score = 0;
    const witness = [];
    for (let i = 0; i < moveBudget; i++) {
        const moves = legalSwaps(state.board);
        moves.sort((a, b) => b.count - a.count);
        if (!moves.length)
            break;
        const cells = moves[0].cells;
        state = simulateMove(state.board, state.refillState, palette, weights, cells);
        score += state.score;
        witness.push(cells);
    }
    return { score, witness };
}
//# sourceMappingURL=match-core.js.map