import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, User, LogOut, Menu, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../common/NotificationBell';
import { APP_NAME, MUNICIPALITY_NAME } from '../../lib/constants';
import { cn } from '../../lib/utils';

const navLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/policies', label: 'Policies', icon: FileText },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function CitizenLayout() {
  const { profile, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = useMemo(() => {
    const name = profile?.full_name || 'Citizen User';
    const parts = name.split(' ').filter(Boolean);
    return (parts[0]?.[0] || 'C') + (parts[1]?.[0] || '');
  }, [profile?.full_name]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#e9eef6]">
      <header className="bg-gradient-to-r from-[#1f4f92] via-[#2d66b4] to-[#3b79c9] shadow-lg sticky top-0 z-40 border-b border-white/20">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-[76px] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="md:hidden p-2 rounded-full text-white hover:bg-white/15"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <div className="h-11 w-11 rounded-full border border-white/50 bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-sm">
                CV
              </div>
              <div className="min-w-0">
                <h1 className="text-white font-semibold text-[1.1rem] sm:text-[1.35rem] leading-tight truncate">
                  {APP_NAME}{' '}
                  <span className="font-normal text-white/80">{MUNICIPALITY_NAME}</span>
                </h1>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    location.pathname === to
                      ? 'bg-white/20 text-white'
                      : 'text-white/85 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBell theme="dark" />

              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden sm:inline-flex h-9 px-3 rounded-md bg-white/15 text-white text-sm items-center hover:bg-white/25 transition-colors"
                >
                  Admin
                </Link>
              )}

              <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-full bg-white/10 border border-white/20">
                <div className="h-8 w-8 rounded-full bg-white text-[#275ca4] flex items-center justify-center text-xs font-semibold">
                  {initials}
                </div>
                <span className="text-white text-sm font-medium max-w-[140px] truncate">
                  {profile?.full_name}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="h-10 w-10 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/20 bg-[#275da5]">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 text-sm font-medium',
                  location.pathname === to
                    ? 'bg-white/20 text-white'
                    : 'text-white/90 hover:bg-white/10'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
}
