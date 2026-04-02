import { useState, useEffect } from 'react';
import { Search, Shield, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../lib/utils';
import type { Profile } from '../../types/user.types';
import { useLanguageStore } from '../../store/languageStore';

export default function Users() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (search) query = query.ilike('full_name', `%${search}%`);
    const { data } = await query;
    if (data) setUsers(data as Profile[]);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [search]);

  const changeRole = async (userId: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', userId);
    fetchUsers();
  };

  const roleBadge: Record<string, string> = {
    citizen: 'bg-gray-100 text-gray-700',
    admin: 'bg-blue-100 text-blue-700',
    super_admin: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{tx('Brukeradministrasjon', 'User administration')}</h1>
        <p className="text-gray-500 text-sm">{users.length} {tx('registrerte brukere', 'registered users')}</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder={tx('Sok pa navn...', 'Search by name...')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {[tx('Navn', 'Name'), tx('E-post', 'Email'), tx('Rolle', 'Role'), tx('Opprettet', 'Created'), tx('Handlinger', 'Actions')].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${roleBadge[u.role] || 'bg-gray-100'}`}>
                        {u.role === 'super_admin'
                          ? tx('superadmin', 'super admin')
                          : u.role === 'admin'
                          ? tx('administrator', 'admin')
                          : tx('innbygger', 'citizen')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {u.role === 'citizen' && (
                          <button
                            onClick={() => changeRole(u.id, 'admin')}
                            title={tx('Gjor til administrator', 'Promote to admin')}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                        )}
                        {u.role === 'admin' && (
                          <button
                            onClick={() => changeRole(u.id, 'citizen')}
                            title={tx('Endre til innbygger', 'Demote to citizen')}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
