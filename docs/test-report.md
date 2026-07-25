# MedTrace Test Report

## Test Categories

### Unit Tests
- [ ] Hash chain generation and verification
- [ ] Tamper detection (deliberate mutation test)
- [ ] OTP generation, expiry, and verification
- [ ] Drug conflict detection logic
- [ ] Health ID generation and validation (Luhn check)
- [ ] JWT issuance, refresh rotation, reuse detection

### API/Integration Tests
- [ ] Patient registration endpoint
- [ ] Doctor registration endpoint
- [ ] Hospital registration endpoint
- [ ] Login and MFA verification flow
- [ ] Token refresh flow
- [ ] Access request and OTP verification
- [ ] Medical history read/append
- [ ] Drug conflict check on prescription
- [ ] Glass-Break emergency flow
- [ ] Admin doctor approval
- [ ] Audit chain verification
- [ ] Auth rejection for unauthenticated requests
- [ ] Auth rejection for unauthorized roles

### Component Tests
- [ ] OTP input component
- [ ] Glass-Break confirmation flow
- [ ] Drug conflict warning modal
- [ ] Access log timeline

### E2E Tests (Playwright)
- [ ] Registration → Admin approval → OTP visit → History append
- [ ] Glass-Break with confirmed nominee
- [ ] Glass-Break without nominee (review flag)

### Security Tests
- [ ] No-token access attempts return 401
- [ ] Expired-token access attempts return 401
- [ ] Cross-patient token access attempts return 403
- [ ] Doctor hitting admin-only routes returns 403
- [ ] Input validation rejects malformed data

### Load Tests
- [ ] 50 concurrent Glass-Break requests

## Running Tests

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# E2E tests (requires both servers running)
npx playwright test
```

## Test Configuration

- **Test Framework**: Jest (backend), Vitest (frontend), Playwright (E2E)
- **Test Database**: MongoDB (medtrace_test)
- **Mock Services**: nodemailer-mock for email tests
- **Coverage Target**: 80%+ for core services

## Notes
- Tests require a running MongoDB instance
- Set NODE_ENV=test for test-specific configuration
- Email sending is mocked in test environment