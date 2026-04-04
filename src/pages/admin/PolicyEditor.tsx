import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Plus, Trash2, Upload } from 'lucide-react';
import { useAdminPolicyWorkspace } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DistrictGeoMap from '../../components/admin/DistrictGeoMap';
import { useLanguageStore } from '../../store/languageStore';
import type { AdminPolicyWorkspacePayload, Event, PolicyTopic, PolicyUpdate } from '../../types';
import { deletePolicyAttachment, resolveAttachmentUrl, uploadPolicyAttachment } from '../../lib/policyAttachments';
import { getCategoryLabel } from '../../lib/policyContent';

const emptyTopic = (): PolicyTopic => ({
  id: crypto.randomUUID(),
  policy_id: '',
  slug: '',
  label_no: '',
  label_en: '',
  description_no: '',
  description_en: '',
  icon_key: '',
  sort_order: 0,
  created_at: new Date().toISOString(),
});

const emptyUpdate = (): PolicyUpdate => ({
  id: crypto.randomUUID(),
  policy_id: '',
  title: '',
  content: '',
  update_type: 'info',
  created_by: '',
  created_at: new Date().toISOString(),
});

const emptyEvent = (): Event => ({
  id: crypto.randomUUID(),
  policy_id: '',
  title: '',
  description: '',
  event_date: '',
  location: '',
  mode: 'in_person',
  registration_url: '',
  created_at: new Date().toISOString(),
});

