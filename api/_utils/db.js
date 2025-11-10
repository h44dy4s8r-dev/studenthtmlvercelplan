import { neon } from '@neondatabase/serverless';

export function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing DATABASE_URL environment variable.');
  }
  return neon(connectionString);
}

export async function query(sqlText, params = []) {
  const db = getDb();
  return await db(sqlText, params);
}

export function ok(res, data = {}, status = 200, headers = {}) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status).json({ success: true, data });
}

export function fail(res, message = '请求失败', status = 400, extra = {}) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status).json({ success: false, message, ...extra });
}


