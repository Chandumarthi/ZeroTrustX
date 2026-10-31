# ZeroTrustX — Architecture Documentation

## Overview

ZeroTrustX implements a three-tier architecture with a separate ML microservice:

1. **Presentation Tier**: React SPA (Single Page Application)
2. **Application Tier**: Express REST API (Node.js/TypeScript)
3. **Intelligence Tier**: Flask ML Risk Engine (Python)
4. **Data Tier**: PostgreSQL (via Prisma ORM)

---

## System Architecture Diagram

```mermaid
graph TB
    Browser["🌐 Browser\n(React SPA)"] 
    
    subgraph Frontend["Frontend — Vercel"]
        Landing["Landing Page"]
        Auth["Auth Pages\nLogin / Register / OTP"]
        UserDash["User Dashboard"]
        AdminDash["Admin Dashboard"]
    end

    subgraph Backend["Express API — Render"]
        direction TB
        AuthMiddleware["Auth Middleware\n(JWT + Cookie Validation)"]
        RateLimiter["Rate Limiter\n(express-rate-limit)"]
        
        subgraph Routes["API Routes"]
            AuthRoutes["/api/auth/*"]
            UserRoutes["/api/user/*"]
            RiskRoutes["/api/risk/*"]
            AdminRoutes["/api/admin/*"]
        end
        
        subgraph Services["Service Layer"]
            AuthService["AuthService\n(register, login, OTP)"]
            RiskService["RiskService\n(hybrid scoring)"]
            EmailService["EmailService\n(OTP delivery)"]
            AuditService["AuditService\n(event logging)"]
            PolicyService["PolicyService\n(access decisions)"]
        end
    end

    subgraph MLService["Flask ML Service — Render (Private)"]
        RiskEngine["RiskEngine\n(Hybrid Scoring)"]
        RFModel["Random Forest\n(scikit-learn)"]
        RuleEngine["Rule Engine\n(contextual factors)"]
    end

    subgraph DataLayer["Data — Managed PostgreSQL"]
        Users["Users"]
        OTPChallenges["OTPChallenges"]
        Devices["Devices"]
        AuthEvents["AuthEvents"]
        RiskAssessments["RiskAssessments"]
        AuditLogs["AuditLogs"]
        RiskPolicies["RiskPolicies"]
    end

    subgraph Email["Email Service"]
        Brevo["Brevo API\n(production)"]
        DevConsole["Console Adapter\n(development)"]
    end

    Browser --> Frontend
    Frontend -->|"HTTPS REST"| Backend
    Backend -->|"Internal API + API Key\n(never public)"| MLService
    Backend --> DataLayer
    Backend --> Email
    MLService --> RFModel
    MLService --> RuleEngine
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User/Browser
    participant API as Express API
    participant DB as PostgreSQL
    participant ML as ML Risk Engine
    participant Email as Email Service

    Note over U,Email: Registration
    U->>API: POST /api/auth/register {name, email, password}
    API->>API: Validate input (Zod)
    API->>DB: Check email uniqueness
    API->>API: Hash password (bcrypt 12 rounds)
    API->>DB: Create User record
    API->>DB: Log SecurityAuditLog
    API-->>U: 201 Created

    Note over U,Email: Login
    U->>API: POST /api/auth/login {email, password}
    API->>API: Rate limit check
    API->>DB: Find user by email
    API->>API: Verify password (bcrypt.compare)
    alt Wrong password
        API->>DB: Log AuthEvent(FAILURE)
        API-->>U: 401 Invalid credentials
    else Correct password
        API->>ML: POST /api/assess {features, context}
        ML->>ML: Validate features
        ML->>ML: ML prediction (Random Forest)
        ML->>ML: Rule-based scoring
        ML->>ML: Hybrid score calculation
        ML-->>API: {risk_score, risk_level, decision, explanation}
        API->>DB: Save RiskAssessment
        API->>DB: Save AccessDecision
        alt Decision: ALLOW
            API->>DB: Update Device record
            API->>DB: Log AuthEvent(SUCCESS)
            API-->>U: 200 {accessToken, user} + Set HttpOnly Cookie
        else Decision: STEP_UP_VERIFICATION
            API->>API: Generate 6-digit OTP (crypto.randomInt)
            API->>API: Hash OTP (bcrypt)
            API->>DB: Save OTPChallenge
            API->>Email: Send OTP email
            API-->>U: 200 {requiresOTP: true, challengeId}
        else Decision: RESTRICT/BLOCK
            API->>DB: Log AuthEvent(ACCESS_DENIED)
            API-->>U: 403 Access restricted
        end
    end

    Note over U,Email: OTP Verification
    U->>API: POST /api/auth/verify-otp {challengeId, otp}
    API->>DB: Fetch OTPChallenge
    API->>API: Check expiry
    API->>API: Check attempt count
    API->>API: Verify OTP hash (bcrypt.compare)
    alt OTP valid
        API->>DB: Mark challenge as used
        API->>ML: Re-assess with otp_verified=true
        API->>DB: Create session
        API-->>U: 200 {accessToken, user} + Set HttpOnly Cookie
    else OTP invalid/expired
        API->>DB: Increment attempt count
        API-->>U: 401 Invalid or expired OTP
    end
```

