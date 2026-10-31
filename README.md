# ZeroTrustX
## AI-Powered Adaptive Authentication and Risk-Based Access Control Platform

> **Core Principle**: NEVER TRUST, ALWAYS VERIFY.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://typescriptlang.org)

---

## 📋 Table of Contents
- [Introduction](#introduction)
- [Problem Statement](#problem-statement)
- [Objectives](#objectives)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [ML Model Setup](#ml-model-setup)
- [Development](#development)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Administrator Setup](#administrator-setup)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)
- [Limitations](#limitations)
- [Future Enhancements](#future-enhancements)

---

## Introduction

**ZeroTrustX** is a full-stack cybersecurity platform implementing the Zero Trust security model: "never trust, always verify." It combines conventional multi-factor authentication with machine learning–based contextual risk assessment and adaptive access control.

The platform evaluates every authentication attempt against multiple contextual signals — device familiarity, IP context, login history, behavioral patterns, and more — using a hybrid rule-based and Random Forest ML risk engine. Based on the computed risk score, it makes an explainable access decision: **ALLOW**, **STEP_UP_VERIFICATION**, **RESTRICT**, or **BLOCK**.

This project is an academic capstone demonstrating how modern cybersecurity platforms combine software engineering, AI/ML, and security architecture.

---

## Problem Statement

Traditional username-and-password authentication is insufficient for modern threat environments. Credential theft, phishing, and brute-force attacks routinely compromise accounts even when users employ strong passwords. Multi-factor authentication improves security but adds friction regardless of actual risk. Organizations need systems that are:

- **Adaptive**: Apply stronger verification only when contextual signals indicate elevated risk.
- **Explainable**: Provide human-readable reasons for every access decision.
- **Continuous**: Verify trust throughout a session, not just at login.
- **Intelligent**: Use machine learning to detect unusual patterns without requiring hand-crafted rules for every scenario.

---

## Objectives

1. Implement secure multi-factor authentication with OTP via email.
2. Build a machine learning–based risk assessment engine using Random Forest classification.
3. Create a transparent hybrid risk scoring system combining ML predictions with rule-based signals.
4. Implement adaptive access control with four decision outcomes.
5. Provide comprehensive security dashboards for users and administrators.
6. Maintain a complete security audit trail.
7. Demonstrate Zero Trust principles in a realistic web application.

---

## Features

### Authentication
- ✅ Secure registration with password strength validation
- ✅ Email/password login with bcrypt hashing (12 rounds)
- ✅ Six-digit OTP via email (5-minute expiry, one-time use)
- ✅ OTP rate limiting, replay protection, and attempt limits
- ✅ HttpOnly cookie sessions with JWT
- ✅ Secure logout with token revocation

### Risk Assessment
- ✅ Random Forest ML classifier (trained on synthetic data)
- ✅ Hybrid scoring: 40% ML probability + 60% rule-based factors
- ✅ Contextual signals: device, IP, failed attempts, time, frequency
- ✅ Explainable decisions with human-readable reasons
- ✅ Risk levels: LOW / MEDIUM / HIGH / CRITICAL
- ✅ Access decisions: ALLOW / STEP_UP_VERIFICATION / RESTRICT / BLOCK
- ✅ Graceful fallback when ML service is unavailable (never silently low-risk)

### Device & Context Tracking
- ✅ Device fingerprinting from User-Agent + IP
- ✅ Known device recognition per user
- ✅ IP context tracking and change detection
- ✅ Privacy-respecting (no invasive fingerprinting)

### Dashboards
- ✅ User dashboard: account info, risk history, recent events, recognized devices
- ✅ Admin dashboard: system metrics, risk distribution charts, user management
- ✅ Security activity log with filtering and pagination
- ✅ Audit log with severity classification

### Security
- ✅ Server-side risk decisions (never trust client-supplied risk scores)
- ✅ Server-side role enforcement on all admin endpoints
- ✅ Rate limiting on all sensitive endpoints
- ✅ Security headers via Helmet.js
- ✅ CORS configuration
- ✅ Structured audit trail for all security events
- ✅ No secrets in logs or error responses

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (React)                          │
│   Landing Page │ Auth Pages │ User Dashboard │ Admin Dashboard   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express API (Node.js/TS)                       │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Auth Routes  │  │ User Routes  │  │   Admin Routes        │  │
│  │ /api/auth/*  │  │ /api/user/*  │  │   /api/admin/*        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                       │              │
│  ┌──────▼─────────────────▼───────────────────────▼──────────┐  │
│  │              Service Layer                                  │  │
│  │  AuthService │ RiskService │ EmailService │ AuditService   │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
              │               │ Internal API (API Key)
              │               ▼
              │  ┌────────────────────────────────────┐
              │  │     Python Flask Risk Engine        │
              │  │                                     │
              │  │  Random Forest Model                │
              │  │  Hybrid Risk Scoring                │
              │  │  Feature Validation                 │
              │  └────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                PostgreSQL (via Prisma ORM)                        │
│  Users │ OTPChallenges │ Devices │ AuthEvents │ RiskAssessments  │
│  AccessDecisions │ AuditLogs │ RiskPolicies │ SessionRevocations │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Email Service                                 │
│          Brevo (production) │ Console/Dev (development)          │
└─────────────────────────────────────────────────────────────────┘
```

See [docs/architecture.md](docs/architecture.md) for the complete architecture documentation.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Router, Recharts, Lucide Icons |
| **Backend** | Node.js 18+, Express 4, TypeScript, Prisma ORM, Zod validation |
| **Security** | bcryptjs (12 rounds), jsonwebtoken, Helmet.js, express-rate-limit |
| **ML Service** | Python 3.10+, Flask, scikit-learn, pandas, NumPy |
| **Database** | PostgreSQL 15+, Prisma migrations |
| **Email** | Brevo (production), Console adapter (development) |
| **Testing** | Vitest, Supertest, pytest |
| **Deployment** | Vercel (frontend), Render (backend + ML), Managed PostgreSQL |

---

## Project Structure

```
ZeroTrustX/
├── apps/
│   ├── web/                    # React frontend
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── layouts/        # Page layout wrappers
│   │   │   ├── pages/          # Route-level page components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── services/       # API service functions
│   │   │   ├── context/        # React context providers
│   │   │   ├── types/          # TypeScript types
│   │   │   └── utils/          # Utility functions
│   │   └── package.json
│   │
│   └── api/                    # Express backend
│       ├── src/
│       │   ├── config/         # Environment, logger, database
│       │   ├── middleware/      # Auth, admin, rate limit, logging
│       │   ├── routes/         # API route definitions
│       │   ├── controllers/    # Request handlers
│       │   ├── services/       # Business logic
│       │   ├── validators/     # Zod schemas
│       │   └── utils/          # Crypto utilities
│       ├── prisma/
│       │   └── schema.prisma   # Database schema
│       └── tests/              # Unit and integration tests
│
├── services/
│   └── risk-engine/            # Python ML service
│       ├── app.py              # Flask application
│       ├── risk_engine.py      # Hybrid risk scoring
│       ├── train_model.py      # Training pipeline
│       ├── generate_dataset.py # Synthetic data generator
│       ├── feature_schema.py   # Feature definitions
│       ├── models/             # Trained model artifacts (gitignored)
│       └── tests/              # pytest test suite
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── security.md
│   └── testing.md
│
├── .env.example                # Environment variable template
├── .gitignore
├── package.json                # Monorepo root
└── README.md
```

---

## Prerequisites

- **Node.js** 18+ and npm 9+
- **Python** 3.10+
- **PostgreSQL** 15+ (local or managed)
- **pip** for Python packages
- **Git**

Optional:
- [pgAdmin](https://www.pgadmin.org/) or [TablePlus](https://tableplus.com/) for database inspection

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ZeroTrustX.git
cd ZeroTrustX
```

### 2. Install Node.js Dependencies

```bash
# Install all workspace dependencies (root + apps/web + apps/api)
npm install
```

### 3. Install Python Dependencies

```bash
cd services/risk-engine
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cd ../..
```

---

## Environment Setup

### 1. Copy Environment Templates

```bash
# Root / Express backend
copy .env.example apps\api\.env

# Frontend
copy .env.example apps\web\.env

# ML service
copy .env.example services\risk-engine\.env
```

### 2. Configure apps/api/.env

Edit `apps/api/.env` and set:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: Long random string (minimum 64 characters)
- `ML_SERVICE_SECRET` and `ML_SERVICE_URL`: Match your risk engine config
- `COOKIE_SECRET`: Long random string
- `EMAIL_ADAPTER`: `development` for local (logs OTP to console) or `brevo`
- `BREVO_API_KEY`: Required if EMAIL_ADAPTER=brevo

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Configure apps/web/.env

```env
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=ZeroTrustX
```

### 4. Configure services/risk-engine/.env

```env
FLASK_ENV=development
FLASK_HOST=0.0.0.0
FLASK_PORT=5001
ML_INTERNAL_API_KEY=<same as ML_SERVICE_SECRET in api/.env>
MODEL_DIR=./models
```

---

## Database Setup

### 1. Create the Database

```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE zerotrust_db;
CREATE USER zerotrust_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE zerotrust_db TO zerotrust_user;
```

### 2. Run Migrations

```bash
cd apps/api
npx prisma migrate dev --name init
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Seed Default Data (Risk Policy)

```bash
npm run db:seed
```

### 5. Inspect the Database (optional)

```bash
npx prisma studio
```

---

## ML Model Setup

> **Important**: The risk model is trained on **synthetic data** generated by `generate_dataset.py`. This data is designed to demonstrate the ML pipeline and feature engineering, not to simulate real attack patterns. See [docs/security.md](docs/security.md) for limitations.

### 1. Generate Dataset

```bash
cd services/risk-engine

# Activate virtual environment first
python generate_dataset.py
```

This creates `data/synthetic_auth_data.csv` with 10,000 synthetic authentication events.

### 2. Train the Model

```bash
python train_model.py
```

This trains a Random Forest classifier, evaluates it, and saves:
- `models/risk_model.pkl` — trained model
- `models/feature_names.pkl` — feature list
- `models/model_metadata.json` — version, metrics, configuration

Training metrics will be printed to the console. The confusion matrix and F1 score reflect **held-out test data**.

### 3. Verify Model

```bash
python -c "from risk_engine import RiskEngine; r = RiskEngine(); print('Model loaded:', r.model_version)"
```

---

## Development

### Start All Services

**Terminal 1 — PostgreSQL**: Ensure your PostgreSQL server is running.

**Terminal 2 — ML Risk Engine**:
```bash
cd services/risk-engine
venv\Scripts\activate  # or source venv/bin/activate
python app.py
```
Risk engine will be available at `http://localhost:5001`.

**Terminal 3 — Express Backend**:
```bash
cd apps/api
npm run dev
```
API will be available at `http://localhost:3001`.

**Terminal 4 — React Frontend**:
```bash
cd apps/web
npm run dev
```
Frontend will be available at `http://localhost:5173`.

---

## Testing

### Backend Tests (Vitest + Supertest)

```bash
cd apps/api
npm run test
```

### Frontend Tests (Vitest + Testing Library)

```bash
cd apps/web
npm run test
```

### ML Engine Tests (pytest)

```bash
cd services/risk-engine
venv\Scripts\activate
pytest tests/ -v
```

### Run All Tests

```bash
# From project root
npm run test:api
npm run test:web
```

See [docs/testing.md](docs/testing.md) for complete test documentation.

---

## API Documentation

See [docs/api.md](docs/api.md) for complete API documentation.

### Quick Reference

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login with email/password | No |
| POST | `/api/auth/verify-otp` | Verify OTP challenge | No |
| POST | `/api/auth/resend-otp` | Resend OTP code | No |
| POST | `/api/auth/logout` | Logout and revoke session | Yes |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/user/profile` | Get user profile | Yes |
| GET | `/api/user/activity` | Get authentication history | Yes |
| GET | `/api/risk/history` | Get risk assessment history | Yes |
| GET | `/api/admin/dashboard` | Admin dashboard stats | Admin |
| GET | `/api/admin/users` | List and search users | Admin |
| GET | `/api/admin/audit-logs` | Audit log entries | Admin |
| GET | `/api/admin/risk-events` | High-risk events | Admin |
| GET | `/api/admin/risk-policies` | Risk policy configuration | Admin |
| PUT | `/api/admin/risk-policies/:id` | Update risk policy | Admin |
| GET | `/health` | Liveness check | No |
| GET | `/api/health` | Detailed health check | No |

---

## Administrator Setup

There are no hardcoded administrator credentials. Follow these steps to create the first admin account:

### Step 1: Register a normal account

Use the registration form or:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Admin User","email":"admin@example.com","password":"SecurePass123!"}'
```

### Step 2: Promote to admin via database

```bash
# Open Prisma Studio
cd apps/api && npx prisma studio
```

Find your user and change `role` from `USER` to `ADMIN`, or via SQL:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

### Step 3: Alternatively, use the bootstrap endpoint

Set `ADMIN_BOOTSTRAP_SECRET` in your `.env`, then:
```bash
curl -X POST http://localhost:3001/api/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{"bootstrapSecret":"your_secret","email":"admin@example.com"}'
```

> **Remove or clear `ADMIN_BOOTSTRAP_SECRET` after creating the first admin.**

---

## Deployment

### Frontend (Vercel)

1. Push `apps/web` to a repository or connect the monorepo
2. Set root directory to `apps/web`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable: `VITE_API_URL=https://your-api.onrender.com`

### Express Backend (Render)

1. Create a new Web Service
2. Root directory: `apps/api`
3. Build command: `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
4. Start command: `node dist/server.js`
5. Add all required environment variables

### Python ML Service (Render)

1. Create a new Web Service
2. Root directory: `services/risk-engine`
3. Build command: `pip install -r requirements.txt && python generate_dataset.py && python train_model.py`
4. Start command: `gunicorn app:app --bind 0.0.0.0:$PORT`
5. Set `ML_INTERNAL_API_KEY` environment variable

### Database (Managed PostgreSQL)

Use Render PostgreSQL, Neon, Supabase, or Railway.
Set `DATABASE_URL` in your Express backend environment.

### Post-Deployment Checklist

- [ ] All services healthy (check `/health` endpoints)
- [ ] `CORS_ORIGIN` set to your Vercel URL
- [ ] `ML_SERVICE_URL` set to your Render ML service URL
- [ ] Email provider configured and sender verified
- [ ] Admin account created
- [ ] `ADMIN_BOOTSTRAP_SECRET` cleared

---

## Security Considerations

1. **Secrets management**: Never commit `.env` files. Use your host's secret management.
2. **JWT secrets**: Use cryptographically random strings of at least 64 characters.
3. **Database**: Use a dedicated database user with minimal privileges.
4. **ML service**: Keep `ML_SERVICE_URL` and `ML_INTERNAL_API_KEY` private to the backend.
5. **HTTPS**: Always use TLS in production (Vercel and Render provide this automatically).
6. **Rate limiting**: All sensitive endpoints are rate-limited.
7. **OTP security**: OTPs are hashed with bcrypt, expire in 5 minutes, and are one-time use.
8. **Session revocation**: Logout revokes the specific JWT (JTI-based blocklist).
9. **Admin privilege**: Admin role is assigned server-side; users cannot self-promote.

See [docs/security.md](docs/security.md) for complete security documentation.

---

## Limitations

### ML Model
- **Synthetic training data**: The Random Forest model is trained entirely on synthetic data generated by `generate_dataset.py`. The model demonstrates the ML pipeline and hybrid scoring architecture, but its predictions reflect the statistical patterns in synthetic data, not real attack distributions.
- **Feature limitations**: Features are derived from server-side context. Browser-provided signals are not used to avoid dependence on unreliable client data.
- **No continuous retraining**: The model is trained once during setup. Production systems should retrain on real-labeled data.

### Authentication
- **Device fingerprinting**: Fingerprints are derived from User-Agent + IP hash, which is a simplified approach. Production systems may use cryptographic device attestation.
- **OTP delivery**: OTP delivery depends on the configured email provider. Delivery failures are handled gracefully but not retried automatically.

### Behavioral Anomaly Detection
- Isolation Forest–based behavioral anomaly detection is partially implemented. See [docs/architecture.md](docs/architecture.md) for the extension roadmap.

---

## Future Enhancements

1. **Continuous behavioral modeling**: Retrain Isolation Forest on real session data
2. **WebAuthn/FIDO2**: Hardware key and biometric authentication
3. **Real device attestation**: Cryptographic device registration
4. **Threat intelligence feeds**: IP reputation lookup
5. **SIEM integration**: Export audit events to external security systems
6. **Multi-tenancy**: Organization-level policies and isolation
7. **Mobile app**: React Native companion app
8. **Real-time alerts**: WebSocket-based security notifications

---

## Academic Context

This project is submitted as a capstone project demonstrating:
- Full-stack software engineering (TypeScript, React, Node.js)
- ML engineering (scikit-learn, feature engineering, model evaluation)
- Cybersecurity architecture (Zero Trust, MFA, adaptive access control)
- Database design (PostgreSQL, Prisma, migrations)
- Security best practices (secure coding, secrets management, audit trails)

**Research References**: See PowerPoint presentation and research paper in `docs/references/`.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*ZeroTrustX — Academic Capstone Project*  
*"Intelligent Security. Adaptive Trust."*
