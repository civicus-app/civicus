import { cn } from '../../lib/utils';
import { useLanguageStore } from '../../store/languageStore';

interface LanguageToggleProps {
  className?: string;
}

export default function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguageStore();

  return (
    <div
      className={cn(
        'rounded-full border border-[#a9b8c6] bg-white/95 p-1 shadow-md backdrop-blur',
        className
      )}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={() => setLanguage('no')}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            language === 'no' ? 'bg-[#178ec8] text-white' : 'text-[#48698a] hover:bg-[#eef4f8]'
          }`}
          aria-label="Bytt til norsk"
        >
          NO
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            language === 'en' ? 'bg-[#178ec8] text-white' : 'text-[#48698a] hover:bg-[#eef4f8]'
          }`}
          aria-label="Switch to English"
        >
          EN
        </button>
      </div>
    </div>
  );
}
