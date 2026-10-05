const s = require('../../validators/auth.schema');

const valid = { name: 'Asha Rao', email: 'asha@test.in', phone: '9876543210', password: 'Book@2026', role: 'BUYER' };
const check = (body) => s.register.body.validate(body, { abortEarly: false });

describe('TC-A-01 registration validation (FR-01)', () => {
  it('accepts a valid buyer and seller', () => {
    expect(check(valid).error).toBeUndefined();
    expect(check({ ...valid, role: 'SELLER' }).error).toBeUndefined();
  });
  it.each([
    ['book2026', 'no upper-case or symbol'],
    ['BOOK@2026', 'no lower-case'],
    ['Book@book', 'no digit'],
    ['Book2026', 'no symbol'],
    ['Bk@1', 'too short'],
  ])('rejects password %s (%s)', (password) => {
    expect(check({ ...valid, password }).error).toBeDefined();
  });
  it('rejects a phone that is not exactly ten digits', () => {
    expect(check({ ...valid, phone: '98765' }).error).toBeDefined();
    expect(check({ ...valid, phone: '98765432100' }).error).toBeDefined();
  });
  it('never allows self-registration as ADMIN (SAD 3.9 elevation of privilege)', () => {
    expect(check({ ...valid, role: 'ADMIN' }).error).toBeDefined();
  });
  it('rejects unknown fields (SR-07)', () => {
    expect(check({ ...valid, is_verified: true }).error).toBeDefined();
  });
});
