const { isValidIsbn13, normaliseIsbn } = require('../../utils/isbn');

describe('ISBN-13 checksum (SRS 6.6)', () => {
  it('accepts valid ISBN-13 values, with or without hyphens', () => {
    expect(isValidIsbn13('9780306406157')).toBe(true);
    expect(isValidIsbn13('978-0-306-40615-7')).toBe(true);
    expect(isValidIsbn13('9788173711466')).toBe(true);
  });
  it('rejects a wrong check digit, wrong length and non-digits (TC-S-01 data)', () => {
    expect(isValidIsbn13('9780306406158')).toBe(false);
    expect(isValidIsbn13('978030640615')).toBe(false);
    expect(isValidIsbn13('97803064061X7')).toBe(false);
    expect(isValidIsbn13(undefined)).toBe(false);
  });
  it('normalises spaces and hyphens', () => {
    expect(normaliseIsbn(' 978-0 306 ')).toBe('9780306');
  });
});
