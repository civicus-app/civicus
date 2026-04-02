export type AiRole = 'user' | 'assistant';
export type AiLanguage = 'no' | 'en';

export interface AiChatMessage {
  role: AiRole;
  content: string;
}

export interface TopicOverviewInput {
  policyId: string;
  topic: string;
  language?: AiLanguage;
}

export interface TopicOverviewResult {
  bullets: string[];
  citation?: string;
}

export interface ChatInput {
  policyId: string;
  topic: string;
  messages: AiChatMessage[];
  language?: AiLanguage;
}

export interface ChatResult {
  reply: string;
  citations?: string[];
}

export interface ExtractInput {
  policyId: string;
  topic: string;
  language?: AiLanguage;
}

export interface ExtractResult {
  text: string;
  summary: string;
}

export interface AdminInsightsInput {
  period: '7d' | '30d' | '90d';
}

export interface AdminInsightsResult {
  points: string[];
}

export interface StartVerificationInput {
  provider: 'minid' | 'bankid';
  policyId: string;
}

export interface StartVerificationResult {
  redirectUrl: string;
  state: string;
}

export interface CompleteVerificationInput {
  state: string;
  code: string;
}

export interface CompleteVerificationResult {
  verified: boolean;
  expiresAt: string;
}

export interface AiServiceAdapter {
  getTopicOverview(input: TopicOverviewInput): Promise<TopicOverviewResult>;
  chat(input: ChatInput): Promise<ChatResult>;
  extractOriginalText(input: ExtractInput): Promise<ExtractResult>;
  getAdminInsights(input: AdminInsightsInput): Promise<AdminInsightsResult>;
  startVerification(input: StartVerificationInput): Promise<StartVerificationResult>;
  completeVerification(input: CompleteVerificationInput): Promise<CompleteVerificationResult>;
}
