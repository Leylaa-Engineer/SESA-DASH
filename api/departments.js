import { getDb, handleApiError, methodNotAllowed, sendJson } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    const [rows] = await getDb().query(
      'SELECT id, name, is_active AS isActive FROM departments WHERE is_active = TRUE ORDER BY name'
    );
    return sendJson(res, 200, rows);
  } catch (error) {
    return handleApiError(res, error);
  }
}
