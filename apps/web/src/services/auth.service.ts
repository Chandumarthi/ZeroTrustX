import api, { setAuthToken, clearAuthToken } from '../utils/api';
import { ApiResponse, AuthResponse, User } from '../types';

export interface RegisterPayload {
  name: string;
  fullName?: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface VerifyOTPPayload {
  challengeId: string;
  otp: string;
}

export interface ResendOTPPayload {
  challengeId: string;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<ApiResponse<{ user: User }>> {
    const response = await api.post<{ user: User }>('/auth/register', {
      ...payload,
      fullName: payload.fullName || payload.name,
    });
    return response;
  },

  async login(payload: LoginPayload): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<AuthResponse>('/auth/login', payload);
    const resAny = response as any;
    const token = resAny?.data?.token || resAny?.data?.tokens?.accessToken || resAny?.token;
    if (token) {
      setAuthToken(token);
    }
    return response;
  },

  async verifyOTP(payload: VerifyOTPPayload): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<AuthResponse>('/auth/verify-otp', payload);
    const resAny = response as any;
    const token = resAny?.data?.token || resAny?.data?.tokens?.accessToken || resAny?.token;
    if (token) {
      setAuthToken(token);
    }
    return response;
  },

  async resendOTP(payload: ResendOTPPayload): Promise<ApiResponse<{ message: string; expiresInSeconds: number }>> {
    return await api.post('/auth/resend-otp', payload);
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAuthToken();
    }
  },

  async getMe(): Promise<ApiResponse<{ user: User }>> {
    return await api.get<{ user: User }>('/auth/me');
  },
};

export default authService;
