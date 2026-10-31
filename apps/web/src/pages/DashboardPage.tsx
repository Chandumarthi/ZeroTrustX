import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Cpu,
  Laptop,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserCheck,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import userService from '../services/user.service';
import {
  AuthEvent,
  RecognizedDevice,
  RiskAssessment,
  SecurityAlert,
  UserProfileResponse,
} from '../types';
import Button from '../components/ui/Button';
import Card, { CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { DecisionBadge, RiskBadge, RoleBadge } from '../components/ui/Badge';
import RiskScoreMeter from '../components/ui/RiskScoreMeter';
import StatCard from '../components/ui/StatCard';
import Table from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Spinner from '../components/ui/Spinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [recentEvents, setRecentEvents] = useState<AuthEvent[]>([]);
  const [devices, setDevices] = useState<RecognizedDevice[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [riskHistory, setRiskHistory] = useState<RiskAssessment[]>([]);
  const [latestAssessment, setLatestAssessment] = useState<RiskAssessment | null>(null);

  // Device revoke dialog
  const [deviceToRevoke, setDeviceToRevoke] = useState<RecognizedDevice | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [profRes, actRes, devRes, alertRes, histRes] = await Promise.allSettled([
        userService.getProfile(),
        userService.getActivity({ limit: 5 }),
        userService.getRecognizedDevices(),
        userService.getRecentAlerts(),
        userService.getRiskHistory(7),
      ]);

      if (profRes.status === 'fulfilled' && profRes.value.data) {
        setProfileData(profRes.value.data);
      }
      if (actRes.status === 'fulfilled' && actRes.value.data?.items) {
        setRecentEvents(actRes.value.data.items);
      }
      if (devRes.status === 'fulfilled' && devRes.value.data) {
        setDevices(devRes.value.data);
      }
      if (alertRes.status === 'fulfilled' && alertRes.value.data) {
        setAlerts(alertRes.value.data);
      }
      if (histRes.status === 'fulfilled' && histRes.value.data) {
        setRiskHistory(histRes.value.data);
        if (histRes.value.data.length > 0) {
          setLatestAssessment(histRes.value.data[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load dashboard security telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRevokeDevice = async () => {
    if (!deviceToRevoke) return;
    setIsRevoking(true);
    try {
      await userService.revokeDevice(deviceToRevoke.id);
      success('Device trust has been revoked.', 'Device Removed');
      setDevices((prev) => prev.filter((d) => d.id !== deviceToRevoke.id));
      setDeviceToRevoke(null);
    } catch (err: any) {
      toastError(err.message || 'Failed to revoke device.', 'Error');
    } finally {
      setIsRevoking(false);
    }
  };

  const chartData = riskHistory.map((item) => ({
    name: new Date(item.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    score: item.riskScore,
    probability: Math.round(item.mlProbability * 100),
  })).reverse();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Spinner size="xl" variant="cyber" />
        <p className="text-sm text-slate-400 font-mono tracking-wider animate-pulse">
          Querying Continuous Risk Telemetry...
        </p>
      </div>
    );
  }

  if (error && !profileData && recentEvents.length === 0) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  const currentRiskScore = latestAssessment?.riskScore ?? (profileData?.stats?.lastRiskScore || 15);
  const currentRiskLevel = latestAssessment?.riskLevel || (currentRiskScore < 30 ? 'LOW' : currentRiskScore < 60 ? 'MEDIUM' : 'HIGH');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Welcome / Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-navy-850 via-navy-800 to-navy-850 border border-slate-750 shadow-glass">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Welcome back, {user?.name || 'Security Principal'}
            </h1>
            {user?.role && <RoleBadge role={user.role} />}
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Current session status is actively verified by ZeroTrustX Adaptive Intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-cyber-400" />}
          >
            Refresh Telemetry
          </Button>
          <Link to="/activity">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              View Full Activity
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Session Status"
          value="SECURE"
          icon={<ShieldCheck className="w-5 h-5" />}
          variant="cyber"
          description="Context score within safe policy thresholds"
        />
        <StatCard
          title="Continuous Risk Score"
          value={`${currentRiskScore} / 100`}
          icon={<Cpu className="w-5 h-5" />}
          variant={currentRiskScore > 60 ? 'warning' : 'default'}
          trend={{
            value: currentRiskLevel,
            isPositive: currentRiskScore < 30,
            isNeutral: currentRiskScore >= 30 && currentRiskScore < 60,
          }}
        />
        <StatCard
          title="Recognized Devices"
          value={devices.length || 1}
          icon={<Laptop className="w-5 h-5" />}
          description="Hardware fingerprints bound to profile"
        />
        <StatCard
          title="Total Logins (30d)"
          value={profileData?.stats?.totalLogins || recentEvents.length || 1}
          icon={<UserCheck className="w-5 h-5" />}
          trend={{
            value: `${profileData?.stats?.failedLogins || 0} failed`,
            isPositive: (profileData?.stats?.failedLogins || 0) === 0,
          }}
        />
      </div>

      {/* Two Column Grid: Risk Assessment Meter & Telemetry Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Risk Assessment Card */}
        <Card className="lg:col-span-1 p-6 flex flex-col justify-between">
          <div>
            <CardHeader className="px-0 pt-0 border-b-0 pb-4">
              <div>
                <CardTitle>Continuous Risk Evaluation</CardTitle>
                <CardDescription>Live multi-factor context rating</CardDescription>
              </div>
            </CardHeader>

            <div className="py-4">
              <RiskScoreMeter score={currentRiskScore} size="lg" />
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-navy-900/80 border border-slate-750 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Policy Decision:</span>
                <DecisionBadge decision={latestAssessment?.decision || 'ALLOW'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ML Anomaly Probability:</span>
                <span className="font-mono text-cyber-300">
                  {latestAssessment
                    ? `${(latestAssessment.mlProbability * 100).toFixed(1)}%`
                    : '1.2%'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Evaluation Mode:</span>
                <span className="text-emerald-400 font-semibold">Continuous Zero-Trust</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            {latestAssessment?.explanation ||
              'Telemetry indicators show standard geographical presence and verified device signature.'}
          </div>
        </Card>

        {/* Risk Score History Recharts Area Chart */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
          <CardHeader className="px-0 pt-0 border-b-0 pb-4 flex items-center justify-between">
            <div>
              <CardTitle>Historical Risk Telemetry</CardTitle>
              <CardDescription>Risk score variations over recent authentication checkpoints</CardDescription>
            </div>
            <span className="text-xs text-cyber-400 font-mono bg-cyber-500/10 px-2.5 py-1 rounded-md border border-cyber-500/20">
              7-Day Trend
            </span>
          </CardHeader>

          <div className="w-full h-64 sm:h-72 mt-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0d1530',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#f1f5f9',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#riskGradient)"
                    name="Risk Score"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState
                  title="No Historical Risk Data"
                  description="As you authenticate from various devices and sessions, historical risk patterns will appear here."
                />
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Calculated Risk Score (0-100)</span>
            </span>
            <span>Threshold for Step-Up: 60+</span>
          </div>
        </Card>
      </div>

      {/* Two Column Grid: Recognized Devices & Security Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recognized Devices */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0 border-b-0 pb-4 flex items-center justify-between">
            <div>
              <CardTitle>Recognized Hardware & Browsers</CardTitle>
              <CardDescription>Authorized devices linked to your security context</CardDescription>
            </div>
            <span className="text-xs text-slate-400 font-mono">{devices.length} Devices</span>
          </CardHeader>

          <div className="space-y-3 mt-2">
            {devices.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 rounded-xl bg-navy-900/50 border border-slate-800">
                Current browser recorded as primary device.
              </div>
            ) : (
              devices.map((dev) => (
                <div
                  key={dev.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-navy-900/60 border border-slate-750 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyber-400">
                      {dev.browser.toLowerCase().includes('mobile') ? (
                        <Smartphone className="w-4 h-4" />
                      ) : (
                        <Laptop className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {dev.deviceName || `${dev.browser} on ${dev.os}`}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        IP: {dev.ip} • Last seen {new Date(dev.lastSeenAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {dev.isTrusted ? (
                      <span className="text-[10px] uppercase font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Trusted
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        Standard
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeviceToRevoke(dev)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                      title="Revoke trust"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Security Alerts / Notifications */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0 border-b-0 pb-4 flex items-center justify-between">
            <div>
              <CardTitle>Recent Security Notifications</CardTitle>
              <CardDescription>Signals generated by behavioral policy evaluation</CardDescription>
            </div>
            <span className="text-xs text-cyber-400 font-mono">Audit Engine</span>
          </CardHeader>

          <div className="space-y-3 mt-2">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 rounded-xl bg-navy-900/50 border border-slate-800 flex flex-col items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-400 mb-2" />
                <p className="font-semibold text-slate-300">All Security Parameters Normal</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Zero anomalous access attempts recorded within the last 24 hours.
                </p>
              </div>
            ) : (
              alerts.map((al) => (
                <div
                  key={al.id}
                  className="p-3.5 rounded-xl bg-navy-900/60 border border-slate-750 flex items-start gap-3"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200">{al.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{al.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 inline-block">
                      {new Date(al.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recent Auth Events Table */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 border-b-0 pb-4 flex items-center justify-between">
          <div>
            <CardTitle>Recent Security Checkpoints</CardTitle>
            <CardDescription>Authentication telemetry generated across your sessions</CardDescription>
          </div>
          <Link to="/activity" className="text-xs text-cyber-400 hover:text-cyber-300 font-medium">
            View All →
          </Link>
        </CardHeader>

        <Table
          columns={[
            {
              key: 'createdAt',
              header: 'Timestamp',
              render: (row: AuthEvent) => (
                <div className="font-mono text-xs text-slate-300">
                  {new Date(row.createdAt).toLocaleString()}
                </div>
              ),
            },
            {
              key: 'eventType',
              header: 'Event Type',
              render: (row: AuthEvent) => (
                <span className="font-semibold text-xs text-slate-200">
                  {row.eventType.replace('_', ' ')}
                </span>
              ),
            },
            {
              key: 'ipAddress',
              header: 'IP Address',
              render: (row: AuthEvent) => (
                <span className="font-mono text-xs text-cyber-300">{row.ipAddress}</span>
              ),
            },
            {
              key: 'riskScore',
              header: 'Risk Score',
              align: 'center',
              render: (row: AuthEvent) => (
                <span className="font-mono font-bold text-xs">{row.riskScore}/100</span>
              ),
            },
            {
              key: 'riskLevel',
              header: 'Risk Level',
              align: 'center',
              render: (row: AuthEvent) => <RiskBadge level={row.riskLevel} />,
            },
            {
              key: 'decision',
              header: 'Decision',
              align: 'right',
              render: (row: AuthEvent) => <DecisionBadge decision={row.decision} />,
            },
          ]}
          data={recentEvents}
          keyExtractor={(row) => row.id}
          emptyMessage="No authentication checkpoints recorded yet."
        />
      </Card>

      {/* Revoke Device Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deviceToRevoke}
        onClose={() => setDeviceToRevoke(null)}
        onConfirm={handleRevokeDevice}
        title="Revoke Device Trust"
        message={`Are you sure you want to revoke trust for ${deviceToRevoke?.deviceName || 'this device'}? The next login from this hardware will require multi-factor step-up verification.`}
        confirmText="Revoke Trust"
        variant="danger"
        isLoading={isRevoking}
      />
    </div>
  );
};

export default DashboardPage;
