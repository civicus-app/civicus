import { Link, useLocation } from 'react-router-dom';
import { useLanguageStore } from '../../store/languageStore';
import homeIcon from '../../assets/nav-icons/home.png';
import policiesIcon from '../../assets/nav-icons/policies.png';
import alertsIcon from '../../assets/nav-icons/alerts.png';
import profileIcon from '../../assets/nav-icons/profile.png';
import { cn } from '../../lib/utils';

const items = [
  { to: '/home', icon: homeIcon, labelNo: 'Hjem', labelEn: 'Home' },
  { to: '/innsikt/stemmer', icon: policiesIcon, labelNo: 'Stemmer', labelEn: 'Votes' },
  { to: '/innsikt/puls', icon: alertsIcon, labelNo: 'Puls', labelEn: 'Pulse' },
  { to: '/innsikt/profil', icon: profileIcon, labelNo: 'Profil', labelEn: 'Profile' },
];

export default function SnapshotBottomNav() {
  const { pathname } = useLocation();
  const language = useLanguageStore((state) => state.language);

  return (
    <nav className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1rem)] max-w-[430px] -translate-x-1/2 rounded-[22px] border border-[#cbd8e6] bg-[rgba(246,249,253,0.98)] px-4 py-3 shadow-[0_18px_45px_rgba(24,43,74,0.18)] backdrop-blur lg:bottom-5 lg:max-w-[700px]">
      <ul className="grid grid-cols-4 gap-2">
        {items.map(({ to, icon, labelNo, labelEn }) => {
          const active = pathname === to;
          return (
            <li key={to} className="text-center">
              <Link
                to={to}
                className={cn(
                  'mx-auto flex flex-col items-center gap-1 rounded-2xl px-2.5 py-2 transition-colors',
                  active
                    ? 'bg-white text-[#173151] shadow-[0_10px_25px_rgba(24,43,74,0.12)]'
                    : 'text-[#35506f] hover:bg-white/70 hover:text-[#173151]'
                )}
              >
                <span
                  className={cn(
                    'h-[2px] w-12 rounded-full transition-colors',
                    active ? 'bg-[#2f70ba]' : 'bg-transparent'
                  )}
                />
                <img src={icon} alt="" className="h-6 w-6 object-contain" />
                <span className="text-[10px] font-semibold">{language === 'en' ? labelEn : labelNo}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
