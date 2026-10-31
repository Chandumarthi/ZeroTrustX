# ZeroTrustX — Testing Documentation

## Overview

ZeroTrustX uses a multi-layer testing strategy:

| Layer | Framework | Location |
|-------|-----------|----------|
| Backend unit tests | Vitest | `apps/api/tests/unit/` |
| Backend integration tests | Vitest + Supertest | `apps/api/tests/integration/` |
| Frontend component tests | Vitest + Testing Library | `apps/web/src/test/` |
| ML engine tests | pytest | `services/risk-engine/tests/` |

---

## Running Tests

### Backend Tests

```bash
cd apps/api

# All tests (unit + integration)
npm run test

# Watch mode
npm run test:watch

# With coverage
npm run test -- --coverage
```

### Frontend Tests

```bash
cd apps/web

# All tests
npm run test

# Watch mode
npm run test:watch

# With UI
npm run test:ui
```

### ML Engine Tests

```bash
cd services/risk-engine
source venv/bin/activate  # or venv\Scripts\activate on Windows

# All tests
pytest tests/ -v

# Specific test file
pytest tests/test_risk_engine.py -v

# With coverage
pytest tests/ --cov=. --cov-report=term-missing
```

---

## Test Coverage Requirements

| Area | Target |
|------|--------|
| Authentication flows | 90%+ |
| Authorization middleware | 95%+ |
| Risk engine logic | 85%+ |
| OTP workflow | 90%+ |
| Input validation | 80%+ |

---

## Backend Test Cases

### Unit Tests (`tests/unit/auth.test.ts`)

#### Password Hashing
- ✅ Hashed password does not equal plaintext
- ✅ Same password produces different hashes (salted)
- ✅ Correct password verifies successfully
- ✅ Incorrect password fails verification
- ✅ Empty string password fails validation

#### OTP Generation
- ✅ OTP is exactly 6 digits
- ✅ OTP is a string of digits
- ✅ Multiple OTPs are not identical (probabilistic)
- ✅ OTP hash verifies with correct code
- ✅ OTP hash fails with wrong code

#### JWT Operations
- ✅ Access token contains correct user ID and role
- ✅ Access token has JTI claim
- ✅ Expired token throws on verification
- ✅ Token signed with wrong secret fails
- ✅ Malformed token string fails

---

### Integration Tests (`tests/integration/auth.integration.test.ts`)

#### Registration
- ✅ `POST /api/auth/register` — valid data creates user (201)
- ✅ Duplicate email returns 409
- ✅ Short password returns 400
- ✅ Password without uppercase returns 400
- ✅ Invalid email format returns 400
- ✅ Mismatched confirmPassword returns 400
- ✅ Missing required field returns 400

#### Login
- ✅ `POST /api/auth/login` — correct credentials succeed (200)
- ✅ Wrong password returns 401
- ✅ Non-existent email returns 401
- ✅ Missing email returns 400
- ✅ Sets HttpOnly cookie on success

#### OTP Workflow
- ✅ Login with medium-risk features triggers OTP requirement
- ✅ Correct OTP grants access (200 + cookie)
- ✅ Wrong OTP returns 400
- ✅ Expired OTP returns 400
- ✅ Previously used OTP (replay) returns 400
- ✅ Exceeded max attempts returns 429
- ✅ Resend OTP too quickly returns 429

#### Session Management
- ✅ Authenticated request with valid cookie succeeds
- ✅ Authenticated request without cookie returns 401
- ✅ Request after logout returns 401
- ✅ Expired token returns 401

#### Rate Limiting
- ✅ Exceeding login rate limit returns 429
- ✅ Exceeding OTP rate limit returns 429

#### Admin Authorization
- ✅ Regular user accessing `/api/admin/*` returns 403
- ✅ Admin user accessing `/api/admin/dashboard` succeeds (200)
- ✅ Unauthenticated request to admin route returns 401

---

## ML Engine Test Cases

### Risk Engine Unit Tests (`tests/test_risk_engine.py`)

#### Feature Validation
- ✅ All valid features pass validation
- ✅ Missing required feature returns validation error
- ✅ Feature below minimum range returns error
- ✅ Feature above maximum range returns error
- ✅ Wrong type for boolean feature returns error

#### Rule-Based Scoring
- ✅ Normal user features produce low rule score (< 10)
- ✅ Unknown device adds +15 to score
- ✅ Unknown IP adds +10 to score
- ✅ Each failed attempt adds +8 (capped at 40)
- ✅ Off-hours login adds +10
- ✅ Device change adds +12
- ✅ IP change adds +5
- ✅ High failure ratio adds +15

#### Hybrid Score Calculation
- ✅ Score is always clamped to [0, 100]
- ✅ ML weight is 40% of final score
- ✅ Rule weight is 60% of final score
- ✅ Zero ML probability + zero rules = score near 0
- ✅ Maximum ML + maximum rules = 100

