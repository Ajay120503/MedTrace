const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const HospitalAdmin = require('../models/HospitalAdmin');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, hospitalRegisterSchema } = require('../middleware/validate');
const logger = require('../config/logger');

// POST /api/hospitals/register
router.post('/register', validate(hospitalRegisterSchema), async (req, res) => {
  try {
    const data = req.validatedBody;
    
    const hospital = new Hospital({
      name: data.name,
      address: data.address,
      contact: data.contact
    });

    await hospital.save();
    logger.info({ hospitalId: hospital._id }, 'Hospital registered');

    res.status(201).json({
      message: 'Hospital registered successfully',
      hospital
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Hospital registration error');
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/hospitals/admin/register
router.post('/admin/register', async (req, res) => {
  try {
    const { name, email, password, hospitalId } = req.body;

    if (!name || !email || !password || !hospitalId) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existing = await HospitalAdmin.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    const admin = new HospitalAdmin({
      hospitalId,
      name,
      email,
      passwordHash: password
    });

    await admin.save();
    logger.info({ email, hospitalId }, 'Hospital admin registered');

    res.status(201).json({
      message: 'Admin registered successfully',
      admin: admin.toJSON()
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Admin registration error');
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// GET /api/hospitals
router.get('/', async (req, res) => {
  try {
    const hospitals = await Hospital.find({});
    res.json({ hospitals });
  } catch (error) {
    logger.error({ error: error.message }, 'Fetch hospitals error');
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
});

// GET /api/hospitals/:id
router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    res.json({ hospital });
  } catch (error) {
    logger.error({ error: error.message }, 'Fetch hospital error');
    res.status(500).json({ error: 'Failed to fetch hospital' });
  }
});

module.exports = router;