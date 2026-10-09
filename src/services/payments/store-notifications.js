/**
 * Verification for store subscription notifications. Nothing is recorded until
 * the sender is proven, because these events drive subscription state.
 *
 * Apple (App Store Server Notifications V2): the signedPayload is an ES256 JWS.
 * Its x5c header carries the signing chain. The chain must link to a pinned
 * Apple Root CA - G3 supplied by the operator (APPLE_ROOT_CA_G3, PEM). The
 * root is never taken from the message itself.
 *
 * Google (Pub/Sub push for Real-time Developer Notifications): the request
 * carries a Google-signed OIDC token in the Authorization header. It must be
 * issued by Google for the configured audience and the configured service account.
 */

import crypto from 'crypto';
import { X509Certificate } from 'crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

function decodeSegment(segment) {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf-8'));
}

/**
 * Verifies an Apple signedPayload and returns its decoded payload.
 * Throws on any failure. `now` is injectable for tests.
 */
export function verifyAppleSignedPayload(jws, { rootCertPem, now = Date.now() } = {}) {
  if (!rootCertPem) throw new Error('APPLE_ROOT_CA_G3 is not configured');
  if (typeof jws !== 'string') throw new Error('signedPayload must be a string');

  const parts = jws.split('.');
  if (parts.length !== 3) throw new Error('signedPayload is not a compact JWS');
  const [headerB64, payloadB64, signatureB64] = parts;

  const header = decodeSegment(headerB64);
  if (header.alg !== 'ES256') throw new Error('unexpected alg');
  if (!Array.isArray(header.x5c) || header.x5c.length < 2) throw new Error('x5c chain missing');

  const root = new X509Certificate(rootCertPem);
  // Apple may include the root in x5c. The pinned copy is the only root we trust.
  const chain = header.x5c
    .map((der) => new X509Certificate(Buffer.from(der, 'base64')))
    .filter((cert) => cert.fingerprint256 !== root.fingerprint256);
  if (chain.length === 0) throw new Error('x5c contains only the root');

  for (const cert of chain) {
    if (now < Date.parse(cert.validFrom) || now > Date.parse(cert.validTo)) {
      throw new Error('certificate outside its validity window');
    }
  }
  // Each certificate must be signed by the next, and the last one by the pinned root.
  for (let i = 0; i < chain.length; i++) {
    const issuer = i + 1 < chain.length ? chain[i + 1] : root;
    if (!chain[i].checkIssued(issuer) || !chain[i].verify(issuer.publicKey)) {
      throw new Error('certificate chain does not link to the pinned Apple root');
    }
  }

  const leaf = chain[0];
  const valid = crypto.verify(
    'sha256',
    Buffer.from(`${headerB64}.${payloadB64}`),
    { key: leaf.publicKey, dsaEncoding: 'ieee-p1363' },
    Buffer.from(signatureB64, 'base64url'),
  );
  if (!valid) throw new Error('signature does not verify');

  return decodeSegment(payloadB64);
}

let defaultGoogleJwks = null;
function googleJwks() {
  if (!defaultGoogleJwks) defaultGoogleJwks = createRemoteJWKSet(new URL(GOOGLE_CERTS_URL));
  return defaultGoogleJwks;
}

/**
 * Verifies the Google Pub/Sub OIDC token on an RTDN push request.
 * `jwks` may be injected (tests); otherwise Google's public certificates are used.
 */
export async function verifyGooglePubSubToken(
  authorizationHeader,
  { audience, serviceAccountEmail, jwks = null } = {},
) {
  if (!audience || !serviceAccountEmail) {
    throw new Error('GOOGLE_RTDN_AUDIENCE and GOOGLE_RTDN_SERVICE_ACCOUNT are not configured');
  }
  const match = /^Bearer (.+)$/.exec(authorizationHeader || '');
  if (!match) throw new Error('missing bearer token');

  const { payload } = await jwtVerify(match[1], jwks || googleJwks(), {
    issuer: GOOGLE_ISSUERS,
    audience,
    algorithms: ['RS256'],
  });
  if (payload.email !== serviceAccountEmail || payload.email_verified !== true) {
    throw new Error('token was not issued to the configured service account');
  }
  return payload;
}

export default { verifyAppleSignedPayload, verifyGooglePubSubToken };
