/**
 * GET `url` and return the parsed JSON body. Throws on network errors and on
 * any response with a non-2xx status, mirroring axios behaviour.
 *
 * @param {string} url
 * @param {{ params?: Record<string, unknown>, timeout?: number, headers?: Record<string, string> }} [options]
 * @returns {Promise<any>}
 */
export function getJson(url: string, options?: {
    params?: Record<string, unknown>;
    timeout?: number;
    headers?: Record<string, string>;
}): Promise<any>;
/**
 * POST JSON to `url` and return the parsed JSON body. Throws on network
 * errors and non-2xx statuses.
 *
 * @param {string} url
 * @param {any} body
 * @param {{ timeout?: number, headers?: Record<string, string> }} [options]
 * @returns {Promise<any>}
 */
export function postJson(url: string, body: any, options?: {
    timeout?: number;
    headers?: Record<string, string>;
}): Promise<any>;
/**
 * POST raw text to `url` (ntfy-style endpoints) and return the response text.
 *
 * @param {string} url
 * @param {string} body
 * @param {{ timeout?: number, headers?: Record<string, string> }} [options]
 * @returns {Promise<string>}
 */
export function postText(url: string, body: string, options?: {
    timeout?: number;
    headers?: Record<string, string>;
}): Promise<string>;
//# sourceMappingURL=http.d.ts.map