---

## Risk Assessment Architecture

```mermaid
flowchart TD
    Request["Authentication Request"] --> FeatureCollection["Feature Collection\n(device, IP, history, time)"]
    FeatureCollection --> Validate["Feature Validation"]
    Validate -->|Valid| MLInference["ML Inference\n(Random Forest predict_proba)"]
    Validate -->|Invalid| Fallback["Rule-Based Fallback\n(ML failure → min MEDIUM risk)"]
    MLInference --> MLProb["ML Probability\n(0.0 - 1.0 suspicious)"]
    MLProb --> HybridScore["Hybrid Score Calculation\n\nML contribution: prob × 40\nRule contribution: rule_score × 0.6\nFinal: clamp(ML + Rules, 0, 100)"]
    Fallback --> HybridScore
    
    subgraph Rules["Rule-Based Signals"]
        R1["Unknown device: +15"]
        R2["Unknown IP: +10"]
        R3["Failed attempts: +8/each (max +40)"]
        R4["Off-hours login: +10"]
        R5["Device changed: +12"]
        R6["IP changed: +5"]
        R7["High failure ratio: +15"]
    end
    
    Rules --> HybridScore
    
    HybridScore --> Threshold{"Score\nThreshold"}
    Threshold -->|"< 30"| LOW["LOW\n→ ALLOW"]
    Threshold -->|"30-59"| MEDIUM["MEDIUM\n→ STEP_UP_VERIFICATION"]
    Threshold -->|"60-79"| HIGH["HIGH\n→ RESTRICT"]
    Threshold -->|"≥ 80"| CRITICAL["CRITICAL\n→ BLOCK"]
    
    LOW --> Decision["Access Decision\n+ Explanation"]
    MEDIUM --> Decision
    HIGH --> Decision
    CRITICAL --> Decision
    
    Decision --> Store["Store in DB\n(RiskAssessment + AccessDecision)"]
    Decision --> Response["Return to Client"]
```

---

## Database Schema

```mermaid
erDiagram
    User {
        uuid id PK
        string email UK
        string passwordHash
        string fullName
        enum role
        boolean isActive
        boolean emailVerified
        datetime createdAt
        datetime updatedAt
        datetime lastLoginAt
    }
    
    OTPChallenge {
        uuid id PK
        uuid userId FK
        string codeHash
        datetime expiresAt
        datetime usedAt
        int attempts
        string ipAddress
        string userAgent
        datetime createdAt
    }
    
    Device {
        uuid id PK
        uuid userId FK
        string deviceFingerprint
        string userAgent
        string ipAddress
        boolean isKnown
        datetime firstSeenAt
        datetime lastSeenAt
        int loginCount
    }
    
    AuthenticationEvent {
        uuid id PK
        uuid userId FK
        enum eventType
        boolean success
        string ipAddress
        string userAgent
        uuid deviceId FK
        decimal riskScore
        enum riskLevel
        enum accessDecision
        string failureReason
        datetime createdAt
    }
    
    RiskAssessment {
        uuid id PK
        uuid userId FK
        uuid authEventId FK
        decimal riskScore
        enum riskLevel
        decimal mlProbability
        int ruleBasedScore
        enum accessDecision
        json explanation
        json features
        string modelVersion
        datetime createdAt
    }
    
    AccessDecision {
        uuid id PK
        uuid userId FK
        uuid riskAssessmentId FK
        enum decision
        string policyVersion
        json evidence
        string explanation
        datetime createdAt
    }
    
    SecurityAuditLog {
        uuid id PK
        uuid userId FK
        string eventType
        string action
        string resourceType
        string resourceId
        string ipAddress
        string userAgent
        json metadata
        enum severity
        datetime createdAt
    }
    
    RiskPolicy {
        uuid id PK
        string name
        string description
        json thresholds
        json weights
        boolean isActive
        int version
        datetime createdAt
        datetime updatedAt
        uuid updatedBy FK
    }
    
    SessionRevocation {
        uuid id PK
        string tokenJti UK
        uuid userId FK
        datetime revokedAt
        string reason
    }
    
    BehavioralEvent {
        uuid id PK
        uuid userId FK
        string eventType
        json metadata
        string ipAddress
        string userAgent
        datetime createdAt
        decimal anomalyScore
    }
    
    User ||--o{ OTPChallenge : "has"
    User ||--o{ Device : "has"
    User ||--o{ AuthenticationEvent : "has"
    User ||--o{ RiskAssessment : "has"
    User ||--o{ AccessDecision : "has"
    User ||--o{ SecurityAuditLog : "creates"
    User ||--o{ SessionRevocation : "revokes"
    User ||--o{ BehavioralEvent : "generates"
    AuthenticationEvent ||--o| Device : "uses"
    RiskAssessment ||--o| AuthenticationEvent : "for"
    AccessDecision ||--|| RiskAssessment : "based on"
```

