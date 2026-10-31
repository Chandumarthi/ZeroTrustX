/**
 * ZeroTrustX - Core TypeScript Type Definitions
 */

export type UserRole = 'USER' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type AccessDecision = 'ALLOW' | 'STEP_UP' | 'RESTRICT' | 'BLOCK';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EventOutcome = 'SUCCESS' | 'FAILURE' | 'CHALLENGE';

export type SeverityLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  mfaEnabled?: boolean;
}

export interface RiskFactors {
  ipRisk: number;
  deviceRisk: number;
  locationRisk: number;
  timeRisk: number;
  behavioralRisk: number;
  [key: string]: number;
}

export interface RiskAssessment {
  id: string;
  userId?: string;
  riskScore: number; // 0 to 100
  riskLevel: RiskLevel;
  decision: AccessDecision;
  mlProbability: number; // 0.0 to 1.0
  ruleViolations: string[];
  factors: RiskFactors;
  explanation: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface RecognizedDevice {
  id: string;
  userId: string;
  deviceId: string;
  deviceName?: string;
  browser: string;
  os: string;
  ip: string;
  isTrusted: boolean;
  lastSeenAt: string;
  createdAt: string;
}

export interface AuthEvent {
  id: string;
  userId?: string;
  userEmail: string;
  userName?: string;
  eventType: 
    | 'LOGIN_ATTEMPT'
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILURE'
    | 'OTP_SENT'
    | 'OTP_VERIFIED'
    | 'OTP_FAILED'
    | 'PASSWORD_RESET'
    | 'ACCESS_DENIED'
    | 'STEP_UP_CHALLENGE'
    | 'LOGOUT'
    | 'SESSION_TIMEOUT';
  ipAddress: string;
  userAgent: string;
  location?: string;
  device?: RecognizedDevice;
  riskScore: number;
  riskLevel: RiskLevel;
  decision: AccessDecision;
  outcome: EventOutcome;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  category: string;
  severity: SeverityLevel;
  ipAddress: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface OTPChallenge {
  challengeId: string;
  emailMasked: string;
  expiresInSeconds: number;
  canResendAfterSeconds: number;
}

export interface AuthResponse {
  user?: User;
  token?: string;
  requiresOTP?: boolean;
  challengeId?: string;
  emailMasked?: string;
  expiresInSeconds?: number;
  riskAssessment?: RiskAssessment;
  decision?: AccessDecision;
  message?: string;
}

export interface SecurityAlert {
  id: string;
  title: string;
  message: string;
  severity: SeverityLevel;
  timestamp: string;
  read: boolean;
}

export interface UserProfileResponse {
  user: User;
  recognizedDevices: RecognizedDevice[];
  recentAssessments: RiskAssessment[];
  stats: {
    totalLogins: number;
    failedLogins: number;
    lastRiskScore: number;
    accountAgeDays: number;
  };
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  successfulLogins: number;
  failedLogins: number;
  suspiciousEvents: number;
  highRiskEvents: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  decisionDistribution: {
    allow: number;
    stepUp: number;
    restrict: number;
    block: number;
  };
  activityTimeline: Array<{
    date: string;
    success: number;
    failure: number;
    challenge: number;
    avgRisk?: number;
  }>;
  recentEvents: AuthEvent[];
}

export interface RiskPolicy {
  id: string;
  name: string;
  description: string;
  lowThreshold: number;
  mediumThreshold: number;
  highThreshold: number;
  defaultDecision: AccessDecision;
  isEnabled: boolean;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    timestamp?: string;
    requestId?: string;
    [key: string]: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
}
