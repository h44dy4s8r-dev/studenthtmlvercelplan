import { query, ok, fail } from '../_utils/db.js';
import { getTokenFromRequest, verifyJwt } from '../_utils/auth.js';
import { readJson } from '../_utils/http.js';

export default async function handler(req, res) {
  const { id } = req.query || {};
  if (!id) return fail(res, '缺少 id', 400);
  const method = req.method;
  const token = getTokenFromRequest(req);
  const auth = verifyJwt(token);
  if (!auth) return fail(res, '未授权', 401);

  try {
    if (method === 'GET') {
      if (auth.role !== 'admin' && String(auth.sub) !== String(id)) {
        return fail(res, '权限不足', 403);
      }
      const rows = await query(
        `SELECT id, student_no, name, gender, age, class, major, phone, email, created_at, updated_at FROM students WHERE id = $1`,
        [id]
      );
      if (rows.length === 0) return fail(res, '未找到学生', 404);
      return ok(res, { student: rows[0] });
    }

    if (method === 'PUT' || method === 'PATCH') {
      if (auth.role !== 'admin' && String(auth.sub) !== String(id)) {
        return fail(res, '权限不足', 403);
      }
      const { name, gender, age, class: cls, major, phone, email, password } = await readJson(req);
      let password_hash = undefined;
      if (password) {
        const { hashPassword } = await import('../_utils/auth.js');
        password_hash = await hashPassword(password);
      }
      const rows = await query(
        `
        UPDATE students
        SET
          name = COALESCE($2, name),
          gender = COALESCE($3, gender),
          age = COALESCE($4, age),
          class = COALESCE($5, class),
          major = COALESCE($6, major),
          phone = COALESCE($7, phone),
          email = COALESCE($8, email),
          password_hash = COALESCE($9, password_hash),
          updated_at = NOW()
        WHERE id = $1
        RETURNING id, student_no, name, gender, age, class, major, phone, email, created_at, updated_at
      `,
        [id, name || null, gender || null, age || null, cls || null, major || null, phone || null, email || null, password_hash || null]
      );
      if (rows.length === 0) return fail(res, '未找到学生', 404);
      return ok(res, { student: rows[0] });
    }

    if (method === 'DELETE') {
      if (auth.role !== 'admin') return fail(res, '仅管理员可删除', 403);
      const rows = await query(
        `DELETE FROM students WHERE id = $1 RETURNING id`,
        [id]
      );
      if (rows.length === 0) return fail(res, '未找到学生', 404);
      return ok(res, { id: rows[0].id });
    }

    return fail(res, '不支持的请求方法', 405);
  } catch (e) {
    return fail(res, e.message || '请求失败', 500);
  }
}


