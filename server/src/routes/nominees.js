const express = require('express');
const router = express.Router();
const Nominee = require('../models/Nominee');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, nomineeSchema } = require('../middleware/validate');
const logger = require('../config/logger');

// POST /api/nominees (patient adds nominee)
router.post('/', authenticate, authorize('patient'), validate(nomineeSchema), async (req, res) => {
  try {
    const data = req.validatedBody;
    
    const nominee = new Nominee({
      patientId: req.user.id,
      name: data.name,
      relation: data.relation,
      mobile: data.mobile,
      email: data.email
    });

    await nominee.save();
    logger.info({ nomineeId: nominee._id, patientId: req.user.id }, 'Nominee added');

    res.status(201).json({ message: 'Nominee added', nominee });
  } catch (error) {
    logger.error({ error: error.message }, 'Add nominee error');
    res.status(500).json({ error: 'Failed to add nominee' });
  }
});

// POST /api/nominees/:id/confirm
router.post('/:id/confirm', authenticate, authorize('patient'), async (req, res) => {
  try {
    const nominee = await Nominee.findOneAndUpdate(
      { _id: req.params.id, patientId: req.user.id },
      { status: 'Confirmed' },
      { new: true }
    );

    if (!nominee) {
      return res.status(404).json({ error: 'Nominee not found' });
    }

    logger.info({ nomineeId: nominee._id }, 'Nominee confirmed');
    res.json({ message: 'Nominee confirmed', nominee });
  } catch (error) {
    logger.error({ error: error.message }, 'Confirm nominee error');
    res.status(500).json({ error: 'Failed to confirm nominee' });
  }
});

// GET /api/nominees (patient's nominees)
router.get('/', authenticate, authorize('patient'), async (req, res) => {
  try {
    const nominees = await Nominee.find({ patientId: req.user.id });
    res.json({ nominees });
  } catch (error) {
    logger.error({ error: error.message }, 'Fetch nominees error');
    res.status(500).json({ error: 'Failed to fetch nominees' });
  }
});

module.exports = router;