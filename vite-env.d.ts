/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TIMEWEB_API_URL: string
  readonly VITE_TIMEWEB_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
