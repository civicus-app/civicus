import { ExternalApiAiAdapter } from './externalApiAdapter';
import { LocalMockAiAdapter } from './localMockAdapter';
import type {
  AdminInsightsInput,
  AdminInsightsResult,
  AiServiceAdapter,
  ChatInput,
  ChatResult,
  CompleteVerificationInput,
  CompleteVerificationResult,
  ExtractInput,
  ExtractResult,
  StartVerificationInput,
  StartVerificationResult,
  TopicOverviewInput,
  TopicOverviewResult,
} from './types';

const apiBaseUrl = import.meta.env.VITE_AI_API_BASE_URL as string | undefined;
const apiKey = import.meta.env.VITE_AI_API_KEY as string | undefined;
const timeoutMs = Number(import.meta.env.VITE_AI_API_TIMEOUT_MS || '12000');

class ResilientAiService implements AiServiceAdapter {
  constructor(
    private readonly primary: AiServiceAdapter,
    private readonly fallback: AiServiceAdapter
  ) {}

  private async callWithFallback<T>(callback: (service: AiServiceAdapter) => Promise<T>) {
    try {
      return await callback(this.primary);
    } catch (error) {
      console.warn('AI primary failed, using fallback adapter:', error);
      return callback(this.fallback);
    }
  }

  getTopicOverview(input: TopicOverviewInput): Promise<TopicOverviewResult> {
    return this.callWithFallback((service) => service.getTopicOverview(input));
  }

  chat(input: ChatInput): Promise<ChatResult> {
    return this.callWithFallback((service) => service.chat(input));
  }

  extractOriginalText(input: ExtractInput): Promise<ExtractResult> {
    return this.callWithFallback((service) => service.extractOriginalText(input));
  }

  getAdminInsights(input: AdminInsightsInput): Promise<AdminInsightsResult> {
    return this.callWithFallback((service) => service.getAdminInsights(input));
  }

  startVerification(input: StartVerificationInput): Promise<StartVerificationResult> {
    return this.callWithFallback((service) => service.startVerification(input));
  }

  completeVerification(input: CompleteVerificationInput): Promise<CompleteVerificationResult> {
    return this.callWithFallback((service) => service.completeVerification(input));
  }
}

const mockAdapter = new LocalMockAiAdapter();
const externalAdapter =
  apiBaseUrl && apiKey
    ? new ExternalApiAiAdapter({
        baseUrl: apiBaseUrl,
        apiKey,
        timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 12000,
      })
    : mockAdapter;

export const aiService: AiServiceAdapter = new ResilientAiService(externalAdapter, mockAdapter);

export * from './types';
