import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devApiTarget = env.VITE_DEV_API_TARGET?.trim();

  return {
    base: './',
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
      ...(devApiTarget ? {
        proxy: {
          '/api': {
            target: devApiTarget,
            changeOrigin: true,
            secure: true,
            headers: { Origin: devApiTarget }
          },
          '/uploads': {
            target: devApiTarget,
            changeOrigin: true,
            secure: true,
            headers: { Origin: devApiTarget }
          }
        }
      } : {
        proxy: {
          '/api': {
            target: 'http://localhost:5000',
            changeOrigin: true
          },
          '/uploads': {
            target: 'http://localhost:5000',
            changeOrigin: true
          }
        }
      })
    }
  };
});
