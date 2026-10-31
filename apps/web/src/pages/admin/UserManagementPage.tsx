import React, { useEffect, useState } from 'react';
import {
  Ban,
  CheckCircle,
  Eye,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import adminService from '../../services/admin.service';
import { User, UserProfileResponse } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { RoleBadge, StatusBadge } from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ErrorState from '../../components/ui/ErrorState';

export const UserManagementPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserProfileResponse | null>(null);
  const [_isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [userToToggleStatus, setUserToToggleStatus] = useState<User | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const pagination = usePagination({
    totalItems,
    initialPage: 1,
    initialLimit: 10,
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        role: selectedRole || undefined,
        status: selectedStatus || undefined,
      });

      if (res.data) {
        setUsers(res.data.items || []);
        setTotalItems(res.data.total || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, selectedRole, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pagination.setPage(1);
    fetchUsers();
  };

  const handleViewUser = async (user: User) => {
    setIsLoadingDetails(true);
    try {
      const res = await adminService.getUserDetails(user.id);
      setSelectedUserDetails(res.data);
    } catch {
      // Fallback with user info if detailed profile endpoint isn't fully available yet
      setSelectedUserDetails({
        user,
        recognizedDevices: [],
        recentAssessments: [],
        stats: { totalLogins: 1, failedLogins: 0, lastRiskScore: 10, accountAgeDays: 1 },
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!userToToggleStatus) return;
    setIsUpdatingStatus(true);
    const newStatus = userToToggleStatus.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await adminService.updateUserStatus(userToToggleStatus.id, newStatus);
      success(`User account is now ${newStatus}.`, 'Status Updated');
      setUsers((prev) =>
        prev.map((u) => (u.id === userToToggleStatus.id ? { ...u, status: newStatus } : u))
      );
      setUserToToggleStatus(null);
    } catch (err: any) {
      toastError(err.message || 'Failed to update account status.', 'Update Error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-cyber-400" />
            User Identity Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage principal credentials, access tiers, and security statuses
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchUsers}
          leftIcon={<RefreshCw className="w-3.5 h-3.5 text-cyber-400" />}
        >
          Refresh Directory
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-navy-850/80 border-slate-750">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <div>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                pagination.setPage(1);
              }}
              className="w-full h-10 rounded-lg bg-navy-800/80 px-3.5 py-2 text-sm text-slate-200 border border-slate-750 outline-none focus:border-cyber-400"
            >
              <option value="">All Roles</option>
              <option value="USER">Standard User</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                pagination.setPage(1);
              }}
              className="w-full h-10 rounded-lg bg-navy-800/80 px-3.5 py-2 text-sm text-slate-200 border border-slate-750 outline-none focus:border-cyber-400"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" size="md" className="flex-1">
              Search
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => {
                setSearchTerm('');
                setSelectedRole('');
                setSelectedStatus('');
                pagination.setPage(1);
              }}
              className="text-xs"
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>

      {/* Users Table */}
      {error ? (
        <ErrorState message={error} onRetry={fetchUsers} />
      ) : (
        <Card className="p-6">
          <CardHeader className="px-0 pt-0 border-b-0 pb-4 flex items-center justify-between">
            <div>
              <CardTitle>Registered Principals</CardTitle>
              <CardDescription>Accounts authorized within the ZeroTrustX security realm</CardDescription>
            </div>
            <span className="text-xs text-cyber-400 font-mono bg-cyber-500/10 px-2.5 py-1 rounded-md border border-cyber-500/20">
              {totalItems} Accounts
            </span>
          </CardHeader>

          <Table
            columns={[
              {
                key: 'name',
                header: 'User Principal',
                render: (row: User) => (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-navy-750 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyber-300">
                      {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-slate-100">{row.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{row.email}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'role',
                header: 'Role',
                align: 'center',
                render: (row: User) => <RoleBadge role={row.role} />,
              },
              {
                key: 'status',
                header: 'Status',
                align: 'center',
                render: (row: User) => <StatusBadge status={row.status} />,
              },
              {
                key: 'createdAt',
                header: 'Joined',
                render: (row: User) => (
                  <span className="text-xs text-slate-400">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </span>
                ),
              },
              {
                key: 'lastLoginAt',
                header: 'Last Active',
                render: (row: User) => (
                  <span className="text-xs text-slate-400 font-mono">
                    {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString() : 'Never'}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                align: 'right',
                render: (row: User) => (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewUser(row);
                      }}
                      className="p-1.5 text-slate-400 hover:text-cyber-400 rounded hover:bg-slate-800 transition-colors"
                      title="View Profile Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserToToggleStatus(row);
                      }}
                      className={
                        row.status === 'ACTIVE'
                          ? 'p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors'
                          : 'p-1.5 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-800 transition-colors'
                      }
                      title={row.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
                    >
                      {row.status === 'ACTIVE' ? (
                        <Ban className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ),
              },
            ]}
            data={users}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No users found matching the given parameters."
          />

          <Pagination
            pagination={pagination}
            totalItems={totalItems}
            className="border-t border-slate-800 mt-4 pt-4"
          />
        </Card>
      )}

      {/* User Details Modal */}
      <Modal
        isOpen={!!selectedUserDetails}
        onClose={() => setSelectedUserDetails(null)}
        title="Security Principal Dossier"
        description="Comprehensive behavioral risk and hardware footprint"
        size="lg"
      >
        {selectedUserDetails && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-navy-900 border border-slate-750">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-violet-600 flex items-center justify-center font-bold text-lg text-white">
                {selectedUserDetails.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white truncate">
                    {selectedUserDetails.user.name}
                  </h4>
                  <RoleBadge role={selectedUserDetails.user.role} />
                  <StatusBadge status={selectedUserDetails.user.status} />
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {selectedUserDetails.user.email} • ID: {selectedUserDetails.user.id}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-navy-850 border border-slate-750">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Total Logins
                </span>
                <span className="text-base font-bold text-white font-mono mt-1 block">
                  {selectedUserDetails.stats?.totalLogins || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-navy-850 border border-slate-750">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Failed Logins
                </span>
                <span className="text-base font-bold text-rose-400 font-mono mt-1 block">
                  {selectedUserDetails.stats?.failedLogins || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-navy-850 border border-slate-750">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Last Risk Rating
                </span>
                <span className="text-base font-bold text-cyber-300 font-mono mt-1 block">
                  {selectedUserDetails.stats?.lastRiskScore || 0} / 100
                </span>
              </div>
              <div className="p-3 rounded-lg bg-navy-850 border border-slate-750">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Member Age
                </span>
                <span className="text-base font-bold text-white font-mono mt-1 block">
                  {selectedUserDetails.stats?.accountAgeDays || 1}d
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedUserDetails(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toggle Account Status Confirmation */}
      <ConfirmDialog
        isOpen={!!userToToggleStatus}
        onClose={() => setUserToToggleStatus(null)}
        onConfirm={handleConfirmToggleStatus}
        title={
          userToToggleStatus?.status === 'ACTIVE'
            ? 'Suspend Principal Account'
            : 'Reactivate Principal Account'
        }
        message={
          userToToggleStatus?.status === 'ACTIVE'
            ? `Are you sure you want to suspend access for ${userToToggleStatus?.name}? This user will be immediately blocked from all protected resources.`
            : `Reactivating ${userToToggleStatus?.name} will allow them to authenticate subject to standard adaptive risk checks.`
        }
        confirmText={
          userToToggleStatus?.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'
        }
        variant={userToToggleStatus?.status === 'ACTIVE' ? 'danger' : 'primary'}
        isLoading={isUpdatingStatus}
      />
    </div>
  );
};

export default UserManagementPage;
