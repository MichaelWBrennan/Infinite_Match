export default moment;
/** `moment.utc(...)` -> dayjs.utc(...) */
declare function moment(input: any, format: any): dayjs.Dayjs;
declare namespace moment {
    export { tz };
    export function utc(...args: any[]): dayjs.Dayjs;
}
import dayjs from 'dayjs';
/**
 * `moment.tz(...)` dispatch:
 * - no args                 -> now in the default timezone
 * - one timezone name       -> now in that timezone
 * - (input, timezone)       -> parse input as being in that timezone
 */
declare function tz(...args: any[]): dayjs.Dayjs;
declare namespace tz {
    function setDefault(...args: any[]): void;
}
//# sourceMappingURL=datetime.d.ts.map