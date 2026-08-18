import mysql from 'mysql2/promise';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let pool;
let firebaseAuth;

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

function getFirebaseAuth() {
  if (firebaseAuth) return firebaseAuth;
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    const error = new Error('Firebase Admin credentials are not configured');
    error.statusCode = 503;
    throw error;
  }
  const app = getApps()[0] || initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
  firebaseAuth = getAuth(app);
  return firebaseAuth;
}

export async function requireUser(req) {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }
  return getFirebaseAuth().verifyIdToken(authorization.slice(7));
}

export function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
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
  const status = error?.statusCode || (error?.code === 'auth/id-token-expired' || error?.code === 'auth/argument-error' ? 401 : 500);
  return sendJson(res, status, { error: status === 500 ? 'Internal server error' : error.message });
}

export function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}
