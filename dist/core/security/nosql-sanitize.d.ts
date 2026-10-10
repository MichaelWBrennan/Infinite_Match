/**
 * NoSQL operator-injection sanitizer.
 *
 * Replaces the unmaintained `express-mongo-sanitize` package, which breaks on
 * Express 5 (`req.query`/`req.params` are getter-only there, and the package
 * tries to assign over them). This middleware strips MongoDB operator keys
 * (`$gt`, `$where`, ...) and dot-notation keys from request bodies, query
 * strings and route parameters by mutating container objects in place, which
 * works with both Express 4 and Express 5.
 */
/** Keys that can carry a Mongo operator or path traversal. */
export function isDangerousKey(key: any): boolean;
/**
 * Express middleware that removes Mongo operator keys from `req.body`,
 * `req.query` and `req.params`.
 */
export function mongoSanitize(): (req: any, res: any, next: any) => void;
export default mongoSanitize;
//# sourceMappingURL=nosql-sanitize.d.ts.map