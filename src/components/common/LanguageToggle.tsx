import { cn } from '../../lib/utils';
import { useLanguageStore } from '../../store/languageStore';

interface LanguageToggleProps {
  className?: string;
  tone?: 'light' | 'dark';
}

export default function LanguageToggle({ className, tone = 'light' }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguageStore();
  const containerClasses =
    tone === 'dark'
      ? 'rounded-full border border-white/24 bg-white/12 p-1 shadow-none backdrop-blur'
      : 'rounded-full border border-[#a9b8c6] bg-white/95 p-1 shadow-md backdrop-blur';
  const activeButtonClasses =
    tone === 'dark' ? 'bg-white text-[#1f4f92] shadow-sm' : 'bg-[#178ec8] text-white';
  const inactiveButtonClasses =
    tone === 'dark'
      ? 'text-[#dceafd] hover:bg-white/10 hover:text-white'
      : 'text-[#48698a] hover:bg-[#eef4f8]';

  return (
    <div className={cn(containerClasses, className)}>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setLanguage('no')}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            language === 'no' ? activeButtonClasses : inactiveButtonClasses
          }`}
          aria-label="Bytt til norsk"
        >
          NO
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            language === 'en' ? activeButtonClasses : inactiveButtonClasses
          }`}
          aria-label="Switch to English"
        >
          EN
        </button>
      </div>
    </div>
  );
}
