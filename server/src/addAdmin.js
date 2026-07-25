require('dotenv').config();
const mongoose = require('mongoose');
const HospitalAdmin = require('./models/HospitalAdmin');
const Hospital = require('./models/Hospital');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const hospital = await Hospital.findOne({});
  if (!hospital) { console.log('No hospital found'); process.exit(1); }

  let admin = await HospitalAdmin.findOne({ email: 'ajaykandhare12@gmail.com' });
  if (admin) {
    admin.passwordHash = 'ajay@#1205';
    await admin.save();
    console.log('Admin password updated');
  } else {
    admin = await HospitalAdmin.create({
      hospitalId: hospital._id,
      name: 'Ajay Kandhare',
      email: 'ajaykandhare12@gmail.com',
      passwordHash: 'ajay@#1205'
    });
    console.log('Admin created: ajaykandhare12@gmail.com');
  }
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });