const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const patientSchema = new mongoose.Schema({
  healthId: { type: String, unique: true, index: true, required: true },
  name: { type: String, required: true, trim: true },
  dob: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  mobile: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: true },
  passwordHash: { type: String, required: true },
  allergies: [String],
  chronicConditions: [String],
  currentMedications: [String],
  emergencyContact: {
    name: String,
    relation: String,
    mobile: String
  },
  profilePhotoUrl: { type: String },
  profilePhotoPublicId: { type: String },
  mfaEnabled: { type: Boolean, default: true }
}, { timestamps: true });

patientSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

patientSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

patientSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('Patient', patientSchema);