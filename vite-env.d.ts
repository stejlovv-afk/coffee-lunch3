/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TIMEWEB_API_URL: string
  readonly VITE_TIMEWEB_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  Telegram?: {
    WebApp?: {
      ready: () => void;
      expand: () => void;
      setHeaderColor: (color: string) => void;
      setBackgroundColor: (color: string) => void;
      enableClosingConfirmation: () => void;
      initDataUnsafe?: {
        user?: {
          username?: string;
          first_name?: string;
        };
      };
      HapticFeedback?: {
        notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
      };
      MainButton: {
        setText: (text: string) => void;
        textColor: string;
        color: string;
        isVisible: boolean;
        onClick: (cb: () => void) => void;
        offClick: (cb: () => void) => void;
      };
      sendData: (data: string) => void;
    };
  }
}
