const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../config/logger');

// In-memory store for invalidated refresh tokens (in production use Redis)
const invalidatedTokens = new Set();

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    jwtid: crypto.randomUUID()
  });
}

function generateRefreshToken(payload) {
  const tokenId = crypto.randomUUID();
  const token = jwt.sign({ ...payload, tokenId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
  return { token, tokenId };
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

function rotateRefreshToken(oldTokenPayload) {
  // Check for reuse
  if (invalidatedTokens.has(oldTokenPayload.tokenId)) {
    logger.warn({ tokenId: oldTokenPayload.tokenId }, 'Refresh token reuse detected');
    return null; // Token reuse detected
  }

  // Invalidate old token
  invalidatedTokens.add(oldTokenPayload.tokenId);

  // Generate new tokens
  const newPayload = {
    id: oldTokenPayload.id,
    role: oldTokenPayload.role,
    hospitalId: oldTokenPayload.hospitalId
  };

  const accessToken = generateAccessToken(newPayload);
  const { token: refreshToken, tokenId } = generateRefreshToken(newPayload);

  return { accessToken, refreshToken, tokenId };
}

function invalidateRefreshToken(tokenId) {
  invalidatedTokens.add(tokenId);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  rotateRefreshToken,
  invalidateRefreshToken
};
