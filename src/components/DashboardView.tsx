import React, { useState } from 'react';
import {
  List,
  Clock,
  BarChart3,
  FlaskConical,
  Wrench,
  CalendarDays,
  FileCheck2,
  Plus,
  ArrowRight,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { useLab } from '../context/LabContext';

export const DashboardView: React.FC = () => {
  const {
    borrows,
    chemicals,
    equipment,
    visits,
    chemicalRequests,
    setActiveSection,
    userMode,
    clearCurrentMonthBorrows,
    resetToDefaultData,
  } = useLab();

  // Current month filter (e.g., 2026-10)
  const currentMonthKey = '2026-10';
  const currentMonthBorrows = borrows.filter(
    (b) => b.borrowDate && b.borrowDate.startsWith(currentMonthKey)
  );

  // Statistics
  const totalEquipmentUnits = equipment.reduce((acc, eq) => acc + eq.totalCount, 0);
  const totalChemicalsCount = chemicals.length;
  const pendingVisitsCount = visits.filter((v) => v.status === 'Menunggu Persetujuan').length;
  const pendingBorrowsCount = borrows.filter((b) => b.status === 'Menunggu Persetujuan').length;
  const pendingRequestsCount = pendingVisitsCount + pendingBorrowsCount;

  // Donut chart calculations: Guru vs Murid
  const guruBorrowsCount = borrows.filter((b) => b.borrowerType === 'Guru').length;
  const muridBorrowsCount = borrows.filter((b) => b.borrowerType === 'Murid').length;
  const totalBorrowActivity = guruBorrowsCount + muridBorrowsCount;

  const guruPercent = totalBorrowActivity > 0 ? Math.round((guruBorrowsCount / totalBorrowActivity) * 100) : 38;
  const muridPercent = totalBorrowActivity > 0 ? 100 - guruPercent : 62;

  // Donut SVG circumference calculation
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const muridStrokeLength = (muridPercent / 100) * circumference;
  const guruStrokeLength = (guruPercent / 100) * circumference;

  // Top 5 Guru
  const guruBorrowCounts: { [name: string]: number } = {};
  borrows
    .filter((b) => b.borrowerType === 'Guru')
    .forEach((b) => {
      const shortName = b.borrowerName.split(',')[0].replace('Ustadz ', '').replace('Ustadzah ', '').replace('Pak ', '').replace('Bu ', '');
      guruBorrowCounts[shortName] = (guruBorrowCounts[shortName] || 0) + 1;
    });

  const top5Guru = (Object.entries(guruBorrowCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)) as [string, number][];

  // Default fallback if empty
  const displayTop5Guru: [string, number][] =
    top5Guru.length > 0
      ? top5Guru
      : [
          ['Ahmad Fauzi', 1],
          ['Nurul H.', 1],
          ['Hendra G.', 1],
        ];

  // Top 5 Murid
  const muridBorrowCounts: { [name: string]: number } = {};
  borrows
    .filter((b) => b.borrowerType === 'Murid')
    .forEach((b) => {
      const shortName = b.borrowerName.split(' ')[0] + (b.classOrDept ? ` (${b.classOrDept.split(' ')[0]})` : '');
      muridBorrowCounts[shortName] = (muridBorrowCounts[shortName] || 0) + 1;
    });

  const top5Murid = (Object.entries(muridBorrowCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)) as [string, number][];

  const displayTop5Murid: [string, number][] =
    top5Murid.length > 0
      ? top5Murid
      : [
          ['Farhan (XII)', 1],
          ['Aisyah (XI)', 1],
          ['Raihan (XII)', 1],
          ['Zahra (X)', 1],
        ];

  const maxGuruCount = Math.max(1, ...displayTop5Guru.map(([, count]) => count));
  const maxMuridCount = Math.max(1, ...displayTop5Murid.map(([, count]) => count));

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* KPI Overview Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Alat Laboratorium</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {totalEquipmentUnits} <span className="text-xs font-normal text-slate-500">unit</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {equipment.length} jenis instrumen
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Bahan Kimia Terdata</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {totalChemicalsCount} <span className="text-xs font-normal text-slate-500">reagen</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              MSDS & label GHS lengkap
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Jadwal Praktikum</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {visits.filter((v) => v.status === 'Disetujui').length}{' '}
              <span className="text-xs font-normal text-slate-500">sesi</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Lab Kimia, Fisika & Biologi
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Ajuan Verifikasi</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {pendingRequestsCount}{' '}
              <span className="text-xs font-normal text-slate-500">menunggu</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Kunjungan & alat baru
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Row 1: Riwayat Pinjam Bulan Ini & Donut Chart (matching image.png) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Card 1: Riwayat Pinjam Bulan Ini (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <List className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900 text-base">
                Riwayat Pinjam Bulan Ini
              </h3>
            </div>

            {/* Quick toggle to demonstrate empty state vs populated state */}
            <div className="flex items-center gap-2">
              {currentMonthBorrows.length === 0 ? (
                <button
                  type="button"
                  onClick={resetToDefaultData}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                >
                  Muat Data Contoh
                </button>
              ) : (
                <button
                  type="button"
                  onClick={clearCurrentMonthBorrows}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                  title="Simulasikan tampilan kosong seperti di tangkapan layar"
                >
                  Simulasikan Kosong
                </button>
              )}
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-center">
            {currentMonthBorrows.length === 0 ? (
              /* Exact empty state as in screenshot */
              <div className="py-20 text-center">
                <p className="text-slate-400 italic text-sm">
                  Belum ada peminjaman bulan ini.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveSection('ajuan-alat')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Buat Ajuan Pinjam Alat
                  </button>
                </div>
              </div>
            ) : (
              /* Populated table */
              <div className="overflow-x-auto -mx-6 -my-4">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Tgl</th>
                      <th className="px-4 py-3">Peminjam</th>
                      <th className="px-4 py-3">Alat</th>
                      <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentMonthBorrows.slice(0, 5).map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3 text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
                          {record.borrowDate.split('-').slice(1).reverse().join('/')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-medium text-slate-900 text-xs truncate max-w-[150px]">
                            {record.borrowerName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {record.borrowerType} · {record.classOrDept}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap truncate max-w-[180px]">
                          {record.equipmentName} ({record.quantity} unit)
                        </td>
                        <td className="px-6 py-3 text-right whitespace-nowrap">
                          <span
                            className={`text-xs font-medium ${
                              record.status === 'Dipinjam'
                                ? 'text-blue-600'
                                : record.status.startsWith('Kembali')
                                ? 'text-emerald-600'
                                : 'text-slate-500'
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {currentMonthBorrows.length > 5 && (
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveSection('ajuan-alat')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
              >
                Lihat Semua ({currentMonthBorrows.length}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Card 2: Aktivitas Peminjaman: Guru vs Murid (5 cols) matching image.png */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col p-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <Clock className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-slate-900 text-base">
              Aktivitas Peminjaman: Guru vs Murid
            </h3>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-6">
            {/* SVG Donut Chart matching screenshot's green and blue rings */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#e2e8f0"
                  strokeWidth="22"
                  fill="transparent"
                />
                {/* Murid Arc (Emerald Green #10b981) */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#10b981"
                  strokeWidth="22"
                  strokeDasharray={`${muridStrokeLength} ${circumference}`}
                  fill="transparent"
                  strokeLinecap="round"
                />
                {/* Guru Arc (Blue #3b82f6) */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#3b82f6"
                  strokeWidth="22"
                  strokeDasharray={`${guruStrokeLength} ${circumference}`}
                  strokeDashoffset={-muridStrokeLength}
                  fill="transparent"
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {totalBorrowActivity}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Total Transaksi
                </span>
              </div>
            </div>

            {/* Legend matching screenshot: Blue = Guru, Green = Murid */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <span className="w-4 h-2.5 rounded-xs bg-[#3b82f6] shrink-0" />
                <span className="text-xs text-slate-600 font-medium">
                  Aktivitas Guru ({guruPercent}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-2.5 rounded-xs bg-[#10b981] shrink-0" />
                <span className="text-xs text-slate-600 font-medium">
                  Aktivitas Murid ({muridPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Top 5 Peminjam Guru & Top 5 Peminjam Murid (matching image.png) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Guru Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-base">
              Top 5 Peminjam (Guru)
            </h3>
          </div>

          <div className="pt-6 pb-2 flex-1 flex flex-col justify-end">
            <div className="flex items-end justify-around h-44 gap-4 px-2 border-b border-slate-200">
              {displayTop5Guru.map(([name, count], index) => {
                const heightPercent = Math.max(25, (count / maxGuruCount) * 100);
                return (
                  <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-xs font-mono font-semibold text-slate-600 mb-1">
                      {count}
                    </span>
                    <div
                      className="w-full max-w-[54px] bg-[#3b82f6] rounded-t-sm transition-all duration-300 group-hover:bg-blue-600"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Labels below chart */}
            <div className="flex justify-around gap-4 px-2 mt-2">
              {displayTop5Guru.map(([name], index) => (
                <div key={index} className="flex-1 text-center">
                  <span className="text-[11px] text-slate-600 font-medium truncate block max-w-[70px] mx-auto" title={name}>
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top 5 Murid Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-900 text-base">
              Top 5 Peminjam (Murid)
            </h3>
          </div>

          <div className="pt-6 pb-2 flex-1 flex flex-col justify-end">
            <div className="flex items-end justify-around h-44 gap-4 px-2 border-b border-slate-200">
              {displayTop5Murid.map(([name, count], index) => {
                const heightPercent = Math.max(25, (count / maxMuridCount) * 100);
                return (
                  <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-xs font-mono font-semibold text-slate-600 mb-1">
                      {count}
                    </span>
                    <div
                      className="w-full max-w-[54px] bg-[#10b981] rounded-t-sm transition-all duration-300 group-hover:bg-emerald-600"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Labels below chart */}
            <div className="flex justify-around gap-4 px-2 mt-2">
              {displayTop5Murid.map(([name], index) => (
                <div key={index} className="flex-1 text-center">
                  <span className="text-[11px] text-slate-600 font-medium truncate block max-w-[70px] mx-auto" title={name}>
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div
          onClick={() => setActiveSection('ajuan-kunjungan')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
              Jadwal Kunjungan Praktikum
            </h4>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reservasi ruang lab Fisika, Kimia, atau Biologi untuk sesi kelas.
          </p>
        </div>

        <div
          onClick={() => setActiveSection('bahan-kimia')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
              Inventaris Bahan Kimia
            </h4>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau stok reagen, lokasi lemari B3, masa kadaluarsa, & kode CAS.
          </p>
        </div>

        <div
          onClick={() => setActiveSection('msds')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
              Database MSDS & P3K
            </h4>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Lembar keselamatan bahan GHS, pertolongan pertama, & APD wajib.
          </p>
        </div>
      </div>
    </div>
  );
};
