const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const AccessAuditLog = require('../models/AccessAuditLog');
const { authenticate, authorize } = require('../middleware/auth');
const { verifyChain } = require('../utils/hashChain');
const logger = require('../config/logger');

// POST /api/admin/approve-doctor/:id
router.post('/approve-doctor/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Approved or Rejected' });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status },
      { new: true }
    ).populate('hospitalId', 'name');

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    logger.info({ doctorId: doctor._id, status }, 'Doctor verification updated');
    res.json({ message: `Doctor ${status.toLowerCase()}`, doctor });
  } catch (error) {
    logger.error({ error: error.message }, 'Doctor approval error');
    res.status(500).json({ error: 'Failed to update doctor status' });
  }
});

// GET /api/admin/doctors
router.get('/doctors', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.verificationStatus = status;

    const doctors = await Doctor.find(filter)
      .populate('hospitalId', 'name address')
      .sort({ createdAt: -1 });

    res.json({ doctors });
  } catch (error) {
    logger.error({ error: error.message }, 'Fetch doctors error');
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// GET /api/admin/audit/verify (full chain verification)
router.get('/audit/verify', authenticate, authorize('admin'), async (req, res) => {
  try {
    const entries = await AccessAuditLog.find({}).sort({ timestamp: 1 });
    const result = verifyChain(entries);

    res.json({
      ...result,
      totalEntries: entries.length,
      message: result.valid ? 'Chain is intact and verified' : 'Chain tampering detected!'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Audit verification error');
    res.status(500).json({ error: 'Failed to verify audit chain' });
  }
});

// GET /api/admin/dashboard/stats
router.get('/dashboard/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const pendingDoctors = await Doctor.countDocuments({ verificationStatus: 'Pending' });
    const totalDoctors = await Doctor.countDocuments({});
    const totalGlassBreak = await AccessAuditLog.countDocuments({ accessType: 'Glass-Break' });
    const flaggedEntries = await AccessAuditLog.countDocuments({ reviewFlag: true });
    const totalAccessEvents = await AccessAuditLog.countDocuments({});

    // Recent glass-break events
    const recentGlassBreak = await AccessAuditLog.find({ accessType: 'Glass-Break' })
      .populate('doctorId', 'name')
      .populate('patientId', 'name healthId')
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      pendingDoctors,
      totalDoctors,
      totalGlassBreak,
      flaggedEntries,
      totalAccessEvents,
      recentGlassBreak
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Dashboard stats error');
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;