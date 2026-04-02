import { Navigate } from 'react-router-dom';
import CivicusMobileShell from '../../components/citizen/CivicusMobileShell';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { usePolicies } from '../../hooks/usePolicies';
import { useLanguageStore } from '../../store/languageStore';

export default function CitizenHome() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const { policies, loading } = usePolicies({
    status: 'active',
    limit: 1,
    page: 1,
  });

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const firstPolicy = policies[0];
  if (firstPolicy) {
    return <Navigate to={`/policies/${firstPolicy.id}`} replace />;
  }

  return (
    <CivicusMobileShell compact>
      <div className="space-y-4 text-center">
        <h1 className="text-[2.2rem] font-extrabold text-[#1088c3]">
          {tx('Ingen aktive saker', 'No active policies')}
        </h1>
        <p className="text-[#4b6f88]">
          {tx('Det finnes ingen aktive saker akkurat na.', 'There are no active policies right now.')}
        </p>
      </div>
    </CivicusMobileShell>
  );
}
