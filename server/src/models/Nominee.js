const mongoose = require('mongoose');

const nomineeSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', index: true, required: true },
  name: { type: String, required: true, trim: true },
  relation: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  status: { type: String, enum: ['Pending', 'Confirmed'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Nominee', nomineeSchema);