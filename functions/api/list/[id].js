import { getUserFromRequest, jsonResponse, errorResponse, JWT_SECRET } from '../_shared.js';

// PUT /api/list/:id — Update item
export async function onRequestPut(context) {
  const { env, request, params } = context;
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) return errorResponse('未登录', 401);

  const id = params.id;
  const body = await request.json();

  const updates = [];
  const values = [];

  if (body.quantity !== undefined) {
    updates.push('quantity = ?');
    values.push(body.quantity);
  }
  if (body.completed !== undefined) {
    updates.push('completed = ?');
    values.push(body.completed);
  }
  if (body.note !== undefined) {
    updates.push('note = ?');
    values.push(body.note);
  }

  if (updates.length === 0) {
    return errorResponse('没有需要更新的字段');
  }

  values.push(id, user.userId);

  await env.DB.prepare(
    `UPDATE shopping_list SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
  ).bind(...values).run();

  return jsonResponse({ ok: true });
}

// DELETE /api/list/:id — Remove item
export async function onRequestDelete(context) {
  const { env, request, params } = context;
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) return errorResponse('未登录', 401);

  await env.DB.prepare(
    'DELETE FROM shopping_list WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.userId).run();

  return jsonResponse({ ok: true });
}
