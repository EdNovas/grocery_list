import { getUserFromRequest, jsonResponse, errorResponse, clearTokenCookie, JWT_SECRET } from '../_shared.js';

export async function onRequestGet(context) {
  const user = getUserFromRequest(context.request, JWT_SECRET);
  if (!user) {
    return errorResponse('未登录', 401);
  }
  return jsonResponse({ user: { id: user.userId, username: user.username } });
}

export async function onRequestPost(context) {
  // Logout
  const response = jsonResponse({ ok: true });
  return clearTokenCookie(response);
}
