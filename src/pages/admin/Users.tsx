import { useEffect, useMemo, useState } from 'react';
import { Search, Shield, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../lib/utils';
import type { Profile } from '../../types/user.types';
import { useLanguageStore } from '../../store/languageStore';
import { useAuth } from '../../hooks/useAuth';

type RoleFilter = 'all' | 'citizen' | 'admin' | 'super_admin';

const roleBadgeClasses: Record<string, string> = {
  citizen: 'bg-slate-100 text-slate-700',
  admin: 'bg-blue-100 text-blue-700',
  super_admin: 'bg-violet-100 text-violet-700',
};

export default function Users() {
  const { profile: currentProfile } = useAuth();
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setUsers([]);
      setLoading(false);
      return;
    }

    setUsers((data || []) as Profile[]);
    setError('');
    setLoading(false);
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const adminCount = useMemo(
    () => users.filter((user) => user.role === 'admin' || user.role === 'super_admin').length,
    [users]
  );

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (!normalizedSearch) return true;
      return (
        user.full_name?.toLowerCase().includes(normalizedSearch) ||
        user.email?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [roleFilter, search, users]);

  const roleLabel = (role: Profile['role']) => {
    if (role === 'super_admin') return tx('superadmin', 'super admin');
    if (role === 'admin') return tx('administrator', 'admin');
    return tx('innbygger', 'citizen');
  };

  const canChangeRole = (targetUser: Profile, nextRole: Profile['role']) => {
    if (!currentProfile) {
      return { allowed: false, reason: tx('Du er ikke autentisert', 'You are not authenticated') };
    }

    if (targetUser.id === currentProfile.id) {
      return {
        allowed: false,
        reason: tx(
          'Du kan ikke endre din egen rolle fra denne siden',
          'You cannot change your own role from this page'
        ),
      };
    }

    const isAdminRole = targetUser.role === 'admin' || targetUser.role === 'super_admin';
    const nextIsAdminRole = nextRole === 'admin' || nextRole === 'super_admin';

    if (isAdminRole && !nextIsAdminRole && adminCount <= 1) {
      return {
        allowed: false,
        reason: tx(
          'Kan ikke degradere siste administrator',
          'Cannot demote the last administrator'
        ),
      };
    }

    return { allowed: true, reason: '' };
  };

  const changeRole = async (targetUser: Profile, nextRole: Profile['role']) => {
    const permission = canChangeRole(targetUser, nextRole);
    if (!permission.allowed) {
      setError(permission.reason);
      setMessage('');
      return;
    }

    setSavingUserId(targetUser.id);
    setError('');
    setMessage('');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: nextRole })
      .eq('id', targetUser.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage(
        nextRole === 'admin'
          ? tx('Brukeren ble gjort til administrator', 'User promoted to admin')
          : tx('Brukeren ble satt tilbake til innbygger', 'User demoted to citizen')
      );
      await fetchUsers();
    }
    setSavingUserId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-[#173151]">
          {tx('Brukeradministrasjon', 'User administration')}
        </h1>
        <p className="mt-2 text-sm text-[#6b7f99]">
          {tx(`${filteredUsers.length} brukere i oversikten`, `${filteredUsers.length} users in this view`)}
        </p>
      </div>

      {message ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 rounded-[28px] border border-[#d7dfeb] bg-white p-4 md:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8ea8]" />
          <Input
            placeholder={tx('Sok pa navn eller e-post...', 'Search by name or email...')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
          className="h-11 rounded-xl border border-[#d7dfeb] px-3 text-sm"
        >
          <option value="all">{tx('Alle roller', 'All roles')}</option>
          <option value="citizen">{tx('Innbyggere', 'Citizens')}</option>
          <option value="admin">{tx('Administratorer', 'Admins')}</option>
          <option value="super_admin">{tx('Superadmin', 'Super admin')}</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-[#d7dfeb] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-[#f7f9fc]">
                <tr>
                  {[tx('Navn', 'Name'), tx('E-post', 'Email'), tx('Rolle', 'Role'), tx('Opprettet', 'Created'), tx('Handlinger', 'Actions')].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7f99]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebf0f6]">
                {filteredUsers.map((user) => {
                  const isCurrentUser = user.id === currentProfile?.id;
                  return (
                    <tr key={user.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#173151]">{user.full_name}</div>
                        {isCurrentUser ? (
                          <p className="text-xs text-[#6b7f99]">
                            {tx('Din konto', 'Your account')}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-[#4e6482]">{user.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${roleBadgeClasses[user.role] || 'bg-slate-100 text-slate-700'}`}
                        >
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#4e6482]">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {user.role === 'citizen' ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-full"
                              disabled={savingUserId === user.id}
                              onClick={() => changeRole(user, 'admin')}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              {tx('Gjor admin', 'Promote')}
                            </Button>
                          ) : user.role === 'admin' ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-full"
                              disabled={savingUserId === user.id || isCurrentUser}
                              onClick={() => changeRole(user, 'citizen')}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              {tx('Gjor innbygger', 'Demote')}
                            </Button>
                          ) : (
                            <span className="text-xs text-[#6b7f99]">
                              {tx('Superadmin styres manuelt', 'Super admin is managed manually')}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
