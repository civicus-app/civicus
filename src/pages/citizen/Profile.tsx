import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../lib/utils';
import { useLanguageStore } from '../../store/languageStore';

type ProfileForm = {
  full_name: string;
  email_notifications: boolean;
  date_of_birth?: string;
};

export default function Profile() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const { profile, user, refetchProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [engagements, setEngagements] = useState<{ policy_id: string; title: string; type: string; date: string }[]>([]);
  const profileSchema = z.object({
    full_name: z.string().min(2, tx('Navnet ma vaere minst 2 tegn', 'Name must be at least 2 characters')),
    email_notifications: z.boolean(),
    date_of_birth: z.string().optional(),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      email_notifications: profile?.email_notifications ?? true,
      date_of_birth: profile?.date_of_birth || '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name,
        email_notifications: profile.email_notifications,
        date_of_birth: profile.date_of_birth || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    const fetchEngagements = async () => {
      if (!user) return;
      const [votes, feedback] = await Promise.all([
        supabase.from('sentiment_votes').select('policy_id, created_at, policies(title)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('feedback').select('policy_id, created_at, policies(title)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      ]);
      const combined = [
        ...(votes.data || []).map((v: any) => ({ policy_id: v.policy_id, title: v.policies?.title || '', type: 'vote', date: v.created_at })),
        ...(feedback.data || []).map((f: any) => ({ policy_id: f.policy_id, title: f.policies?.title || '', type: 'feedback', date: f.created_at })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEngagements(combined);
    };
    fetchEngagements();
  }, [user]);

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
    if (!error) {
      setSaveMsg(tx('Profil oppdatert!', 'Profile updated!'));
      refetchProfile?.();
      setTimeout(() => setSaveMsg(''), 3000);
    }
    setSaving(false);
  };

  if (!profile) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{tx('Din profil', 'Your profile')}</h1>
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">{tx('Profil', 'Profile')}</TabsTrigger>
          <TabsTrigger value="engagement">{tx('Historikk', 'History')}</TabsTrigger>
          <TabsTrigger value="settings">{tx('Innstillinger', 'Settings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>{tx('Personlig informasjon', 'Personal information')}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {saveMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded text-sm">{saveMsg}</div>}
                <div className="space-y-2">
                  <Label>{tx('Fullt navn', 'Full name')}</Label>
                  <Input {...register('full_name')} />
                  {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{tx('E-post', 'Email')}</Label>
                  <Input value={profile.email} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500">{tx('E-post kan ikke endres her', 'Email cannot be changed here')}</p>
                </div>
                <div className="space-y-2">
                  <Label>{tx('Fodselsdato (valgfri)', 'Date of birth (optional)')}</Label>
                  <Input type="date" {...register('date_of_birth')} />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="email_notifications" {...register('email_notifications')} className="rounded" />
                  <Label htmlFor="email_notifications" className="font-normal">{tx('Motta e-postvarsler', 'Receive email notifications')}</Label>
                </div>
                <Button type="submit" disabled={saving}>{saving ? tx('Lagrer...', 'Saving...') : tx('Lagre endringer', 'Save changes')}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <Card>
            <CardHeader><CardTitle>{tx('Aktivitetshistorikk', 'Activity history')}</CardTitle></CardHeader>
            <CardContent>
              {engagements.length === 0 ? (
                <p className="text-gray-500 text-center py-6">{tx('Ingen aktivitet enda', 'No activity yet')}</p>
              ) : (
                <div className="space-y-3">
                  {engagements.map((e, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{e.title || tx('Ukjent sak', 'Unknown policy')}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${e.type === 'vote' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {e.type === 'vote' ? tx('Stemme', 'Vote') : tx('Tilbakemelding', 'Feedback')}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(e.date)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader><CardTitle>{tx('Kontoinnstillinger', 'Account settings')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-gray-900">{tx('Kontorolle', 'Account role')}</p>
                  <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-gray-900">{tx('Medlem siden', 'Member since')}</p>
                  <p className="text-sm text-gray-500">{formatDate(profile.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
