/**
 * Account lockout middleware
 * 5 failed attempts → 15-minute lockout
 */

const loginAttempts = new Map();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function getLoginKey(email, role) {
  return `${role}:${email.toLowerCase()}`;
}

function checkLockout(req, res, next) {
  const { email, role } = req.body;
  if (!email || !role) return next();

  const key = getLoginKey(email, role);
  const record = loginAttempts.get(key);

  if (record && record.lockUntil && record.lockUntil > Date.now()) {
    const remaining = Math.ceil((record.lockUntil - Date.now()) / 1000 / 60);
    return res.status(429).json({
      error: `Account temporarily locked. Try again in ${remaining} minute(s).`
    });
  }

  // Reset if lockout expired
  if (record && record.lockUntil && record.lockUntil <= Date.now()) {
    loginAttempts.delete(key);
  }

  next();
}

function recordFailedAttempt(email, role) {
  const key = getLoginKey(email, role);
  const record = loginAttempts.get(key) || { attempts: 0 };
  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockUntil = Date.now() + LOCKOUT_DURATION;
    record.attempts = 0;
  }

  loginAttempts.set(key, record);
}

function resetAttempts(email, role) {
  const key = getLoginKey(email, role);
  loginAttempts.delete(key);
}

module.exports = { checkLockout, recordFailedAttempt, resetAttempts };