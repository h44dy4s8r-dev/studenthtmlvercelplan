import { query, ok, fail } from '../../_utils/db.js';
import { verifyPassword, signJwt, setAuthCookie } from '../../_utils/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, '仅支持 POST', 405);
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return fail(res, '用户名与密码必填', 400);
    const rows = await query(`SELECT id, username, password_hash FROM admins WHERE username = $1`, [username]);
    if (rows.length === 0) return fail(res, '用户名或密码错误', 401);
    const admin = rows[0];
    const okPass = await verifyPassword(password, admin.password_hash);
    if (!okPass) return fail(res, '用户名或密码错误', 401);
    const token = signJwt({ sub: admin.id, role: 'admin', username: admin.username });
    setAuthCookie(res, token);
    return ok(res, { token, role: 'admin', username: admin.username });
  } catch (e) {
    return fail(res, e.message || '登录失败', 500);
  }
}


