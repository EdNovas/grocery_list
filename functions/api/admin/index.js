import { getUserFromRequest, jsonResponse, errorResponse, JWT_SECRET } from '../_shared.js';

// Middleware: check admin
async function requireAdmin(request, env) {
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) return { error: errorResponse('未登录', 401) };

  const row = await env.DB.prepare('SELECT is_admin FROM users WHERE id = ?')
    .bind(user.userId).first();
  if (!row?.is_admin) return { error: errorResponse('无权限', 403) };

  return { user };
}

// GET /api/admin — Dashboard data
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const tab = url.searchParams.get('tab') || 'overview';
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  if (tab === 'users') {
    const { results } = await env.DB.prepare(`
      SELECT u.id, u.username, u.is_admin, u.created_at,
        (SELECT COUNT(*) FROM products WHERE created_by = u.id AND is_system = 0) AS custom_product_count,
        (SELECT COUNT(*) FROM shopping_list WHERE user_id = u.id) AS list_count,
        (SELECT COUNT(*) FROM purchase_history WHERE user_id = u.id) AS history_count
      FROM users u ORDER BY u.id
    `).all();
    return jsonResponse({ users: results });
  }

  if (tab === 'products') {
    const { results } = await env.DB.prepare(`
      SELECT p.*, u.username AS creator_name
      FROM products p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.is_system = 0
      ORDER BY p.id DESC
    `).all();
    return jsonResponse({ products: results });
  }

  // Default: overview stats
  const [userCount, productCount, customCount, historyCount] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as c FROM users').first(),
    env.DB.prepare('SELECT COUNT(*) as c FROM products WHERE is_system = 1').first(),
    env.DB.prepare('SELECT COUNT(*) as c FROM products WHERE is_system = 0').first(),
    env.DB.prepare('SELECT COUNT(*) as c FROM purchase_history').first(),
  ]);

  return jsonResponse({
    stats: {
      users: userCount.c,
      systemProducts: productCount.c,
      customProducts: customCount.c,
      purchaseRecords: historyCount.c,
    }
  });
}

// POST /api/admin — Admin actions (delete product, toggle admin, etc.)
export async function onRequestPost(context) {
  const { env, request } = context;
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const body = await request.json();

  // Delete a custom product (admin force-delete, no created_by check)
  if (body.action === 'delete_product') {
    const productId = parseInt(body.id);
    if (!productId) return errorResponse('缺少商品ID');
    try {
      await env.DB.batch([
        env.DB.prepare('DELETE FROM shopping_list WHERE product_id = ?').bind(productId),
        env.DB.prepare('DELETE FROM purchase_history WHERE product_id = ?').bind(productId),
        env.DB.prepare('DELETE FROM user_frequencies WHERE product_id = ?').bind(productId),
        env.DB.prepare('DELETE FROM products WHERE id = ? AND is_system = 0').bind(productId),
      ]);
      return jsonResponse({ ok: true });
    } catch (err) {
      return errorResponse('删除失败: ' + err.message, 500);
    }
  }

  // Toggle admin status
  if (body.action === 'toggle_admin') {
    const targetId = parseInt(body.userId);
    if (!targetId) return errorResponse('缺少用户ID');
    // Cannot remove own admin
    if (targetId === auth.user.userId) return errorResponse('不能修改自己的权限');
    try {
      await env.DB.prepare(
        'UPDATE users SET is_admin = CASE WHEN is_admin = 1 THEN 0 ELSE 1 END WHERE id = ?'
      ).bind(targetId).run();
      return jsonResponse({ ok: true });
    } catch (err) {
      return errorResponse('操作失败: ' + err.message, 500);
    }
  }

  // Delete user (and all their data)
  if (body.action === 'delete_user') {
    const targetId = parseInt(body.userId);
    if (!targetId) return errorResponse('缺少用户ID');
    if (targetId === auth.user.userId) return errorResponse('不能删除自己');
    try {
      await env.DB.batch([
        env.DB.prepare('DELETE FROM shopping_list WHERE user_id = ?').bind(targetId),
        env.DB.prepare('DELETE FROM purchase_history WHERE user_id = ?').bind(targetId),
        env.DB.prepare('DELETE FROM user_frequencies WHERE user_id = ?').bind(targetId),
        env.DB.prepare('DELETE FROM products WHERE created_by = ? AND is_system = 0').bind(targetId),
        env.DB.prepare('DELETE FROM users WHERE id = ?').bind(targetId),
      ]);
      return jsonResponse({ ok: true });
    } catch (err) {
      return errorResponse('删除失败: ' + err.message, 500);
    }
  }

  return errorResponse('未知操作');
}
