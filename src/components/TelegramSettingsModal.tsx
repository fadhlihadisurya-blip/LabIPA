import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle, Bot } from 'lucide-react';
import { useLab } from '../context/LabContext';

interface TelegramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramSettingsModal: React.FC<TelegramSettingsModalProps> = ({ isOpen, onClose }) => {
  const { telegramConfig, updateTelegramConfig, sendTelegramMessage } = useLab();

  const [botToken, setBotToken] = useState(telegramConfig.botToken);
  const [chatId, setChatId] = useState(telegramConfig.chatId);
  const [enabled, setEnabled] = useState(telegramConfig.enabled);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTelegramConfig({
      botToken: botToken.trim(),
      chatId: chatId.trim(),
      enabled,
    });
    onClose();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const tempConfig = { botToken: botToken.trim(), chatId: chatId.trim(), enabled: true };
    updateTelegramConfig(tempConfig);

    const success = await sendTelegramMessage(
      `🤖 <b>SIMLAB IPA TEST NOTIFICATION</b>\n\n` +
      `Koneksi Telegram Bot berhasil terhubung ke SIMLAB IPA!`
    );

    setTesting(false);
    if (success) {
      setTestResult({ success: true, message: 'Pesan tes berhasil dikirim ke Telegram!' });
    } else {
      setTestResult({ success: false, message: 'Gagal mengirim pesan. Periksa kembali Bot Token dan Chat ID Anda.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Konfigurasi Bot Telegram</h3>
              <p className="text-[11px] text-slate-500">Notifikasi otomatis ajuan lab ke Telegram</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="py-4 space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-xs text-slate-800 block">Aktifkan Notifikasi Telegram</span>
              <span className="text-[11px] text-slate-500">Kirim notifikasi saat ada ajuan baru masuk</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Telegram Bot Token *
            </label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="Contoh: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Dapatkan token dari @BotFather di Telegram.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Telegram Chat ID *
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Contoh: -1001234567890 atau ID personal"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              ID grup/channel atau chat ID Anda (gunakan @userinfobot untuk cek ID).
            </p>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              testResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={testing || !botToken.trim() || !chatId.trim()}
              onClick={handleTest}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> {testing ? 'Mengirim...' : 'Kirim Tes Pesan'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
              >
                Simpan Pengaturan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
