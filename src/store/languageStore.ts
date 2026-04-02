import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LanguageCode = 'no' | 'en';

interface LanguageState {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'no',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'civicus-language',
    }
  )
);
