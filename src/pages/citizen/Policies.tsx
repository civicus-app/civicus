import { useState, useCallback, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';
import { usePolicies } from '../../hooks/usePolicies';
import { useUserVotesMap } from '../../hooks/useFeedback';
import PolicyCard from '../../components/citizen/PolicyCard';
import PolicyTopicsOverlay from '../../components/citizen/PolicyTopicsOverlay';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { POLICY_STATUSES } from '../../lib/constants';
import { debounce } from '../../lib/utils';
import { useLanguageStore } from '../../store/languageStore';
import { supabase } from '../../lib/supabase';
import type { Category } from '../../types';
import type { Policy } from '../../types/policy.types';
import { getCategoryLabel } from '../../lib/policyContent';

export default function Policies() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [voteRefreshKey, setVoteRefreshKey] = useState(0);

  const debouncedSetSearch = useCallback(
    debounce((val: unknown) => setDebouncedSearch(val as string), 400),
    []
  );

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedSetSearch(e.target.value);
    setPage(1);
  };

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setCategories((data || []) as Category[]);
      });
  }, []);

  const { policies, loading, total } = usePolicies({
    status: status === 'all' ? undefined : (status as 'active' | 'under_review' | 'closed'),
    category: category === 'all' ? undefined : category,
    search: debouncedSearch || undefined,
    page,
    limit: 12,
  });

  const totalPages = Math.ceil(total / 12);
  const policyIds = policies.map((p) => p.id);
  const votesMap = useUserVotesMap(policyIds, voteRefreshKey);

  return (
    <div className="space-y-4">
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#2a4a70] sm:text-3xl">
              {tx('Kommunale saker', 'Municipal policies')}
            </h1>
            <p className="mt-1 text-sm text-[#5b7391]">
              {tx(`${total} saker funnet`, `${total} policies found`)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-md border transition-colors ${
                view === 'grid'
                  ? 'bg-[#e9f1fb] text-[#2f70ba] border-[#b9cee8]'
                  : 'bg-white text-[#7b90ab] border-[#d4dde9] hover:text-[#4f6c90]'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-md border transition-colors ${
                view === 'list'
                  ? 'bg-[#e9f1fb] text-[#2f70ba] border-[#b9cee8]'
                  : 'bg-white text-[#7b90ab] border-[#d4dde9] hover:text-[#4f6c90]'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white border border-[#d4dde9] rounded-xl shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={tx('Sok i saker...', 'Search policies...')}
              value={search}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>
          <Select
            value={status}
            onValueChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full lg:w-[170px]">
              <SelectValue placeholder={tx('Status', 'Status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tx('Alle statuser', 'All statuses')}</SelectItem>
              {POLICY_STATUSES.filter((statusOption) => statusOption.value !== 'draft').map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.value === 'active'
                    ? tx('Aktiv', 'Active')
                    : s.value === 'under_review'
                    ? tx('Under vurdering', 'Under review')
                    : tx('Lukket', 'Closed')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={category}
            onValueChange={(val) => {
              setCategory(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full lg:w-[170px]">
              <SelectValue placeholder={tx('Kategori', 'Category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tx('Alle kategorier', 'All categories')}</SelectItem>
              {categories.map((categoryOption) => (
                <SelectItem key={categoryOption.id} value={categoryOption.name}>
                  {getCategoryLabel(categoryOption, language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="bg-white border border-[#d4dde9] rounded-xl shadow-sm p-3 sm:p-4 lg:p-5">
        {loading ? (
          <LoadingSpinner />
        ) : policies.length === 0 ? (
          <div className="text-center py-16 text-[#5b7391]">
            <Filter className="h-12 w-12 mx-auto mb-3 opacity-35" />
            <p className="text-lg font-medium">{tx('Ingen saker funnet', 'No policies found')}</p>
            <p className="mt-1 text-sm">{tx('Juster filtrene dine', 'Adjust your filters')}</p>
          </div>
        ) : (
          <>
            <div
              className={
                view === 'grid'
                  ? 'grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4'
                  : 'space-y-3'
              }
            >
              {policies.map((policy) => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  onSelect={setSelectedPolicy}
                  showVoteStatus
                  refreshKey={voteRefreshKey}
                  preloadedVote={votesMap[policy.id] ?? null}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:space-x-2 sm:gap-0">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-full rounded-md border border-[#ccd8e8] px-4 py-2 text-sm text-[#2f4f72] disabled:opacity-50 hover:bg-[#f3f7fc] sm:w-auto"
                >
                  {tx('Forrige', 'Previous')}
                </button>
                <span className="text-sm text-[#5b7391]">
                  {tx(`Side ${page} av ${totalPages}`, `Page ${page} of ${totalPages}`)}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-full rounded-md border border-[#ccd8e8] px-4 py-2 text-sm text-[#2f4f72] disabled:opacity-50 hover:bg-[#f3f7fc] sm:w-auto"
                >
                  {tx('Neste', 'Next')}
                </button>
              </div>
            )}
          </>
        )}
      </section>
      {selectedPolicy ? (
        <PolicyTopicsOverlay
          policy={selectedPolicy}
          open={Boolean(selectedPolicy)}
          onClose={() => setSelectedPolicy(null)}
          onVoteSubmitted={() => setVoteRefreshKey((prev) => prev + 1)}
        />
      ) : null}
    </div>
  );
}
