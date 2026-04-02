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

interface ExternalAiConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
}

export class ExternalApiAiAdapter implements AiServiceAdapter {
  private readonly baseUrl: string;

  constructor(private readonly config: ExternalAiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
  }

  private async post<TResponse>(path: string, body: unknown): Promise<TResponse> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`AI API error (${response.status}): ${text || 'Unknown error'}`);
      }

      return (await response.json()) as TResponse;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async getTopicOverview(input: TopicOverviewInput): Promise<TopicOverviewResult> {
    return this.post<TopicOverviewResult>(
      `/v1/policies/${input.policyId}/topics/${input.topic}/overview`,
      { language: input.language || 'no' }
    );
  }

  async chat(input: ChatInput): Promise<ChatResult> {
    return this.post<ChatResult>(`/v1/policies/${input.policyId}/topics/${input.topic}/chat`, {
      messages: input.messages,
      language: input.language || 'no',
    });
  }

  async extractOriginalText(input: ExtractInput): Promise<ExtractResult> {
    return this.post<ExtractResult>(`/v1/policies/${input.policyId}/topics/${input.topic}/extract`, {
      language: input.language || 'no',
    });
  }

  async getAdminInsights(input: AdminInsightsInput): Promise<AdminInsightsResult> {
    return this.post<AdminInsightsResult>('/v1/admin/insights/summary', {
      period: input.period,
    });
  }

  async startVerification(input: StartVerificationInput): Promise<StartVerificationResult> {
    return this.post<StartVerificationResult>('/v1/auth/mock/minid/start', input);
  }

  async completeVerification(input: CompleteVerificationInput): Promise<CompleteVerificationResult> {
    return this.post<CompleteVerificationResult>('/v1/auth/mock/minid/complete', input);
  }
}
