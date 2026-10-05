/* eslint-disable no-console */
// Deterministic seed data (STP section 5, Test data).
// Usage: node scripts/seed.js [--titles=2500] [--per-title=4] [--keep]
// Default: 4 accounts per role (password Book@2026), 60 categories, 2,500 titles, 10,000 listings.
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const config = require('../config/env');
const { User, Category, Book, Listing } = require('../models');
const { CONDITIONS } = require('../models/Listing');

const arg = (name, def) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split('=')[1]) : def;
};
const TITLES = arg('titles', 2500);
const PER_TITLE = arg('per-title', 4);
const PASSWORD = 'Book@2026';

// Small deterministic PRNG so every run produces identical data.
let seed = 20261004;
const rand = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

function isbnFrom(n) {
  const body = `978${String(n).padStart(9, '0')}`;
  const sum = body.split('').reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return body + ((10 - (sum % 10)) % 10);
}

const TOP = ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'Engineering', 'Mathematics', 'History', 'Biography', 'Children', 'Self-Help', 'Business', 'Exam Preparation'];
const SUB = ['Classics', 'Contemporary', 'Textbooks', 'Guides'];
const ADJ = ['Silent', 'Hidden', 'Practical', 'Modern', 'Lost', 'Complete', 'Brief', 'Golden', 'Quiet', 'Applied', 'Essential', 'Midnight'];
const NOUN = ['River', 'Algorithms', 'Monsoon', 'Empire', 'Circuits', 'Garden', 'Equations', 'Journey', 'Kingdom', 'Networks', 'Harbour', 'Compilers'];
const AUTHORS = ['R K Narayan', 'Anita Desai', 'Ruskin Bond', 'Sudha Murty', 'Amitav Ghosh', 'Kiran Desai', 'Vikram Seth', 'Jhumpa Lahiri', 'Thomas H Cormen', 'Abraham Silberschatz', 'Ian Sommerville', 'Roger S Pressman'];
const PUBLISHERS = ['Penguin India', 'HarperCollins India', 'Rupa Publications', 'Pearson', 'McGraw Hill', 'Universities Press', 'Wiley India'];
const LANGS = ['English', 'English', 'English', 'Hindi', 'Kannada', 'Tamil'];

async function main() {
  await mongoose.connect(config.mongoUri);
  if (!process.argv.includes('--keep')) {
    await Promise.all(['users', 'categories', 'books', 'listings'].map((c) => mongoose.connection.db.collection(c).deleteMany({})));
  }
  await Promise.all(Object.values(mongoose.models).map((m) => m.init().catch((e) => console.warn(`index build skipped for ${m.modelName}: ${e.message}`))));

  const hash = await bcrypt.hash(PASSWORD, config.bcryptCost);
  const people = [];
  ['BUYER', 'SELLER', 'ADMIN'].forEach((role) => {
    for (let i = 1; i <= 4; i += 1) {
      people.push({ name: `${role[0]}${role.slice(1).toLowerCase()} ${i}`, email: `${role.toLowerCase()}${i}@bookstore.test`, phone: `98450000${role === 'BUYER' ? 1 : role === 'SELLER' ? 2 : 3}${i}`, role, password_hash: hash, is_verified: true });
    }
  });
  const users = await User.insertMany(people);
  const sellers = users.filter((u) => u.role === 'SELLER');

  const cats = [];
  for (const t of TOP) {
    const top = await Category.create({ name: t, slug: t.toLowerCase().replace(/[^a-z0-9]+/g, '-') });
    cats.push(top);
    for (const s of SUB) cats.push(await Category.create({ name: `${t} - ${s}`, slug: `${top.slug}-${s.toLowerCase()}`, parent_id: top._id }));
  }

  const books = [];
  const listings = [];
  const now = Date.now();
  for (let i = 0; i < TITLES; i += 1) {
    const mrp = (100 + Math.floor(rand() * 900)) * 100; // 100-999 rupees, in paise
    const book = {
      _id: new mongoose.Types.ObjectId(),
      isbn13: isbnFrom(100000 + i),
      title: `The ${pick(ADJ)} ${pick(NOUN)}${i % 7 === 0 ? ` Volume ${1 + (i % 3)}` : ''}`,
      author: pick(AUTHORS),
      publisher: pick(PUBLISHERS),
      category_id: pick(cats)._id,
      language: pick(LANGS),
      mrp,
      cover_url: `https://picsum.photos/seed/${i}/240/360`,
      avg_rating: Math.round((2.5 + rand() * 2.5) * 10) / 10,
      review_count: Math.floor(rand() * 50),
    };
    let lowest = null;
    let latest = null;
    for (let j = 0; j < PER_TITLE; j += 1) {
      const condition = pick(CONDITIONS);
      const factor = { NEW: 0.95, LIKE_NEW: 0.8, GOOD: 0.6, ACCEPTABLE: 0.4 }[condition];
      const price = Math.max(100, Math.round((mrp * factor) / 100) * 100);
      const stock = Math.floor(rand() * 12);
      const created = new Date(now - Math.floor(rand() * 90) * 86400000);
      const status = stock === 0 ? 'OUT_OF_STOCK' : 'ACTIVE';
      listings.push({ book_id: book._id, seller_id: pick(sellers)._id, condition, price, stock_qty: stock, status, created_at: created, updated_at: created });
      if (status === 'ACTIVE') {
        lowest = lowest == null ? price : Math.min(lowest, price);
        latest = !latest || created > latest ? created : latest;
      }
    }
    book.lowest_price = lowest;
    book.active_offers = listings.slice(-PER_TITLE).filter((l) => l.status === 'ACTIVE').length;
    book.last_listed_at = latest;
    books.push(book);
  }
  await Book.insertMany(books, { ordered: false });
  for (let k = 0; k < listings.length; k += 2000) await Listing.insertMany(listings.slice(k, k + 2000), { ordered: false, timestamps: false });

  console.log(`Seeded ${users.length} users (password ${PASSWORD}), ${cats.length} categories, ${books.length} titles, ${listings.length} listings.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
