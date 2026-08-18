function respond(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export default async function handler(_req, res) {
  if (!process.env.DATABASE_URL) {
    return respond(res, 503, { ok: false, error: 'DATABASE_URL is not configured' });
  }
  try {
    const { getDb } = await import('./_lib.js');
    await getDb().query('SELECT 1 AS ok');
    return respond(res, 200, { ok: true, database: 'mysql' });
  } catch (error) {
    console.error('[SESA health]', error);
    return respond(res, 503, { ok: false, error: 'MySQL connection is unavailable' });
  }
}
