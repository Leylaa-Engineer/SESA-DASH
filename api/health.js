import { getDb, handleApiError, sendJson } from './_lib.js';

export default async function handler(_req, res) {
  try {
    await getDb().query('SELECT 1 AS ok');
    return sendJson(res, 200, { ok: true, database: 'mysql' });
  } catch (error) {
    return handleApiError(res, error);
  }
}
