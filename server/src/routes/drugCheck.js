const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const DrugReference = require('../models/DrugReference');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, drugCheckSchema } = require('../middleware/validate');
const { checkConflict } = require('../services/drugCheckService');
const logger = require('../config/logger');

// POST /api/drug-check
router.post('/', authenticate, authorize('doctor'), validate(drugCheckSchema), async (req, res) => {
  try {
    const { drugName, patientId } = req.validatedBody;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const drugRefs = await DrugReference.find({});
    const result = checkConflict(drugName, patient, drugRefs);

    res.json({
      drug: drugName,
      ...result,
      patientAllergies: patient.allergies,
      patientMedications: patient.currentMedications
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Drug check error');
    res.status(500).json({ error: 'Drug check failed' });
  }
});

// GET /api/drug-check/reference (list all drug references)
router.get('/reference', authenticate, async (req, res) => {
  try {
    const drugs = await DrugReference.find({}).sort({ drugName: 1 });
    res.json({ drugs });
  } catch (error) {
    logger.error({ error: error.message }, 'Fetch drug reference error');
    res.status(500).json({ error: 'Failed to fetch drug reference' });
  }
});

module.exports = router;