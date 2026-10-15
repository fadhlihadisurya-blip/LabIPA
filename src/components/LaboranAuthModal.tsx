import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useLab } from '../context/LabContext';

export const LaboranAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginWithEmailPassword,
  } = useLab();

  const [email, setEmail] = useState('fadhlihadisurya@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Harap isi alamat email dan kata sandi.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginWithEmailPassword(email, password);
      if (result.success) {
        setIsAuthModalOpen(false);
      } else {
        setErrorMessage(result.error || 'Gagal masuk.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Login Laboran IPA
              </h4>
              <p className="text-[11px] text-slate-500">
                Akses penuh verifikasi inventaris & jadwal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">Perhatian:</p>
                <p className="text-[11px] text-red-700 leading-relaxed mt-0.5">
                  {errorMessage}
                </p>
              </div>
            </div>

            {/* Helper link for Firebase Console if Email/Password provider isn't enabled yet */}
            {errorMessage.includes('Email/Password') && (
              <div className="pt-2 border-t border-red-200/80 mt-2 space-y-2">
                <p className="text-[10px] text-slate-600">
                  Untuk mengaktifkannya di Firebase Console:
                </p>
                <a
                  href="https://console.firebase.google.com/project/labipa-101b7/authentication/providers"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 underline"
                >
                  Buka Console & Aktifkan Provider Email/Password <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Alamat Email Laboran
              </label>
              <button
                type="button"
                onClick={() => setEmail('fadhlihadisurya@gmail.com')}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
              >
                Gunakan fadhlihadisurya@gmail.com
              </button>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Minimal 6 karakter
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Memproses Autentikasi...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Masuk Sebagai Laboran</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
