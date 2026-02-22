import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary-600">{APP_NAME}</h1>
        <p className="text-gray-600 mt-2">{MUNICIPALITY_NAME} Civic Engagement Platform</p>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your credentials to access the platform</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {DATA_PROVIDER === 'local' && (
              <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-md text-xs space-y-1">
                <p className="font-semibold">Local Mode Demo Accounts</p>
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
            <Button type="submit" className="w-full" disabled={loading}>
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
    </div>
  );
}
