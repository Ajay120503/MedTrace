const mongoose = require('mongoose');

const accessSessionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', index: true, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  otpHash: { type: String },
  otpExpiresAt: { type: Date },
  accessToken: { type: String },
  accessTokenExpiresAt: { type: Date },
  accessType: { type: String, enum: ['Normal'], default: 'Normal' },
  status: { type: String, enum: ['Pending', 'Active', 'Expired'], default: 'Pending', index: true }
}, { timestamps: true });

module.exports = mongoose.model('AccessSession', accessSessionSchema);