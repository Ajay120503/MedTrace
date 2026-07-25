const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const MedicalHistoryEntry = require('../models/MedicalHistoryEntry');
const AccessAuditLog = require('../models/AccessAuditLog');
const AccessSession = require('../models/AccessSession');
const DrugReference = require('../models/DrugReference');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, patientRegisterSchema, medicalEntrySchema } = require('../middleware/validate');
const { generateHealthId } = require('../utils/healthId');
const { computeEntryHash } = require('../utils/hashChain');
const { checkConflict } = require('../services/drugCheckService');
const logger = require('../config/logger');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

// POST /api/patients/register
router.post('/register', validate(patientRegisterSchema), async (req, res) => {
  try {
    const data = req.validatedBody;
    
    // Check if email already exists
    const existing = await Patient.findOne({ email: data.email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Generate unique health ID
    let healthId;
    let isUnique = false;
    while (!isUnique) {
      healthId = generateHealthId();
      const exists = await Patient.findOne({ healthId });
      if (!exists) isUnique = true;
    }

    const patient = new Patient({
      healthId,
      name: data.name,
      dob: new Date(data.dob),
      gender: data.gender,
      mobile: data.mobile,
      email: data.email,
      bloodGroup: data.bloodGroup,
      passwordHash: data.password,
      allergies: data.allergies || [],
      chronicConditions: data.chronicConditions || [],
      currentMedications: data.currentMedications || [],
      emergencyContact: data.emergencyContact || {}
    });

    await patient.save();
    logger.info({ healthId, email: data.email }, 'Patient registered');

    res.status(201).json({
      message: 'Patient registered successfully',
      patient: patient.toJSON()
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Patient registration error');
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// GET /api/patients/:id/history (requires active access token or own patient)
router.get('/:id/history', authenticate, async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Check authorization: must be the patient themselves or a doctor with active access
    if (req.user.role === 'patient' && req.user.id !== patientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'doctor') {
      const session = await AccessSession.findOne({
        patientId,
        doctorId: req.user.id,
        status: 'Active',
        accessTokenExpiresAt: { $gt: new Date() }
      });
      if (!session) {
        return res.status(403).json({ error: 'No active access session' });
      }
    }

    const entries = await MedicalHistoryEntry.find({ patientId })
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name')
      .sort({ visitDate: -1 });

    res.json({ entries });
  } catch (error) {
    logger.error({ error: error.message }, 'Fetch history error');
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// POST /api/patients/:id/history (doctor appends entry)
router.post('/:id/history', authenticate, authorize('doctor'), validate(medicalEntrySchema), async (req, res) => {
  try {
    const patientId = req.params.id;
    const data = req.validatedBody;

    // Check active access session
    const session = await AccessSession.findOne({
      patientId,
      doctorId: req.user.id,
      status: 'Active',
      accessTokenExpiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(403).json({ error: 'No active access session' });
    }

    // Run drug conflict check for each prescribed medicine
    const patient = await Patient.findById(patientId);
    const drugRefs = await DrugReference.find({});
    let conflicts = [];

    for (const medicine of (data.prescribedMedicines || [])) {
      const result = checkConflict(medicine, patient, drugRefs);
      if (result.found && (result.allergyHit || result.interactionHit)) {
        conflicts.push({ drug: medicine, ...result });
      }
    }

    // If conflicts found and not confirmed, return warning
    if (conflicts.length > 0 && !data.drugConflictConfirmed) {
      return res.status(409).json({
        error: 'Drug conflicts detected',
        conflicts,
        requiresConfirmation: true
      });
    }

    const entry = new MedicalHistoryEntry({
      patientId,
      doctorId: req.user.id,
      hospitalId: req.user.hospitalId,
      diagnosis: data.diagnosis,
      prescribedMedicines: data.prescribedMedicines || [],
      notes: data.notes,
      drugConflictConfirmed: data.drugConflictConfirmed || false,
      drugConflictNotes: data.drugConflictNotes || ''
    });

    await entry.save();

    // Log to audit trail
    const lastAuditEntry = await AccessAuditLog.findOne({ patientId }).sort({ timestamp: -1 });
    const previousEntryHash = lastAuditEntry ? lastAuditEntry.currentEntryHash : '0'.repeat(64);

    const auditEntry = new AccessAuditLog({
      patientId,
      doctorId: req.user.id,
      hospitalId: req.user.hospitalId,
      accessType: 'Normal-OTP',
      fieldsAccessed: ['medicalHistory'],
      previousEntryHash,
      currentEntryHash: computeEntryHash({
        previousEntryHash,
        patientId,
        doctorId: req.user.id,
        accessType: 'Normal-OTP',
        fieldsAccessed: ['medicalHistory'],
        timestamp: new Date()
      })
    });

    await auditEntry.save();

    logger.info({ patientId, doctorId: req.user.id }, 'Medical history entry added');
    res.status(201).json({ message: 'Entry added', entry, conflicts });
  } catch (error) {
    logger.error({ error: error.message }, 'Add history entry error');
    res.status(500).json({ error: 'Failed to add entry' });
  }
});

// GET /api/patients/:id/access-log
router.get('/:id/access-log', authenticate, async (req, res) => {
  try {
    const patientId = req.params.id;
    
    if (req.user.role === 'patient' && req.user.id !== patientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const logs = await AccessAuditLog.find({ patientId })
      .populate('doctorId', 'name')
      .populate('hospitalId', 'name')
      .sort({ timestamp: -1 });

    res.json({ logs });
  } catch (error) {
    logger.error({ error: error.message }, 'Fetch access log error');
    res.status(500).json({ error: 'Failed to fetch access log' });
  }
});

// GET /api/patients/:id/qr
router.get('/:id/qr', authenticate, async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const qrData = JSON.stringify({
      healthId: patient.healthId,
      name: patient.name
    });

    const qrCode = await QRCode.toDataURL(qrData);
    res.json({ qrCode, healthId: patient.healthId });
  } catch (error) {
    logger.error({ error: error.message }, 'QR generation error');
    res.status(500).json({ error: 'Failed to generate QR' });
  }
});

// GET /api/patients/:id/export-pdf
router.get('/:id/export-pdf', authenticate, async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const entries = await MedicalHistoryEntry.find({ patientId })
      .populate('doctorId', 'name')
      .populate('hospitalId', 'name')
      .sort({ visitDate: -1 });

    const accessLogs = await AccessAuditLog.find({ patientId })
      .populate('doctorId', 'name')
      .sort({ timestamp: -1 });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=medtrace-${patient.healthId}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('MedTrace', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Medical History Report', { align: 'center' });
    doc.moveDown();

    // Patient Info
    doc.fontSize(14).font('Helvetica-Bold').text('Patient Information');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${patient.name}`);
    doc.text(`Health ID: ${patient.healthId}`);
    doc.text(`Blood Group: ${patient.bloodGroup}`);
    doc.text(`DOB: ${patient.dob.toISOString().split('T')[0]}`);
    doc.text(`Email: ${patient.email}`);
    doc.text(`Allergies: ${patient.allergies.join(', ') || 'None'}`);
    doc.text(`Chronic Conditions: ${patient.chronicConditions.join(', ') || 'None'}`);
    doc.text(`Current Medications: ${patient.currentMedications.join(', ') || 'None'}`);
    doc.moveDown();

    // Medical History
    doc.fontSize(14).font('Helvetica-Bold').text('Medical History');
    doc.moveDown(0.5);

    for (const entry of entries) {
      doc.fontSize(11).font('Helvetica-Bold').text(`Visit: ${entry.visitDate.toISOString().split('T')[0]}`);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Doctor: ${entry.doctorId?.name || 'Unknown'}`);
      doc.text(`Diagnosis: ${entry.diagnosis}`);
      if (entry.prescribedMedicines?.length) {
        doc.text(`Prescribed: ${entry.prescribedMedicines.join(', ')}`);
      }
      if (entry.notes) doc.text(`Notes: ${entry.notes}`);
      doc.moveDown(0.5);
    }

    // Access Log
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('Access Log (Who Viewed My Data)');
    doc.moveDown(0.5);

    for (const log of accessLogs) {
      doc.fontSize(10).font('Helvetica');
      doc.text(`${log.timestamp.toISOString()} - ${log.accessType} by ${log.doctorId?.name || 'Unknown'}`);
    }

    doc.end();
  } catch (error) {
    logger.error({ error: error.message }, 'PDF export error');
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

module.exports = router;