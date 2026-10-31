import api from '../utils/api';
import {
  ApiResponse,
  AuthEvent,
  PaginatedResponse,
  RecognizedDevice,
  RiskAssessment,
  SecurityAlert,
  UserProfileResponse,
} from '../types';

export interface ActivityFilterParams {
  page?: number;
  limit?: number;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const userService = {
  async getProfile(): Promise<ApiResponse<UserProfileResponse>> {
    return await api.get<UserProfileResponse>('/user/profile');
  },

  async getActivity(
    params?: ActivityFilterParams
  ): Promise<ApiResponse<PaginatedResponse<AuthEvent>>> {
    return await api.get<PaginatedResponse<AuthEvent>>('/user/activity', params);
  },

  async getRecognizedDevices(): Promise<ApiResponse<RecognizedDevice[]>> {
    return await api.get<RecognizedDevice[]>('/user/devices');
  },

  async revokeDevice(deviceId: string): Promise<ApiResponse<{ message: string }>> {
    return await api.delete<{ message: string }>(`/user/devices/${deviceId}`);
  },

  async getRecentAlerts(): Promise<ApiResponse<SecurityAlert[]>> {
    return await api.get<SecurityAlert[]>('/user/alerts');
  },

  async getRiskHistory(days: number = 14): Promise<ApiResponse<RiskAssessment[]>> {
    return await api.get<RiskAssessment[]>('/user/risk-history', { days });
  },

  async getLatestAssessment(): Promise<ApiResponse<RiskAssessment>> {
    return await api.get<RiskAssessment>('/user/latest-assessment');
  },
};

export default userService;
