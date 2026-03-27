import { getUserFromRequest, jsonResponse, errorResponse, JWT_SECRET } from '../_shared.js';

// GET /api/history
export async function onRequestGet(context) {
  const { env, request } = context;
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) return errorResponse('未登录', 401);

  const { results } = await env.DB.prepare(`
    SELECT ph.id, ph.product_id, ph.quantity, ph.note, ph.purchased_at,
           ph.session_id,
           p.name, p.emoji, p.category
    FROM purchase_history ph
    JOIN products p ON ph.product_id = p.id
    WHERE ph.user_id = ?
    ORDER BY ph.purchased_at DESC
    LIMIT 200
  `).bind(user.userId).all();

  return jsonResponse({ history: results });
}

// DELETE /api/history — Clear all history, or delete by session/date
export async function onRequestDelete(context) {
  const { env, request } = context;
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) return errorResponse('未登录', 401);

  try {
    // Check if body has a filter for batch delete
    let body = {};
    try { body = await request.json(); } catch { /* no body = clear all */ }

    if (body.sessionId) {
      // Delete all history for a specific checkout session
      await env.DB.prepare(
        "DELETE FROM purchase_history WHERE user_id = ? AND session_id = ?"
      ).bind(user.userId, body.sessionId).run();
    } else if (body.date) {
      // Legacy: delete by date (for old records without session_id)
      await env.DB.prepare(
        "DELETE FROM purchase_history WHERE user_id = ? AND DATE(purchased_at) = ?"
      ).bind(user.userId, body.date).run();
    } else {
      // Clear all history
      await env.DB.prepare(
        'DELETE FROM purchase_history WHERE user_id = ?'
      ).bind(user.userId).run();
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    return errorResponse('删除失败: ' + err.message, 500);
  }
}
