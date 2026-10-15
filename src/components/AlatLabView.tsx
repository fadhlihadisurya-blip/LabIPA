import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  QrCode,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Download,
  X,
  Share2,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { Equipment } from '../types';
import { BarcodeModal } from './BarcodeModal';

export const AlatLabView: React.FC = () => {
  const { equipment, addEquipment, updateEquipment, deleteEquipment, setActiveSection, userMode } = useLab();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [selectedBarcodeEq, setSelectedBarcodeEq] = useState<Equipment | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);

  // Form states
  const [code, setCode] = useState(`ALT-IPA-0${equipment.length + 1}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Equipment['category']>('Fisika');
  const [totalCount, setTotalCount] = useState<number>(10);
  const [goodCount, setGoodCount] = useState<number>(10);
  const [damagedCount, setDamagedCount] = useState<number>(0);
  const [location, setLocation] = useState('Lemari Lab Fisika');
  const [brand, setBrand] = useState('');
  const [specification, setSpecification] = useState('');

  const filteredEquipment = equipment.filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (eq.brand && eq.brand.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || eq.category === categoryFilter;
    const matchesCondition =
      conditionFilter === 'all'
        ? true
        : conditionFilter === 'damaged'
        ? eq.damagedCount > 0
        : conditionFilter === 'borrowed'
        ? eq.borrowedCount > 0
        : eq.goodCount > 0;

    return matchesSearch && matchesCategory && matchesCondition;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      alert('Mohon isi nama dan kode alat');
      return;
    }

    const total = Number(totalCount) || 1;
    const good = Number(goodCount) || total;
    const damaged = Number(damagedCount) || 0;

    const eqPayload: Omit<Equipment, 'id'> = {
      code,
      name,
      category,
      totalCount: total,
      goodCount: good,
      damagedCount: damaged,
      borrowedCount: 0,
      location: location || 'Rak Laboratorium',
    };
    if (brand.trim()) {
      eqPayload.brand = brand.trim();
    }
    if (specification.trim()) {
      eqPayload.specification = specification.trim();
    }

    addEquipment(eqPayload);

    setIsAddModalOpen(false);
    // Reset form
    setName('');
    setBrand('');
    setSpecification('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEq) return;

    updateEquipment(editingEq.id, {
      name: editingEq.name,
      category: editingEq.category,
      totalCount: Number(editingEq.totalCount),
      goodCount: Number(editingEq.goodCount),
      damagedCount: Number(editingEq.damagedCount),
      location: editingEq.location,
      brand: editingEq.brand,
      specification: editingEq.specification,
    });

    setEditingEq(null);
  };

  const exportEquipmentCsv = () => {
    const headers = ['Kode Alat', 'Nama Alat', 'Kategori', 'Total Unit', 'Kondisi Baik', 'Rusak', 'Dipinjam', 'Lokasi', 'Merk'];
    const rows = filteredEquipment.map((eq) => [
      eq.code,
      `"${eq.name}"`,
      eq.category,
      eq.totalCount,
      eq.goodCount,
      eq.damagedCount,
      eq.borrowedCount,
      `"${eq.location}"`,
      `"${eq.brand || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventaris_Alat_Lab_IPA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Inventaris Alat & Instrumen Laboratorium IPA
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen alat praktikum Fisika, Kimia, Biologi: kondisi fisik, stok siap pakai, dan barcode identifikasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportEquipmentCsv}
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
              <span>Tambah Alat Baru</span>
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
            placeholder="Cari nama alat, kode, merk..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Kategori</option>
            <option value="Biologi">Biologi</option>
            <option value="Fisika">Fisika</option>
            <option value="Kimia">Kimia</option>
            <option value="Umum">Umum</option>
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Kondisi</option>
            <option value="available">Siap Digunakan (Baik &gt; 0)</option>
            <option value="damaged">Ada Unit Rusak</option>
            <option value="borrowed">Sedang Dipinjam</option>
          </select>
        </div>
      </div>

      {/* Table Equipment */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Kode & Nama Alat</th>
                <th className="px-3 py-3.5">Kategori</th>
                <th className="px-3 py-3.5">Merk / Spesifikasi</th>
                <th className="px-4 py-3.5 text-center">Total</th>
                <th className="px-4 py-3.5 text-center">Siap Pakai (Baik)</th>
                <th className="px-4 py-3.5 text-center">Rusak</th>
                <th className="px-4 py-3.5 text-center">Dipinjam</th>
                <th className="px-4 py-3.5">Lokasi Rak</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada alat laboratorium yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 text-xs">{eq.name}</div>
                      <div className="text-[11px] font-mono text-blue-600">{eq.code}</div>
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          eq.category === 'Biologi'
                            ? 'bg-emerald-50 text-emerald-700'
                            : eq.category === 'Fisika'
                            ? 'bg-blue-50 text-blue-700'
                            : eq.category === 'Kimia'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {eq.category}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-[11px] text-slate-600 max-w-[200px] truncate" title={eq.specification || eq.brand}>
                      <span className="font-medium text-slate-800">{eq.brand || '-'}</span>
                      {eq.specification && <p className="text-slate-400 truncate">{eq.specification}</p>}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-900 tabular-nums">
                      {eq.totalCount}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-600 tabular-nums">
                      {eq.goodCount}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono tabular-nums">
                      {eq.damagedCount > 0 ? (
                        <span className="text-red-600 font-semibold">{eq.damagedCount}</span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono tabular-nums">
                      {eq.borrowedCount > 0 ? (
                        <span className="text-blue-600 font-semibold">{eq.borrowedCount}</span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-[11px] max-w-[140px] truncate" title={eq.location}>
                      {eq.location}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Barcode label print */}
                        <button
                          type="button"
                          onClick={() => setSelectedBarcodeEq(eq)}
                          className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Cetak Barcode / Label Inventaris"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        {/* Laboran edit & delete */}
                        {userMode === 'laboran' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditingEq(eq)}
                              className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              title="Edit Alat"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Hapus alat ${eq.name}?`)) {
                                  deleteEquipment(eq.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode Modal */}
      <BarcodeModal
        equipment={selectedBarcodeEq}
        onClose={() => setSelectedBarcodeEq(null)}
      />

      {/* Modal Tambah Alat Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                Tambah Instrumen / Alat Lab Baru
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
                    Kode Alat *
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
                    Kategori Lab *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Equipment['category'])}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="Fisika">Fisika</option>
                    <option value="Kimia">Kimia</option>
                    <option value="Biologi">Biologi</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Alat *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Neraca Ohaus 311g / Catu Daya Lab"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Unit *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={totalCount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTotalCount(val);
                      setGoodCount(val);
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kondisi Baik
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={goodCount}
                    onChange={(e) => setGoodCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rusak
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={damagedCount}
                    onChange={(e) => setDamagedCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Merk / Brand
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Contoh: Pudak / Olympus"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Rak / Lemari
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Contoh: Lemari Kaca A2"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Spesifikasi Teknis
                </label>
                <textarea
                  rows={2}
                  value={specification}
                  onChange={(e) => setSpecification(e.target.value)}
                  placeholder="Detail ukuran, kapasitas, ketelitian atau voltase..."
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
                  Simpan Alat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Alat */}
      {editingEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                Edit Data Alat: {editingEq.code}
              </h4>
              <button
                type="button"
                onClick={() => setEditingEq(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Alat
                </label>
                <input
                  type="text"
                  required
                  value={editingEq.name}
                  onChange={(e) => setEditingEq({ ...editingEq, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingEq.totalCount}
                    onChange={(e) => setEditingEq({ ...editingEq, totalCount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kondisi Baik
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingEq.goodCount}
                    onChange={(e) => setEditingEq({ ...editingEq, goodCount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rusak
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingEq.damagedCount}
                    onChange={(e) => setEditingEq({ ...editingEq, damagedCount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Rak
                  </label>
                  <input
                    type="text"
                    value={editingEq.location}
                    onChange={(e) => setEditingEq({ ...editingEq, location: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Merk / Brand
                  </label>
                  <input
                    type="text"
                    value={editingEq.brand || ''}
                    onChange={(e) => setEditingEq({ ...editingEq, brand: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEq(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
