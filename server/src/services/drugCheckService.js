/**
 * Drug Conflict Checker
 * Checks prescribed drugs against patient allergies and current medications
 */

function checkConflict(drugName, patient, drugReferences) {
  const ref = drugReferences.find(d => d.drugName.toLowerCase() === drugName.toLowerCase());
  if (!ref) return { found: false, allergyHit: false, interactionHit: false };

  const allergyHit = ref.knownAllergyTriggers.some(t =>
    patient.allergies.some(a => a.toLowerCase().includes(t.toLowerCase()))
  );

  const interactionHit = ref.interactsWith.some(d =>
    patient.currentMedications.some(m => m.toLowerCase().includes(d.toLowerCase()))
  );

  return { found: true, allergyHit, interactionHit, drugClass: ref.relatedDrugClass };
}

function checkMultipleConflicts(prescribedMedicines, patient, drugReferences) {
  const results = [];
  for (const drug of prescribedMedicines) {
    const result = checkConflict(drug, patient, drugReferences);
    if (result.found) {
      results.push({ drug, ...result });
    }
  }
  return results;
}

module.exports = { checkConflict, checkMultipleConflicts };