import { getDb, handleApiError, methodNotAllowed, readJson, requireUser, sendJson } from './_lib.js';

function mapIssue(row) {
  return {
    id: row.id,
    makine_id: row.machineId,
    makine_kod: row.machineCode,
    makine_ad: row.machineName,
    bolum_id: row.departmentId,
    bolum_ad: row.departmentName,
    ekleyen_email: row.reporterEmail,
    aciklama: row.description,
    foto_url: row.photoUrl,
    durum: row.status,
    cozulme_tarihi: row.resolvedAt,
    cozen_sorumlu_id: row.resolvedByUserId,
    olusturulma_tarihi: row.createdAt,
  };
}

export default async function handler(req, res) {
  try {
    const db = getDb();
    if (req.method === 'GET') {
      const tokenUser = await requireUser(req);
      const status = typeof req.query?.status === 'string' ? req.query.status : '';
      const [profiles] = await db.query('SELECT role FROM users WHERE firebase_uid = ? OR email = ? LIMIT 1', [tokenUser.uid, tokenUser.email || '']);
      const isAdmin = profiles[0]?.role === 'admin';
      const clauses = [];
      const params = [];
      if (status) { clauses.push('i.status = ?'); params.push(status); }
      if (!isAdmin) {
        clauses.push('(i.reporter_email = ? OR m.added_by_email = ?)');
        params.push(tokenUser.email || '', tokenUser.email || '');
      }
      const [rows] = await db.query(
        `SELECT i.id, i.machine_id AS machineId, i.machine_code AS machineCode, i.machine_name AS machineName,
                i.department_id AS departmentId, d.name AS departmentName, i.reporter_email AS reporterEmail,
                i.description, i.photo_url AS photoUrl, i.status, i.resolved_at AS resolvedAt,
                i.resolved_by_user_id AS resolvedByUserId, i.created_at AS createdAt
           FROM issues i JOIN departments d ON d.id = i.department_id JOIN machines m ON m.id = i.machine_id
          ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
          ORDER BY i.created_at DESC`,
        params
      );
      return sendJson(res, 200, rows.map(mapIssue));
    }
    if (req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST']);
    const user = await requireUser(req);
    const body = await readJson(req);
    const machineId = Number(body.makine_id || body.machineId);
    const description = String(body.aciklama || body.description || '').trim();
    if (!Number.isInteger(machineId) || !description) return sendJson(res, 400, { error: 'Makine ve açıklama zorunludur' });
    const [machineRows] = await db.query(
      `SELECT m.id, m.code, m.name, m.department_id AS departmentId, d.name AS departmentName
         FROM machines m JOIN departments d ON d.id = m.department_id
        WHERE m.id = ? AND m.is_active = TRUE`,
      [machineId]
    );
    const machine = machineRows[0];
    if (!machine) return sendJson(res, 404, { error: 'Makine bulunamadı' });
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        `INSERT INTO issues
          (machine_id, machine_code, machine_name, department_id, reporter_email, description, photo_url, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Açık')`,
        [machine.id, machine.code, machine.name, machine.departmentId, user.email || 'Bilinmiyor', description, body.foto_url || body.photoUrl || null]
      );
      await connection.execute(
        `INSERT INTO issue_status_history (issue_id, status, changed_at) VALUES (?, 'Açık', UTC_TIMESTAMP(3))`,
        [result.insertId]
      );
      await connection.commit();
      return sendJson(res, 201, { id: result.insertId, status: 'Açık' });
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
