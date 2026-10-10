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
export function isDangerousKey(key) {
    return (typeof key === 'string' && (key.startsWith('$') || key.includes('.')));
}
function stripKeysInPlace(value, depth = 0) {
    // Depth guard: request payloads are shallow; refuse to walk pathological
    // nesting that could burn CPU.
    if (depth > 32 || value === null || typeof value !== 'object') {
        return;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            stripKeysInPlace(item, depth + 1);
        }
        return;
    }
    for (const key of Object.keys(value)) {
        if (isDangerousKey(key)) {
            delete value[key];
        }
        else {
            stripKeysInPlace(value[key], depth + 1);
        }
    }
}
/**
 * Express middleware that removes Mongo operator keys from `req.body`,
 * `req.query` and `req.params`.
 */
export function mongoSanitize() {
    return function mongoSanitizeMiddleware(req, res, next) {
        try {
            if (req.body && typeof req.body === 'object') {
                stripKeysInPlace(req.body);
            }
            if (req.query && typeof req.query === 'object') {
                stripKeysInPlace(req.query);
            }
            if (req.params && typeof req.params === 'object') {
                stripKeysInPlace(req.params);
            }
        }
        catch {
            // A malformed payload must fail closed: drop the offending structures
            // rather than letting operator keys through.
            if (req.body && typeof req.body === 'object') {
                for (const key of Object.keys(req.body)) {
                    delete req.body[key];
                }
            }
        }
        next();
    };
}
export default mongoSanitize;
//# sourceMappingURL=nosql-sanitize.js.map