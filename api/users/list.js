import { getDb, handleApiError, methodNotAllowed, requireUser, sendJson } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    await requireUser(req);
    const [rows] = await getDb().query(
      `SELECT u.id, u.personnel_no AS personnelNo, u.full_name AS fullName, u.email, u.role,
              u.is_active AS isActive, u.last_login_at AS lastLoginAt,
              GROUP_CONCAT(ud.department_id ORDER BY ud.department_id SEPARATOR ',') AS departmentIds
         FROM users u LEFT JOIN user_departments ud ON ud.user_id = u.id
        GROUP BY u.id ORDER BY u.full_name`
    );
    return sendJson(res, 200, rows.map((row) => ({
      id: row.id,
      personnel_no: row.personnelNo,
      ad_soyad: row.fullName,
      email: row.email,
      rol: row.role,
      aktif: Boolean(row.isActive),
      bolum_idler: row.departmentIds ? row.departmentIds.split(',') : [],
      sonGirisTarihi: row.lastLoginAt,
    })));
  } catch (error) {
    return handleApiError(res, error);
  }
}
