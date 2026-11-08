import React, { useState, useMemo, useRef } from 'react';
import {
  Printer,
  Calendar,
  FileText,
  FilePlus2,
  FlaskConical,
  Wrench,
  BookMarked,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Filter,
  Eye,
  Building,
  ShieldCheck,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { formatDate, getTodayDDMMYYYY, getDateParts } from '../utils/dateUtils';
import kopLaporanImg from '../assets/images/kop_laporan.png';

export type ReportType =
  | 'laporan-kunjungan-semester'
  | 'laporan-kunjungan-setahun'
  | 'laporan-stok-bahan-terkini'
  | 'laporan-ajuan-bahan-semester'
  | 'laporan-ajuan-bahan-setahun'
  | 'laporan-alat-terkini'
  | 'laporan-ajuan-alat-semester'
  | 'laporan-ajuan-alat-setahun';

export const PrintLaporanView: React.FC = () => {
  const {
    userMode,
    laboranUser,
    supervisorConfig,
    setIsAuthModalOpen,
    visits,
    chemicals,
    chemicalRequests,
    equipment,
    borrows,
  } = useLab();

  // Active Report Type
  const [selectedReport, setSelectedReport] = useState<ReportType>('laporan-kunjungan-semester');

  // Filter States
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedSemester, setSelectedSemester] = useState<'ganjil' | 'genap'>('ganjil');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const reportRef = useRef<HTMLDivElement>(null);

  // Available Years extracted from data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([currentYear - 2, currentYear - 1, currentYear, currentYear + 1]);
    
    visits.forEach((v) => {
      const p = getDateParts(v.visitDate) || getDateParts(v.createdAt);
      if (p?.year) yearsSet.add(p.year);
    });
    borrows.forEach((b) => {
      const p = getDateParts(b.borrowDate);
      if (p?.year) yearsSet.add(p.year);
    });
    chemicalRequests.forEach((r) => {
      const p = getDateParts(r.dateNeeded) || getDateParts(r.createdAt);
      if (p?.year) yearsSet.add(p.year);
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [visits, borrows, chemicalRequests, currentYear]);

  // Check if date belongs to selected semester and year
  const isMatchSemester = (dateStr?: string | null) => {
    const parts = getDateParts(dateStr);
    if (!parts) return false;
    if (parts.year !== selectedYear) return false;
    if (selectedSemester === 'ganjil') {
      return parts.month >= 7 && parts.month <= 12;
    } else {
      return parts.month >= 1 && parts.month <= 6;
    }
  };

  // Check if date belongs to selected year
  const isMatchYear = (dateStr?: string | null) => {
    const parts = getDateParts(dateStr);
    if (!parts) return false;
    return parts.year === selectedYear;
  };

  // 1. Data Kunjungan Semester
  const visitsSemester = useMemo(() => {
    return visits.filter((v) => isMatchSemester(v.visitDate) || isMatchSemester(v.createdAt));
  }, [visits, selectedYear, selectedSemester]);

  // 2. Data Kunjungan Setahun
  const visitsYear = useMemo(() => {
    return visits.filter((v) => isMatchYear(v.visitDate) || isMatchYear(v.createdAt));
  }, [visits, selectedYear]);

  // 3. Data Stok Bahan Kimia Terkini
  const chemicalsCurrent = useMemo(() => {
    return chemicals.filter((c) => {
      if (categoryFilter === 'all') return true;
      if (categoryFilter === 'low-stock') return c.stock <= c.minStock;
      if (categoryFilter === 'safe-stock') return c.stock > c.minStock;
      return c.category === categoryFilter;
    });
  }, [chemicals, categoryFilter]);

  // 4. Data Ajuan Bahan Semester
  const chemRequestsSemester = useMemo(() => {
    return chemicalRequests.filter((r) => isMatchSemester(r.dateNeeded) || isMatchSemester(r.createdAt));
  }, [chemicalRequests, selectedYear, selectedSemester]);

  // 5. Data Ajuan Bahan Setahun
  const chemRequestsYear = useMemo(() => {
    return chemicalRequests.filter((r) => isMatchYear(r.dateNeeded) || isMatchYear(r.createdAt));
  }, [chemicalRequests, selectedYear]);

  // 6. Data Alat Laboratorium Terkini
  const equipmentCurrent = useMemo(() => {
    return equipment.filter((eq) => {
      if (categoryFilter === 'all') return true;
      if (categoryFilter === 'has-damaged') return eq.damagedCount > 0;
      if (categoryFilter === 'borrowed') return eq.borrowedCount > 0;
      return eq.category === categoryFilter;
    });
  }, [equipment, categoryFilter]);

  // 7. Data Ajuan Alat Semester
  const borrowsSemester = useMemo(() => {
    return borrows.filter((b) => isMatchSemester(b.borrowDate));
  }, [borrows, selectedYear, selectedSemester]);

  // 8. Data Ajuan Alat Setahun
  const borrowsYear = useMemo(() => {
    return borrows.filter((b) => isMatchYear(b.borrowDate));
  }, [borrows, selectedYear]);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Report configurations metadata
  const REPORT_OPTIONS: {
    id: ReportType;
    title: string;
    description: string;
    category: 'Kunjungan' | 'Bahan Kimia' | 'Alat Lab';
    hasSemesterFilter: boolean;
    hasYearFilter: boolean;
    hasCustomFilter: boolean;
    icon: React.ElementType;
    badgeCount: number;
  }[] = [
    {
      id: 'laporan-kunjungan-semester',
      title: '1. Laporan Kunjungan (Semester Ganjil/Genap)',
      description: 'Rekapitulasi jadwal praktikum per semester (Ganjil: Juli-Des / Genap: Jan-Jun).',
      category: 'Kunjungan',
      hasSemesterFilter: true,
      hasYearFilter: true,
      hasCustomFilter: false,
      icon: BookMarked,
      badgeCount: visitsSemester.length,
    },
    {
      id: 'laporan-kunjungan-setahun',
      title: '2. Laporan Kunjungan (Setahun Penuh)',
      description: 'Laporan tahunan pelaksanaan praktikum dan kunjungan siswa seluruh lab.',
      category: 'Kunjungan',
      hasSemesterFilter: false,
      hasYearFilter: true,
      hasCustomFilter: false,
      icon: Calendar,
      badgeCount: visitsYear.length,
    },
    {
      id: 'laporan-stok-bahan-terkini',
      title: '3. Laporan Stok Bahan Kimia Terkini',
      description: 'Inventarisasi realtime bahan habis pakai, reagen, batas minimum, dan kadaluarsa.',
      category: 'Bahan Kimia',
      hasSemesterFilter: false,
      hasYearFilter: false,
      hasCustomFilter: true,
      icon: FlaskConical,
      badgeCount: chemicalsCurrent.length,
    },
    {
      id: 'laporan-ajuan-bahan-semester',
      title: '4. Laporan Ajuan Bahan Praktikum (Semester)',
      description: 'Daftar permohonan zat kimia per semester ganjil/genap beserta status laboran.',
      category: 'Bahan Kimia',
      hasSemesterFilter: true,
      hasYearFilter: true,
      hasCustomFilter: false,
      icon: FilePlus2,
      badgeCount: chemRequestsSemester.length,
    },
    {
      id: 'laporan-ajuan-bahan-setahun',
      title: '5. Laporan Ajuan Bahan Praktikum (Setahun)',
      description: 'Rekapitulasi tahunan permintaan bahan praktikum oleh guru dan siswa.',
      category: 'Bahan Kimia',
      hasSemesterFilter: false,
      hasYearFilter: true,
      hasCustomFilter: false,
      icon: Layers,
      badgeCount: chemRequestsYear.length,
    },
    {
      id: 'laporan-alat-terkini',
      title: '6. Laporan Alat Laboratorium Terkini',
      description: 'Status aset fisik alat, unit kondisi baik, rusak, pecah, dan lokasi lemari rak.',
      category: 'Alat Lab',
      hasSemesterFilter: false,
      hasYearFilter: false,
      hasCustomFilter: true,
      icon: Wrench,
      badgeCount: equipmentCurrent.length,
    },
    {
      id: 'laporan-ajuan-alat-semester',
      title: '7. Laporan Ajuan Alat (Semester Ganjil/Genap)',
      description: 'Catatan peminjaman alat lab per semester, kondisi kembali, dan denda rusak/pecah.',
      category: 'Alat Lab',
      hasSemesterFilter: true,
      hasYearFilter: true,
      hasCustomFilter: false,
      icon: FileCheck2,
      badgeCount: borrowsSemester.length,
    },
    {
      id: 'laporan-ajuan-alat-setahun',
      title: '8. Laporan Ajuan Alat (Setahun Penuh)',
      description: 'Rekapitulasi tahunan sirkulasi alat dan instrumen yang dipinjam civitas sekolah.',
      category: 'Alat Lab',
      hasSemesterFilter: false,
      hasYearFilter: true,
      hasCustomFilter: false,
      icon: FileText,
      badgeCount: borrowsYear.length,
    },
  ];

  const activeMeta = REPORT_OPTIONS.find((r) => r.id === selectedReport) || REPORT_OPTIONS[0];

  // Helper title & subtitle for the formal document
  const getDocHeaderInfo = () => {
    const todayFormatted = formatDate(getTodayDDMMYYYY());
    switch (selectedReport) {
      case 'laporan-kunjungan-semester':
        return {
          title: 'LAPORAN REKAPITULASI KUNJUNGAN & PRAKTIKUM LABORATORIUM IPA',
          subtitle: `SEMESTER ${selectedSemester.toUpperCase()} TAHUN AJARAN ${
            selectedSemester === 'ganjil' ? `${selectedYear}/${selectedYear + 1}` : `${selectedYear - 1}/${selectedYear}`
          } (TAHUN KALENDER ${selectedYear})`,
          docCode: `01/LAP-KUNJ-SMT/LAB-IPA/${selectedYear}`,
        };
      case 'laporan-kunjungan-setahun':
        return {
          title: 'LAPORAN TAHUNAN KUNJUNGAN & PRAKTIKUM LABORATORIUM IPA',
          subtitle: `PERIODE 1 TAHUN PENUH (JANUARI - DESEMBER ${selectedYear})`,
          docCode: `02/LAP-KUNJ-THN/LAB-IPA/${selectedYear}`,
        };
      case 'laporan-stok-bahan-terkini':
        return {
          title: 'LAPORAN STATUS INVENTARISASI & STOK BAHAN KIMIA HABIS PAKAI',
          subtitle: `DATA TERKINI REALTIME LABORATORIUM IPA (PER TANGGAL ${todayFormatted})`,
          docCode: `03/LAP-STOK-BHM/LAB-IPA/${selectedYear}`,
        };
      case 'laporan-ajuan-bahan-semester':
        return {
          title: 'LAPORAN PENGAJUAN & PENGELUARAN BAHAN KIMIA PRAKTIKUM',
          subtitle: `SEMESTER ${selectedSemester.toUpperCase()} TAHUN AJARAN ${
            selectedSemester === 'ganjil' ? `${selectedYear}/${selectedYear + 1}` : `${selectedYear - 1}/${selectedYear}`
          } (TAHUN KALENDER ${selectedYear})`,
          docCode: `04/LAP-AJUAN-BHM-SMT/LAB-IPA/${selectedYear}`,
        };
      case 'laporan-ajuan-bahan-setahun':
        return {
          title: 'LAPORAN TAHUNAN PENGAJUAN & PENGELUARAN BAHAN KIMIA PRAKTIKUM',
          subtitle: `PERIODE 1 TAHUN PENUH (JANUARI - DESEMBER ${selectedYear})`,
          docCode: `05/LAP-AJUAN-BHM-THN/LAB-IPA/${selectedYear}`,
        };
      case 'laporan-alat-terkini':
        return {
          title: 'LAPORAN INVENTARISASI & KONDISI FISIK ALAT LABORATORIUM IPA',
          subtitle: `DATA TERKINI REALTIME LABORATORIUM IPA (PER TANGGAL ${todayFormatted})`,
          docCode: `06/LAP-ASET-ALAT/LAB-IPA/${selectedYear}`,
        };
      case 'laporan-ajuan-alat-semester':
        return {
          title: 'LAPORAN PEMINJAMAN & PENGEMBALIAN ALAT LABORATORIUM',
          subtitle: `SEMESTER ${selectedSemester.toUpperCase()} TAHUN AJARAN ${
            selectedSemester === 'ganjil' ? `${selectedYear}/${selectedYear + 1}` : `${selectedYear - 1}/${selectedYear}`
          } (TAHUN KALENDER ${selectedYear})`,
          docCode: `07/LAP-PINJAM-ALAT-SMT/LAB-IPA/${selectedYear}`,
        };
      case 'laporan-ajuan-alat-setahun':
        return {
          title: 'LAPORAN TAHUNAN PEMINJAMAN & PENGEMBALIAN ALAT LABORATORIUM',
          subtitle: `PERIODE 1 TAHUN PENUH (JANUARI - DESEMBER ${selectedYear})`,
          docCode: `08/LAP-PINJAM-ALAT-THN/LAB-IPA/${selectedYear}`,
        };
    }
  };

  const docHeader = getDocHeaderInfo();

  // If user is not laboran, restrict access
  if (userMode !== 'laboran') {
    return (
      <div className="p-6 md:p-12 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto ring-4 ring-amber-100">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Akses Terbatas Khusus Laboran</h3>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Menu <b>Print Laporan</b> memuat dokumen resmi, inventarisasi aset, dan rekapitulasi nilai laboratorium.
            Silakan masuk sebagai Laboran untuk mengakses dan mencetak dokumen PDF resmi.
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
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Printable CSS Media rules: only #printable-report is printed */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          /* Hide everything except the report sheet */
          aside, header, footer, .no-print, nav {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          #printable-report {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm 15mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          .signature-block {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Top Banner & Title (Hidden in Print) */}
      <div className="no-print bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-700/60 text-blue-200 text-xs font-medium border border-blue-400/30">
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Pusat Cetak & Unduh Dokumen Resmi PDF</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Print Laporan Laboratorium IPA
          </h2>
          <p className="text-xs text-blue-200/90 max-w-2xl">
            Pilih jenis laporan periodik kunjungan, ajuan, dan inventaris di bawah ini. Anda dapat mencetak langsung atau menyimpannya sebagai file PDF resmi ber-kop surat SMAIT As-Syifa.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-slate-900" />
          <span>Cetak / Simpan PDF</span>
        </button>
      </div>

      {/* Report Selection Grid (8 Types requested by user) */}
      <div className="no-print space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Pilihan Jenis Laporan Dokumen (8 Laporan Resmi):
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {activeMeta.title}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {REPORT_OPTIONS.map((opt) => {
            const isSelected = selectedReport === opt.id;
            const IconComponent = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSelectedReport(opt.id);
                  setCategoryFilter('all');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200/90 hover:bg-slate-50/80 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                        opt.category === 'Kunjungan'
                          ? 'bg-blue-100 text-blue-800'
                          : opt.category === 'Bahan Kimia'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {opt.category}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {opt.badgeCount} data
                    </span>
                  </div>

                  <p className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                    {opt.title}
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {opt.description}
                  </p>
                </div>

                <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className={`font-semibold flex items-center gap-1 ${isSelected ? 'text-blue-700' : 'text-slate-500'}`}>
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{isSelected ? 'Sedang Dipilih' : 'Klik untuk Pilih'}</span>
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar for Selected Report (Hidden in Print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600" /> Filter Laporan:
          </span>

          {/* Semester Selector if applicable */}
          {activeMeta.hasSemesterFilter && (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 pl-2">Semester:</span>
              <button
                type="button"
                onClick={() => setSelectedSemester('ganjil')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  selectedSemester === 'ganjil'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ganjil (Juli - Des)
              </button>
              <button
                type="button"
                onClick={() => setSelectedSemester('genap')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  selectedSemester === 'genap'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Genap (Jan - Jun)
              </button>
            </div>
          )}

          {/* Year Selector if applicable */}
          {activeMeta.hasYearFilter && (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 pl-2">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white border border-slate-200 text-xs rounded-md px-2.5 py-1 font-mono font-semibold text-slate-800"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category Filter for Chemicals or Equipment */}
          {selectedReport === 'laporan-stok-bahan-terkini' && (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 pl-2">Kategori:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-slate-200 text-xs rounded-md px-2.5 py-1 font-semibold text-slate-800"
              >
                <option value="all">Semua Bahan Kimia</option>
                <option value="Biokim Putra">Lab Biokim Putra</option>
                <option value="Fisika Putri">Lab Fisika Putri</option>
                <option value="Biokim Putri">Lab Biokim Putri</option>
                <option value="low-stock">Hanya Stok Menipis (≤ Min)</option>
                <option value="safe-stock">Hanya Stok Aman</option>
              </select>
            </div>
          )}

          {selectedReport === 'laporan-alat-terkini' && (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 pl-2">Kategori Alat:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-slate-200 text-xs rounded-md px-2.5 py-1 font-semibold text-slate-800"
              >
                <option value="all">Semua Kategori Alat</option>
                <option value="Biokim Putra">Biokim Putra</option>
                <option value="Fisika Putri">Fisika Putri</option>
                <option value="Biokim Putri">Biokim Putri</option>
                <option value="Kimia">Kimia</option>
                <option value="Fisika">Fisika</option>
                <option value="Biologi">Biologi</option>
                <option value="has-damaged">Ada Rusak / Pecah</option>
                <option value="borrowed">Sedang Dipinjam</option>
              </select>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* Information Tip (Hidden in Print) */}
      <div className="no-print bg-blue-50/80 p-3 rounded-xl border border-blue-200 flex items-start gap-2.5 text-xs text-blue-900">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Tips Menyimpan Sebagai File PDF:</p>
          <p className="text-[11px] text-blue-800/90 mt-0.5">
            Saat Anda menekan tombol <b>Cetak / Unduh PDF</b> di atas, pilih tujuan <b>"Simpan sebagai PDF"</b> (atau <i>Save as PDF</i>) pada jendela cetak browser untuk mengunduh dokumen laporan dalam bentuk file PDF berformat A4 dengan tata letak resmi sekolah.
          </p>
        </div>
      </div>

      {/* Official Printable Report Document Sheet (A4 Paper Styling) */}
      <div
        id="printable-report"
        ref={reportRef}
        className="bg-white rounded-2xl border border-slate-300 shadow-md p-8 md:p-12 text-slate-900 max-w-[950px] mx-auto min-h-[1050px] font-sans"
      >
        {/* Kop Surat Resmi SMAIT As-Syifa (Banner Image Resmi) */}
        <div className="w-full flex justify-center items-center mb-6">
          <img
            src={kopLaporanImg}
            alt="Kop Surat Resmi SMAIT As-Syifa Boarding School Wanareja - Subang"
            className="w-full h-auto object-contain block max-h-[160px] md:max-h-[190px]"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== '/assets/aistudio/image_84425795.png') {
                target.src = '/assets/aistudio/image_84425795.png';
              }
            }}
          />
        </div>

        {/* Document Title & Period Metadata */}
        <div className="text-center mb-6 space-y-1">
          <h2 className="text-sm md:text-base font-extrabold uppercase text-slate-900 tracking-tight underline decoration-slate-900 underline-offset-4">
            {docHeader.title}
          </h2>
          <p className="text-xs font-semibold text-slate-700">
            {docHeader.subtitle}
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1 font-mono">
            <span>Nomor Dokumen: <b>{docHeader.docCode}</b></span>
            <span>·</span>
            <span>Tanggal Cetak: <b>{formatDate(getTodayDDMMYYYY())}</b></span>
            <span>·</span>
            <span>Laboran: <b>{laboranUser?.name || 'Laboran IPA'}</b></span>
          </div>
        </div>

        {/* Dynamic Report Content Tables */}
        {selectedReport === 'laporan-kunjungan-semester' || selectedReport === 'laporan-kunjungan-setahun' ? (
          /* TABLE: KUNJUNGAN LAB */
          (() => {
            const currentVisits = selectedReport === 'laporan-kunjungan-semester' ? visitsSemester : visitsYear;
            return (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-700 text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-700 text-left">
                        <th className="border border-slate-700 px-2.5 py-2 text-center w-8">No</th>
                        <th className="border border-slate-700 px-2.5 py-2 w-24">Tanggal</th>
                        <th className="border border-slate-700 px-2.5 py-2 w-20">Sesi/Jam</th>
                        <th className="border border-slate-700 px-2.5 py-2">Guru / Pemohon</th>
                        <th className="border border-slate-700 px-2.5 py-2 w-20">Kelas</th>
                        <th className="border border-slate-700 px-2.5 py-2">Lab yang Digunakan</th>
                        <th className="border border-slate-700 px-2.5 py-2">Judul Praktikum</th>
                        <th className="border border-slate-700 px-2.5 py-2 text-center w-24">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentVisits.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="border border-slate-700 py-6 text-center text-slate-500 italic">
                            Tidak ada catatan kunjungan atau praktikum pada periode ini.
                          </td>
                        </tr>
                      ) : (
                        currentVisits.map((v, idx) => (
                          <tr key={v.id} className="border-b border-slate-700">
                            <td className="border border-slate-700 px-2 py-1.5 text-center font-mono font-medium">{idx + 1}</td>
                            <td className="border border-slate-700 px-2 py-1.5 font-mono whitespace-nowrap">{formatDate(v.visitDate)}</td>
                            <td className="border border-slate-700 px-2 py-1.5 font-mono text-[11px]">{v.sessionTime}</td>
                            <td className="border border-slate-700 px-2 py-1.5 font-semibold text-slate-900">{v.teacherName}</td>
                            <td className="border border-slate-700 px-2 py-1.5">{v.classGroup || '-'}</td>
                            <td className="border border-slate-700 px-2 py-1.5 text-blue-900 font-medium">{v.labType}</td>
                            <td className="border border-slate-700 px-2 py-1.5">{v.practicumTitle}</td>
                            <td className="border border-slate-700 px-2 py-1.5 text-center font-medium">
                              {v.status}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold border-t-2 border-slate-800 text-slate-900">
                        <td colSpan={3} className="border border-slate-700 px-2.5 py-2 text-center">
                          TOTAL KUNJUNGAN:
                        </td>
                        <td colSpan={5} className="border border-slate-700 px-2.5 py-2 font-mono">
                          {currentVisits.length} Kunjungan / Sesi Praktikum
                          {' · '}Disetujui: {currentVisits.filter((v) => v.status === 'Disetujui').length}
                          {' · '}Menunggu: {currentVisits.filter((v) => v.status === 'Menunggu Persetujuan').length}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })()
        ) : selectedReport === 'laporan-stok-bahan-terkini' ? (
          /* TABLE: STOK BAHAN KIMIA TERKINI */
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-700 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-700 text-left">
                    <th className="border border-slate-700 px-2.5 py-2 text-center w-8">No</th>
                    <th className="border border-slate-700 px-2.5 py-2 w-24">Kode</th>
                    <th className="border border-slate-700 px-2.5 py-2">Nama Bahan Kimia & Reagen</th>
                    <th className="border border-slate-700 px-2.5 py-2 w-24">Rumus</th>
                    <th className="border border-slate-700 px-2.5 py-2">Kategori Lab</th>
                    <th className="border border-slate-700 px-2.5 py-2 text-right w-20">Stok</th>
                    <th className="border border-slate-700 px-2.5 py-2 text-right w-16">Min</th>
                    <th className="border border-slate-700 px-2.5 py-2">Lokasi Lemari</th>
                    <th className="border border-slate-700 px-2.5 py-2 text-center w-24">Kadaluarsa</th>
                  </tr>
                </thead>
                <tbody>
                  {chemicalsCurrent.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="border border-slate-700 py-6 text-center text-slate-500 italic">
                        Tidak ada data bahan kimia yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    chemicalsCurrent.map((c, idx) => {
                      const isLowStock = c.stock <= c.minStock;
                      return (
                        <tr key={c.id} className="border-b border-slate-700">
                          <td className="border border-slate-700 px-2 py-1.5 text-center font-mono font-medium">{idx + 1}</td>
                          <td className="border border-slate-700 px-2 py-1.5 font-mono text-[11px] font-semibold">{c.code}</td>
                          <td className="border border-slate-700 px-2 py-1.5 font-bold text-slate-900">
                            {c.name}
                            {isLowStock && <span className="ml-1 text-[10px] text-red-700 font-mono">(Menipis)</span>}
                          </td>
                          <td className="border border-slate-700 px-2 py-1.5 font-mono text-[11px]">{c.formula || '-'}</td>
                          <td className="border border-slate-700 px-2 py-1.5 text-slate-700">{c.category || '-'}</td>
                          <td className="border border-slate-700 px-2 py-1.5 text-right font-mono font-bold text-slate-900">
                            {c.stock} {c.unit}
                          </td>
                          <td className="border border-slate-700 px-2 py-1.5 text-right font-mono text-slate-600">
                            {c.minStock} {c.unit}
                          </td>
                          <td className="border border-slate-700 px-2 py-1.5">{c.location}</td>
                          <td className="border border-slate-700 px-2 py-1.5 text-center font-mono whitespace-nowrap">
                            {formatDate(c.expiryDate)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-800 text-slate-900">
                    <td colSpan={3} className="border border-slate-700 px-2.5 py-2 text-center">
                      REKAPITULASI BAHAN:
                    </td>
                    <td colSpan={6} className="border border-slate-700 px-2.5 py-2 font-mono">
                      Total Item: {chemicalsCurrent.length} Bahan
                      {' · '}Stok Menipis: {chemicalsCurrent.filter((c) => c.stock <= c.minStock).length} Item
                      {' · '}Stok Aman: {chemicalsCurrent.filter((c) => c.stock > c.minStock).length} Item
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : selectedReport === 'laporan-ajuan-bahan-semester' || selectedReport === 'laporan-ajuan-bahan-setahun' ? (
          /* TABLE: AJUAN BAHAN PRAKTIKUM */
          (() => {
            const currentReqs = selectedReport === 'laporan-ajuan-bahan-semester' ? chemRequestsSemester : chemRequestsYear;
            return (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-700 text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-700 text-left">
                        <th className="border border-slate-700 px-2.5 py-2 text-center w-8">No</th>
                        <th className="border border-slate-700 px-2.5 py-2 w-24">Tgl Ajuan</th>
                        <th className="border border-slate-700 px-2.5 py-2 w-24">Tgl Butuh</th>
                        <th className="border border-slate-700 px-2.5 py-2">Pemohon (Guru/Murid)</th>
                        <th className="border border-slate-700 px-2.5 py-2">Judul Praktikum</th>
                        <th className="border border-slate-700 px-2.5 py-2">Bahan & Takaran Diminta</th>
                        <th className="border border-slate-700 px-2.5 py-2 text-center w-24">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentReqs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="border border-slate-700 py-6 text-center text-slate-500 italic">
                            Tidak ada pengajuan bahan kimia pada periode ini.
                          </td>
                        </tr>
                      ) : (
                        currentReqs.map((req, idx) => (
                          <tr key={req.id} className="border-b border-slate-700">
                            <td className="border border-slate-700 px-2 py-1.5 text-center font-mono font-medium">{idx + 1}</td>
                            <td className="border border-slate-700 px-2 py-1.5 font-mono whitespace-nowrap">{formatDate(req.createdAt)}</td>
                            <td className="border border-slate-700 px-2 py-1.5 font-mono whitespace-nowrap">{formatDate(req.dateNeeded)}</td>
                            <td className="border border-slate-700 px-2 py-1.5">
                              <span className="font-bold text-slate-900">{req.teacherName}</span>
                              <br />
                              <span className="text-[10px] text-slate-500">{req.requesterType} ({req.classGroup})</span>
                            </td>
                            <td className="border border-slate-700 px-2 py-1.5">{req.practicumTitle}</td>
                            <td className="border border-slate-700 px-2 py-1.5">
                              <ul className="list-disc pl-3 text-[11px] space-y-0.5">
                                {req.items.map((it, i) => (
                                  <li key={i}>
                                    {it.chemicalName}: <span className="font-mono font-bold">{it.requestedAmount} {it.unit}</span>
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td className="border border-slate-700 px-2 py-1.5 text-center font-medium">
                              {req.status}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold border-t-2 border-slate-800 text-slate-900">
                        <td colSpan={3} className="border border-slate-700 px-2.5 py-2 text-center">
                          TOTAL AJUAN:
                        </td>
                        <td colSpan={4} className="border border-slate-700 px-2.5 py-2 font-mono">
                          {currentReqs.length} Ajuan Bahan
                          {' · '}Disetujui: {currentReqs.filter((r) => r.status === 'Disetujui').length}
                          {' · '}Menunggu: {currentReqs.filter((r) => r.status === 'Menunggu Persetujuan').length}
                          {' · '}Ditolak: {currentReqs.filter((r) => r.status === 'Ditolak').length}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })()
        ) : selectedReport === 'laporan-alat-terkini' ? (
          /* TABLE: ALAT LABORATORIUM TERKINI */
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-700 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-700 text-left">
                    <th className="border border-slate-700 px-2.5 py-2 text-center w-8">No</th>
                    <th className="border border-slate-700 px-2.5 py-2 w-24">Kode Alat</th>
                    <th className="border border-slate-700 px-2.5 py-2">Nama Instrumen / Alat</th>
                    <th className="border border-slate-700 px-2.5 py-2">Kategori</th>
                    <th className="border border-slate-700 px-2.5 py-2">Lokasi</th>
                    <th className="border border-slate-700 px-2.5 py-2 text-right w-16">Total</th>
                    <th className="border border-slate-700 px-2.5 py-2 text-right w-16">Baik</th>
                    <th className="border border-slate-700 px-2.5 py-2 text-right w-16">Rusak</th>
                    <th className="border border-slate-700 px-2.5 py-2 text-right w-16">Pinjam</th>
                  </tr>
                </thead>
                <tbody>
                  {equipmentCurrent.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="border border-slate-700 py-6 text-center text-slate-500 italic">
                        Tidak ada data alat yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    equipmentCurrent.map((eq, idx) => (
                      <tr key={eq.id} className="border-b border-slate-700">
                        <td className="border border-slate-700 px-2 py-1.5 text-center font-mono font-medium">{idx + 1}</td>
                        <td className="border border-slate-700 px-2 py-1.5 font-mono text-[11px] font-semibold">{eq.code}</td>
                        <td className="border border-slate-700 px-2 py-1.5 font-bold text-slate-900">{eq.name}</td>
                        <td className="border border-slate-700 px-2 py-1.5">{eq.category}</td>
                        <td className="border border-slate-700 px-2 py-1.5">{eq.location}</td>
                        <td className="border border-slate-700 px-2 py-1.5 text-right font-mono font-bold">{eq.totalCount}</td>
                        <td className="border border-slate-700 px-2 py-1.5 text-right font-mono text-emerald-800 font-semibold">{eq.goodCount}</td>
                        <td className="border border-slate-700 px-2 py-1.5 text-right font-mono text-red-700 font-semibold">{eq.damagedCount}</td>
                        <td className="border border-slate-700 px-2 py-1.5 text-right font-mono text-amber-800">{eq.borrowedCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-800 text-slate-900">
                    <td colSpan={5} className="border border-slate-700 px-2.5 py-2 text-center">
                      TOTAL INVENTARIS ALAT:
                    </td>
                    <td className="border border-slate-700 px-2 py-2 text-right font-mono">
                      {equipmentCurrent.reduce((acc, e) => acc + e.totalCount, 0)}
                    </td>
                    <td className="border border-slate-700 px-2 py-2 text-right font-mono text-emerald-800">
                      {equipmentCurrent.reduce((acc, e) => acc + e.goodCount, 0)}
                    </td>
                    <td className="border border-slate-700 px-2 py-2 text-right font-mono text-red-700">
                      {equipmentCurrent.reduce((acc, e) => acc + e.damagedCount, 0)}
                    </td>
                    <td className="border border-slate-700 px-2 py-2 text-right font-mono text-amber-800">
                      {equipmentCurrent.reduce((acc, e) => acc + e.borrowedCount, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          /* TABLE: AJUAN / PEMINJAMAN ALAT */
          (() => {
            const currentBorrows = selectedReport === 'laporan-ajuan-alat-semester' ? borrowsSemester : borrowsYear;
            return (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-700 text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-700 text-left">
                        <th className="border border-slate-700 px-2.5 py-2 text-center w-8">No</th>
                        <th className="border border-slate-700 px-2.5 py-2 w-24">Tgl Pinjam</th>
                        <th className="border border-slate-700 px-2.5 py-2 w-24">Tenggat</th>
                        <th className="border border-slate-700 px-2.5 py-2">Peminjam</th>
                        <th className="border border-slate-700 px-2.5 py-2">Alat yang Dipinjam</th>
                        <th className="border border-slate-700 px-2.5 py-2">Tujuan / Keperluan</th>
                        <th className="border border-slate-700 px-2.5 py-2 text-center w-28">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBorrows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="border border-slate-700 py-6 text-center text-slate-500 italic">
                            Tidak ada sirkulasi peminjaman alat pada periode ini.
                          </td>
                        </tr>
                      ) : (
                        currentBorrows.map((b, idx) => (
                          <tr key={b.id} className="border-b border-slate-700">
                            <td className="border border-slate-700 px-2 py-1.5 text-center font-mono font-medium">{idx + 1}</td>
                            <td className="border border-slate-700 px-2 py-1.5 font-mono whitespace-nowrap">{formatDate(b.borrowDate)}</td>
                            <td className="border border-slate-700 px-2 py-1.5 font-mono whitespace-nowrap">{formatDate(b.returnDueDate)}</td>
                            <td className="border border-slate-700 px-2 py-1.5">
                              <span className="font-bold text-slate-900">{b.borrowerName}</span>
                              <br />
                              <span className="text-[10px] text-slate-500">{b.borrowerType} ({b.classOrDept})</span>
                            </td>
                            <td className="border border-slate-700 px-2 py-1.5">
                              {b.items && b.items.length > 0 ? (
                                <ul className="list-disc pl-3 text-[11px]">
                                  {b.items.map((it, i) => (
                                    <li key={i}>
                                      {it.equipmentName} (<span className="font-mono font-bold">{it.quantity}</span> unit)
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span>{b.equipmentName} ({b.quantity} unit)</span>
                              )}
                            </td>
                            <td className="border border-slate-700 px-2 py-1.5">{b.purpose}</td>
                            <td className="border border-slate-700 px-2 py-1.5 text-center font-medium">
                              {b.status}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold border-t-2 border-slate-800 text-slate-900">
                        <td colSpan={3} className="border border-slate-700 px-2.5 py-2 text-center">
                          TOTAL PEMINJAMAN:
                        </td>
                        <td colSpan={4} className="border border-slate-700 px-2.5 py-2 font-mono">
                          {currentBorrows.length} Transaksi Peminjaman
                          {' · '}Dipinjam: {currentBorrows.filter((b) => b.status === 'Dipinjam').length}
                          {' · '}Kembali Baik: {currentBorrows.filter((b) => b.status === 'Kembali (Baik)').length}
                          {' · '}Ada Rusak: {currentBorrows.filter((b) => b.status === 'Kembali (Rusak/Pecah)').length}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })()
        )}

        {/* Formal Signatures Block */}
        <div className="signature-block mt-12 grid grid-cols-2 gap-8 text-xs text-slate-900">
          {/* Left Signature: Kepala Laboratorium / Atasan */}
          <div className="space-y-1">
            <p className="text-slate-600">Mengetahui,</p>
            <p className="font-bold text-slate-950">{supervisorConfig.title || 'Kepala Laboratorium IPA'}</p>
            <p className="text-[11px] text-slate-500">{supervisorConfig.institution || 'SMAIT As-Syifa Boarding School Wanareja'}</p>
            <div className="h-16" />
            <p className="font-extrabold text-slate-950 mt-1">{supervisorConfig.name || 'Dr. H. Ahmad Fauzi, M.Pd'}</p>
            <p className="text-[11px] font-mono text-slate-600">
              {supervisorConfig.nip
                ? `${supervisorConfig.nipType || 'NIP'}. ${supervisorConfig.nip.replace(/^(NIP|NIY|NPK)[\.\s:]*/i, '')}`
                : 'NIP. 19820415 200801 1 007'}
            </p>
          </div>

          {/* Right Signature: Laboran IPA */}
          <div className="space-y-1 text-right">
            <p className="text-slate-600">Wanareja, {formatDate(getTodayDDMMYYYY())}</p>
            <p className="font-bold text-slate-950">{laboranUser?.role || 'Laboran IPA Penanggung Jawab'},</p>
            <p className="text-[11px] text-slate-500">Unit Laboratorium SMAIT As-Syifa</p>
            <div className="h-16" />
            <p className="font-extrabold text-slate-950 mt-1">{laboranUser?.name || 'Fadhli Hadi Surya'}</p>
            <p className="text-[11px] font-mono text-slate-600">
              {laboranUser?.nip
                ? `${laboranUser.nipType || 'NIP'}. ${laboranUser.nip.replace(/^(NIP|NIY|NPY)[\.\s:]*/i, '')}`
                : 'NIP. 19890412 201402 1 003'}
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-400 text-center flex items-center justify-between font-mono">
          <span>SIMLAB IPA SMAIT As-Syifa Wanareja · Laporan Otomatis Sistem</span>
          <span>Halaman 1 dari 1 · Status Sah</span>
        </div>
      </div>
    </div>
  );
};
