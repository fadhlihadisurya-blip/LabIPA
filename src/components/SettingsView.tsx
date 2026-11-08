import React, { useState, useEffect } from 'react';
import {
  Settings,
  Lock,
  UserCheck,
  User,
  ShieldCheck,
  Building,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Sparkles,
  Send,
  Bell,
  BadgeCheck,
} from 'lucide-react';
import { useLab } from '../context/LabContext';

export const SettingsView: React.FC = () => {
  const {
    userMode,
    laboranUser,
    supervisorConfig,
    updateLaboranPassword,
    updateLaboranProfile,
    updateSupervisorConfig,
    telegramConfig,
    updateTelegramConfig,
    sendTelegramMessage,
    setIsAuthModalOpen,
  } = useLab();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'supervisor' | 'telegram'>('profile');

  // Helper to extract prefix and number
  const parseNipWithType = (rawNip: string, defaultType: 'NIP' | 'NIY' | 'NPY' = 'NIP') => {
    const match = (rawNip || '').trim().match(/^(NIP|NIY|NPY)[\.\s:]*(.*)$/i);
    if (match) {
      return {
        type: match[1].toUpperCase() as 'NIP' | 'NIY' | 'NPY',
        number: match[2].trim(),
      };
    }
    return {
      type: defaultType,
      number: (rawNip || '').trim(),
    };
  };

  const parseSupervisorNip = (rawNip: string, defaultType: 'NIP' | 'NIY' | 'NPK' = 'NIP') => {
    const match = (rawNip || '').trim().match(/^(NIP|NIY|NPK)[\.\s:]*(.*)$/i);
    if (match) {
      return {
        type: match[1].toUpperCase() as 'NIP' | 'NIY' | 'NPK',
        number: match[2].trim(),
      };
    }
    return {
      type: defaultType,
      number: (rawNip || '').trim(),
    };
  };

  // --- 1. Laboran Profile State (Nama & NIP/NIY) ---
  const [userName, setUserName] = useState(laboranUser.name || '');
  const initialLaboran = parseNipWithType(laboranUser.nip || '', laboranUser.nipType || 'NIP');
  const [laboranNipType, setLaboranNipType] = useState<'NIP' | 'NIY' | 'NPY'>(
    laboranUser.nipType || initialLaboran.type
  );
  const [laboranNipNumber, setLaboranNipNumber] = useState(initialLaboran.number);
  const [userRole, setUserRole] = useState(laboranUser.role || 'Kepala Laboran IPA SMAIT As-Syifa');
  const [userEmail, setUserEmail] = useState(laboranUser.email || '');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Sync laboran state if laboranUser changes in context
  useEffect(() => {
    setUserName(laboranUser.name || '');
    const parsed = parseNipWithType(laboranUser.nip || '', laboranUser.nipType || 'NIP');
    setLaboranNipType(laboranUser.nipType || parsed.type);
    setLaboranNipNumber(parsed.number);
    setUserRole(laboranUser.role || 'Kepala Laboran IPA SMAIT As-Syifa');
    setUserEmail(laboranUser.email || '');
  }, [laboranUser]);

  // --- 2. Laboran Password State ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // --- 3 & 4. Supervisor State (Status Atasan, Nama Atasan & NIP/NIY) ---
  const [supervisorTitle, setSupervisorTitle] = useState(supervisorConfig.title || 'Kepala Laboratorium IPA');
  const [supervisorName, setSupervisorName] = useState(supervisorConfig.name || 'Dr. H. Ahmad Fauzi, M.Pd');
  const initialSupervisor = parseSupervisorNip(supervisorConfig.nip || '', supervisorConfig.nipType || 'NIP');
  const [supervisorNipType, setSupervisorNipType] = useState<'NIP' | 'NIY' | 'NPK'>(
    supervisorConfig.nipType || initialSupervisor.type
  );
  const [supervisorNipNumber, setSupervisorNipNumber] = useState(initialSupervisor.number);
  const [supervisorInstitution, setSupervisorInstitution] = useState(
    supervisorConfig.institution || 'SMAIT As-Syifa Boarding School Wanareja'
  );
  const [supervisorSuccess, setSupervisorSuccess] = useState<string | null>(null);
  const [supervisorLoading, setSupervisorLoading] = useState(false);

  // Sync supervisor state
  useEffect(() => {
    setSupervisorTitle(supervisorConfig.title || 'Kepala Laboratorium IPA');
    setSupervisorName(supervisorConfig.name || 'Dr. H. Ahmad Fauzi, M.Pd');
    const parsed = parseSupervisorNip(supervisorConfig.nip || '', supervisorConfig.nipType || 'NIP');
    setSupervisorNipType(supervisorConfig.nipType || parsed.type);
    setSupervisorNipNumber(parsed.number);
    setSupervisorInstitution(supervisorConfig.institution || 'SMAIT As-Syifa Boarding School Wanareja');
  }, [supervisorConfig]);

  // --- Telegram State ---
  const [botToken, setBotToken] = useState(telegramConfig.botToken || '');
  const [chatId, setChatId] = useState(telegramConfig.chatId || '');
  const [telegramEnabled, setTelegramEnabled] = useState(telegramConfig.enabled || false);
  const [telegramSuccess, setTelegramSuccess] = useState<string | null>(null);
  const [telegramTesting, setTelegramTesting] = useState(false);

  // Presets for supervisor title
  const TITLE_PRESETS = [
    'Kepala Laboratorium IPA',
    'Koordinator Laboratorium IPA',
    'Kepala Laboratorium Sekolah',
    'Wakil Kepala Sekolah Bidang Kurikulum',
  ];

  // Handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    if (!userName.trim()) {
      alert('Nama lengkap pengguna laboran tidak boleh kosong.');
      return;
    }
    setProfileLoading(true);
    try {
      await updateLaboranProfile({
        name: userName.trim(),
        nipType: laboranNipType,
        nip: laboranNipNumber.trim(),
        role: userRole.trim(),
        email: userEmail.trim(),
      });
      setProfileSuccess('Nama user dan NIP/NIY laboran berhasil disimpan dan diperbarui.');
      setTimeout(() => setProfileSuccess(null), 4000);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('Password baru minimal terdiri dari 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await updateLaboranPassword(newPassword);
      if (res.success) {
        setPasswordSuccess('Password akun laboran berhasil diperbarui.');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 5000);
      } else {
        setPasswordError(res.error || 'Gagal memperbarui password.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupervisorSuccess(null);
    if (!supervisorTitle.trim() || !supervisorName.trim()) {
      alert('Status jabatan atasan dan nama atasan tidak boleh kosong.');
      return;
    }

    setSupervisorLoading(true);
    try {
      await updateSupervisorConfig({
        title: supervisorTitle.trim(),
        name: supervisorName.trim(),
        nipType: supervisorNipType,
        nip: supervisorNipNumber.trim(),
        institution: supervisorInstitution.trim(),
      });
      setSupervisorSuccess('Status, nama, dan NIP/NIY atasan berhasil disimpan. Dokumen laporan dan SOP akan otomatis diperbarui.');
      setTimeout(() => setSupervisorSuccess(null), 4000);
    } finally {
      setSupervisorLoading(false);
    }
  };

  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    updateTelegramConfig({
      botToken: botToken.trim(),
      chatId: chatId.trim(),
      enabled: telegramEnabled,
    });
    setTelegramSuccess('Konfigurasi bot notifikasi Telegram berhasil disimpan.');
    setTimeout(() => setTelegramSuccess(null), 4000);
  };

  const handleTestTelegram = async () => {
    setTelegramTesting(true);
    try {
      const ok = await sendTelegramMessage('🧪 <b>Tes Notifikasi SIMLAB IPA</b>\nKoneksi bot Telegram Laboratorium IPA berhasil terhubung!');
      if (ok) {
        alert('Notifikasi Telegram berhasil dikirim ke grup/chat ID Anda!');
      } else {
        alert('Gagal mengirim pesan Telegram. Pastikan Bot Token dan Chat ID valid.');
      }
    } finally {
      setTelegramTesting(false);
    }
  };

  if (userMode !== 'laboran') {
    return (
      <div className="p-6 md:p-12 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto ring-4 ring-amber-100">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Akses Terbatas Khusus Laboran</h3>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Halaman <b>Setting</b> memuat konfigurasi kredensial laboran, pengesahan dokumen, dan pejabat atasan laboratorium. Silakan masuk sebagai Laboran untuk mengelola pengaturan ini.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" /> Masuk Sebagai Laboran
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-800/60 text-blue-200 text-xs font-medium border border-blue-400/30">
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Pengaturan Kredensial & Pengesahan Dokumen</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Pengaturan Sistem (Setting)
          </h2>
          <p className="text-xs text-blue-200/90 max-w-2xl">
            Kelola kata sandi akun laboran, identitas user & NIP/NIY, serta status jabatan dan NIP atasan Kepala Laboratorium IPA untuk pengesahan cetak laporan.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/15 text-xs text-blue-100 shrink-0">
          <BadgeCheck className="w-4 h-4 text-emerald-400" />
          <span>Login sebagai: <b>{laboranUser.name || 'Laboran'}</b></span>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. Nama User & NIP/NIY Laboran</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'password'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>2. Ubah Password Laboran</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('supervisor')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'supervisor'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>3. Status Atasan & NIP Kepala Lab</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('telegram')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'telegram'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>4. Notifikasi Telegram</span>
        </button>
      </div>

      {/* Tab 1: Nama User & NIP/NIY Laboran */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Identitas User Laboran & NIP/NIY
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nama dan NIP/NIY ini akan dicantumkan secara resmi pada lembar pengesahan tanda tangan laporan dan dokumen laboratorium.
              </p>
            </div>

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap User Laboran *
                </label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Contoh: Fadhli Hadi Surya, S.Si"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIP / NIY / NPY Laboran *
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-28 sm:w-32 shrink-0">
                    <select
                      value={laboranNipType}
                      onChange={(e) => setLaboranNipType(e.target.value as 'NIP' | 'NIY' | 'NPY')}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-2xs"
                    >
                      <option value="NIP">NIP</option>
                      <option value="NIY">NIY</option>
                      <option value="NPY">NPY</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      value={laboranNipNumber}
                      onChange={(e) => setLaboranNipNumber(e.target.value)}
                      placeholder={
                        laboranNipType === 'NIP'
                          ? '19890412 201402 1 003'
                          : laboranNipType === 'NIY'
                          ? 'Contoh: 20180901'
                          : 'Contoh: 10293847'
                      }
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-slate-900 shadow-2xs"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pilih jenis nomor identitas pada dropdown (NIP / NIY / NPY) bersebelahan dengan nomornya.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Peran / Jabatan Laboran *
                </label>
                <input
                  type="text"
                  required
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  placeholder="Contoh: Laboran IPA Penanggung Jawab"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Email Akun
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="email@sekolah.sch.id"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-slate-50"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{profileLoading ? 'Menyimpan...' : 'Simpan Nama & NIP/NIY Laboran'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-blue-50/50 p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Pratinjau Tanda Tangan Laboran (Di Laporan PDF)
            </h4>
            <div className="p-4 bg-white rounded-xl border border-slate-300 shadow-xs space-y-2 text-right font-sans">
              <p className="text-[11px] text-slate-500">Wanareja, 07-11-2026</p>
              <p className="text-xs font-bold text-slate-900">{userRole || 'Laboran IPA Penanggung Jawab'},</p>
              <p className="text-[11px] text-slate-500">Unit Laboratorium SMAIT As-Syifa</p>
              <div className="h-14 flex items-end justify-end">
                <div className="w-36 border-b border-slate-400" />
              </div>
              <p className="text-xs font-extrabold text-slate-950 mt-1">{userName || 'Nama Laboran'}</p>
              <p className="text-[11px] font-mono text-slate-600">
                {laboranNipNumber.trim() ? `${laboranNipType}. ${laboranNipNumber.trim()}` : `${laboranNipType}. -`}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Teks di atas adalah format tanda tangan yang otomatis dicetak pada sudut kanan bawah lembar laporan PDF resmi.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Ubah Password Laboran */}
      {activeTab === 'password' && (
        <div className="max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              Ubah Kata Sandi (Password) Akun Laboran
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gunakan kata sandi yang aman (minimal 6 karakter) untuk melindungi akses ke mode Laboran SIMLAB IPA.
            </p>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Sandi Baru * (Minimal 6 karakter)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru..."
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Konfirmasi Kata Sandi Baru *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru..."
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Petunjuk Keamanan:</p>
              <ul className="list-disc pl-4 text-[11px] text-slate-500 space-y-0.5">
                <li>Gunakan kombinasi huruf besar, huruf kecil, dan angka.</li>
                <li>Kata sandi ini akan digunakan setiap kali membuka mode Laboran di aplikasi SIMLAB.</li>
              </ul>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>{passwordLoading ? 'Memperbarui...' : 'Simpan Kata Sandi Baru'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Status Atasan ("Kepala Laboratorium IPA") & Nama Atasan & NIP/NIY */}
      {activeTab === 'supervisor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Status Atasan & Nama / NIP Kepala Laboratorium
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ubah status jabatan atasan (misal "Kepala Laboratorium IPA") beserta nama dan NIP/NIY yang bertindak sebagai pihak yang mengesahkan (mengetahui) laporan.
              </p>
            </div>

            {supervisorSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{supervisorSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveSupervisor} className="space-y-4">
              {/* Status Atasan / Jabatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status / Jabatan Atasan *
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={supervisorTitle}
                    onChange={(e) => setSupervisorTitle(e.target.value)}
                    placeholder="Contoh: Kepala Laboratorium IPA"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-900"
                  />
                  {/* Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-400">Pilihan Cepat:</span>
                    {TITLE_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSupervisorTitle(p)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          supervisorTitle === p
                            ? 'bg-blue-50 text-blue-800 border-blue-300 font-semibold shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nama Atasan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Atasan beserta Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  placeholder="Contoh: Dr. H. Ahmad Fauzi, M.Pd"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-900"
                />
              </div>

              {/* NIP / NIY Atasan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIP / NIY / NPK Atasan *
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-28 sm:w-32 shrink-0">
                    <select
                      value={supervisorNipType}
                      onChange={(e) => setSupervisorNipType(e.target.value as 'NIP' | 'NIY' | 'NPK')}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-2xs"
                    >
                      <option value="NIP">NIP</option>
                      <option value="NIY">NIY</option>
                      <option value="NPK">NPK</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      value={supervisorNipNumber}
                      onChange={(e) => setSupervisorNipNumber(e.target.value)}
                      placeholder={
                        supervisorNipType === 'NIP'
                          ? '19820415 200801 1 007'
                          : supervisorNipType === 'NIY'
                          ? 'Contoh: 20120101'
                          : 'Contoh: 98765432'
                      }
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-slate-900 shadow-2xs"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pilih jenis nomor identitas atasan (NIP / NIY / NPK) bersebelahan dengan nomornya.
                </p>
              </div>

              {/* Satuan Instansi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Satuan Sekolah / Instansi
                </label>
                <input
                  type="text"
                  value={supervisorInstitution}
                  onChange={(e) => setSupervisorInstitution(e.target.value)}
                  placeholder="Contoh: SMAIT As-Syifa Boarding School Wanareja"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={supervisorLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{supervisorLoading ? 'Menyimpan...' : 'Simpan Data Atasan'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Card for Supervisor Signature */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-blue-50/50 p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Pratinjau Tanda Tangan Atasan (Di Laporan PDF)
            </h4>
            <div className="p-4 bg-white rounded-xl border border-slate-300 shadow-xs space-y-2 text-left font-sans">
              <p className="text-[11px] text-slate-500">Mengetahui,</p>
              <p className="text-xs font-bold text-slate-900">{supervisorTitle || 'Kepala Laboratorium IPA'}</p>
              <p className="text-[11px] text-slate-500">{supervisorInstitution || 'SMAIT As-Syifa Boarding School Wanareja'}</p>
              <div className="h-14 flex items-end">
                <div className="w-36 border-b border-slate-400" />
              </div>
              <p className="text-xs font-extrabold text-slate-950 mt-1">{supervisorName || 'Nama Atasan'}</p>
              <p className="text-[11px] font-mono text-slate-600">
                {supervisorNipNumber.trim() ? `${supervisorNipType}. ${supervisorNipNumber.trim()}` : `${supervisorNipType}. -`}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Teks di atas akan dicetak pada sudut kiri bawah lembar laporan PDF resmi dan SOP sebagai pihak pengesah/penanggung jawab.
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Telegram Notifications */}
      {activeTab === 'telegram' && (
        <div className="max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Integrasi Notifikasi Bot Telegram
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Terima notifikasi otomatis ke grup atau chat Telegram laboran saat ada ajuan kunjungan, ajuan alat, atau permohonan bahan praktikum baru.
            </p>
          </div>

          {telegramSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{telegramSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveTelegram} className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-900">Aktifkan Notifikasi Telegram</p>
                <p className="text-[11px] text-slate-500">Kirim pemberitahuan setiap ada ajuan masuk dari guru atau murid</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={telegramEnabled}
                  onChange={(e) => setTelegramEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bot Token Telegram
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="Contoh: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chat ID Telegram (Grup atau Pribadi)
              </label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="Contoh: -100123456789 atau 987654321"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Telegram</span>
              </button>

              {botToken && chatId && (
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={telegramTesting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  <span>{telegramTesting ? 'Mengirim...' : 'Uji Kirim Pesan'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
