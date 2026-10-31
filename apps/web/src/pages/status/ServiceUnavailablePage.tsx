import React from 'react';
import { RotateCw, ServerCrash } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export const ServiceUnavailablePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-rose-500/30 bg-navy-850/90 shadow-glass text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-5 shadow-rose-950/40">
          <ServerCrash className="w-8 h-8" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
          Service Outage (503)
        </span>

        <h1 className="text-2xl font-bold text-white mt-4">Security Cluster Offline</h1>

        <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
          The ZeroTrustX AI risk engine or backend cluster is currently undergoing maintenance or unavailable. Requests are queued.
        </p>

        <div className="mt-8 flex items-center justify-center">
          <Button
            variant="primary"
            size="md"
            onClick={() => window.location.reload()}
            leftIcon={<RotateCw className="w-4 h-4" />}
          >
            Retry Connection
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ServiceUnavailablePage;
