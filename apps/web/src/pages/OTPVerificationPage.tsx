import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, KeySquare, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import authService from '../services/auth.service';
import Button from '../components/ui/Button';
import OTPInput from '../components/ui/OTPInput';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

export const OTPVerificationPage: React.FC = () => {
  const { verifyOTP } = useAuth();
  const { success, error: toastError, info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    challengeId?: string;
    emailMasked?: string;
    email?: string;
    riskAssessment?: any;
    decision?: string;
  } | null;

  const [currentChallengeId, setCurrentChallengeId] = useState<string | undefined>(state?.challengeId);
  const emailMasked = state?.emailMasked || 'your registered email';

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 5-minute expiry timer (300 seconds)
  const [expiresIn, setExpiresIn] = useState(300);
  // 60-second cooldown for resend button
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    if (!currentChallengeId) {
      toastError('No active challenge found. Please sign in again.', 'Invalid Session');
      navigate('/login');
    }
  }, [currentChallengeId, navigate, toastError]);

  // Expiry countdown timer
  useEffect(() => {
    if (expiresIn <= 0) return;
    const interval = setInterval(() => {
      setExpiresIn((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresIn]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length < 6 || !currentChallengeId) return;

    if (expiresIn <= 0) {
      setErrorMessage('The verification code has expired. Please request a new one.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      await verifyOTP({ challengeId: currentChallengeId, otp: code });
      success('Multi-factor identity verified successfully!', 'Access Granted');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.message || 'Invalid or expired OTP code.';
      setErrorMessage(msg);
      toastError(msg, 'Verification Failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !currentChallengeId) return;

    setIsResending(true);
    setErrorMessage(null);

    try {
      const res = await authService.resendOTP({ challengeId: currentChallengeId });
      const resAny = res as any;
      const newId = resAny?.challengeId || resAny?.data?.challengeId;
      if (newId) {
        setCurrentChallengeId(newId);
      }
      info(resAny?.message || 'A new 6-digit verification code was dispatched.', 'Code Resent');
      setResendCooldown(60);
      setExpiresIn(300);
      setOtp('');
    } catch (err: any) {
      const msg = err.message || 'Failed to resend code. Please try again.';
      setErrorMessage(msg);
      toastError(msg, 'Resend Failed');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full border-slate-750 bg-navy-850/80 shadow-glass">
      <CardHeader className="text-center pb-2">
        <div className="w-12 h-12 rounded-2xl bg-cyber-500/10 border border-cyber-400/30 flex items-center justify-center text-cyber-400 mx-auto mb-3 shadow-cyber-sm">
          <KeySquare className="w-6 h-6" />
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold text-white">Step-Up Verification</CardTitle>
        <CardDescription>
          Enter the 6-digit verification code sent to{' '}
          <strong className="text-slate-200 font-mono">{emailMasked}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Adaptive reason alert */}
        <div className="mb-5 p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyber-400" />
          <div className="leading-relaxed">
            <span className="font-semibold text-white">Adaptive Security Policy:</span>{' '}
            Elevated risk or an unrecognized device was detected for this session. A secondary proof of identity is required.
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-6">
          <OTPInput
            length={6}
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (errorMessage) setErrorMessage(null);
            }}
            onComplete={(val) => handleVerify(val)}
            hasError={!!errorMessage}
            disabled={isVerifying || expiresIn <= 0}
          />

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyber-400" />
              <span>
                Expires in:{' '}
                <strong className={expiresIn <= 30 ? 'text-rose-400 font-mono' : 'text-slate-200 font-mono'}>
                  {formatTime(expiresIn)}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending}
              className="inline-flex items-center gap-1.5 text-cyber-400 hover:text-cyber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={isResending ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />
              <span>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </span>
            </button>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full"
            disabled={otp.length !== 6 || expiresIn <= 0}
            isLoading={isVerifying}
            onClick={() => handleVerify()}
          >
            Verify & Continue
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Login</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OTPVerificationPage;
