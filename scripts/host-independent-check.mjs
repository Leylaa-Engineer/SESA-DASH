import { readFile } from 'node:fs/promises';
import { getDb } from '../api/_lib.js';

const schema = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
const client = await readFile(new URL('../src/api/client.js', import.meta.url), 'utf8');

for (const table of ['departments', 'users', 'user_departments', 'machines', 'issues', 'issue_status_history']) {
  if (!schema.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) throw new Error(`Missing table: ${table}`);
}
for (const endpoint of ['/api/health', '/api/users/me', '/api/machines', '/api/issues']) {
  if (!client.includes(endpoint)) throw new Error(`Missing API client endpoint: ${endpoint}`);
}

if (process.env.DATABASE_URL) throw new Error('This check must run without DATABASE_URL');
try {
  getDb();
  throw new Error('getDb() should fail safely without DATABASE_URL');
} catch (error) {
  if (error.statusCode !== 503) throw error;
}

console.log('host-independent-check: PASS');
