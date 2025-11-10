import { query, ok, fail } from './_utils/db.js';
import { hashPassword } from './_utils/auth.js';
import { readJson } from './_utils/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return fail(res, '仅支持 POST', 405);
  }
  try {
    // Create tables if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        student_no TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        gender TEXT,
        age INTEGER,
        class TEXT,
        major TEXT,
        phone TEXT,
        email TEXT,
        password_hash TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // upsert default admin
    const adminUsername = 'admin';
    const adminPassword = 'admin';
    const hashed = await hashPassword(adminPassword);
    await query(
      `
      INSERT INTO admins (username, password_hash)
      VALUES ($1, $2)
      ON CONFLICT (username) DO NOTHING;
    `,
      [adminUsername, hashed]
    );

    return ok(res, { message: '初始化完成（表结构与默认管理员）', defaultAdmin: { username: adminUsername, password: adminPassword } });
  } catch (e) {
    return fail(res, e.message || '初始化失败', 500);
  }
}


