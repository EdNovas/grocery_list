import { getUserFromRequest, jsonResponse, errorResponse, JWT_SECRET } from '../_shared.js';

// GET /api/recommend — Smart recommendations based on purchase frequency
export async function onRequestGet(context) {
  const { env, request } = context;
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) return errorResponse('未登录', 401);

  const { results } = await env.DB.prepare(`
    SELECT 
      p.id, p.name, p.emoji, p.category,
      COALESCE(uf.freq_days, p.default_freq_days) AS freq_days,
      MAX(ph.purchased_at) AS last_purchased,
      ROUND(julianday('now') - julianday(MAX(ph.purchased_at)), 1) AS days_since,
      ROUND(
        COALESCE(uf.freq_days, p.default_freq_days)
        - (julianday('now') - julianday(MAX(ph.purchased_at)))
      , 1) AS days_until_due
    FROM products p
    INNER JOIN purchase_history ph ON p.id = ph.product_id AND ph.user_id = ?
    LEFT JOIN user_frequencies uf ON p.id = uf.product_id AND uf.user_id = ?
    GROUP BY p.id
    HAVING days_until_due <= 14
    ORDER BY days_until_due ASC
  `).bind(user.userId, user.userId).all();

  return jsonResponse({ recommendations: results });
}
