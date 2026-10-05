// TC-C-01 to TC-C-04 and TC-C-06. Needs a real MongoDB (text index and $lookup pipelines).
const request = require('supertest');
const db = require('../helpers/db');
const { makeUser } = require('../helpers/factory');
const createApp = require('../../app');
const cache = require('../../adapters/cache');
const catalogueService = require('../../services/catalogueService');
const { Book, Listing, Category } = require('../../models');

const app = createApp();
let seller;
let fiction;
let science;

async function addBook(fields, offers = [{ price: 25000, condition: 'GOOD', stock: 3 }]) {
  const n = String(Math.floor(Math.random() * 1e9)).padStart(9, '0');
  const body = `978${n}`;
  const sum = body.split('').reduce((a, d, i) => a + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  const book = await Book.create({ isbn13: body + ((10 - (sum % 10)) % 10), author: 'Ruskin Bond', publisher: 'Rupa', category_id: fiction._id, language: 'English', mrp: 50000, ...fields });
  for (const o of offers) {
    await Listing.create({ book_id: book._id, seller_id: seller._id, condition: o.condition, price: o.price, stock_qty: o.stock, status: o.status || (o.stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK') });
  }
  await catalogueService.refreshBookStats(book._id);
  return book;
}

beforeAll(db.start);
beforeEach(async () => {
  cache._memory.clear();
  seller = await makeUser('SELLER');
  fiction = await Category.create({ name: 'Fiction', slug: 'fiction' });
  science = await Category.create({ name: 'Science', slug: 'science' });
});
afterEach(db.clear);
afterAll(db.stop);

describe('TC-C-01 paged catalogue (FR-07)', () => {
  it('returns 20 per page with the required fields and the lowest active price', async () => {
    for (let i = 0; i < 45; i += 1) await addBook({ title: `Title ${i}` }, [{ price: 30000, condition: 'GOOD', stock: 2 }, { price: 20000 + i, condition: 'ACCEPTABLE', stock: 1 }]);
    const pages = await Promise.all([1, 2, 3, 4].map((p) => request(app).get(`/api/v1/books?page=${p}`)));
    expect(pages.map((r) => r.body.items.length)).toEqual([20, 20, 5, 0]);
    expect(pages[0].body.total).toBe(45);
    const item = pages[0].body.items[0];
    expect(Object.keys(item)).toEqual(expect.arrayContaining(['id', 'title', 'author', 'coverUrl', 'lowestPrice', 'avgRating']));
    expect(item.lowestPrice).toBeLessThan(30000);
  });
});

describe('TC-C-02 keyword search (FR-08)', () => {
  it('finds by title, author, ISBN and publisher, ranks the best match first, and suggests a category when empty', async () => {
    const wings = await addBook({ title: 'Wings of Fire', author: 'A P J Abdul Kalam', publisher: 'Universities Press', category_id: science._id });
    await addBook({ title: 'Ignited Minds', author: 'A P J Abdul Kalam' });
    await addBook({ title: 'The Room on the Roof' });

    const byTitle = await request(app).get('/api/v1/books?q=wings');
    expect(byTitle.body.items[0].id).toBe(String(wings._id));
    const byAuthor = await request(app).get('/api/v1/books?q=kalam');
    expect(byAuthor.body.total).toBe(2);
    const byIsbn = await request(app).get(`/api/v1/books?q=${wings.isbn13}`);
    expect(byIsbn.body.items[0].id).toBe(String(wings._id));
    const byPublisher = await request(app).get('/api/v1/books?q=Universities');
    expect(byPublisher.body.total).toBe(1);

    const none = await request(app).get('/api/v1/books?q=zzqx');
    expect(none.body.total).toBe(0);
    expect(none.body.suggestion).toHaveProperty('category');
  });

  it('serves a repeated query from cache', async () => {
    await addBook({ title: 'Cached Title' });
    const a = await request(app).get('/api/v1/books?sort=rating&language=English');
    const b = await request(app).get('/api/v1/books?sort=rating&language=English');
    expect(a.headers['x-cache']).toBe('MISS');
    expect(b.headers['x-cache']).toBe('HIT');
    expect(b.body).toEqual(a.body);
    await addBook({ title: 'New listing invalidates' }); // listing change clears search:* keys
    const c = await request(app).get('/api/v1/books?sort=rating&language=English');
    expect(c.headers['x-cache']).toBe('MISS');
    expect(c.body.total).toBe(2);
  });
});

describe('TC-C-03 filters and sorting (FR-09)', () => {
  it('combines offer-level and title-level filters and sorts correctly', async () => {
    await addBook({ title: 'A', avg_rating: 4.5 }, [{ price: 15000, condition: 'GOOD', stock: 1 }]);
    await addBook({ title: 'B', avg_rating: 4.2 }, [{ price: 35000, condition: 'GOOD', stock: 1 }, { price: 9000, condition: 'ACCEPTABLE', stock: 1 }]);
    await addBook({ title: 'C', avg_rating: 3.0 }, [{ price: 20000, condition: 'GOOD', stock: 1 }]);
    await addBook({ title: 'D', avg_rating: 4.8, language: 'Hindi' }, [{ price: 20000, condition: 'GOOD', stock: 1 }]);
    await addBook({ title: 'E', avg_rating: 4.9, category_id: science._id }, [{ price: 20000, condition: 'GOOD', stock: 1 }]);

    const res = await request(app).get('/api/v1/books?category=fiction&condition=GOOD&minPrice=10000&maxPrice=40000&language=English&minRating=4&sort=price_asc');
    expect(res.status).toBe(200);
    expect(res.body.items.map((i) => i.title)).toEqual(['A', 'B']);
    expect(res.body.items[1].lowestPrice).toBe(35000); // lowest *matching* offer, not the ACCEPTABLE one

    const desc = await request(app).get('/api/v1/books?category=fiction&language=English&sort=price_desc');
    const prices = desc.body.items.map((i) => i.lowestPrice);
    expect([...prices].sort((x, y) => y - x)).toEqual(prices);

    const rating = await request(app).get('/api/v1/books?sort=rating');
    expect(rating.body.items[0].title).toBe('E');

    const inverted = await request(app).get('/api/v1/books?minPrice=50000&maxPrice=10000');
    expect(inverted.status).toBe(400);
  });
});

describe('TC-C-04 book detail (FR-10)', () => {
  it('lists only ACTIVE offers in ascending price order', async () => {
    const book = await addBook({ title: 'Offers' }, [
      { price: 25000, condition: 'GOOD', stock: 2 },
      { price: 18000, condition: 'ACCEPTABLE', stock: 1 },
      { price: 21000, condition: 'LIKE_NEW', stock: 0 },
      { price: 30000, condition: 'NEW', stock: 5, status: 'BLOCKED' },
    ]);
    const res = await request(app).get(`/api/v1/books/${book._id}`);
    expect(res.status).toBe(200);
    expect(res.body.offers.map((o) => o.price)).toEqual([18000, 25000]);
    expect(res.body.offers[0]).toMatchObject({ condition: 'ACCEPTABLE', inStock: true, seller: { name: seller.name } });

    const missing = await request(app).get('/api/v1/books/64b000000000000000000099');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('BOOK_NOT_FOUND');
  });
});

describe('TC-C-06 related titles (FR-12)', () => {
  it('puts same-author titles first, then category, never itself or unlisted titles, at most six', async () => {
    const t = await addBook({ title: 'Target', author: 'Author A' });
    await addBook({ title: 'A1', author: 'Author A', category_id: science._id });
    await addBook({ title: 'A2', author: 'Author A', category_id: science._id });
    await addBook({ title: 'A3 unlisted', author: 'Author A' }, [{ price: 1000, condition: 'GOOD', stock: 0 }]);
    for (let i = 0; i < 6; i += 1) await addBook({ title: `C${i}`, author: `Other ${i}` });
    const res = await request(app).get(`/api/v1/books/${t._id}/related`);
    const titles = res.body.items.map((i) => i.title);
    expect(titles).toHaveLength(6);
    expect(titles.slice(0, 2).sort()).toEqual(['A1', 'A2']);
    expect(titles).not.toContain('Target');
    expect(titles).not.toContain('A3 unlisted');
  });
});
