import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, House, LogOut, Menu, ScrollText, UserRound, X, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../common/NotificationBell';
import LanguageToggle from '../common/LanguageToggle';
import BrandMark from '../common/BrandMark';
import CitizenBottomNav from '../citizen/CitizenBottomNav';
import { APP_NAME } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { useLanguageStore } from '../../store/languageStore';

const navLinks = [
  { to: '/home', labelNo: 'Hjem', labelEn: 'Home', icon: House },
  { to: '/policies', labelNo: 'Politikk', labelEn: 'Policies', icon: ScrollText },
  { to: '/profile', labelNo: 'Profil', labelEn: 'Profile', icon: UserRound },
];

type NavLinkItem = {
  to: string;
  labelNo: string;
  labelEn: string;
  icon: LucideIcon;
};

const isCurrentRoute = (pathname: string, to: string) => {
  if (to === '/home') {
    return pathname === '/home';
  }

  return pathname === to || pathname.startsWith(`${to}/`);
};

function NavigationLink({ to, labelNo, labelEn, icon: Icon, active, language }: NavLinkItem & { active: boolean; language: 'no' | 'en' }) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-white text-[#214f8b] shadow-[0_10px_25px_rgba(17,44,85,0.18)]'
          : 'text-[#dceafd] hover:bg-white/12 hover:text-white'
      )}
    >
      <Icon className={cn('h-4.5 w-4.5', active ? 'text-[#214f8b]' : 'text-[#c7ddff]')} strokeWidth={2.1} />
      <span>{language === 'en' ? labelEn : labelNo}</span>
    </Link>
  );
}

function MobileNavigationLink({ to, labelNo, labelEn, icon: Icon, active, language, onSelect }: NavLinkItem & { active: boolean; language: 'no' | 'en'; onSelect: () => void }) {
  return (
    <Link
      to={to}
      onClick={onSelect}
      className={cn(
        'flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors',
        active ? 'bg-white/20 text-white' : 'text-[#dceafd] hover:bg-white/10 hover:text-white'
      )}
    >
      <Icon className={cn('h-4.5 w-4.5', active ? 'text-white' : 'text-[#c7ddff]')} strokeWidth={2.1} />
      <span>{language === 'en' ? labelEn : labelNo}</span>
    </Link>
  );
}

export default function CitizenLayout() {
  const { profile, signOut, isAdmin } = useAuth();
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isFlowPolicyRoute = /^\/policies\/[^/]+/.test(location.pathname);
  const isSnapshotRoute = location.pathname.startsWith('/innsikt/');
  const hideTopNavigation = isFlowPolicyRoute || isSnapshotRoute || location.pathname.startsWith('/verifisering/');

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
      {!hideTopNavigation ? (
        <header className="sticky top-0 z-40 border-b border-white/20 bg-gradient-to-r from-[#1f4f92] via-[#2d66b4] to-[#3b79c9] shadow-lg backdrop-blur">
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
            <div className="flex min-h-[72px] items-center justify-between gap-3 py-3 md:gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-6 lg:py-0">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  className="rounded-full border border-white/20 bg-white/12 p-2 text-white shadow-sm transition-colors hover:bg-white/18 md:hidden"
                  onClick={() => setMobileOpen(!mobileOpen)}
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>

                <Link
                  to="/home"
                  className="flex min-w-0 items-center gap-3 rounded-full pr-2 transition-opacity hover:opacity-90"
                  aria-label={tx('Ga til hjem', 'Go to home')}
                >
                  <BrandMark
                    className="h-11 w-11 rounded-full border-white/45 bg-white/20 p-[4%] sm:h-[3.2rem] sm:w-[3.2rem]"
                    imageClassName="scale-[1.08]"
                  />
                  <div className="min-w-0">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.26em] text-white/70 sm:text-[0.68rem]">
                      {tx('Innbygger', 'Citizen')}
                    </p>
                    <h1 className="truncate font-display text-[1.1rem] font-semibold leading-tight text-white sm:text-[1.35rem]">
                      {APP_NAME}
                    </h1>
                  </div>
                </Link>
              </div>

              <nav className="hidden items-center gap-2 justify-self-center rounded-full border border-white/18 bg-white/12 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:flex">
                {navLinks.map((link) => (
                  <NavigationLink
                    key={link.to}
                    {...link}
                    active={isCurrentRoute(location.pathname, link.to)}
                    language={language}
                  />
                ))}
              </nav>

              <div className="flex items-center gap-2 justify-self-end sm:gap-3">
                <LanguageToggle tone="dark" className="hidden sm:block" />

                <NotificationBell
                  theme="dark"
                  triggerClassName="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white shadow-sm transition-colors hover:bg-white/18"
                  badgeClassName="right-0 top-0 min-w-[1rem] px-1.5 py-0.5 text-[10px]"
                >
                  <Bell className="h-5 w-5 text-white" strokeWidth={2.1} />
                </NotificationBell>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="hidden h-9 items-center rounded-full border border-white/24 bg-white/14 px-3 text-sm text-white transition-colors hover:bg-white/22 sm:inline-flex"
                  >
                    {tx('Admin', 'Admin')}
                  </Link>
                )}

                <div className="hidden items-center gap-2 rounded-full border border-white/18 bg-white/12 px-2 py-1 shadow-sm sm:flex">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#275ca4]">
                    {initials}
                  </div>
                  <span className="max-w-[140px] truncate text-sm font-medium text-white">
                    {profile?.full_name}
                  </span>
                </div>

                <button
                  onClick={handleSignOut}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-white/24 bg-white px-2.5 text-sm font-medium text-[#1f4f92] shadow-sm transition-colors hover:bg-[#eef4ff] sm:px-3"
                  title={tx('Logg ut', 'Sign out')}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden sm:inline">{tx('Logg ut', 'Sign out')}</span>
                </button>
              </div>
            </div>
          </div>

          {mobileOpen && (
            <div className="border-t border-white/20 bg-[#275da5] md:hidden">
              <div className="px-4 pt-4">
                <LanguageToggle tone="dark" className="inline-flex" />
              </div>
              {navLinks.map((link) => (
                <MobileNavigationLink
                  key={link.to}
                  {...link}
                  active={isCurrentRoute(location.pathname, link.to)}
                  language={language}
                  onSelect={() => setMobileOpen(false)}
                />
              ))}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  void handleSignOut();
                }}
                className="flex w-full items-center space-x-3 px-4 py-3 text-left text-sm font-medium text-white/92 hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                <span>{tx('Logg ut', 'Sign out')}</span>
              </button>
            </div>
          )}
        </header>
      ) : null}

      <main className={cn(
        'mx-auto px-4 py-5 sm:py-6',
        hideTopNavigation ? 'max-w-[1400px] pb-10 sm:px-6 lg:px-10' : 'max-w-[1500px] pb-28 sm:px-6 md:pb-6 lg:px-8'
      )}>
        <Outlet />
      </main>

      {!hideTopNavigation ? <CitizenBottomNav /> : null}
    </div>
  );
}
