import { getUserFromRequest, jsonResponse, errorResponse, clearTokenCookie, JWT_SECRET } from '../_shared.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) {
    return errorResponse('未登录', 401);
  }

  // Fetch admin status from DB
  const row = await env.DB.prepare('SELECT is_admin FROM users WHERE id = ?')
    .bind(user.userId).first();

  return jsonResponse({
    user: {
      id: user.userId,
      username: user.username,
      isAdmin: !!(row?.is_admin),
    }
  });
}

export async function onRequestPost(context) {
  // Logout
  const response = jsonResponse({ ok: true });
  return clearTokenCookie(response);
}
