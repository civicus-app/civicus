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
    <nav className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1rem)] max-w-[430px] -translate-x-1/2 rounded-[22px] border border-[#d4d9e5] bg-[#eceae6]/96 px-4 py-3 shadow-[0_18px_45px_rgba(24,43,74,0.18)] backdrop-blur lg:bottom-5 lg:max-w-[700px]">
      <ul className="grid grid-cols-4 gap-2">
        {items.map(({ to, icon, labelNo, labelEn }) => {
          const active = pathname === to;
          return (
            <li key={to} className="text-center">
              <Link
                to={to}
                className="mx-auto flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-[#4768b1]"
              >
                <span
                  className={cn(
                    'h-[2px] w-12 rounded-full transition-colors',
                    active ? 'bg-[#5b78bc]' : 'bg-transparent'
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
