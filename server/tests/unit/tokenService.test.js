const jwt = require('jsonwebtoken');
const tokenService = require('../../services/tokenService');

const user = { _id: '64b000000000000000000001', role: 'BUYER', token_version: 3 };

describe('access tokens (FR-03, SR-04)', () => {
  it('signs a 15-minute HS256 token carrying id, role and token version only', () => {
    const token = tokenService.signAccessToken(user);
    const decoded = jwt.decode(token, { complete: true });
    expect(decoded.header.alg).toBe('HS256');
    expect(decoded.payload.exp - decoded.payload.iat).toBe(900);
    expect(decoded.payload).toMatchObject({ sub: user._id, role: 'BUYER', tv: 3 });
    expect(Object.keys(decoded.payload).sort()).toEqual(['exp', 'iat', 'role', 'sub', 'tv']);
  });

  it('rejects an expired token with TOKEN_EXPIRED', () => {
    const token = jwt.sign({ sub: 'x', role: 'BUYER', tv: 0 }, process.env.JWT_ACCESS_SECRET, { expiresIn: -10 });
    expect(() => tokenService.verifyAccessToken(token)).toThrow(expect.objectContaining({ code: 'TOKEN_EXPIRED', status: 401 }));
  });

  it('rejects a token signed with another secret or with alg none (TC-SEC-05)', () => {
    const forged = jwt.sign({ sub: 'x', role: 'ADMIN', tv: 0 }, 'some-other-secret-of-sufficient-length!!');
    expect(() => tokenService.verifyAccessToken(forged)).toThrow(expect.objectContaining({ code: 'TOKEN_INVALID' }));
    const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from('{"sub":"x","role":"ADMIN","tv":0}').toString('base64url')}.`;
    expect(() => tokenService.verifyAccessToken(none)).toThrow(expect.objectContaining({ code: 'TOKEN_INVALID' }));
  });
});
