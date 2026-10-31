# ZeroTrustX — Security Documentation

## Security Model

ZeroTrustX implements the **Zero Trust Security Model**: no user, device, or network is inherently trusted. Every access request is evaluated against contextual signals and risk assessments.

---

## Authentication Security

### Password Hashing

- Algorithm: **bcrypt** with cost factor 12
- Library: `bcryptjs` (pure JavaScript, timing-safe comparison)
- Verification: `bcrypt.compare()` (constant-time, prevents timing attacks)
- Never logged: Passwords never appear in logs, error responses, or audit records

### JWT Session Management

- Algorithm: **HS256** (HMAC-SHA256) with a minimum 64-character secret
- Access token expiry: 15 minutes (configurable via `JWT_EXPIRES_IN`)
- Token delivery: **HttpOnly cookie** (`ztx_token`)
  - `HttpOnly: true` — prevents JavaScript access
  - `Secure: true` in production — HTTPS only
  - `SameSite: strict` — CSRF mitigation
- Token payload: `{ sub: userId, role, jti, iat, exp }`
- JTI (JWT ID): UUID v4 per token, used for revocation

### Session Revocation

On logout, the token's `jti` is added to `SessionRevocation` table. All subsequent requests with this JTI receive 401.

Expired revocations can be periodically pruned (future enhancement: scheduled cleanup job).

### OTP Security

| Property | Implementation |
|----------|---------------|
| Generation | `crypto.randomInt(0, 1000000)` — cryptographically secure PRNG |
| Format | 6-digit, zero-padded |
| Storage | bcrypt hash only — plaintext never stored |
| Expiry | 5 minutes (configurable) |
| Attempts | Maximum 5 verification attempts |
| One-time use | Marked `usedAt` on first successful verification |
| Replay protection | `usedAt !== null` check prevents reuse |
| Binding | OTP challenge bound to user ID and authentication attempt |
| Resend cooldown | 60 seconds minimum between resends |
| Rate limiting | 10 OTP operations per 10 minutes per IP |
| Development | Console adapter logs clearly labeled `[DEV OTP]` |

**OTPs are never returned in API responses or logs.**

---

## Authorization

### Middleware Chain

Every request goes through:
1. `generalRateLimiter` — broad rate limiting
2. `authenticateToken` (on protected routes) — validates JWT
3. `requireAdmin` (on admin routes) — checks role === ADMIN

### Role Enforcement

- Roles are stored server-side in the `User` table
- Roles are embedded in the signed JWT
- Admin routes verify role from the JWT (signed by server secret)
- Users cannot modify their own role via any API endpoint
- Admin role assignment: direct database update or bootstrap procedure (documented)

### Resource Ownership

- `/api/user/*` endpoints filter all queries by `WHERE userId = req.user.id`
- Users cannot access other users' data through parameterized queries
- Admin endpoints do not rely on user-supplied userId for filtering without admin check

---

## Input Validation

All request bodies are validated with **Zod** schemas before reaching controllers.

Validation covers:
- Required fields
- Type checking
- String length limits
- Email format
- Password strength (regex enforcement)
- Numeric ranges

Validation errors return `400 VALIDATION_ERROR` with field-level details.

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/login` | 10 requests | 15 minutes |
| `POST /api/auth/register` | 5 requests | 1 hour |
| `POST /api/auth/verify-otp` | 10 requests | 10 minutes |
| `POST /api/auth/resend-otp` | 10 requests | 10 minutes |
| All other endpoints | 100 requests | 15 minutes |

Rate limits are applied per **IP address**. In production behind a reverse proxy, configure `trust proxy` correctly.

---

## Security Headers

Configured via **Helmet.js**:

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `0` (modern browsers handle this) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | Configured for API (restrictive default) |
| `Strict-Transport-Security` | Enabled in production (HSTS) |

---

## CORS

- Configured to allow only `CORS_ORIGIN` (your frontend URL)
- Credentials (`cookies`) allowed only from whitelisted origin
- Methods: GET, POST, PUT, DELETE, OPTIONS
- In production: set `CORS_ORIGIN=https://your-app.vercel.app`

---

## Logging and Secrets

### What Is Logged

- Request method, URL, status code, duration
- User ID (not email) on authenticated requests
- Event type for audit records
- IP address (for security purposes)
- Risk scores and decisions

### What Is Never Logged

- Passwords (plaintext or hash)
- OTP codes
- JWT tokens or secrets
- Session cookies
- API keys
- Email addresses in debug logs
- Database credentials

The logger includes a `sanitize()` function that strips known secret field names before logging.

---

## Risk Assessment Security

### Server-Side Trust Boundary

- Risk assessment is performed **server-side** by the Express backend calling the Python ML service
- The frontend never receives raw ML model outputs
- A client-supplied risk score is **never trusted**
- The access decision is made and enforced server-side

### ML Service Protection

- Flask service listens on a non-public port
- All `/api/*` routes require `X-Internal-API-Key` header
- The key (`ML_INTERNAL_API_KEY`) is set only in server-side environment variables
- CORS is disabled on the ML service (browser cannot reach it)
- In production on Render, the Flask service can be configured as an internal service not exposed to the public internet

### Fallback Security

If the ML service is unavailable:
1. A warning is logged
2. Risk score **defaults to MEDIUM** (not LOW)
3. The STEP_UP_VERIFICATION decision is applied
4. The failure is recorded in the audit log
5. Access is **never silently allowed** due to ML failure

---

## Database Security

- Passwords stored as bcrypt hashes only
- OTPs stored as bcrypt hashes only
- Session tokens stored as JTI references only (full tokens never stored)
- Parameterized queries via Prisma (SQL injection prevention)
- Transactions for consistency-critical operations (OTP creation, session management)
- Row-level filtering by userId on all user-facing queries

---

## Threat Model Summary

| Threat | Mitigation |
|--------|-----------|
| Password brute force | Rate limiting + bcrypt cost factor |
| Credential stuffing | Risk-based step-up + rate limiting |
| OTP replay | One-time use flag + bcrypt verification |
| OTP brute force | Max attempts + rate limiting + expiry |
| Session hijacking | HttpOnly cookie + short expiry + revocation |
| Privilege escalation | Server-side role checks + role in signed JWT |
| IDOR (access other users) | All queries filtered by authenticated userId |
| CSRF | SameSite=strict cookie + CORS configuration |
| XSS | HttpOnly cookies + Helmet CSP |
| SQL injection | Parameterized Prisma queries |
| ML service exposure | Internal API key + no public access |
| Secret leakage | Never logged + environment variables only |

---

## Known Limitations

1. **IP-based rate limiting**: Behind NAT or VPN, multiple users share an IP. Consider user-based rate limiting for production.
2. **Device fingerprinting**: UA+IP hash is not cryptographic device attestation. Sophisticated attackers can spoof User-Agent strings.
3. **JTI revocation scaling**: The revocation table grows over time. A scheduled cleanup should remove expired tokens.
4. **ML training data**: Synthetic data does not reflect real attack distributions. See [architecture.md](architecture.md).
5. **No password reset**: Password reset flow is not implemented (future enhancement).

---

## Responsible Disclosure

This is an academic capstone project. Security vulnerabilities found in this codebase should be reported via GitHub Issues.

---

*ZeroTrustX Security Documentation — Version 1.0*
