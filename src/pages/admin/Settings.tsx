import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguageStore } from '../../store/languageStore';
import { useAppSettings, useCategoriesAdmin } from '../../hooks/useAdmin';
import type { Category } from '../../types';

const emptyCategory = (): Partial<Category> => ({
  id: '',
  name: '',
  label_no: '',
  label_en: '',
  description: '',
  color: '#3B82F6',
});

export default function Settings() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const { settings, loading, saveSettings } = useAppSettings();
  const { categories, loading: categoriesLoading, saveCategory, deleteCategory } = useCategoriesAdmin();
  const [form, setForm] = useState({
    municipality_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    ai_sentiment_enabled: true,
    ai_trend_detection_enabled: true,
    ai_summaries_enabled: true,
  });
  const [draftCategory, setDraftCategory] = useState<Partial<Category>>(emptyCategory());
  const [editingCategories, setEditingCategories] = useState<Record<string, Partial<Category>>>({});
  const [saved, setSaved] = useState('');

  useEffect(() => {
    if (!settings) return;
    setForm({
      municipality_name: settings.municipality_name,
      contact_email: settings.contact_email || '',
      contact_phone: settings.contact_phone || '',
      website: settings.website || '',
      ai_sentiment_enabled: settings.ai_sentiment_enabled,
      ai_trend_detection_enabled: settings.ai_trend_detection_enabled,
      ai_summaries_enabled: settings.ai_summaries_enabled,
    });
  }, [settings]);

  useEffect(() => {
    setEditingCategories(
      Object.fromEntries(
        categories.map((category) => [
          category.id,
          {
            id: category.id,
            name: category.name,
            label_no: category.label_no || category.name,
            label_en: category.label_en || category.name,
            description: category.description || '',
            color: category.color || '#3B82F6',
          },
        ])
      )
    );
  }, [categories]);

  if (loading || categoriesLoading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-[#173151]">{tx('Innstillinger', 'Settings')}</h1>
        <p className="mt-2 text-sm text-[#6b7f99]">
          {tx('Plattform- og kommuneoppsett for administrasjonen', 'Platform and municipality configuration for administrators')}
        </p>
      </div>

      {saved ? <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{saved}</div> : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[28px] border-[#d7dfeb]">
          <CardHeader><CardTitle>{tx('Kommuneinformasjon', 'Municipality information')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{tx('Kommunenavn', 'Municipality name')}</Label>
              <Input value={form.municipality_name} onChange={(e) => setForm((current) => ({ ...current, municipality_name: e.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{tx('Kontakt e-post', 'Contact email')}</Label>
                <Input value={form.contact_email} onChange={(e) => setForm((current) => ({ ...current, contact_email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{tx('Kontakttelefon', 'Contact phone')}</Label>
                <Input value={form.contact_phone} onChange={(e) => setForm((current) => ({ ...current, contact_phone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{tx('Nettsted', 'Website')}</Label>
              <Input value={form.website} onChange={(e) => setForm((current) => ({ ...current, website: e.target.value }))} />
            </div>

            <div className="rounded-2xl border border-[#d7dfeb] p-4">
              <p className="text-sm font-semibold text-[#173151]">{tx('AI-funksjoner', 'AI features')}</p>
              <div className="mt-4 space-y-3">
                {[
                  ['ai_sentiment_enabled', tx('Stemningsanalyse', 'Sentiment analysis')],
                  ['ai_trend_detection_enabled', tx('Trenddeteksjon', 'Trend detection')],
                  ['ai_summaries_enabled', tx('Automatiske oppsummeringer', 'Automatic summaries')],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between gap-4 text-sm text-[#365476]">
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(form[key as keyof typeof form])}
                      onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.checked }))}
                    />
                  </label>
                ))}
              </div>
            </div>

            <Button
              className="rounded-full"
              onClick={async () => {
                await saveSettings(form);
                setSaved(tx('Innstillingene ble lagret', 'Settings saved'));
                setTimeout(() => setSaved(''), 2500);
              }}
            >
              {tx('Lagre innstillinger', 'Save settings')}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-[#d7dfeb]">
          <CardHeader><CardTitle>{tx('Kategorier', 'Categories')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-[#d7dfeb] p-4">
              <p className="mb-4 text-sm font-semibold text-[#173151]">{tx('Ny kategori', 'New category')}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <Input placeholder="key" value={draftCategory.name || ''} onChange={(e) => setDraftCategory((current) => ({ ...current, name: e.target.value }))} />
                <Input placeholder={tx('Fargekode', 'Color hex')} value={draftCategory.color || ''} onChange={(e) => setDraftCategory((current) => ({ ...current, color: e.target.value }))} />
                <Input placeholder={tx('Norsk etikett', 'Norwegian label')} value={draftCategory.label_no || ''} onChange={(e) => setDraftCategory((current) => ({ ...current, label_no: e.target.value }))} />
                <Input placeholder={tx('Engelsk etikett', 'English label')} value={draftCategory.label_en || ''} onChange={(e) => setDraftCategory((current) => ({ ...current, label_en: e.target.value }))} />
              </div>
              <Input className="mt-3" placeholder={tx('Beskrivelse', 'Description')} value={draftCategory.description || ''} onChange={(e) => setDraftCategory((current) => ({ ...current, description: e.target.value }))} />
              <Button
                className="mt-3 rounded-full"
                variant="outline"
                onClick={async () => {
                  await saveCategory(draftCategory);
                  setDraftCategory(emptyCategory());
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {tx('Legg til kategori', 'Add category')}
              </Button>
            </div>

            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="rounded-2xl border border-[#d7dfeb] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          placeholder="key"
                          value={editingCategories[category.id]?.name || ''}
                          onChange={(event) =>
                            setEditingCategories((current) => ({
                              ...current,
                              [category.id]: {
                                ...current[category.id],
                                name: event.target.value,
                              },
                            }))
                          }
                        />
                        <Input
                          placeholder={tx('Fargekode', 'Color hex')}
                          value={editingCategories[category.id]?.color || ''}
                          onChange={(event) =>
                            setEditingCategories((current) => ({
                              ...current,
                              [category.id]: {
                                ...current[category.id],
                                color: event.target.value,
                              },
                            }))
                          }
                        />
                        <Input
                          placeholder={tx('Norsk etikett', 'Norwegian label')}
                          value={editingCategories[category.id]?.label_no || ''}
                          onChange={(event) =>
                            setEditingCategories((current) => ({
                              ...current,
                              [category.id]: {
                                ...current[category.id],
                                label_no: event.target.value,
                              },
                            }))
                          }
                        />
                        <Input
                          placeholder={tx('Engelsk etikett', 'English label')}
                          value={editingCategories[category.id]?.label_en || ''}
                          onChange={(event) =>
                            setEditingCategories((current) => ({
                              ...current,
                              [category.id]: {
                                ...current[category.id],
                                label_en: event.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <Input
                        placeholder={tx('Beskrivelse', 'Description')}
                        value={editingCategories[category.id]?.description || ''}
                        onChange={(event) =>
                          setEditingCategories((current) => ({
                            ...current,
                            [category.id]: {
                              ...current[category.id],
                              description: event.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <button className="rounded-full p-2 text-red-700 hover:bg-red-50" onClick={() => deleteCategory(category.id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={async () => {
                        await saveCategory(editingCategories[category.id] || category);
                        setSaved(tx('Kategorien ble oppdatert', 'Category updated'));
                        setTimeout(() => setSaved(''), 2500);
                      }}
                    >
                      {tx('Lagre kategori', 'Save category')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
