// Level endpoints for the client: local context, regions, daily level, and a level by number.
// Boards come from src/services/levels (generatedLevel), which is network-free. The existing
// server also adds live weather to the context. The free server skips it, which changes the
// forecast metadata only, not the board rules.
import { localLevelContext, locationCatalog, LevelInputError } from '../src/services/levels/location-context.js';
import { clientRulesVersion, generatedLevel } from '../src/services/levels/level-service.js';
import { ApiError } from './errors.js';

// Same refresh rule as liveLevelContext, without the weather part.
export function levelContext(query, nowMs = Date.now()) {
  const base = localLevelContext(query, nowMs);
  const refresh = [base.refreshAt, base.timeOfDay?.nextChangeAt]
    .filter(Boolean).map(Date.parse).filter((time) => Number.isFinite(time) && time > nowMs);
  const environmentRefreshAt = refresh.length ? new Date(Math.min(...refresh)).toISOString() : '';
  return { ...base, weather: null, environmentRefreshAt };
}

function asApiError(fn) {
  try {
    return fn();
  } catch (error) {
    if (error instanceof LevelInputError) throw new ApiError(400, error.code);
    throw new ApiError(500, 'level_generation_failed');
  }
}

const locationFrom = (query) => Object.fromEntries(query.entries());

export function getLevelContext(query, nowMs = Date.now()) {
  const context = asApiError(() => levelContext(locationFrom(query), nowMs));
  return { success: true, context, serverTime: new Date(nowMs).toISOString() };
}

export function getRegions(query, nowMs = Date.now()) {
  const catalog = asApiError(() => locationCatalog(query.get('country') ?? undefined));
  return { success: true, ...catalog, serverTime: new Date(nowMs).toISOString() };
}

export function getDailyLevel(query, nowMs = Date.now()) {
  const level = asApiError(() => generatedLevel({
    mode: 'daily',
    location: locationFrom(query),
    rulesVersion: clientRulesVersion(query.get('rulesVersion') ?? undefined),
  }, nowMs));
  return { success: true, level, serverTime: new Date(nowMs).toISOString() };
}

export function getLevel(levelParam, query, nowMs = Date.now()) {
  if (!/^\d{1,16}$/.test(levelParam)) throw new ApiError(400, 'invalid_level');
  const level = asApiError(() => generatedLevel({
    level: Number(levelParam),
    mode: query.get('mode') ?? 'classic',
    location: locationFrom(query),
    rulesVersion: clientRulesVersion(query.get('rulesVersion') ?? undefined),
  }, nowMs));
  return { success: true, level, serverTime: new Date(nowMs).toISOString() };
}
