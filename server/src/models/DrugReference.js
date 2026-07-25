const mongoose = require('mongoose');

const drugReferenceSchema = new mongoose.Schema({
  drugName: { type: String, index: true, required: true },
  relatedDrugClass: { type: String },
  knownAllergyTriggers: [String],
  interactsWith: [String]
}, { timestamps: true });

module.exports = mongoose.model('DrugReference', drugReferenceSchema);