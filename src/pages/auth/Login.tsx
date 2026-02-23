import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { APP_NAME, MUNICIPALITY_NAME } from '../../lib/constants';
import { DATA_PROVIDER, supabase } from '../../lib/supabase';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    setLoading(true);
    try {
      const { data: authData, error } = await signIn(data.email, data.password);
      if (error) throw error;

      let destination = from;
      if (from === '/') {
        const userId = authData.user?.id;
        if (userId) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

          if (userProfile?.role === 'admin' || userProfile?.role === 'super_admin') {
            destination = '/admin';
          }
        }
      }

      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e7edf6]">
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative overflow-hidden bg-[#237987] px-6 py-10 sm:px-10 lg:px-14 lg:py-12 hidden lg:block">
          <div className="absolute -top-32 -left-16 h-[340px] w-[440px] rounded-[130px] bg-gradient-to-br from-[#5bc4cf] via-[#2a8c98] to-transparent opacity-80" />
          <div className="absolute top-0 right-0 h-[260px] w-[340px] rounded-bl-[120px] bg-[#2c8594] opacity-80" />
          <div className="absolute bottom-0 right-16 h-[260px] w-[360px] rounded-t-[170px] bg-[#2d8292] opacity-80" />

          <div className="relative z-10 max-w-lg text-white">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Civic Participation Platform
            </p>
            <h1 className="mt-6 text-5xl leading-tight font-semibold">
              {APP_NAME}
            </h1>
            <p className="mt-3 text-2xl text-white/90">{MUNICIPALITY_NAME}</p>
            <p className="mt-6 text-lg text-white/90 leading-relaxed">
              Track municipal consultations, submit feedback, and follow outcomes with a modern resident portal.
            </p>

            <div className="mt-10 space-y-4">
              <FeatureItem text="Participate in consultations and vote sentiment" />
              <FeatureItem text="Get updates when policies in your area change" />
              <FeatureItem text="Access personalized engagement history" />
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <Card className="w-full max-w-md border-[#d8e2ef] shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-[#12364d]">Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access the platform
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                {DATA_PROVIDER === 'local' && (
                  <div className="rounded-lg border border-[#cfe4ea] bg-[#ecf7f9] px-4 py-3 text-xs text-[#205a73] space-y-1">
                    <p className="font-semibold">Local mode demo accounts</p>
                    <p>`admin@civicus.local` / `admin12345` (admin)</p>
                    <p>`citizen@civicus.local` / `citizen12345` (citizen)</p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="your@email.com" {...register('email')} />
                  {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
                  {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                </div>
                <div className="text-right">
                  <Link to="/reset-password" className="text-sm text-primary-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full bg-[#237987] hover:bg-[#1f6974]" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-primary-600 hover:underline font-medium">
                    Sign up
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </section>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full border border-white/30 bg-white/10 flex items-center justify-center">
        <ShieldCheck className="h-4 w-4 text-white" />
      </div>
      <p className="text-white/95 text-base">{text}</p>
    </div>
  );
}
