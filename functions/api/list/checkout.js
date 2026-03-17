import { getUserFromRequest, jsonResponse, errorResponse, JWT_SECRET } from '../_shared.js';

// POST /api/list/checkout — Record purchase and clear list
export async function onRequestPost(context) {
  const { env, request } = context;
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) return errorResponse('未登录', 401);

  try {
    // Get client timezone offset (minutes) from body, default to 0 (UTC)
    let tzOffset = 0;
    try {
      const body = await request.json();
      tzOffset = parseInt(body.tzOffset) || 0;
    } catch { /* no body */ }

    // Calculate local time string
    const now = new Date();
    const localMs = now.getTime() - (tzOffset * 60 * 1000);
    const localDate = new Date(localMs);
    const localIso = localDate.toISOString().split('.')[0];  // "2026-03-16T21:47:00" — no Z = parsed as local

    const { results } = await env.DB.prepare(
      'SELECT product_id, quantity, note FROM shopping_list WHERE user_id = ?'
    ).bind(user.userId).all();

    if (results.length > 0) {
      const batch = results.map(item =>
        env.DB.prepare(
          'INSERT INTO purchase_history (user_id, product_id, quantity, note, purchased_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(user.userId, item.product_id, item.quantity, item.note || '', localIso)
      );
      await env.DB.batch(batch);
    }

    await env.DB.prepare('DELETE FROM shopping_list WHERE user_id = ?').bind(user.userId).run();
    return jsonResponse({ ok: true, itemsRecorded: results.length });
  } catch (err) {
    return errorResponse('结账失败: ' + err.message, 500);
  }
}
