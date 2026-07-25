const crypto = require('crypto');

/**
 * Generate a unique 14-digit Health ID
 * Format: YYMMDD (6) + 7 random digits + 1 Luhn check digit = 14 total
 */
function generateHealthId() {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomPart = crypto.randomInt(1000000, 9999999).toString();
  const base = datePart + randomPart;
  const checkDigit = luhnCheckDigit(base);
  return base + checkDigit;
}

function luhnCheckDigit(digits) {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return ((sum * 9) % 10).toString();
}

function isValidHealthId(id) {
  if (!/^\d{14}$/.test(id)) return false;
  const base = id.slice(0, 13);
  const checkDigit = id[13];
  return luhnCheckDigit(base) === checkDigit;
}

module.exports = { generateHealthId, isValidHealthId };