#### Risk Level Thresholds
- ✅ Score 0-29 → LOW
- ✅ Score 30-59 → MEDIUM
- ✅ Score 60-79 → HIGH
- ✅ Score 80-100 → CRITICAL

#### Access Decisions
- ✅ LOW → ALLOW
- ✅ MEDIUM → STEP_UP_VERIFICATION
- ✅ HIGH → RESTRICT
- ✅ CRITICAL → BLOCK
- ✅ MEDIUM + OTP verified + score < 45 → ALLOW

#### Full Assessment Scenarios
- ✅ Normal login (known device, known IP, no failures) → LOW / ALLOW
- ✅ Unknown device + night login + failures → HIGH/CRITICAL
- ✅ Changed device alone → MEDIUM or higher
- ✅ Multiple failed attempts → risk increased proportionally

#### Error Handling
- ✅ Missing model files raise RuntimeError (not silent low risk)
- ✅ Invalid feature types cause validation failure before inference
- ✅ Explanation list is always returned (non-empty for elevated risk)

---

### Flask API Tests (`tests/test_app.py`)

- ✅ `GET /health` returns 200 without authentication
- ✅ `GET /api/health` without API key returns 401
- ✅ `GET /api/health` with correct API key returns 200
- ✅ `POST /api/assess` without API key returns 401
- ✅ `POST /api/assess` with valid features returns 200 and risk result
- ✅ `POST /api/assess` with missing feature returns 400
- ✅ `POST /api/assess` with out-of-range value returns 400
- ✅ Response contains all required fields: risk_score, risk_level, access_decision, explanation

---

## Frontend Test Cases

### Component Tests

#### Button Component
- ✅ Renders with correct text
- ✅ Loading state shows spinner
- ✅ Disabled state prevents click
- ✅ Primary variant applies correct classes
- ✅ Danger variant applies correct classes

#### OTPInput Component
- ✅ Renders 6 input boxes
- ✅ Auto-focuses first box on mount
- ✅ Typing digit focuses next box
- ✅ Backspace moves to previous box
- ✅ Paste fills all boxes from clipboard
- ✅ Calls onChange with complete 6-digit value

#### PasswordStrength Component
- ✅ Shows "weak" for short password
- ✅ Shows "medium" for password with only letters
- ✅ Shows "strong" for password with mixed case + number + special
- ✅ Visual indicator updates on input change

### Page Tests

#### LoginPage
- ✅ Renders email and password inputs
- ✅ Submit button disabled when fields empty
- ✅ Shows validation error for invalid email
- ✅ Shows error message on failed login
- ✅ Redirects to /verify-otp when requiresOTP is true

#### RegisterPage
- ✅ Renders all required fields
- ✅ Shows password strength indicator
- ✅ Shows error when passwords don't match
- ✅ Shows success message on successful registration

---

## Integration Test Scenarios

### Critical Security Flows

| Scenario | Expected Behavior | Status |
|----------|-------------------|--------|
| OTP-required login without OTP verification | 401 on protected routes | ✅ |
| OTP bypass attempt with wrong challengeId | 400 Not found | ✅ |
| Expired OTP submission | 400 OTP expired | ✅ |
| Replaying a valid OTP | 400 OTP already used | ✅ |
| Low-risk login bypasses OTP | Direct session creation | ✅ |
| ML service down during login | Defaults to MEDIUM risk, OTP required | ✅ |
| Admin dashboard from regular user | 403 Forbidden | ✅ |
| Forged JWT with wrong secret | 401 Unauthorized | ✅ |
| Revoked token after logout | 401 Token revoked | ✅ |

---

## Test Environment Setup

### Backend Test Environment

Create `apps/api/.env.test`:
```env
NODE_ENV=test
DATABASE_URL="postgresql://user:pass@localhost:5432/zerotrust_test"
JWT_SECRET=test-jwt-secret-long-enough-for-testing-purposes
ML_SERVICE_SECRET=test-ml-secret
ML_SERVICE_URL=http://localhost:5001
EMAIL_ADAPTER=development
OTP_EXPIRES_IN_SECONDS=300
```

### ML Test Environment

Tests that require a trained model use pytest fixtures with a mock model to avoid depending on model files:

```python
@pytest.fixture
def mock_engine(mocker):
    engine = RiskEngine.__new__(RiskEngine)
    engine.model = MockRandomForestModel()
    engine.feature_names = FEATURES
    engine.model_version = "test-1.0.0"
    return engine
```

---

## Continuous Integration (CI)

A GitHub Actions workflow (`.github/workflows/ci.yml`) can be added to run all tests automatically on pull requests.

Recommended CI steps:
1. Install Node.js 18
2. Install Python 3.10
3. `npm ci` — install Node dependencies
4. `pip install -r requirements.txt` — install Python dependencies
5. `npm run test:api` — backend tests
6. `npm run test:web` — frontend tests
7. `pytest services/risk-engine/tests/` — ML tests

---

*Testing documentation — ZeroTrustX v1.0*
