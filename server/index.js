import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3001);
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://sesa:sesa@localhost:5432/sesa' });

const collections = {
  makineler: { table: 'machines', id: 'id' },
  arizalar: { table: 'issues', id: 'id' },
  sorumlular: { table: 'users', id: 'id' },
  yoneticiler: { table: 'users', id: 'id' },
  bolumler: { table: 'departments', id: 'id' },
  ayarlar: { table: 'settings', id: 'key' },
};

const fieldMap = {
  machines: { kod: 'code', ad: 'name', bolum_id: 'department_id', bolum_ad: 'department_name', ekleyen_email: 'created_by_email', aktif: 'active', olusturulma_tarihi: 'created_at' },
  issues: { makine_id: 'machine_id', makine_kod: 'machine_code', makine_ad: 'machine_name', bolum_id: 'department_id', bolum_ad: 'department_name', ekleyen_email: 'reporter_email', aciklama: 'description', foto_url: 'photo_url', durum: 'status', cozulme_tarihi: 'resolved_at', cozen_sorumlu_id: 'resolved_by_id', sorumlu_email: 'responsible_email', olusturulma_tarihi: 'created_at' },
  users: { ad_soyad: 'display_name', email: 'email', rol: 'role', bolum_idler: 'department_ids', aktif: 'active', olusturulma_tarihi: 'created_at', sonGirisTarihi: 'last_login_at' },
  departments: { ad: 'name', aktif: 'active' },
};

