import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // ВСТАВЬТЕ СЮДА ВАШ API КЛЮЧ GEMINI
  const geminiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || 'AIzaSyCL2OSF22FWV-tj2e2LtbsPSMet3bfNgCQ';
  
  // ВСТАВЬТЕ СЮДА ССЫЛКУ НА ВАШ CLOUDFLARE WORKER
  // Пример: 'https://misty-field-1234.ваше_имя.workers.dev'
  // Оставьте пустым (''), если используете VPN и прямой доступ
  let geminiGateway = process.env.GEMINI_GATEWAY_URL || env.GEMINI_GATEWAY_URL || 'https://gemenicofe.stejlovv.workers.dev';

  // Убираем слеш в конце, если он есть, чтобы не ломать путь
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
