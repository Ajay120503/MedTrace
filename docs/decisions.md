# MedTrace - Architecture Decisions

## Assumptions Made During Build

1. **Email Service**: Uses Nodemailer with Gmail SMTP for development. In production, swap to a transactional email service (SendGrid, SES, etc.).

2. **OTP Storage**: Login OTPs are stored in-memory (Map). For production with multiple server instances, use Redis.

3. **Refresh Token Invalidation**: Stored in-memory Set. For production, use Redis with TTL matching the refresh token expiry.

4. **Health ID Format**: 14-digit: YYYYMMDD + 6 random digits + 1 Luhn check digit. This provides uniqueness and basic validation.

5. **Drug Reference Data**: Seeded with 50 common drugs with realistic allergy triggers and interactions. This is a starting dataset and should be expanded.

6. **Password Hashing**: bcrypt with 12 salt rounds. This provides adequate security for a medical application.

7. **JWT Configuration**: Access tokens expire in 15 minutes, refresh tokens in 7 days. Refresh token rotation with reuse detection is implemented.

8. **Rate Limiting**: Auth endpoints limited to 10 requests per 15 minutes. Emergency endpoints limited to 5 per hour. Global limit of 200 per 15 minutes.

9. **AES-256 Encryption**: Not explicitly implemented at the application layer as MongoDB Atlas provides encryption at rest. For field-level encryption, additional implementation would be needed.

10. **PWA**: Service worker and manifest configuration noted but not fully implemented in this build. The app structure supports adding it.

11. **Socket.io**: Used for real-time admin alerts on Glass-Break events. In production, consider using Redis adapter for multi-instance support.

12. **PDF Export**: Uses pdfkit for server-side PDF generation. For complex layouts, consider puppeteer.

13. **QR Code**: Generated server-side using the qrcode npm package as base64 data URL.

14. **Testing**: Test setup uses a real MongoDB connection (medtrace_test database). For CI, use mongodb-memory-server.

15. **Default Admin**: Seed script creates a default hospital and admin (admin@medtrace.com / admin123456). This must be changed in production.

16. **Cloudinary Integration**: Three image use-cases (doctor certificate, hospital logo, patient profile photo). Uses signed upload flow: client requests signature, uploads directly to Cloudinary, saves returned url+publicId. Server never receives raw image bytes.

17. **Security Middleware**: helmet provides HTTP security headers, express-mongo-sanitize prevents NoSQL injection. CORS is restricted to CLIENT_URL env var.

18. **Account Lockout**: 5 failed login attempts trigger a 15-minute lockout. Implemented via rate limiting on auth endpoints.

19. **AES-256 at Rest**: MongoDB Atlas provides encryption at rest. For field-level encryption of sensitive medical fields, additional application-layer encryption would be needed.
