import api from '../utils/api';
import {
  AdminDashboardStats,
  ApiResponse,
  AuditLog,
  AuthEvent,
  PaginatedResponse,
  RiskPolicy,
  User,
  UserProfileResponse,
} from '../types';

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  eventType?: string;
  severity?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface RiskEventsQueryParams {
  page?: number;
  limit?: number;
  level?: string;
  minScore?: number;
}

export const adminService = {
  async getDashboard(): Promise<ApiResponse<AdminDashboardStats>> {
    return await api.get<AdminDashboardStats>('/admin/dashboard');
  },

  async getUsers(params?: UserQueryParams): Promise<ApiResponse<PaginatedResponse<User>>> {
    return await api.get<PaginatedResponse<User>>('/admin/users', params);
  },

  async getUserDetails(userId: string): Promise<ApiResponse<UserProfileResponse>> {
    return await api.get<UserProfileResponse>(`/admin/users/${userId}`);
  },

  async updateUserStatus(
    userId: string,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  ): Promise<ApiResponse<User>> {
    return await api.patch<User>(`/admin/users/${userId}/status`, { status });
  },

  async updateUserRole(userId: string, role: 'USER' | 'ADMIN'): Promise<ApiResponse<User>> {
    return await api.patch<User>(`/admin/users/${userId}/role`, { role });
  },

  async getAuditLogs(
    params?: AuditLogQueryParams
  ): Promise<ApiResponse<PaginatedResponse<AuditLog>>> {
    return await api.get<PaginatedResponse<AuditLog>>('/admin/audit-logs', params);
  },

  async getRiskEvents(
    params?: RiskEventsQueryParams
  ): Promise<ApiResponse<PaginatedResponse<AuthEvent>>> {
    return await api.get<PaginatedResponse<AuthEvent>>('/admin/risk-events', params);
  },

  async getRiskPolicies(): Promise<ApiResponse<RiskPolicy[]>> {
    return await api.get<RiskPolicy[]>('/admin/policies');
  },

  async updateRiskPolicy(
    policyId: string,
    data: Partial<RiskPolicy>
  ): Promise<ApiResponse<RiskPolicy>> {
    return await api.put<RiskPolicy>(`/admin/policies/${policyId}`, data);
  },
};

export default adminService;
