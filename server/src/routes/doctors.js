const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, doctorRegisterSchema } = require('../middleware/validate');
const logger = require('../config/logger');

// POST /api/doctors/register
router.post('/register', validate(doctorRegisterSchema), async (req, res) => {
  try {
    const data = req.validatedBody;
    
    const existing = await Doctor.findOne({ email: data.email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const doctor = new Doctor({
      name: data.name,
      specialization: data.specialization,
      hospitalId: data.hospitalId,
      registrationNumber: data.registrationNumber,
      email: data.email,
      mobile: data.mobile,
      passwordHash: data.password
    });

    await doctor.save();
    logger.info({ email: data.email, hospitalId: data.hospitalId }, 'Doctor registered');

    res.status(201).json({
      message: 'Doctor registered successfully. Awaiting admin approval.',
      doctor: doctor.toJSON()
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Doctor registration error');
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// GET /api/doctors/me
router.get('/me', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id).populate('hospitalId', 'name address');
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json({ doctor });
  } catch (error) {
    logger.error({ error: error.message }, 'Fetch doctor error');
    res.status(500).json({ error: 'Failed to fetch doctor' });
  }
});

module.exports = router;