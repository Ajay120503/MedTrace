# MedTrace Deployment Guide

## Prerequisites
- Docker & Docker Compose (for containerized deployment)
- Node.js 20+ (for manual deployment)
- MongoDB 7+ (Atlas or local)
- Git

## Quick Start (Docker)

```bash
# Clone and start
git clone <repo-url> medtrace
cd medtrace

# Set environment variables
export JWT_ACCESS_SECRET=<your-secret>
export JWT_REFRESH_SECRET=<your-secret>
export EMAIL_USER=<your-email>
export EMAIL_PASS=<your-app-password>

# Start all services
docker-compose up -d

# Seed the database
docker-compose exec api npm run seed

# Access the application
# Frontend: http://localhost:5173
# API: http://localhost:5000/api
```

## Manual Setup

### Backend (Server)

```bash
cd server
cp .env .env.production
# Edit .env.production with production values
npm install
npm run seed
npm start
```

### Frontend (Client)

```bash
cd client
cp .env.example .env
# Set VITE_API_URL to your production API URL
npm install
npm run build
# Serve the dist/ folder via nginx or deploy to Vercel/Netlify
```

## Production Deployment Targets

### API (Render/Railway)
1. Set build command: `cd server && npm install`
2. Set start command: `cd server && npm start`
3. Add environment variables from `.env.production`
4. Ensure MongoDB Atlas connection string is set

### Client (Vercel/Netlify)
1. Set build command: `cd client && npm run build`
2. Set output directory: `client/dist`
3. Set environment variable: `VITE_API_URL=https://your-api.com/api`
4. Add redirect rule for SPA routing: `/* -> /index.html`

### Database (MongoDB Atlas)
1. Create a free M0 cluster
2. Set up database user with strong password
3. Whitelist deployment IP addresses
4. Use the connection string in your API environment

## Environment Variables

### Server
| Variable | Description | Default |
|----------|-------------|---------|
| PORT | API port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/medtrace |
| JWT_ACCESS_SECRET | JWT signing secret (access) | (required) |
| JWT_REFRESH_SECRET | JWT signing secret (refresh) | (required) |
| JWT_ACCESS_EXPIRES_IN | Access token TTL | 15m |
| JWT_REFRESH_EXPIRES_IN | Refresh token TTL | 7d |
| EMAIL_HOST | SMTP host | smtp.gmail.com |
| EMAIL_PORT | SMTP port | 587 |
| EMAIL_USER | SMTP username | (required) |
| EMAIL_PASS | SMTP password/app password | (required) |
| EMAIL_FROM | From address | MedTrace <noreply@medtrace.com> |
| CLIENT_URL | CORS origin | http://localhost:5173 |
| NODE_ENV | Environment | development |

### Client
| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | /api (proxy) |

## Security Checklist
- [ ] Change all default secrets
- [ ] Enable MongoDB Atlas IP whitelist
- [ ] Use strong JWT secrets (32+ chars)
- [ ] Set up proper email service (SendGrid/SES)
- [ ] Enable HTTPS (required for production)
- [ ] Set up monitoring and alerting
- [ ] Regular security audits
- [ ] Database backup strategy