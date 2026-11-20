/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_AUTH_API_BASE_URL: string
  readonly VITE_API_BASE_URL_HOTEL: string
  readonly VITE_API_BASE_URL_BOOKING: string
  readonly VITE_API_BASE_URL_ADMIN: string
  readonly VITE_ENV: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}