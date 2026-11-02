/**
 * Infinite Match Performance Overlay
 *
 * Real-time performance debug display showing FPS, frame time, connection
 * quality, memory, long tasks, and frame budget status. Toggled with
 * Ctrl+Shift+P (or Cmd+Shift+P on macOS). Hidden by default in production.
 *
 * Usage:
 *   import { perfOverlay } from './perf-overlay.js';
 *   perfOverlay.init();  // Call after perfMonitor is available
 */

class PerfOverlay {
  constructor() {
    this._el = null;
    this._visible = false;
    this._rafId = null;
    this._perfMonitor = null;
    this._boundToggle = this._toggle.bind(this);

    // Listen for toggle hotkey
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('keydown', this._boundToggle);
    }
  }

  init(perfMonitor) {
    this._perfMonitor = perfMonitor;
    this._createElement();
    this._start();
  }

  _createElement() {
    if (this._el) return;
    const el = document.createElement('div');
    el.id = 'infinite-match-perf-overlay';
    el.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.75);
      color: #0f0;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #0f0;
      pointer-events: none;
      user-select: none;
      display: none;
      min-width: 260px;
    `;
    el.innerHTML = '<div style="margin-bottom:4px; border-bottom:1px solid #0f0; padding-bottom:2px; font-weight:bold;">INFINITE MATCH · PERF</div>';
    document.body.appendChild(el);
    this._el = el;
  }

  _start() {
    if (this._rafId) return;
    this._tick = this._tick.bind(this);
    this._rafId = requestAnimationFrame(this._tick);
  }

  _stop() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }

  _toggle(event) {
    // Ctrl+Shift+P or Cmd+Shift+P
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === 'KeyP') {
      event.preventDefault();
      this.setVisible(!this._visible);
    }
  }

  setVisible(visible) {
    this._visible = visible;
    if (this._el) {
      this._el.style.display = visible ? 'block' : 'none';
      if (visible && !this._rafId) this._start();
      if (!visible) this._stop();
    }
  }

  isVisible() {
    return this._visible;
  }

  _tick() {
    if (!this._visible) {
      this._stop();
      return;
    }
    if (!this._el) return;

    const metrics = this._perfMonitor ? this._perfMonitor.getMetrics() : {};
    const budget = metrics.frameBudget || {};
    const connection = metrics.connection || {};

    const fpsColor = metrics.fps >= 55 ? '#0f0' : metrics.fps >= 30 ? '#ff0' : '#f00';
    const budgetColor = budget.overBudget ? '#f00' : '#0f0';
    const hardPauseColor = budget.hardPaused ? '#f00' : '#0f0';
    const connColor = connection.quality === 'fast' ? '#0f0' : connection.quality === 'moderate' ? '#ff0' : '#f00';

    const lines = [
      `FPS: ${metrics.fps || 0} <span style="color:${fpsColor}">(${Math.round(1000 / Math.max(metrics.fps || 60, 1))}ms)</span>`,
      `Frame budget: ${budget.avgFrameMs ? budget.avgFrameMs.toFixed(1) : '--'}ms <span style="color:${budgetColor}">(${budget.overBudget ? 'OVER' : 'OK'})</span>`,
      `Hard pause: <span style="color:${hardPauseColor}">${budget.hardPaused ? 'YES' : 'no'}</span>`,
      `Long tasks: ${metrics.longTasks || 0}`,
      `Connection: <span style="color:${connColor}">${connection.quality || 'unknown'}</span>`,
      `Low bandwidth: ${connection.lowBandwidthMode ? '<span style="color:#f00">YES</span>' : 'no'}`,
    ];

    const mem = metrics.memory;
    if (mem) {
      const pct = mem.jsHeapSizeLimit ? ((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100).toFixed(0) : '?';
      lines.push(`Memory: ${(mem.usedJSHeapSize / 1048576).toFixed(1)}MB / ${(mem.jsHeapSizeLimit / 1048576).toFixed(0)}MB (${pct}%)`);
    }

    const lcp = metrics.webVitals?.lcp;
    if (lcp !== null && lcp !== undefined) {
      lines.push(`LCP: ${lcp.toFixed(0)}ms`);
    }
    const cls = metrics.webVitals?.cls;
    if (cls !== null && cls !== undefined) {
      lines.push(`CLS: ${cls.toFixed(3)}`);
    }

    this._el.innerHTML = '<div style="margin-bottom:4px; border-bottom:1px solid #0f0; padding-bottom:2px; font-weight:bold;">INFINITE MATCH · PERF</div>' +
      lines.map((line) => `<div style="margin:1px 0">${line}</div>`).join('');
    this._rafId = requestAnimationFrame(this._tick);
  }

  destroy() {
    this._stop();
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
    if (typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('keydown', this._boundToggle);
    }
  }
}

// Singleton
const perfOverlay = new PerfOverlay();

export { PerfOverlay, perfOverlay };

// Auto-expose to window
if (typeof window !== 'undefined') {
  window.PerfOverlay = PerfOverlay;
  window.perfOverlay = perfOverlay;
}
