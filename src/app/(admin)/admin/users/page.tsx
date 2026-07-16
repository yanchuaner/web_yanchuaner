'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, UserCheck, UserX, Users } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { EmptyState, ResponsiveTabs } from '@/components/ui';
import { toast } from 'sonner';
import { formatClassName, formatGraduationClass } from '@/lib/identity-fields';
import { useThemeAndLocale } from '@/components/ThemeAndLocaleProvider';

type UserRecord = {
  id: string;
  username: string | null;
  email: string | null;
  emailVerified: string | null;
  name: string | null;
  graduationClass: string | null;
  className: string | null;
  contact: string | null;
  role: string;
  status: string;
  verificationStatus: string;
  verificationMethod: string | null;
  accountStatus: string;
  claimedAt: string | null;
  createdAt: string;
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { t } = useThemeAndLocale();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?status=${statusFilter}&limit=100`);
      if (!res.ok) throw new Error(t('admin.users.fetchFailed'));
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const runAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('admin.users.actionFailed'));
      }
      toast.success(t('admin.users.actionSuccess'));
      fetchUsers();
    } catch (err: any) {
      toast.error(`${t('admin.users.actionFailed')}: ${err.message}`);
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      PENDING: 'border-warning/25 text-warning bg-warning/10',
      VERIFIED: 'border-success/25 text-success bg-success/10',
      REJECTED: 'border-danger/25 text-danger bg-danger/10',
    };
    const label: Record<string, string> = {
      PENDING: t('admin.users.pending'),
      VERIFIED: t('admin.users.verified'),
      REJECTED: t('admin.users.rejected'),
    };
    return (
      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${map[s] || ''}`}>
        {label[s] || s}
      </span>
    );
  };

  const filters = ['ALL', 'PENDING', 'VERIFIED', 'REJECTED'];
  const verificationMethodLabel = (method: string | null) => {
    const key = method || 'LEGACY';
    return t(`admin.users.verificationMethods.${key}`);
  };

  return (
    <AdminPageShell
      title={t('admin.users.title')}
      description={t('admin.users.description')}
    >
      <div className="space-y-4">

      {/* Filter tabs */}
      <ResponsiveTabs
        tabs={filters.map((f) => ({
          id: f,
          label: f === 'ALL' ? t('admin.users.all') : f === 'PENDING' ? t('admin.users.pending') : f === 'VERIFIED' ? t('admin.users.verified') : t('admin.users.rejected'),
        }))}
        activeTab={statusFilter}
        onChange={setStatusFilter}
        className="mb-4"
      />

      {error && (
        <div className="mb-4 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-card border border-line bg-surface/30 p-4 animate-pulse">
              <div className="flex-1 space-y-2 w-full">
                <div className="h-4 w-24 rounded bg-brand/20" />
                <div className="h-3 w-40 rounded bg-brand/10" />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="h-8 w-16 rounded bg-brand/15" />
                <div className="h-8 w-16 rounded bg-brand/15" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('admin.users.emptyTitle')}
          description={t('admin.users.emptyDescription')}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand/10 bg-surface/50 backdrop-blur-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand/10 text-main/60">
              <tr>
                <th className="px-4 py-3 font-medium">{t('admin.users.name')}</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">{t('admin.users.account')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.users.cohortClass')}</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">{t('admin.users.emailStatus')}</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">{t('admin.users.role')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.users.status')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.users.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand/5">
              {users.map((user) => (
                <tr key={user.id} className="text-main/70 transition hover:bg-brand/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-main">{user.name || '-'}</p>
                    {/* On mobile, show account details as subtext in the name cell */}
                    <p className="text-xxs text-main/50 md:hidden mt-0.5">
                      {user.username || t('admin.users.legacyRecord')} • {user.email || '-'}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p>{user.username || t('admin.users.legacyRecord')}</p>
                    <p className="text-xs">{user.email || '-'}</p>
                  </td>
                  <td className="px-4 py-3">{[formatGraduationClass(user.graduationClass), formatClassName(user.className)].filter(Boolean).join(' / ') || '-'}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{user.emailVerified ? t('admin.users.emailVerified') : t('admin.users.emailUnverified')}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{user.role}</td>
                  <td className="px-4 py-3">
                    {statusBadge(user.status)}
                    <p className="mt-1 text-xs">{user.accountStatus}</p>
                    <p className="mt-1 text-xs text-main/50">
                      {t('admin.users.verificationMethodLabel')} {verificationMethodLabel(user.verificationMethod)}
                    </p>
                    {/* On mobile, show role as subtext */}
                    <p className="mt-0.5 text-xxs text-main/50 md:hidden font-semibold">{t('admin.users.roleLabel')} {user.role}</p>
                  </td>
                  <td className="px-4 py-3">
                    {user.id === currentUser?.id ? (
                      <span className="inline-block text-xs font-semibold text-main/60 bg-surface/60 border border-line rounded-full px-2.5 py-0.5">
                        {t('admin.users.currentAccount')}
                      </span>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        {user.status === 'PENDING' && (
                          <>
                            <button
                              disabled={user.role === 'ADMIN' && !currentUser?.isRoot}
                              title={user.role === 'ADMIN' && !currentUser?.isRoot ? t('admin.users.noAdminPermission') : undefined}
                              onClick={() => runAction(user.id, 'approve-alumni')}
                              className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-success/25 bg-success/10 px-2.5 py-1 text-xs text-success transition hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <UserCheck size={14} />
                              {t('admin.users.approve')}
                            </button>
                            <button
                              disabled={user.role === 'ADMIN' && !currentUser?.isRoot}
                              title={user.role === 'ADMIN' && !currentUser?.isRoot ? t('admin.users.noAdminPermission') : undefined}
                              onClick={() => runAction(user.id, 'reject-alumni')}
                              className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-danger/25 bg-danger/10 px-2.5 py-1 text-xs text-danger transition hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <UserX size={14} />
                              {t('admin.users.reject')}
                            </button>
                          </>
                        )}
                        {user.status === 'VERIFIED' && (
                          <button
                            disabled={user.role === 'ADMIN'}
                            title={user.role === 'ADMIN' ? t('admin.users.revokeAdminFirst') : undefined}
                            onClick={() => runAction(user.id, 'reject-alumni')}
                            className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-danger/25 bg-danger/10 px-2.5 py-1 text-xs text-danger transition hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <UserX size={14} />
                            {t('admin.users.revoke')}
                          </button>
                        )}
                        {user.status === 'REJECTED' && (
                          <button
                            disabled={user.role === 'ADMIN' && !currentUser?.isRoot}
                            title={user.role === 'ADMIN' && !currentUser?.isRoot ? t('admin.users.noAdminPermission') : undefined}
                            onClick={() => runAction(user.id, 'approve-alumni')}
                            className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-success/25 bg-success/10 px-2.5 py-1 text-xs text-success transition hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <UserCheck size={14} />
                            {t('admin.users.approveAgain')}
                          </button>
                        )}
                        <button
                          disabled={user.role === 'ADMIN' && !currentUser?.isRoot}
                          title={user.role === 'ADMIN' && !currentUser?.isRoot ? t('admin.users.noAdminPermission') : undefined}
                          onClick={() => runAction(user.id, user.accountStatus === 'ACTIVE' ? 'disable-account' : 'enable-account')}
                          className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-main/70 transition hover:bg-surface/60 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface min-h-[32px]"
                        >
                          {user.accountStatus === 'ACTIVE' ? t('admin.users.disable') : t('admin.users.enable')}
                        </button>
                        {currentUser?.isRoot && (
                          user.role === 'ADMIN' ? (
                            <button
                              onClick={() => runAction(user.id, 'revoke-admin')}
                              className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface/60 px-2.5 py-1 text-xs text-main/60 transition hover:bg-surface/60 hover:text-main/60 cursor-pointer min-h-[32px]"
                            >
                              <ShieldCheck size={14} className="text-main/60" />
                              {t('admin.users.revokeAdmin')}
                            </button>
                          ) : (
                            <button
                              onClick={() => runAction(user.id, 'grant-admin')}
                              className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-brand/25 bg-brand/10 px-2.5 py-1 text-xs text-brand transition hover:bg-brand/20"
                            >
                              <ShieldCheck size={14} />
                              {t('admin.users.grantAdmin')}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </AdminPageShell>
  );
}
