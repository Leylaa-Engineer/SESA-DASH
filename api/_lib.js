import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

let pool;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    const error = new Error('DATABASE_URL is not configured');
    error.statusCode = 503;
    throw error;
  }
  if (!pool) {
    const url = new URL(process.env.DATABASE_URL);
    pool = mysql.createPool({
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.replace(/^\//, '')),
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 5),
      queueLimit: 0,
      timezone: 'Z',
      ssl: process.env.DATABASE_SSL === 'false' ? undefined : { rejectUnauthorized: true },
    });
  }
  return pool;
}

function getJwtSecret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    const error = new Error('JWT_SECRET must contain at least 32 characters');
    error.statusCode = 503;
    throw error;
  }
  return process.env.JWT_SECRET;
}

export function createAccessToken(user) {
  return jwt.sign(
    { sub: String(user.id), uid: String(user.id), email: user.email, role: user.role, fullName: user.full_name },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  );
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    const authError = new Error('Invalid or expired access token');
    authError.statusCode = 401;
    authError.cause = error;
    throw authError;
  }
}

export function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export async function requireUser(req) {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }
  return verifyAccessToken(authorization.slice(7));
}

export async function requireAdmin(req) {
  const user = await requireUser(req);
  if (user.role !== 'admin') {
    const error = new Error('Administrator access required');
    error.statusCode = 403;
    throw error;
  }
  return user;
}

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

export function methodNotAllowed(res, methods) {
  res.setHeader('Allow', methods.join(', '));
  return sendJson(res, 405, { error: 'Method not allowed' });
}

export function handleApiError(res, error) {
  console.error('[SESA API]', error);
  const status = error?.statusCode || (error?.code === 'ER_DUP_ENTRY' ? 409 : 500);
  return sendJson(res, status, { error: status === 500 ? 'Internal server error' : error.message });
}

export function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}
