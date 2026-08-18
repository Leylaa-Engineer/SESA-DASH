import { getDb, handleApiError, methodNotAllowed, readJson, requireUser, sendJson } from '../_lib.js';

function idFrom(req) {
  const raw = req.query?.id;
  return Number(Array.isArray(raw) ? raw[0] : raw);
}

export default async function handler(req, res) {
  const id = idFrom(req);
  if (!Number.isInteger(id)) return sendJson(res, 400, { error: 'Geçersiz makine id' });
  try {
    await requireUser(req);
    if (req.method === 'DELETE') {
      await getDb().execute('UPDATE machines SET is_active = FALSE WHERE id = ?', [id]);
      return sendJson(res, 200, { ok: true });
    }
    if (req.method !== 'PATCH') return methodNotAllowed(res, ['PATCH', 'DELETE']);
    const body = await readJson(req);
    const name = String(body.ad || body.name || '').trim();
    const departmentId = String(body.bolum_id || body.departmentId || '').trim();
    if (!name || !departmentId) return sendJson(res, 400, { error: 'Makine adı ve bölüm zorunludur' });
    await getDb().execute('UPDATE machines SET name = ?, department_id = ? WHERE id = ?', [name, departmentId, id]);
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return handleApiError(res, error);
  }
}
