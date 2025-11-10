import { query, ok, fail } from '../../_utils/db.js';
import { verifyPassword, signJwt, setAuthCookie } from '../../_utils/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, '仅支持 POST', 405);
  try {
    const { student_no, password } = req.body || {};
    if (!student_no || !password) return fail(res, '学号与密码必填', 400);
    const rows = await query(
      `SELECT id, student_no, name, password_hash FROM students WHERE student_no = $1`,
      [student_no]
    );
    if (rows.length === 0) return fail(res, '学号或密码错误', 401);
    const stu = rows[0];
    if (!stu.password_hash) return fail(res, '该账号未设置密码', 401);
    const okPass = await verifyPassword(password, stu.password_hash);
    if (!okPass) return fail(res, '学号或密码错误', 401);
    const token = signJwt({ sub: stu.id, role: 'student', student_no: stu.student_no, name: stu.name });
    setAuthCookie(res, token);
    return ok(res, { token, role: 'student', student_no: stu.student_no, name: stu.name });
  } catch (e) {
    return fail(res, e.message || '登录失败', 500);
  }
}


