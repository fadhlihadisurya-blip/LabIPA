import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'telegram-api-dev-middleware',
        configureServer(server) {
          server.middlewares.use('/api/telegram', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
              return;
            }

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });

            req.on('end', async () => {
              res.setHeader('Content-Type', 'application/json');
              try {
                const parsed = body ? JSON.parse(body) : {};
                const botToken = parsed.botToken || process.env.TELEGRAM_BOT_TOKEN;
                const chatId = parsed.chatId || process.env.TELEGRAM_CHAT_ID;
                const message = parsed.message;

                if (!botToken || !chatId) {
                  res.statusCode = 200;
                  res.end(
                    JSON.stringify({
                      success: false,
                      configured: false,
                      message: 'Telegram belum dikonfigurasi',
                    })
                  );
                  return;
                }

                if (!message) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, error: 'Pesan kosong' }));
                  return;
                }

                const tgRes = await fetch(
                  `https://api.telegram.org/bot${botToken}/sendMessage`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: chatId,
                      text: message,
                      parse_mode: 'HTML',
                    }),
                  }
                );
                const tgData = await tgRes.json();
                res.statusCode = 200;
                res.end(JSON.stringify({ success: !!tgData.ok, data: tgData }));
              } catch (err: any) {
                res.statusCode = 200;
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
