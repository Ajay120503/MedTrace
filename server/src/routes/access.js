const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const AccessSession = require('../models/AccessSession');
const AccessAuditLog = require('../models/AccessAuditLog');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, accessRequestSchema } = require('../middleware/validate');
const { generateOtp, hashOtp, verifyOtp, getOtpExpiry, isOtpExpired } = require('../services/otpService');
const { sendEmail, generateOtpEmail } = require('../services/emailService');
const { generateAccessToken } = require('../utils/jwt');
const { computeEntryHash } = require('../utils/hashChain');
const logger = require('../config/logger');

const accessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many access requests' }
});

// POST /api/access/request (doctor requests access to patient)
router.post('/request', authenticate, authorize('doctor'), accessLimiter, async (req, res) => {
  try {
    const { patientHealthId } = req.body;
    
    if (!patientHealthId || !/^\d{14}$/.test(patientHealthId)) {
      return res.status(400).json({ error: 'Valid 14-digit Health ID required' });
    }

    const patient = await Patient.findOne({ healthId: patientHealthId });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found with this Health ID' });
    }

    // Check doctor is approved
    const doctor = await Doctor.findById(req.user.id);
    if (!doctor || doctor.verificationStatus !== 'Approved') {
      return res.status(403).json({ error: 'Doctor not approved. Contact hospital admin.' });
    }

    // Generate OTP
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const otpExpiry = getOtpExpiry();

    // Create or update access session
    let session = await AccessSession.findOne({
      patientId: patient._id,
      doctorId: req.user.id,
      status: 'Pending'
    });

    if (session) {
      session.otpHash = otpHash;
      session.otpExpiresAt = otpExpiry;
    } else {
      session = new AccessSession({
        patientId: patient._id,
        doctorId: req.user.id,
        otpHash,
        otpExpiresAt: otpExpiry,
        status: 'Pending'
      });
    }

    await session.save();

    // Send OTP to patient email
    const emailContent = generateOtpEmail(otp, patient.name);
    await sendEmail({ to: patient.email, ...emailContent });

    logger.info({ patientId: patient._id, doctorId: req.user.id }, 'Access OTP sent');

    res.json({
      message: 'OTP sent to patient email',
      sessionId: session._id,
      patientName: patient.name
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Access request error');
    res.status(500).json({ error: 'Failed to request access' });
  }
});

// POST /api/access/verify-otp (verify OTP and issue access token)
router.post('/verify-otp', authenticate, authorize('doctor'), accessLimiter, async (req, res) => {
  try {
    const { sessionId, otp } = req.body;

    if (!sessionId || !otp) {
      return res.status(400).json({ error: 'Session ID and OTP required' });
    }

    const session = await AccessSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (session.status !== 'Pending') {
      return res.status(400).json({ error: 'Session already processed' });
    }

    if (isOtpExpired(session.otpExpiresAt)) {
      session.status = 'Expired';
      await session.save();
      return res.status(400).json({ error: 'OTP has expired. Request a new one.' });
    }

    const isValid = await verifyOtp(otp, session.otpHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Issue time-bound access token (1 hour)
    const accessToken = generateAccessToken({
      id: req.user.id,
      role: 'doctor',
      accessSessionId: session._id,
      patientId: session.patientId,
      type: 'patient-access'
    });

    session.accessToken = accessToken;
    session.accessTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    session.status = 'Active';
    await session.save();

    // Log to audit trail
    const lastAuditEntry = await AccessAuditLog.findOne({ patientId: session.patientId }).sort({ timestamp: -1 });
    const previousEntryHash = lastAuditEntry ? lastAuditEntry.currentEntryHash : '0'.repeat(64);

    const auditEntry = new AccessAuditLog({
      patientId: session.patientId,
      doctorId: req.user.id,
      hospitalId: req.user.hospitalId,
      accessType: 'Normal-OTP',
      fieldsAccessed: ['fullHistory'],
      previousEntryHash,
      currentEntryHash: computeEntryHash({
        previousEntryHash,
        patientId: session.patientId,
        doctorId: req.user.id,
        accessType: 'Normal-OTP',
        fieldsAccessed: ['fullHistory'],
        timestamp: new Date()
      })
    });

    await auditEntry.save();

    logger.info({ sessionId: session._id }, 'Access granted via OTP');

    res.json({
      message: 'Access granted',
      accessToken,
      expiresAt: session.accessTokenExpiresAt,
      patientId: session.patientId
    });
  } catch (error) {
    logger.error({ error: error.message }, 'OTP verification error');
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

module.exports = router;