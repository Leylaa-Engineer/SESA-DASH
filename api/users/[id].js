import { getDb, handleApiError, methodNotAllowed, readJson, requireUser, sendJson } from '../_lib.js';

function idFrom(req) {
  const raw = req.query?.id;
  return Number(Array.isArray(raw) ? raw[0] : raw);
}

export default async function handler(req, res) {
  const id = idFrom(req);
  if (!Number.isInteger(id)) return sendJson(res, 400, { error: 'Geçersiz kullanıcı id' });
  try {
    const tokenUser = await requireUser(req);
    const db = getDb();
    const [admins] = await db.query('SELECT role FROM users WHERE firebase_uid = ? OR email = ? LIMIT 1', [tokenUser.uid, tokenUser.email || '']);
    if (admins[0]?.role !== 'admin') return sendJson(res, 403, { error: 'Yalnızca yöneticiler kullanıcı yönetebilir' });
    if (req.method === 'DELETE') {
      await db.execute("UPDATE users SET is_active = FALSE WHERE id = ? AND role <> 'admin'", [id]);
      return sendJson(res, 200, { ok: true });
    }
    if (req.method !== 'PATCH') return methodNotAllowed(res, ['PATCH', 'DELETE']);
    const body = await readJson(req);
    const departmentId = String(body.bolum_id || body.departmentId || '').trim();
    if (!departmentId) return sendJson(res, 400, { error: 'Bölüm zorunludur' });
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [users] = await connection.query('SELECT role FROM users WHERE id = ? LIMIT 1', [id]);
      if (users[0]?.role === 'admin') return sendJson(res, 403, { error: 'Yöneticilerin bölümü değiştirilemez' });
      await connection.execute('DELETE FROM user_departments WHERE user_id = ?', [id]);
      await connection.execute('INSERT INTO user_departments (user_id, department_id) VALUES (?, ?)', [id, departmentId]);
      await connection.commit();
      return sendJson(res, 200, { ok: true, bolum_idler: [departmentId] });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    return handleApiError(res, error);
  }
}
