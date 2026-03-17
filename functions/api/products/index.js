import { getUserFromRequest, jsonResponse, errorResponse, JWT_SECRET } from '../_shared.js';

// GET /api/products — Get all products (system + user custom)
export async function onRequestGet(context) {
  const { env, request } = context;
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) return errorResponse('未登录', 401);

  const { results } = await env.DB.prepare(`
    SELECT * FROM products
    WHERE is_system = 1 OR created_by = ?
    ORDER BY category, id
  `).bind(user.userId).all();

  return jsonResponse({ products: results });
}
