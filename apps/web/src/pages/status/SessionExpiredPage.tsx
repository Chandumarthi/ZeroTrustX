import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clock, LogIn } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export const SessionExpiredPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-amber-500/40 bg-navy-850/90 shadow-glass text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-5 shadow-amber-950/50">
          <Clock className="w-8 h-8" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Session Terminated (401)
        </span>

        <h1 className="text-2xl font-bold text-white mt-4">Session Has Expired</h1>

        <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
          In accordance with Zero-Trust continuous validation guidelines, inactive or expired authentication tokens are revoked to prevent session hijacking.
        </p>

        <div className="mt-8 flex items-center justify-center">
          <Link to={`/login?redirect=${encodeURIComponent(redirect)}`}>
            <Button
              variant="primary"
              size="md"
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Sign In Again
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default SessionExpiredPage;
