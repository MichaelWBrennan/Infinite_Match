import { describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('public/js/sound-effects.js', 'utf8');
function helpers() { const root: any = {}; vm.createContext(root); vm.runInContext(source, root); return root.InfiniteSoundEffects; }
const enabled = { sfx: true, soundChoiceVersion: 1, soundVolume: 0.55 };
const gesture = { isTrusted: true };

function target() {
  const handlers = new Map<string, Set<any>>();
  return { handlers, hidden: false, visibilityState: 'visible',
    addEventListener: (type: string, fn: any) => { if (!handlers.has(type)) handlers.set(type, new Set()); handlers.get(type)!.add(fn); },
    removeEventListener: (type: string, fn: any) => handlers.get(type)?.delete(fn),
    emit: (type: string, event: any = gesture) => handlers.get(type)?.forEach((fn) => fn(event)),
  };
}

function environment(initialState = 'suspended') {
  const instances: any[] = []; const document = target(); const globalEvents = target();
  function parameter() {
    const events: any[] = [];
    const value: any = { events };
    for (const name of ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'cancelScheduledValues'])
      value[name] = (...args: any[]) => { events.push([name, ...args]); return value; };
    return value;
  }
  class FakeContext {
    state = initialState; currentTime = 0; destination = {}; oscillators: any[] = []; gains: any[] = [];
    events = target(); resumeCalls = 0; suspendCalls = 0; closeCalls = 0;
    options: any;
    constructor(options: any) { this.options = options; instances.push(this); }
    createGain() { const gain = { gain: parameter(), connected: true, connect() {}, disconnect() { this.connected = false; } }; this.gains.push(gain); return gain; }
    createOscillator() {
      const oscillator = { type: '', frequency: parameter(), onended: null, starts: [] as number[], stops: [] as number[], connected: true,
        connect() {}, disconnect() { this.connected = false; }, start(time: number) { this.starts.push(time); }, stop(time: number) { this.stops.push(time); } };
      this.oscillators.push(oscillator); return oscillator;
    }
    resume() { this.resumeCalls++; this.state = 'running'; return Promise.resolve(); }
    suspend() { this.suspendCalls++; this.state = 'suspended'; return Promise.resolve(); }
    close() { this.closeCalls++; this.state = 'closed'; return Promise.resolve(); }
    addEventListener(type: string, fn: any) { this.events.addEventListener(type, fn); }
    removeEventListener(type: string, fn: any) { this.events.removeEventListener(type, fn); }
  }
  return { instances, document, env: { document, AudioContext: FakeContext, addEventListener: globalEvents.addEventListener,
    removeEventListener: globalEvents.removeEventListener }, globalEvents };
}

