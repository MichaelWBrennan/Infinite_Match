/**
 * Infinite Match Game Worker Proxy
 *
 * Main-thread interface to the Web Worker. Provides async methods that
 * delegate CPU-intensive game logic to the worker thread.
 *
 * Falls back to synchronous main-thread execution if the worker fails
 * to load (e.g., in environments that block workers).
 */

class GameWorkerProxy {
  constructor() {
    this.worker = null;
    this.pending = new Map(); // id -> { resolve, reject }
    this.nextId = 1;
    this.supported = typeof Worker !== 'undefined';
    this._initPromise = null;

    if (this.supported) {
      this._initPromise = this._initWorker();
    } else {
      this._initPromise = Promise.resolve();
    }
  }

  async _initWorker() {
    try {
      this.worker = new Worker(new URL('./workers/game-worker.js', import.meta.url), { type: 'module' });
      this.worker.onmessage = (event) => {
        const { id, type, payload, error } = event.data || {};
        const entry = this.pending.get(id);
        if (!entry) return;
        this.pending.delete(id);
        if (type === 'error' || error) {
          entry.reject(new Error(error ? error.message : 'Worker error'));
        } else {
          entry.resolve(payload);
        }
      };
      this.worker.onerror = (error) => {
        console.warn('[GameWorkerProxy] Worker error:', error);
      };
      // Wait for ready signal
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 5000);
        const handler = (event) => {
          if (event.data && event.data.type === 'ready') {
            clearTimeout(timeout);
            resolve();
          }
        };
        this.worker.addEventListener('message', handler, { once: true });
      });
    } catch (e) {
      console.warn('[GameWorkerProxy] Worker unavailable, using main thread fallback:', e.message);
      this.worker = null;
    }
  }

  /**
   * Send a message to the worker and wait for the response.
   * Falls back to null if worker is unavailable.
   */
  async _send(type, payload) {
    await this._initPromise;
    if (!this.worker) return null;

    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ type, id, payload });
      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Worker timeout: ${type}`));
        }
      }, 10000);
    });
  }

  /** Generate a level definition in the worker. */
  async generateLevel(level, context, mode, version) {
    const result = await this._send('generate_level', { level, context, mode, version });
    return result ? result.definition : null;
  }

  /** Simulate a move in the worker. */
  async simulateMove(board, palette, weights, refillState, cells) {
    const result = await this._send('simulate_move', { board, palette, weights, refillState, cells });
    return result ? result.result : null;
  }

  /** Get legal swaps for a board. */
  async legalSwaps(board) {
    const result = await this._send('legal_swaps', { board });
    return result ? result.swaps : [];
  }

  /** Find matches on a board. */
  async findMatches(board) {
    const result = await this._send('find_matches', { board });
    return result ? result.matches : [];
  }

  /** Resolve board cascades. */
  async resolveBoard(board, palette, weights, refillState) {
    const result = await this._send('resolve_board', { board, palette, weights, refillState });
    return result ? { chain: result.chain, score: result.score } : { chain: 0, score: 0 };
  }

  /** Terminate the worker. */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pending.forEach((entry) => entry.reject(new Error('Worker terminated')));
    this.pending.clear();
  }
}

// Singleton
const gameWorker = new GameWorkerProxy();

export { GameWorkerProxy, gameWorker };

if (typeof window !== 'undefined') {
  window.GameWorkerProxy = GameWorkerProxy;
  window.gameWorker = gameWorker;
}
