import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../common/NotificationBell';
import LanguageToggle from '../common/LanguageToggle';
import BrandMark from '../common/BrandMark';
import CitizenBottomNav from '../citizen/CitizenBottomNav';
import { APP_NAME } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { useLanguageStore } from '../../store/languageStore';
import homeIcon from '../../assets/nav-icons/home.png';
import policiesIcon from '../../assets/nav-icons/policies.png';
import alertsIcon from '../../assets/nav-icons/alerts.png';
import profileIcon from '../../assets/nav-icons/profile.png';

const navLinks = [
  { to: '/home', labelNo: 'Hjem', labelEn: 'Home', icon: homeIcon },
  { to: '/policies', labelNo: 'Politikk', labelEn: 'Policies', icon: policiesIcon },
  { to: '/profile', labelNo: 'Profil', labelEn: 'Profile', icon: profileIcon },
];

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

                <Link
                  to="/home"
                  className="flex min-w-0 items-center gap-3 rounded-full pr-2 transition-opacity hover:opacity-90"
                  aria-label={tx('Ga til hjem', 'Go to home')}
                >
                  <BrandMark
                    className="h-12 w-12 rounded-full border-white/45 bg-white/20 p-[4%] sm:h-[3.15rem] sm:w-[3.15rem]"
                    imageClassName="scale-[1.08]"
                  />
                  <div className="min-w-0">
                    <h1 className="text-white font-semibold text-[1.1rem] sm:text-[1.35rem] leading-tight truncate font-display">
                      {APP_NAME}
                    </h1>
                  </div>
                </Link>
              </div>

              <nav className="hidden md:flex items-center gap-2 rounded-[22px] border border-white/18 bg-white/10 p-1.5 backdrop-blur">
                {navLinks.map(({ to, labelNo, labelEn, icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors',
                      location.pathname === to
                        ? 'bg-white text-[#265699] shadow-[0_10px_25px_rgba(17,44,85,0.18)]'
                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <img src={icon} alt="" className="h-5 w-5 object-contain" />
                    <span>{language === 'en' ? labelEn : labelNo}</span>
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-2 sm:gap-3">
                <LanguageToggle className="hidden sm:block border-white/20 bg-white/10 shadow-none" />

                <NotificationBell
                  theme="dark"
                  triggerClassName="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10"
                  badgeClassName="right-0 top-0 min-w-[1rem] px-1.5 py-0.5 text-[10px]"
                >
                  <img src={alertsIcon} alt="" className="h-5 w-5 object-contain" />
                </NotificationBell>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="hidden sm:inline-flex h-9 px-3 rounded-md bg-white/15 text-white text-sm items-center hover:bg-white/25 transition-colors"
                  >
                    {tx('Admin', 'Admin')}
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
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                  title={tx('Logg ut', 'Sign out')}
                >
                  <LogOut className="h-5 w-5" />
                  <span>{tx('Logg ut', 'Sign out')}</span>
                </button>
              </div>
            </div>
          </div>

          {mobileOpen && (
            <div className="md:hidden border-t border-white/20 bg-[#275da5]">
              <div className="px-4 pt-4">
                <LanguageToggle className="inline-flex border-white/20 bg-white/10 shadow-none" />
              </div>
              {navLinks.map(({ to, labelNo, labelEn, icon }) => (
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
                  <img src={icon} alt="" className="h-4 w-4 object-contain" />
                  <span>{language === 'en' ? labelEn : labelNo}</span>
                </Link>
              ))}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  void handleSignOut();
                }}
                className="flex w-full items-center space-x-3 px-4 py-3 text-left text-sm font-medium text-white/90 hover:bg-white/10"
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
