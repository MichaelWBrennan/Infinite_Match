/* Original, optional procedural audio. No files, trackers or gameplay RNG.
   Sound effects and music are off until explicitly chosen, and contexts unlock
   only on trusted gestures. Music is procedural (synthesised), not streamed. */
(function (root) {
  'use strict';
  const SETTINGS_VERSION = 1;
  const DEFAULT_VOLUME = 0.55;
  const MAX_GAIN = 0.18;
  const MAX_VOICES = 8;
  const MUSIC_MAX_VOICES = 24;
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
    ray: Object.freeze([note(880, 0, 0.08, 0.14, 440, 'sawtooth'), note(659, 0.05, 0.06, 0.12)]),
    spectrum: Object.freeze([note(1046, 0, 0.06, 0.13, 1318, 'triangle'), note(1318, 0.04, 0.06, 0.12, 1568), note(1568, 0.04, 0.08, 0.1)]),
    shift: Object.freeze([note(600, 0, 0.05, 0.1), note(800, 0.03, 0.05, 0.1)]),
    hammer: Object.freeze([note(400, 0, 0.08, 0.15, 200)]),
    gift: Object.freeze([note(659, 0, 0.08, 0.12), note(784, 0.06, 0.08, 0.12), note(1046, 0.12, 0.12, 0.1)]),
    levelup: Object.freeze([note(523, 0, 0.1, 0.14), note(659, 0.08, 0.1, 0.14), note(784, 0.08, 0.12, 0.15), note(1046, 0.16, 0.2, 0.16)]),
    notification: Object.freeze([note(800, 0, 0.06, 0.1), note(1000, 0.1, 0.06, 0.1)]),
  });
  const priorities = Object.freeze({ select: 0, invalid: 1, match: 1, cascade: 2, earned: 2, beam: 2,
    burst: 2, prism: 3, 'special-combo': 3, win: 4, loss: 4, bank: 4, stage: 2, hint: 1, inventory: 2, test: 4,
    ray: 2, spectrum: 3, shift: 1, hammer: 2, gift: 3, levelup: 4, notification: 2 });
  // Procedural music cues — synthesised patterns, no streaming or files.
  const musicCues = Object.freeze({
    title: Object.freeze([
      note(523, 0, 0.5, 0.06), note(587, 0.5, 0.5, 0.06), note(659, 1.0, 0.5, 0.06), note(698, 1.5, 1.0, 0.08),
      note(659, 2.5, 0.5, 0.06), note(587, 3.0, 0.5, 0.06), note(523, 3.5, 1.0, 0.08),
    ]),
    gameplay: Object.freeze([
      note(440, 0, 0.3, 0.04), note(554, 0.3, 0.3, 0.04), note(659, 0.6, 0.3, 0.04), note(880, 0.9, 0.6, 0.05),
      note(659, 1.5, 0.3, 0.04), note(554, 1.8, 0.3, 0.04), note(440, 2.1, 0.6, 0.05),
      note(523, 2.7, 0.3, 0.04), note(659, 3.0, 0.3, 0.04), note(784, 3.3, 0.3, 0.04), note(880, 3.6, 0.6, 0.05),
    ]),
    kingdom: Object.freeze([
      note(392, 0, 0.6, 0.05, 392, 'triangle'), note(494, 0.6, 0.6, 0.05), note(587, 1.2, 0.6, 0.05),
      note(784, 1.8, 1.0, 0.06), note(587, 2.8, 0.6, 0.05), note(494, 3.4, 0.6, 0.05), note(392, 4.0, 1.0, 0.06),
    ]),
    win: Object.freeze([
      note(523, 0, 0.2, 0.08), note(659, 0.2, 0.2, 0.08), note(784, 0.4, 0.2, 0.08), note(1046, 0.6, 0.4, 0.1),
      note(784, 1.0, 0.2, 0.08), note(1046, 1.2, 0.2, 0.08), note(1318, 1.4, 0.4, 0.1),
    ]),
    levelcomplete: Object.freeze([
      note(523, 0, 0.18, 0.08), note(659, 0.18, 0.18, 0.08), note(784, 0.36, 0.18, 0.08), note(1046, 0.54, 0.36, 0.1),
      note(988, 0.9, 0.18, 0.08), note(1046, 1.08, 0.18, 0.08), note(1318, 1.26, 0.5, 0.1),
    ]),
  });
  const musicAliases = Object.freeze({ level_complete: 'levelcomplete', victory: 'win' });
  const musicCueName = (name) => Object.hasOwn(musicAliases, name) ? musicAliases[name] : Object.hasOwn(musicCues, name) ? name : null;
  const musicLoops = (name) => name !== 'win' && name !== 'levelcomplete';

  const aliases = Object.freeze({ gem_select: 'select', combo: 'cascade', blast: 'burst',
    prism_clear: 'prism', bolt_strike: 'beam' });
  const cueName = (name) => Object.hasOwn(aliases, name) ? aliases[name] : Object.hasOwn(cues, name) ? name : null;
  const volumeOf = (value) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : DEFAULT_VOLUME;

  /** Old `sfx:true` saved by the placeholder is not permission to start making sound. */
  function normaliseSettings(settings) {
    return { sfx: settings?.soundChoiceVersion === SETTINGS_VERSION && settings?.sfx === true,
      soundChoiceVersion: SETTINGS_VERSION, soundVolume: volumeOf(settings?.soundVolume),
      music: settings?.soundChoiceVersion === SETTINGS_VERSION && settings?.music === true,
      musicVolume: volumeOf(settings?.musicVolume ?? 0.5) };
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
    let context = null; let master = null; let musicMaster = null; let ready = false; let disposed = false;
    let epoch = 0; let allowedEpoch = -1; let resumePending = null; let lastTime = -Infinity; let lastPriority = -1;
    const active = new Set();
    const lastCueTime = new Map();
    // Music state: a bounded, cancellable procedural loop, never a streamed file.
    let musicGain = null; let musicTimer = null; let musicLooping = false; let currentMusic = null;
    const musicVoices = new Set();
    let musicPreferences = { enabled: preferences.music, volume: preferences.musicVolume };
    const visible = () => document?.hidden !== true && document?.visibilityState !== 'hidden';
    const sfxWanted = () => preferences.sfx && preferences.soundVolume > 0;
    const musicWanted = () => musicPreferences.enabled && musicPreferences.volume > 0;
    const audioWanted = () => sfxWanted() || musicWanted();
    const later = (fn, ms) => (typeof environment.setTimeout === 'function' ? environment.setTimeout(fn, ms) : null);
    const cancelLater = (timer) => { if (timer != null && typeof environment.clearTimeout === 'function') environment.clearTimeout(timer); };

    function stopSfx() {
      for (const voice of active) {
        try { voice.oscillator.stop(); } catch { /* Already ended. */ }
        disconnect(voice);
      }
      active.clear(); lastCueTime.clear(); lastTime = -Infinity; lastPriority = -1;
    }

    function stopMusic() {
      musicLooping = false; currentMusic = null;
      cancelLater(musicTimer); musicTimer = null;
      for (const voice of musicVoices) {
        try { voice.oscillator.stop(); } catch { /* Already ended. */ }
        disconnect(voice);
      }
      musicVoices.clear();
      if (musicGain) {
        try { musicGain.disconnect(); } catch { /* Already released. */ }
        musicGain = null;
      }
    }

    function stop() { stopSfx(); stopMusic(); }

    function scheduleMusicPattern(notes) {
      if (!context || !musicGain) return false;
      let scheduled = false;
      for (const item of notes) {
        if (musicVoices.size >= MUSIC_MAX_VOICES) break;
        try {
          const start = context.currentTime + item.delay + 0.004;
          const end = start + item.duration;
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          const voice = { oscillator, gain };
          oscillator.type = item.type || 'triangle';
          oscillator.frequency.setValueAtTime(item.frequency, start);
          oscillator.frequency.exponentialRampToValueAtTime(item.endFrequency || item.frequency, end);
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(item.gain * 0.5, start + Math.min(0.05, item.duration * 0.25));
          gain.gain.exponentialRampToValueAtTime(0.0001, end);
          gain.gain.linearRampToValueAtTime(0, end + 0.02);
          oscillator.connect(gain); gain.connect(musicGain);
          oscillator.onended = () => { disconnect(voice); musicVoices.delete(voice); };
          oscillator.start(start); oscillator.stop(end + 0.03);
          musicVoices.add(voice);
          scheduled = true;
        } catch { /* A missing optional node must never block play. */ }
      }
      return scheduled;
    }

    function playMusic(name) {
      const cueName = musicCueName(name);
      if (disposed || !supported || !musicWanted() || !context || context.state !== 'running' || !cueName) return false;
      stopMusic();
      const notes = musicCues[cueName];
      try {
        musicGain = context.createGain();
        musicGain.gain.setValueAtTime(1, context.currentTime);
        musicGain.connect(musicMaster || context.destination);
      } catch { musicGain = null; return false; }
      if (!scheduleMusicPattern(notes)) { stopMusic(); return false; }
      currentMusic = cueName;
      musicLooping = musicLoops(cueName);
      if (musicLooping) {
        const seconds = notes.reduce((max, item) => Math.max(max, item.delay + item.duration), 0) + 0.5;
        const loop = () => {
          musicTimer = null;
          if (!musicLooping || disposed || !context || context.state !== 'running' || !musicWanted()) return;
          if (!scheduleMusicPattern(notes)) { stopMusic(); return; }
          musicTimer = later(loop, seconds * 1000);
        };
        musicTimer = later(loop, seconds * 1000);
      }
      return true;
    }

    function suspend() {
      try { context?.suspend()?.catch(() => {}); } catch { /* Sound never blocks game controls. */ }
    }
    function interrupt() {
      epoch++; allowedEpoch = -1; resumePending = null; ready = false; stop(); suspend();
    }
    function setBusGains() {
      if (!context) return;
      try {
        if (master) {
          master.gain.cancelScheduledValues(context.currentTime);
          master.gain.setValueAtTime(MAX_GAIN * preferences.soundVolume, context.currentTime);
        }
        if (musicMaster) {
          musicMaster.gain.cancelScheduledValues(context.currentTime);
          musicMaster.gain.setValueAtTime(MAX_GAIN * musicPreferences.volume, context.currentTime);
        }
      } catch { interrupt(); }
    }
    function configure(next) {
      const previous = preferences;
      const previousMusic = musicPreferences;
      preferences = normaliseSettings(next);
      musicPreferences = { enabled: preferences.music, volume: preferences.musicVolume };
      const wanted = audioWanted();
      const previouslyWanted = (previous.sfx && previous.soundVolume > 0) || (previousMusic.enabled && previousMusic.volume > 0);
      if (!wanted) {
        if (previouslyWanted || active.size || musicVoices.size || resumePending) interrupt();
      } else {
        if (!sfxWanted()) stopSfx();
        if (!musicWanted()) stopMusic();
        else if (ready && context?.state === 'running' && (!previousMusic.enabled || !currentMusic)) playMusic(currentMusic || 'gameplay');
        setBusGains();
      }
      return status();
    }
    function status() {
      const wanted = audioWanted();
      const anyEnabled = preferences.sfx || musicPreferences.enabled;
      const state = !supported ? 'unavailable' : !anyEnabled ? 'off' : !wanted ? 'volume-zero'
        : ready && visible() && context?.state === 'running' ? 'ready' : 'gesture-required';
      return { state, supported, enabled: preferences.sfx, volume: preferences.soundVolume,
        activeVoices: active.size, contextState: context?.state || 'not-created',
        music: musicPreferences.enabled, musicVolume: musicPreferences.volume,
        musicPlaying: musicLooping || musicVoices.size > 0, musicCue: currentMusic };
    }
    function onContextState() {
      if (context.state !== 'running') { ready = false; stop(); }
    }
    function unlock(event) {
      // Never construct/resume in response to timers, data loading or synthetic events.
      if (disposed || !supported || !audioWanted() || !visible() || event?.isTrusted !== true) return Promise.resolve(false);
      allowedEpoch = epoch;
      if (!context) {
        try {
          context = new AudioContext({ latencyHint: 'interactive' });
          master = context.createGain(); master.gain.setValueAtTime(MAX_GAIN * preferences.soundVolume, context.currentTime);
          master.connect(context.destination);
          musicMaster = context.createGain(); musicMaster.gain.setValueAtTime(MAX_GAIN * musicPreferences.volume, context.currentTime);
          musicMaster.connect(context.destination);
          context.addEventListener?.('statechange', onContextState);
        } catch {
          supported = false;
          try { context?.close()?.catch(() => {}); } catch { /* Partially constructed optional API. */ }
          context = null; master = null; musicMaster = null; return Promise.resolve(false);
        }
      }
      const finishReady = () => {
        ready = true;
        if (musicWanted() && !currentMusic) playMusic(currentMusic || 'gameplay');
        return true;
      };
      if (context.state === 'running') return Promise.resolve(finishReady());
      if (context.state === 'closed') return Promise.resolve(false);
      if (resumePending) return resumePending;
      const token = epoch;
      try {
        const attempt = Promise.resolve(context.resume()).then(() => {
          const permitted = allowedEpoch === epoch && !disposed && audioWanted() && visible();
          if (token === epoch) ready = permitted && context.state === 'running';
          // Stale resumes cannot resurrect muted audio, or cancel a newer trusted unlock.
          if (!permitted) { ready = false; suspend(); return false; }
          return token === epoch && ready ? finishReady() : false;
        }).catch(() => { if (token === epoch) ready = false; return false; });
        resumePending = attempt;
        attempt.finally(() => { if (resumePending === attempt) resumePending = null; });
        return attempt;
      } catch { ready = false; return Promise.resolve(false); }
    }
    function play(name) {
      const cue = cueName(name);
      if (disposed || !cue || !sfxWanted() || !ready || !visible() || context?.state !== 'running') return false;
      const now = context.currentTime; const priority = priorities[cue] ?? 1;
      if (now - (lastCueTime.get(cue) ?? -Infinity) < (cue === 'select' ? 0.055 : 0.09)) return false;
      if (now - lastTime < MIN_GAP && priority <= lastPriority) return false;
      if (priority >= 3) stopSfx();
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
      try { musicMaster?.disconnect(); } catch { /* Already released. */ }
      try { context?.close()?.catch(() => {}); } catch { /* Optional browser teardown. */ }
    }
    return Object.freeze({ configure, unlock, play, stop, interrupt, destroy, status,
      playMusic, stopMusic, musicStatus: () => ({ enabled: musicPreferences.enabled, volume: musicPreferences.volume,
        playing: musicLooping || musicVoices.size > 0, cue: currentMusic }) });
  }

  root.InfiniteSoundEffects = Object.freeze({ SETTINGS_VERSION, DEFAULT_VOLUME, MAX_GAIN, MAX_VOICES, MUSIC_MAX_VOICES,
    cueNames: Object.freeze(Object.keys(cues)), musicCueNames: Object.freeze(Object.keys(musicCues)),
    cueForTransition, normaliseSettings, scheduleCue, create });
})(globalThis);
