import { getUserFromRequest, jsonResponse, errorResponse, JWT_SECRET } from '../_shared.js';

// GET /api/frequencies — Get user's custom frequencies
export async function onRequestGet(context) {
  const { env, request } = context;
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) return errorResponse('未登录', 401);

  const { results } = await env.DB.prepare(
    'SELECT product_id, freq_days FROM user_frequencies WHERE user_id = ?'
  ).bind(user.userId).all();

  return jsonResponse({ frequencies: results });
}

// POST /api/frequencies — Update user frequency for a product
export async function onRequestPost(context) {
  const { env, request } = context;
  const user = getUserFromRequest(request, JWT_SECRET);
  if (!user) return errorResponse('未登录', 401);

  const { productId, freqDays } = await request.json();

  if (!productId || !freqDays || freqDays < 1) {
    return errorResponse('参数无效');
  }

  await env.DB.prepare(
    'INSERT OR REPLACE INTO user_frequencies (user_id, product_id, freq_days) VALUES (?, ?, ?)'
  ).bind(user.userId, productId, freqDays).run();

  return jsonResponse({ ok: true });
}
