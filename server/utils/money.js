// Money is held as integer paise to avoid floating-point error (DC-07, SAD 4.1).
const toPaise = (rupees) => Math.round(Number(rupees) * 100);
const fromPaise = (paise) => Number((paise / 100).toFixed(2));
const money = (paise) => ({ amount: paise, currency: 'INR' });

module.exports = { toPaise, fromPaise, money };
