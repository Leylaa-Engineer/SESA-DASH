import { getDb, handleApiError, methodNotAllowed, readJson, requireUser, sendJson } from '../_lib.js';

function issueId(req) {
  const candidates = [
    req.params?.id,
    req.query?.id,
    req.url ? req.url.match(/[\/=](\d+)/)?.[1] : null,
    req.url ? req.url.split('?')[0].split('/').filter(Boolean).pop() : null
  ];

  for (const cand of candidates) {
    if (cand && cand !== 'undefined' && cand !== 'null') {
      const num = Number(cand);
      if (Number.isInteger(num) && num > 0) return num;
    }
  }
  return null;
}

export default async function handler(req, res) {
  console.log('🔍 [API HIT]:', { url: req.url, params: req.params, query: req.query });
  
  const id = issueId(req);
  console.log('📌 [PARSED ID]:', id);

  if (!id) return sendJson(res, 400, { error: 'Geçersiz arıza id' });

  try {
    const db = getDb();

    if (req.method === 'GET') {
      await requireUser(req);
      const [rows] = await db.query(
        `SELECT i.id, i.machine_id AS makine_id, i.machine_code AS makine_kod, i.machine_name AS makine_ad,
          i.department_id AS bolum_id, d.name AS bolum_ad, i.reporter_personnel_no AS bildiren_sicil_no,
          i.reporter_email AS ekleyen_email, i.description AS aciklama, i.photo_url AS foto_url,
          i.status AS durum, i.resolved_at AS cozulme_tarihi,
          i.resolved_by_user_id AS cozen_sorumlu_id, i.created_at AS olusturulma_tarihi
           FROM issues i 
           LEFT JOIN departments d ON d.id = i.department_id 
           WHERE i.id = ?`,
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

    if (req.method !== 'PATCH' && req.method !== 'PUT' && req.method !== 'DELETE') {
      return methodNotAllowed(res, ['GET', 'PATCH', 'PUT', 'DELETE']);
    }

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
        [status, resolved ? user.sub : null, id]
      );
      await connection.execute(
        `INSERT INTO issue_status_history (issue_id, status, changed_by_user_id, changed_at) VALUES (?, ?, ?, UTC_TIMESTAMP(3))`,
        [id, status, user.sub]
      );
      await connection.commit();
      return sendJson(res, 200, { ok: true, status, changedBy: user.sub });
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