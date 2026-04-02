/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string;
  readonly VITE_DATA_PROVIDER?: 'local' | 'supabase';
  readonly VITE_ENABLE_MFA?: 'true' | 'false';
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_MUNICIPALITY_NAME?: string;
  readonly VITE_AI_API_BASE_URL?: string;
  readonly VITE_AI_API_KEY?: string;
  readonly VITE_AI_API_TIMEOUT_MS?: string;
  readonly VITE_ROUTER_MODE?: 'browser' | 'hash';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
