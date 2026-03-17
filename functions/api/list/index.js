import { getUserFromRequest, jsonResponse, errorResponse, JWT_SECRET } from '../_shared.js';

// GET /api/list — Get user's shopping list
export async function onRequestGet(context) {
  const { env, request } = context;
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) return errorResponse('未登录', 401);

  try {
    const { results } = await env.DB.prepare(`
      SELECT sl.id, sl.product_id, sl.quantity, sl.completed, sl.note, sl.added_at,
             COALESCE(p.name, 'Unknown') as name,
             COALESCE(p.emoji, '🛒') as emoji,
             COALESCE(p.category, '') as category
      FROM shopping_list sl
      LEFT JOIN products p ON sl.product_id = p.id
      WHERE sl.user_id = ?
      ORDER BY sl.completed ASC, sl.added_at DESC
    `).bind(user.userId).all();

    return jsonResponse({ items: results });
  } catch (err) {
    return errorResponse('获取清单失败: ' + err.message, 500);
  }
}

// POST /api/list — Add item to list
export async function onRequestPost(context) {
  const { env, request } = context;
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) return errorResponse('未登录', 401);

  const url = new URL(request.url);
  const path = url.pathname;

  // Handle special actions
  if (path.endsWith('/complete-all')) {
    await env.DB.prepare(
      'UPDATE shopping_list SET completed = 1 WHERE user_id = ?'
    ).bind(user.userId).run();
    return jsonResponse({ ok: true });
  }

  if (path.endsWith('/clear-completed')) {
    await env.DB.prepare(
      'DELETE FROM shopping_list WHERE user_id = ? AND completed = 1'
    ).bind(user.userId).run();
    return jsonResponse({ ok: true });
  }

  // Regular add
  const { productId, quantity = 1, note = '', name = '', category = '' } = await request.json();
  if (!productId) return errorResponse('缺少商品ID');

  try {
    // Auto-register product if it doesn't exist in products table
    const existing = await env.DB.prepare('SELECT id FROM products WHERE id = ?').bind(productId).first();
    if (!existing) {
      await env.DB.prepare(
        'INSERT OR IGNORE INTO products (id, name, emoji, category, default_freq_days, is_system, created_by) VALUES (?, ?, ?, ?, 7, 0, ?)'
      ).bind(productId, name || `商品${productId}`, '🛒', category || 'other', user.userId).run();
    }

    await env.DB.prepare(
      'INSERT OR REPLACE INTO shopping_list (user_id, product_id, quantity, note, completed) VALUES (?, ?, ?, ?, 0)'
    ).bind(user.userId, productId, quantity, note).run();
    return jsonResponse({ ok: true });
  } catch (err) {
    return errorResponse('添加失败: ' + err.message, 500);
  }
}
