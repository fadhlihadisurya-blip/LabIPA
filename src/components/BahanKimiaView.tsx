import React, { useState } from 'react';
import {
  FlaskConical,
  Plus,
  Search,
  AlertTriangle,
  Flame,
  Skull,
  Biohazard,
  ShieldCheck,
  Download,
  Edit2,
  Trash2,
  ArrowUpDown,
  BookOpen,
  X,
  FileText,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { Chemical, HazardType } from '../types';

export const BahanKimiaView: React.FC = () => {
  const { chemicals, addChemical, updateChemical, adjustChemicalStock, deleteChemical, setActiveSection, userMode } = useLab();

  const [searchQuery, setSearchQuery] = useState('');
  const [hazardFilter, setHazardFilter] = useState<string>('all');
  const [formFilter, setFormFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustingChem, setAdjustingChem] = useState<Chemical | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');

  // New chemical form state
  const [code, setCode] = useState(`BHM-KIM-0${chemicals.length + 1}`);
  const [name, setName] = useState('');
  const [formula, setFormula] = useState('');
  const [casNumber, setCasNumber] = useState('');
  const [form, setForm] = useState<Chemical['form']>('Cair');
  const [stock, setStock] = useState<number>(500);
  const [unit, setUnit] = useState<Chemical['unit']>('mL');
  const [minStock, setMinStock] = useState<number>(100);
  const [location, setLocation] = useState('Lemari Asam B3');
  const [selectedHazards, setSelectedHazards] = useState<HazardType[]>(['corrosive']);
  const [expiryDate, setExpiryDate] = useState('2028-12-31');
  const [notes, setNotes] = useState('');

  const filteredChemicals = chemicals.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.casNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesForm = formFilter === 'all' || c.form === formFilter;
    const matchesHazard = hazardFilter === 'all' || c.hazards.includes(hazardFilter as HazardType);

    return matchesSearch && matchesForm && matchesHazard;
  });

  const handleHazardToggle = (hazard: HazardType) => {
    if (selectedHazards.includes(hazard)) {
      setSelectedHazards(selectedHazards.filter((h) => h !== hazard));
    } else {
      setSelectedHazards([...selectedHazards, hazard]);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !formula) {
      alert('Mohon isi nama dan rumus kimia');
      return;
    }

    const newChemicalPayload: Omit<Chemical, 'id'> = {
      code,
      name,
      formula,
      casNumber: casNumber || '-',
      form,
      stock: Number(stock) || 0,
      unit,
      minStock: Number(minStock) || 50,
      location: location || 'Rak Laboratorium',
      hazards: selectedHazards.length > 0 ? selectedHazards : ['safe'],
      expiryDate: expiryDate || '2028-01-01',
    };
    if (notes.trim()) {
      newChemicalPayload.notes = notes.trim();
    }

    addChemical(newChemicalPayload);

    setIsAddModalOpen(false);
    // Reset form
    setName('');
    setFormula('');
    setCasNumber('');
    setNotes('');
  };

  const handleStockAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingChem) return;

    const delta = adjustType === 'add' ? Number(adjustAmount) : -Number(adjustAmount);
    adjustChemicalStock(adjustingChem.id, delta);
    setAdjustingChem(null);
  };

  const exportCsv = () => {
    const headers = ['Kode', 'Nama Bahan', 'Rumus Kimia', 'No CAS', 'Wujud', 'Stok', 'Satuan', 'Batas Min', 'Lokasi', 'Kadaluarsa'];
    const rows = filteredChemicals.map((c) => [
      c.code,
      `"${c.name}"`,
      `"${c.formula}"`,
      c.casNumber,
      c.form,
      c.stock,
      c.unit,
      c.minStock,
      `"${c.location}"`,
      c.expiryDate,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventaris_Bahan_Kimia_IPA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderHazardBadge = (hazard: HazardType) => {
    switch (hazard) {
      case 'flammable':
        return (
          <span key={hazard} className="inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            <Flame className="w-3 h-3 text-amber-600" /> Flammable
          </span>
        );
      case 'corrosive':
        return (
          <span key={hazard} className="inline-flex items-center gap-0.5 text-[11px] font-medium text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-600" /> Korosif
          </span>
        );
      case 'toxic':
        return (
          <span key={hazard} className="inline-flex items-center gap-0.5 text-[11px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
            <Skull className="w-3 h-3 text-purple-600" /> Beracun
          </span>
        );
      case 'oxidizer':
        return (
          <span key={hazard} className="inline-flex items-center gap-0.5 text-[11px] font-medium text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
            Oksidator
          </span>
        );
      case 'environmental':
        return (
          <span key={hazard} className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            <Biohazard className="w-3 h-3 text-emerald-600" /> Bahaya Lingkungan
          </span>
        );
      case 'irritant':
        return (
          <span key={hazard} className="inline-flex items-center gap-0.5 text-[11px] font-medium text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">
            Iritan
          </span>
        );
      case 'safe':
        return (
          <span key={hazard} className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
            <ShieldCheck className="w-3 h-3 text-slate-500" /> Non-B3
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Inventarisasi Reagen & Bahan Kimia Laboratorium
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan stok bahan habis pakai, simbol bahaya GHS B3, lokasi lemari reagen, dan kadaluarsa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>

          {userMode === 'laboran' && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Bahan Kimia</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, rumus (HCl), kode, CAS..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={formFilter}
            onChange={(e) => setFormFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Wujud</option>
            <option value="Cair">Cair</option>
            <option value="Padat">Padat</option>
            <option value="Indikator">Indikator</option>
            <option value="Gas">Gas</option>
          </select>

          <select
            value={hazardFilter}
            onChange={(e) => setHazardFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Tingkat Bahaya</option>
            <option value="corrosive">Korosif</option>
            <option value="flammable">Flammable (Mudah Terbakar)</option>
            <option value="toxic">Beracun / Toxic</option>
            <option value="oxidizer">Oksidator</option>
            <option value="safe">Non-B3 / Aman</option>
          </select>
        </div>
      </div>

      {/* Chemicals Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Kode & Bahan Kimia</th>
                <th className="px-3 py-3.5">Rumus / CAS</th>
                <th className="px-3 py-3.5">Wujud</th>
                <th className="px-4 py-3.5 text-right">Stok Fisik</th>
                <th className="px-4 py-3.5">Bahaya GHS</th>
                <th className="px-4 py-3.5">Lokasi Simpan</th>
                <th className="px-4 py-3.5">Kadaluarsa</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChemicals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada bahan kimia yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredChemicals.map((c) => {
                  const isLowStock = c.stock <= c.minStock;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 text-xs">{c.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{c.code}</div>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-medium text-slate-800">{c.formula}</span>
                        <div className="text-[11px] text-slate-400">CAS: {c.casNumber}</div>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="text-slate-600 font-medium">{c.form}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="font-mono font-bold tabular-nums text-slate-900">
                          {c.stock.toLocaleString('id-ID')} {c.unit}
                        </div>
                        {isLowStock ? (
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1 py-0.2 rounded inline-block">
                            Stok Menipis (min {c.minStock})
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">min {c.minStock} {c.unit}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {c.hazards.map((h) => renderHazardBadge(h))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 text-[11px] max-w-[150px] truncate" title={c.location}>
                        {c.location}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono tabular-nums text-[11px] text-slate-500">
                        {c.expiryDate}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Stock adjustment button */}
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingChem(c);
                              setAdjustAmount(100);
                              setAdjustType('add');
                            }}
                            className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Sesuaikan Stok (+/-)"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick link to MSDS */}
                          <button
                            type="button"
                            onClick={() => setActiveSection('msds')}
                            className="p-1 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Lihat MSDS Lembar Keselamatan"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {userMode === 'laboran' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Hapus bahan kimia ${c.name}?`)) {
                                  deleteChemical(c.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Hapus Bahan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Penyesuaian Stok */}
      {adjustingChem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                Sesuaikan Stok Reagen
              </h4>
              <button
                type="button"
                onClick={() => setAdjustingChem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustSubmit} className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-800">{adjustingChem.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Stok saat ini: {adjustingChem.stock} {adjustingChem.unit}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                    adjustType === 'add'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  + Tambah (Masuk)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('subtract')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                    adjustType === 'subtract'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  - Kurangi (Pakai)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah ({adjustingChem.unit})
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustingChem(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Bahan Kimia Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                Tambah Reagen / Bahan Kimia Baru
              </h4>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Bahan *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor CAS
                  </label>
                  <input
                    type="text"
                    value={casNumber}
                    onChange={(e) => setCasNumber(e.target.value)}
                    placeholder="Contoh: 7647-01-0"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Bahan *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Asam Nitrat (HNO3) 65%"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rumus Kimia *
                  </label>
                  <input
                    type="text"
                    required
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    placeholder="Contoh: HNO3"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wujud
                  </label>
                  <select
                    value={form}
                    onChange={(e) => setForm(e.target.value as Chemical['form'])}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="Cair">Cair</option>
                    <option value="Padat">Padat</option>
                    <option value="Indikator">Indikator</option>
                    <option value="Gas">Gas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as Chemical['unit'])}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="mL">mL</option>
                    <option value="L">L</option>
                    <option value="gram">gram</option>
                    <option value="kg">kg</option>
                    <option value="botol">botol</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Penyimpanan
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Contoh: Lemari Asam B3"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batas Minimum Stok
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Klasifikasi Bahaya (GHS)
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['corrosive', 'flammable', 'toxic', 'oxidizer', 'irritant', 'environmental', 'safe'] as HazardType[]).map((hz) => (
                    <button
                      key={hz}
                      type="button"
                      onClick={() => handleHazardToggle(hz)}
                      className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                        selectedHazards.includes(hz)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {hz}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Kadaluarsa
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Penanganan Khusus
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instruksi APD atau bahaya spesifik..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                >
                  Simpan Reagen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
