// Shared utilities for Pages Functions

// Simple JWT-like token using base64 (for demo purposes)
// In production, use a proper JWT library with CF Workers
export function createToken(payload, secret) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
  const sig = btoa(secret + '.' + body);
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const body = JSON.parse(atob(parts[1]));
    const expectedSig = btoa(secret + '.' + parts[1]);
    if (parts[2] !== expectedSig) return null;
    if (body.exp && body.exp < Date.now()) return null;
    return body;
  } catch {
    return null;
  }
}

// Simple password hashing (for demo; in production use bcrypt via a Worker-compatible library)
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_grocery_salt_2024');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password, hash) {
  const computed = await hashPassword(password);
  return computed === hash;
}

// Extract user from request cookie
export function getUserFromRequest(request, secret) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/token=([^;]+)/);
  if (!match) return null;
  return verifyToken(match[1], secret);
}

// JSON response helpers
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// Set auth cookie
export function setTokenCookie(response, token) {
  const headers = new Headers(response.headers);
  headers.append('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
  return new Response(response.body, { status: response.status, headers });
}

export function clearTokenCookie(response) {
  const headers = new Headers(response.headers);
  headers.append('Set-Cookie', 'token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  return new Response(response.body, { status: response.status, headers });
}

const JWT_SECRET = 'grocery-list-secret-2024';
export { JWT_SECRET };
