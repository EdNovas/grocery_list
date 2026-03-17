import { getUserFromRequest, jsonResponse, errorResponse, JWT_SECRET } from '../_shared.js';

// DELETE /api/history/:id — Delete single history record
export async function onRequestDelete(context) {
  const { env, request, params } = context;
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) return errorResponse('未登录', 401);

  try {
    await env.DB.prepare(
      'DELETE FROM purchase_history WHERE id = ? AND user_id = ?'
    ).bind(params.id, user.userId).run();
    return jsonResponse({ ok: true });
  } catch (err) {
    return errorResponse('删除失败: ' + err.message, 500);
  }
}
