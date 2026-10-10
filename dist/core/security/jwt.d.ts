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
export function sign(payload: object, secret: string, options?: {
    expiresIn?: string | number;
    issuer?: string;
    audience?: string;
}): Promise<string>;
/**
 * Verify an HS256 JWT and return its decoded payload. Throws when the
 * signature is invalid or the token is expired.
 *
 * @param {string} token
 * @param {string} secret
 * @returns {Promise<object>}
 */
export function verify(token: string, secret: string): Promise<object>;
declare namespace _default {
    export { sign };
    export { verify };
}
export default _default;
//# sourceMappingURL=jwt.d.ts.map