import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { execSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { X509Certificate } from 'crypto';
import { generateKeyPair, SignJWT, createLocalJWKSet, exportJWK } from 'jose';
import { verifyAppleSignedPayload, verifyGooglePubSubToken } from '../services/payments/store-notifications.js';

const b64url = (buf: Buffer | string) => Buffer.from(buf).toString('base64url');

describe('Apple signedPayload verification', () => {
  let dir: string;
  let rootPem: string;
  let leafKeyPem: string;
  let x5c: string[];
  let otherRootPem: string;

  // Builds root -> intermediate -> leaf with openssl, the way Apple's chain is shaped.
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apple-jws-'));
    const sh = (cmd: string) => execSync(cmd, { cwd: dir, stdio: 'pipe' });
    const caExt = 'basicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign\n';
    const leafExt = 'basicConstraints=CA:FALSE\nkeyUsage=critical,digitalSignature\n';
    fs.writeFileSync(path.join(dir, 'ca.ext'), caExt);
    fs.writeFileSync(path.join(dir, 'leaf.ext'), leafExt);

    sh('openssl ecparam -name prime256v1 -genkey -noout -out root.key');
    sh('openssl req -x509 -new -key root.key -subj "/CN=Test Root CA" -days 3650 -out root.pem -addext "basicConstraints=critical,CA:TRUE" -addext "keyUsage=critical,keyCertSign"');
    sh('openssl ecparam -name prime256v1 -genkey -noout -out inter.key');
    sh('openssl req -new -key inter.key -subj "/CN=Test Intermediate" -out inter.csr');
    sh('openssl x509 -req -in inter.csr -CA root.pem -CAkey root.key -CAcreateserial -days 3650 -extfile ca.ext -out inter.pem');
    sh('openssl ecparam -name prime256v1 -genkey -noout -out leaf.key');
    sh('openssl req -new -key leaf.key -subj "/CN=Test Leaf" -out leaf.csr');
    sh('openssl x509 -req -in leaf.csr -CA inter.pem -CAkey inter.key -CAcreateserial -days 3650 -extfile leaf.ext -out leaf.pem');
    sh('openssl ecparam -name prime256v1 -genkey -noout -out other.key');
    sh('openssl req -x509 -new -key other.key -subj "/CN=Other Root" -days 3650 -out other.pem');

    rootPem = fs.readFileSync(path.join(dir, 'root.pem'), 'utf-8');
    otherRootPem = fs.readFileSync(path.join(dir, 'other.pem'), 'utf-8');
    leafKeyPem = fs.readFileSync(path.join(dir, 'leaf.key'), 'utf-8');
    const leaf = new X509Certificate(fs.readFileSync(path.join(dir, 'leaf.pem')));
    const inter = new X509Certificate(fs.readFileSync(path.join(dir, 'inter.pem')));
    x5c = [leaf.raw.toString('base64'), inter.raw.toString('base64')];
  });

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function sign(payload: object, { alg = 'ES256', key = leafKeyPem, chain = x5c } = {}) {
    const header = b64url(JSON.stringify({ alg, x5c: chain }));
    const body = b64url(JSON.stringify(payload));
    const signature = crypto.sign('sha256', Buffer.from(`${header}.${body}`), {
      key,
      dsaEncoding: 'ieee-p1363',
    });
    return `${header}.${body}.${b64url(signature)}`;
  }

  test('accepts a payload signed by a leaf that chains to the pinned root', () => {
    const jws = sign({ notificationType: 'DID_RENEW', notificationUUID: 'u1' });
    const payload = verifyAppleSignedPayload(jws, { rootCertPem: rootPem });
    expect(payload.notificationType).toBe('DID_RENEW');
  });

  test('accepts a chain that also includes the root certificate', () => {
    const root = new X509Certificate(rootPem);
    const jws = sign({ notificationType: 'TEST' }, { chain: [...x5c, root.raw.toString('base64')] });
    expect(verifyAppleSignedPayload(jws, { rootCertPem: rootPem }).notificationType).toBe('TEST');
  });

  test('rejects a tampered payload', () => {
    const jws = sign({ notificationType: 'DID_RENEW' });
    const [h, , s] = jws.split('.');
    const forged = `${h}.${b64url(JSON.stringify({ notificationType: 'SUBSCRIBED' }))}.${s}`;
    expect(() => verifyAppleSignedPayload(forged, { rootCertPem: rootPem })).toThrow('signature');
  });

  test('rejects a chain that ends at a different root', () => {
    const jws = sign({ notificationType: 'DID_RENEW' });
    expect(() => verifyAppleSignedPayload(jws, { rootCertPem: otherRootPem })).toThrow('pinned Apple root');
  });

  test('rejects a self-made chain with no link to the pinned root', () => {
    const fake = sign({ notificationType: 'DID_RENEW' }, {
      key: leafKeyPem,
      chain: [x5c[0]], // leaf only: never reaches the pinned root
    });
    expect(() => verifyAppleSignedPayload(fake, { rootCertPem: rootPem })).toThrow();
  });

  test('rejects certificates outside their validity window', () => {
    const jws = sign({ notificationType: 'DID_RENEW' });
    const farFuture = Date.parse('2200-01-01T00:00:00Z');
    expect(() => verifyAppleSignedPayload(jws, { rootCertPem: rootPem, now: farFuture })).toThrow('validity');
  });

  test('rejects an algorithm other than ES256', () => {
    const jws = sign({ notificationType: 'DID_RENEW' }, { alg: 'RS256' });
    expect(() => verifyAppleSignedPayload(jws, { rootCertPem: rootPem })).toThrow('alg');
  });

  test('fails closed when the pinned root is not configured', () => {
    const jws = sign({ notificationType: 'DID_RENEW' });
    expect(() => verifyAppleSignedPayload(jws, { rootCertPem: '' })).toThrow('not configured');
  });
});

