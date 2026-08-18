import { getDb, handleApiError, methodNotAllowed, readJson, requireUser, sendJson } from '../_lib.js';

function issueId(req) {
  const raw = req.query?.id;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return Number(value);
}

export default async function handler(req, res) {
  const id = issueId(req);
  if (!Number.isInteger(id)) return sendJson(res, 400, { error: 'Geçersiz arıza id' });
  try {
    const db = getDb();
    if (req.method === 'GET') {
      await requireUser(req);
      const [rows] = await db.query(
        `SELECT i.id, i.machine_id AS machineId, i.machine_code AS machineCode, i.machine_name AS machineName,
                i.department_id AS departmentId, d.name AS departmentName, i.reporter_email AS reporterEmail,
                i.description, i.photo_url AS photoUrl, i.status, i.resolved_at AS resolvedAt,
                i.resolved_by_user_id AS resolvedByUserId, i.created_at AS createdAt
           FROM issues i JOIN departments d ON d.id = i.department_id WHERE i.id = ?`,
        [id]
      );
      if (!rows[0]) return sendJson(res, 404, { error: 'Arıza bulunamadı' });
      const [history] = await db.query(
        `SELECT status AS durum, changed_at AS tarih, changed_by_user_id AS sorumlu_id
           FROM issue_status_history WHERE issue_id = ? ORDER BY changed_at ASC, id ASC`,
        [id]
      );
      return sendJson(res, 200, { ...rows[0], durum_gecmisi: history });
    }
    if (req.method !== 'PATCH' && req.method !== 'DELETE') return methodNotAllowed(res, ['GET', 'PATCH', 'DELETE']);
    const user = await requireUser(req);
    if (req.method === 'DELETE') {
      await db.execute('DELETE FROM issues WHERE id = ?', [id]);
      return sendJson(res, 200, { ok: true });
    }
    const body = await readJson(req);
    const status = String(body.durum || body.status || '');
    if (!['Açık', 'İşlemde', 'Çözüldü'].includes(status)) return sendJson(res, 400, { error: 'Geçersiz durum' });
    const resolved = status === 'Çözüldü';
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        `UPDATE issues SET status = ?, resolved_at = ${resolved ? 'UTC_TIMESTAMP(3)' : 'NULL'}, resolved_by_user_id = ? WHERE id = ?`,
        [status, resolved ? null : null, id]
      );
      await connection.execute(
        `INSERT INTO issue_status_history (issue_id, status, changed_by_user_id, changed_at) VALUES (?, ?, NULL, UTC_TIMESTAMP(3))`,
        [id, status]
      );
      await connection.commit();
      return sendJson(res, 200, { ok: true, status, changedBy: user.uid });
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
