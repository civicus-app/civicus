export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          district_id: string | null
          date_of_birth: string | null
          avatar_url: string | null
          email_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      policies: {
        Row: {
          id: string
          title: string
          description: string
          category_id: string | null
          status: string
          scope: string
          start_date: string
          end_date: string | null
          allow_anonymous: boolean
          video_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['policies']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['policies']['Insert']>
      }
      feedback: {
        Row: {
          id: string
          policy_id: string
          user_id: string | null
          content: string
          is_anonymous: boolean
          sentiment: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['feedback']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['feedback']['Insert']>
      }
      sentiment_votes: {
        Row: {
          id: string
          policy_id: string
          user_id: string
          sentiment: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['sentiment_votes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['sentiment_votes']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          related_policy_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      districts: {
        Row: {
          id: string
          name: string
          municipality: string
          geojson: Json | null
          population: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['districts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['districts']['Insert']>
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          color: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
    }
    Functions: {
      get_dashboard_metrics: {
        Args: { time_period?: string; district_filter?: string }
        Returns: Json
      }
      track_policy_view: {
        Args: { policy_uuid: string }
        Returns: void
      }
    }
  }
}
