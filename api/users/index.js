import { getDb, handleApiError, hashPassword, methodNotAllowed, readJson, requireAdmin, sendJson } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    await requireAdmin(req);
    const body = await readJson(req);
    const fullName = String(body.ad_soyad || body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const departmentId = String(body.bolum_id || body.departmentId || '').trim();
    const role = String(body.role || body.rol || 'sorumlu');
    const personnelNo = String(body.personnel_no || body.personnelNo || '').trim() || null;
    if (!fullName || !email || password.length < 8 || !departmentId) {
      return sendJson(res, 400, { error: 'Ad, e-posta, en az 8 karakter şifre ve bölüm zorunludur' });
    }
    if (!['admin', 'operator', 'maintenance', 'sorumlu'].includes(role)) {
      return sendJson(res, 400, { error: 'Geçersiz kullanıcı rolü' });
    }
    const passwordHash = await hashPassword(password);
    const db = getDb();
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        `INSERT INTO users (personnel_no, full_name, email, password_hash, role, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [personnelNo, fullName, email, passwordHash, role],
      );
      await connection.execute('INSERT INTO user_departments (user_id, department_id) VALUES (?, ?)', [result.insertId, departmentId]);
      await connection.commit();
      return sendJson(res, 201, { id: result.insertId, rol: role, bolum_idler: [departmentId] });
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
