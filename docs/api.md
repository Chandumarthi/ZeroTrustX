# ZeroTrustX — API Documentation

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3001` |
| Production | `https://your-api.onrender.com` |

---

## Authentication

Most endpoints require authentication via JWT. The token is issued as an **HttpOnly cookie** (`ztx_token`) after successful login or OTP verification.

Alternatively, pass the token in the `Authorization` header:
```
Authorization: Bearer <token>
```

**Session Expiry**: Access tokens expire in 15 minutes. The frontend should handle 401 responses by redirecting to login.

**Logout**: Calling `POST /api/auth/logout` revokes the token's JTI. Using a revoked token returns 401.

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable message"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": [ ... ]
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed (Zod) |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `TOKEN_EXPIRED` | 401 | JWT expired |
| `TOKEN_REVOKED` | 401 | Token has been revoked |
| `FORBIDDEN` | 403 | Authenticated but insufficient permissions |
| `ACCESS_DENIED` | 403 | Risk-based access denial |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_EMAIL` | 409 | Email already registered |
| `OTP_INVALID` | 400 | OTP code is incorrect |
| `OTP_EXPIRED` | 400 | OTP challenge has expired |
| `OTP_MAX_ATTEMPTS` | 429 | Too many OTP verification attempts |
| `OTP_COOLDOWN` | 429 | Must wait before resending OTP |
| `RATE_LIMIT` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Endpoints

### Authentication

---

#### `POST /api/auth/register`

Register a new user account.

**Request Body**:
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Validation Rules**:
- `fullName`: 2-100 characters
- `email`: Valid email format
- `password`: Min 8 characters, must contain uppercase, lowercase, number, and special character
- `confirmPassword`: Must match password

**Success Response** `201`:
```json
{
  "success": true,
  "message": "Account created successfully. You can now log in.",
  "data": {
    "userId": "uuid"
  }
}
```

**Error Responses**:
- `400 VALIDATION_ERROR`: Invalid input
- `409 DUPLICATE_EMAIL`: Email already registered
- `429 RATE_LIMIT`: Too many registration attempts

---

#### `POST /api/auth/login`

Authenticate with email and password.

**Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "SecurePass123!"
}
```

**Success Response — Access Allowed** `200`:
```json
{
  "success": true,
  "data": {
    "requiresOTP": false,
    "user": {
      "id": "uuid",
      "email": "jane@example.com",
      "fullName": "Jane Doe",
      "role": "USER"
    },
    "riskAssessment": {
      "riskScore": 15.2,
      "riskLevel": "LOW",
      "accessDecision": "ALLOW",
      "explanation": ["Device recognized", "IP address familiar"]
    }
  }
}
```

*Sets `ztx_token` HttpOnly cookie on success.*

**Success Response — OTP Required** `200`:
```json
{
  "success": true,
  "data": {
    "requiresOTP": true,
    "challengeId": "uuid",
    "message": "A verification code has been sent to j***@example.com",
    "expiresInSeconds": 300
  }
}
```

**Error Responses**:
- `400 VALIDATION_ERROR`: Missing or malformed input
- `401 INVALID_CREDENTIALS`: Wrong email or password
- `403 ACCESS_DENIED`: Risk assessment blocked access
- `429 RATE_LIMIT`: Too many login attempts

---

#### `POST /api/auth/verify-otp`

Verify the one-time password for a pending authentication challenge.

**Request Body**:
```json
{
  "challengeId": "uuid",
  "otp": "123456"
}
```

