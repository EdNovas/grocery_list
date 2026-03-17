import { verifyPassword, createToken, jsonResponse, errorResponse, setTokenCookie, JWT_SECRET } from '../_shared.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return errorResponse('用户名和密码不能为空');
    }

    const user = await env.DB.prepare(
      'SELECT id, username, password FROM users WHERE username = ?'
    ).bind(username).first();

    if (!user) {
      return errorResponse('用户名或密码错误', 401);
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return errorResponse('用户名或密码错误', 401);
    }

    const token = createToken({ userId: user.id, username: user.username }, JWT_SECRET);

    const response = jsonResponse({ user: { id: user.id, username: user.username } });
    return setTokenCookie(response, token);
  } catch (err) {
    return errorResponse('登录失败: ' + err.message, 500);
  }
}
