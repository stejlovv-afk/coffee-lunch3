import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем переменные из .env файла (если есть локально)
  const env = loadEnv(mode, process.cwd(), '');
  
  // Получаем ключи из окружения (локально или из GitHub Actions)
  const gigachatKey = process.env.GIGACHAT_KEY || env.GIGACHAT_KEY || '';

  return {
    plugins: [react()],
    base: './', 
    build: {
      outDir: 'dist',
    },
    define: {
      // "Запекаем" ключи в код при сборке
      'process.env.GIGACHAT_KEY': JSON.stringify(gigachatKey),
    }
  };
});
