import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Radio,
  Shield,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../hooks/useAuth';
import RoleBadge from '../components/ui/Badge';

export const DashboardLayout: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
      isActive
        ? 'bg-cyber-500/15 text-cyber-300 border border-cyber-500/30 shadow-cyber-sm'
        : 'text-slate-400 hover:text-slate-100 hover:bg-navy-800/60'
    );

  return (
    <div className="min-h-screen bg-navy-900 text-slate-100 flex flex-col antialiased">
      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-navy-850 border-b border-slate-800 z-40">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyber-500/20 border border-cyber-400/40 flex items-center justify-center text-cyber-400">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold font-mono tracking-wider text-sm">
            ZEROTRUST<span className="text-cyber-400">X</span>
          </span>
        </Link>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for Desktop & Mobile drawer */}
        <aside
          className={clsx(
            'fixed inset-y-0 left-0 z-50 w-64 bg-navy-850/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:static',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-6">
            {/* Brand in Desktop Sidebar */}
            <div className="hidden lg:flex items-center justify-between px-2 pt-2">
              <Link to="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-cyber-500/20 border border-cyber-400/40 flex items-center justify-center text-cyber-400 group-hover:shadow-cyber-sm transition-all">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold font-mono tracking-wider text-base">
                    ZEROTRUST<span className="text-cyber-400">X</span>
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                    Enterprise Edition
                  </span>
                </div>
              </Link>
            </div>

            {/* Continuous Security Verification Live Status */}
            <div className="px-3 py-2.5 rounded-xl bg-navy-800/60 border border-slate-750 flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  Engine Active
                </span>
                <span className="text-[10px] text-slate-400">Continuous Evaluation</span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-6">
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  User Workspace
                </p>
                <div className="space-y-1">
                  <NavLink
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={navItemClass}
                  >
                    <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                    <span>My Dashboard</span>
                  </NavLink>
                  <NavLink
                    to="/activity"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={navItemClass}
                  >
                    <Activity className="w-4 h-4 flex-shrink-0" />
                    <span>Security Activity</span>
                  </NavLink>
                </div>
              </div>

              {/* Admin Menu section */}
              {isAdmin && (
                <div>
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-2 flex items-center justify-between">
                    <span>Admin Center</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300">
                      SEC-OPS
                    </span>
                  </p>
                  <div className="space-y-1">
                    <NavLink
                      to="/admin/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={navItemClass}
                    >
                      <Radio className="w-4 h-4 flex-shrink-0" />
                      <span>Security Overview</span>
                    </NavLink>
                    <NavLink
                      to="/admin/users"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={navItemClass}
                    >
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span>User Management</span>
                    </NavLink>
                    <NavLink
                      to="/admin/audit-logs"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={navItemClass}
                    >
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span>Audit Logs</span>
                    </NavLink>
                    <NavLink
                      to="/admin/risk-events"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={navItemClass}
                    >
                      <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                      <span>High-Risk Events</span>
                    </NavLink>
                  </div>
                </div>
              )}
            </nav>
          </div>

          {/* User Profile bar at bottom */}
          <div className="p-4 border-t border-slate-800/80 bg-navy-900/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-violet-600 flex items-center justify-center font-bold text-sm text-white flex-shrink-0 shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-100 truncate">{user?.name || 'User'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile drawer */}
        {isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-xs z-40 lg:hidden"
            aria-hidden="true"
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar for Desktop */}
          <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-navy-850/60 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Risk Engine Mode:
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Adaptive / Active
              </span>
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-3">
                  <RoleBadge role={user.role} />
                  <div className="relative">
                    <button
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-colors"
                    >
                      <span className="font-medium">{user.name}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {isUserDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 rounded-xl bg-navy-800 border border-slate-700 shadow-glass py-1 z-50">
                        <div className="px-4 py-2 border-b border-slate-700/60">
                          <p className="text-xs text-slate-400">Signed in as</p>
                          <p className="text-xs font-semibold text-slate-200 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-slate-700/50 flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
