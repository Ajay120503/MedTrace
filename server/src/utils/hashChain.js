const crypto = require('crypto');

/**
 * Hash-Chained Audit Log implementation using SHA-256
 * 
 * currentEntryHash = SHA256(previousEntryHash + patientId + doctorId + accessType + fieldsAccessed + timestamp)
 */

function computeEntryHash({ previousEntryHash, patientId, doctorId, accessType, fieldsAccessed, timestamp }) {
  const data = [
    previousEntryHash || '0'.repeat(64),
    String(patientId),
    String(doctorId),
    accessType,
    (fieldsAccessed || []).sort().join(','),
    timestamp || new Date().toISOString()
  ].join('|');

  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify the entire hash chain from genesis
 * @param {Array} entries - audit log entries sorted by timestamp asc
 * @returns {{ valid: boolean, breakAtEntryId?: string }}
 */
function verifyChain(entries) {
  if (!entries || entries.length === 0) {
    return { valid: true };
  }

  let previousHash = '0'.repeat(64);

  for (const entry of entries) {
    const expectedHash = computeEntryHash({
      previousEntryHash: previousHash,
      patientId: entry.patientId,
      doctorId: entry.doctorId,
      accessType: entry.accessType,
      fieldsAccessed: entry.fieldsAccessed,
      timestamp: entry.timestamp
    });

    if (expectedHash !== entry.currentEntryHash) {
      return { valid: false, breakAtEntryId: String(entry._id) };
    }

    if (entry.previousEntryHash !== previousHash) {
      return { valid: false, breakAtEntryId: String(entry._id) };
    }

    previousHash = entry.currentEntryHash;
  }

  return { valid: true };
}

module.exports = { computeEntryHash, verifyChain };