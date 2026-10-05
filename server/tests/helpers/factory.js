const bcrypt = require('bcrypt');
const request = require('supertest');
const { User } = require('../../models');

const PASSWORD = 'Book@2026';
let n = 0;

async function makeUser(role = 'BUYER', overrides = {}) {
  n += 1;
  return User.create({
    name: `${role} ${n}`,
    email: `${role.toLowerCase()}${n}.${Date.now()}@test.in`,
    phone: '9876543210',
    role,
    password_hash: await bcrypt.hash(PASSWORD, 4),
    is_verified: true,
    ...overrides,
  });
}

async function login(app, user) {
  const res = await request(app).post('/api/v1/auth/login').send({ email: user.email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { token: res.body.accessToken, cookie: res.headers['set-cookie'] };
}

module.exports = { makeUser, login, PASSWORD };
