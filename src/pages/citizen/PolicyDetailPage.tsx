import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Calendar,
  MapPin,
  Paperclip,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Send,
  User,
  Layers,
} from 'lucide-react';
import { usePolicy } from '../../hooks/usePolicies';
import { usePolicyFollow } from '../../hooks/usePolicyFollows';
import { useFeedback, useSentimentVote } from '../../hooks/useFeedback';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { formatDate, formatRelativeTime, getSentimentBgColor } from '../../lib/utils';
import type { SentimentType } from '../../types/policy.types';
import { useLanguageStore } from '../../store/languageStore';
import { getCategoryLabel, getPolicyDescription, getPolicyTitle } from '../../lib/policyContent';
import { resolveAttachmentUrl } from '../../lib/policyAttachments';

export default function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { policy, loading } = usePolicy(id!);
  const { feedback, submitFeedback } = useFeedback(id!);
  const { userVote, sentimentCounts, castVote } = useSentimentVote(id!);
  const { user } = useAuth();
  const { following, toggleFollow, loading: followLoading } = usePolicyFollow(id!, user?.id);
  const [feedbackText, setFeedbackText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);

  useEffect(() => {
    if (id) {
      supabase.rpc('track_policy_view', { policy_uuid: id }).then(() => {});
    }
  }, [id]);

  const handleVote = async (sentiment: SentimentType) => {
    if (!user) return;
    try { await castVote(sentiment); } catch (e) { console.error(e); }
  };

  const handleFeedbackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (feedbackText.length < 10) {
      setFeedbackError(
        tx(
          'Tilbakemeldingen ma inneholde minst 10 tegn',
          'Feedback must be at least 10 characters'
        )
      );
      return;
    }
    setSubmitting(true);
    setFeedbackError('');
    try {
      await submitFeedback(feedbackText, isAnonymous);
      setFeedbackText('');
      setFeedbackSuccess(true);
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (err) {
      setFeedbackError(
        err instanceof Error ? err.message : tx('Kunne ikke sende tilbakemelding', 'Failed to submit feedback')
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!policy) return (
    <div className="text-center py-16">
      <p className="text-gray-500">{tx('Saken ble ikke funnet', 'Policy not found')}</p>
      <Link to="/policies" className="text-primary-600 hover:underline mt-2 inline-block">
        {tx('Tilbake til saker', 'Back to policies')}
      </Link>
    </div>
  );

  const totalVotes = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
  const localizedStatus =
    policy.status === 'active'
      ? tx('Aktiv', 'Active')
      : policy.status === 'under_review'
      ? tx('Under vurdering', 'Under review')
      : policy.status === 'closed'
      ? tx('Lukket', 'Closed')
      : tx('Utkast', 'Draft');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/policies" className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600">
        <ArrowLeft className="h-4 w-4 mr-1" /> {tx('Tilbake til saker', 'Back to policies')}
      </Link>

      {/* Policy Header */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <Badge variant={policy.status as 'active' | 'under_review' | 'closed' | 'draft'} className="text-sm px-3 py-1">
              {localizedStatus}
            </Badge>
            {policy.category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: policy.category.color || '#6B7280' }}>
                {getCategoryLabel(policy.category, language)}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{getPolicyTitle(policy, language)}</h1>
          <div className="mb-6 flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:flex-wrap sm:gap-4">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{tx('Startet', 'Started')}: {formatDate(policy.start_date)}</span>
            </div>
            {policy.end_date && (
              <div className="flex items-center space-x-1 text-orange-600">
                <Calendar className="h-4 w-4" />
                <span>{tx('Stenger', 'Closes')}: {formatDate(policy.end_date)}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span className="capitalize">{policy.scope}</span>
            </div>
          </div>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{getPolicyDescription(policy, language)}</p>
          </div>
          {user ? (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button variant="outline" onClick={toggleFollow} disabled={followLoading} className="w-full sm:w-auto">
                {following ? <BellOff className="h-4 w-4 mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
                {following ? tx('Folger oppdateringer', 'Following updates') : tx('Folg oppdateringer', 'Follow updates')}
              </Button>
              {policy.topics && policy.topics.length > 0 && (
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link to={`/policies/${policy.id}/utforsk`}>
                    <Layers className="h-4 w-4 mr-2" />
                    {tx('Utforsk temaer', 'Explore topics')}
                  </Link>
                </Button>
              )}
            </div>
          ) : null}
          {policy.tags && policy.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {policy.tags.map(tag => (
                <span key={tag.id} className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs">{tag.tag}</span>
              ))}
            </div>
          )}
          {policy.districts && policy.districts.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700">{tx('Berorte distrikter:', 'Target districts:')}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {policy.districts.map((district) => (
                  <span key={district.district_id} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {district.districts.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {policy.attachments && policy.attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">{tx('Vedlegg:', 'Attachments:')}</p>
              {policy.attachments.map(att => (
                <a key={att.id} href={resolveAttachmentUrl(att.file_path)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-primary-600 hover:underline">
                  <Paperclip className="h-4 w-4" />
                  <span>{att.file_name}</span>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {policy.events && policy.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{tx('Kommende arrangementer', 'Upcoming events')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {policy.events.map((event) => (
              <div key={event.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{event.title}</p>
                    {event.description ? (
                      <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                    ) : null}
                  </div>
                  <Badge variant="secondary">{event.mode.replace('_', ' ')}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(event.event_date)}
                  </span>
                  {event.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </span>
                  ) : null}
                </div>
                {event.registration_url ? (
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex text-sm font-medium text-primary-600 hover:underline"
                  >
                    {tx('Registrer deg for arrangementet', 'Register for event')}
                  </a>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {policy.updates && policy.updates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{tx('Offisielle oppdateringer', 'Official updates')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {policy.updates.map((update) => (
              <div key={update.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{update.title}</p>
                    {update.update_type ? (
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        {update.update_type.replace('_', ' ')}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(update.created_at)}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-700 whitespace-pre-wrap">
                  {update.content}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sentiment Voting */}
      {policy.status === 'active' && user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{tx('Hva synes du om denne saken?', 'How do you feel about this policy?')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {([
                { sentiment: 'positive' as SentimentType, label: tx('Stott', 'Support'), icon: ThumbsUp, color: 'text-green-600 border-green-300 bg-green-50 hover:bg-green-100' },
                { sentiment: 'neutral' as SentimentType, label: tx('Noytral', 'Neutral'), icon: Minus, color: 'text-yellow-600 border-yellow-300 bg-yellow-50 hover:bg-yellow-100' },
                { sentiment: 'negative' as SentimentType, label: tx('Imot', 'Oppose'), icon: ThumbsDown, color: 'text-red-600 border-red-300 bg-red-50 hover:bg-red-100' },
              ]).map(({ sentiment, label, icon: Icon, color }) => (
                <button
                  key={sentiment}
                  onClick={() => handleVote(sentiment)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 border-2 rounded-lg font-medium transition-all ${color} ${userVote?.sentiment === sentiment ? 'ring-2 ring-offset-1' : ''}`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                  <span className="ml-1 text-sm opacity-75">({sentimentCounts[sentiment]})</span>
                </button>
              ))}
            </div>
            {totalVotes > 0 && (
              <div className="flex rounded-full overflow-hidden h-2">
                <div className="bg-green-500 transition-all" style={{ width: `${(sentimentCounts.positive/totalVotes)*100}%` }} />
                <div className="bg-yellow-400 transition-all" style={{ width: `${(sentimentCounts.neutral/totalVotes)*100}%` }} />
                <div className="bg-red-500 transition-all" style={{ width: `${(sentimentCounts.negative/totalVotes)*100}%` }} />
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2 text-center">
              {tx(`${totalVotes} stemmer totalt`, `${totalVotes} total votes`)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Feedback Form */}
      {policy.status === 'active' && user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{tx('Del tilbakemeldingen din', 'Share your feedback')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              {feedbackError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">{feedbackError}</div>}
              {feedbackSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded text-sm">
                  {tx('Tilbakemeldingen ble sendt', 'Feedback submitted successfully!')}
                </div>
              )}
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={tx(
                  'Del tankene dine om denne saken... (10-2000 tegn)',
                  'Share your thoughts on this policy... (10-2000 characters)'
                )}
                className="min-h-[120px]"
                maxLength={2000}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="anonymous" className="text-sm text-gray-600">
                    {tx('Send anonymt', 'Submit anonymously')}
                  </label>
                </div>
                <div className="flex items-center justify-between sm:justify-end sm:space-x-3">
                  <span className="text-xs text-gray-400">{feedbackText.length}/2000</span>
                  <Button type="submit" size="sm" disabled={submitting || feedbackText.length < 10} className="sm:w-auto">
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? tx('Sender...', 'Submitting...') : tx('Send tilbakemelding', 'Submit feedback')}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {tx(`Dine tilbakemeldinger (${feedback.length})`, `Your feedback (${feedback.length})`)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              {tx('Du har ikke sendt tilbakemelding enna.', 'You have not submitted feedback yet.')}
            </p>
          ) : (
            <div className="space-y-4">
              {feedback.map(item => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="bg-gray-100 rounded-full p-1.5">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {item.is_anonymous ? tx('Anonym', 'Anonymous') : (item.profiles?.full_name || tx('Innbygger', 'Citizen'))}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.sentiment && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getSentimentBgColor(item.sentiment)}`}>
                          {item.sentiment}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{formatRelativeTime(item.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{item.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
