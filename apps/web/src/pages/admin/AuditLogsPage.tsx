import React, { useEffect, useState } from 'react';
import {
  Download,
  FileText,
  Info,
  RefreshCw,
} from 'lucide-react';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import adminService from '../../services/admin.service';
import { AuditLog } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { SeverityBadge } from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import ErrorState from '../../components/ui/ErrorState';

export const AuditLogsPage: React.FC = () => {
  const { info } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const pagination = usePagination({
    totalItems,
    initialPage: 1,
    initialLimit: 15,
  });

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminService.getAuditLogs({
        page: pagination.page,
        limit: pagination.limit,
        severity: severityFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (res.data) {
        setLogs(res.data.items || []);
        setTotalItems(res.data.total || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve immutable audit records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [pagination.page, pagination.limit, severityFilter, startDate, endDate]);

  const handleExport = () => {
    info(
      'Export feature is scheduled for production v1.1. SIEM integration (Splunk, Elastic) is available via webhook.',
      'SIEM / CSV Export'
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-cyber-400" />
            Compliance & System Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tamper-evident record of administrative changes, policy executions, and system events
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export Log
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchAuditLogs}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-cyber-400" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-navy-850/80 border-slate-750">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                pagination.setPage(1);
              }}
              className="w-full h-10 rounded-lg bg-navy-800/80 px-3.5 py-2 text-sm text-slate-200 border border-slate-750 outline-none focus:border-cyber-400"
            >
              <option value="">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="CRITICAL">CRITICAL</option>
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
              title="From"
            />
            <span className="text-slate-500 text-xs">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                pagination.setPage(1);
              }}
              title="To"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              className="flex-1"
              onClick={fetchAuditLogs}
            >
              Filter
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => {
                setSeverityFilter('');
                setStartDate('');
                setEndDate('');
                pagination.setPage(1);
              }}
              className="text-xs"
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      {error ? (
        <ErrorState message={error} onRetry={fetchAuditLogs} />
      ) : (
        <Card className="p-6">
          <CardHeader className="px-0 pt-0 border-b-0 pb-4 flex items-center justify-between">
            <div>
              <CardTitle>Audit Trail Stream</CardTitle>
              <CardDescription>Immutable ledger of security-relevant system operations</CardDescription>
            </div>
            <span className="text-xs text-cyber-400 font-mono bg-cyber-500/10 px-2.5 py-1 rounded-md border border-cyber-500/20">
              {totalItems} Entries
            </span>
          </CardHeader>

          <Table
            columns={[
              {
                key: 'createdAt',
                header: 'Timestamp',
                render: (row: AuditLog) => (
                  <span className="font-mono text-xs text-slate-300">
                    {new Date(row.createdAt).toISOString()}
                  </span>
                ),
              },
              {
                key: 'severity',
                header: 'Severity',
                align: 'center',
                render: (row: AuditLog) => <SeverityBadge severity={row.severity} />,
              },
              {
                key: 'action',
                header: 'Action / Operation',
                render: (row: AuditLog) => (
                  <div>
                    <p className="font-mono text-xs text-slate-100 font-semibold">{row.action}</p>
                    <p className="text-[11px] text-slate-400">{row.category}</p>
                  </div>
                ),
              },
              {
                key: 'userEmail',
                header: 'Actor Principal',
                render: (row: AuditLog) => (
                  <span className="text-xs text-slate-300 font-mono">
                    {row.userEmail || 'System Process'}
                  </span>
                ),
              },
              {
                key: 'ipAddress',
                header: 'Origin IP',
                render: (row: AuditLog) => (
                  <span className="font-mono text-xs text-cyber-300">{row.ipAddress}</span>
                ),
              },
              {
                key: 'details',
                header: '',
                align: 'right',
                render: (row: AuditLog) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLog(row);
                    }}
                    className="text-slate-400 hover:text-cyber-400 p-1"
                    title="View payload"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                ),
              },
            ]}
            data={logs}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            onRowClick={(row) => setSelectedLog(row)}
            emptyMessage="No audit logs found for the selected time horizon."
          />

          <Pagination
            pagination={pagination}
            totalItems={totalItems}
            className="border-t border-slate-800 mt-4 pt-4"
          />
        </Card>
      )}

      {/* Log Payload Details Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Payload"
        description="Raw JSON telemetry captured at checkpoint execution"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-750 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Log Entry ID:</span>
                <span className="font-mono text-slate-200">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="font-mono text-slate-200">{selectedLog.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Action:</span>
                <span className="font-mono text-cyber-300 font-semibold">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Actor:</span>
                <span className="font-mono text-slate-200">{selectedLog.userEmail || 'system'}</span>
              </div>
            </div>

            <pre className="p-4 rounded-xl bg-navy-950 border border-slate-800 text-cyber-300 font-mono text-xs overflow-x-auto max-h-64">
              {JSON.stringify(selectedLog.details || {}, null, 2)}
            </pre>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogsPage;
