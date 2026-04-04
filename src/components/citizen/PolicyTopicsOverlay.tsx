import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Layers,
  MessageSquare,
  X,
  Sparkles,
  Bike,
  Coins,
  HardHat,
  Trees,
  Bus,
  Home,
  Wallet,
  MapPin,
  Clock,
  Shield,
  Leaf,
  Send,
  Check,
  Bot,
  Copy,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import type { Policy, PolicyTopic, SentimentType } from '../../types/policy.types';
import { useLanguageStore } from '../../store/languageStore';
import { getCategoryLabel, getPolicyTitle } from '../../lib/policyContent';
import { getFlowTopics } from '../../pages/citizen/flow/topics';
import { resolveAttachmentUrl } from '../../lib/policyAttachments';
import { useSentimentVote, useFeedback } from '../../hooks/useFeedback';
import { useAuth } from '../../hooks/useAuth';

interface PolicyTopicsOverlayProps {
  policy: Policy;
  open: boolean;
  onClose: () => void;
  onVoteSubmitted?: (policyId: string) => void;
  previewMode?: boolean;
}

const TOPIC_ICONS: Record<string, LucideIcon> = {
  // icon_key values from DB
  bus: Bus,
  wallet: Wallet,
  home: Home,
  'map-pin': MapPin,
  clock: Clock,
  shield: Shield,
  coins: Coins,
  leaf: Leaf,
  // legacy slug-based keys
  'bedre-sykkelveier': Bike,
  'flere-gronne-soner': Trees,
  'budsjett-kostnad': Coins,
  anleggsperioder: HardHat,
};

const getTopicBullets = (topic: PolicyTopic, language: 'no' | 'en') => {
  const description = language === 'en' ? topic.description_en : topic.description_no;
  const rawPoints = description ? description.split(/\.\s+/).filter(Boolean) : [];
  const points = rawPoints.slice(0, 3).map((point) => point.trim().replace(/\.$/, ''));

  if (points.length >= 3) {
    return points.map((point) => `${point}.`);
  }

  const label = language === 'en' ? topic.label_en : topic.label_no;
  return [
    description || (language === 'en' ? `What does ${label} mean for citizens and the municipality?` : `Hva betyr ${label} for innbyggere og kommunen?`),
    language === 'en' ? 'See the relevant excerpt in the policy PDF.' : 'Se den tilhorende delen i policy-PDF-en.',
    language === 'en' ? 'Ask the AI agent for a simple explanation and context.' : 'Spør AI-agenten om en enkel forklaring og kontekst.',
  ];
};

