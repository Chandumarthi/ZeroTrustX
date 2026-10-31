import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Shield, Sparkles } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-navy-900 text-slate-100 overflow-hidden">
      {/* Background ambient glowing spheres */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-cyber-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[140px]" />

      {/* Cyber grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
        aria-hidden="true"
      />

      {/* Top Header / Branding */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500/20 to-blue-600/20 border border-cyber-400/40 flex items-center justify-center text-cyber-400 group-hover:shadow-cyber-md transition-all duration-300">
            <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-wider text-slate-100 font-mono flex items-center gap-1.5">
              ZEROTRUST<span className="text-cyber-400">X</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
              Adaptive Security Platform
            </span>
          </div>
        </Link>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-navy-800/60 border border-slate-750 px-3 py-1.5 rounded-full backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyber-400" />
          <span>Continuous Contextual Risk Verification</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 gap-2">
        <p>© {new Date().getFullYear()} ZeroTrustX. All rights reserved.</p>
        <p className="flex items-center gap-2">
          <span>Enterprise Adaptive Authentication</span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span>Zero-Trust Architecture</span>
        </p>
      </footer>
    </div>
  );
};

export default AuthLayout;
