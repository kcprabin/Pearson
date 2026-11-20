/// <reference types="vite/client" />

// Add any custom Vite env keys you use here (prefix client-exposed keys with VITE_)
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_APP_NAME?: string;
  // add more keys as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
