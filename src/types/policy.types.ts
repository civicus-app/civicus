export type PolicyStatus = 'draft' | 'active' | 'under_review' | 'closed';
export type PolicyScope = 'municipality' | 'district';
export type SentimentType = 'positive' | 'neutral' | 'negative';
export type NotificationType = 'policy_update' | 'status_change' | 'deadline' | 'new_policy' | 'feedback_received' | 'threshold_reached';
export type UpdateType = 'info' | 'status_change' | 'decision' | 'deadline';

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

export interface PolicyUpdate {
  id: string;
  policy_id: string;
  title: string;
  content: string;
  update_type?: UpdateType;
  created_by?: string;
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
