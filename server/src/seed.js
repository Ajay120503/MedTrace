require('dotenv').config();
const mongoose = require('mongoose');
const DrugReference = require('./models/DrugReference');
const Hospital = require('./models/Hospital');
const HospitalAdmin = require('./models/HospitalAdmin');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const { generateHealthId } = require('./utils/healthId');
const logger = require('./config/logger');

const drugData = [
  { drugName: 'Paracetamol', relatedDrugClass: 'Analgesic', knownAllergyTriggers: ['Paracetamol', 'Acetaminophen'], interactsWith: ['Warfarin', 'Carbamazepine'] },
  { drugName: 'Ibuprofen', relatedDrugClass: 'NSAID', knownAllergyTriggers: ['Ibuprofen', 'NSAID', 'Aspirin'], interactsWith: ['Warfarin', 'Aspirin', 'Methotrexate', 'Lithium'] },
  { drugName: 'Aspirin', relatedDrugClass: 'NSAID', knownAllergyTriggers: ['Aspirin', 'NSAID', 'Salicylate'], interactsWith: ['Warfarin', 'Ibuprofen', 'Methotrexate'] },
  { drugName: 'Amoxicillin', relatedDrugClass: 'Penicillin Antibiotic', knownAllergyTriggers: ['Penicillin', 'Amoxicillin', 'Cephalosporin'], interactsWith: ['Methotrexate', 'Warfarin'] },
  { drugName: 'Ciprofloxacin', relatedDrugClass: 'Fluoroquinolone Antibiotic', knownAllergyTriggers: ['Ciprofloxacin', 'Quinolone'], interactsWith: ['Warfarin', 'Theophylline', 'Tizanidine'] },
  { drugName: 'Metformin', relatedDrugClass: 'Biguanide', knownAllergyTriggers: ['Metformin'], interactsWith: ['Contrast Dye', 'Alcohol'] },
  { drugName: 'Atorvastatin', relatedDrugClass: 'Statin', knownAllergyTriggers: ['Atorvastatin', 'Statin'], interactsWith: ['Warfarin', 'Clarithromycin', 'Grapefruit'] },
  { drugName: 'Lisinopril', relatedDrugClass: 'ACE Inhibitor', knownAllergyTriggers: ['Lisinopril', 'ACE Inhibitor'], interactsWith: ['Potassium Supplements', 'Lithium', 'NSAID'] },
  { drugName: 'Omeprazole', relatedDrugClass: 'Proton Pump Inhibitor', knownAllergyTriggers: ['Omeprazole', 'PPI'], interactsWith: ['Clopidogrel', 'Methotrexate', 'Citalopram'] },
  { drugName: 'Warfarin', relatedDrugClass: 'Anticoagulant', knownAllergyTriggers: ['Warfarin'], interactsWith: ['Aspirin', 'Ibuprofen', 'Amoxicillin', 'Ciprofloxacin', 'Atorvastatin', 'Paracetamol'] },
  { drugName: 'Losartan', relatedDrugClass: 'ARB', knownAllergyTriggers: ['Losartan', 'ARB'], interactsWith: ['Lithium', 'Potassium Supplements', 'NSAID'] },
  { drugName: 'Amlodipine', relatedDrugClass: 'Calcium Channel Blocker', knownAllergyTriggers: ['Amlodipine'], interactsWith: ['Grapefruit', 'Simvastatin'] },
  { drugName: 'Metoprolol', relatedDrugClass: 'Beta Blocker', knownAllergyTriggers: ['Metoprolol', 'Beta Blocker'], interactsWith: ['Verapamil', 'Diltiazem', 'Insulin'] },
  { drugName: 'Prednisone', relatedDrugClass: 'Corticosteroid', knownAllergyTriggers: ['Prednisone', 'Corticosteroid'], interactsWith: ['Warfarin', 'Aspirin', 'Insulin'] },
  { drugName: 'Levothyroxine', relatedDrugClass: 'Thyroid Hormone', knownAllergyTriggers: ['Levothyroxine'], interactsWith: ['Warfarin', 'Metformin', 'Calcium'] },
  { drugName: 'Sertraline', relatedDrugClass: 'SSRI', knownAllergyTriggers: ['Sertraline', 'SSRI'], interactsWith: ['Warfarin', 'Aspirin', 'Ibuprofen', 'MAOI'] },
  { drugName: 'Albuterol', relatedDrugClass: 'Beta Agonist', knownAllergyTriggers: ['Albuterol'], interactsWith: ['Beta Blockers', 'Diuretics'] },
  { drugName: 'Furosemide', relatedDrugClass: 'Loop Diuretic', knownAllergyTriggers: ['Furosemide', 'Sulfa'], interactsWith: ['Lithium', 'Digoxin', 'NSAID'] },
  { drugName: 'Digoxin', relatedDrugClass: 'Cardiac Glycoside', knownAllergyTriggers: ['Digoxin'], interactsWith: ['Furosemide', 'Amiodarone', 'Verapamil'] },
  { drugName: 'Clopidogrel', relatedDrugClass: 'Antiplatelet', knownAllergyTriggers: ['Clopidogrel'], interactsWith: ['Omeprazole', 'Warfarin', 'Aspirin'] },
  { drugName: 'Gabapentin', relatedDrugClass: 'Anticonvulsant', knownAllergyTriggers: ['Gabapentin'], interactsWith: ['Opioids', 'Alcohol', 'Antacids'] },
  { drugName: 'Cetirizine', relatedDrugClass: 'Antihistamine', knownAllergyTriggers: ['Cetirizine', 'Antihistamine'], interactsWith: ['Alcohol', 'Sedatives'] },
  { drugName: 'Fluoxetine', relatedDrugClass: 'SSRI', knownAllergyTriggers: ['Fluoxetine', 'SSRI'], interactsWith: ['Warfarin', 'MAOI', 'Aspirin'] },
  { drugName: 'Diazepam', relatedDrugClass: 'Benzodiazepine', knownAllergyTriggers: ['Diazepam', 'Benzodiazepine'], interactsWith: ['Alcohol', 'Opioids', 'Sedatives'] },
  { drugName: 'Morphine', relatedDrugClass: 'Opioid', knownAllergyTriggers: ['Morphine', 'Opioid'], interactsWith: ['Alcohol', 'Diazepam', 'Gabapentin', 'MAOI'] },
  { drugName: 'Insulin', relatedDrugClass: 'Antidiabetic', knownAllergyTriggers: ['Insulin'], interactsWith: ['Metoprolol', 'Prednisone', 'Alcohol'] },
  { drugName: 'Ranitidine', relatedDrugClass: 'H2 Blocker', knownAllergyTriggers: ['Ranitidine'], interactsWith: ['Warfarin', 'Ketoconazole'] },
  { drugName: 'Azithromycin', relatedDrugClass: 'Macrolide Antibiotic', knownAllergyTriggers: ['Azithromycin', 'Macrolide'], interactsWith: ['Warfarin', 'Digoxin', 'Statins'] },
  { drugName: 'Doxycycline', relatedDrugClass: 'Tetracycline Antibiotic', knownAllergyTriggers: ['Doxycycline', 'Tetracycline'], interactsWith: ['Warfarin', 'Antacids', 'Iron'] },
  { drugName: 'Hydrochlorothiazide', relatedDrugClass: 'Thiazide Diuretic', knownAllergyTriggers: ['Hydrochlorothiazide', 'Sulfa'], interactsWith: ['Lithium', 'Digoxin', 'NSAID'] },
  { drugName: 'Simvastatin', relatedDrugClass: 'Statin', knownAllergyTriggers: ['Simvastatin', 'Statin'], interactsWith: ['Amlodipine', 'Warfarin', 'Grapefruit', 'Clarithromycin'] },
  { drugName: 'Allopurinol', relatedDrugClass: 'Xanthine Oxidase Inhibitor', knownAllergyTriggers: ['Allopurinol'], interactsWith: ['Warfarin', 'Azathioprine', 'Amoxicillin'] },
  { drugName: 'Pantoprazole', relatedDrugClass: 'Proton Pump Inhibitor', knownAllergyTriggers: ['Pantoprazole', 'PPI'], interactsWith: ['Clopidogrel', 'Methotrexate'] },
  { drugName: 'Tramadol', relatedDrugClass: 'Opioid Analgesic', knownAllergyTriggers: ['Tramadol', 'Opioid'], interactsWith: ['SSRI', 'MAOI', 'Alcohol', 'Diazepam'] },
  { drugName: 'Carvedilol', relatedDrugClass: 'Beta Blocker', knownAllergyTriggers: ['Carvedilol', 'Beta Blocker'], interactsWith: ['Insulin', 'Digoxin', 'Verapamil'] },
  { drugName: 'Spironolactone', relatedDrugClass: 'Potassium-Sparing Diuretic', knownAllergyTriggers: ['Spironolactone'], interactsWith: ['Potassium Supplements', 'Lisinopril', 'Losartan'] },
  { drugName: 'Risperidone', relatedDrugClass: 'Antipsychotic', knownAllergyTriggers: ['Risperidone'], interactsWith: ['Alcohol', 'Sedatives', 'SSRI'] },
  { drugName: 'Clarithromycin', relatedDrugClass: 'Macrolide Antibiotic', knownAllergyTriggers: ['Clarithromycin', 'Macrolide'], interactsWith: ['Simvastatin', 'Atorvastatin', 'Warfarin', 'Digoxin'] },
  { drugName: 'Methotrexate', relatedDrugClass: 'Antimetabolite', knownAllergyTriggers: ['Methotrexate'], interactsWith: ['Aspirin', 'Ibuprofen', 'Omeprazole', 'Amoxicillin'] },
  { drugName: 'Pregabalin', relatedDrugClass: 'Anticonvulsant', knownAllergyTriggers: ['Pregabalin'], interactsWith: ['Alcohol', 'Opioids', 'Gabapentin'] },
  { drugName: 'Escitalopram', relatedDrugClass: 'SSRI', knownAllergyTriggers: ['Escitalopram', 'SSRI'], interactsWith: ['Warfarin', 'MAOI', 'Aspirin', 'Ibuprofen'] },
  { drugName: 'Tamsulosin', relatedDrugClass: 'Alpha Blocker', knownAllergyTriggers: ['Tamsulosin'], interactsWith: ['Beta Blockers', 'Sildenafil', 'Verapamil'] },
  { drugName: 'Montelukast', relatedDrugClass: 'Leukotriene Receptor Antagonist', knownAllergyTriggers: ['Montelukast'], interactsWith: ['Aspirin', 'Ibuprofen'] },
  { drugName: 'Venlafaxine', relatedDrugClass: 'SNRI', knownAllergyTriggers: ['Venlafaxine', 'SNRI'], interactsWith: ['MAOI', 'Warfarin', 'Aspirin'] },
  { drugName: 'Bisoprolol', relatedDrugClass: 'Beta Blocker', knownAllergyTriggers: ['Bisoprolol', 'Beta Blocker'], interactsWith: ['Insulin', 'Verapamil', 'Diltiazem'] },
  { drugName: 'Naproxen', relatedDrugClass: 'NSAID', knownAllergyTriggers: ['Naproxen', 'NSAID', 'Aspirin'], interactsWith: ['Warfarin', 'Aspirin', 'Methotrexate', 'Lithium'] },
  { drugName: 'Codeine', relatedDrugClass: 'Opioid', knownAllergyTriggers: ['Codeine', 'Opioid'], interactsWith: ['Alcohol', 'Diazepam', 'SSRI', 'MAOI'] },
  { drugName: 'Diltiazem', relatedDrugClass: 'Calcium Channel Blocker', knownAllergyTriggers: ['Diltiazem'], interactsWith: ['Metoprolol', 'Bisoprolol', 'Simvastatin'] },
  { drugName: 'Fentanyl', relatedDrugClass: 'Opioid', knownAllergyTriggers: ['Fentanyl', 'Opioid'], interactsWith: ['Alcohol', 'Diazepam', 'MAOI', 'SSRI'] },
  { drugName: 'Ketorolac', relatedDrugClass: 'NSAID', knownAllergyTriggers: ['Ketorolac', 'NSAID', 'Aspirin'], interactsWith: ['Warfarin', 'Aspirin', 'Methotrexate', 'Lithium'] }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding');

    // Clear existing drug data
    await DrugReference.deleteMany({});
    logger.info('Cleared existing drug references');

    // Insert drug data
    const drugs = await DrugReference.insertMany(drugData);
    logger.info(`Seeded ${drugs.length} drug references`);

    // Create a default hospital if none exists
    let hospital = await Hospital.findOne({});
    if (!hospital) {
      hospital = await Hospital.create({
        name: 'MedTrace General Hospital',
        address: '123 Healthcare Avenue, Medical District',
        contact: '+91-9876543210'
      });
      logger.info(`Created default hospital: ${hospital.name}`);
    }

    // Create default admin if not exists
    const existingAdmin = await HospitalAdmin.findOne({ email: 'admin@medtrace.com' });
    if (!existingAdmin) {
      const admin = await HospitalAdmin.create({
        hospitalId: hospital._id,
        name: 'Admin User',
        email: 'admin@medtrace.com',
        passwordHash: 'admin123456'
      });
      logger.info(`Created default admin: ${admin.email}`);
    }

    // Create sample patient if not exists
    const existingPatient = await Patient.findOne({ email: 'patient@demo.com' });
    if (!existingPatient) {
      const patient = new Patient({
        healthId: generateHealthId(),
        name: 'Ravi Sharma',
        dob: new Date('1985-06-15'),
        gender: 'Male',
        mobile: '9876543210',
        email: 'patient@demo.com',
        bloodGroup: 'O+',
        passwordHash: 'patient123',
        allergies: ['Penicillin', 'Sulfa'],
        chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
        currentMedications: ['Metformin', 'Lisinopril'],
        emergencyContact: { name: 'Priya Sharma', relation: 'Spouse', mobile: '9876543211' }
      });
      await patient.save();
      logger.info(`Created sample patient: ${patient.email} (Health ID: ${patient.healthId})`);
    }

    // Create sample doctor if not exists
    const existingDoctor = await Doctor.findOne({ email: 'doctor@demo.com' });
    if (!existingDoctor) {
      const doctor = new Doctor({
        name: 'Dr. Ananya Patel',
        specialization: 'Cardiology',
        hospitalId: hospital._id,
        registrationNumber: 'MCI-2024-12345',
        email: 'doctor@demo.com',
        mobile: '9876543212',
        passwordHash: 'doctor123',
        verificationStatus: 'Approved'
      });
      await doctor.save();
      logger.info(`Created sample doctor: ${doctor.email}`);
    }

    logger.info('Seeding complete!');
    process.exit(0);
  } catch (error) {
    logger.error({ error: error.message }, 'Seeding failed');
    process.exit(1);
  }
}

seed();