---

## Security Layers

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| Transport | TLS (Vercel/Render auto) | Encrypt all traffic |
| Authentication | bcrypt (12 rounds) | Secure password storage |
| Session | JWT + HttpOnly Cookie | Tamper-proof session |
| Session Revocation | JTI blocklist in DB | Invalidate specific sessions |
| API Authorization | JWT middleware | Protect authenticated routes |
| Role Authorization | Admin middleware | Protect admin routes |
| MFA | Email OTP (bcrypt hashed) | Step-up verification |
| Rate Limiting | express-rate-limit | Prevent brute-force |
| Input Validation | Zod schemas | Prevent injection |
| Security Headers | Helmet.js | Prevent XSS, clickjacking |
| CORS | Configured origin whitelist | Prevent CSRF |
| Audit Trail | SecurityAuditLog | Forensic capability |
| ML Service | Internal API key | Prevent public access |

---

## ML Service Architecture

### Feature Engineering

Features extracted at login time from server-side context:

| Feature | Type | Range | Description |
|---------|------|-------|-------------|
| `device_known` | bool | 0/1 | Device fingerprint in user's known devices |
| `ip_known` | bool | 0/1 | IP address seen before for this user |
| `recent_failed_attempts` | int | 0-50 | Failed login attempts in last hour |
| `login_hour` | int | 0-23 | Hour of login in UTC |
| `time_since_last_login` | float | 0-8760 | Hours since last successful login |
| `device_changed` | bool | 0/1 | Device different from last login |
| `ip_changed` | bool | 0/1 | IP different from last login |
| `login_frequency` | float | 0-100 | Average logins per day (30-day window) |
| `is_off_hours` | bool | 0/1 | Login between 23:00-05:00 UTC |
| `failed_to_success_ratio` | float | 0-1 | Recent failure rate |

### Hybrid Scoring Formula

```
ml_contribution = ml_probability × 40          # ML provides up to 40 points
rule_contribution = rule_score × 0.6           # Rules provide up to 60 points
hybrid_score = clamp(ml_contribution + rule_contribution, 0, 100)
```

### Synthetic Data Disclaimer

> ⚠️ **Important**: The Random Forest model is trained on synthetic data generated by `generate_dataset.py`. This data uses statistical distributions designed to distinguish "normal" from "suspicious" logins for demonstration purposes. The model's performance metrics (accuracy, F1, ROC-AUC) are measured on a held-out portion of the same synthetic dataset and do not represent real-world attack-detection capability. A production deployment should be retrained on real labeled authentication data.

---

## Behavioral Anomaly Detection (Extension)

The Isolation Forest–based behavioral anomaly detection module is designed for Phase 7 and may be incomplete in the current version.

**Planned features:**
- Per-user Isolation Forest trained on behavioral event sequences
- 30-minute correlation window for suspicious activity clustering
- Anomaly score contribution to hybrid risk scoring
- Configurable sensitivity threshold

**Current status**: See `services/risk-engine/behavioral_engine.py` if present, or documented as a future enhancement.

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel Edge Network                       │
│                    React SPA (apps/web)                          │
│              VITE_API_URL → Render Express service               │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Render Web Service                             │
│                  Express API (apps/api)                           │
│          DATABASE_URL → Managed PostgreSQL                        │
│          ML_SERVICE_URL → Render Python service                   │
│          (ML service URL not exposed to browser)                  │
└──────────────┬────────────────────────────┬───────────────────────┘
               │ Internal                    │
               ▼                            ▼
┌──────────────────────┐     ┌──────────────────────────────────┐
│  Render Web Service  │     │     Managed PostgreSQL            │
│  Flask ML Engine     │     │     (Render / Neon / Supabase)   │
│  (private endpoint)  │     └──────────────────────────────────┘
└──────────────────────┘
```

---

*Last updated: 2026-10-29*
