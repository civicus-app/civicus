import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Filter } from 'lucide-react';
import { useAdminPolicyWorkspace } from '../../hooks/useAdmin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/badge';
import { useLanguageStore } from '../../store/languageStore';
import PolicyCard from '../../components/citizen/PolicyCard';
import PolicyTopicsOverlay from '../../components/citizen/PolicyTopicsOverlay';
import type { Policy } from '../../types/policy.types';

export default function AdminPolicyPreview() {
  const { id } = useParams<{ id: string }>();
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);

  const { workspace, loading } = useAdminPolicyWorkspace(id);
  const policy = workspace?.policy;

  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6fb]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6fb]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#173151]">{tx('Sak ikke funnet', 'Policy not found')}</h2>
          <p className="mt-2 text-[#6b7f99]">{tx('Saken finnes ikke eller du har ikke tilgang.', 'The policy does not exist or you do not have access.')}</p>
          <Link
            to="/admin/policies"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#d7dfeb] bg-white px-4 py-2 text-sm font-medium text-[#365476] shadow-sm transition hover:bg-[#eef3f8]"
          >
            <ArrowLeft className="h-4 w-4" />
            {tx('Tilbake til saksadministrasjon', 'Back to policy management')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6fb]">
      {/* Admin top bar */}
      <div className="sticky top-0 z-40 border-b border-amber-200 bg-amber-50 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link
            to={`/admin/policies/${id}/edit`}
            className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-1.5 text-sm font-medium text-amber-800 shadow-sm transition hover:bg-amber-100"
          >
            <ArrowLeft className="h-4 w-4" />
            {tx('Tilbake til redigering', 'Back to editor')}
          </Link>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              {tx('Forhåndsvisning – borgerperspektiv', 'Preview – citizen view')}
            </span>
            <Badge variant={policy.status as 'active' | 'under_review' | 'closed' | 'draft'} className="text-xs">
              {policy.status === 'active'
                ? tx('Aktiv', 'Active')
                : policy.status === 'under_review'
                ? tx('Under vurdering', 'Under review')
                : policy.status === 'closed'
                ? tx('Lukket', 'Closed')
                : tx('Utkast', 'Draft')}
            </Badge>
            <div className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium border border-amber-200">
              {policy.is_published ? (
                <>
                  <Eye className="h-3 w-3 text-green-600" />
                  <span className="text-green-700">{tx('Publisert', 'Published')}</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3 text-slate-500" />
                  <span className="text-slate-600">{tx('Skjult', 'Hidden')}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Citizen-style home layout */}
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-8">
        <section>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7190ad]">
              {tx('Oversikt', 'Overview')}
            </p>
            <h1 className="text-[2rem] font-bold tracking-tight text-[#19314f]">
              {tx('Aktive saker', 'Active policies')}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[#617792] sm:text-base">
              {tx(
                'Her finner du sakene som akkurat nå er åpne for innspill.',
                'Here are the policies that are currently open for input.'
              )}
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#d7dfeb] bg-white px-5 py-5 shadow-sm sm:px-6">
          {/* Single card rendered just like citizen home grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            <PolicyCard
              policy={policy as Policy}
              onSelect={setSelectedPolicy}
              showVoteStatus={false}
            />
            {/* Ghost cards to show grid context */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="min-h-[260px] rounded-[20px] bg-[#e8eef5]/60 animate-pulse"
              />
            ))}
          </div>
        </section>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Filter className="mb-1 inline h-4 w-4" />
          {' '}
          {tx(
            'Klikk på sakskortet for å se borgernes interaksjonsflyt. Stemmeknappen er deaktivert i forhåndsvisning.',
            'Click the policy card to preview the citizen interaction flow. The vote button is disabled in preview mode.'
          )}
        </div>
      </div>

      {selectedPolicy ? (
        <PolicyTopicsOverlay
          policy={selectedPolicy}
          open={true}
          onClose={() => setSelectedPolicy(null)}
          previewMode
        />
      ) : null}
    </div>
  );
}
