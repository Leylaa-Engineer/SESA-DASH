process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters-long';

const { hashPassword, comparePassword, createAccessToken, verifyAccessToken } = await import('../api/_lib.js');
const hash = await hashPassword('GuvenliSifre123!');
if (hash === 'GuvenliSifre123!' || !(await comparePassword('GuvenliSifre123!', hash))) {
  throw new Error('bcrypt password test failed');
}
const token = createAccessToken({ id: 42, email: 'test@example.com', role: 'admin', full_name: 'Test Admin' });
const payload = verifyAccessToken(token);
if (payload.sub !== '42' || payload.role !== 'admin') throw new Error('JWT payload test failed');
console.log('auth-migration: PASS');
