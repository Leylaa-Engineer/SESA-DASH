import handler from '../api/health.js';

const response = {
  statusCode: 200,
  headers: {},
  status(code) { this.statusCode = code; return this; },
  setHeader(name, value) { this.headers[name] = value; return this; },
  json(body) { this.body = JSON.stringify(body); },
  end(body) { this.body = body; },
};

await handler({}, response);
if (response.statusCode !== 503) throw new Error(`Expected 503, got ${response.statusCode}: ${response.body}`);
const payload = JSON.parse(response.body);
if (payload.error !== 'DATABASE_URL is not configured') throw new Error(`Unexpected error: ${response.body}`);
console.log('api-health-without-env: PASS', response.statusCode);
