const { z } = require('zod');
const logger = require('../config/logger');

/**
 * Middleware that validates request body against a zod schema
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.validatedBody = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        logger.warn({ errors: err.errors }, 'Validation error');
        return res.status(400).json({
          error: 'Validation failed',
          details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      next(err);
    }
  };
}

// Schemas
const patientRegisterSchema = z.object({
  name: z.string().min(2).max(100),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  gender: z.enum(['Male', 'Female', 'Other']),
  mobile: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
  email: z.string().email(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    relation: z.string().optional(),
    mobile: z.string().optional()
  }).optional()
});

const doctorRegisterSchema = z.object({
  name: z.string().min(2).max(100),
  specialization: z.string().min(2),
  hospitalId: z.string(),
  registrationNumber: z.string().min(3),
  email: z.string().email(),
  mobile: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
  password: z.string().min(8)
});

const hospitalRegisterSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  contact: z.string().min(5)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(['patient', 'doctor', 'admin'])
});

const verifyMfaSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  role: z.enum(['patient', 'doctor', 'admin'])
});

const accessRequestSchema = z.object({
  patientHealthId: z.string().regex(/^\d{14}$/, 'Health ID must be 14 digits'),
  otp: z.string().length(6).optional()
});

const nomineeSchema = z.object({
  name: z.string().min(2),
  relation: z.string().min(2),
  mobile: z.string().regex(/^\d{10}$/),
  email: z.string().email()
});

const emergencyLookupSchema = z.object({
  patientHealthId: z.string().optional(),
  patientEmail: z.string().email().optional(),
  patientMobile: z.string().regex(/^\d{10}$/).optional()
});

const medicalEntrySchema = z.object({
  diagnosis: z.string().min(2),
  prescribedMedicines: z.array(z.string()).optional(),
  notes: z.string().optional(),
  drugConflictConfirmed: z.boolean().optional(),
  drugConflictNotes: z.string().optional()
});

const drugCheckSchema = z.object({
  drugName: z.string().min(1),
  patientId: z.string()
});

module.exports = {
  validate,
  patientRegisterSchema,
  doctorRegisterSchema,
  hospitalRegisterSchema,
  loginSchema,
  verifyMfaSchema,
  accessRequestSchema,
  nomineeSchema,
  emergencyLookupSchema,
  medicalEntrySchema,
  drugCheckSchema
};