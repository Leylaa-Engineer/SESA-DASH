export default async function handler(_req, res) {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ ok: false, error: 'DATABASE_URL is not configured' });
  }
  try {
    const { getDb } = await import('./_lib.js');
    await getDb().query('SELECT 1 AS ok');
    return res.status(200).json({ ok: true, database: 'mysql' });
  } catch (error) {
    console.error('[SESA health]', error);
    return res.status(503).json({ ok: false, error: 'MySQL connection is unavailable' });
  }
}
