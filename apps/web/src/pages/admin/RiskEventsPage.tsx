import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  Eye,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { usePagination } from '../../hooks/usePagination';
import adminService from '../../services/admin.service';
import { AuthEvent } from '../../types';
import Button from '../../components/ui/Button';
import Card, { CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { DecisionBadge, RiskBadge } from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import RiskScoreMeter from '../../components/ui/RiskScoreMeter';
import ErrorState from '../../components/ui/ErrorState';

export const RiskEventsPage: React.FC = () => {
  const [riskEvents, setRiskEvents] = useState<AuthEvent[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLevel, setSelectedLevel] = useState<string>('HIGH');
  const [selectedEvent, setSelectedEvent] = useState<AuthEvent | null>(null);

  const pagination = usePagination({
    totalItems,
    initialPage: 1,
    initialLimit: 10,
  });

  const fetchRiskEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminService.getRiskEvents({
        page: pagination.page,
        limit: pagination.limit,
        level: selectedLevel || undefined,
      });

      if (res.data) {
        setRiskEvents(res.data.items || []);
        setTotalItems(res.data.total || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve elevated risk telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskEvents();
  }, [pagination.page, pagination.limit, selectedLevel]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-500 animate-pulse" />
            Elevated Risk & Threat Detections
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Machine learning anomaly detections flagged as HIGH (60-84) or CRITICAL (85-100)
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchRiskEvents}
          leftIcon={<RefreshCw className="w-3.5 h-3.5 text-cyber-400" />}
        >
          Refresh Feed
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedLevel('');
            pagination.setPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
            selectedLevel === ''
              ? 'bg-cyber-500/15 border-cyber-400 text-cyber-300'
              : 'bg-navy-800/80 border-slate-750 text-slate-400 hover:text-white'
          }`}
        >
          All Elevated (60+)
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedLevel('HIGH');
            pagination.setPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
            selectedLevel === 'HIGH'
              ? 'bg-orange-500/20 border-orange-400 text-orange-300'
              : 'bg-navy-800/80 border-slate-750 text-slate-400 hover:text-white'
          }`}
        >
          HIGH RISK (60-84)
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedLevel('CRITICAL');
            pagination.setPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
            selectedLevel === 'CRITICAL'
              ? 'bg-rose-500/20 border-rose-500 text-rose-300'
              : 'bg-navy-800/80 border-slate-750 text-slate-400 hover:text-white'
          }`}
        >
          CRITICAL THREAT (85-100)
        </button>
      </div>

      {/* Table */}
      {error ? (
        <ErrorState message={error} onRetry={fetchRiskEvents} />
      ) : (
        <Card className="p-6">
          <CardHeader className="px-0 pt-0 border-b-0 pb-4 flex items-center justify-between">
            <div>
              <CardTitle>ML Threat Telemetry Log</CardTitle>
              <CardDescription>
                Behavioral models detected anomalous factors deviating from baseline
              </CardDescription>
            </div>
            <span className="text-xs text-rose-400 font-mono bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
              {totalItems} Threats
            </span>
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
                header: 'Principal Identity',
                render: (row: AuthEvent) => (
                  <div>
                    <p className="font-semibold text-xs text-slate-100">{row.userEmail}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{row.ipAddress}</p>
                  </div>
                ),
              },
              {
                key: 'riskScore',
                header: 'Calculated Risk',
                align: 'center',
                render: (row: AuthEvent) => (
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono font-bold text-sm text-rose-400">
                      {row.riskScore}/100
                    </span>
                  </div>
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
                header: 'Action Taken',
                align: 'center',
                render: (row: AuthEvent) => <DecisionBadge decision={row.decision} />,
              },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (row: AuthEvent) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(row);
                    }}
                    className="p-1.5 text-slate-400 hover:text-cyber-400 rounded hover:bg-slate-800 transition-colors"
                    title="Examine Risk Breakdown"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                ),
              },
            ]}
            data={riskEvents}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            onRowClick={(row) => setSelectedEvent(row)}
            emptyMessage="No elevated risk incidents registered in this range."
          />

          <Pagination
            pagination={pagination}
            totalItems={totalItems}
            className="border-t border-slate-800 mt-4 pt-4"
          />
        </Card>
      )}

      {/* Threat Inspection Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Threat Analysis & Factor Attribution"
        description="Detailed ML probability weights and behavioral deviation vector"
        size="lg"
      >
        {selectedEvent && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-navy-900 border border-slate-750">
              <RiskScoreMeter score={selectedEvent.riskScore} size="md" />

              <div className="space-y-2 flex-1 w-full text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Principal:</span>
                  <span className="font-semibold text-slate-100 font-mono">
                    {selectedEvent.userEmail}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Triggered Decision:</span>
                  <DecisionBadge decision={selectedEvent.decision} />
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">IP Reputation Origin:</span>
                  <span className="font-mono text-cyber-300">{selectedEvent.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="font-mono text-slate-200">
                    {new Date(selectedEvent.createdAt).toISOString()}
                  </span>
                </div>
              </div>
            </div>

            {selectedEvent.metadata && (
              <div className="space-y-2 text-xs">
                <h5 className="font-semibold text-slate-200 flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-cyber-400" />
                  <span>Factor Attribution Matrix:</span>
                </h5>
                <pre className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 text-cyber-300 font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedEvent.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedEvent(null)}>
                Dismiss Investigation
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RiskEventsPage;
