export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ success: false, error: 'Pesan tidak boleh kosong' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(500).json({
        success: false,
        error: 'Konfigurasi Telegram server belum disetel (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID missing di Vercel).',
      });
    }

    const sanitizedMessage = message.trim().slice(0, 4000);

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: sanitizedMessage,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API Error:', data);
      return res.status(502).json({
        success: false,
        error: 'Gagal mengirim pesan melalui Telegram API.',
      });
    }

    return res.status(200).json({ success: true, message: 'Notifikasi berhasil dikirim ke Telegram.' });
  } catch (error: any) {
    console.error('Server error in telegram endpoint:', error);
    return res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server.' });
  }
}