describe('Google Pub/Sub token verification', () => {
  const audience = 'https://example.test/api/subscriptions/google';
  const email = 'rtdn@project.iam.gserviceaccount.com';
  let privateKey: any;
  let jwks: any;

  beforeAll(async () => {
    const pair = await generateKeyPair('RS256');
    privateKey = pair.privateKey;
    const jwk = await exportJWK(pair.publicKey);
    jwks = createLocalJWKSet({ keys: [{ ...jwk, alg: 'RS256', kid: 'k1', use: 'sig' }] });
  });

  async function token(claims: Record<string, unknown> = {}, opts: { iss?: string; aud?: string } = {}) {
    return new SignJWT({ email, email_verified: true, ...claims })
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer(opts.iss ?? 'https://accounts.google.com')
      .setAudience(opts.aud ?? audience)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);
  }

  test('accepts a token from the configured service account', async () => {
    const jwt = await token();
    const payload = await verifyGooglePubSubToken(`Bearer ${jwt}`, { audience, serviceAccountEmail: email, jwks });
    expect(payload.email).toBe(email);
  });

  test('rejects a token for another service account', async () => {
    const jwt = await token({ email: 'attacker@evil.example' });
    await expect(
      verifyGooglePubSubToken(`Bearer ${jwt}`, { audience, serviceAccountEmail: email, jwks }),
    ).rejects.toThrow('service account');
  });

  test('rejects a token for another audience or issuer', async () => {
    await expect(
      verifyGooglePubSubToken(`Bearer ${await token({}, { aud: 'https://other' })}`, {
        audience,
        serviceAccountEmail: email,
        jwks,
      }),
    ).rejects.toThrow();
    await expect(
      verifyGooglePubSubToken(`Bearer ${await token({}, { iss: 'https://evil.example' })}`, {
        audience,
        serviceAccountEmail: email,
        jwks,
      }),
    ).rejects.toThrow();
  });

  test('rejects requests without a bearer token and when unconfigured', async () => {
    await expect(
      verifyGooglePubSubToken(undefined, { audience, serviceAccountEmail: email, jwks }),
    ).rejects.toThrow('bearer');
    await expect(verifyGooglePubSubToken('Bearer x', { audience: '', serviceAccountEmail: '' })).rejects.toThrow(
      'not configured',
    );
  });
});
