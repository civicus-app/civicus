export type PolicyStatus = 'draft' | 'active' | 'under_review' | 'closed';
export type PolicyScope = 'municipality' | 'district';
export type SentimentType = 'positive' | 'neutral' | 'negative';
export type NotificationType = 'policy_update' | 'status_change' | 'deadline' | 'new_policy' | 'feedback_received' | 'threshold_reached';
export type UpdateType = 'info' | 'status_change' | 'decision' | 'deadline';
export type EventMode = 'in_person' | 'online' | 'hybrid';
export type ModerationStatus = 'open' | 'reviewed' | 'resolved' | 'dismissed';

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  created_at: string;
}

export interface Policy {
  id: string;
  title: string;
  description: string;
  category_id?: string;
  status: PolicyStatus;
  scope: PolicyScope;
  start_date: string;
  end_date?: string;
  allow_anonymous: boolean;
  video_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
  tags?: PolicyTag[];
  attachments?: PolicyAttachment[];
  districts?: { district_id: string; districts: { name: string } }[];
  topics?: PolicyTopic[];
  updates?: PolicyUpdate[];
  events?: Event[];
}

export interface PolicyTag {
  id: string;
  policy_id: string;
  tag: string;
  created_at: string;
}

export interface PolicyAttachment {
  id: string;
  policy_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface PolicyTopic {
  id: string;
  policy_id: string;
  slug: string;
  label_no: string;
  label_en: string;
  description_no?: string;
  description_en?: string;
  icon_key?: string;
  sort_order: number;
  created_at: string;
}

export interface PolicyUpdate {
  id: string;
  policy_id: string;
  title: string;
  content: string;
  update_type?: UpdateType;
  created_by?: string;
  created_at: string;
}

export interface Event {
  id: string;
  policy_id?: string;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  mode: EventMode;
  registration_url?: string;
  created_at: string;
}

export interface SentimentVote {
  id: string;
  policy_id: string;
  user_id: string;
  sentiment: SentimentType;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  policy_id: string;
  user_id?: string;
  content: string;
  is_anonymous: boolean;
  sentiment?: SentimentType;
  created_at: string;
  updated_at: string;
  // Joined
  profiles?: { full_name: string; avatar_url?: string };
}

export interface PolicyFollow {
  id: string;
  policy_id: string;
  user_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_policy_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface ModerationReport {
  id: string;
  policy_id?: string;
  feedback_id?: string;
  map_comment_id?: string;
  reported_by?: string;
  reason: string;
  details?: string;
  status: ModerationStatus;
  created_at: string;
  resolved_at?: string;
}

export interface ModerationAction {
  id: string;
  report_id: string;
  action: string;
  notes?: string;
  acted_by?: string;
  created_at: string;
}

export interface Survey {
  id: string;
  policy_id: string;
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  prompt: string;
  question_type: 'text' | 'single_choice' | 'multiple_choice';
  options?: string[];
  sort_order: number;
  required: boolean;
  created_at: string;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  question_id: string;
  user_id?: string;
  response_text?: string;
  response_options?: string[];
  created_at: string;
}

export interface MapComment {
  id: string;
  policy_id: string;
  user_id?: string;
  district_id?: string;
  latitude?: number;
  longitude?: number;
  content: string;
  created_at: string;
}

export interface DashboardMetrics {
  active_policies: number;
  total_participants: number;
  engagement_rate: number;
  youth_participation: number;
  avg_sentiment_score: number;
  top_issue: string;
  funnel_data: {
    viewed: number;
    interacted: number;
    feedback_given: number;
    votes_cast: number;
  };
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface EngagementAnalytics {
  policy_id: string;
  title: string;
  status: PolicyStatus;
  views_count: number;
  votes_count: number;
  feedback_count: number;
  engaged_users: number;
  avg_sentiment_score: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
}
