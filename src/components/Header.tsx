import React, { useState } from 'react';
import { Menu, ShieldCheck, User, Bot } from 'lucide-react';
import { useLab } from '../context/LabContext';
import schoolLogo from '../assets/images/school_logo.jpg';
import { TelegramSettingsModal } from './TelegramSettingsModal';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { activeSection, userMode, toggleUserMode } = useLab();
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dashboard':
        return 'Dashboard';
      case 'ajuan-kunjungan':
        return 'Ajuan Kunjungan Lab';
      case 'bahan-kimia':
        return 'Bahan Kimia';
      case 'ajuan-bahan':
        return 'Ajuan Bahan Praktikum';
      case 'alat-lab':
        return 'Alat Laboratorium';
      case 'ajuan-alat':
        return 'Ajuan Alat';
      case 'sop':
        return 'SOP & Panduan';
      case 'msds':
        return 'Database MSDS';
      case 'database-guru-murid':
        return 'Database Guru & Murid';
      default:
        return 'Laboratorium IPA';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-600 rounded-lg hover:bg-slate-100 md:hidden focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img
          src={schoolLogo}
          alt="Logo Laboratorium"
          className="w-8 h-8 rounded-full object-cover md:hidden ring-1 ring-slate-200"
        />
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          {getSectionTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Telegram Bot Settings Button */}
        <button
          type="button"
          onClick={() => setIsTelegramModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer shadow-2xs"
          title="Konfigurasi Bot Telegram Notifikasi"
        >
          <Bot className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline font-semibold">Bot Telegram</span>
        </button>

        {/* Portal Umum / Mode Laboran Pill Button - Matching image.png */}
        <button
          type="button"
          onClick={toggleUserMode}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shadow-2xs border ${
            userMode === 'portal-umum'
              ? 'bg-slate-100/90 text-slate-700 border-slate-200 hover:bg-slate-200/80'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
          }`}
          title="Klik untuk beralih mode akses"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              userMode === 'portal-umum' ? 'bg-slate-400' : 'bg-emerald-500'
            }`}
          />
          <span className="font-semibold">
            {userMode === 'portal-umum' ? 'Portal Umum' : 'Mode Laboran'}
          </span>
          {userMode === 'laboran' ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
          ) : (
            <User className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          )}
        </button>
      </div>

      <TelegramSettingsModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
      />
    </header>
  );
};
