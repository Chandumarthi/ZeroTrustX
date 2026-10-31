import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, LogIn, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success, warning, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please provide a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      // Check if adaptive risk engine triggered a STEP_UP OTP challenge
      if (response.requiresOTP && response.challengeId) {
        warning(
          'Adaptive Risk Engine triggered a step-up verification challenge.',
          'Security Challenge Required'
        );
        navigate('/verify-otp', {
          state: {
            challengeId: response.challengeId,
            emailMasked: response.emailMasked || formData.email,
            email: formData.email,
            decision: response.decision || 'STEP_UP',
            riskAssessment: response.riskAssessment,
          },
        });
        return;
      }

      // Check if access was blocked by risk engine
      if (response.decision === 'BLOCK') {
        navigate('/access-denied', {
          state: {
            reason: response.message || 'High behavioral risk detected.',
            riskScore: response.riskAssessment?.riskScore,
          },
        });
        return;
      }

      success('Authentication verified successfully.', 'Access Granted');
      const origin = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(origin, { replace: true });
    } catch (err: any) {
      const msg = err.message || 'Invalid credentials or access rejected by policy.';
      if (err.status === 403 || err.code === 'ACCESS_BLOCKED') {
        navigate('/access-denied', { state: { reason: msg } });
        return;
      }
      setServerError(msg);
      toastError(msg, 'Authentication Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full border-slate-750 bg-navy-850/80 shadow-glass">
      <CardHeader className="text-center pb-2">
        <div className="w-12 h-12 rounded-2xl bg-cyber-500/10 border border-cyber-400/30 flex items-center justify-center text-cyber-400 mx-auto mb-3 shadow-cyber-sm">
          <LogIn className="w-6 h-6" />
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold text-white">Sign In to ZeroTrustX</CardTitle>
        <CardDescription>
          Continuous contextual risk verification protects your session
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        {serverError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Work Email"
            name="email"
            type="email"
            placeholder="admin@zerotrust-x.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
            disabled={isSubmitting}
            required
          />

          <Input
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-slate-200 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            autoComplete="current-password"
            disabled={isSubmitting}
            required
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-4 h-4 rounded border-slate-700 bg-navy-800 text-cyber-500 focus:ring-cyber-400 focus:ring-offset-navy-900"
              />
              <span>Remember this trusted device</span>
            </label>

            <span className="text-slate-500 text-[11px] cursor-not-allowed" title="Contact administrator for password resets">
              Forgot password?
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-2"
            isLoading={isSubmitting}
          >
            Authenticate & Verify
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an enterprise account?{' '}
          <Link to="/register" className="text-cyber-400 hover:text-cyber-300 font-semibold underline underline-offset-4">
            Register here
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginPage;
