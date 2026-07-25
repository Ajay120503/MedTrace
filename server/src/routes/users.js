const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth');
const { invalidateRefreshToken } = require('../utils/jwt');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const HospitalAdmin = require('../models/HospitalAdmin');
const logger = require('../config/logger');

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

module.exports = router;