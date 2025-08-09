import { createHmac, timingSafeEqual } from 'crypto';

export const ADMIN_COOKIE_NAME = '__Host-admin_session';

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET não configurado. Defina no ambiente.');
  }
  return secret;
}

function toBase64Url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function fromBase64Url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

export type AdminSessionPayload = {
  iat: number; // issued at (unix seconds)
  exp: number; // expiration (unix seconds)
  role: 'admin';
};

/**
 * Cria um token assinado (HMAC-SHA256) contendo iat/exp.
 */
export function createAdminSessionToken(maxAgeSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = { iat: now, exp: now + maxAgeSeconds, role: 'admin' };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = toBase64Url(payloadJson);
  const mac = createHmac('sha256', getSecret()).update(payloadB64).digest();
  const sigB64 = toBase64Url(mac);
  return `${payloadB64}.${sigB64}`;
}

export function verifyAdminSessionToken(token: string): AdminSessionPayload | null {
  try {
    const [payloadB64, sigB64] = token.split('.', 2);
    if (!payloadB64 || !sigB64) return null;
    const expected = createHmac('sha256', getSecret()).update(payloadB64).digest();
    const provided = fromBase64Url(sigB64);
    if (expected.length !== provided.length) return null;
    if (!timingSafeEqual(expected, provided)) return null;
    const payload = JSON.parse(fromBase64Url(payloadB64).toString('utf8')) as AdminSessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.role !== 'admin' || payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAdminTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [rawName, ...rest] = part.trim().split('=');
    if (rawName === ADMIN_COOKIE_NAME) {
      return rest.join('=');
    }
  }
  return null;
}

export function isAdminRequest(request: Request): boolean {
  const token = getAdminTokenFromRequest(request);
  if (!token) return false;
  return verifyAdminSessionToken(token) !== null;
}


