# MedTrace

Unified Emergency-Aware Patient Medical History Platform — Full MERN Stack

A consent-based, emergency-capable digital medical-history platform for clinic/hospital networks. Built with MongoDB, Express, React, and Node.js.

## Features

- **Patient Registration** with unique 14-digit Health ID (Luhn-validated)
- **Doctor Registration** with hospital-admin approval workflow
- **Hospital + Admin Registration**
- **Nominee Management** for emergency notifications
- **Normal OTP-Consent Access** — doctor requests → patient gets Email OTP → time-bound access token
- **Glass-Break Emergency Access** — identity lookup → confirmation gate → minimum-necessary field release → nominee alert
- **Hash-Chained Audit Log** (SHA-256) — tamper-evident, end-to-end verifiable
- **Drug Allergy/Interaction Checker** — real-time warnings at point of prescribing
- **Email MFA** on every login
- **JWT Access + Refresh Token Rotation** with reuse detection
- **QR Code Health ID** — scannable for quick access requests
- **PDF Export** of medical history and access log
- **Full-Chain Audit Verification** — admin tool to detect tampering
- **Role-Based Dashboards** with data visualizations
- **Dark Mode** with system-detect + manual toggle
- **Cloudinary Signed Uploads** for doctor certificates, hospital logos, patient photos
- **Dockerized** dev environment
- **PWA Ready** — installable, works offline (patient side)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, TanStack Query, Zustand, Tailwind CSS |
| Backend | Node.js 20, Express 4 |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (access + refresh), bcrypt, Email OTP (Nodemailer) |
| Real-time | Socket.io |
| Validation | Zod |
| Images | Cloudinary (signed uploads) |
| Charts | Recharts |
| Icons | lucide-react |
| Logging | Pino |
| Containerization | Docker + docker-compose |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 7+ (running on localhost:27017)
- npm

### Setup

```bash
# Clone and install
git clone <repo-url> medtrace
cd medtrace

# Install dependencies
cd server && npm install
cd ../client && npm install
cd ..

# Seed the database (drug references + demo users)
cd server && npm run seed && cd ..

# Start development servers
./start.sh dev
```

Or use the test suite:
```bash
./run.sh          # Full test suite
./run.sh unit     # Unit tests only
./run.sh api      # API smoke tests
```

### Docker

```bash
docker-compose up -d
docker-compose exec api npm run seed
```

## Demo Credentials

After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@demo.com | patient123 |
| Doctor | doctor@demo.com | doctor123 |
| Admin | admin@medtrace.com | admin123456 |

## Project Structure

```
medtrace/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # UI components (Button, Badge, Input, Modal, EmptyState)
│   │   ├── pages/          # Page components (11 pages)
│   │   ├── store/          # Zustand auth store
│   │   ├── utils/          # Axios API client
│   │   └── styles/         # Tailwind CSS with Trustline design system
│   └── ...
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # DB connection, logger
│   │   ├── middleware/      # Auth, validation (Zod)
│   │   ├── models/         # 9 Mongoose schemas
│   │   ├── routes/         # 10 route files
│   │   ├── services/       # Email, OTP, drug check, Cloudinary
│   │   ├── utils/          # JWT, hash chain, Health ID
│   │   └── __tests__/      # Unit tests
│   └── ...
├── docs/                   # Documentation
├── docker-compose.yml
├── start.sh                # Project starter
└── run.sh                  # Test suite
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/patients/register | Patient registration |
| POST | /api/doctors/register | Doctor registration |
| POST | /api/hospitals/register | Hospital registration |
| POST | /api/auth/login | Login (triggers MFA OTP) |
| POST | /api/auth/verify-mfa | Verify OTP |
| POST | /api/access/request | Request patient access |
| POST | /api/access/verify-otp | Verify access OTP |
| POST | /api/emergency/breakglass/:id | Emergency access |
| GET | /api/admin/audit/verify | Verify audit chain |
| POST | /api/uploads/sign | Get Cloudinary upload signature |
| ... | ... | (30+ endpoints total) |

## License

MIT