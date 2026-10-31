import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Home, ShieldX } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export const AccessDeniedPage: React.FC = () => {
  const location = useLocation();
  const reason =
    (location.state as any)?.reason ||
    'Your request was evaluated as critical security risk and blocked by continuous Zero-Trust policy.';
  const riskScore = (location.state as any)?.riskScore;

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-rose-500/40 bg-navy-850/90 shadow-glass text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto mb-5 shadow-rose-950/50">
          <ShieldX className="w-8 h-8" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
          Access Policy Violation (403)
        </span>

        <h1 className="text-2xl font-bold text-white mt-4">Access Denied by Policy</h1>

        <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">{reason}</p>

        {riskScore !== undefined && (
          <div className="mt-4 p-3 rounded-xl bg-navy-900 border border-rose-500/20 inline-block font-mono text-xs text-rose-300">
            Calculated Risk Factor: <strong>{riskScore} / 100</strong>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/login" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              className="w-full"
            >
              Back to Login
            </Button>
          </Link>
          <Link to="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Home className="w-3.5 h-3.5" />}
              className="w-full"
            >
              Platform Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default AccessDeniedPage;
