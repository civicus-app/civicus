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
      <div className="space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#168ec2]">CIVICUS AI</h2>
          <button onClick={() => navigate(-1)} className="text-[#2a89bc]" aria-label={tx('Lukk', 'Close')}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <article className="rounded-[22px] bg-[#28bad7] px-4 py-4 shadow">
          <div className="mb-3 border-b border-[#0f6a89]/35 pb-2 text-right text-[#1b6388]">x</div>

          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === 'assistant'
                    ? 'max-w-[84%] rounded-[18px] bg-[#f0f0f0] px-4 py-3 text-sm text-[#2f2f2f]'
                    : 'ml-auto max-w-[84%] rounded-[18px] bg-[#2187b6] px-4 py-3 text-sm text-white'
                }
              >
                {message.content}
              </div>
            ))}

            {sending ? (
              <div className="inline-flex items-center gap-2 rounded-[18px] bg-[#f0f0f0] px-4 py-2 text-sm text-[#4c4c4c]">
                <Bot className="h-4 w-4" />
                {tx('Skriver svar...', 'Writing...')}
              </div>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="mt-4 flex items-center gap-2 rounded-full bg-white px-3 py-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={tx('Skriv en melding...', 'Write a message...')}
              className="w-full bg-transparent text-sm text-[#333] outline-none"
            />
            <button
              type="submit"
              className="grid h-7 w-7 place-items-center rounded-full bg-[#5c72ff] text-white disabled:opacity-60"
              disabled={sending || !input.trim()}
              aria-label={tx('Send', 'Send')}
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </article>

        <Link
          to={`/policies/${id}/topic/${topic}/utdrag`}
          className="block w-full rounded-2xl bg-[#168ec2] px-4 py-3 text-center text-base font-semibold text-white"
        >
          {tx('Neste: Se utdrag', 'Next: View extract')}
        </Link>
      </div>
    </CivicusMobileShell>
  );
}
