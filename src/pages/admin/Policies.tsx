import { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminPolicies, useAdminPolicyWorkspace, useCategoriesAdmin } from '../../hooks/useAdmin';
import { useLanguageStore } from '../../store/languageStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../lib/utils';
import { getCategoryLabel, getPolicyTitle } from '../../lib/policyContent';
import { supabase } from '../../lib/supabase';

export default function AdminPolicies() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'draft' | 'active' | 'under_review' | 'closed'>('all');
  const [categoryId, setCategoryId] = useState('');
  const [published, setPublished] = useState<'all' | 'published' | 'unpublished'>('all');
  const [page, setPage] = useState(1);
  const { policies, total, loading, refetch } = useAdminPolicies({
    search,
    status,
    categoryId: categoryId || undefined,
    published,
    page,
    limit: 15,
  });
  const { categories } = useCategoriesAdmin();
  const { deleteWorkspace } = useAdminPolicyWorkspace();

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / 15)), [total]);

  const togglePublish = async (policyId: string, nextValue: boolean) => {
    await supabase
      .from('policies')
      .update({
        is_published: nextValue,
        published_at: nextValue ? new Date().toISOString() : null,
      })
      .eq('id', policyId);
    await refetch();
  };

  const removePolicy = async (policyId: string) => {
    await deleteWorkspace(policyId);
    await refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#173151]">{tx('Saksadministrasjon', 'Policy management')}</h1>
          <p className="mt-2 text-sm text-[#6b7f99]">
            {tx(`${total} saker i systemet`, `${total} policies in the system`)}
          </p>
        </div>
        <Button className="rounded-full" onClick={() => navigate('/admin/policies/new')}>
          <Plus className="mr-2 h-4 w-4" />
          {tx('Ny sak', 'New policy')}
        </Button>
      </div>

      <div className="grid gap-3 rounded-[28px] border border-[#d7dfeb] bg-white p-4 md:grid-cols-[1fr_180px_180px_200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8ea8]" />
          <Input
            className="pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tx('Sok etter saker...', 'Search policies...')}
          />
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value as any)} className="h-11 rounded-xl border border-[#d7dfeb] px-3 text-sm">
          <option value="all">{tx('Alle statuser', 'All statuses')}</option>
          <option value="draft">{tx('Utkast', 'Draft')}</option>
          <option value="active">{tx('Aktiv', 'Active')}</option>
          <option value="under_review">{tx('Under vurdering', 'Under review')}</option>
          <option value="closed">{tx('Lukket', 'Closed')}</option>
        </select>
        <select value={published} onChange={(event) => setPublished(event.target.value as any)} className="h-11 rounded-xl border border-[#d7dfeb] px-3 text-sm">
          <option value="all">{tx('All synlighet', 'All visibility')}</option>
          <option value="published">{tx('Publisert', 'Published')}</option>
          <option value="unpublished">{tx('Skjult', 'Hidden')}</option>
        </select>
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="h-11 rounded-xl border border-[#d7dfeb] px-3 text-sm">
          <option value="">{tx('Alle kategorier', 'All categories')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {getCategoryLabel(category, language)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : policies.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#d7dfeb] bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-[#173151]">
            {tx('Ingen saker matcher filtrene dine', 'No policies match your filters')}
          </p>
          <p className="mt-2 text-sm text-[#6b7f99]">
            {tx('Juster status, synlighet eller kategori for a se flere saker.', 'Adjust status, visibility, or category to see more policies.')}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-[#d7dfeb] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-[#f7f9fc]">
                <tr>
                  {[tx('Tittel', 'Title'), tx('Kategori', 'Category'), tx('Status', 'Status'), tx('Synlighet', 'Visibility'), tx('Oppdatert', 'Updated'), tx('Handlinger', 'Actions')].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7f99]">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebf0f6]">
                {policies.map((policy) => (
                  <tr key={policy.id}>
                    <td className="px-4 py-3 font-medium text-[#173151]">{getPolicyTitle(policy, language)}</td>
                    <td className="px-4 py-3 text-[#4e6482]">{getCategoryLabel(policy.category, language) || '—'}</td>
                    <td className="px-4 py-3 text-[#4e6482]">{policy.status}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublish(policy.id, !(policy.is_published ?? false))}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${(policy.is_published ?? false) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}
                      >
                        {(policy.is_published ?? false) ? tx('Publisert', 'Published') : tx('Skjult', 'Hidden')}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[#4e6482]">{formatDate(policy.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/policies/${policy.id}/klassisk`} className="rounded-full p-2 text-[#365476] hover:bg-[#eef3f8]">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link to={`/admin/policies/${policy.id}/edit`} className="rounded-full p-2 text-[#365476] hover:bg-[#eef3f8]">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button onClick={() => removePolicy(policy.id)} className="rounded-full p-2 text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#ebf0f6] px-4 py-4">
            <Button variant="outline" className="rounded-full" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              {tx('Forrige', 'Previous')}
            </Button>
            <span className="text-sm text-[#6b7f99]">{tx(`Side ${page} av ${totalPages}`, `Page ${page} of ${totalPages}`)}</span>
            <Button variant="outline" className="rounded-full" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
              {tx('Neste', 'Next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
