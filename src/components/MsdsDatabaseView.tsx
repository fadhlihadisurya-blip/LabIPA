import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Printer,
  AlertTriangle,
  Flame,
  Skull,
  Biohazard,
  HeartPulse,
  Eye,
  Wind,
  Droplet,
  Shield,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { MSDSItem, HazardType } from '../types';

export const MsdsDatabaseView: React.FC = () => {
  const { msdsList } = useLab();

  const [selectedMsds, setSelectedMsds] = useState<MSDSItem>(msdsList[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredList = msdsList.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.chemicalName.toLowerCase().includes(query) ||
      item.formula.toLowerCase().includes(query) ||
      item.casNumber.toLowerCase().includes(query)
    );
  });

  const renderHazardIcon = (hazard: HazardType) => {
    switch (hazard) {
      case 'corrosive':
        return (
          <div key={hazard} className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-md text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>Korosif</span>
          </div>
        );
      case 'flammable':
        return (
          <div key={hazard} className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>Mudah Terbakar</span>
          </div>
        );
      case 'toxic':
        return (
          <div key={hazard} className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-xs font-semibold">
            <Skull className="w-3.5 h-3.5 text-purple-600" />
            <span>Beracun (Toksik)</span>
          </div>
        );
      case 'oxidizer':
        return (
          <div key={hazard} className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-md text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Oksidator</span>
          </div>
        );
      case 'environmental':
        return (
          <div key={hazard} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold">
            <Biohazard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bahaya Lingkungan</span>
          </div>
        );
      case 'irritant':
        return (
          <div key={hazard} className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md text-xs font-semibold">
            <span>Iritan</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Database Lembar Data Keselamatan Bahan (MSDS / LDKB)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Informasi komprehensif bahaya kimia, prosedur P3K, penanganan tumpahan, dan APD wajib sesuai standar GHS.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Cetak Lembar MSDS</span>
        </button>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Chemical List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari zat kimia, rumus (HCl), CAS..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredList.map((item) => {
              const isSelected = selectedMsds?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedMsds(item)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono font-bold text-blue-600">{item.formula}</span>
                    <span className="font-mono text-slate-400 text-[10px]">CAS: {item.casNumber}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs leading-snug">
                    {item.chemicalName}
                  </h4>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.hazards.slice(0, 2).map((h) => (
                      <span
                        key={h}
                        className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active MSDS Detail (8 cols) */}
        {selectedMsds && (
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6">
            {/* Header Lockup */}
            <div className="border-b border-slate-100 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-400">
                  Nomor Registrasi CAS: {selectedMsds.casNumber}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    selectedMsds.hazardSignal === 'BAHAYA'
                      ? 'bg-red-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  KATA SINYAL: {selectedMsds.hazardSignal}
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-2">
                {selectedMsds.chemicalName}
              </h2>
              <p className="text-sm font-mono text-blue-600 font-semibold mt-0.5">
                Rumus Molekul: {selectedMsds.formula}
              </p>

              {/* GHS Hazard Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedMsds.hazards.map((h) => renderHazardIcon(h))}
              </div>
            </div>

            {/* Pernyataan Bahaya (H-Statements) */}
            <div className="p-4 bg-red-50/60 rounded-xl border border-red-200/80">
              <h5 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Pernyataan Bahaya Utama (GHS Hazard Statements):
              </h5>
              <ul className="space-y-1 text-xs text-red-950 pl-5 list-disc font-medium">
                {selectedMsds.hazardsDescription.map((desc, i) => (
                  <li key={i}>{desc}</li>
                ))}
              </ul>
            </div>

            {/* Sifat Fisika & Kimia */}
            <div>
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" /> Sifat Fisika & Kimia:
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                <div>
                  <span className="text-slate-400 block text-[11px]">Wujud Fisik:</span>
                  <span className="font-semibold text-slate-800">{selectedMsds.physicalProperties.state}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Warna:</span>
                  <span className="font-semibold text-slate-800">{selectedMsds.physicalProperties.color}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Aroma / Bau:</span>
                  <span className="font-semibold text-slate-800">{selectedMsds.physicalProperties.odor}</span>
                </div>
                {selectedMsds.physicalProperties.boilingPoint && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Titik Didih:</span>
                    <span className="font-semibold text-slate-800 font-mono">{selectedMsds.physicalProperties.boilingPoint}</span>
                  </div>
                )}
                {selectedMsds.physicalProperties.meltingPoint && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Titik Leleh:</span>
                    <span className="font-semibold text-slate-800 font-mono">{selectedMsds.physicalProperties.meltingPoint}</span>
                  </div>
                )}
                {selectedMsds.physicalProperties.density && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Massa Jenis:</span>
                    <span className="font-semibold text-slate-800 font-mono">{selectedMsds.physicalProperties.density}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Prosedur Pertolongan Pertama (P3K) */}
            <div>
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-emerald-600" /> Tindakan Pertolongan Pertama (P3K):
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/70">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900 mb-1">
                    <Eye className="w-3.5 h-3.5 text-blue-600" /> Kontak Mata:
                  </div>
                  <p className="text-slate-700 leading-relaxed">{selectedMsds.firstAid.eyes}</p>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                    <Droplet className="w-3.5 h-3.5 text-amber-600" /> Kontak Kulit:
                  </div>
                  <p className="text-slate-700 leading-relaxed">{selectedMsds.firstAid.skin}</p>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/70">
                  <div className="flex items-center gap-1.5 font-bold text-purple-900 mb-1">
                    <Wind className="w-3.5 h-3.5 text-purple-600" /> Terhirup (Inhalasi):
                  </div>
                  <p className="text-slate-700 leading-relaxed">{selectedMsds.firstAid.inhalation}</p>
                </div>

                <div className="p-3 bg-red-50/60 rounded-xl border border-red-200/70">
                  <div className="flex items-center gap-1.5 font-bold text-red-900 mb-1">
                    <Skull className="w-3.5 h-3.5 text-red-600" /> Tertelan (Ingesti):
                  </div>
                  <p className="text-slate-700 leading-relaxed">{selectedMsds.firstAid.ingestion}</p>
                </div>
              </div>
            </div>

            {/* Tindakan Pemadaman Kebakaran & Tumpahan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h6 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-600" /> Penanganan Kebakaran
                </h6>
                <p className="text-slate-600 leading-relaxed">{selectedMsds.firefighting}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h6 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Penanganan Tumpahan & Kebocoran
                </h6>
                <p className="text-slate-600 leading-relaxed">{selectedMsds.accidentalSpill}</p>
              </div>
            </div>

            {/* APD Wajib Digunakan */}
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <h6 className="font-bold text-xs uppercase tracking-wider text-amber-300">
                  Alat Pelindung Diri (APD) Wajib Digunakan:
                </h6>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedMsds.requiredPpe.map((ppe, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-white/10 rounded-lg text-slate-200"
                  >
                    <Check className="w-3 h-3 text-emerald-400" /> {ppe}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
