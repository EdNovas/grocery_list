import { getUserFromRequest, jsonResponse, errorResponse, JWT_SECRET } from '../_shared.js';

// POST /api/list/clear-completed — Remove all completed items
export async function onRequestPost(context) {
  const { env, request } = context;
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) return errorResponse('未登录', 401);

  try {
    await env.DB.prepare(
      'DELETE FROM shopping_list WHERE user_id = ? AND completed = 1'
    ).bind(user.userId).run();
    return jsonResponse({ ok: true });
  } catch (err) {
    return errorResponse('操作失败: ' + err.message, 500);
  }
}
