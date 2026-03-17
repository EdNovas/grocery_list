import { getUserFromRequest, jsonResponse, errorResponse, JWT_SECRET } from '../_shared.js';

// POST /api/list/complete-all — Mark all items as completed
export async function onRequestPost(context) {
  const { env, request } = context;
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) return errorResponse('未登录', 401);

  try {
    await env.DB.prepare(
      'UPDATE shopping_list SET completed = 1 WHERE user_id = ?'
    ).bind(user.userId).run();
    return jsonResponse({ ok: true });
  } catch (err) {
    return errorResponse('操作失败: ' + err.message, 500);
  }
}
