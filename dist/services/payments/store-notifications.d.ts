/**
 * Verifies an Apple signedPayload and returns its decoded payload.
 * Throws on any failure. `now` is injectable for tests.
 */
export function verifyAppleSignedPayload(jws: any, { rootCertPem, now }?: {
    now?: number | undefined;
}): any;
/**
 * Verifies the Google Pub/Sub OIDC token on an RTDN push request.
 * `jwks` may be injected (tests); otherwise Google's public certificates are used.
 */
export function verifyGooglePubSubToken(authorizationHeader: any, { audience, serviceAccountEmail, jwks }?: {
    jwks?: null | undefined;
}): Promise<import("jose").JWTPayload>;
declare namespace _default {
    export { verifyAppleSignedPayload };
    export { verifyGooglePubSubToken };
}
export default _default;
//# sourceMappingURL=store-notifications.d.ts.map