const mongoose = require('mongoose');

const accessAuditLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', index: true, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  accessType: { type: String, enum: ['Normal-OTP', 'Glass-Break'], required: true },
  fieldsAccessed: [String],
  timestamp: { type: Date, default: Date.now },
  previousEntryHash: { type: String, required: true },
  currentEntryHash: { type: String, required: true, unique: true },
  reviewFlag: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// Prevent updates/deletes
accessAuditLogSchema.pre('findOneAndUpdate', () => { throw new Error('Audit log is append-only'); });
accessAuditLogSchema.pre('deleteOne', () => { throw new Error('Audit log is append-only'); });
accessAuditLogSchema.pre('deleteMany', () => { throw new Error('Audit log is append-only'); });

module.exports = mongoose.model('AccessAuditLog', accessAuditLogSchema);