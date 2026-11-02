/**
 * Infinite Match Object Pool
 *
 * Zero-GC memory pool for game objects that are frequently created and
 * destroyed during gameplay (gems, particles, floating text, overlays).
 *
 * Instead of `new` / GC, objects are recycled: `pool.acquire()` returns
 * a pooled instance, `pool.release()` returns it for reuse.
 *
 * Usage:
 *   const gemPool = new ObjectPool(() => ({ x: 0, y: 0, type: null }), (gem) => { gem.type = null; });
 *   const gem = gemPool.acquire();
 *   gemPool.release(gem);
 */

class ObjectPool {
  constructor(createFn, resetFn, initialSize = 16, maxSize = 1024) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
    this._pool = [];
    this._active = new Set();

    // Pre-warm the pool
    for (let i = 0; i < initialSize; i++) {
      this._pool.push(createFn());
    }
  }

  /**
   * Acquire an object from the pool. Creates a new one if the pool is empty
   * and we haven't hit maxSize.
   */
  acquire() {
    let obj = this._pool.pop();
    if (!obj) {
      if (this._active.size >= this.maxSize) {
        // Pool exhausted: create a temporary object (not pooled)
        return this.createFn();
      }
      obj = this.createFn();
    }
    this._active.add(obj);
    return obj;
  }

  /**
   * Release an object back to the pool. The resetFn is called to clear state.
   */
  release(obj) {
    if (!this._active.has(obj)) return; // Already released or not from this pool
    this._active.delete(obj);
    if (this.resetFn) {
      try { this.resetFn(obj); } catch (e) { /* ignore reset errors */ }
    }
    if (this._pool.length < this.maxSize) {
      this._pool.push(obj);
    }
  }

  /**
   * Release all active objects back to the pool.
   */
  releaseAll() {
    for (const obj of this._active) {
      if (this.resetFn) {
        try { this.resetFn(obj); } catch (e) { /* ignore */ }
      }
      if (this._pool.length < this.maxSize) {
        this._pool.push(obj);
      }
    }
    this._active.clear();
  }

  /**
   * Get current pool statistics.
   */
  getStats() {
    return {
      pooled: this._pool.length,
      active: this._active.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Shrink the pool to release memory (call when entering background).
   */
  shrink() {
    this._pool.length = 0;
  }
}

// Pre-configured pools for common game objects

/**
 * Pool for gem data objects (not Phaser sprites - those are managed by Phaser).
 * Used for board model cells and match data.
 */
export const gemDataPool = new ObjectPool(
  () => ({ type: null, special: null, shield: 0, matched: false }),
  (gem) => { gem.type = null; gem.special = null; gem.shield = 0; gem.matched = false; },
  64, 512
);

/**
 * Pool for match result objects.
 */
export const matchResultPool = new ObjectPool(
  () => ({ cells: [], score: 0, chain: 0, specials: [] }),
  (result) => { result.cells.length = 0; result.score = 0; result.chain = 0; result.specials.length = 0; },
  32, 256
);

/**
 * Pool for floating text / score popup objects.
 */
export const floatingTextPool = new ObjectPool(
  () => ({ text: '', x: 0, y: 0, alpha: 1, scale: 1, lifetime: 0 }),
  (t) => { t.text = ''; t.x = 0; t.y = 0; t.alpha = 1; t.scale = 1; t.lifetime = 0; },
  16, 128
);

/**
 * Pool for power-up effect objects.
 */
export const powerUpPool = new ObjectPool(
  () => ({ type: null, cells: [], x: 0, y: 0 }),
  (p) => { p.type = null; p.cells.length = 0; p.x = 0; p.y = 0; },
  8, 64
);

export default ObjectPool;
