import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-slate-750 bg-navy-850/90 shadow-glass text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-cyber-500/10 border border-cyber-400/30 flex items-center justify-center text-cyber-400 mx-auto mb-5 shadow-cyber-sm">
          <Compass className="w-8 h-8" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-widest text-cyber-400 bg-cyber-500/10 px-3 py-1 rounded-full border border-cyber-400/20">
          Resource Missing (404)
        </span>

        <h1 className="text-2xl font-bold text-white mt-4">Endpoint Not Found</h1>

        <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
          The security checkpoint or route you requested does not exist or may have been relocated within the trust topology.
        </p>

        <div className="mt-8 flex items-center justify-center">
          <Link to="/">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Home className="w-4 h-4" />}
            >
              Return Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default NotFoundPage;