describe('original opt-in sound settings and semantic cues', () => {
  test('fresh and legacy-placeholder preferences are silent, not implicit audio consent', () => {
    const api = helpers();
    for (const settings of [undefined, {}, { sfx: true }, { sfx: true, music: true }, { sfx: true, soundChoiceVersion: 0 },
      { sfx: 'true', soundChoiceVersion: 1 }]) expect(api.normaliseSettings(settings).sfx).toBe(false);
    expect(api.normaliseSettings(enabled).sfx).toBe(true);
  });

  test.each([[0, 0], [1, 1], [-1, 0], [2, 1], [NaN, 0.55], [Infinity, 0.55], ['0.2', 0.55], [undefined, 0.55]])('volume %j normalises to %j', (input, output) => {
    expect(helpers().normaliseSettings({ ...enabled, soundVolume: input }).soundVolume).toBe(output);
  });

  test.each([
    [{ events: [{}] }, 'match'], [{ events: [{}, {}] }, 'cascade'],
    [{ events: [{ created: [{ type: 'row' }] }] }, 'earned'],
    [{ events: [{ activated: [{ type: 'row' }] }] }, 'beam'], [{ events: [{ activated: [{ type: 'column' }] }] }, 'beam'],
    [{ events: [{ activated: [{ type: 'burst' }] }] }, 'burst'], [{ events: [{ activated: [{ type: 'prism' }] }] }, 'prism'],
    [{ events: [{ combo: 'beam+beam', activated: [{ type: 'prism' }] }] }, 'special-combo'],
    [{ events: [{ created: [{ type: 'row' }] }, { activated: [{ type: 'burst' }] }] }, 'burst'],
  ])('transition selects %s without modifying its result', (result, cue) => {
    const before = JSON.stringify(result); expect(helpers().cueForTransition(result)).toBe(cue); expect(JSON.stringify(result)).toBe(before);
  });

  test('all cues schedule short, finite, enveloped original oscillators and clean up after ending', () => {
    const api = helpers(); const names = Array.from(api.cueNames);
    expect(new Set(names).size).toBe(16);
    const signatures = new Set();
    for (const name of names) {
      const mock = environment('running'); const context: any = new mock.env.AudioContext({});
      const voices = api.scheduleCue(context, context.destination, name);
      expect(voices.length).toBeGreaterThan(0); expect(voices.length).toBeLessThanOrEqual(4);
      for (const voice of voices) {
        const events = voice.gain.gain.events; const start = voice.oscillator.starts[0]; const end = voice.oscillator.stops[0];
        expect(start).toBeGreaterThan(0); expect(end).toBeLessThan(0.5); expect(end).toBeGreaterThan(start);
        expect(events[0]).toEqual(['setValueAtTime', 0, start]);
        expect(events.some((event: any[]) => event[0] === 'linearRampToValueAtTime' && event[1] === 0)).toBe(true);
        for (const [, ...numbers] of [...events, ...voice.oscillator.frequency.events]) expect(numbers.every(Number.isFinite)).toBe(true);
        voice.oscillator.onended(); expect(voice.oscillator.connected).toBe(false); expect(voice.gain.connected).toBe(false);
      }
      signatures.add(JSON.stringify(context.oscillators.map((oscillator: any) => [oscillator.type, oscillator.frequency.events, oscillator.starts, oscillator.stops])));
    }
    expect(signatures.size).toBe(16);
    expect(api.MAX_GAIN).toBeLessThan(0.2); expect(api.MAX_VOICES).toBe(8);
    expect(source).not.toMatch(/Math\.random|nextRandom|fetch\(|new Image|\.load\.audio|mediaDevices|generateSpeech/);
  });
});

describe('bounded, gesture-gated optional audio lifetime', () => {
  test('no context or resume on creation, muted play, settings load, or muted player gestures', async () => {
    const api = helpers(); const mock = environment(); const sound = api.create({}, mock.env);
    sound.configure({ sfx: true }); // Legacy placeholder, still off.
    expect(sound.play('win')).toBe(false); expect(await sound.unlock(gesture)).toBe(false);
    mock.document.emit('pointerdown'); expect(mock.instances).toHaveLength(0); expect(sound.status().state).toBe('off');
  });

  test('saved opt-in waits for a trusted gesture and never queues earlier dropped cues', async () => {
    const api = helpers(); const mock = environment(); const sound = api.create(enabled, mock.env);
    expect(sound.play('win')).toBe(false); expect(mock.instances).toHaveLength(0);
    expect(await sound.unlock({ isTrusted: false })).toBe(false); expect(await sound.unlock({})).toBe(false);
    expect(mock.instances).toHaveLength(0);
    expect(await sound.unlock(gesture)).toBe(true); expect(mock.instances).toHaveLength(1);
    expect(mock.instances[0].options).toEqual({ latencyHint: 'interactive' });
    expect(mock.instances[0].oscillators).toHaveLength(0);
    expect(sound.play('match')).toBe(true); expect(sound.status().state).toBe('ready');
    await sound.unlock(gesture); expect(mock.instances).toHaveLength(1);
  });

  test('muting and zero volume immediately stop nodes without waking or creating a context', async () => {
    const api = helpers(); const mock = environment(); const sound = api.create(enabled, mock.env); await sound.unlock(gesture);
    sound.play('prism'); expect(sound.status().activeVoices).toBe(4);
    sound.configure({ ...enabled, sfx: false }); expect(sound.status().activeVoices).toBe(0);
    expect(mock.instances[0].oscillators.every((oscillator: any) => !oscillator.connected)).toBe(true);
    expect(sound.play('win')).toBe(false);
    const resumes = mock.instances[0].resumeCalls;
    sound.configure({ ...enabled, soundVolume: 0 }); expect(await sound.unlock(gesture)).toBe(false);
    expect(mock.instances[0].resumeCalls).toBe(resumes); expect(sound.status().state).toBe('volume-zero');
  });

  test('fast repeated cues are throttled, node budgets stay bounded, and win supersedes unfinished effects', async () => {
    const api = helpers(); const mock = environment(); const sound = api.create(enabled, mock.env); await sound.unlock(gesture);
    expect(sound.play('select')).toBe(true); expect(sound.play('select')).toBe(false);
    expect(sound.play('match')).toBe(true); expect(sound.play('match')).toBe(false);
    const context = mock.instances[0];
    for (const cue of ['cascade', 'earned', 'beam', 'burst', 'inventory']) {
      context.currentTime += 0.1; sound.play(cue); expect(sound.status().activeVoices).toBeLessThanOrEqual(api.MAX_VOICES);
    }
    context.currentTime += 0.1; expect(sound.play('win')).toBe(true); expect(sound.status().activeVoices).toBe(3);
    context.oscillators.slice(-3).forEach((oscillator: any) => oscillator.onended()); expect(sound.status().activeVoices).toBe(0);
  });

  test('hidden tabs and pagehide cancel sound; becoming visible does not autoplay or resume', async () => {
    const api = helpers(); const mock = environment(); const sound = api.create(enabled, mock.env); await sound.unlock(gesture); sound.play('win');
    mock.document.hidden = true; mock.document.visibilityState = 'hidden'; mock.document.emit('visibilitychange');
    expect(sound.status().activeVoices).toBe(0); expect(sound.play('win')).toBe(false);
    const resumes = mock.instances[0].resumeCalls;
    mock.document.hidden = false; mock.document.visibilityState = 'visible'; mock.document.emit('visibilitychange');
    expect(mock.instances[0].resumeCalls).toBe(resumes); expect(sound.play('win')).toBe(false);
    await sound.unlock(gesture); expect(sound.play('match')).toBe(true);
    mock.globalEvents.emit('pagehide'); expect(sound.status().activeVoices).toBe(0);
  });

  test('OS/browser audio interruption requires another player gesture', async () => {
    const api = helpers(); const mock = environment(); const sound = api.create(enabled, mock.env); await sound.unlock(gesture); sound.play('match');
    const context = mock.instances[0]; context.state = 'interrupted'; context.events.emit('statechange');
    expect(sound.status().activeVoices).toBe(0); expect(sound.play('prism')).toBe(false);
    context.state = 'running'; context.events.emit('statechange'); expect(sound.play('prism')).toBe(false);
    expect(await sound.unlock(gesture)).toBe(true); expect(sound.play('prism')).toBe(true);
  });

  test('destroy is idempotent, closes/releases audio, removes listeners and forbids future playback', async () => {
    const api = helpers(); const mock = environment(); const sound = api.create(enabled, mock.env); await sound.unlock(gesture); sound.play('match');
    sound.destroy(); sound.destroy();
    expect(mock.instances[0].closeCalls).toBe(1); expect(sound.status().activeVoices).toBe(0);
    expect([...mock.document.handlers.values()].every((set) => set.size === 0)).toBe(true);
    expect([...mock.globalEvents.handlers.values()].every((set) => set.size === 0)).toBe(true);
    expect([...mock.instances[0].events.handlers.values()].every((set) => (set as Set<unknown>).size === 0)).toBe(true);
    expect(mock.instances[0].gains[0].connected).toBe(false);
    expect(await sound.unlock(gesture)).toBe(false); expect(sound.play('win')).toBe(false);
  });

  test('webkit-prefixed audio is supported without an eager context', async () => {
    const api = helpers(); const mock = environment();
    const sound = api.create(enabled, { ...mock.env, AudioContext: undefined, webkitAudioContext: mock.env.AudioContext });
    expect(mock.instances).toHaveLength(0); expect(await sound.unlock(gesture)).toBe(true); expect(sound.play('match')).toBe(true);
  });

  test('no Web Audio, construction failures, rejected resumes and node failures stay silent without throwing', async () => {
    const api = helpers(); const unsupported = api.create(enabled, {});
    expect(unsupported.status().supported).toBe(false); expect(await unsupported.unlock(gesture)).toBe(false); expect(unsupported.play('match')).toBe(false);
    const broken = api.create(enabled, { AudioContext: class { constructor() { throw new Error('not available'); } } });
    expect(await broken.unlock(gesture)).toBe(false); expect(broken.status().state).toBe('unavailable');
    const mock = environment(); const sound = api.create(enabled, mock.env); await sound.unlock(gesture);
    const context = mock.instances[0]; context.createOscillator = () => { throw new Error('node'); };
    expect(sound.play('win')).toBe(false); expect(sound.status().activeVoices).toBe(0);
    context.state = 'suspended'; context.resume = () => Promise.reject(new Error('blocked'));
    expect(await sound.unlock(gesture)).toBe(false); expect(sound.play('match')).toBe(false);
  });

  test('a delayed resume cannot resurrect sound after mute, hide or teardown', async () => {
    const api = helpers();
    for (const interruption of ['mute', 'hide', 'destroy']) {
      const mock = environment(); const sound = api.create(enabled, mock.env);
      // Construct the context and replace its pending resume before it resolves.
      mock.env.AudioContext.prototype.resume = function () { this.resumeCalls++; return new Promise<void>((resolve) => { (this as any).finish = () => { this.state = 'running'; resolve(); }; }); };
      const pending = sound.unlock(gesture); const context = mock.instances[0];
      if (interruption === 'mute') sound.configure({ ...enabled, sfx: false });
      else if (interruption === 'hide') { mock.document.hidden = true; mock.document.emit('visibilitychange'); }
      else sound.destroy();
      context.finish(); expect(await pending).toBe(false); expect(sound.play('win')).toBe(false); expect(sound.status().activeVoices).toBe(0);
      expect(context.state).not.toBe('running');
    }
  });

  test('mute/unmute can replace a cancelled pending resume without stale work cancelling the fresh gesture', async () => {
    const api = helpers(); const mock = environment(); const sound = api.create(enabled, mock.env);
    const finishes: Array<() => void> = [];
    mock.env.AudioContext.prototype.resume = function () {
      this.resumeCalls++; return new Promise<void>((resolve) => { finishes.push(() => { this.state = 'running'; resolve(); }); });
    };
    const stale = sound.unlock(gesture); sound.configure({ ...enabled, sfx: false }); sound.configure(enabled);
    const fresh = sound.unlock(gesture); expect(mock.instances[0].resumeCalls).toBe(2);
    finishes[0]!(); expect(await stale).toBe(false);
    finishes[1]!(); expect(await fresh).toBe(true); expect(sound.status().state).toBe('ready');
    expect(sound.play('match')).toBe(true);
  });

  test('zero-volume opt-in and unknown sound names allocate no voices', async () => {
    const api = helpers(); const mock = environment(); const sound = api.create({ ...enabled, soundVolume: 0 }, mock.env);
    expect(await sound.unlock(gesture)).toBe(false); expect(mock.instances).toHaveLength(0);
    sound.configure(enabled); await sound.unlock(gesture);
    for (const name of ['unknown', '__proto__', 'constructor', '', null, undefined]) expect(sound.play(name)).toBe(false);
    expect(mock.instances[0].oscillators).toHaveLength(0);
  });
});