**Success Response** `200`:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "riskAssessment": { ... }
  }
}
```

*Sets `ztx_token` HttpOnly cookie.*

**Error Responses**:
- `400 OTP_INVALID`: Incorrect OTP
- `400 OTP_EXPIRED`: Challenge has expired
- `429 OTP_MAX_ATTEMPTS`: Too many failed attempts

---

#### `POST /api/auth/resend-otp`

Request a new OTP for a pending challenge.

**Request Body**:
```json
{
  "challengeId": "uuid"
}
```

**Success Response** `200`:
```json
{
  "success": true,
  "message": "A new verification code has been sent.",
  "data": {
    "challengeId": "new-uuid",
    "expiresInSeconds": 300
  }
}
```

**Error Responses**:
- `404 NOT_FOUND`: Challenge not found or expired
- `429 OTP_COOLDOWN`: Must wait before resending

---

#### `POST /api/auth/logout`

Revoke the current session token.

**Auth**: Required

**Response** `200`:
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

*Clears `ztx_token` cookie and adds token JTI to revocation list.*

---

#### `GET /api/auth/me`

Get the currently authenticated user.

**Auth**: Required

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "jane@example.com",
    "fullName": "Jane Doe",
    "role": "USER",
    "isActive": true,
    "emailVerified": true,
    "createdAt": "2026-01-01T00:00:00Z",
    "lastLoginAt": "2026-10-29T14:00:00Z"
  }
}
```

---

### User

---

#### `GET /api/user/profile`

Get the authenticated user's full profile.

**Auth**: Required

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "devices": [
      {
        "id": "uuid",
        "isKnown": true,
        "lastSeenAt": "2026-10-29T14:00:00Z",
        "loginCount": 42
      }
    ],
    "recentRiskAssessment": { ... }
  }
}
```

---

#### `GET /api/user/activity`

Get the authenticated user's authentication event history.

**Auth**: Required

**Query Parameters**:
- `page` (int, default: 1)
- `pageSize` (int, default: 20, max: 100)
- `eventType` (string, optional filter)

**Response** `200`: Paginated list of AuthenticationEvents.

---

#### `GET /api/user/devices`

List recognized devices associated with the current user.

**Auth**: Required

**Response** `200`: Array of device objects (id, deviceName, browser, os, ip, isTrusted, lastSeenAt, createdAt).

---

#### `DELETE /api/user/devices/:deviceId`

Revoke trust for a recognized hardware device.

**Auth**: Required

**Response** `200`: Confirmation message.

---

#### `GET /api/user/alerts`

Get recent security alerts and anomalies for the authenticated user from the last 24 hours.

**Auth**: Required

**Response** `200`: Array of security alerts with severity indicators.

---

#### `GET /api/user/risk-history`

Get chronological risk scores and evaluation factors for historical charts.

**Auth**: Required

**Query Parameters**:
- `days` (int, default: 14)

**Response** `200`: Array of risk assessment history objects.

---

#### `GET /api/user/latest-assessment`

Get the user's latest computed continuous risk score and policy decision.

**Auth**: Required

**Response** `200`: Latest risk assessment object.

---

### Risk

---

#### `GET /api/risk/history`

Get the authenticated user's risk assessment history.

**Auth**: Required

**Query Parameters**:
- `page`, `pageSize`

**Response** `200`: Paginated list of RiskAssessments.

---

### Admin

All admin endpoints require `role: ADMIN`.

---

#### `GET /api/admin/dashboard`

Get system-wide dashboard statistics.

**Auth**: Admin

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 89,
    "todaySuccessfulLogins": 34,
    "todayFailedLogins": 12,
    "suspiciousEvents": 5,
    "highRiskEvents": 3,
    "riskDistribution": {
      "LOW": 280,
      "MEDIUM": 45,
      "HIGH": 12,
      "CRITICAL": 3
    },
    "decisionDistribution": {
      "ALLOW": 280,
      "STEP_UP_VERIFICATION": 45,
      "RESTRICT": 12,
      "BLOCK": 3
    },
    "authActivityByDay": [
      { "date": "2026-10-23", "successful": 28, "failed": 4 },
      ...
    ],
    "recentEvents": [ ... ]
  }
}
```

---

#### `GET /api/admin/users`

List and search users.

**Auth**: Admin

**Query Parameters**:
- `page`, `pageSize`
- `search` (string): Search by email or name
- `role` (USER | ADMIN)
- `isActive` (boolean)

**Response** `200`: Paginated user list.

---

#### `GET /api/admin/users/:userId`

Fetch detailed user profile including recent authentication assessments and registered devices for SOC investigation.

**Auth**: Admin