export default function PolicyTopicsOverlay({ policy, open, onClose, onVoteSubmitted, previewMode = false }: PolicyTopicsOverlayProps) {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const [selectedTopic, setSelectedTopic] = useState<PolicyTopic | null>(null);
  const [activeTopicView, setActiveTopicView] = useState<'details' | 'pdf' | 'ai'>('details');
  const [showVote, setShowVote] = useState(false);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<SentimentType | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const topics = useMemo(() => getFlowTopics(policy?.topics), [policy?.topics]);
  const topicBullets = selectedTopic ? getTopicBullets(selectedTopic, language) : [];
  const firstAttachment = policy.attachments?.[0];


  const { user } = useAuth();
  const { castVote } = useSentimentVote(policy?.id || '');
  const { feedback, submitFeedback, loading: feedbackLoading, error: feedbackError } = useFeedback(policy?.id || '');

  // Comment-only submit state/handler (must be top-level for React state)
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const handleCommentSubmit = async () => {
    if (!feedbackText.trim()) return;
    setCommentSubmitting(true);
    setCommentError(null);
    try {
      await submitFeedback(feedbackText.trim(), false);
      setCommentSuccess(true);
      setFeedbackText('');
      setTimeout(() => setCommentSuccess(false), 2000);
    } catch (err) {
      setCommentError(typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : 'Could not submit comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleAskAi = async () => {
    if (!selectedTopic || !aiQuestion.trim()) return;

    setIsAiTyping(true);
    setAiResponse(null);

    // Simulate AI thinking time
    setTimeout(() => {
      setAiResponse(
        language === 'en'
          ? `AI help for ${selectedTopic.label_en}: ${selectedTopic.description_en || 'This topic focuses on the key policy elements and where to look in the PDF.'}`
          : `AI-hjelp for ${selectedTopic.label_no}: ${selectedTopic.description_no || 'Dette temaet handler om nøkkelpunktene i policyen og hvor du kan finne det i PDF-en.'}`
      );
      setIsAiTyping(false);
    }, 1500);
  };

  // Handles submitting both vote and comment
  const handleVoteSubmit = async () => {
    if (!selectedSentiment) return;
    if (!user) {
      setVoteError(tx('Du må være innlogget for å stemme.', 'You must be logged in to vote.'));
      return;
    }
    if (!policy) return;

    setIsSubmitting(true);
    setVoteError(null);
    try {
      await castVote(selectedSentiment);

      // Submit comment (with sentiment) if present
      if (feedbackText.trim()) {
        try {
          await submitFeedback(feedbackText.trim(), false, selectedSentiment);
        } catch {
          // comment failed silently — vote was already saved
        }
      }

      setVoteSubmitted(true);
      onVoteSubmitted?.(policy.id);
      setTimeout(() => { onClose(); }, 2500);
      // Handles submitting only the comment (no vote)
      const [commentSubmitting, setCommentSubmitting] = useState(false);
      const [commentSuccess, setCommentSuccess] = useState(false);
      const [commentError, setCommentError] = useState<string | null>(null);
      const handleCommentSubmit = async () => {
        if (!feedbackText.trim()) return;
        setCommentSubmitting(true);
        setCommentError(null);
        try {
          await submitFeedback(feedbackText.trim(), false);
          setCommentSuccess(true);
          setFeedbackText('');
          setTimeout(() => setCommentSuccess(false), 2000);
        } catch (err) {
          setCommentError(typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : 'Could not submit comment');
        } finally {
          setCommentSubmitting(false);
        }
      };
    } catch (err) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : tx('Kunne ikke sende stemme. Prøv igjen.', 'Could not submit vote. Please try again.');
      setVoteError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setSelectedTopic(null);
      setActiveTopicView('details');
      setShowVote(false);
      setSelectedSentiment(null);
      setFeedbackText('');
      setVoteError(null);
      setAiQuestion('');
      setAiResponse(null);
      setIsAiTyping(false);
      setIsSubmitting(false);
      setVoteSubmitted(false);
    }
  }, [open]);

  useEffect(() => {
    if (selectedTopic) {
      setActiveTopicView('details');
      setAiQuestion('');
      setAiResponse(null);
      setIsAiTyping(false);
    }
  }, [selectedTopic]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-20 mx-auto flex h-full max-w-[800px] flex-col overflow-hidden bg-white shadow-2xl lg:h-auto lg:max-h-[calc(100vh-4rem)] lg:rounded-[32px] lg:mt-8 lg:mb-8 lg:w-[calc(100%-4rem)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              {tx('Sakstema', 'Policy overview')}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
              {getPolicyTitle(policy, language)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            aria-label={tx('Lukk', 'Close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-auto p-6 lg:max-h-[calc(100vh-10rem)]">
          {voteSubmitted ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#66d96f] shadow-[0_8px_0_#38b14d]">
                <Check className="h-12 w-12 text-white" strokeWidth={3.5} />
              </div>
              <h2 className="text-2xl font-bold text-[#0d87c5] mb-2">{tx('Takk for din stemme!', 'Thanks for your vote!')}</h2>
              <p className="text-lg text-[#1f84ba] mb-4">{tx('Ditt bidrag er mottatt.', 'Your submission is received.')}</p>
              <p className="text-gray-500 text-sm">{tx('Du blir sendt til forsiden...', 'You will be redirected to the homepage...')}</p>
            </div>
          ) : showVote ? (
            <div className="flex flex-col overflow-hidden">
              <div className="mb-5 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowVote(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  aria-label={tx('Tilbake', 'Back')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    {tx('Stemme', 'Vote')}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                    {tx('Gi din tilbakemelding', 'Give your feedback')}
                  </h3>
                </div>
              </div>
              <div className="overflow-y-auto pr-2">
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    {tx(
                      'Her kan du stemme på denne saken og gi din mening.',
                      'Here you can vote on this policy and share your opinion.'
                    )}
                  </p>
                  {/* Voting interface */}
                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                    {voteSubmitted ? (
                      <div className="text-center space-y-6 animate-in fade-in-0 zoom-in-95 duration-500">
                        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#66d96f] shadow-[0_6px_0_#38b14d]">
                          <Check className="h-12 w-12 text-white" strokeWidth={3.5} />
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xl font-bold text-slate-900">
                            {tx('Takk for din stemme!', 'Thanks for your vote!')}
                          </h4>
                          <p className="text-slate-600">
                            {tx('Din tilbakemelding er mottatt og betyr mye for oss.', 'Your feedback has been received and means a lot to us.')}
                          </p>
                        </div>

                        <div className="flex justify-center">
                          <div className="text-3xl">
                            {selectedSentiment === 'positive' ? '👍' :
                             selectedSentiment === 'neutral' ? '😐' : '👎'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center">
                          <h4 className="text-lg font-semibold text-slate-900">
                            {tx('Din mening om denne policyen', 'Your opinion on this policy')}
                          </h4>
                          <p className="mt-1 text-sm text-slate-600">
                            {tx('Klikk på smilefjeset som passer best', 'Click the emoji that best matches your feeling')}
                          </p>
                        </div>

                        <div className="flex justify-center gap-6">
                          <button
                            onClick={() => setSelectedSentiment('positive')}
                            className={`group relative flex flex-col items-center gap-3 rounded-2xl p-6 transition-all duration-200 hover:scale-110 active:scale-95 ${
                              selectedSentiment === 'positive'
                                ? 'bg-green-100 border-2 border-green-400 shadow-lg shadow-green-200'
                                : 'bg-white border-2 border-slate-200 hover:border-green-300 hover:shadow-md'
                            }`}
                          >
                            <div className={`text-4xl transition-transform duration-200 ${
                              selectedSentiment === 'positive' ? 'scale-110' : 'group-hover:scale-105'
                            }`}>
                              👍
                            </div>
                            <span className={`text-sm font-medium transition-colors ${
                              selectedSentiment === 'positive' ? 'text-green-700' : 'text-slate-600'
                            }`}>
                              {tx('Bra!', 'Great!')}
                            </span>
                            {selectedSentiment === 'positive' && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 animate-pulse" />
                            )}
                          </button>

                          <button
                            onClick={() => setSelectedSentiment('neutral')}
                            className={`group relative flex flex-col items-center gap-3 rounded-2xl p-6 transition-all duration-200 hover:scale-110 active:scale-95 ${
                              selectedSentiment === 'neutral'
                                ? 'bg-yellow-100 border-2 border-yellow-400 shadow-lg shadow-yellow-200'
                                : 'bg-white border-2 border-slate-200 hover:border-yellow-300 hover:shadow-md'
                            }`}
                          >
                            <div className={`text-4xl transition-transform duration-200 ${
                              selectedSentiment === 'neutral' ? 'scale-110' : 'group-hover:scale-105'
                            }`}>
                              😐
                            </div>
                            <span className={`text-sm font-medium transition-colors ${
                              selectedSentiment === 'neutral' ? 'text-yellow-700' : 'text-slate-600'
                            }`}>
                              {tx('Meh', 'Meh')}
                            </span>
                            {selectedSentiment === 'neutral' && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-500 animate-pulse" />
                            )}
                          </button>

                          <button
                            onClick={() => setSelectedSentiment('negative')}
                            className={`group relative flex flex-col items-center gap-3 rounded-2xl p-6 transition-all duration-200 hover:scale-110 active:scale-95 ${
                              selectedSentiment === 'negative'
                                ? 'bg-red-100 border-2 border-red-400 shadow-lg shadow-red-200'
                                : 'bg-white border-2 border-slate-200 hover:border-red-300 hover:shadow-md'
                            }`}
                          >
                            <div className={`text-4xl transition-transform duration-200 ${
                              selectedSentiment === 'negative' ? 'scale-110' : 'group-hover:scale-105'
                            }`}>
                              👎
                            </div>
                            <span className={`text-sm font-medium transition-colors ${
                              selectedSentiment === 'negative' ? 'text-red-700' : 'text-slate-600'
                            }`}>
                              {tx('Ikke bra', 'Not good')}
                            </span>
                            {selectedSentiment === 'negative' && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 animate-pulse" />
                            )}
                          </button>
                        </div>

                        {selectedSentiment && (
                          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                            {/* Previous Comments Section */}
                            <div className="mb-4">
                              <h5 className="font-medium text-slate-900 mb-2">{tx('Dine tidligere kommentarer', 'Your previous comments')}</h5>
                              {feedbackLoading ? (
                                <p className="text-sm text-gray-500">{tx('Laster...', 'Loading...')}</p>
                              ) : feedbackError ? (
                                <p className="text-sm text-red-500">{feedbackError}</p>
                              ) : feedback && feedback.length > 0 ? (
                                <ul className="space-y-2 max-h-32 overflow-y-auto">
                                  {feedback.map(item => (
                                    <li key={item.id} className="text-xs text-gray-700 border-b pb-1 last:border-b-0">
                                      <span className="font-semibold">{item.created_at.slice(0, 10)}:</span> {item.content}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-gray-400">{tx('Ingen tidligere kommentarer', 'No previous comments')}</p>
                              )}
                            </div>
                            <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="text-2xl">
                                  {selectedSentiment === 'positive' ? '💬' :
                                   selectedSentiment === 'neutral' ? '🤔' : '💭'}
                                </div>
                                <div>
                                  <h5 className="font-medium text-slate-900">
                                    {tx('Vil du si mer?', 'Want to say more?')}
                                  </h5>
                                  <p className="text-sm text-slate-600">
                                    {tx('Din mening betyr mye for oss', 'Your opinion matters to us')}
                                  </p>
                                </div>
                              </div>
                              <Textarea
                                placeholder={tx('Del dine tanker (valgfritt)', 'Share your thoughts (optional)')}
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                className="min-h-[80px] resize-none border-slate-300 focus:border-blue-400 focus:ring-blue-400 transition-colors"
                              />
                            </div>
                            {/* Comment-only submit button */}
                            <div className="flex flex-col gap-2 mt-2">
                              {commentError && (
                                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{commentError}</p>
                              )}
                              {commentSuccess && (
                                <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{tx('Kommentaren ble sendt', 'Comment sent!')}</p>
                              )}
                              <Button
                                type="button"
                                onClick={handleCommentSubmit}
                                disabled={commentSubmitting || !feedbackText.trim()}
                                className="w-full bg-gradient-to-r from-blue-400 to-indigo-400 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-2 rounded-xl shadow hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {commentSubmitting ? tx('Sender...', 'Submitting...') : tx('Send kun kommentar', 'Send only comment')}
                              </Button>
                            </div>
                            {voteError && (
                              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{voteError}</p>
                            )}
                            <Button
                              onClick={handleVoteSubmit}
                              disabled={isSubmitting || previewMode}
                              title={previewMode ? tx('Stemming er deaktivert i forhåndsvisning', 'Voting disabled in preview mode') : undefined}
                              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  {tx('Sender...', 'Submitting...')}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Send className="h-4 w-4" />
                                  {tx('Send stemme', 'Submit vote')}
                                </div>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : selectedTopic ? (
            <div className="flex h-full flex-col overflow-hidden">
              <div className="mb-5 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedTopic(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  aria-label={tx('Tilbake', 'Back')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    {tx('Tema detaljer', 'Topic details')}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                    {language === 'en' ? selectedTopic.label_en : selectedTopic.label_no}
                  </h3>
                </div>
              </div>

              <div className="overflow-y-auto pr-2">
                {activeTopicView === 'details' ? (
                  <>
                    <div className="space-y-4">
                      <p className="text-sm text-slate-500">
                        {language === 'en'
                          ? selectedTopic.description_en || 'A focused explanation of the chosen topic.'
                          : selectedTopic.description_no || 'En fokuseret forklaring av valgt tema.'}
                      </p>
                      <ul className="space-y-3">
                        {topicBullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3 text-sm leading-6 text-slate-700">
                            <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setActiveTopicView('pdf')}
                        className="inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <BookOpen className="h-4 w-4" />
                        {tx('Gaa til PDF-seksjon', 'Go to PDF section')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTopicView('ai')}
                        className="inline-flex items-center justify-center gap-2 rounded-3xl bg-primary px-4 py-4 text-sm font-semibold text-white transition hover:bg-primary/90"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {tx('Sporr AI-agenten', 'Ask the AI agent')}
                      </button>
                    </div>
                  </>
                ) : activeTopicView === 'pdf' ? (
                  <div className="space-y-6">
                    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                      <h4 className="text-lg font-semibold text-slate-900">
                        {tx('Relevante PDF-utdrag', 'Relevant PDF section')}
                      </h4>
                      <p className="mt-2 text-sm text-slate-500">
                        {tx(
                          'Her finner du de viktigste punktene fra PDF-en for dette temaet. Åpne PDF-en for å gå direkte til den relevante seksjonen.',
                          'Here are the most important points from the PDF for this topic. Open the PDF to jump directly to the relevant section.'
                        )}
                      </p>
                      <ul className="mt-4 space-y-3 text-sm text-slate-700">
                        {topicBullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3">
                            <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                      {firstAttachment ? (
                        <a
                          href={resolveAttachmentUrl(firstAttachment.file_path)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-3xl bg-white px-4 py-4 text-sm font-semibold text-slate-900 border border-slate-200 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <BookOpen className="h-4 w-4" />
                          {tx('Åpne relevant PDF', 'Open relevant PDF')}
                        </a>
                      ) : (
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                          {tx('Ingen PDF-vedlegg er tilgjengelig for denne saken.', 'No PDF attachment is available for this policy.')}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveTopicView('details')}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                        aria-label={tx('Tilbake til tema', 'Back to topic')}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* AI Header */}
                    <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-slate-900">
                            {tx('CIVICUS AI-assistent', 'CIVICUS AI Assistant')}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {tx('Din personlige guide til dette temaet', 'Your personal guide to this topic')}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500">
                        {tx(
                          'Still et spørsmål om temaet, og få en rask forklaring direkte i samme vindu.',
                          'Ask a question about the topic and get a quick explanation right here.'
                        )}
                      </p>
                    </div>

                    {/* Chat Messages */}
                    <div className="space-y-4 min-h-[200px]">
                      {aiResponse ? (
                        <div className="flex gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-md flex-shrink-0">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3 text-sm text-slate-900 shadow-sm">
                              <p className="whitespace-pre-line">{aiResponse}</p>
                            </div>
                            <button
                              onClick={() => navigator.clipboard.writeText(aiResponse)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                              <Copy className="h-3 w-3" />
                              {tx('Kopier', 'Copy')}
                            </button>
                          </div>
                        </div>
                      ) : isAiTyping ? (
                        <div className="flex gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-md flex-shrink-0">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                          <div className="rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-1">
                              <div className="flex gap-1">
                                <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"></div>
                              </div>
                              <span className="text-xs text-slate-500 ml-2">
                                {tx('AI tenker...', 'AI is thinking...')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-md flex-shrink-0">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                          <div className="rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3 text-sm text-slate-600 shadow-sm">
                            <p>
                              {tx(
                                'Hei! Jeg kan hjelpe deg med å forstå dette temaet bedre. Still meg et spørsmål!',
                                'Hi! I can help you understand this topic better. Ask me a question!'
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input Area */}
                    <div className="space-y-4">
                      <div className="relative">
                        <Textarea
                          placeholder={tx('Skriv spørsmålet ditt her...', 'Type your question here...')}
                          value={aiQuestion}
                          onChange={(e) => setAiQuestion(e.target.value)}
                          className="min-h-[100px] resize-none border-slate-300 focus:border-blue-400 focus:ring-blue-400 pr-12"
                        />
                        <div className="absolute bottom-3 right-3">
                          <Sparkles className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleAskAi}
                          disabled={!aiQuestion.trim() || isAiTyping}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                        >
                          {isAiTyping ? (
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="h-1.5 w-1.5 rounded-full bg-white animate-bounce"></div>
                              </div>
                              {tx('Tenker...', 'Thinking...')}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Send className="h-4 w-4" />
                              {tx('Få svar fra AI', 'Get AI answer')}
                            </div>
                          )}
                        </Button>
                        <button
                          type="button"
                          onClick={() => setActiveTopicView('details')}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                          aria-label={tx('Tilbake', 'Back')}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col overflow-hidden">
              <div className="space-y-4">
                <Badge variant={policy.status as 'active' | 'under_review' | 'closed' | 'draft'} className="w-fit">
                  {policy.status === 'active'
                    ? tx('Aktiv', 'Active')
                    : policy.status === 'under_review'
                    ? tx('Under vurdering', 'Under review')
                    : policy.status === 'closed'
                    ? tx('Lukket', 'Closed')
                    : tx('Utkast', 'Draft')}
                </Badge>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {tx(
                    'Velg et tema for a lese kortfattede forklaringer, finne riktig PDF-seksjon og fa AI-hjelp.',
                    'Pick a topic to read concise summaries, locate the right PDF section, and get AI support.'
                  )}
                </p>
                <div className="grid gap-4 grid-cols-2">
                  {topics.map((topic) => {
                    const Icon = TOPIC_ICONS[topic.icon_key ?? ''] ?? TOPIC_ICONS[topic.slug] ?? Bike;
                    return (
                      <button
                        key={topic.slug}
                        type="button"
                        onClick={() => setSelectedTopic(topic)}
                        className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-primary hover:bg-primary/5"
                      >
                        <Icon className="h-6 w-6 text-slate-600 group-hover:text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-950">
                            {language === 'en' ? topic.label_en : topic.label_no}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                            {language === 'en' ? topic.description_en : topic.description_no}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:text-primary" />
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setShowVote(true)}
                    className="inline-flex items-center gap-2 rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
                  >
                    <Sparkles className="h-4 w-4" />
                    {tx('Stem pa saken', 'Vote on this policy')}
                  </button>
                </div>
                {firstAttachment ? (
                  <div className="mt-4 flex justify-center">
                    <a
                      href={resolveAttachmentUrl(firstAttachment.file_path)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <BookOpen className="h-4 w-4" />
                      {tx('Aapne policy-PDF', 'Open policy PDF')}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
