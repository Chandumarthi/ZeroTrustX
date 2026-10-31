import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { AuthResponse, User } from '../types';
import authService, { LoginPayload, RegisterPayload, VerifyOTPPayload } from '../services/auth.service';
import { clearAuthToken, getAuthToken, setAuthToken } from '../utils/api';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<{ user: User }>;
  verifyOTP: (payload: VerifyOTPPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.getMe();
      if (response.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
        clearAuthToken();
      }
    } catch {
      setUser(null);
      clearAuthToken();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (payload: LoginPayload): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.login(payload);
      const resAny = response as any;
      const data = resAny?.data || resAny;
      const token = data?.token || data?.tokens?.accessToken || resAny?.token;
      const user = data?.user || resAny?.user;

      if (token && user) {
        setAuthToken(token);
        setUser(user);
      }

      return {
        ...data,
        requiresOTP: resAny?.requiresOTP ?? data?.requiresOTP ?? false,
        challengeId: resAny?.challengeId ?? data?.challengeId,
        decision: resAny?.accessDecision ?? resAny?.decision ?? data?.accessDecision ?? data?.decision,
        riskAssessment: resAny?.risk ?? data?.risk ?? data?.riskAssessment,
        token,
        user,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<{ user: User }> => {
    setIsLoading(true);
    try {
      const response = await authService.register(payload);
      const resAny = response as any;
      return resAny?.data || resAny;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (payload: VerifyOTPPayload): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.verifyOTP(payload);
      const resAny = response as any;
      const data = resAny?.data || resAny;
      const token = data?.token || data?.tokens?.accessToken || resAny?.token;
      const user = data?.user || resAny?.user;

      if (token && user) {
        setAuthToken(token);
        setUser(user);
      }

      return {
        ...data,
        token,
        user,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAuthToken();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      verifyOTP,
      logout,
      refreshUser,
      setUser,
    }),
    [user, isLoading, login, register, verifyOTP, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
