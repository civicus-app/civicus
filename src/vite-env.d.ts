interface ImportMetaEnv {
  readonly VITE_DATA_PROVIDER?: 'local' | 'supabase';
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_MUNICIPALITY_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
