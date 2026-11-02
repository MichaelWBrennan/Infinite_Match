/**
 * Infinite Match Texture Atlas
 *
 * Combines all gem, UI, and power-up textures into a single atlas so Phaser
 * can batch sprites using one texture instead of issuing a draw call per
 * texture. This is the single biggest rendering win for a match-3 game:
 * instead of ~1800 individual canvas textures (each a separate draw call),
 * the board renders with one texture and a handful of frames.
 *
 * Usage:
 *   const atlas = new TextureAtlas(scene, { size: 64, padding: 2, maxAtlasSize: 2048 });
 *   await atlas.buildFromVisuals(visuals, specialTypes, drawGem, drawShieldFrame);
 *   sprite.setTexture('gem_atlas', atlas.frameKey(type, special, shield));
 *
 * Falls back gracefully: if atlas creation fails, individual canvas textures
 * are used as before (the existing `gemTexture()` path still works).
 */

class TextureAtlas {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.size = options.size || 64;
    this.padding = options.padding || 2;
    this.maxAtlasSize = options.maxAtlasSize || 2048;
    this.atlasName = 'gem_atlas';
    this.frames = new Map(); // frameKey -> { x, y, width, height }
    this.atlasCanvas = null;
    this.atlasContext = null;
    this.atlasTexture = null;
    this.cursorX = 0;
    this.cursorY = 0;
    this.rowHeight = 0;
    this.built = false;
  }

  /**
   * Build the atlas from all gem type/special/shield combinations.
   * drawGem(context, type, special) draws one gem into a 64x64 context.
   * drawShieldFrame(context, shield) draws a shield overlay (optional).
   */
  async buildFromVisuals(visuals, specialTypes, drawGem, drawShieldFrame) {
    if (this.built) return this;
    if (!this.scene || !this.scene.textures) return this;

    // Collect all frame keys we need.
    const entries = [];
    for (const type of Object.keys(visuals)) {
      for (const special of [null, ...specialTypes]) {
        for (const shield of [0, 1, 2]) {
          entries.push({ type, special, shield });
        }
      }
    }

    // Estimate atlas dimensions.
    const cols = Math.floor(this.maxAtlasSize / (this.size + this.padding));
    const rows = Math.ceil(entries.length / cols);
    const atlasSize = Math.min(
      this.maxAtlasSize,
      Math.max(512, Math.ceil(Math.sqrt(entries.length)) * (this.size + this.padding))
    );

    // Create the atlas canvas.
    this.atlasCanvas = document.createElement('canvas');
    this.atlasCanvas.width = atlasSize;
    this.atlasCanvas.height = atlasSize;
    this.atlasContext = this.atlasCanvas.getContext('2d', { willReadFrequently: false });
    this.atlasContext.fillStyle = '#000000';
    this.atlasContext.fillRect(0, 0, atlasSize, atlasSize);

    // Create Phaser texture from the canvas.
    this.atlasTexture = this.scene.textures.createCanvas(this.atlasName, this.atlasCanvas);

    this.cursorX = 0;
    this.cursorY = 0;
    this.rowHeight = this.size + this.padding;

    for (const entry of entries) {
      const frameKey = this.frameKey(entry.type, entry.special, entry.shield);
      const frame = this._allocateFrame();
      if (!frame) {
        // Atlas full: stop adding frames. Remaining entries fall back to
        // individual textures via gemTexture().
        continue;
      }

      // Draw into a temporary offscreen canvas, then copy into the atlas.
      const tmp = document.createElement('canvas');
      tmp.width = this.size;
      tmp.height = this.size;
      const ctx = tmp.getContext('2d', { willReadFrequently: false });

      // Draw the gem.
      if (drawGem) {
        try { drawGem(ctx, entry.type, entry.special); } catch (e) { /* best effort */ }
      }

      // Draw shield overlay if needed.
      if (entry.shield && drawShieldFrame) {
        try { drawShieldFrame(ctx, entry.shield); } catch (e) { /* best effort */ }
      }

      // Copy into atlas at the allocated position.
      this.atlasContext.drawImage(tmp, frame.x, frame.y);

      this.frames.set(frameKey, {
        x: frame.x,
        y: frame.y,
        width: this.size,
        height: this.size,
      });
    }

    // Refresh the Phaser texture so uploaded frames are available.
    this.atlasTexture.refresh();

    this.built = true;
    console.log(
      `🎨 Texture atlas built: ${this.frames.size} frames in ${atlasSize}x${atlasSize}`
    );
    return this;
  }

  /**
   * Allocate a rectangular slot in the atlas for one frame.
   * Simple row-packing: fills left-to-right, then wraps to next row.
   */
  _allocateFrame() {
    const slotW = this.size + this.padding;
    if (this.cursorX + slotW > this.maxAtlasSize) {
      // Wrap to next row.
      this.cursorX = 0;
      this.cursorY += this.rowHeight;
    }
    if (this.cursorY + slotW > this.maxAtlasSize) {
      return null; // Atlas full.
    }
    const frame = { x: this.cursorX, y: this.cursorY };
    this.cursorX += slotW;
    return frame;
  }

  /**
   * Return the frame key for a gem type/special/shield combination.
   */
  frameKey(type, special = null, shield = 0) {
    const base = special ? `gem_${type}_${special}` : `gem_${type}`;
    return shield ? `${base}_shield${shield}` : base;
  }

  /**
   * Check whether a frame exists in the atlas.
   */
  hasFrame(type, special = null, shield = 0) {
    return this.frames.has(this.frameKey(type, special, shield));
  }

  /**
   * Return the Phaser texture key and frame name for a gem.
   * Falls back to the old individual-texture key if the atlas doesn't have it.
   */
  textureFor(type, special = null, shield = 0) {
    const key = this.frameKey(type, special, shield);
    if (this.frames.has(key)) {
      return { texture: this.atlasName, frame: key };
    }
    // Fall back to individual canvas texture.
    return { texture: key, frame: null };
  }

  destroy() {
    if (this.atlasTexture) {
      this.atlasTexture.destroy();
      this.atlasTexture = null;
    }
    this.frames.clear();
    this.built = false;
  }
}

if (typeof window !== 'undefined') {
  window.TextureAtlas = TextureAtlas;
}

export default TextureAtlas;
