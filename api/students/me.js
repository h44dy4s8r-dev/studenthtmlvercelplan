import { query, ok, fail } from '../_utils/db.js';
import { getTokenFromRequest, verifyJwt } from '../_utils/auth.js';

export default async function handler(req, res) {
  const method = req.method;
  const token = getTokenFromRequest(req);
  const auth = verifyJwt(token);
  if (!auth) return fail(res, '未授权', 401);
  if (auth.role !== 'student') return fail(res, '仅学生可访问', 403);
  try {
    if (method === 'GET') {
      const rows = await query(
        `SELECT id, student_no, name, gender, age, class, major, phone, email, created_at, updated_at FROM students WHERE id = $1`,
        [auth.sub]
      );
      if (rows.length === 0) return fail(res, '未找到学生', 404);
      return ok(res, { student: rows[0] });
    }
    return fail(res, '不支持的请求方法', 405);
  } catch (e) {
    return fail(res, e.message || '请求失败', 500);
  }
}


