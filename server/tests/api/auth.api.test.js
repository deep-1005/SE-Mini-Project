// TC-A-01 to TC-A-04 and TC-A-06 against a real database.
const request = require('supertest');
const db = require('../helpers/db');
const { makeUser, login } = require('../helpers/factory');
const createApp = require('../../app');
const mailer = require('../../adapters/mailer');
const { User, Session, AuditLog } = require('../../models');

const app = createApp();
const api = () => request(app);
const otpFromOutbox = (email) => {
  const msg = [...mailer.outbox].reverse().find((m) => m.to === email && /verification code/.test(m.subject));
  return msg && msg.text.match(/\b(\d{6})\b/)[1];
};
const cookieValue = (setCookie) => setCookie.find((c) => c.startsWith('rt=')).split(';')[0];

beforeAll(db.start);
afterEach(async () => {
  await db.clear();
  mailer.clearOutbox();
});
afterAll(db.stop);

const buyer = { name: 'Asha Rao', email: 'asha@test.in', phone: '9876543210', password: 'Book@2026', role: 'BUYER' };

describe('TC-A-01 registration (FR-01)', () => {
  it('registers, stores only a bcrypt cost-12 hash, and rejects a duplicate e-mail', async () => {
    const res = await api().post('/api/v1/auth/register').send(buyer);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING_VERIFICATION');

    const stored = await User.findOne({ email: buyer.email }).select('+password_hash').lean();
    expect(stored.is_verified).toBe(false);
    expect(stored.password_hash).toMatch(/^\$2b\$12\$/); // TC-N-03
    expect(JSON.stringify(res.body)).not.toContain(buyer.password);

    const dup = await api().post('/api/v1/auth/register').send({ ...buyer, email: 'ASHA@test.in' });
    expect(dup.status).toBe(409);
    expect(dup.body.error).toMatchObject({ code: 'EMAIL_TAKEN', details: [{ field: 'email' }] });
    expect(await User.countDocuments()).toBe(1);
  });
});

describe('TC-A-02 OTP verification (FR-02)', () => {
  it('blocks sign-in until verified, then activates on the correct code', async () => {
    await api().post('/api/v1/auth/register').send(buyer);
    const early = await api().post('/api/v1/auth/login').send({ email: buyer.email, password: buyer.password });
    expect(early.status).toBe(403);
    expect(early.body.error.code).toBe('ACCOUNT_NOT_VERIFIED');

    const ok = await api().post('/api/v1/auth/verify-otp').send({ email: buyer.email, otp: otpFromOutbox(buyer.email) });
    expect(ok.status).toBe(200);
    expect((await User.findOne({ email: buyer.email })).is_verified).toBe(true);
  });

  it('locks the code after three wrong attempts', async () => {
    await api().post('/api/v1/auth/register').send(buyer);
    const otp = otpFromOutbox(buyer.email);
    const wrong = otp === '000000' ? '111111' : '000000';
    const r1 = await api().post('/api/v1/auth/verify-otp').send({ email: buyer.email, otp: wrong });
    const r2 = await api().post('/api/v1/auth/verify-otp').send({ email: buyer.email, otp: wrong });
    const r3 = await api().post('/api/v1/auth/verify-otp').send({ email: buyer.email, otp: wrong });
    expect([r1.status, r2.status, r3.status]).toEqual([400, 400, 423]);
    const late = await api().post('/api/v1/auth/verify-otp').send({ email: buyer.email, otp });
    expect(late.status).toBe(423);
    expect(late.body.error.code).toBe('OTP_LOCKED');
  });

  it('refuses an expired code with 410', async () => {
    await api().post('/api/v1/auth/register').send(buyer);
    const otp = otpFromOutbox(buyer.email);
    await User.updateOne({ email: buyer.email }, { $set: { 'security.otp_expires_at': new Date(Date.now() - 1000) } });
    const res = await api().post('/api/v1/auth/verify-otp').send({ email: buyer.email, otp });
    expect(res.status).toBe(410);
    expect(res.body.error.code).toBe('OTP_EXPIRED');
  });

  it('allows at most three resends per hour', async () => {
    await api().post('/api/v1/auth/register').send(buyer);
    const codes = [];
    for (let i = 0; i < 4; i += 1) codes.push((await api().post('/api/v1/auth/resend-otp').send({ email: buyer.email })).status);
    expect(codes).toEqual([202, 202, 202, 429]);
  });
});

