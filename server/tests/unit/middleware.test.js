jest.mock('../../services/auditService', () => ({ record: jest.fn().mockResolvedValue() }));
const Joi = require('joi');
const auditService = require('../../services/auditService');
const authorizeRoles = require('../../middleware/authorizeRoles');
const validate = require('../../middleware/validate');
const errorHandler = require('../../middleware/errorHandler');
const { AppError } = require('../../utils/AppError');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('authorizeRoles (FR-06, SR-05)', () => {
  it('passes the declared role through', async () => {
    const next = jest.fn();
    await authorizeRoles('SELLER')({ user: { id: 'u1', role: 'SELLER' } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });
  it('refuses other roles with 403 FORBIDDEN_ROLE and writes an audit entry', async () => {
    const next = jest.fn();
    await authorizeRoles('ADMIN')({ user: { id: 'u1', role: 'BUYER' }, method: 'GET', baseUrl: '/api/v1/admin', route: { path: '/moderation' }, id: 'r1' }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ code: 'FORBIDDEN_ROLE', status: 403 });
    expect(auditService.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'ACCESS_DENIED', actorId: 'u1' }));
  });
  it('treats a missing user as unauthenticated', async () => {
    const next = jest.fn();
    await authorizeRoles('BUYER')({}, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401 });
  });
});

describe('validate (SR-07)', () => {
  const mw = validate({ body: Joi.object({ qty: Joi.number().integer().min(1).max(10).required() }) });
  it('lists every failing field', () => {
    const next = jest.fn();
    mw({ body: { qty: 11, extra: 1 } }, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toMatchObject({ code: 'VALIDATION_FAILED', status: 400 });
    expect(err.details.map((d) => d.field).sort()).toEqual(['extra', 'qty']);
  });
  it('coerces and forwards valid input', () => {
    const next = jest.fn();
    const req = { body: { qty: '3' } };
    mw(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body.qty).toBe(3);
  });
});

describe('errorHandler (SAD 4.4)', () => {
  it('renders an AppError in the standard envelope', () => {
    const res = mockRes();
    errorHandler(new AppError('OUT_OF_STOCK', 409, 'Only 2 copies are available.', [{ field: 'qty' }]), { id: 'req-1' }, res, () => {});
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'OUT_OF_STOCK', message: 'Only 2 copies are available.', requestId: 'req-1', details: [{ field: 'qty' }] } });
  });
  it('hides unexpected errors behind INTERNAL_ERROR', () => {
    const res = mockRes();
    errorHandler(new Error('db password is hunter2'), { id: 'req-2' }, res, () => {});
    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(body)).not.toContain('hunter2');
  });
});
