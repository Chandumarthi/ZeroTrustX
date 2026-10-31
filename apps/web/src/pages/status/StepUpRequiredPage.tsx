import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, KeySquare } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export const StepUpRequiredPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-sky-500/40 bg-navy-850/90 shadow-glass text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mx-auto mb-5 shadow-sky-950/50">
          <KeySquare className="w-8 h-8" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-widest text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
          Elevation Required
        </span>

        <h1 className="text-2xl font-bold text-white mt-4">Step-Up Challenge Required</h1>

        <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
          The action you are attempting requires elevated verification privileges due to continuous risk policies. Please verify your identity via secondary credentials.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/login">
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Authenticate Identity
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default StepUpRequiredPage;