**Response** `200`: User object with activity breakdown and device footprint.

---

#### `PATCH /api/admin/users/:userId/status`

Update account access status (`ACTIVE`, `INACTIVE`, `SUSPENDED`).

**Auth**: Admin

**Request Body**:
```json
{
  "status": "SUSPENDED"
}
```

**Response** `200`: Updated user state with audit record created.

---

#### `PATCH /api/admin/users/:userId/role`

Promote or demote user role (`USER` or `ADMIN`).

**Auth**: Admin

**Request Body**:
```json
{
  "role": "ADMIN"
}
```

**Response** `200`: Updated user role.

---

#### `GET /api/admin/audit-logs`

Get security audit logs.

**Auth**: Admin

**Query Parameters**:
- `page`, `pageSize`
- `userId` (uuid, optional)
- `severity` (INFO | LOW | MEDIUM | HIGH | CRITICAL)
- `eventType` (string)
- `from` (ISO date)
- `to` (ISO date)

**Response** `200`: Paginated SecurityAuditLog entries.

---

#### `GET /api/admin/risk-events`

Get high-risk authentication events.

**Auth**: Admin

**Query Parameters**:
- `page`, `pageSize`
- `riskLevel` (HIGH | CRITICAL)

**Response** `200`: Paginated RiskAssessments.

---

#### `GET /api/admin/risk-policies`

Get all risk policies.

**Auth**: Admin

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "default",
      "thresholds": {
        "low": 30,
        "medium": 60,
        "high": 80
      },
      "weights": {
        "ml": 0.4,
        "rules": 0.6
      },
      "isActive": true,
      "version": 1
    }
  ]
}
```

---

#### `PUT /api/admin/risk-policies/:id`

Update a risk policy.

**Auth**: Admin

**Request Body**:
```json
{
  "thresholds": {
    "low": 25,
    "medium": 55,
    "high": 75
  },
  "weights": {
    "ml": 0.5,
    "rules": 0.5
  }
}
```

*Creates a new policy version and audits the change.*

**Response** `200`: Updated policy.

---

### Health

---

#### `GET /health`

Basic liveness check (no auth required).

**Response** `200`:
```json
{ "status": "ok", "timestamp": "2026-10-29T14:00:00Z" }
```

---

#### `GET /api/health`

Detailed health check including database and ML service connectivity.

**Response** `200`:
```json
{
  "status": "ok",
  "services": {
    "database": "connected",
    "mlService": "connected"
  },
  "version": "1.0.0",
  "timestamp": "2026-10-29T14:00:00Z"
}
```

---

## ML Service Endpoints (Internal Only)

> These endpoints are served by the Python Flask service and are **NOT accessible from the browser**. The Express backend authenticates requests using `ML_INTERNAL_API_KEY`.

#### `GET /health`

ML service liveness check.

#### `GET /api/health`

ML service detailed health (requires `X-Internal-API-Key` header).

#### `POST /api/assess`

Perform risk assessment.

**Headers**: `X-Internal-API-Key: <ML_INTERNAL_API_KEY>`

**Request Body**:
```json
{
  "features": {
    "device_known": 0,
    "ip_known": 1,
    "recent_failed_attempts": 3,
    "login_hour": 2,
    "time_since_last_login": 720,
    "device_changed": 1,
    "ip_changed": 0,
    "login_frequency": 1.5,
    "is_off_hours": 1,
    "failed_to_success_ratio": 0.6
  },
  "otp_verified": false
}
```

**Response**:
```json
{
  "risk_score": 72.3,
  "risk_level": "HIGH",
  "access_decision": "RESTRICT",
  "ml_probability": 0.84,
  "rule_based_score": 60,
  "model_version": "1.0.0",
  "explanation": [
    "Device not recognized",
    "Login at unusual hour (2:00 AM UTC)",
    "3 recent failed login attempts",
    "Device changed since last login",
    "High failure-to-attempt ratio"
  ],
  "feature_validation": {
    "valid": true,
    "errors": []
  },
  "timestamp": "2026-10-29T14:00:00Z"
}
```

---

*Generated: 2026-10-29*
