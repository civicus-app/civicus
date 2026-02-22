import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Search, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../common/NotificationBell';
import { MUNICIPALITY_NAME, TIME_PERIODS } from '../../lib/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export interface AdminOutletContext {
  timePeriod: string;
  setTimePeriod: (value: string) => void;
}

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [timePeriod, setTimePeriod] = useState('30d');

  const isDashboard = location.pathname === '/admin';

  const initials = useMemo(() => {
    const name = profile?.full_name || 'Admin User';
    const parts = name.split(' ').filter(Boolean);
    return (parts[0]?.[0] || 'A') + (parts[1]?.[0] || '');
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
              <div className="h-11 w-11 rounded-full border border-white/50 bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-sm">
                TK
              </div>
              <div className="min-w-0">
                <h1 className="text-white font-semibold text-[1.1rem] sm:text-[1.45rem] leading-tight truncate">
                  {MUNICIPALITY_NAME}{' '}
                  <span className="font-normal text-white/80">Policy Dashboard</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {isDashboard && (
                <Select value={timePeriod} onValueChange={setTimePeriod}>
                  <SelectTrigger className="w-[180px] bg-white/95 border-white/20 shadow-sm text-slate-700 hidden sm:flex">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_PERIODS.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <button
                className="h-10 w-10 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              <NotificationBell theme="dark" />

              <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded-full bg-white/10 border border-white/20">
                <div className="h-8 w-8 rounded-full bg-white text-[#275ca4] flex items-center justify-center text-xs font-semibold">
                  {initials}
                </div>
                <span className="text-white text-sm font-medium max-w-[160px] truncate">
                  {profile?.full_name || 'Administrator'}
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
      </header>

      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <Outlet context={{ timePeriod, setTimePeriod }} />
      </main>
    </div>
  );
}
