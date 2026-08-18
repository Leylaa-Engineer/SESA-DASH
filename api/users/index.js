import { getDb, handleApiError, methodNotAllowed, readJson, requireUser, sendJson } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const tokenUser = await requireUser(req);
    const body = await readJson(req);
    const fullName = String(body.ad_soyad || body.name || '').trim();
    const departmentId = String(body.bolum_id || body.departmentId || '').trim();
    const registrationCode = String(body.adminCode || '');
    if (!fullName || !departmentId) return sendJson(res, 400, { error: 'Ad soyad ve bölüm zorunludur' });
    const adminCode = process.env.ADMIN_SIGNUP_CODE;
    const responsibleCode = process.env.RESPONSIBLE_SIGNUP_CODE;
    const role = departmentId === 'yonetici' || (adminCode && registrationCode === adminCode) ? 'admin' : 'sorumlu';
    if ((role === 'admin' && (!adminCode || registrationCode !== adminCode)) || (role === 'sorumlu' && (!responsibleCode || registrationCode !== responsibleCode))) {
      return sendJson(res, 403, { error: 'Geçersiz kayıt kodu' });
    }
    const db = getDb();
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        `INSERT INTO users (firebase_uid, full_name, email, role, is_active)
         VALUES (?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role), is_active = TRUE`,
        [tokenUser.uid, fullName, tokenUser.email || body.email || '', role]
      );
      const [userRows] = await connection.query('SELECT id FROM users WHERE firebase_uid = ? OR email = ? LIMIT 1', [tokenUser.uid, tokenUser.email || body.email || '']);
      const userId = userRows[0]?.id || result.insertId;
      await connection.execute('INSERT IGNORE INTO user_departments (user_id, department_id) VALUES (?, ?)', [userId, departmentId]);
      await connection.commit();
      return sendJson(res, 201, { id: userId, rol: role, bolum_idler: [departmentId] });
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
