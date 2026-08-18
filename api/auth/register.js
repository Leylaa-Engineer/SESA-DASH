import { createAccessToken, getDb, handleApiError, hashPassword, methodNotAllowed, readJson, sendJson } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const body = await readJson(req);
    const fullName = String(body.name || body.fullName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const departmentId = String(body.bolum_id || body.departmentId || '').trim();
    const personnelNo = String(body.personnelNo || body.personnel_no || '').trim() || null;
    const registrationCode = String(body.adminCode || '');

    if (!fullName || !email || !password || !departmentId) {
      const error = new Error('Ad soyad, e-posta, şifre ve bölüm zorunludur');
      error.statusCode = 400;
      throw error;
    }
    if (password.length < 8) {
      const error = new Error('Şifre en az 8 karakter olmalıdır');
      error.statusCode = 400;
      throw error;
    }

    const adminCode = process.env.ADMIN_SIGNUP_CODE;
    const responsibleCode = process.env.RESPONSIBLE_SIGNUP_CODE;
    const role = departmentId === 'yonetici' || (adminCode && registrationCode === adminCode) ? 'admin' : 'sorumlu';
    if ((role === 'admin' && (!adminCode || registrationCode !== adminCode)) || (role === 'sorumlu' && (!responsibleCode || registrationCode !== responsibleCode))) {
      const error = new Error('Geçersiz kayıt kodu');
      error.statusCode = 403;
      throw error;
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
      await connection.execute(
        'INSERT INTO user_departments (user_id, department_id) VALUES (?, ?)',
        [result.insertId, departmentId],
      );
      const [rows] = await connection.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      await connection.commit();
      const { password_hash: _passwordHash, ...safeUser } = rows[0];
      return sendJson(res, 201, { token: createAccessToken(rows[0]), user: safeUser });
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
