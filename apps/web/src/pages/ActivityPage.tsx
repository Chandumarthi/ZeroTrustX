import React, { useEffect, useState } from 'react';
import { Activity, Info, RefreshCw, Search } from 'lucide-react';
import { usePagination } from '../hooks/usePagination';
import userService from '../services/user.service';
import { AuthEvent } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { DecisionBadge, RiskBadge } from '../components/ui/Badge';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import ErrorState from '../components/ui/ErrorState';

export const ActivityPage: React.FC = () => {
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState<AuthEvent | null>(null);

  const pagination = usePagination({
    totalItems,
    initialPage: 1,
    initialLimit: 10,
  });

  const fetchActivity = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await userService.getActivity({
        page: pagination.page,
        limit: pagination.limit,
        eventType: selectedEventType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm || undefined,
      });

      if (res.data) {
        setEvents(res.data.items || []);
        setTotalItems(res.data.total || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activity records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [pagination.page, pagination.limit, selectedEventType, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pagination.setPage(1);
    fetchActivity();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedEventType('');
    setStartDate('');
    setEndDate('');
    pagination.setPage(1);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-cyber-400" />
            Security Activity Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Audit trail of identity verification events and AI risk evaluations
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchActivity}
          leftIcon={<RefreshCw className="w-3.5 h-3.5 text-cyber-400" />}
        >
          Refresh Log
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-navy-850/80 border-slate-750">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search IP, device, user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <div>
            <select
              value={selectedEventType}
              onChange={(e) => {
                setSelectedEventType(e.target.value);
                pagination.setPage(1);
              }}
              className="w-full h-10 rounded-lg bg-navy-800/80 px-3.5 py-2 text-sm text-slate-200 border border-slate-750 outline-none focus:border-cyber-400"
            >
              <option value="">All Event Types</option>
              <option value="LOGIN_SUCCESS">Login Success</option>
              <option value="LOGIN_FAILURE">Login Failure</option>
              <option value="OTP_SENT">OTP Sent</option>
              <option value="OTP_VERIFIED">OTP Verified</option>
              <option value="OTP_FAILED">OTP Failed</option>
              <option value="ACCESS_DENIED">Access Denied</option>
              <option value="STEP_UP_CHALLENGE">Step-Up Challenge</option>
              <option value="LOGOUT">Logout</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                pagination.setPage(1);
              }}
              title="Start Date"
            />
            <span className="text-slate-500 text-xs">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                pagination.setPage(1);
              }}
              title="End Date"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" size="md" className="flex-1">
              Filter
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleResetFilters}
              className="text-xs"
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>

      {/* Activity Table */}
      {error ? (
        <ErrorState message={error} onRetry={fetchActivity} />
      ) : (
        <Card className="p-6">
          <CardHeader className="px-0 pt-0 border-b-0 pb-4 flex items-center justify-between">
            <div>
              <CardTitle>Continuous Telemetry Checkpoints</CardTitle>
              <CardDescription>
                Click any row to inspect deep contextual risk factors and ML telemetry
              </CardDescription>
            </div>
            <span className="text-xs text-cyber-400 font-mono bg-cyber-500/10 px-2.5 py-1 rounded-md border border-cyber-500/20">
              {totalItems} Total Records
            </span>
          </CardHeader>

          <Table
            columns={[
              {
                key: 'createdAt',
                header: 'Timestamp',
                render: (row: AuthEvent) => (
                  <span className="font-mono text-xs text-slate-300">
                    {new Date(row.createdAt).toLocaleString()}
                  </span>
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
                header: 'IP Address & Device',
                render: (row: AuthEvent) => (
                  <div>
                    <p className="font-mono text-xs text-cyber-300">{row.ipAddress}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                      {row.userAgent || 'Standard Browser'}
                    </p>
                  </div>
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
                header: 'Level',
                align: 'center',
                render: (row: AuthEvent) => <RiskBadge level={row.riskLevel} />,
              },
              {
                key: 'decision',
                header: 'Decision',
                align: 'center',
                render: (row: AuthEvent) => <DecisionBadge decision={row.decision} />,
              },
              {
                key: 'details',
                header: '',
                align: 'right',
                render: () => (
                  <button className="text-slate-400 hover:text-cyber-400 p-1">
                    <Info className="w-4 h-4" />
                  </button>
                ),
              },
            ]}
            data={events}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            onRowClick={(row) => setSelectedEvent(row)}
            emptyMessage="No authentication events match the current criteria."
          />

          <Pagination
            pagination={pagination}
            totalItems={totalItems}
            className="border-t border-slate-800 mt-4 pt-4"
          />
        </Card>
      )}

      {/* Event Details Inspection Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Security Telemetry Inspection"
        description="Detailed contextual attributes evaluated by ZeroTrustX"
        size="lg"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-navy-900/80 border border-slate-750">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Event ID
                </span>
                <span className="font-mono text-xs text-slate-200 truncate block">
                  {selectedEvent.id.slice(0, 12)}...
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Risk Level
                </span>
                <RiskBadge level={selectedEvent.riskLevel} className="mt-1" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Policy Decision
                </span>
                <DecisionBadge decision={selectedEvent.decision} className="mt-1" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Calculated Risk
                </span>
                <span className="font-mono text-base font-bold text-cyber-300">
                  {selectedEvent.riskScore} / 100
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h5 className="font-semibold text-slate-200">Session Context:</h5>
              <div className="p-3.5 rounded-xl bg-navy-850 border border-slate-750 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="font-mono text-slate-200">
                    {new Date(selectedEvent.createdAt).toISOString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IP Address:</span>
                  <span className="font-mono text-cyber-300">{selectedEvent.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">User Agent:</span>
                  <span className="font-mono text-slate-300 text-right max-w-sm truncate">
                    {selectedEvent.userAgent}
                  </span>
                </div>
                {selectedEvent.location && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Derived Location:</span>
                    <span className="text-slate-200">{selectedEvent.location}</span>
                  </div>
                )}
              </div>
            </div>

            {selectedEvent.metadata && (
              <div className="space-y-2 text-xs">
                <h5 className="font-semibold text-slate-200">Evaluation Signals & Metadata:</h5>
                <pre className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 text-cyber-300 font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedEvent.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ActivityPage;
