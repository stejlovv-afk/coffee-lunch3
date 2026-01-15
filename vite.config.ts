import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // ВСТАВЬТЕ СЮДА ВАШ НОВЫЙ API КЛЮЧ GEMINI, ЕСЛИ СТАРЫЙ "ПЕРЕГРЕЛСЯ" (429 ERROR)
  // Получить ключ: https://aistudio.google.com/app/apikey
  const geminiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || 'AIzaSyCL2OSF22FWV-tj2e2LtbsPSMet3bfNgCQ';
  
  // ВСТАВЬТЕ СЮДА ССЫЛКУ НА ВАШ CLOUDFLARE WORKER
  let geminiGateway = process.env.GEMINI_GATEWAY_URL || env.GEMINI_GATEWAY_URL || 'https://gemenicofe.stejlovv.workers.dev';

  // Убираем слеш в конце, если он есть
  if (geminiGateway.endsWith('/')) {
    geminiGateway = geminiGateway.slice(0, -1);
  }

  return {
    plugins: [react()],
    base: './', 
    build: {
      outDir: 'dist',
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
      'process.env.GEMINI_GATEWAY_URL': JSON.stringify(geminiGateway),
    }
  };
});