export default function PolicyEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const { workspace, categories, districts, loading, saveWorkspace, deleteWorkspace, refetch } = useAdminPolicyWorkspace(id);

  const [form, setForm] = useState({
    title_no: '',
    title_en: '',
    description_no: '',
    description_en: '',
    category_id: '',
    status: 'draft',
    scope: 'municipality',
    start_date: '',
    end_date: '',
    allow_anonymous: true,
    video_url: '',
    is_published: false,
  });
  const [selectedDistrictIds, setSelectedDistrictIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [topics, setTopics] = useState<PolicyTopic[]>([]);
  const [updates, setUpdates] = useState<PolicyUpdate[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [attachments, setAttachments] = useState(workspace?.attachments || []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!workspace) return;
    setForm({
      title_no: workspace.policy.title_no || workspace.policy.title || '',
      title_en: workspace.policy.title_en || '',
      description_no: workspace.policy.description_no || workspace.policy.description || '',
      description_en: workspace.policy.description_en || '',
      category_id: workspace.policy.category_id || '',
      status: workspace.policy.status,
      scope: workspace.policy.scope,
      start_date: workspace.policy.start_date,
      end_date: workspace.policy.end_date || '',
      allow_anonymous: workspace.policy.allow_anonymous,
      video_url: workspace.policy.video_url || '',
      is_published: workspace.policy.is_published ?? false,
    });
    setSelectedDistrictIds(workspace.districts);
    setTags(workspace.tags.map((tag) => tag.tag));
    setTopics(workspace.topics.length ? workspace.topics : [emptyTopic()]);
    setUpdates(workspace.updates);
    setEvents(workspace.events);
    setAttachments(workspace.attachments);
  }, [workspace]);

  const activePolicyId = workspace?.policy.id || id || '';

  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    if (!form.title_no.trim()) issues.push(tx('Norsk tittel mangler', 'Norwegian title is required'));
    if (!form.title_en.trim()) issues.push(tx('Engelsk tittel mangler', 'English title is required'));
    if (!form.description_no.trim()) issues.push(tx('Norsk beskrivelse mangler', 'Norwegian description is required'));
    if (!form.description_en.trim()) issues.push(tx('Engelsk beskrivelse mangler', 'English description is required'));
    if (!form.category_id) issues.push(tx('Kategori mangler', 'Category is required'));
    if (!form.start_date) issues.push(tx('Startdato mangler', 'Start date is required'));
    if (form.scope === 'district' && selectedDistrictIds.length === 0) {
      issues.push(tx('Velg minst en bydel', 'Select at least one district'));
    }
    return issues;
  }, [form, selectedDistrictIds, tx]);

  const toggleDistrict = (districtId: string) => {
    setSelectedDistrictIds((current) =>
      current.includes(districtId) ? current.filter((item) => item !== districtId) : [...current, districtId]
    );
  };

  const addTag = () => {
    const normalized = tagInput.trim();
    if (!normalized || tags.includes(normalized)) return;
    setTags((current) => [...current, normalized]);
    setTagInput('');
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (validationIssues.length) {
        throw new Error(validationIssues[0]);
      }

      const payload: AdminPolicyWorkspacePayload = {
        policy: {
          id: activePolicyId || undefined,
          title: form.title_no,
          description: form.description_no,
          title_no: form.title_no,
          title_en: form.title_en,
          description_no: form.description_no,
          description_en: form.description_en,
          category_id: form.category_id,
          status: form.status as any,
          scope: form.scope as any,
          start_date: form.start_date,
          end_date: form.end_date || undefined,
          allow_anonymous: form.allow_anonymous,
          video_url: form.video_url,
          is_published: form.is_published,
          published_at: form.is_published ? new Date().toISOString() : null,
        } as any,
        district_ids: selectedDistrictIds,
        tags,
        topics: topics
          .filter((topic) => topic.slug.trim() && topic.label_no.trim() && topic.label_en.trim())
          .map((topic, index) => ({
            ...topic,
            sort_order: index,
          })),
        updates: updates
          .filter((update) => update.title.trim() && update.content.trim())
          .map((update) => ({
            ...update,
            update_type: update.update_type || 'info',
          })),
        events: events
          .filter((event) => event.title.trim() && event.event_date)
          .map((event) => ({
            ...event,
            mode: event.mode || 'in_person',
          })),
      };

      const savedPolicyId = await saveWorkspace(payload);


      if (pendingFiles.length > 0) {
        try {
          const uploaded = await Promise.all(
            pendingFiles.map((file) => uploadPolicyAttachment(savedPolicyId, file, user?.id))
          );
          setAttachments((current) => [...current, ...uploaded]);
          setPendingFiles([]);
        } catch (uploadErr) {
          // Check for RLS error (verified session required)
          const rlsMsg =
            typeof uploadErr === 'object' && uploadErr !== null && 'message' in uploadErr
              ? String(uploadErr.message)
              : String(uploadErr);
          if (rlsMsg.includes('row-level security policy') && rlsMsg.includes('verified session')) {
            setError(
              tx(
                'Du må verifisere økten din (f.eks. via tofaktor eller godkjent enhet) for å laste opp vedlegg.',
                'You must verify your session (e.g., MFA or trusted device) to upload attachments.'
              )
            );
            setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
            return;
          } else {
            throw uploadErr;
          }
        }
      }

      setSuccess(tx('Saken ble lagret', 'Policy saved'));
      if (!activePolicyId) {
        navigate(`/admin/policies/${savedPolicyId}/edit`, { replace: true });
      } else {
        await refetch();
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : tx('Kunne ikke lagre saken', 'Failed to save policy');
      setError(msg);
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activePolicyId) return;
    setSaving(true);
    try {
      await deleteWorkspace(activePolicyId);
      navigate('/admin/policies');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link to="/admin/policies" className="inline-flex items-center gap-2 text-sm font-medium text-[#3a5c87] hover:text-[#173151]">
            <ArrowLeft className="h-4 w-4" />
            {tx('Tilbake til saker', 'Back to policies')}
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-[#173151]">
            {activePolicyId ? tx('Rediger sak', 'Edit policy') : tx('Opprett ny sak', 'Create policy')}
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          {activePolicyId ? (
            <Button asChild variant="outline" className="rounded-full">
              <Link to={`/admin/policies/${activePolicyId}/preview`}>
                <Eye className="mr-2 h-4 w-4" />
                {tx('Forhandsvisning', 'Preview')}
              </Link>
            </Button>
          ) : null}
          {activePolicyId ? (
            <Button variant="outline" className="rounded-full text-red-700" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              {tx('Slett', 'Delete')}
            </Button>
          ) : null}
          <Button className="rounded-full" onClick={save} disabled={saving}>
            {saving ? tx('Lagrer...', 'Saving...') : tx('Lagre sak', 'Save policy')}
          </Button>
        </div>
      </div>

      {error ? <div ref={errorRef} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div> : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-6">
          <Card className="rounded-[28px] border-[#d7dfeb]">
            <CardHeader><CardTitle>{tx('Grunninnhold', 'Basics')}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{tx('Tittel (NO)', 'Title (NO)')}</Label>
                  <Input value={form.title_no} onChange={(event) => setForm((current) => ({ ...current, title_no: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{tx('Tittel (EN)', 'Title (EN)')}</Label>
                  <Input value={form.title_en} onChange={(event) => setForm((current) => ({ ...current, title_en: event.target.value }))} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{tx('Beskrivelse (NO)', 'Description (NO)')}</Label>
                  <Textarea className="min-h-[150px]" value={form.description_no} onChange={(event) => setForm((current) => ({ ...current, description_no: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{tx('Beskrivelse (EN)', 'Description (EN)')}</Label>
                  <Textarea className="min-h-[150px]" value={form.description_en} onChange={(event) => setForm((current) => ({ ...current, description_en: event.target.value }))} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>{tx('Kategori', 'Category')}</Label>
                  <select
                    value={form.category_id}
                    onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
                    className="h-11 w-full rounded-xl border border-[#d7dfeb] bg-white px-3 text-sm"
                  >
                    <option value="">{tx('Velg kategori', 'Select category')}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {getCategoryLabel(category, language)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{tx('Status', 'Status')}</Label>
                  <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="h-11 w-full rounded-xl border border-[#d7dfeb] bg-white px-3 text-sm">
                    <option value="draft">{tx('Utkast', 'Draft')}</option>
                    <option value="active">{tx('Aktiv', 'Active')}</option>
                    <option value="under_review">{tx('Under vurdering', 'Under review')}</option>
                    <option value="closed">{tx('Lukket', 'Closed')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{tx('Omfang', 'Scope')}</Label>
                  <select value={form.scope} onChange={(event) => setForm((current) => ({ ...current, scope: event.target.value }))} className="h-11 w-full rounded-xl border border-[#d7dfeb] bg-white px-3 text-sm">
                    <option value="municipality">{tx('Hele kommunen', 'Municipality')}</option>
                    <option value="district">{tx('Bydel', 'District')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{tx('Video URL', 'Video URL')}</Label>
                  <Input value={form.video_url} onChange={(event) => setForm((current) => ({ ...current, video_url: event.target.value }))} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{tx('Startdato', 'Start date')}</Label>
                  <Input type="date" value={form.start_date} onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{tx('Sluttdato', 'End date')}</Label>
                  <Input type="date" value={form.end_date} onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))} />
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="inline-flex items-center gap-2 text-sm text-[#365476]">
                  <input type="checkbox" checked={form.allow_anonymous} onChange={(event) => setForm((current) => ({ ...current, allow_anonymous: event.target.checked }))} />
                  {tx('Tillat anonyme tilbakemeldinger', 'Allow anonymous feedback')}
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-[#365476]">
                  <input type="checkbox" checked={form.is_published} onChange={(event) => setForm((current) => ({ ...current, is_published: event.target.checked }))} />
                  {tx('Publiser for innbyggere', 'Publish for citizens')}
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-[#d7dfeb]">
            <CardHeader><CardTitle>{tx('Bydeler', 'Districts')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <DistrictGeoMap
                districts={districts}
                selectedDistrictIds={selectedDistrictIds}
                onToggleDistrict={toggleDistrict}
                readOnly={false}
              />
              <div className="flex flex-wrap gap-2">
                {districts.map((district) => (
                  <button
                    key={district.id}
                    type="button"
                    onClick={() => toggleDistrict(district.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${selectedDistrictIds.includes(district.id) ? 'border-[#24589d] bg-[#24589d] text-white' : 'border-[#d7dfeb] bg-white text-[#365476]'}`}
                  >
                    {district.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-[#d7dfeb]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{tx('Temaer', 'Topics')}</CardTitle>
              <Button type="button" variant="outline" onClick={() => setTopics((current) => [...current, emptyTopic()])}>
                <Plus className="mr-2 h-4 w-4" />
                {tx('Legg til tema', 'Add topic')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {topics.map((topic, index) => (
                <div key={topic.id || index} className="rounded-2xl border border-[#d7dfeb] p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#173151]">
                      {tx(`Tema ${index + 1}`, `Topic ${index + 1}`)}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 rounded-full px-3 text-red-700"
                      onClick={() =>
                        setTopics((current) =>
                          current.length === 1 ? [emptyTopic()] : current.filter((_, itemIndex) => itemIndex !== index)
                        )
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {tx('Fjern', 'Remove')}
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input placeholder="slug" value={topic.slug} onChange={(event) => setTopics((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, slug: event.target.value } : item))} />
                    <Input placeholder={tx('Ikonnokkel', 'Icon key')} value={topic.icon_key || ''} onChange={(event) => setTopics((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, icon_key: event.target.value } : item))} />
                    <Input placeholder={tx('Norsk etikett', 'Norwegian label')} value={topic.label_no} onChange={(event) => setTopics((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label_no: event.target.value } : item))} />
                    <Input placeholder={tx('Engelsk etikett', 'English label')} value={topic.label_en} onChange={(event) => setTopics((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label_en: event.target.value } : item))} />
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Textarea placeholder={tx('Beskrivelse (NO)', 'Description (NO)')} value={topic.description_no || ''} onChange={(event) => setTopics((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, description_no: event.target.value } : item))} />
                    <Textarea placeholder={tx('Beskrivelse (EN)', 'Description (EN)')} value={topic.description_en || ''} onChange={(event) => setTopics((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, description_en: event.target.value } : item))} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-[#d7dfeb]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{tx('Oppdateringer', 'Updates')}</CardTitle>
              <Button type="button" variant="outline" onClick={() => setUpdates((current) => [...current, emptyUpdate()])}>
                <Plus className="mr-2 h-4 w-4" />
                {tx('Legg til oppdatering', 'Add update')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {updates.map((update, index) => (
                <div key={update.id || index} className="rounded-2xl border border-[#d7dfeb] p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#173151]">
                      {tx(`Oppdatering ${index + 1}`, `Update ${index + 1}`)}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 rounded-full px-3 text-red-700"
                      onClick={() => setUpdates((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {tx('Fjern', 'Remove')}
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                    <Input placeholder={tx('Tittel', 'Title')} value={update.title} onChange={(event) => setUpdates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} />
                    <select value={update.update_type || 'info'} onChange={(event) => setUpdates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, update_type: event.target.value as any } : item))} className="h-11 rounded-xl border border-[#d7dfeb] px-3 text-sm">
                      <option value="info">{tx('Info', 'Info')}</option>
                      <option value="status_change">{tx('Statusendring', 'Status change')}</option>
                      <option value="decision">{tx('Beslutning', 'Decision')}</option>
                      <option value="deadline">{tx('Frist', 'Deadline')}</option>
                    </select>
                  </div>
                  <Textarea className="mt-4" placeholder={tx('Innhold', 'Content')} value={update.content} onChange={(event) => setUpdates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, content: event.target.value } : item))} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-[#d7dfeb]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{tx('Arrangementer', 'Events')}</CardTitle>
              <Button type="button" variant="outline" onClick={() => setEvents((current) => [...current, emptyEvent()])}>
                <Plus className="mr-2 h-4 w-4" />
                {tx('Legg til arrangement', 'Add event')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {events.map((event, index) => (
                <div key={event.id || index} className="rounded-2xl border border-[#d7dfeb] p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#173151]">
                      {tx(`Arrangement ${index + 1}`, `Event ${index + 1}`)}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 rounded-full px-3 text-red-700"
                      onClick={() => setEvents((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {tx('Fjern', 'Remove')}
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input placeholder={tx('Tittel', 'Title')} value={event.title} onChange={(e) => setEvents((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item))} />
                    <Input type="datetime-local" value={event.event_date ? event.event_date.slice(0, 16) : ''} onChange={(e) => setEvents((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, event_date: new Date(e.target.value).toISOString() } : item))} />
                    <Input placeholder={tx('Sted', 'Location')} value={event.location || ''} onChange={(e) => setEvents((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, location: e.target.value } : item))} />
                    <select value={event.mode} onChange={(e) => setEvents((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, mode: e.target.value as any } : item))} className="h-11 rounded-xl border border-[#d7dfeb] px-3 text-sm">
                      <option value="in_person">{tx('Fysisk', 'In person')}</option>
                      <option value="online">{tx('Digitalt', 'Online')}</option>
                      <option value="hybrid">{tx('Hybrid', 'Hybrid')}</option>
                    </select>
                  </div>
                  <Textarea className="mt-4" placeholder={tx('Beskrivelse', 'Description')} value={event.description || ''} onChange={(e) => setEvents((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, description: e.target.value } : item))} />
                  <Input className="mt-4" placeholder={tx('Registreringslenke', 'Registration URL')} value={event.registration_url || ''} onChange={(e) => setEvents((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, registration_url: e.target.value } : item))} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-[#d7dfeb]">
            <CardHeader><CardTitle>{tx('Vedlegg', 'Attachments')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#c8d4e4] bg-[#f7f9fc] px-4 py-6 text-sm font-medium text-[#365476]">
                <Upload className="h-4 w-4" />
                {tx('Velg filer', 'Choose files')}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) =>
                    setPendingFiles((current) => [...current, ...Array.from(event.target.files || [])])
                  }
                />
              </label>

              {pendingFiles.length > 0 ? (
                <div className="space-y-2">
                  {pendingFiles.map((file) => (
                    <div key={file.name} className="rounded-xl border border-[#d7dfeb] px-3 py-2 text-sm text-[#365476]">
                      {file.name}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#d7dfeb] px-3 py-2">
                    <a href={resolveAttachmentUrl(attachment.file_path)} target="_blank" rel="noreferrer" className="truncate text-sm font-medium text-[#24589d] hover:underline">
                      {attachment.file_name}
                    </a>
                    <button
                      type="button"
                      className="text-sm text-red-700"
                      onClick={async () => {
                        await deletePolicyAttachment(attachment);
                        setAttachments((current) => current.filter((item) => item.id !== attachment.id));
                      }}
                    >
                      {tx('Slett', 'Delete')}
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-[#d7dfeb]">
            <CardHeader><CardTitle>{tx('Tagger', 'Tags')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(event) => setTagInput(event.target.value)} placeholder={tx('Legg til tagg', 'Add tag')} />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button key={tag} type="button" onClick={() => setTags((current) => current.filter((item) => item !== tag))} className="rounded-full border border-[#d7dfeb] px-3 py-1 text-sm text-[#365476]">
                    {tag}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-[#d7dfeb]">
            <CardHeader><CardTitle>{tx('Publisering', 'Publishing')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl bg-[#f5f8fb] p-4">
                <p className="text-sm font-medium text-[#173151]">
                  {form.is_published ? tx('Saken er synlig for innbyggere', 'This policy is visible to citizens') : tx('Saken er skjult for innbyggere', 'This policy is hidden from citizens')}
                </p>
                <p className="mt-2 text-sm text-[#6b7f99]">
                  {tx(`Status: ${form.status}`, `Status: ${form.status}`)}
                </p>
                {activePolicyId ? (
                  <Link to={`/admin/policies/${activePolicyId}/preview`} className="mt-3 inline-flex text-sm font-medium text-[#24589d] hover:underline">
                    {tx('Apne innbyggervisning', 'Open citizen preview')}
                  </Link>
                ) : null}
              </div>

              {validationIssues.length > 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <p className="font-semibold">{tx('Mangler for publisering', 'Missing before publishing')}</p>
                  <ul className="mt-2 list-disc pl-5">
                    {validationIssues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
