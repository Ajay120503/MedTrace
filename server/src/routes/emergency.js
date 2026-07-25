const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Nominee = require('../models/Nominee');
const AccessAuditLog = require('../models/AccessAuditLog');
const { authenticate, authorize } = require('../middleware/auth');
const { computeEntryHash } = require('../utils/hashChain');
const { sendEmail, generateGlassBreakEmail } = require('../services/emailService');
const logger = require('../config/logger');

const emergencyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many emergency access attempts' }
});

// POST /api/emergency/lookup (identity-based patient search)
router.post('/lookup', authenticate, authorize('doctor'), emergencyLimiter, async (req, res) => {
  try {
    const { patientHealthId, patientEmail, patientMobile } = req.body;

    let patient = null;
    if (patientHealthId) {
      patient = await Patient.findOne({ healthId: patientHealthId });
    } else if (patientEmail) {
      patient = await Patient.findOne({ email: patientEmail });
    } else if (patientMobile) {
      patient = await Patient.findOne({ mobile: patientMobile });
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found with provided information' });
    }

    // Return minimal info for confirmation
    res.json({
      patientFound: true,
      patientId: patient._id,
      name: patient.name,
      bloodGroup: patient.bloodGroup,
      message: 'Patient identified. Proceed with Glass-Break protocol.'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Emergency lookup error');
    res.status(500).json({ error: 'Lookup failed' });
  }
});

// POST /api/emergency/breakglass/:patientId
router.post('/breakglass/:patientId', authenticate, authorize('doctor'), emergencyLimiter, async (req, res) => {
  try {
    const patientId = req.params.patientId;

    // Gate 1: Doctor must be approved
    const doctor = await Doctor.findById(req.user.id);
    if (!doctor || doctor.verificationStatus !== 'Approved') {
      return res.status(403).json({ error: 'Only approved doctors can use emergency access' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Gate 2: Explicit two-step confirmation (must be sent from frontend)
    const { confirmed } = req.body;
    if (!confirmed) {
      return res.status(400).json({
        error: 'Explicit confirmation required',
        message: 'This will trigger an emergency alert to the patient\'s nominees and will be logged.'
      });
    }

    // Gate 3: Minimum necessary fields only (including photo for identity verification)
    const minimumNecessaryFields = {
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      currentMedications: patient.currentMedications,
      chronicConditions: patient.chronicConditions,
      emergencyContact: patient.emergencyContact,
      profilePhotoUrl: patient.profilePhotoUrl || undefined
    };

    // Gate 4: Notify nominees or set review flag
    const confirmedNominees = await Nominee.find({ patientId, status: 'Confirmed' });
    const hospital = doctor.hospitalId ? { name: 'Hospital' } : { name: 'Unknown' };

    if (confirmedNominees.length > 0) {
      for (const nominee of confirmedNominees) {
        try {
          const emailContent = generateGlassBreakEmail(
            patient.name,
            nominee.name,
            doctor.name,
            hospital.name
          );
          await sendEmail({ to: nominee.email, ...emailContent });
          logger.info({ nomineeId: nominee._id }, 'Glass-Break nominee notified');
        } catch (emailErr) {
          logger.error({ error: emailErr.message, nomineeId: nominee._id }, 'Failed to notify nominee');
        }
      }
    } else {
      // No confirmed nominees - set review flag for admin
      logger.warn({ patientId }, 'Glass-Break: No confirmed nominees, setting review flag');
    }

    // Write audit log entry
    const lastAuditEntry = await AccessAuditLog.findOne({ patientId }).sort({ timestamp: -1 });
    const previousEntryHash = lastAuditEntry ? lastAuditEntry.currentEntryHash : '0'.repeat(64);
    const fieldsAccessed = ['bloodGroup', 'allergies', 'currentMedications', 'chronicConditions', 'emergencyContact'];

    const auditEntry = new AccessAuditLog({
      patientId,
      doctorId: req.user.id,
      hospitalId: req.user.hospitalId,
      accessType: 'Glass-Break',
      fieldsAccessed,
      previousEntryHash,
      currentEntryHash: computeEntryHash({
        previousEntryHash,
        patientId,
        doctorId: req.user.id,
        accessType: 'Glass-Break',
        fieldsAccessed,
        timestamp: new Date()
      }),
      reviewFlag: confirmedNominees.length === 0
    });

    await auditEntry.save();

    // Emit socket event for admin dashboard
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('glass-break-alert', {
        patientId,
        patientName: patient.name,
        doctorName: doctor.name,
        timestamp: new Date(),
        needsReview: confirmedNominees.length === 0
      });
    }

    logger.info({ patientId, doctorId: req.user.id }, 'Glass-Break access granted');

    res.json({
      message: 'Emergency access granted. Nominees have been notified.',
      data: minimumNecessaryFields,
      auditEntryId: auditEntry._id,
      nomineesNotified: confirmedNominees.length,
      needsReview: confirmedNominees.length === 0
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Glass-Break error');
    res.status(500).json({ error: 'Emergency access failed' });
  }
});

// GET /api/emergency/summary/:patientId
router.get('/summary/:patientId', authenticate, async (req, res) => {
  try {
    const patientId = req.params.patientId;

    // Only doctor with active glass-break or patient themselves can view
    if (req.user.role === 'doctor') {
      const recentEntry = await AccessAuditLog.findOne({
        patientId,
        doctorId: req.user.id,
        accessType: 'Glass-Break',
        timestamp: { $gt: new Date(Date.now() - 60 * 60 * 1000) }
      }).sort({ timestamp: -1 });

      if (!recentEntry) {
        return res.status(403).json({ error: 'No recent emergency access session' });
      }
    } else if (req.user.role !== 'patient' || req.user.id !== patientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({
      patientId,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      currentMedications: patient.currentMedications,
      chronicConditions: patient.chronicConditions,
      emergencyContact: patient.emergencyContact,
      profilePhotoUrl: patient.profilePhotoUrl || undefined
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Emergency summary error');
    res.status(500).json({ error: 'Failed to fetch emergency summary' });
  }
});

module.exports = router;