import { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePolicies } from '../../hooks/usePolicies';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { formatDate } from '../../lib/utils';
import { POLICY_CATEGORIES, POLICY_STATUSES } from '../../lib/constants';
import type { Policy, PolicyStatus } from '../../types/policy.types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguageStore } from '../../store/languageStore';

const policySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description too short'),
  status: z.enum(['draft', 'active', 'under_review', 'closed']),
  scope: z.enum(['municipality', 'district']),
  start_date: z.string(),
  end_date: z.string().optional(),
  allow_anonymous: z.boolean(),
  video_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});
type PolicyFormData = z.infer<typeof policySchema>;

export default function AdminPolicies() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const { policies, loading, total, refetch } = usePolicies({
    status: statusFilter === 'all' ? undefined : (statusFilter as PolicyStatus),
    search: search || undefined,
    page,
    limit: 15,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PolicyFormData>({
    resolver: zodResolver(policySchema),
    defaultValues: { status: 'draft', scope: 'municipality', allow_anonymous: true },
  });

  const openCreate = () => {
    setEditPolicy(null);
    reset({ status: 'draft', scope: 'municipality', allow_anonymous: true, start_date: new Date().toISOString().split('T')[0] });
    setDialogOpen(true);
  };

  const openEdit = (policy: Policy) => {
    setEditPolicy(policy);
    reset({
      title: policy.title,
      description: policy.description,
      status: policy.status,
      scope: policy.scope,
      start_date: policy.start_date,
      end_date: policy.end_date || '',
      allow_anonymous: policy.allow_anonymous,
      video_url: policy.video_url || '',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: PolicyFormData) => {
    setSaving(true);
    try {
      const payload = { ...data, end_date: data.end_date || null, video_url: data.video_url || null, created_by: user?.id };
      if (editPolicy) {
        await supabase.from('policies').update(payload).eq('id', editPolicy.id);
      } else {
        await supabase.from('policies').insert(payload);
      }
      setDialogOpen(false);
      refetch();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('policies').delete().eq('id', id);
    setDeleteConfirm(null);
    refetch();
  };

  const totalPages = Math.ceil(total / 15);
  const statusLabel = (status: PolicyStatus) => {
    if (status === 'draft') return tx('utkast', 'draft');
    if (status === 'active') return tx('aktiv', 'active');
    if (status === 'under_review') return tx('under vurdering', 'under review');
    return tx('lukket', 'closed');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tx('Saksadministrasjon', 'Policy administration')}</h1>
          <p className="text-gray-500 text-sm">{total} {tx('saker totalt', 'policies total')}</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />{tx('Ny sak', 'New policy')}</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder={tx('Sok i saker...', 'Search policies...')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tx('Alle statuser', 'All statuses')}</SelectItem>
            {POLICY_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{statusLabel(s.value as PolicyStatus)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {[tx('Tittel', 'Title'), tx('Status', 'Status'), tx('Kategori', 'Category'), tx('Startdato', 'Start date'), tx('Sluttdato', 'End date'), tx('Handlinger', 'Actions')].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {policies.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{p.title}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status as 'active' | 'under_review' | 'closed' | 'draft'}>{statusLabel(p.status as PolicyStatus)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.category?.name || '\u2014'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(p.start_date)}</td>
                    <td className="px-4 py-3 text-gray-600">{p.end_date ? formatDate(p.end_date) : '\u2014'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Link to={`/policies/${p.id}`} className="p-1.5 text-gray-500 hover:text-primary-600 rounded" title={tx('Se', 'View')}><Eye className="h-4 w-4" /></Link>
                        <button onClick={() => openEdit(p)} className="p-1.5 text-gray-500 hover:text-blue-600 rounded" title={tx('Rediger', 'Edit')}><Edit className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 text-gray-500 hover:text-red-600 rounded" title={tx('Slett', 'Delete')}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 py-4 border-t">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border rounded disabled:opacity-50">{tx('Forrige', 'Previous')}</button>
              <span className="text-sm text-gray-600">{tx('Side', 'Page')} {page} {tx('av', 'of')} {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border rounded disabled:opacity-50">{tx('Neste', 'Next')}</button>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPolicy ? tx('Rediger sak', 'Edit policy') : tx('Opprett ny sak', 'Create new policy')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>{tx('Tittel', 'Title')} *</Label>
              <Input {...register('title')} placeholder={tx('Sakstittel', 'Policy title')} />
              {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>{tx('Beskrivelse', 'Description')} *</Label>
              <Textarea {...register('description')} className="min-h-[120px]" placeholder={tx('Detaljert beskrivelse', 'Detailed description')} />
              {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{tx('Status', 'Status')}</Label>
                <select {...register('status')} className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background">
                  {POLICY_STATUSES.map(s => <option key={s.value} value={s.value}>{statusLabel(s.value as PolicyStatus)}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>{tx('Omfang', 'Scope')}</Label>
                <select {...register('scope')} className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background">
                  <option value="municipality">{tx('Hele kommunen', 'Whole municipality')}</option>
                  <option value="district">{tx('Bydel', 'District')}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{tx('Startdato', 'Start date')} *</Label>
                <Input type="date" {...register('start_date')} />
              </div>
              <div className="space-y-1">
                <Label>{tx('Sluttdato (valgfri)', 'End date (optional)')}</Label>
                <Input type="date" {...register('end_date')} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{tx('Video-URL (valgfri)', 'Video URL (optional)')}</Label>
              <Input {...register('video_url')} placeholder="https://youtube.com/..." />
              {errors.video_url && <p className="text-red-500 text-xs">{errors.video_url.message}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="allow_anonymous" {...register('allow_anonymous')} className="rounded" />
              <Label htmlFor="allow_anonymous" className="font-normal">{tx('Tillat anonym tilbakemelding', 'Allow anonymous feedback')}</Label>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>{tx('Avbryt', 'Cancel')}</Button>
              <Button type="submit" disabled={saving}>{saving ? tx('Lagrer...', 'Saving...') : editPolicy ? tx('Oppdater', 'Update') : tx('Opprett', 'Create')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{tx('Slette sak?', 'Delete policy?')}</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">{tx('Denne handlingen kan ikke angres. Tilhorende stemmer og tilbakemeldinger slettes.', 'This action cannot be undone. Related votes and feedback will be deleted.')}</p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>{tx('Avbryt', 'Cancel')}</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>{tx('Slett', 'Delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
