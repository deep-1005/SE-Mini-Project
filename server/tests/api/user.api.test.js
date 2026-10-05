// TC-A-05 profile and address book (FR-05); SR-06 ownership.
const request = require('supertest');
const db = require('../helpers/db');
const { makeUser, login } = require('../helpers/factory');
const createApp = require('../../app');
const { Order, User } = require('../../models');

const app = createApp();
const addr = (over = {}) => ({ line1: '12 Ring Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560085', ...over });

beforeAll(db.start);
afterEach(db.clear);
afterAll(db.stop);

describe('TC-A-05 address book', () => {
  let user;
  let auth;
  beforeEach(async () => {
    user = await makeUser('BUYER');
    auth = { Authorization: `Bearer ${(await login(app, user)).token}` };
  });

  it('keeps exactly one default address', async () => {
    const a = await request(app).post('/api/v1/users/me/addresses').set(auth).send(addr({ isDefault: true }));
    expect(a.status).toBe(201);
    const b = await request(app).post('/api/v1/users/me/addresses').set(auth).send(addr({ pincode: '560001', isDefault: true }));
    const list = await request(app).get('/api/v1/users/me/addresses').set(auth);
    expect(list.body.items.filter((x) => x.isDefault)).toHaveLength(1);
    expect(list.body.items.find((x) => x.isDefault).id).toBe(b.body.address.id);
  });

  it('makes the first address default automatically and rejects an invalid PIN code', async () => {
    const a = await request(app).post('/api/v1/users/me/addresses').set(auth).send(addr());
    expect(a.body.address.isDefault).toBe(true);
    const bad = await request(app).post('/api/v1/users/me/addresses').set(auth).send(addr({ pincode: '56008' }));
    expect(bad.status).toBe(400);
  });

  it('will not delete the last address while an order is in flight against it', async () => {
    const a = await request(app).post('/api/v1/users/me/addresses').set(auth).send(addr());
    await Order.create({ order_no: 'OB-20261004-00001', buyer_id: user._id, address_id: a.body.address.id, item_total: 45000, shipping_fee: 4000, total_amount: 49000 });
    const del = await request(app).delete(`/api/v1/users/me/addresses/${a.body.address.id}`).set(auth);
    expect(del.status).toBe(409);
    expect(del.body.error.code).toBe('ADDRESS_IN_USE');
  });

  it('never lets a buyer reach another buyer\'s address (SR-06)', async () => {
    const other = await makeUser('BUYER');
    const otherAuth = { Authorization: `Bearer ${(await login(app, other)).token}` };
    const a = await request(app).post('/api/v1/users/me/addresses').set(otherAuth).send(addr());
    const res = await request(app).patch(`/api/v1/users/me/addresses/${a.body.address.id}`).set(auth).send({ city: 'Mysuru' });
    expect(res.status).toBe(404);
  });

  it('refuses mass-assignment of role through the profile (SAD 3.9)', async () => {
    const res = await request(app).patch('/api/v1/users/me').set(auth).send({ role: 'ADMIN' });
    expect(res.status).toBe(400);
    expect((await User.findById(user._id)).role).toBe('BUYER');
    const ok = await request(app).patch('/api/v1/users/me').set(auth).send({ name: 'Asha R' });
    expect(ok.body.user.name).toBe('Asha R');
  });
});
