import { Link } from 'react-router-dom';
import { useLanguageStore } from '../store/languageStore';

export default function NotFound() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-sm font-medium text-primary-600">404</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">{tx('Siden ble ikke funnet', 'Page not found')}</h1>
        <p className="mt-2 text-gray-600">{tx('Siden du ba om finnes ikke.', 'The page you requested does not exist.')}</p>
        <Link
          to="/home"
          className="inline-flex mt-6 px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700"
        >
          {tx('Ga til hjem', 'Go home')}
        </Link>
      </div>
    </div>
  );
}
