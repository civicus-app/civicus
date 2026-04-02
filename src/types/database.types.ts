export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: string;
          district_id: string | null;
          date_of_birth: string | null;
          avatar_url: string | null;
          email_notifications: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      districts: {
        Row: {
          id: string;
          name: string;
          municipality: string;
          geojson: Json | null;
          population: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['districts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['districts']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      policies: {
        Row: {
          id: string;
          title: string;
          description: string;
          category_id: string | null;
          status: string;
          scope: string;
          start_date: string;
          end_date: string | null;
          allow_anonymous: boolean;
          video_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['policies']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['policies']['Insert']>;
      };
      policy_districts: {
        Row: {
          policy_id: string;
          district_id: string;
        };
        Insert: Database['public']['Tables']['policy_districts']['Row'];
        Update: Partial<Database['public']['Tables']['policy_districts']['Row']>;
      };
      policy_tags: {
        Row: {
          id: string;
          policy_id: string;
          tag: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['policy_tags']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['policy_tags']['Insert']>;
      };
      policy_attachments: {
        Row: {
          id: string;
          policy_id: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['policy_attachments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['policy_attachments']['Insert']>;
      };
      policy_topics: {
        Row: {
          id: string;
          policy_id: string;
          slug: string;
          label_no: string;
          label_en: string;
          description_no: string | null;
          description_en: string | null;
          icon_key: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['policy_topics']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['policy_topics']['Insert']>;
      };
      policy_updates: {
        Row: {
          id: string;
          policy_id: string;
          title: string;
          content: string;
          update_type: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['policy_updates']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['policy_updates']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          policy_id: string | null;
          title: string;
          description: string | null;
          event_date: string;
          location: string | null;
          mode: string;
          registration_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      feedback: {
        Row: {
          id: string;
          policy_id: string;
          user_id: string | null;
          content: string;
          is_anonymous: boolean;
          sentiment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['feedback']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['feedback']['Insert']>;
      };
      sentiment_votes: {
        Row: {
          id: string;
          policy_id: string;
          user_id: string;
          sentiment: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sentiment_votes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['sentiment_votes']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          related_policy_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      policy_views: {
        Row: {
          id: string;
          policy_id: string;
          user_id: string;
          viewed_at: string;
          viewed_on: string;
        };
        Insert: Omit<Database['public']['Tables']['policy_views']['Row'], 'id' | 'viewed_at' | 'viewed_on'> & {
          viewed_at?: string;
          viewed_on?: string;
        };
        Update: Partial<Database['public']['Tables']['policy_views']['Insert']>;
      };
      policy_follows: {
        Row: {
          id: string;
          policy_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['policy_follows']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['policy_follows']['Insert']>;
      };
      admin_invites: {
        Row: {
          id: string;
          code_hash: string;
          email: string | null;
          expires_at: string;
          used_at: string | null;
          used_by: string | null;
          revoked_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['admin_invites']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['admin_invites']['Insert']>;
      };
      auth_email_challenges: {
        Row: {
          id: string;
          email: string;
          user_id: string | null;
          purpose: string;
          account_mode: string;
          invite_id: string | null;
          code_hash: string;
          verification_token_hash: string | null;
          status: string;
          attempts: number;
          max_attempts: number;
          expires_at: string;
          resend_available_at: string;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['auth_email_challenges']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['auth_email_challenges']['Insert']>;
      };
      trusted_devices: {
        Row: {
          id: string;
          user_id: string;
          token_hash: string;
          expires_at: string;
          revoked_at: string | null;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trusted_devices']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['trusted_devices']['Insert']>;
      };
      verified_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          role: string;
          source: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['verified_sessions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['verified_sessions']['Insert']>;
      };
      moderation_reports: {
        Row: {
          id: string;
          policy_id: string | null;
          feedback_id: string | null;
          map_comment_id: string | null;
          reported_by: string | null;
          reason: string;
          details: string | null;
          status: string;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['moderation_reports']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['moderation_reports']['Insert']>;
      };
      moderation_actions: {
        Row: {
          id: string;
          report_id: string;
          action: string;
          notes: string | null;
          acted_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['moderation_actions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['moderation_actions']['Insert']>;
      };
      surveys: {
        Row: {
          id: string;
          policy_id: string;
          title: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['surveys']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['surveys']['Insert']>;
      };
      survey_questions: {
        Row: {
          id: string;
          survey_id: string;
          prompt: string;
          question_type: string;
          options: Json | null;
          sort_order: number;
          required: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['survey_questions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['survey_questions']['Insert']>;
      };
      survey_responses: {
        Row: {
          id: string;
          survey_id: string;
          question_id: string;
          user_id: string | null;
          response_text: string | null;
          response_options: Json | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['survey_responses']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['survey_responses']['Insert']>;
      };
      map_comments: {
        Row: {
          id: string;
          policy_id: string;
          user_id: string | null;
          district_id: string | null;
          latitude: number | null;
          longitude: number | null;
          content: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['map_comments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['map_comments']['Insert']>;
      };
    };
    Functions: {
      get_dashboard_metrics: {
        Args: { time_period?: string; district_filter?: string | null };
        Returns: Json;
      };
      current_auth_session_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      is_admin_invite_valid: {
        Args: { input_code: string; input_email?: string | null };
        Returns: boolean;
      };
      is_current_session_verified: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      track_policy_view: {
        Args: { policy_uuid: string };
        Returns: void;
      };
    };
  };
}
