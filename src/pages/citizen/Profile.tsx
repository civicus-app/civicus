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

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email_notifications: z.boolean(),
  date_of_birth: z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  const { profile, user, refetchProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [engagements, setEngagements] = useState<{ policy_id: string; title: string; type: string; date: string }[]>([]);

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
        ...(votes.data || []).map((v: any) => ({ policy_id: v.policy_id, title: v.policies?.title || '', type: 'Vote', date: v.created_at })),
        ...(feedback.data || []).map((f: any) => ({ policy_id: f.policy_id, title: f.policies?.title || '', type: 'Feedback', date: f.created_at })),
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
      setSaveMsg('Profile updated successfully!');
      refetchProfile?.();
      setTimeout(() => setSaveMsg(''), 3000);
    }
    setSaving(false);
  };

  if (!profile) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="engagement">Engagement History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {saveMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded text-sm">{saveMsg}</div>}
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input {...register('full_name')} />
                  {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile.email} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500">Email cannot be changed here</p>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth (optional)</Label>
                  <Input type="date" {...register('date_of_birth')} />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="email_notifications" {...register('email_notifications')} className="rounded" />
                  <Label htmlFor="email_notifications" className="font-normal">Receive email notifications</Label>
                </div>
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <Card>
            <CardHeader><CardTitle>Engagement History</CardTitle></CardHeader>
            <CardContent>
              {engagements.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No engagement activity yet</p>
              ) : (
                <div className="space-y-3">
                  {engagements.map((e, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{e.title || 'Unknown Policy'}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${e.type === 'Vote' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {e.type}
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
            <CardHeader><CardTitle>Account Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-gray-900">Account Role</p>
                  <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-gray-900">Member Since</p>
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
