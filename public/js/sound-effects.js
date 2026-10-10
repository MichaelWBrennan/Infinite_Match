/* Original, optional procedural sound effects. No files, music, trackers or gameplay RNG.
   Audio is off until explicitly chosen, and contexts unlock only on trusted gestures. */
(function (root) {
  'use strict';
  const SETTINGS_VERSION = 1;
  const DEFAULT_VOLUME = 0.55;
  const MAX_GAIN = 0.18;
  const MAX_VOICES = 8;
  const MIN_GAP = 0.035;
  const note = (frequency, delay, duration, gain, endFrequency = frequency, type = 'sine') =>
    Object.freeze({ frequency, delay, duration, gain, endFrequency, type });
  const cues = Object.freeze({
    select: Object.freeze([note(560, 0, 0.045, 0.12, 410, 'triangle')]),
    invalid: Object.freeze([note(245, 0, 0.09, 0.16, 185)]),
    match: Object.freeze([note(660, 0, 0.11, 0.2), note(990, 0.025, 0.08, 0.09)]),
    cascade: Object.freeze([note(440, 0, 0.09, 0.15), note(660, 0.05, 0.09, 0.15), note(880, 0.1, 0.11, 0.13)]),
    earned: Object.freeze([note(587, 0, 0.09, 0.15), note(783, 0.055, 0.09, 0.15), note(1046, 0.11, 0.12, 0.12)]),
    beam: Object.freeze([note(820, 0, 0.13, 0.16, 330, 'triangle'), note(330, 0.065, 0.08, 0.13)]),
    burst: Object.freeze([note(190, 0, 0.16, 0.3, 65), note(380, 0.01, 0.075, 0.09, 170, 'triangle')]),
    prism: Object.freeze([note(520, 0, 0.08, 0.12), note(650, 0.03, 0.1, 0.12), note(780, 0.065, 0.1, 0.1), note(1040, 0.105, 0.12, 0.08)]),
    'special-combo': Object.freeze([note(294, 0, 0.17, 0.15, 392, 'triangle'), note(440, 0.04, 0.15, 0.14), note(587, 0.09, 0.17, 0.13)]),
    win: Object.freeze([note(523, 0, 0.14, 0.17), note(659, 0.08, 0.14, 0.17), note(784, 0.16, 0.2, 0.16)]),
    loss: Object.freeze([note(330, 0, 0.14, 0.13), note(262, 0.1, 0.17, 0.12)]),
    bank: Object.freeze([note(392, 0, 0.12, 0.14), note(523, 0.07, 0.16, 0.13)]),
    stage: Object.freeze([note(392, 0, 0.075, 0.12), note(588, 0.065, 0.1, 0.12)]),
    hint: Object.freeze([note(740, 0, 0.065, 0.1)]),
    inventory: Object.freeze([note(300, 0, 0.14, 0.2, 150), note(600, 0.04, 0.1, 0.09)]),
    test: Object.freeze([note(523, 0, 0.11, 0.15), note(784, 0.075, 0.13, 0.12)]),
  });
  const priorities = Object.freeze({ select: 0, invalid: 1, match: 1, cascade: 2, earned: 2, beam: 2,
    burst: 2, prism: 3, 'special-combo': 3, win: 4, loss: 4, bank: 4, stage: 2, hint: 1, inventory: 2, test: 4 });
  const aliases = Object.freeze({ gem_select: 'select', combo: 'cascade', bomb_explode: 'burst',
    rainbow_clear: 'prism', lightning_strike: 'beam' });
  const cueName = (name) => Object.hasOwn(aliases, name) ? aliases[name] : Object.hasOwn(cues, name) ? name : null;
  const volumeOf = (value) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : DEFAULT_VOLUME;

  /** Old `sfx:true` saved by the placeholder is not permission to start making sound. */
  function normaliseSettings(settings) {
    return { sfx: settings?.soundChoiceVersion === SETTINGS_VERSION && settings?.sfx === true,
      soundChoiceVersion: SETTINGS_VERSION, soundVolume: volumeOf(settings?.soundVolume) };
  }

  /** One cue per settled action, not per gem/wave; reads only the transition, never RNG. */
  function cueForTransition(result) {
    const events = result?.events || [];
    if (events.some((event) => event.combo)) return 'special-combo';
    const types = events.flatMap((event) => (event.activated || []).map((item) => item.type));
    if (types.includes('prism')) return 'prism';
    if (types.includes('burst')) return 'burst';
    if (types.includes('row') || types.includes('column')) return 'beam';
    if (events.some((event) => event.created?.length)) return 'earned';
    return events.length > 1 ? 'cascade' : 'match';
  }

  function disconnect(voice) {
    try { voice.oscillator.disconnect(); } catch { /* Already disconnected. */ }
    try { voice.gain.disconnect(); } catch { /* Already disconnected. */ }
  }

  /** Used by live playback and OfflineAudioContext QA alike. Destination owns master volume. */
  function scheduleCue(context, destination, name, onEnded = () => {}) {
    const notes = cues[cueName(name)];
    if (!notes) return [];
    const voices = [];
    try {
      const now = context.currentTime;
      for (const item of notes) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const voice = { oscillator, gain };
        voices.push(voice);
        const start = now + item.delay + 0.004;
        const end = start + item.duration;
        oscillator.type = item.type;
        oscillator.frequency.setValueAtTime(item.frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(item.endFrequency, end);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(item.gain, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        gain.gain.linearRampToValueAtTime(0, end + 0.012);
        oscillator.connect(gain); gain.connect(destination);
        oscillator.onended = () => { disconnect(voice); onEnded(voice); };
        oscillator.start(start); oscillator.stop(end + 0.015);
      }
      return voices;
    } catch {
      for (const voice of voices) {
        try { voice.oscillator.stop(); } catch { /* A node may not have started. */ }
        disconnect(voice);
      }
      return [];
    }
  }

  function create(settings = {}, environment = root) {
    const document = environment.document;
    const AudioContext = environment.AudioContext || environment.webkitAudioContext;
    let supported = typeof AudioContext === 'function';
    let preferences = normaliseSettings(settings);
    let context = null; let master = null; let ready = false; let disposed = false;
    let epoch = 0; let allowedEpoch = -1; let resumePending = null; let lastTime = -Infinity; let lastPriority = -1;
    const active = new Set();
    const lastCueTime = new Map();
    const visible = () => document?.hidden !== true && document?.visibilityState !== 'hidden';

    function stop() {
      for (const voice of active) {
        try { voice.oscillator.stop(); } catch { /* Already ended. */ }
        disconnect(voice);
      }
      active.clear(); lastCueTime.clear(); lastTime = -Infinity; lastPriority = -1;
    }
    function suspend() {
      try { context?.suspend()?.catch(() => {}); } catch { /* Sound never blocks game controls. */ }
    }
    function interrupt() {
      epoch++; allowedEpoch = -1; resumePending = null; ready = false; stop(); suspend();
    }
    function configure(next) {
      const previous = preferences;
      preferences = normaliseSettings(next);
      if (!preferences.sfx || preferences.soundVolume === 0) {
        if (previous.sfx || active.size || resumePending) interrupt();
      }
      if (master && context) {
        try {
          master.gain.cancelScheduledValues(context.currentTime);
          master.gain.setValueAtTime(MAX_GAIN * preferences.soundVolume, context.currentTime);
        } catch { interrupt(); }
      }
      return status();
    }
    function status() {
      const state = !supported ? 'unavailable' : !preferences.sfx ? 'off' : preferences.soundVolume === 0 ? 'volume-zero'
        : ready && visible() && context?.state === 'running' ? 'ready' : 'gesture-required';
      return { state, supported, enabled: preferences.sfx, volume: preferences.soundVolume,
        activeVoices: active.size, contextState: context?.state || 'not-created' };
    }
    function onContextState() {
      if (context.state !== 'running') { ready = false; stop(); }
    }
    function unlock(event) {
      // Never construct/resume in response to timers, data loading or synthetic events.
      if (disposed || !supported || !preferences.sfx || preferences.soundVolume === 0 || !visible() || event?.isTrusted !== true) return Promise.resolve(false);
      allowedEpoch = epoch;
      if (!context) {
        try {
          context = new AudioContext({ latencyHint: 'interactive' });
          master = context.createGain(); master.gain.setValueAtTime(MAX_GAIN * preferences.soundVolume, context.currentTime);
          master.connect(context.destination);
          context.addEventListener?.('statechange', onContextState);
        } catch {
          supported = false;
          try { context?.close()?.catch(() => {}); } catch { /* Partially constructed optional API. */ }
          context = null; master = null; return Promise.resolve(false);
        }
      }
      if (context.state === 'running') { ready = true; return Promise.resolve(true); }
      if (context.state === 'closed') return Promise.resolve(false);
      if (resumePending) return resumePending;
      const token = epoch;
      try {
        const attempt = Promise.resolve(context.resume()).then(() => {
          const permitted = allowedEpoch === epoch && !disposed && preferences.sfx && preferences.soundVolume > 0 && visible();
          if (token === epoch) ready = permitted && context.state === 'running';
          // Stale resumes cannot resurrect muted audio, or cancel a newer trusted unlock.
          if (!permitted) { ready = false; suspend(); }
          return token === epoch && ready;
        }).catch(() => { if (token === epoch) ready = false; return false; });
        resumePending = attempt;
        attempt.finally(() => { if (resumePending === attempt) resumePending = null; });
        return attempt;
      } catch { ready = false; return Promise.resolve(false); }
    }
    function play(name) {
      const cue = cueName(name);
      if (disposed || !cue || !preferences.sfx || preferences.soundVolume === 0 || !ready || !visible() || context?.state !== 'running') return false;
      const now = context.currentTime; const priority = priorities[cue];
      if (now - (lastCueTime.get(cue) ?? -Infinity) < (cue === 'select' ? 0.055 : 0.09)) return false;
      if (now - lastTime < MIN_GAP && priority <= lastPriority) return false;
      if (priority >= 3) stop();
      if (active.size + cues[cue].length > MAX_VOICES) return false;
      const voices = scheduleCue(context, master, cue, (voice) => active.delete(voice));
      for (const voice of voices) active.add(voice);
      if (!voices.length) return false;
      lastCueTime.set(cue, now); lastTime = now; lastPriority = priority; return true;
    }
    const onGesture = (event) => {
      // The board's M shortcut may be muting a suspended context, not enabling it.
      if (event.type === 'keydown' && event.key?.toLowerCase() === 'm' && preferences.sfx) return;
      unlock(event);
    };
    const onVisibility = () => { if (!visible()) interrupt(); };
    document?.addEventListener?.('pointerdown', onGesture, { capture: true, passive: true });
    document?.addEventListener?.('keydown', onGesture, true);
    document?.addEventListener?.('visibilitychange', onVisibility);
    environment.addEventListener?.('pagehide', interrupt);
    function destroy() {
      if (disposed) return;
      disposed = true; interrupt();
      document?.removeEventListener?.('pointerdown', onGesture, true);
      document?.removeEventListener?.('keydown', onGesture, true);
      document?.removeEventListener?.('visibilitychange', onVisibility);
      environment.removeEventListener?.('pagehide', interrupt);
      context?.removeEventListener?.('statechange', onContextState);
      try { master?.disconnect(); } catch { /* Already released. */ }
      try { context?.close()?.catch(() => {}); } catch { /* Optional browser teardown. */ }
    }
    return Object.freeze({ configure, unlock, play, stop, interrupt, destroy, status });
  }

  root.InfiniteSoundEffects = Object.freeze({ SETTINGS_VERSION, DEFAULT_VOLUME, MAX_GAIN, MAX_VOICES,
    cueNames: Object.freeze(Object.keys(cues)), cueForTransition, normaliseSettings, scheduleCue, create });
})(globalThis);
