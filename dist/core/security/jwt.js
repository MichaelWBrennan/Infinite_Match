/**
 * Minimal HS256 JWT helpers on top of `jose` (MIT, ESM-native, zero-dep).
 *
 * Replaces `jsonwebtoken` with the modern standard library while keeping the
 * `sign` / `verify` call shape. Both functions are async (jose is async-only),
 * which is fine for Express 5 middleware and service methods.
 */
import { SignJWT, jwtVerify } from 'jose';
const encoder = new TextEncoder();
/**
 * Sign `payload` as an HS256 JWT.
 *
 * @param {object} payload
 * @param {string} secret
 * @param {{ expiresIn?: string | number, issuer?: string, audience?: string }} [options]
 *   `expiresIn` accepts the same duration strings as before ('24h', '7d', ...)
 *   or a number of seconds.
 * @returns {Promise<string>}
 */
export async function sign(payload, secret, options = {}) {
    let jwt = new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt();
    if (options.expiresIn !== undefined) {
        jwt = jwt.setExpirationTime(options.expiresIn);
    }
    if (options.issuer) {
        jwt = jwt.setIssuer(options.issuer);
    }
    if (options.audience) {
        jwt = jwt.setAudience(options.audience);
    }
    return jwt.sign(encoder.encode(secret));
}
/**
 * Verify an HS256 JWT and return its decoded payload. Throws when the
 * signature is invalid or the token is expired.
 *
 * @param {string} token
 * @param {string} secret
 * @returns {Promise<object>}
 */
export async function verify(token, secret) {
    const { payload } = await jwtVerify(token, encoder.encode(secret), {
        algorithms: ['HS256'],
    });
    return payload;
}
export default { sign, verify };
//# sourceMappingURL=jwt.js.map