import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import { AuthContext, AuthContextType } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';

const mockLogin = vi.fn();

const mockAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isAdmin: false,
  login: mockLogin,
  register: vi.fn(),
  verifyOTP: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
  setUser: vi.fn(),
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <AuthContext.Provider value={mockAuthContext}>{ui}</AuthContext.Provider>
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form elements correctly', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('heading', { name: /sign in to zerotrustx/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /authenticate & verify/i })).toBeInTheDocument();
  });

  it('validates email format before submitting', async () => {
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/work email/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const submitButton = screen.getByRole('button', { name: /authenticate & verify/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email-format' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please provide a valid email address/i)).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('submits valid credentials and calls login service', async () => {
    mockLogin.mockResolvedValueOnce({
      user: { id: 'user-1', email: 'admin@zerotrust-x.com', name: 'Admin', role: 'ADMIN', status: 'ACTIVE' },
      token: 'jwt-token-xyz',
    });

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/work email/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const submitButton = screen.getByRole('button', { name: /authenticate & verify/i });

    fireEvent.change(emailInput, { target: { value: 'admin@zerotrust-x.com' } });
    fireEvent.change(passwordInput, { target: { value: 'SuperSecret123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'admin@zerotrust-x.com',
        password: 'SuperSecret123!',
        rememberMe: false,
      });
    });
  });
});
