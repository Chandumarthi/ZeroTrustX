import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertOctagon,
  CheckCircle2,
  FileText,
  Radio,
  RefreshCw,
  ShieldAlert,
  Users,
  XCircle,
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import adminService from '../../services/admin.service';
import { AdminDashboardStats, AuthEvent } from '../../types';
import Button from '../../components/ui/Button';
import Card, { CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import { DecisionBadge, RiskBadge } from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';

const RISK_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];
const DECISION_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444'];

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminService.getDashboard();
      if (res.data) {
        setStats(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch administrative telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Spinner size="xl" variant="cyber" />
        <p className="text-sm text-slate-400 font-mono tracking-wider animate-pulse">
          Aggregating Enterprise Security Operations Telemetry...
        </p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <ErrorState
        title="Admin Telemetry Unavailable"
        message={error || 'Unable to connect to security operations center.'}
        onRetry={fetchDashboardData}
      />
    );
  }

  const riskPieData = [
    { name: 'Low Risk', value: stats.riskDistribution.low },
    { name: 'Medium Risk', value: stats.riskDistribution.medium },
    { name: 'High Risk', value: stats.riskDistribution.high },
    { name: 'Critical Risk', value: stats.riskDistribution.critical },
  ];

  const decisionPieData = [
    { name: 'ALLOW', value: stats.decisionDistribution.allow },
    { name: 'STEP_UP', value: stats.decisionDistribution.stepUp },
    { name: 'RESTRICT', value: stats.decisionDistribution.restrict },
    { name: 'BLOCK', value: stats.decisionDistribution.block },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title & Operational Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyber-400 animate-pulse" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Security Operations Center (SOC)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time multi-tenant threat intelligence and continuous adaptive verification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDashboardData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-cyber-400" />}
          >
            Refresh
          </Button>
          <Link to="/admin/users">
            <Button variant="ghost" size="sm" leftIcon={<Users className="w-3.5 h-3.5" />}>
              Users
            </Button>
          </Link>
          <Link to="/admin/audit-logs">
            <Button variant="ghost" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />}>
              Audit Logs
            </Button>
          </Link>
        </div>
      </div>

      {/* Top SOC Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users className="w-5 h-5" />}
          description={`${stats.activeUsers} active accounts`}
        />
        <StatCard
          title="Successful Logins"
          value={stats.successfulLogins}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="cyber"
          trend={{ value: 'Normal', isPositive: true }}
        />
        <StatCard
          title="Failed Logins"
          value={stats.failedLogins}
          icon={<XCircle className="w-5 h-5" />}
          variant={stats.failedLogins > 10 ? 'warning' : 'default'}
          trend={{ value: stats.failedLogins, isPositive: stats.failedLogins === 0 }}
        />
        <StatCard
          title="Suspicious Events"
          value={stats.suspiciousEvents}
          icon={<AlertOctagon className="w-5 h-5" />}
          variant={stats.suspiciousEvents > 0 ? 'warning' : 'default'}
          description="Contextual anomaly flags"
        />
        <StatCard
          title="High-Risk Events"
          value={stats.highRiskEvents}
          icon={<ShieldAlert className="w-5 h-5" />}
          variant={stats.highRiskEvents > 0 ? 'danger' : 'default'}
          trend={{ value: 'Requires Review', isPositive: false }}
        />
      </div>

      {/* Auth Activity Timeline (Last 7 Days) */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 border-b-0 pb-4 flex items-center justify-between">
          <div>
            <CardTitle>Authentication & Challenge Trajectory</CardTitle>
            <CardDescription>
              Volume of successful, challenged, and failed authentications over time
            </CardDescription>
          </div>
          <span className="text-xs text-cyber-400 font-mono bg-cyber-500/10 px-2.5 py-1 rounded-md border border-cyber-500/20">
            Telemetry Stream
          </span>
        </CardHeader>

        <div className="w-full h-72 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={stats.activityTimeline}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0d1530',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#f1f5f9',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="success"
                stroke="#10b981"
                strokeWidth={2}
                name="Success"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="challenge"
                stroke="#06b6d4"
                strokeWidth={2}
                name="Step-Up OTP"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="failure"
                stroke="#ef4444"
                strokeWidth={2}
                name="Failed / Blocked"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Two Column Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Donut Chart */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0 border-b-0 pb-4">
            <CardTitle>Risk Severity Breakdown</CardTitle>
            <CardDescription>Continuous scoring classifications across all requests</CardDescription>
          </CardHeader>

          <div className="w-full h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskPieData.map((_, index) => (
                    <Cell key={`risk-cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1530',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f1f5f9',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Access Decisions Distribution */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0 border-b-0 pb-4">
            <CardTitle>Access Decision Breakdown</CardTitle>
            <CardDescription>
              Autonomous actions taken by the Adaptive Policy Engine
            </CardDescription>
          </CardHeader>

          <div className="w-full h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={decisionPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {decisionPieData.map((_, index) => (
                    <Cell
                      key={`decision-cell-${index}`}
                      fill={DECISION_COLORS[index % DECISION_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1530',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f1f5f9',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Security Events Table */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 border-b-0 pb-4 flex items-center justify-between">
          <div>
            <CardTitle>Recent Critical Security Checkpoints</CardTitle>
            <CardDescription>Real-time cross-platform events recorded by ZeroTrustX</CardDescription>
          </div>
          <Link to="/admin/risk-events" className="text-xs text-cyber-400 hover:text-cyber-300 font-medium">
            View High-Risk Events →
          </Link>
        </CardHeader>

        <Table
          columns={[
            {
              key: 'createdAt',
              header: 'Timestamp',
              render: (row: AuthEvent) => (
                <span className="font-mono text-xs text-slate-300">
                  {new Date(row.createdAt).toLocaleTimeString()}
                </span>
              ),
            },
            {
              key: 'userEmail',
              header: 'User Principal',
              render: (row: AuthEvent) => (
                <div>
                  <p className="text-xs font-semibold text-slate-200">{row.userEmail}</p>
                  <p className="text-[11px] text-slate-400">{row.userName || 'Account'}</p>
                </div>
              ),
            },
            {
              key: 'eventType',
              header: 'Event',
              render: (row: AuthEvent) => (
                <span className="font-semibold text-xs text-slate-200">
                  {row.eventType.replace(/_/g, ' ')}
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
              header: 'Score',
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
          data={stats.recentEvents || []}
          keyExtractor={(row) => row.id}
          emptyMessage="No recent security events found."
        />
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
