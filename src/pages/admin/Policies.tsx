import { useEffect, useMemo, useState } from 'react';
import { Eye, MessageSquare, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminPolicies, useCategoriesAdmin } from '../../hooks/useAdmin';
import { useLanguageStore } from '../../store/languageStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PolicyFeedbackDrawer from '../../components/admin/PolicyFeedbackDrawer';
import { formatDate } from '../../lib/utils';
import { getCategoryLabel, getPolicyTitle } from '../../lib/policyContent';
import { supabase } from '../../lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';

export default function AdminPolicies() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'draft' | 'active' | 'under_review' | 'closed'>('all');
  const [categoryId, setCategoryId] = useState('');
  const [published, setPublished] = useState<'all' | 'published' | 'unpublished'>('all');
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null);
  const [feedbackDrawer, setFeedbackDrawer] = useState<{ id: string; title: string } | null>(null);
  const { policies, total, loading, refetch, deletePolicy } = useAdminPolicies({
    search,
    status,
    categoryId: categoryId || undefined,
    published,
    page,
    limit: 15,
  });
  const { categories } = useCategoriesAdmin();

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / 15)), [total]);


  // Fetch feedback counts only
  const [feedbackCounts, setFeedbackCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!policies.length) return;
    let cancelled = false;
    const ids = policies.map((p) => p.id);
    supabase
      .from('feedback')
      .select('policy_id')
      .in('policy_id', ids)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const counts: Record<string, number> = {};
        for (const row of data as { policy_id: string }[]) {
          counts[row.policy_id] = (counts[row.policy_id] ?? 0) + 1;
        }
        setFeedbackCounts(counts);
      });
    return () => { cancelled = true; };
  }, [policies]);

  const policyToDeleteData = useMemo(() => {
    return policies.find(policy => policy.id === policyToDelete) || null;
  }, [policies, policyToDelete]);

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

  const removePolicy = (policyId: string) => {
    setPolicyToDelete(policyId);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePolicy = async () => {
    if (!policyToDelete) return;
    try {
      await deletePolicy(policyToDelete);
      setDeleteDialogOpen(false);
      setPolicyToDelete(null);
    } catch {
      // deletion failed — dialog stays open
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#173151] sm:text-3xl">{tx('Saksadministrasjon', 'Policy management')}</h1>
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
            <div className="divide-y divide-[#ebf0f6] md:hidden">
              {policies.map((policy) => (
                <article key={policy.id} className="space-y-4 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-[#173151]">{getPolicyTitle(policy, language)}</p>
                      <p className="mt-1 text-sm text-[#4e6482]">{getCategoryLabel(policy.category, language) || '—'}</p>
                    </div>
                    <button
                      onClick={() => togglePublish(policy.id, !(policy.is_published ?? false))}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${(policy.is_published ?? false) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}
                    >
                      {(policy.is_published ?? false) ? tx('Publisert', 'Published') : tx('Skjult', 'Hidden')}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-[#6b7f99]">
                    <span className="rounded-full bg-[#f3f6fb] px-2.5 py-1">{policy.status}</span>
                    <span>{formatDate(policy.updated_at)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to={`/admin/policies/${policy.id}/preview`} title={tx('Forhåndsvisning', 'Preview')} className="rounded-full p-2 w-10 h-10 flex items-center justify-center text-[#365476] hover:bg-[#eef3f8]">
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => setFeedbackDrawer({ id: policy.id, title: getPolicyTitle(policy, language) })}
                      title={tx(`${feedbackCounts[policy.id] ?? 0} kommentarer – klikk for å se`, `${feedbackCounts[policy.id] ?? 0} comments – click to view`)}
                      className="flex items-center justify-center gap-1 rounded-full w-14 h-10 px-2 py-1.5 text-[#365476] hover:bg-[#eef3f8] transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-xs font-semibold tabular-nums">{feedbackCounts[policy.id] ?? 0}</span>
                    </button>
                    <Link to={`/admin/policies/${policy.id}/edit`} title={tx('Rediger', 'Edit')} className="rounded-full p-2 w-10 h-10 flex items-center justify-center text-[#365476] hover:bg-[#eef3f8]">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button onClick={() => removePolicy(policy.id)} title={tx('Slett', 'Delete')} className="rounded-full p-2 w-10 h-10 flex items-center justify-center text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
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
                      <td className="px-4 py-3 min-w-[220px]">
                        <div className="flex items-center gap-2 w-full">
                          <Link to={`/admin/policies/${policy.id}/preview`} title={tx('Forhåndsvisning', 'Preview')} className="rounded-full p-2 w-10 h-10 flex items-center justify-center text-[#365476] hover:bg-[#eef3f8]">
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setFeedbackDrawer({ id: policy.id, title: getPolicyTitle(policy, language) })}
                            title={tx(`${feedbackCounts[policy.id] ?? 0} kommentarer – klikk for å se`, `${feedbackCounts[policy.id] ?? 0} comments – click to view`)}
                            className="flex items-center justify-center gap-1 rounded-full w-14 h-10 px-2 py-1.5 text-[#365476] hover:bg-[#eef3f8] transition-colors"
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-xs font-semibold tabular-nums">
                              {feedbackCounts[policy.id] ?? 0}
                            </span>
                          </button>
                          <Link to={`/admin/policies/${policy.id}/edit`} title={tx('Rediger', 'Edit')} className="rounded-full p-2 w-10 h-10 flex items-center justify-center text-[#365476] hover:bg-[#eef3f8]">
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button onClick={() => removePolicy(policy.id)} title={tx('Slett', 'Delete')} className="rounded-full p-2 w-10 h-10 flex items-center justify-center text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-[#ebf0f6] px-4 py-4 sm:flex-row">
              <Button variant="outline" className="w-full rounded-full sm:w-auto" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                {tx('Forrige', 'Previous')}
              </Button>
              <span className="text-sm text-[#6b7f99]">{tx(`Side ${page} av ${totalPages}`, `Page ${page} of ${totalPages}`)}</span>
              <Button variant="outline" className="w-full rounded-full sm:w-auto" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                {tx('Neste', 'Next')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tx('Bekreft sletting', 'Confirm deletion')}</DialogTitle>
            <DialogDescription>
              {policyToDeleteData ? (
                tx(
                  `Er du sikker på at du vil slette saken "${getPolicyTitle(policyToDeleteData, language)}"? Denne handlingen kan ikke angres.`,
                  `Are you sure you want to delete the policy "${getPolicyTitle(policyToDeleteData, language)}"? This action cannot be undone.`
                )
              ) : (
                tx(
                  'Er du sikker på at du vil slette denne saken? Denne handlingen kan ikke angres.',
                  'Are you sure you want to delete this policy? This action cannot be undone.'
                )
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {tx('Avbryt', 'Cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDeletePolicy} disabled={!policyToDelete}>
              {tx('Slett', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {feedbackDrawer && (
        <PolicyFeedbackDrawer
          policyId={feedbackDrawer.id}
          policyTitle={feedbackDrawer.title}
          onClose={() => setFeedbackDrawer(null)}
        />
      )}
    </>
  );
}
