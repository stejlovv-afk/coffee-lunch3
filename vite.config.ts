import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем переменные из .env файла (если есть локально)
  const env = loadEnv(mode, process.cwd(), '');
  
  // Получаем ключ:
  // 1. Из process.env.API_KEY (это передает GitHub Actions через секреты)
  // 2. Или из env.API_KEY (локальный .env)
  // 3. Или пустая строка (чтобы сборка не упала, если ключа нет)
  const apiKey = process.env.API_KEY || env.API_KEY || '';

  return {
    plugins: [react()],
    base: './', 
    build: {
      outDir: 'dist',
    },
    define: {
      // Это "запекает" значение ключа прямо в JavaScript код как строку.
      // Важно: в клиентском коде (AIChatModal) мы обращаемся к process.env.API_KEY
      // Vite найдет это вхождение и заменит на реальную строку ключа.
      'process.env.API_KEY': JSON.stringify(apiKey),
    }
  };
});
