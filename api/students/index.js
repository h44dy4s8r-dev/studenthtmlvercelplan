import { query, ok, fail } from '../_utils/db.js';
import { getTokenFromRequest, verifyJwt } from '../_utils/auth.js';
import { readJson } from '../_utils/http.js';

export default async function handler(req, res) {
  const method = req.method;
  const token = getTokenFromRequest(req);
  const auth = verifyJwt(token);
  if (!auth) return fail(res, '未授权', 401);

  try {
    if (method === 'GET') {
      // admin: list all; student: get own
      if (auth.role === 'admin') {
        const rows = await query(
          `SELECT id, student_no, name, gender, age, class, major, phone, email, created_at, updated_at FROM students ORDER BY id DESC`
        );
        return ok(res, { students: rows });
      }
      if (auth.role === 'student') {
        const rows = await query(
          `SELECT id, student_no, name, gender, age, class, major, phone, email, created_at, updated_at FROM students WHERE id = $1`,
          [auth.sub]
        );
        return ok(res, { students: rows });
      }
      return fail(res, '未授权', 401);
    }

    if (method === 'POST') {
      if (auth.role !== 'admin') return fail(res, '仅管理员可新增', 403);
      const { student_no, name, gender, age, class: cls, major, phone, email, password } = await readJson(req);
      if (!student_no || !name) return fail(res, '学号与姓名必填', 400);
      let password_hash = null;
      if (password) {
        const { hashPassword } = await import('../_utils/auth.js');
        password_hash = await hashPassword(password);
      }
      const rows = await query(
        `
        INSERT INTO students (student_no, name, gender, age, class, major, phone, email, password_hash)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING id, student_no, name, gender, age, class, major, phone, email, created_at, updated_at
      `,
        [student_no, name, gender || null, age || null, cls || null, major || null, phone || null, email || null, password_hash]
      );
      return ok(res, { student: rows[0] }, 201);
    }

    return fail(res, '不支持的请求方法', 405);
  } catch (e) {
    if (String(e.message || '').includes('unique')) {
      return fail(res, '学号已存在', 409);
    }
    return fail(res, e.message || '请求失败', 500);
  }
}


