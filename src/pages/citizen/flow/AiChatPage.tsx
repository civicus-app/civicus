import { ArrowRight, Bot, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CivicusMobileShell from '../../../components/citizen/CivicusMobileShell';
import { usePolicy } from '../../../hooks/usePolicies';
import { aiService, type AiChatMessage } from '../../../services/ai';
import { useLanguageStore } from '../../../store/languageStore';
import { getTopicLabel } from './topics';

export default function AiChatPage() {
  const { id = '', topic = '' } = useParams();
  const navigate = useNavigate();
  const { policy } = usePolicy(id);
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: 'assistant',
      content: tx(
        `Hei! Jeg hjelper deg med temaet "${getTopicLabel(topic, 'no', policy?.topics)}". Hva lurer du pa?`,
        `Hi! I can help you with "${getTopicLabel(topic, 'en', policy?.topics)}". What would you like to know?`
      ),
    },
  ]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    const nextMessages = [...messages, { role: 'user' as const, content }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const response = await aiService.chat({
        policyId: id,
        topic,
        messages: nextMessages,
        language,
      });

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: response.reply,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <CivicusMobileShell compact>
      <div className="space-y-5 pb-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            aria-label={tx('Lukk', 'Close')}
          >
            <X className="h-5 w-5" />
            {tx('Lukk AI-hjelp', 'Close AI help')}
          </button>
          <div className="space-y-1 text-left sm:text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">CIVICUS AI</p>
            <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">{getTopicLabel(topic, language, policy?.topics)}</h2>
            <p className="text-sm text-slate-500">
              {tx('Styrket forklaring pa valgt tema', 'Enhanced guidance for your chosen topic')}
            </p>
          </div>
        </div>

        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === 'assistant'
                    ? 'rounded-[26px] border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-900 shadow-sm'
                    : 'ml-auto max-w-[92%] rounded-[26px] bg-sky-700 px-4 py-3 text-sm text-white shadow-sm sm:max-w-[84%]'
                }
              >
                {message.content}
              </div>
            ))}

            {sending ? (
              <div className="inline-flex items-center gap-2 rounded-[26px] bg-slate-100 px-4 py-3 text-sm text-slate-700">
                <Bot className="h-4 w-4 text-slate-700" />
                {tx('Skriver svar...', 'Writing...')}
              </div>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="mt-5 flex items-center gap-2 rounded-[24px] border border-slate-200 bg-slate-50 p-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={tx('Spors maler, for eksempel: Kva betyr dette for oss?', 'Ask something like: What does this mean for us?')}
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="grid h-10 w-10 place-items-center rounded-full bg-sky-700 text-white disabled:opacity-50"
              disabled={sending || !input.trim()}
              aria-label={tx('Send', 'Send')}
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </article>

        <Link
          to={`/policies/${id}/topic/${topic}/utdrag`}
          className="block w-full rounded-3xl bg-sky-700 px-4 py-4 text-center text-base font-semibold text-white shadow-md shadow-sky-200/40 transition hover:bg-sky-600"
        >
          {tx('Neste: Se PDF-seksjon', 'Next: View PDF section')}
        </Link>
      </div>
    </CivicusMobileShell>
  );
}
