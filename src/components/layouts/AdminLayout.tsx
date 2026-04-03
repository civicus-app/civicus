import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  BarChart3,
  FileStack,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LanguageToggle from '../common/LanguageToggle';
import BrandMark from '../common/BrandMark';
import { APP_NAME } from '../../lib/constants';
import { useLanguageStore } from '../../store/languageStore';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, labelNo: 'Oversikt', labelEn: 'Dashboard' },
  { to: '/admin/policies', icon: FileStack, labelNo: 'Saker', labelEn: 'Policies' },
  { to: '/admin/analytics', icon: BarChart3, labelNo: 'Analyse', labelEn: 'Analytics' },
  { to: '/admin/users', icon: Users, labelNo: 'Brukere', labelEn: 'Users' },
  { to: '/admin/settings', icon: Settings, labelNo: 'Innstillinger', labelEn: 'Settings' },
];

export interface AdminOutletContext {
  timePeriod: string;
  setTimePeriod: (value: string) => void;
}

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [timePeriod, setTimePeriod] = useState('30d');

  const initials = useMemo(() => {
    const name = profile?.full_name || tx('Administrator', 'Admin');
    const parts = name.split(' ').filter(Boolean);
    return (parts[0]?.[0] || 'A') + (parts[1]?.[0] || '');
  }, [profile?.full_name, tx]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#eef3f8]">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[#d8e2ef] bg-white px-5 py-5 shadow-[0_20px_60px_rgba(40,73,118,0.08)] transition-transform md:static md:translate-x-0',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-3">
              <BrandMark
                className="h-12 w-12 rounded-full border-[#d1deed] bg-[#f7fafc] p-[4%]"
                imageClassName="scale-[1.06]"
              />
              <div>
                <p className="text-base font-semibold text-[#173151]">{APP_NAME}</p>
                <p className="text-xs text-[#6b7f99]">{tx('Administrasjon', 'Administration')}</p>
              </div>
            </Link>

            <button
              className="rounded-full p-2 text-[#537197] hover:bg-[#eef3f8] md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label={tx('Lukk meny', 'Close menu')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 rounded-[24px] border border-[#d8e2ef] bg-[#f5f8fb] p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#24589d] text-sm font-semibold text-white">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#173151]">
                  {profile?.full_name || tx('Administrator', 'Administrator')}
                </p>
                <p className="truncate text-xs text-[#6b7f99]">{profile?.email}</p>
              </div>
            </div>
          </div>

          <nav className="mt-6 space-y-1.5">
            {navItems.map(({ to, icon: Icon, labelNo, labelEn }) => {
              const active = location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                    active
                      ? 'bg-[#24589d] text-white shadow-[0_14px_30px_rgba(36,88,157,0.24)]'
                      : 'text-[#365476] hover:bg-[#eef3f8] hover:text-[#173151]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{language === 'en' ? labelEn : labelNo}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 pt-6">
            <LanguageToggle className="inline-flex shadow-none" />
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d8e2ef] px-4 py-3 text-sm font-medium text-[#365476] transition-colors hover:bg-[#eef3f8]"
            >
              <LogOut className="h-4 w-4" />
              <span>{tx('Logg ut', 'Sign out')}</span>
            </button>
          </div>
        </aside>

        {mobileOpen ? (
          <button
            className="fixed inset-0 z-40 bg-[#10233d]/30 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label={tx('Lukk administrasjonsmeny', 'Close admin menu')}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[#d8e2ef] bg-white/90 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  className="rounded-full border border-[#d8e2ef] bg-white p-2 text-[#365476] shadow-sm md:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label={tx('Apen meny', 'Open menu')}
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7f99]">
                    {tx('Adminarbeidsflate', 'Admin workspace')}
                  </p>
                  <h1 className="text-xl font-semibold text-[#173151]">
                    {navItems.find((item) => location.pathname === item.to || (item.to !== '/admin' && location.pathname.startsWith(item.to)))?.[
                      language === 'en' ? 'labelEn' : 'labelNo'
                    ] || tx('Oversikt', 'Dashboard')}
                  </h1>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-3 rounded-full border border-[#d8e2ef] bg-white px-3 py-2 shadow-sm">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#6b7f99]">
                  {tx('Periode', 'Period')}
                </span>
                <select
                  value={timePeriod}
                  onChange={(event) => setTimePeriod(event.target.value)}
                  className="bg-transparent text-sm font-medium text-[#173151] focus:outline-none"
                >
                  <option value="7d">{tx('7 dager', '7 days')}</option>
                  <option value="30d">{tx('30 dager', '30 days')}</option>
                  <option value="90d">{tx('90 dager', '90 days')}</option>
                </select>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 md:px-8 md:py-8">
            <Outlet context={{ timePeriod, setTimePeriod }} />
          </main>
        </div>
      </div>
    </div>
  );
}
