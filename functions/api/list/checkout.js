import { getUserFromRequest, jsonResponse, errorResponse, JWT_SECRET } from '../_shared.js';

// POST /api/list/checkout — Record purchase and clear list
// Supports partial checkout: if body.completedOnly is true, only save completed items
export async function onRequestPost(context) {
  const { env, request } = context;
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) return errorResponse('未登录', 401);

  try {
    let tzOffset = 0;
    let completedOnly = false;
    try {
      const body = await request.json();
      tzOffset = parseInt(body.tzOffset) || 0;
      completedOnly = !!body.completedOnly;
    } catch { /* no body */ }

    // Calculate local time string
    const now = new Date();
    const localMs = now.getTime() - (tzOffset * 60 * 1000);
    const localDate = new Date(localMs);
    const localIso = localDate.toISOString().split('.')[0];

    // Generate unique session ID for this checkout
    const sessionId = crypto.randomUUID();

    // Fetch items to save — either all or only completed
    const query = completedOnly
      ? 'SELECT product_id, quantity, note FROM shopping_list WHERE user_id = ? AND completed = 1'
      : 'SELECT product_id, quantity, note FROM shopping_list WHERE user_id = ?';
    const { results } = await env.DB.prepare(query).bind(user.userId).all();

    if (results.length > 0) {
      const batch = results.map(item =>
        env.DB.prepare(
          'INSERT INTO purchase_history (user_id, product_id, quantity, note, purchased_at, session_id) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(user.userId, item.product_id, item.quantity, item.note || '', localIso, sessionId)
      );
      await env.DB.batch(batch);
    }

    // Delete items — either all or only completed
    const deleteQuery = completedOnly
      ? 'DELETE FROM shopping_list WHERE user_id = ? AND completed = 1'
      : 'DELETE FROM shopping_list WHERE user_id = ?';
    await env.DB.prepare(deleteQuery).bind(user.userId).run();

    return jsonResponse({ ok: true, itemsRecorded: results.length });
  } catch (err) {
    return errorResponse('结账失败: ' + err.message, 500);
  }
}
