import { query, ok, fail } from '../../_utils/db.js';
import { hashPassword } from '../../_utils/auth.js';
import { readJson } from '../../_utils/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, '仅支持 POST', 405);
  try {
    const { student_no, name, password, gender, age, class: cls, major, phone, email } = await readJson(req);
    if (!student_no || !name || !password) return fail(res, '学号、姓名、密码必填', 400);
    const password_hash = await hashPassword(password);
    const result = await query(
      `
      INSERT INTO students (student_no, name, gender, age, class, major, phone, email, password_hash)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id, student_no, name, gender, age, class, major, phone, email, created_at
    `,
      [student_no, name, gender || null, age || null, cls || null, major || null, phone || null, email || null, password_hash]
    );
    return ok(res, { student: result[0] }, 201);
  } catch (e) {
    if (String(e.message || '').includes('unique')) {
      return fail(res, '学号已存在', 409);
    }
    return fail(res, e.message || '注册失败', 500);
  }
}


