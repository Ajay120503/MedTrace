const { computeEntryHash, verifyChain } = require('../utils/hashChain');
const { generateHealthId, isValidHealthId } = require('../utils/healthId');
const { checkConflict, checkMultipleConflicts } = require('../services/drugCheckService');
const jwt = require('../utils/jwt');
const otp = require('../services/otpService');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  [✓] ${message}`);
  } else {
    failed++;
    console.log(`  [✗] ${message}`);
  }
}

test('core utility checks pass', () => {
// ── Hash Chain Tests ──
console.log('\n═══ Hash Chain ═══');
const hash = computeEntryHash({
  previousEntryHash: '0'.repeat(64),
  patientId: 'p1', doctorId: 'd1',
  accessType: 'Normal-OTP',
  fieldsAccessed: ['history'],
  timestamp: new Date()
});
assert(hash.length === 64, 'Hash should be 64 hex chars');
assert(/^[a-f0-9]{64}$/.test(hash), 'Hash should be lowercase hex');

const entries = [{
  _id: '1', patientId: 'p1', doctorId: 'd1',
  accessType: 'Normal-OTP', fieldsAccessed: ['history'],
  timestamp: new Date(),
  previousEntryHash: '0'.repeat(64),
  currentEntryHash: ''
}];
entries[0].currentEntryHash = computeEntryHash(entries[0]);
let result = verifyChain(entries);
assert(result.valid === true, 'Valid chain should pass');

entries[0].fieldsAccessed = ['tampered'];
result = verifyChain(entries);
assert(result.valid === false, 'Tampered chain should fail');
assert(result.breakAtEntryId === '1', 'Should report break point');

result = verifyChain([]);
assert(result.valid === true, 'Empty chain should be valid');

// ── Health ID Tests ──
console.log('\n═══ Health ID ═══');
const id = generateHealthId();
assert(id.length === 14, 'Health ID should be 14 digits');
assert(/^\d{14}$/.test(id), 'Health ID should be numeric only');
assert(isValidHealthId(id), 'Generated ID should pass Luhn check');
assert(!isValidHealthId('12345678901234'), 'Random 14-digit should fail Luhn');
assert(!isValidHealthId(''), 'Empty string should fail');
assert(!isValidHealthId('abc'), 'Non-numeric should fail');
assert(!isValidHealthId('123456789012345'), '15 digits should fail');

const ids = new Set();
for (let i = 0; i < 100; i++) ids.add(generateHealthId());
assert(ids.size === 100, 'All 100 generated IDs should be unique');

// ── Drug Check Tests ──
console.log('\n═══ Drug Conflict Checker ═══');
const patient = { allergies: ['Penicillin'], currentMedications: ['Warfarin'] };
const drugRefs = [
  { drugName: 'Amoxicillin', knownAllergyTriggers: ['Penicillin'], interactsWith: ['Warfarin'] },
  { drugName: 'Paracetamol', knownAllergyTriggers: [], interactsWith: [] }
];

const r1 = checkConflict('Amoxicillin', patient, drugRefs);
assert(r1.found === true, 'Amoxicillin should be found');
assert(r1.allergyHit === true, 'Should detect penicillin allergy');
assert(r1.interactionHit === true, 'Should detect warfarin interaction');

const r2 = checkConflict('Paracetamol', patient, drugRefs);
assert(r2.found === true, 'Paracetamol should be found');
assert(r2.allergyHit === false, 'No allergy for paracetamol');
assert(r2.interactionHit === false, 'No interaction for paracetamol');

const r3 = checkConflict('UnknownDrug', patient, drugRefs);
assert(r3.found === false, 'Unknown drug should not be found');

const r4 = checkConflict('amoxicillin', patient, drugRefs);
assert(r4.found === true, 'Should match case-insensitive');

const results = checkMultipleConflicts(['Amoxicillin', 'Paracetamol', 'Ibuprofen'], patient, drugRefs);
assert(results.length === 2, 'Should find 2 conflicts out of 3 drugs');

// ── JWT Tests ──
console.log('\n═══ JWT Utilities ═══');
const payload = { id: 'test123', role: 'doctor', hospitalId: 'hosp1' };

const accessToken = jwt.generateAccessToken(payload);
assert(typeof accessToken === 'string', 'Access token should be string');
assert(accessToken.split('.').length === 3, 'Access token should be valid JWT');

const decoded = jwt.verifyAccessToken(accessToken);
assert(decoded.id === 'test123', 'Should contain id');
assert(decoded.role === 'doctor', 'Should contain role');
assert(decoded.hospitalId === 'hosp1', 'Should contain hospitalId');

const { token: refreshToken, tokenId } = jwt.generateRefreshToken(payload);
assert(typeof refreshToken === 'string', 'Refresh token should be string');
assert(typeof tokenId === 'string', 'Token ID should be string');

const decodedRefresh = jwt.verifyRefreshToken(refreshToken);
assert(decodedRefresh.id === 'test123', 'Refresh should contain id');
assert(decodedRefresh.tokenId === tokenId, 'Should contain tokenId');

const rotated = jwt.rotateRefreshToken(decodedRefresh);
assert(rotated !== null, 'Rotation should succeed');
assert(rotated.accessToken !== accessToken, 'New access token should differ');
assert(rotated.refreshToken !== refreshToken, 'New refresh token should differ');

const reuse = jwt.rotateRefreshToken(decodedRefresh);
assert(reuse === null, 'Token reuse should return null');

// ── OTP Tests ──
console.log('\n═══ OTP Utilities ═══');
const otpCode = otp.generateOtp();
assert(/^\d{6}$/.test(otpCode), 'OTP should be 6 digits');

const otps = new Set();
for (let i = 0; i < 100; i++) otps.add(otp.generateOtp());
assert(otps.size > 90, 'Most OTPs should be unique');

const expiry = otp.getOtpExpiry();
assert(expiry > new Date(), 'Expiry should be in the future');
assert(expiry.getTime() - Date.now() > 9 * 60 * 1000, 'Expiry should be ~10 min');

assert(otp.isOtpExpired(new Date(0)) === true, 'Past date should be expired');
assert(otp.isOtpExpired(new Date(Date.now() + 100000)) === false, 'Future date should not be expired');

// ── Summary ──
console.log(`\n═══════════════════════════════════`);
console.log(`  Passed: ${passed}  Failed: ${failed}`);
console.log(`═══════════════════════════════════\n`);
expect(failed).toBe(0);
});
