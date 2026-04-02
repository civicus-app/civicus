import { Bell, FileText, Home, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguageStore } from '../../store/languageStore';

const items = [
  { to: '/home', icon: Home, labelNo: 'Hjem', labelEn: 'Home' },
  { to: '/innsikt/stemmer', icon: FileText, labelNo: 'Stemmer', labelEn: 'Votes' },
  { to: '/innsikt/puls', icon: Bell, labelNo: 'Puls', labelEn: 'Pulse' },
  { to: '/innsikt/profil', icon: User, labelNo: 'Profil', labelEn: 'Profile' },
];

export default function SnapshotBottomNav() {
  const { pathname } = useLocation();
  const language = useLanguageStore((state) => state.language);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-[430px] rounded-t-[18px] border border-[#d9d9d9] bg-[#dfdfdf] px-5 py-3 lg:max-w-[700px] lg:rounded-[18px] lg:bottom-5 lg:shadow-lg">
      <ul className="grid grid-cols-4 gap-2">
        {items.map(({ to, icon: Icon, labelNo, labelEn }) => {
          const active = pathname === to;
          return (
            <li key={to} className="text-center">
              <Link
                to={to}
                className="mx-auto flex flex-col items-center gap-1 rounded-md px-2 py-1 text-[#4768b1]"
              >
                <span
                  className={active ? 'h-[2px] w-10 rounded-full bg-[#7d93c8]' : 'h-[2px] w-10 rounded-full bg-transparent'}
                />
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{language === 'en' ? labelEn : labelNo}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
