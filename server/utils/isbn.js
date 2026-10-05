// ISBN-13 checksum validation (SRS 6.6 domain requirement).
function normaliseIsbn(raw) {
  return String(raw || '').replace(/[-\s]/g, '');
}

function isValidIsbn13(raw) {
  const isbn = normaliseIsbn(raw);
  if (!/^\d{13}$/.test(isbn)) return false;
  const sum = isbn
    .slice(0, 12)
    .split('')
    .reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  const check = (10 - (sum % 10)) % 10;
  return check === Number(isbn[12]);
}

module.exports = { isValidIsbn13, normaliseIsbn };
