import React, { useState } from 'react';
import {
  BookOpen,
  ShieldAlert,
  Printer,
  CheckCircle2,
  FileCheck,
  Search,
  ExternalLink,
  Info,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { SOPItem } from '../types';

export const SopPanduanView: React.FC = () => {
  const { sopList } = useLab();

  const [selectedSop, setSelectedSop] = useState<SOPItem>(sopList[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Interactive APD safety check list state
  const [checkedApd, setCheckedApd] = useState<{ [key: string]: boolean }>({
    jasLab: false,
    sepatu: false,
    rambut: false,
    goggles: false,
    masker: false,
  });

  const toggleApd = (key: string) => {
    setCheckedApd((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isAllApdChecked = Object.values(checkedApd).every(Boolean);

  const filteredSops = sopList.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Standar Operasional Prosedur (SOP) & Panduan Laboratorium
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pedoman keselamatan kerja, tata kelola instrumen presisi, dan regulasi keselamatan praktikan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Cetak SOP Terpilih</span>
        </button>
      </div>

      {/* Interactive Safety APD Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 rounded-2xl p-5 text-white shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-blue-800/60">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              Pemeriksaan Kesiapan Praktikan
            </span>
            <h4 className="text-base font-bold text-white mt-0.5">
              Checklist Wajib APD Sebelum Memasuki Laboratorium IPA
            </h4>
          </div>
          {isAllApdChecked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Siap Masuk Laboratorium
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-full text-xs font-semibold">
              <Info className="w-4 h-4 text-amber-400" /> Lengkapi APD Sebelum Masuk
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-4 text-xs">
          <button
            type="button"
            onClick={() => toggleApd('jasLab')}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
              checkedApd.jasLab
                ? 'bg-blue-800/80 border-blue-400 text-white'
                : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
            }`}
          >
            {checkedApd.jasLab ? <CheckSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-white">Jas Lab Putih</p>
              <p className="text-[11px] text-blue-200/80">Kancing rapat</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => toggleApd('sepatu')}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
              checkedApd.sepatu
                ? 'bg-blue-800/80 border-blue-400 text-white'
                : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
            }`}
          >
            {checkedApd.sepatu ? <CheckSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-white">Sepatu Tertutup</p>
              <p className="text-[11px] text-blue-200/80">Bukan sandal</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => toggleApd('rambut')}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
              checkedApd.rambut
                ? 'bg-blue-800/80 border-blue-400 text-white'
                : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
            }`}
          >
            {checkedApd.rambut ? <CheckSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-white">Rambut / Jilbab</p>
              <p className="text-[11px] text-blue-200/80">Rapi & aman</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => toggleApd('goggles')}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
              checkedApd.goggles
                ? 'bg-blue-800/80 border-blue-400 text-white'
                : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
            }`}
          >
            {checkedApd.goggles ? <CheckSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-white">Kacamata Goggle</p>
              <p className="text-[11px] text-blue-200/80">Praktikum kimia</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => toggleApd('masker')}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
              checkedApd.masker
                ? 'bg-blue-800/80 border-blue-400 text-white'
                : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
            }`}
          >
            {checkedApd.masker ? <CheckSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-white">Sarung Tangan</p>
              <p className="text-[11px] text-blue-200/80">Zat korosif / B3</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Split: SOP List on Left (4 cols), SOP Reader on Right (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of SOP documents */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari dokumen SOP..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="all">Semua Kategori SOP</option>
              <option value="Keselamatan">Keselamatan</option>
              <option value="Peminjaman">Peminjaman</option>
              <option value="Pengelolaan B3">Pengelolaan B3</option>
              <option value="Instrumen">Instrumen</option>
            </select>
          </div>

          <div className="space-y-2">
            {filteredSops.map((sop) => {
              const isSelected = selectedSop?.id === sop.id;
              return (
                <button
                  key={sop.id}
                  type="button"
                  onClick={() => setSelectedSop(sop)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono font-semibold text-blue-600">{sop.code}</span>
                    <span className="text-slate-400">{sop.category}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                    {sop.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {sop.summary}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active SOP Detailed Document */}
        {selectedSop && (
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedSop.code}
                </span>
                <span className="text-slate-400 font-mono">
                  Revisi Terakhir: {selectedSop.lastUpdated}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                {selectedSop.title}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Kategori: <span className="font-semibold">{selectedSop.category}</span> · Diberlakukan untuk seluruh praktikum SMAIT As-Syifa.
              </p>
            </div>

            {/* Summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ringkasan & Tujuan Prosedur
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedSop.summary}
              </p>
            </div>

            {/* Step by step procedures */}
            <div>
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                Langkah-Langkah Pelaksanaan Standar:
              </h5>
              <div className="space-y-3">
                {selectedSop.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-mono">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Safety Points */}
            <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
              <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Poin Kritis Keselamatan & Hal yang Dilarang Keras:
              </h5>
              <ul className="space-y-1.5 text-xs text-amber-950 pl-5 list-disc">
                {selectedSop.safetyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>

            {/* Document Signature Sign-off footer */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between text-[11px] text-slate-400 gap-4">
              <div>
                <p>Disahkan oleh:</p>
                <p className="font-semibold text-slate-700 mt-1">Kepala Laboratorium IPA SMAIT As-Syifa</p>
              </div>
              <div>
                <p>Pelaksana Teknis:</p>
                <p className="font-semibold text-slate-700 mt-1">Laboran Fisika, Kimia & Biologi</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
