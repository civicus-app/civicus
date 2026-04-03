import { Link, useLocation } from 'react-router-dom';
import NotificationBell from '../common/NotificationBell';
import { useLanguageStore } from '../../store/languageStore';
import homeIcon from '../../assets/nav-icons/home.png';
import policiesIcon from '../../assets/nav-icons/policies.png';
import alertsIcon from '../../assets/nav-icons/alerts.png';
import profileIcon from '../../assets/nav-icons/profile.png';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/home', icon: homeIcon, labelNo: 'Hjem', labelEn: 'Home' },
  { to: '/policies', icon: policiesIcon, labelNo: 'Politikk', labelEn: 'Policies' },
  { to: '/profile', icon: profileIcon, labelNo: 'Profil', labelEn: 'Profile' },
];

function NavLinkItem({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link to={to} className="mx-auto flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[#4768b1]">
      <span className={cn('h-[2px] w-12 rounded-full transition-colors', active ? 'bg-[#5b78bc]' : 'bg-transparent')} />
      <img src={icon} alt="" className="h-6 w-6 object-contain" />
      <span className="text-[10px] font-semibold tracking-[0.02em]">{label}</span>
    </Link>
  );
}

export default function CitizenBottomNav({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const language = useLanguageStore((state) => state.language);

  return (
    <nav
      className={cn(
        'fixed bottom-3 left-1/2 z-40 w-[calc(100%-1rem)] max-w-[430px] -translate-x-1/2 rounded-[22px] border border-[#d4d9e5] bg-[#eceae6]/96 px-4 py-3 shadow-[0_18px_45px_rgba(24,43,74,0.18)] backdrop-blur md:hidden',
        className
      )}
    >
      <ul className="grid grid-cols-4 gap-1">
        <li className="text-center">
          <NavLinkItem
            to="/home"
            icon={homeIcon}
            label={language === 'en' ? 'Home' : 'Hjem'}
            active={pathname === '/home'}
          />
        </li>
        <li className="text-center">
          <NavLinkItem
            to="/policies"
            icon={policiesIcon}
            label={language === 'en' ? 'Policies' : 'Politikk'}
            active={pathname === '/policies' || pathname.startsWith('/policies/')}
          />
        </li>
        <li className="text-center">
          <div className="mx-auto flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[#4768b1]">
            <span className="h-[2px] w-12 rounded-full bg-transparent" />
            <NotificationBell
              theme="light"
              ariaLabel={language === 'en' ? 'Notifications' : 'Varsler'}
              containerClassName="flex justify-center"
              triggerClassName="mx-auto flex flex-col items-center justify-center rounded-xl px-1 py-0 hover:bg-transparent"
              badgeClassName="right-0 top-1 min-w-[1rem] px-1.5 py-0.5 text-[10px]"
              panelClassName="bottom-full right-1/2 mb-3 mt-0 w-[min(22rem,calc(100vw-1.5rem))] translate-x-1/2"
            >
              <img src={alertsIcon} alt="" className="h-6 w-6 object-contain" />
            </NotificationBell>
            <span className="text-[10px] font-semibold tracking-[0.02em]">
              {language === 'en' ? 'Alerts' : 'Varsler'}
            </span>
          </div>
        </li>
        <li className="text-center">
          <NavLinkItem
            to="/profile"
            icon={profileIcon}
            label={language === 'en' ? 'Profile' : 'Profil'}
            active={pathname === '/profile'}
          />
        </li>
      </ul>
    </nav>
  );
}
