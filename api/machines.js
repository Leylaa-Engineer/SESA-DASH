import { getDb, handleApiError, methodNotAllowed, readJson, requireUser, sendJson } from './_lib.js';

function mapMachine(row) {
  return {
    id: row.id,
    kod: row.code,
    ad: row.name,
    bolum_id: row.departmentId,
    bolum_ad: row.departmentName,
    qr_kodu: row.qrCodeValue,
    canias_varlik_no: row.caniasAssetNo,
    ekleyen_kullanici_id: row.addedByUserId,
    aktif: Boolean(row.isActive),
    olusturulma_tarihi: row.createdAt,
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const code = typeof req.query?.code === 'string' ? req.query.code.trim().toUpperCase() : '';
      const [rows] = await getDb().query(
        `SELECT m.id, m.code, m.name, m.department_id AS departmentId, d.name AS departmentName,
                m.qr_code_value AS qrCodeValue, m.canias_asset_no AS caniasAssetNo,
                m.added_by_user_id AS addedByUserId, m.is_active AS isActive, m.created_at AS createdAt
           FROM machines m JOIN departments d ON d.id = m.department_id
          WHERE m.is_active = TRUE ${code ? 'AND m.code = ?' : ''}
          ORDER BY m.name`,
        code ? [code] : []
      );
      return sendJson(res, 200, rows.map(mapMachine));
    }
    if (req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST']);
    const user = await requireUser(req);
    const body = await readJson(req);
    const name = String(body.ad || body.name || '').trim();
    const departmentId = String(body.bolum_id || body.departmentId || '').trim();
    if (!name || !departmentId) return sendJson(res, 400, { error: 'Makine adı ve bölüm zorunludur' });
    const code = String(body.kod || `MKN-${Date.now().toString(36).toUpperCase()}`).trim().toUpperCase();
    const db = getDb();
    const [result] = await db.execute(
      `INSERT INTO machines (code, name, department_id, qr_code_value, canias_asset_no, added_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [code, name, departmentId, body.qr_code_value || body.qrCodeValue || code, body.canias_asset_no || body.caniasAssetNo || null, user.sub]
    );
    const [rows] = await db.query(
      `SELECT m.id, m.code, m.name, m.department_id AS departmentId, d.name AS departmentName,
              m.qr_code_value AS qrCodeValue, m.canias_asset_no AS caniasAssetNo,
              m.added_by_user_id AS addedByUserId, m.is_active AS isActive, m.created_at AS createdAt
         FROM machines m JOIN departments d ON d.id = m.department_id WHERE m.id = ?`,
      [result.insertId]
    );
    return sendJson(res, 201, mapMachine(rows[0]));
  } catch (error) {
    return handleApiError(res, error);
  }
}
