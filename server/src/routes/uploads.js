const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticate, authorize } = require('../middleware/auth');
const { generateSignature, deleteImage } = require('../services/cloudinaryService');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const logger = require('../config/logger');

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many upload requests' }
});

// POST /api/uploads/sign — returns signed Cloudinary upload params
router.post('/sign', authenticate, uploadLimiter, async (req, res) => {
  try {
    const { folder, publicId } = req.body;

    // Validate folder access based on role
    const allowedFolders = {
      patient: ['patients/photos'],
      doctor: ['doctors/certificates'],
      admin: ['doctors/certificates', 'hospitals/logos', 'patients/photos']
    };

    const userFolders = allowedFolders[req.user.role] || [];
    if (!userFolders.includes(folder)) {
      return res.status(403).json({ error: 'You do not have permission to upload to this folder' });
    }

    const params = generateSignature(folder, publicId);
    res.json(params);
  } catch (error) {
    logger.error({ error: error.message }, 'Upload sign error');
    res.status(500).json({ error: 'Failed to generate upload signature' });
  }
});

// POST /api/uploads/doctors/:id/certificate — save Cloudinary url+publicId to doctor
router.post('/doctors/:id/certificate', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const { url, publicId } = req.body;
    if (!url || !publicId) {
      return res.status(400).json({ error: 'url and publicId required' });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { certificateUrl: url, certificatePublicId: publicId },
      { new: true }
    );

    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json({ message: 'Certificate saved', doctor: doctor.toJSON() });
  } catch (error) {
    logger.error({ error: error.message }, 'Save certificate error');
    res.status(500).json({ error: 'Failed to save certificate' });
  }
});

// POST /api/uploads/hospitals/:id/logo — save Cloudinary url+publicId to hospital
router.post('/hospitals/:id/logo', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { url, publicId } = req.body;
    if (!url || !publicId) {
      return res.status(400).json({ error: 'url and publicId required' });
    }

    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { logoUrl: url, logoPublicId: publicId },
      { new: true }
    );

    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    res.json({ message: 'Logo saved', hospital });
  } catch (error) {
    logger.error({ error: error.message }, 'Save logo error');
    res.status(500).json({ error: 'Failed to save logo' });
  }
});

// POST /api/uploads/patients/:id/photo — save Cloudinary url+publicId to patient
router.post('/patients/:id/photo', authenticate, authorize('patient'), async (req, res) => {
  try {
    const { url, publicId } = req.body;
    if (!url || !publicId) {
      return res.status(400).json({ error: 'url and publicId required' });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { profilePhotoUrl: url, profilePhotoPublicId: publicId },
      { new: true }
    );

    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json({ message: 'Photo saved', patient: patient.toJSON() });
  } catch (error) {
    logger.error({ error: error.message }, 'Save photo error');
    res.status(500).json({ error: 'Failed to save photo' });
  }
});

// DELETE /api/uploads/:publicId — delete from Cloudinary
router.delete('/:publicId', authenticate, async (req, res) => {
  try {
    const { publicId } = req.params;
    const success = await deleteImage(publicId);

    if (success) {
      res.json({ message: 'File deleted from Cloudinary' });
    } else {
      res.status(404).json({ error: 'File not found on Cloudinary' });
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Delete upload error');
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;