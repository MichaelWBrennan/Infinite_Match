/**
 * Timezone-aware date/time helper.
 *
 * Replaces `moment-timezone` (deprecated, unmaintained) with Day.js
 * (MIT, ~2 kB core) plus its official `utc` and `timezone` plugins. Day.js is
 * the de-facto standard Moment successor, keeping this codebase on a
 * maintained open-source library.
 *
 * The export mirrors the Moment API subset used in this repository:
 *
 *   moment.tz()                       -> now in the default timezone
 *   moment.tz('Asia/Tokyo')           -> now in that timezone
 *   moment.tz(input, 'America/Chicago')   -> parse `input` as if in that timezone
 *   moment.tz(input, 'UTC').tz(target)    -> convert between timezones
 *   moment.tz.setDefault('Europe/Paris')  -> set the default timezone
 *   moment.utc() / moment.utc(input)  -> UTC moments
 *   .format() .diff() .add() .isAfter() .isBefore() .utc() .tz() .valueOf()
 *     -> dayjs instance methods (same names and semantics)
 */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

/** Timezone names never contain digits; date strings always do. */
const looksLikeTimezoneName = (value) =>
  typeof value === 'string' && /\d/.test(value) === false;

/**
 * `moment.tz(...)` dispatch:
 * - no args                 -> now in the default timezone
 * - one timezone name       -> now in that timezone
 * - (input, timezone)       -> parse input as being in that timezone
 */
const tz = (...args) => {
  if (args.length === 0) {
    return dayjs.tz();
  }
  if (args.length === 1 && looksLikeTimezoneName(args[0])) {
    return dayjs().tz(args[0]);
  }
  return dayjs.tz(...args);
};
tz.setDefault = (...args) => dayjs.tz.setDefault(...args);

/** `moment.utc(...)` -> dayjs.utc(...) */
const moment = (input, format) => dayjs(input, format);
moment.tz = tz;
moment.utc = (...args) => dayjs.utc(...args);

export default moment;
