import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const defaultCookieName = 'token';

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain, hashed) {
  return await bcrypt.compare(plain, hashed);
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fallback to a runtime-random secret to avoid crashes locally,
    // but remind that deployments MUST set JWT_SECRET.
    return crypto.createHash('sha256').update('fallback-secret').digest('hex');
  }
  return secret;
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function signJwt(payload, expiresInSeconds = 60 * 60 * 8) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { iat: now, exp: now + expiresInSeconds, ...payload };
  const headerEncoded = base64url(JSON.stringify(header));
  const payloadEncoded = base64url(JSON.stringify(body));
  const data = `${headerEncoded}.${payloadEncoded}`;
  const signature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${signature}`;
}

export function verifyJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const data = `${h}.${p}`;
  const expected = crypto
    .createHmac('sha256', getJwtSecret())
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  if (expected !== s) return null;
  try {
    const payload = JSON.parse(Buffer.from(p, 'base64').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setAuthCookie(res, token, cookieName = defaultCookieName) {
  const maxAge = 60 * 60 * 8; // 8 hours
  const cookie = [
    `${cookieName}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAge}`,
    `Secure`,
  ].join('; ');
  res.setHeader('Set-Cookie', cookie);
}

export function clearAuthCookie(res, cookieName = defaultCookieName) {
  const cookie = [
    `${cookieName}=`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=0`,
    `Secure`,
  ].join('; ');
  res.setHeader('Set-Cookie', cookie);
}

export function getTokenFromRequest(req, cookieName = defaultCookieName) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (header && typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.substring(7);
  }
  const cookie = req.headers.cookie || '';
  const match = cookie.split(';').map(s => s.trim()).find(s => s.startsWith(`${cookieName}=`));
  if (match) return match.substring(cookieName.length + 1);
  return null;
}

export function requireRole(req, res, role) {
  const { verifyJwt, getTokenFromRequest } = exports; // ensure same module scope
  const token = getTokenFromRequest(req);
  const payload = verifyJwt(token);
  if (!payload || payload.role !== role) {
    res.status(401).json({ success: false, message: '未授权' });
    return null;
  }
  return payload;
}


