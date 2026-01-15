import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем переменные из .env файла (если есть локально)
  const env = loadEnv(mode, process.cwd(), '');
  
  // Получаем ключи из окружения ИЛИ используем ваши значения
  const geminiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || 'AIzaSyCL2OSF22FWV-tj2e2LtbsPSMet3bfNgCQ';
  
  // URL прокси. Убираем слеш в конце, если пользователь скопировал с ним
  let geminiGateway = process.env.GEMINI_GATEWAY_URL || env.GEMINI_GATEWAY_URL || 'https://gemenicofe.stejlovv.workers.dev';
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
      // "Запекаем" ключи в код при сборке
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
      'process.env.GEMINI_GATEWAY_URL': JSON.stringify(geminiGateway),
    }
  };
});
