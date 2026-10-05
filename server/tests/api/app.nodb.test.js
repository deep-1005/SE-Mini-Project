// Gateway behaviour that needs no database.
const request = require('supertest');
const createApp = require('../../app');

const app = createApp();

describe('API gateway layer without a database', () => {
  it('GET /health reports 503 when the database is down (TC-N-02)', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ status: 'degraded', db: 'down' });
  });
  it('sends security headers and a request id (SR-02, SR-07)', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['strict-transport-security']).toMatch(/max-age=15552000/);
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-request-id']).toBeDefined();
  });
  it('refuses a protected route without a token (TC-A-06)', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_MISSING');
  });
  it('validates before touching the database (TC-A-01 step 4)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ name: 'A', email: 'bad', phone: '98765', password: 'x', role: 'ADMIN' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.details.map((d) => d.field)).toEqual(expect.arrayContaining(['email', 'phone', 'password', 'role']));
  });
  it('strips NoSQL operators from the body (TC-SEC-06)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: { $gt: '' }, password: { $ne: null } });
    expect(res.status).toBe(400);
  });
  it('answers unknown routes with ROUTE_NOT_FOUND in the standard envelope', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: 'ROUTE_NOT_FOUND' });
    expect(res.body.error.requestId).toBeDefined();
  });
  it('rejects malformed JSON with 400, not 500', async () => {
    const res = await request(app).post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{"email":');
    expect(res.status).toBe(400);
  });
});
