const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Generate a 6-digit OTP
 */
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash OTP for storage
 */
async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

/**
 * Verify OTP against stored hash
 */
async function verifyOtp(otp, hash) {
  return bcrypt.compare(otp, hash);
}

/**
 * Get OTP expiry (10 minutes from now)
 */
function getOtpExpiry() {
  return new Date(Date.now() + 10 * 60 * 1000);
}

/**
 * Check if OTP is expired
 */
function isOtpExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

module.exports = { generateOtp, hashOtp, verifyOtp, getOtpExpiry, isOtpExpired };