describe('TC-A-03 login, refresh rotation and logout (FR-03, SR-04)', () => {
  it('issues tokens, rotates the refresh token, detects reuse and revokes on logout', async () => {
    const user = await makeUser('BUYER');
    const loginRes = await api().post('/api/v1/auth/login').send({ email: user.email, password: 'Book@2026' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toMatchObject({ expiresIn: 900, user: { role: 'BUYER' } });
    const setCookie = loginRes.headers['set-cookie'][0];
    expect(setCookie).toMatch(/HttpOnly/);
    expect(setCookie).toMatch(/SameSite=Strict/);
    expect(setCookie).toMatch(/Path=\/api\/v1\/auth/);
    const first = cookieValue(loginRes.headers['set-cookie']);

    const me = await api().get('/api/v1/users/me').set('Authorization', `Bearer ${loginRes.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(user.email);

    const r1 = await api().post('/api/v1/auth/refresh').set('Cookie', first);
    expect(r1.status).toBe(200);
    const second = cookieValue(r1.headers['set-cookie']);
    expect(second).not.toBe(first);

    // Replaying the rotated token revokes every session (TC-SEC-04).
    const replay = await api().post('/api/v1/auth/refresh').set('Cookie', first);
    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe('REFRESH_REUSED');
    const afterReuse = await api().post('/api/v1/auth/refresh').set('Cookie', second);
    expect(afterReuse.status).toBe(401);

    const again = await api().post('/api/v1/auth/login').send({ email: user.email, password: 'Book@2026' });
    const cookie = cookieValue(again.headers['set-cookie']);
    expect((await api().post('/api/v1/auth/logout').set('Cookie', cookie)).status).toBe(204);
    const afterLogout = await api().post('/api/v1/auth/refresh').set('Cookie', cookie);
    expect(afterLogout.status).toBe(401);
    expect(afterLogout.body.error.code).toBe('REFRESH_INVALID');
  });

  it('gives the same error for a wrong password and an unknown e-mail', async () => {
    const user = await makeUser('BUYER');
    const a = await api().post('/api/v1/auth/login').send({ email: user.email, password: 'Wrong@2026' });
    const b = await api().post('/api/v1/auth/login').send({ email: 'nobody@test.in', password: 'Wrong@2026' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.error.message).toBe(b.body.error.message);
  });

  it('rate-limits after five failed logins (TC-SEC-09)', async () => {
    const user = await makeUser('BUYER');
    const statuses = [];
    for (let i = 0; i < 6; i += 1) statuses.push((await api().post('/api/v1/auth/login').send({ email: user.email, password: 'Wrong@2026' })).status);
    expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
  });
});

describe('TC-A-04 password recovery (FR-04)', () => {
  it('answers identically for unknown e-mails, resets once, and revokes all sessions', async () => {
    const user = await makeUser('BUYER');
    const s1 = await login(app, user);
    await login(app, user);

    const known = await api().post('/api/v1/auth/forgot-password').send({ email: user.email });
    const unknown = await api().post('/api/v1/auth/forgot-password').send({ email: 'ghost@test.in' });
    expect(known.status).toBe(202);
    expect(unknown.status).toBe(202);
    expect(known.body).toEqual(unknown.body);

    const mail = mailer.outbox.find((m) => m.to === user.email && /Reset/.test(m.subject));
    const token = mail.text.match(/token=([\w-]+)/)[1];
    const reset = await api().post('/api/v1/auth/reset-password').send({ token, newPassword: 'Novel#2026' });
    expect(reset.status).toBe(200);
    const reuse = await api().post('/api/v1/auth/reset-password').send({ token, newPassword: 'Other#2026' });
    expect(reuse.status).toBe(400);
    expect(reuse.body.error.code).toBe('RESET_TOKEN_INVALID');

    expect(await Session.countDocuments({ user_id: user._id, revoked_at: null })).toBe(0);
    const oldAccess = await api().get('/api/v1/users/me').set('Authorization', `Bearer ${s1.token}`);
    expect(oldAccess.status).toBe(401); // token version bumped
    const relogin = await api().post('/api/v1/auth/login').send({ email: user.email, password: 'Novel#2026' });
    expect(relogin.status).toBe(200);
  });

  it('refuses an expired reset link', async () => {
    const user = await makeUser('BUYER');
    await api().post('/api/v1/auth/forgot-password').send({ email: user.email });
    const token = mailer.outbox[mailer.outbox.length - 1].text.match(/token=([\w-]+)/)[1];
    await User.updateOne({ _id: user._id }, { $set: { 'security.reset_expires_at': new Date(Date.now() - 1000) } });
    const res = await api().post('/api/v1/auth/reset-password').send({ token, newPassword: 'Novel#2026' });
    expect(res.status).toBe(400);
  });
});

describe('TC-A-06 role-based access control (FR-06)', () => {
  it('admits only declared roles, audits refusals, and blocks blocked accounts', async () => {
    const b = await makeUser('BUYER');
    const s = await makeUser('SELLER');
    const blocked = await makeUser('BUYER', { is_blocked: true });
    const bt = (await login(app, b)).token;
    const st = (await login(app, s)).token;

    const isbnAsBuyer = await api().get('/api/v1/books/isbn/9780306406157').set('Authorization', `Bearer ${bt}`);
    expect(isbnAsBuyer.status).toBe(403);
    expect(isbnAsBuyer.body.error.code).toBe('FORBIDDEN_ROLE');
    const isbnAsSeller = await api().get('/api/v1/books/isbn/9780306406157').set('Authorization', `Bearer ${st}`);
    expect(isbnAsSeller.status).toBe(404); // allowed; book simply not in catalogue
    const addrAsSeller = await api().get('/api/v1/users/me/addresses').set('Authorization', `Bearer ${st}`);
    expect(addrAsSeller.status).toBe(403);

    expect(await AuditLog.countDocuments({ action: 'ACCESS_DENIED' })).toBe(2);

    const blockedLogin = await api().post('/api/v1/auth/login').send({ email: blocked.email, password: 'Book@2026' });
    expect(blockedLogin.status).toBe(403);
    expect(blockedLogin.body.error.code).toBe('ACCOUNT_BLOCKED');
  });

  it('refuses an access token once the account is blocked', async () => {
    const b = await makeUser('BUYER');
    const { token } = await login(app, b);
    await User.updateOne({ _id: b._id }, { $set: { is_blocked: true } });
    const res = await api().get('/api/v1/users/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
