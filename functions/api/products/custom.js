import { getUserFromRequest, jsonResponse, errorResponse, JWT_SECRET } from '../_shared.js';

// Sanitize: strip HTML tags and dangerous chars
function sanitize(str, maxLen = 50) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').replace(/[<>"'`;]/g, '').trim().slice(0, maxLen);
}

// POST /api/products/custom — Add, edit or delete custom products (v2 - 2026-03-17)
export async function onRequestPost(context) {
  const { env, request } = context;
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) return errorResponse('未登录', 401);

  const body = await request.json();

  // Handle delete action
  if (body.action === 'delete') {
    const productId = parseInt(body.id);
    if (!productId) return errorResponse('缺少商品ID');
    try {
      // Delete related records first (FK constraints)
      await env.DB.batch([
        env.DB.prepare('DELETE FROM shopping_list WHERE product_id = ?').bind(productId),
        env.DB.prepare('DELETE FROM purchase_history WHERE product_id = ?').bind(productId),
        env.DB.prepare('DELETE FROM user_frequencies WHERE product_id = ?').bind(productId),
        env.DB.prepare('DELETE FROM products WHERE id = ? AND is_system = 0 AND created_by = ?').bind(productId, user.userId),
      ]);
      return jsonResponse({ ok: true });
    } catch (err) {
      return errorResponse('删除失败: ' + err.message, 500);
    }
  }

  // Handle edit action
  if (body.action === 'edit') {
    const productId = parseInt(body.id);
    if (!productId) return errorResponse('缺少商品ID');
    const name = sanitize(body.name);
    const emoji = sanitize(body.emoji || '🛒', 10);
    if (!name) return errorResponse('商品名称不能为空');
    try {
      await env.DB.prepare(
        'UPDATE products SET name = ?, emoji = ? WHERE id = ? AND is_system = 0 AND created_by = ?'
      ).bind(name, emoji, productId, user.userId).run();
      return jsonResponse({ ok: true });
    } catch (err) {
      return errorResponse('更新失败: ' + err.message, 500);
    }
  }

  // Default: add new product
  const name = sanitize(body.name);
  const emoji = sanitize(body.emoji || '🛒', 10);
  const category = sanitize(body.category || 'custom', 30);
  const defaultFreqDays = Math.min(Math.max(parseInt(body.defaultFreqDays) || 14, 1), 365);

  if (!name) {
    return errorResponse('商品名称不能为空');
  }

  try {
    const existing = await env.DB.prepare(
      'SELECT id FROM products WHERE name = ? AND (is_system = 1 OR created_by = ?)'
    ).bind(name, user.userId).first();

    if (existing) {
      return errorResponse(`商品 "${name}" 已存在`, 409);
    }

    const result = await env.DB.prepare(
      'INSERT INTO products (name, emoji, category, default_freq_days, is_system, created_by) VALUES (?, ?, ?, ?, 0, ?)'
    ).bind(name, emoji, category, defaultFreqDays, user.userId).run();

    return jsonResponse({
      ok: true,
      product: {
        id: result.meta.last_row_id,
        name,
        emoji,
        category,
        default_freq_days: defaultFreqDays,
      }
    });
  } catch (err) {
    return errorResponse('添加失败: ' + err.message, 500);
  }
}
