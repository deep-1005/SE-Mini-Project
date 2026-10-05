const { buildPipeline } = require('../../services/catalogueService');

const base = { page: 1, limit: 20 };

describe('catalogue search pipeline (FR-07 to FR-09, NFR-01)', () => {
  it('starts with a $text match when q is given, so the text index is used', () => {
    const p = buildPipeline({ ...base, q: 'kalam' }, null).items;
    expect(p[0].$match.$text).toEqual({ $search: 'kalam' });
    expect(p[0].$match.active_offers).toEqual({ $gt: 0 });
  });
  it('ranks by text score by default and pages by 20', () => {
    const { items, count } = buildPipeline({ ...base, q: 'kalam', page: 3 }, null);
    const tail = items.slice(-4);
    expect(tail[0].$sort).toEqual({ score: -1, _id: 1 });
    expect(tail[1].$skip).toBe(40);
    expect(tail[2].$limit).toBe(20);
    expect(count[count.length - 1]).toEqual({ $count: 'n' });
  });
  it('joins listings only when an offer-level filter is present', () => {
    expect(buildPipeline({ ...base }, null).items.some((s) => s.$lookup)).toBe(false);
    const p = buildPipeline({ ...base, condition: 'GOOD', minPrice: 10000, maxPrice: 40000 }, null).items;
    const lookup = p.find((s) => s.$lookup);
    const conds = JSON.stringify(lookup.$lookup.pipeline[0]);
    expect(conds).toContain('"GOOD"');
    expect(conds).toContain('10000');
    expect(conds).toContain('40000');
  });
  it.each([
    ['price_asc', { lowest_price: 1, _id: 1 }],
    ['price_desc', { lowest_price: -1, _id: 1 }],
    ['rating', { avg_rating: -1, review_count: -1, _id: 1 }],
    ['newest', { last_listed_at: -1, _id: 1 }],
  ])('applies sort %s', (sort, expected) => {
    const { items } = buildPipeline({ ...base, sort }, null);
    expect(items[items.length - 4].$sort).toEqual(expected);
  });
});
