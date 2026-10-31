import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-slate-750 bg-navy-850/90 shadow-glass text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto mb-5 shadow-violet-950/50">
          <Lock className="w-8 h-8" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
          Privilege Limitation (401/403)
        </span>

        <h1 className="text-2xl font-bold text-white mt-4">Unauthorized Clearance</h1>

        <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
          Your account does not possess administrative clearance or the necessary role assignment to view this enclave.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/dashboard">
            <Button
              variant="primary"
              size="md"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Return to User Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default UnauthorizedPage;
