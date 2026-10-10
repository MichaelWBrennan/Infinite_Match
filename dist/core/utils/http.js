/**
 * Minimal HTTP helpers on the platform-native `fetch` (Node 18+, undici).
 *
 * Replaces `axios` and `node-fetch` with zero dependencies. The helpers throw
 * on non-2xx responses (like axios did) so existing `try/catch` error paths
 * keep working unchanged.
 */
/**
 * Build a URL with query parameters, skipping null/undefined values.
 *
 * @param {string} url
 * @param {Record<string, unknown>} [params]
 */
function withParams(url, params) {
    if (!params)
        return url;
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            search.append(key, String(value));
        }
    }
    const query = search.toString();
    if (!query)
        return url;
    return url.includes('?') ? `${url}&${query}` : `${url}?${query}`;
}
/**
 * GET `url` and return the parsed JSON body. Throws on network errors and on
 * any response with a non-2xx status, mirroring axios behaviour.
 *
 * @param {string} url
 * @param {{ params?: Record<string, unknown>, timeout?: number, headers?: Record<string, string> }} [options]
 * @returns {Promise<any>}
 */
export async function getJson(url, options = {}) {
    const { params, timeout = 10000, headers } = options;
    const response = await fetch(withParams(url, params), {
        method: 'GET',
        headers: { Accept: 'application/json', ...headers },
        signal: AbortSignal.timeout(timeout),
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
    }
    return response.json();
}
/**
 * POST JSON to `url` and return the parsed JSON body. Throws on network
 * errors and non-2xx statuses.
 *
 * @param {string} url
 * @param {any} body
 * @param {{ timeout?: number, headers?: Record<string, string> }} [options]
 * @returns {Promise<any>}
 */
export async function postJson(url, body, options = {}) {
    const { timeout = 10000, headers } = options;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeout),
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
    }
    return response.json();
}
/**
 * POST raw text to `url` (ntfy-style endpoints) and return the response text.
 *
 * @param {string} url
 * @param {string} body
 * @param {{ timeout?: number, headers?: Record<string, string> }} [options]
 * @returns {Promise<string>}
 */
export async function postText(url, body, options = {}) {
    const { timeout = 10000, headers } = options;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8', ...headers },
        body,
        signal: AbortSignal.timeout(timeout),
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
    }
    return response.text();
}
//# sourceMappingURL=http.js.map