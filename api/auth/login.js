import { comparePassword, createAccessToken, getDb, handleApiError, methodNotAllowed, readJson, sendJson } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const body = await readJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) {
      const error = new Error('E-posta ve şifre zorunludur');
      error.statusCode = 400;
      throw error;
    }

    const [rows] = await getDb().execute('SELECT * FROM users WHERE email = ? AND is_active = TRUE LIMIT 1', [email]);
    const user = rows[0];
    if (!user || !user.password_hash || !(await comparePassword(password, user.password_hash))) {
      const error = new Error('E-posta veya şifre hatalı');
      error.statusCode = 401;
      throw error;
    }
    await getDb().execute('UPDATE users SET last_login_at = UTC_TIMESTAMP(3) WHERE id = ?', [user.id]);
    const { password_hash: _passwordHash, ...safeUser } = user;
    return sendJson(res, 200, { token: createAccessToken(user), user: safeUser });
  } catch (error) {
    return handleApiError(res, error);
  }
}
