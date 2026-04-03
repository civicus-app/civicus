import { ArrowRight, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import PolicyCard from '../../components/citizen/PolicyCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Button } from '../../components/ui/button';
import { usePolicies } from '../../hooks/usePolicies';
import { useLanguageStore } from '../../store/languageStore';

export default function CitizenHome() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const { policies, loading } = usePolicies({
    status: 'active',
    limit: 6,
    page: 1,
  });

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#d7dfeb] bg-white px-6 py-6 shadow-sm sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7190ad]">
              {tx('Oversikt', 'Overview')}
            </p>
            <h1 className="text-[2rem] font-bold tracking-tight text-[#19314f]">
              {tx('Aktive saker', 'Active policies')}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[#617792] sm:text-base">
              {tx(
                'Her finner du sakene som akkurat na er apne for innspill. Start med det som er viktigst for deg.',
                'Here are the policies that are currently open for input. Start with the one that matters most to you.'
              )}
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full border-[#c7d3e4] px-5 text-[#244d7f] hover:bg-[#f4f7fb]"
          >
            <Link to="/policies">
              {tx('Se alle saker', 'View all policies')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#d7dfeb] bg-white px-5 py-5 shadow-sm sm:px-6">
        {policies.length === 0 ? (
          <div className="py-16 text-center text-[#627893]">
            <Filter className="mx-auto mb-4 h-10 w-10 opacity-40" />
            <p className="text-lg font-semibold text-[#274565]">
              {tx('Ingen aktive saker', 'No active policies')}
            </p>
            <p className="mt-2 text-sm">
              {tx(
                'Det finnes ingen aktive saker akkurat na.',
                'There are no active policies right now.'
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {policies.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