function json(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS' }); res.end(JSON.stringify(body)); }
function readBody(req) { return new Promise((resolve, reject) => { let raw = ''; req.on('data', (chunk) => { raw += chunk; if (raw.length > 8_000_000) reject(new Error('Payload too large')); }); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (error) { reject(error); } }); req.on('error', reject); }); }
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) { return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`; }
function verifyPassword(password, stored) { const [salt, hash] = String(stored).split(':'); if (!salt || !hash) return false; return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), crypto.scryptSync(password, salt, 64)); }
function toClient(row, collection) {
  if (!row) return row;
  const map = fieldMap[collections[collection]?.table] || fieldMap[collection] || {};
  const result = { id: row.id };
  for (const [source, target] of Object.entries(map)) result[source] = row[target];
  if (collection === 'sorumlular' || collection === 'yoneticiler') { result.rol = row.role; result.bolum_idler = row.department_ids || []; result.ad_soyad = row.display_name; }
  if (collection === 'arizalar') { result.durum_gecmisi = row.status_history || []; result.email = row.reporter_email; }
  if (collection === 'ayarlar') { result.id = row.key; return { id: row.key, ...row.value }; }
  return result;
}
function sqlValue(value) { return value && typeof value === 'object' && value._serverTimestamp ? new Date() : value; }
function dbColumn(collection, field) { const table = collections[collection]?.table; return fieldMap[table]?.[field] || field; }
function normalizeWrite(collection, data) {
  const table = collections[collection]?.table;
  const result = {};
  for (const [field, value] of Object.entries(data || {})) {
    const column = fieldMap[table]?.[field];
    if (!column || field === 'id' || field === 'durum_gecmisi') continue;
    if (column === 'department_ids') result[column] = JSON.stringify(value || []);
    else if (column === 'status_history') result[column] = JSON.stringify(value || []);
    else result[column] = sqlValue(value);
  }
  if (table === 'issues' && data.durum_gecmisi) result.status_history = JSON.stringify(data.durum_gecmisi);
  if (table === 'users' && data.password) result.password_hash = hashPassword(data.password);
  return result;
}
async function handleAuth(req, res, pathname) {
  const body = await readBody(req);
  if (pathname === '/api/auth/register') {
    const passwordHash = hashPassword(body.password || '');
    const result = await pool.query('INSERT INTO users (email, password_hash, display_name, role, department_ids) VALUES ($1,$2,$3,$4,$5) RETURNING id,email,display_name,role,department_ids', [body.email, passwordHash, body.displayName || body.email, body.role || 'sorumlu', JSON.stringify(body.departmentIds || [])]);
    return json(res, 201, { user: { uid: result.rows[0].id, email: result.rows[0].email } });
  }
  const result = await pool.query('SELECT * FROM users WHERE email=$1 AND active=true', [body.email]);
  if (!result.rowCount || !verifyPassword(body.password || '', result.rows[0].password_hash)) return json(res, 401, { error: 'E-posta veya şifre hatalı.' });
  const user = result.rows[0];
  await pool.query('UPDATE users SET last_login_at=NOW() WHERE id=$1', [user.id]);
  return json(res, 200, { user: { uid: user.id, email: user.email, displayName: user.display_name } });
}
async function handleCollection(req, res, collection, id) {
  const definition = collections[collection];
  if (!definition) return json(res, 404, { error: 'Koleksiyon bulunamadı.' });
  const table = definition.table;
  if (req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filters = [...url.searchParams.entries()];
    const clauses = []; const values = [];
    if (id) { values.push(id); clauses.push(`${definition.id}=$${values.length}`); }
    for (const [field, value] of filters) { if (field === 'limit') continue; values.push(field === 'bolum_idler' ? JSON.stringify([value]) : value); clauses.push(field === 'bolum_idler' ? `$${values.length}::jsonb <@ department_ids` : `${dbColumn(collection, field)}=$${values.length}`); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const order = table === 'issues' ? 'ORDER BY created_at DESC' : '';
    const result = await pool.query(`SELECT * FROM ${table} ${where} ${order}`, values);
    return json(res, 200, id ? (result.rows[0] ? toClient(result.rows[0], collection) : null) : result.rows.map((row) => toClient(row, collection)));
  }
  const body = await readBody(req);
  if (req.method === 'POST') {
    if (body.id && table === 'users') {
      const data = normalizeWrite(collection, body); const entries = Object.entries(data); const values = entries.map(([, value]) => value); values.push(body.id);
      if (entries.length) await pool.query(`UPDATE users SET ${entries.map(([key], i) => `${key}=$${i + 1}`).join(',')} WHERE id=$${values.length}`, values);
      const result = await pool.query('SELECT * FROM users WHERE id=$1', [body.id]);
      return json(res, 201, toClient(result.rows[0], collection));
    }
    const data = normalizeWrite(collection, body);
    const entries = Object.entries(data); const values = entries.map(([, value]) => value);
    if (table === 'settings') { const key = body.id || body.key; const result = await pool.query('INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value RETURNING *', [key, JSON.stringify(body)]); return json(res, 201, toClient(result.rows[0], collection)); }
    const result = await pool.query(`INSERT INTO ${table} (${entries.map(([key]) => key).join(',')}) VALUES (${entries.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`, values);
    if (table === 'issues') await pool.query('INSERT INTO issue_status_history (issue_id,status) VALUES ($1,$2)', [result.rows[0].id, result.rows[0].status]);
    return json(res, 201, toClient(result.rows[0], collection));
  }
  if (!id) return json(res, 400, { error: 'Kayıt kimliği gerekli.' });
  if (req.method === 'DELETE') { await pool.query(`DELETE FROM ${table} WHERE ${definition.id}=$1`, [id]); return json(res, 200, { ok: true }); }
  if (req.method === 'PATCH') {
    const data = normalizeWrite(collection, body); const entries = Object.entries(data); const values = entries.map(([, value]) => value); values.push(id);
    if (table === 'issues' && body.durum) { const current = await pool.query('SELECT status FROM issues WHERE id=$1', [id]); if (current.rowCount && current.rows[0].status !== body.durum) await pool.query('INSERT INTO issue_status_history (issue_id,status) VALUES ($1,$2)', [id, body.durum]); }
    const result = await pool.query(`UPDATE ${table} SET ${entries.map(([key], i) => `${key}=$${i + 1}`).join(',')} WHERE ${definition.id}=$${values.length} RETURNING *`, values);
    return json(res, 200, toClient(result.rows[0], collection));
  }
  return json(res, 405, { error: 'Method not allowed' });
}
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  try {
    const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
    if (pathname === '/api/health') return json(res, 200, { ok: true, database: 'postgresql' });
    if (pathname === '/api/auth/login' || pathname === '/api/auth/register') return handleAuth(req, res, pathname);
    const match = pathname.match(/^\/api\/collections\/([^/]+)(?:\/([^/]+))?$/);
    if (match) return handleCollection(req, res, match[1], match[2]);
    return json(res, 404, { error: 'Endpoint bulunamadı.' });
  } catch (error) { console.error(error); return json(res, 500, { error: 'Sunucu hatası.' }); }
});
server.listen(port, () => console.log(`SESA SQL API http://localhost:${port}`));
