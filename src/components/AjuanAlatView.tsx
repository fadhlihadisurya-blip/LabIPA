import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  AlertTriangle,
  User,
  Calendar,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { BorrowRecord } from '../types';

export const AjuanAlatView: React.FC = () => {
  const { borrows, addBorrow, approveBorrow, returnBorrow, rejectBorrow, equipment, userMode } = useLab();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [borrowerTypeFilter, setBorrowerTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [returningRecord, setReturningRecord] = useState<BorrowRecord | null>(null);
  const [returnCondition, setReturnCondition] = useState<'Kembali (Baik)' | 'Kembali (Rusak/Pecah)'>('Kembali (Baik)');
  const [returnNotes, setReturnNotes] = useState('');

  // Form states
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerType, setBorrowerType] = useState<BorrowRecord['borrowerType']>('Murid');
  const [idNumber, setIdNumber] = useState('');
  const [classOrDept, setClassOrDept] = useState('');
  const [selectedEqId, setSelectedEqId] = useState<string>(equipment[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [returnDueDate, setReturnDueDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  const filteredBorrows = borrows.filter((b) => {
    const matchesSearch =
      b.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.classOrDept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.idNumber.includes(searchQuery);

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? b.status === 'Dipinjam'
        : statusFilter === 'pending'
        ? b.status === 'Menunggu Persetujuan'
        : b.status.startsWith('Kembali');

    const matchesType = borrowerTypeFilter === 'all' || b.borrowerType === borrowerTypeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEq = equipment.find((eq) => eq.id === selectedEqId);
    if (!targetEq || !borrowerName || !returnDueDate || !purpose) {
      alert('Mohon lengkapi formulir peminjaman alat');
      return;
    }

    if (quantity > targetEq.goodCount) {
      alert(`Stok alat yang siap pakai hanya tersisa ${targetEq.goodCount} unit.`);
      return;
    }

    const borrowPayload: Omit<BorrowRecord, 'id' | 'borrowDate'> = {
      borrowerName,
      borrowerType,
      idNumber: idNumber || '-',
      classOrDept: classOrDept || (borrowerType === 'Guru' ? 'Guru Mapel IPA' : 'Siswa IPA'),
      equipmentId: targetEq.id,
      equipmentName: targetEq.name,
      quantity: Number(quantity) || 1,
      returnDueDate,
      status: 'Menunggu Persetujuan',
      purpose,
    };
    if (notes.trim()) {
      borrowPayload.notes = notes.trim();
    }

    addBorrow(borrowPayload);

    setIsModalOpen(false);
    // Reset form
    setBorrowerName('');
    setIdNumber('');
    setClassOrDept('');
    setPurpose('');
    setNotes('');
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningRecord) return;

    returnBorrow(returningRecord.id, returnCondition, returnNotes.trim() || undefined);
    setReturningRecord(null);
    setReturnNotes('');
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Ajuan Peminjaman & Pengembalian Alat Praktikum
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan sirkulasi alat laboratorium, verifikasi status pinjam, dan pemeriksaan kondisi saat pengembalian.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Ajuan Pinjam Alat</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari peminjam, nama alat, kelas, NIS/NIP..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={borrowerTypeFilter}
            onChange={(e) => setBorrowerTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Peminjam (Guru & Murid)</option>
            <option value="Guru">Aktivitas Guru</option>
            <option value="Murid">Aktivitas Murid</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu Persetujuan</option>
            <option value="active">Sedang Dipinjam</option>
            <option value="returned">Sudah Kembali</option>
          </select>
        </div>
      </div>

      {/* Borrow Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Peminjam</th>
                <th className="px-3 py-3.5">Peran & Unit</th>
                <th className="px-4 py-3.5">Alat yang Dipinjam</th>
                <th className="px-3 py-3.5 text-center">Jumlah</th>
                <th className="px-4 py-3.5">Tgl Pinjam / Jatuh Tempo</th>
                <th className="px-4 py-3.5">Keperluan</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBorrows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada riwayat peminjaman yang cocok.
                  </td>
                </tr>
              ) : (
                filteredBorrows.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 text-xs">{record.borrowerName}</div>
                      <div className="text-[11px] font-mono text-slate-400">ID: {record.idNumber}</div>
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          record.borrowerType === 'Guru'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {record.borrowerType}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">{record.classOrDept}</div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {record.equipmentName}
                    </td>
                    <td className="px-3 py-3.5 text-center font-mono font-bold tabular-nums text-slate-900">
                      {record.quantity} unit
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono tabular-nums text-[11px] text-slate-600">
                      <div>Pinjam: {record.borrowDate}</div>
                      <div className="text-slate-400">Batas: {record.returnDueDate}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-[11px] max-w-[200px] truncate" title={record.purpose}>
                      {record.purpose}
                      {record.notes && <p className="text-slate-400 text-[10px] truncate">{record.notes}</p>}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {record.status === 'Dipinjam' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                          <Clock className="w-3 h-3 text-blue-600" /> Sedang Dipinjam
                        </span>
                      )}
                      {record.status === 'Menunggu Persetujuan' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" /> Menunggu Laboran
                        </span>
                      )}
                      {record.status === 'Kembali (Baik)' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Kembali (Baik)
                        </span>
                      )}
                      {record.status === 'Kembali (Rusak/Pecah)' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-red-600" /> Kembali (Rusak)
                        </span>
                      )}
                      {record.status === 'Ditolak' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Ditolak
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* If pending & Laboran mode -> approve or reject */}
                        {userMode === 'laboran' && record.status === 'Menunggu Persetujuan' && (
                          <>
                            <button
                              type="button"
                              onClick={() => approveBorrow(record.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Setujui
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const r = prompt('Alasan penolakan pinjam alat:');
                                if (r) rejectBorrow(record.id, r);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                            >
                              Tolak
                            </button>
                          </>
                        )}

                        {/* If currently borrowed -> Laboran can process return */}
                        {record.status === 'Dipinjam' && (
                          <button
                            type="button"
                            onClick={() => {
                              setReturningRecord(record);
                              setReturnCondition('Kembali (Baik)');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" /> Pengembalian
                          </button>
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

      {/* Modal Pengembalian Alat (Pemeriksaan Fisik) */}
      {returningRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                Proses Pengembalian Alat Praktikum
              </h4>
              <button
                type="button"
                onClick={() => setReturningRecord(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-xs">
                <p className="font-bold text-slate-900">{returningRecord.equipmentName}</p>
                <p className="text-slate-600">Peminjam: {returningRecord.borrowerName} ({returningRecord.classOrDept})</p>
                <p className="text-slate-500 font-mono mt-0.5">Jumlah: {returningRecord.quantity} unit</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kondisi Fisik Alat saat Dikembalikan *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnCondition('Kembali (Baik)')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 ${
                      returnCondition === 'Kembali (Baik)'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Lengkap & Baik
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnCondition('Kembali (Rusak/Pecah)')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 ${
                      returnCondition === 'Kembali (Rusak/Pecah)'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" /> Ada Pecah/Rusak
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Pemeriksaan Laboran
                </label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Catatan kebersihan, lensa dilap, atau rincian komponen pecah..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReturningRecord(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                >
                  Simpan Pengembalian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajukan Pinjam Alat Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                Formulir Peminjaman Alat Laboratorium
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Peminjam *
                  </label>
                  <select
                    value={borrowerType}
                    onChange={(e) => setBorrowerType(e.target.value as BorrowRecord['borrowerType'])}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="Murid">Siswa / Murid</option>
                    <option value="Guru">Guru / Staf Pengajar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIS / NIP *
                  </label>
                  <input
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="Contoh: 212210142"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Peminjam *
                  </label>
                  <input
                    type="text"
                    required
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    placeholder="Nama lengkap peminjam..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas / Rombel *
                  </label>
                  <input
                    type="text"
                    required
                    value={classOrDept}
                    onChange={(e) => setClassOrDept(e.target.value)}
                    placeholder="Contoh: XII MIPA 1"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Alat Laboratorium *
                </label>
                <select
                  value={selectedEqId}
                  onChange={(e) => setSelectedEqId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                >
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.category}) — Siap Pakai: {eq.goodCount} unit
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah yang Dipinjam *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rencana Tanggal Pengembalian *
                  </label>
                  <input
                    type="date"
                    required
                    value={returnDueDate}
                    onChange={(e) => setReturnDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keperluan / Judul Praktikum *
                </label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Contoh: Praktikum Kelompok Hukum Hooke"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Kelengkapan kabel, lensa, atau penutup..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
                >
                  Kirim Permohonan Pinjam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
