const mongoose = require('mongoose');

const medicalHistoryEntrySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', index: true, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  diagnosis: { type: String, required: true },
  prescribedMedicines: [String],
  notes: { type: String },
  visitDate: { type: Date, default: Date.now },
  drugConflictConfirmed: { type: Boolean, default: false },
  drugConflictNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('MedicalHistoryEntry', medicalHistoryEntrySchema);