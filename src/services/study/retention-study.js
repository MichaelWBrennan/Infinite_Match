// Explicitly opt-in, single-process web return study. The file holds only keyed
// pseudonyms and UTC calendar days. It is not an economy, session or crash log.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHmac, randomBytes } from 'node:crypto';

export const RETENTION_DAYS = 35;
export const MIN_RETENTION_SAMPLE = 20;
const MAX_FILE_BYTES = 16 * 1024 * 1024;
const UTC_DAY = /^\d{4}-\d{2}-\d{2}$/;
const EMPTY = () => ({ version: 1, participants: {} });
const dayOf = (time) => new Date(time).toISOString().slice(0, 10);
const shiftDay = (day, offset) => dayOf(Date.parse(`${day}T00:00:00Z`) + offset * 86400000);
const dayDistance = (a, b) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000);
const rate = (numerator, denominator) => denominator ? Number((numerator / denominator).toFixed(3)) : null;

export function retentionEnabled(env = process.env) {
  return env.RETENTION_STUDY_ENABLED === '1'
    && typeof env.RETENTION_STUDY_KEY === 'string' && env.RETENTION_STUDY_KEY.length >= 32;
}
export const retentionStudyFile = () => process.env.RETENTION_STUDY_FILE || path.resolve('var', 'studies', 'retention.json');

function validated(data) {
  if (!data || data.version !== 1 || !data.participants || typeof data.participants !== 'object'
    || Array.isArray(data.participants) || Object.keys(data).sort().join(',') !== 'participants,version') {
    throw new Error('invalid_retention_study_file');
  }
  for (const [key, record] of Object.entries(data.participants)) {
    if (!/^[0-9a-f]{40}$/.test(key) || !record || Object.keys(record).sort().join(',') !== 'days,start'
      || !UTC_DAY.test(record.start) || !Array.isArray(record.days)
      || record.days.length < 1 || record.days.length > RETENTION_DAYS + 1
      || record.days[0] !== record.start || new Set(record.days).size !== record.days.length
      || record.days.some((day) => typeof day !== 'string' || !UTC_DAY.test(day) || day < record.start)) {
      throw new Error('invalid_retention_study_file');
    }
  }
  return data;
}

export function retentionSummary(records, nowMs = Date.now(), minSample = MIN_RETENTION_SAMPLE) {
  const today = dayOf(nowMs);
  const from = shiftDay(today, -28);
  const cohorts = new Map();
  for (const record of Object.values(records)) {
    if (!record || !UTC_DAY.test(record.start) || record.start < from || record.start > today) continue;
    if (!cohorts.has(record.start)) cohorts.set(record.start, []);
    cohorts.get(record.start).push(record);
  }
  const eligible = (rows, offset) => rows.filter((r) => dayDistance(today, r.start) >= offset);
  const metric = (rows, offset) => {
    const sample = eligible(rows, offset);
    if (sample.length < minSample) return { eligible: null, returned: null, rate: null, suppressed: true };
    const returned = sample.filter((r) => r.days.includes(shiftDay(r.start, offset))).length;
    return { eligible: sample.length, returned, rate: rate(returned, sample.length), suppressed: false };
  };
  const all = [...cohorts.values()].flat();
  const visible = [...cohorts].filter(([, rows]) => rows.length >= minSample)
    .map(([day, rows]) => ({ enrolledDay: day, enrolled: rows.length, d1: metric(rows, 1), d7: metric(rows, 7) }))
    .sort((a, b) => a.enrolledDay.localeCompare(b.enrolledDay));
  return { fromDay: from, throughDay: today,
    enrolled: all.length >= minSample ? all.length : null,
    enrolledSuppressed: all.length < minSample,
    d1: metric(all, 1), d7: metric(all, 7),
    cohorts: visible, suppressedCohorts: cohorts.size - visible.length,
    basis: 'consented authenticated web app opens by UTC day; not all sessions or unique devices' };
}

export class RetentionStudyStore {
  constructor(file = null) {
    this.file = file;
    this.data = null;
    this.queue = Promise.resolve();
  }
  filePath() { return this.file || retentionStudyFile(); }
  pseudonym(playerId, key = process.env.RETENTION_STUDY_KEY) {
    if (typeof key !== 'string' || key.length < 32 || typeof playerId !== 'string' || !playerId) {
      throw new Error('retention_study_key_required');
    }
    return createHmac('sha256', key).update(`web-return-study-v1:${playerId}`).digest('hex').slice(0, 40);
  }
  async load() {
    if (this.data) return;
    try {
      const file = this.filePath();
      if ((await fs.stat(file)).size > MAX_FILE_BYTES) throw new Error('retention_study_file_too_large');
      this.data = validated(JSON.parse(await fs.readFile(file, 'utf8')));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error; // Corruption must never silently erase consent.
      this.data = EMPTY();
    }
  }
  async save(draft) {
    const file = this.filePath();
    await fs.mkdir(path.dirname(file), { recursive: true });
    const temp = `${file}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`;
    const serialized = JSON.stringify(draft);
    if (Buffer.byteLength(serialized) > MAX_FILE_BYTES) throw new Error('retention_study_file_too_large');
    try {
      await fs.writeFile(temp, serialized, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
      await fs.rename(temp, file);
    } finally {
      await fs.rm(temp, { force: true }).catch(() => {});
    }
  }
  async transact(nowMs, fn) {
    const run = this.queue.then(async () => {
      await this.load();
      const draft = structuredClone(this.data);
      const cutoff = shiftDay(dayOf(nowMs), -RETENTION_DAYS);
      let changed = false;
      for (const [id, record] of Object.entries(draft.participants)) {
        if (record.start < cutoff) { delete draft.participants[id]; changed = true; }
      }
      const response = fn(draft, () => { changed = true; });
      if (changed) { await this.save(draft); this.data = draft; }
      return response;
    });
    this.queue = run.catch(() => {});
    return run;
  }
  async status(playerId, nowMs = Date.now()) {
    const id = this.pseudonym(playerId);
    return this.transact(nowMs, (data) => ({ consented: !!data.participants[id] }));
  }
  async optIn(playerId, nowMs = Date.now()) {
    const id = this.pseudonym(playerId);
    const day = dayOf(nowMs);
    return this.transact(nowMs, (data, changed) => {
      if (!data.participants[id]) {
        data.participants[id] = { start: day, days: [day] };
        changed();
      }
      return { consented: true }; // Repeated opt-in must not reset the cohort.
    });
  }
  async visit(playerId, nowMs = Date.now()) {
    const id = this.pseudonym(playerId);
    const day = dayOf(nowMs);
    return this.transact(nowMs, (data, changed) => {
      const record = data.participants[id];
      if (!record) return { consented: false, counted: false };
      if (record.start > day || record.days.includes(day)) return { consented: true, counted: false };
      record.days.push(day);
      record.days.sort();
      changed();
      return { consented: true, counted: true };
    });
  }
  async withdraw(playerId, nowMs = Date.now()) {
    const id = this.pseudonym(playerId);
    return this.transact(nowMs, (data, changed) => {
      if (data.participants[id]) { delete data.participants[id]; changed(); }
      return { consented: false };
    });
  }
  async report(nowMs = Date.now()) {
    return this.transact(nowMs, (data) => retentionSummary(data.participants, nowMs));
  }
}
export const retentionStudyStore = new RetentionStudyStore();
