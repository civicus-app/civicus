export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'citizen' | 'admin' | 'super_admin';
  district_id?: string;
  date_of_birth?: string;
  avatar_url?: string;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface District {
  id: string;
  name: string;
  municipality: string;
  geojson?: Record<string, unknown>;
  population?: number;
  created_at: string;
  updated_at: string;
}
