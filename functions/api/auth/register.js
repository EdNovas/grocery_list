import { hashPassword, createToken, jsonResponse, errorResponse, setTokenCookie, JWT_SECRET } from '../_shared.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return errorResponse('用户名和密码不能为空');
    }

    if (username.length < 2 || username.length > 20) {
      return errorResponse('用户名长度 2-20 个字符');
    }

    if (password.length < 4) {
      return errorResponse('密码至少4个字符');
    }

    // Check if user exists
    const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existing) {
      return errorResponse('用户名已存在');
    }

    const hashedPassword = await hashPassword(password);

    const result = await env.DB.prepare(
      'INSERT INTO users (username, password) VALUES (?, ?)'
    ).bind(username, hashedPassword).run();

    const userId = result.meta.last_row_id;
    const token = createToken({ userId, username }, JWT_SECRET);

    const response = jsonResponse({ user: { id: userId, username } });
    return setTokenCookie(response, token);
  } catch (err) {
    return errorResponse('注册失败: ' + err.message, 500);
  }
}
