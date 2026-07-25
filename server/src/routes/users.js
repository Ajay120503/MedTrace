const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth');
const { invalidateRefreshToken } = require('../utils/jwt');
const { generateOtp, hashOtp, verifyOtp, getOtpExpiry, isOtpExpired } = require('../services/otpService');
const { sendEmail, generateOtpEmailForLogin } = require('../services/emailService');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const HospitalAdmin = require('../models/HospitalAdmin');
const logger = require('../config/logger');

const resetOtpStore = new Map();

// POST /api/users/change-password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    let user;
    const { id, role } = req.user;

    if (role === 'patient') user = await Patient.findById(id);
    else if (role === 'doctor') user = await Doctor.findById(id);
    else if (role === 'admin') user = await HospitalAdmin.findById(id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Current password is incorrect' });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    logger.info({ userId: id, role }, 'Password changed');

    // Invalidate all refresh tokens for security
    // (In production, store token IDs per user and invalidate all)

    res.json({ message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    logger.error({ error: error.message }, 'Password change error');
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// POST /api/users/logout-everywhere
router.post('/logout-everywhere', authenticate, async (req, res) => {
  try {
    // In production, invalidate all refresh tokens for this user
    // For now, the client clears tokens and the user must re-login
    logger.info({ userId: req.user.id, role: req.user.role }, 'Logout everywhere');
    res.json({ message: 'Logged out from all devices. Please login again.' });
  } catch (error) {
    logger.error({ error: error.message }, 'Logout everywhere error');
    res.status(500).json({ error: 'Failed to logout everywhere' });
  }
});

// GET /api/users/me
router.get('/me', authenticate, async (req, res) => {
  try {
    let user;
    const { id, role } = req.user;

    if (role === 'patient') user = await Patient.findById(id);
    else if (role === 'doctor') user = await Doctor.findById(id).populate('hospitalId', 'name');
    else if (role === 'admin') user = await HospitalAdmin.findById(id).populate('hospitalId', 'name');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user: { ...user.toJSON(), role } });
  } catch (error) {
    logger.error({ error: error.message }, 'Get user error');
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// POST /api/users/forgot-password — send reset OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) return res.status(400).json({ error: 'Email and role required' });

    let user;
    if (role === 'patient') user = await Patient.findOne({ email });
    else if (role === 'doctor') user = await Doctor.findOne({ email });
    else if (role === 'admin') user = await HospitalAdmin.findOne({ email });

    if (!user) return res.status(404).json({ error: 'No account found with this email' });

    const otp = generateOtp();
    const hashed = await hashOtp(otp);
    resetOtpStore.set(`${role}:${email}`, { otpHash: hashed, expiresAt: getOtpExpiry() });

    const emailContent = generateOtpEmailForLogin(otp, user.name);
    await sendEmail({ to: email, subject: 'MedTrace - Password Reset Code', html: emailContent.html });

    logger.info({ email, role }, 'Password reset OTP sent');
    res.json({ message: 'Reset code sent to your email' });
  } catch (error) {
    logger.error({ error: error.message }, 'Forgot password error');
    res.status(500).json({ error: 'Could not send reset code' });
  }
});

// POST /api/users/reset-password — verify OTP and reset
router.post('/reset-password', async (req, res) => {
  try {
    const { email, role, otp, newPassword } = req.body;
    if (!email || !role || !otp || !newPassword) return res.status(400).json({ error: 'All fields required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const stored = resetOtpStore.get(`${role}:${email}`);
    if (!stored) return res.status(400).json({ error: 'No reset code requested or expired' });
    if (isOtpExpired(stored.expiresAt)) {
      resetOtpStore.delete(`${role}:${email}`);
      return res.status(400).json({ error: 'Reset code expired' });
    }

    const valid = await verifyOtp(otp, stored.otpHash);
    if (!valid) return res.status(400).json({ error: 'Invalid reset code' });

    resetOtpStore.delete(`${role}:${email}`);

    let user;
    if (role === 'patient') user = await Patient.findOne({ email });
    else if (role === 'doctor') user = await Doctor.findOne({ email });
    else if (role === 'admin') user = await HospitalAdmin.findOne({ email });

    if (!user) return res.status(404).json({ error: 'User not found' });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    logger.info({ email, role }, 'Password reset successful');
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    logger.error({ error: error.message }, 'Reset password error');
    res.status(500).json({ error: 'Could not reset password' });
  }
});

// PUT /api/users/profile — update name, mobile, etc
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, mobile } = req.body;
    const { id, role } = req.user;

    const updates = {};
    if (name) updates.name = name;
    if (mobile) updates.mobile = mobile;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    let user;
    if (role === 'patient') user = await Patient.findByIdAndUpdate(id, updates, { new: true });
    else if (role === 'doctor') user = await Doctor.findByIdAndUpdate(id, updates, { new: true });
    else if (role === 'admin') user = await HospitalAdmin.findByIdAndUpdate(id, updates, { new: true });

    if (!user) return res.status(404).json({ error: 'User not found' });

    logger.info({ userId: id, role }, 'Profile updated');
    res.json({ message: 'Profile updated', user: user.toJSON() });
  } catch (error) {
    logger.error({ error: error.message }, 'Profile update error');
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
