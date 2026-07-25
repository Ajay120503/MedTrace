const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const HospitalAdmin = require('../models/HospitalAdmin');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, rotateRefreshToken, invalidateRefreshToken } = require('../utils/jwt');
const { generateOtp, hashOtp, verifyOtp, getOtpExpiry, isOtpExpired } = require('../services/otpService');
const { sendEmail, generateOtpEmailForLogin } = require('../services/emailService');
const { validate, loginSchema, verifyMfaSchema } = require('../middleware/validate');
const { checkLockout, recordFailedAttempt, resetAttempts } = require('../middleware/lockout');
const logger = require('../config/logger');

// Rate limiter for auth endpoints (higher in test/dev mode)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 10,
  message: { error: 'Too many login attempts, please try again later.' }
});

// In-memory OTP store for login MFA (in production use Redis)
const loginOtpStore = new Map();

// POST /api/auth/login
router.post('/login', checkLockout, authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password, role } = req.validatedBody;
    let user;

    if (role === 'patient') {
      user = await Patient.findOne({ email });
    } else if (role === 'doctor') {
      user = await Doctor.findOne({ email });
    } else if (role === 'admin') {
      user = await HospitalAdmin.findOne({ email }).populate('hospitalId');
    }

    if (!user) {
      recordFailedAttempt(email, role);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      recordFailedAttempt(email, role);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Reset lockout on successful password verification
    resetAttempts(email, role);

    // Generate and send OTP for MFA
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const otpExpiry = getOtpExpiry();

    loginOtpStore.set(`${role}:${email}`, { otpHash, otpExpiry, userId: user._id });

    // Send OTP email
    const emailContent = generateOtpEmailForLogin(otp, user.name);
    await sendEmail({ to: email, ...emailContent });

    logger.info({ email, role }, 'Login OTP sent');

    res.json({ message: 'OTP sent to email', email, role });
  } catch (error) {
    logger.error({ error: error.message }, 'Login error');
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/verify-mfa
router.post('/verify-mfa', authLimiter, validate(verifyMfaSchema), async (req, res) => {
  try {
    const { email, otp, role } = req.validatedBody;
    const stored = loginOtpStore.get(`${role}:${email}`);

    if (!stored) {
      return res.status(400).json({ error: 'No OTP requested or OTP expired' });
    }

    if (isOtpExpired(stored.otpExpiry)) {
      loginOtpStore.delete(`${role}:${email}`);
      return res.status(400).json({ error: 'OTP has expired' });
    }

    const isValidOtp = await verifyOtp(otp, stored.otpHash);
    if (!isValidOtp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP verified - clear from store
    loginOtpStore.delete(`${role}:${email}`);

    // Get user for token payload
    let user;
    let payload;

    if (role === 'patient') {
      user = await Patient.findById(stored.userId);
      payload = { id: user._id, role: 'patient', email: user.email };
    } else if (role === 'doctor') {
      user = await Doctor.findById(stored.userId);
      payload = { id: user._id, role: 'doctor', email: user.email, hospitalId: user.hospitalId };
    } else if (role === 'admin') {
      user = await HospitalAdmin.findById(stored.userId).populate('hospitalId');
      payload = { id: user._id, role: 'admin', email: user.email, hospitalId: user.hospitalId?._id };
    }

    const accessToken = generateAccessToken(payload);
    const { token: refreshToken, tokenId } = generateRefreshToken(payload);

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      tokenId,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
        ...(role === 'doctor' ? { verificationStatus: user.verificationStatus, hospitalId: user.hospitalId } : {}),
        ...(role === 'admin' ? { hospitalId: user.hospitalId } : {})
      }
    });
  } catch (error) {
    logger.error({ error: error.message }, 'MFA verification error');
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const result = rotateRefreshToken(decoded);

    if (!result) {
      return res.status(401).json({ error: 'Token reuse detected. Please login again.' });
    }

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      tokenId: result.tokenId
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Token refresh error');
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const { tokenId } = req.body;
    if (tokenId) {
      invalidateRefreshToken(tokenId);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error({ error: error.message }, 'Logout error');
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;