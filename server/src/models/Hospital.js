const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true },
  contact: { type: String, required: true },
  logoUrl: { type: String },
  logoPublicId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Hospital', hospitalSchema);