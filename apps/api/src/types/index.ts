export type Role = 'USER' | 'ADMIN';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AccessDecisionType = 'ALLOW' | 'STEP_UP_VERIFICATION' | 'RESTRICT' | 'BLOCK';
export type SeverityLevel = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AuthEventType =
  | 'LOGIN_ATTEMPT'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'OTP_REQUESTED'
  | 'OTP_VERIFIED'
  | 'OTP_FAILED'
  | 'OTP_EXPIRED'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_CHANGE'
  | 'ADMIN_ACTION'
  | 'STEP_UP_REQUIRED'
  | 'ACCESS_DENIED'
  | 'SESSION_EXPIRED';

export interface UserPayload {
  id: string;
  email: string;
  role: Role;
  jti: string;
}

export interface RiskFeatures {
  userId: string;
  deviceKnown: boolean;
  ipKnown: boolean;
  recentFailedAttempts: number;
  loginHour: number;
  timeSinceLastLogin: number; // hours
  deviceChanged: boolean;
  loginFrequency: number; // logins per day avg
  ipChanged: boolean;
  userAgent: string;
  ipAddress: string;
}

export interface RiskAssessmentResult {
  riskScore: number;
  riskLevel: RiskLevel;
  mlProbability: number;
  ruleBasedScore: number;
  accessDecision: AccessDecisionType;
  explanation: Record<string, any>;
  features: RiskFeatures;
  modelVersion: string;
  assessmentId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}
