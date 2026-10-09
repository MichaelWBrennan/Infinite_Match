/**
 * Where level results are kept. The server appends each reported result, and the tuning job
 * reads them back. The file store is the default: one JSONL file (LEVEL_RESULTS_FILE). The memory
 * store is a double for tests, and a single process can use it when no file is wanted.
 *
 * A store has two methods: append(record) and read() -> { records, skipped }.
 */

import { appendLevelResult, readLevelResults, levelResultsFile } from './level-tuning.js';

export class FileLevelResultsStore {
  constructor(file = null) {
    this.file = file;
  }

  // Resolved at call time, so the path can be set after the store is created.
  path() {
    return this.file || levelResultsFile();
  }

  append(record) {
    return appendLevelResult(record, this.path());
  }

  read() {
    return readLevelResults(this.path());
  }
}

export class MemoryLevelResultsStore {
  constructor() {
    this.records = [];
  }

  async append(record) {
    this.records.push({ ...record, ts: Date.now() });
  }

  async read() {
    return { records: this.records.map((r) => ({ ...r })), skipped: 0 };
  }
}

let current = null;

/** The store the server uses. Created on first use as a file store. */
export function levelResultsStore() {
  if (!current) current = new FileLevelResultsStore();
  return current;
}

/** Replaces the store (used by tests and by hosts that bring their own). */
export function setLevelResultsStore(store) {
  current = store;
}
