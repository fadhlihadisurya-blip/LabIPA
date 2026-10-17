import React, { useState, useEffect, useRef } from 'react';
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
  Trash2,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { BorrowRecord, BorrowItem, DamagedItemReport } from '../types';

interface DamagedSelection {
  selected: boolean;
  quantity: number;
  damageType: string;
  notes: string;
}

export const AjuanAlatView: React.FC = () => {
  const {
    borrows,
    addBorrow,
    approveBorrow,
    returnBorrow,
    rejectBorrow,
    deleteBorrow,
    equipment,
    userMode,
    teachers,
    students,
  } = useLab();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [borrowerTypeFilter, setBorrowerTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [returningRecord, setReturningRecord] = useState<BorrowRecord | null>(null);
  const [returnCondition, setReturnCondition] = useState<'Kembali (Baik)' | 'Kembali (Rusak/Pecah)'>('Kembali (Baik)');
  const [returnNotes, setReturnNotes] = useState('');
  const [damagedSelections, setDamagedSelections] = useState<{ [eqId: string]: DamagedSelection }>({});
  const [deletingRecord, setDeletingRecord] = useState<BorrowRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [borrowerType, setBorrowerType] = useState<'Murid' | 'Guru'>('Murid');
  const [borrowerName, setBorrowerName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [classOrDept, setClassOrDept] = useState('');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Multi-item equipment selection
  const [borrowItems, setBorrowItems] = useState<BorrowItem[]>([
    {
      equipmentId: equipment[0]?.id || '',
      equipmentName: equipment[0]?.name || '',
      quantity: 1,
    },
  ]);

  const [returnDueDate, setReturnDueDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-populate ID and Class/Dept when borrowerName is selected from database
  const handleBorrowerChange = (name: string) => {
    setBorrowerName(name);
    if (borrowerType === 'Murid') {
      const student = students.find((s) => s.name.toLowerCase() === name.toLowerCase());
      if (student) {
        setIdNumber(student.nis || '-');
        setClassOrDept(student.classGroup || 'Siswa IPA');
      }
    } else {
      const teacher = teachers.find((t) => t.name.toLowerCase() === name.toLowerCase());
      if (teacher) {
        setIdNumber(teacher.nip || '-');
        setClassOrDept(teacher.subject ? `Guru ${teacher.subject}` : 'Guru Mapel IPA');
      }
    }
  };

  const handleBorrowerTypeChange = (type: 'Murid' | 'Guru') => {
    setBorrowerType(type);
    setBorrowerName('');
    setIdNumber('');
    setClassOrDept('');
    setIsDropdownOpen(false);
  };

  const filteredBorrowers = borrowerType === 'Murid'
    ? students.filter((s) => {
        if (!borrowerName) return true;
        const q = borrowerName.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          (s.classGroup && s.classGroup.toLowerCase().includes(q)) ||
          (s.nis && s.nis.toLowerCase().includes(q))
        );
      })
    : teachers.filter((t) => {
        if (!borrowerName) return true;
        const q = borrowerName.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          (t.subject && t.subject.toLowerCase().includes(q)) ||
          (t.nip && t.nip.toLowerCase().includes(q))
        );
      });

  const handleSelectBorrower = (name: string) => {
    handleBorrowerChange(name);
    setIsDropdownOpen(false);
  };

  const handleAddItemRow = () => {
    const firstEq = equipment[0];
    if (firstEq) {
      setBorrowItems([
        ...borrowItems,
        {
          equipmentId: firstEq.id,
          equipmentName: firstEq.name,
          quantity: 1,
        },
      ]);
    }
  };

  const handleRemoveItemRow = (index: number) => {
    setBorrowItems(borrowItems.filter((_, i) => i !== index));
  };

  const handleItemEqChange = (index: number, equipmentId: string) => {
    const targetEq = equipment.find((eq) => eq.id === equipmentId);
    if (!targetEq) return;

    setBorrowItems(
      borrowItems.map((item, i) =>
        i === index
          ? {
              ...item,
              equipmentId: targetEq.id,
              equipmentName: targetEq.name,
            }
          : item
      )
    );
  };

  const handleItemQtyChange = (index: number, qty: number) => {
    setBorrowItems(
      borrowItems.map((item, i) =>
        i === index ? { ...item, quantity: Number(qty) || 1 } : item
      )
    );
  };

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
  }).sort((a, b) => (b.borrowDate || '').localeCompare(a.borrowDate || '') || b.id.localeCompare(a.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim() || !returnDueDate || !purpose.trim()) {
      alert('Mohon lengkapi formulir peminjaman alat');
      return;
    }

    if (borrowItems.length === 0) {
      alert('Mohon pilih minimal satu alat yang akan dipinjam');
      return;
    }

    for (const item of borrowItems) {
      const targetEq = equipment.find((eq) => eq.id === item.equipmentId);
      if (targetEq && item.quantity > targetEq.goodCount) {
        alert(`Stok alat "${targetEq.name}" yang siap pakai hanya tersisa ${targetEq.goodCount} unit.`);
        return;
      }
    }

    const firstItem = borrowItems[0];
    const borrowPayload: Omit<BorrowRecord, 'id' | 'borrowDate'> = {
      borrowerName: borrowerName.trim(),
      borrowerType,
      idNumber: idNumber || '-',
      classOrDept: classOrDept || (borrowerType === 'Guru' ? 'Guru Mapel IPA' : 'Siswa IPA'),
      equipmentId: firstItem.equipmentId,
      equipmentName: firstItem.equipmentName,
      quantity: firstItem.quantity,
      items: borrowItems,
      returnDueDate,
      status: 'Menunggu Persetujuan',
      purpose: purpose.trim(),
    };
    if (notes.trim()) {
      borrowPayload.notes = notes.trim();
    }

    addBorrow(borrowPayload);

    setIsModalOpen(false);
    // Reset form
    setBorrowerType('Murid');
    setBorrowerName('');
    setIdNumber('');
    setClassOrDept('');
    setBorrowItems([
      {
        equipmentId: equipment[0]?.id || '',
        equipmentName: equipment[0]?.name || '',
        quantity: 1,
      },
    ]);
    setPurpose('');
    setNotes('');
    setIsDropdownOpen(false);
  };

  const returningLoanItems: BorrowItem[] = returningRecord
    ? returningRecord.items && returningRecord.items.length > 0
      ? returningRecord.items
      : [
          {
            equipmentId: returningRecord.equipmentId,
            equipmentName: returningRecord.equipmentName,
            quantity: returningRecord.quantity,
          },
        ]
    : [];

  const openReturnModal = (record: BorrowRecord) => {
    setReturningRecord(record);
    setReturnCondition('Kembali (Baik)');
    setReturnNotes('');

    const loanItems: BorrowItem[] =
      record.items && record.items.length > 0
        ? record.items
        : [
            {
              equipmentId: record.equipmentId,
              equipmentName: record.equipmentName,
              quantity: record.quantity,
            },
          ];

    const initialSelections: { [eqId: string]: DamagedSelection } = {};
    loanItems.forEach((item) => {
      initialSelections[item.equipmentId] = {
        selected: false,
        quantity: 1,
        damageType: 'Pecah / Retak',
        notes: '',
      };
    });
    setDamagedSelections(initialSelections);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningRecord) return;

    let damagedReportList: DamagedItemReport[] = [];
    if (returnCondition === 'Kembali (Rusak/Pecah)') {
      const selectedIds = Object.keys(damagedSelections).filter(
        (id) => damagedSelections[id]?.selected
      );

      if (selectedIds.length === 0) {
        alert('Mohon centang dan pilih minimal satu alat yang mengalami kerusakan.');
        return;
      }

      damagedReportList = selectedIds.map((id) => {
        const itemInfo = returningLoanItems.find((it) => it.equipmentId === id);
        const detail = damagedSelections[id];
        return {
          equipmentId: id,
          equipmentName: itemInfo?.equipmentName || id,
          quantity: detail.quantity || 1,
          damageType: detail.damageType || 'Pecah / Retak',
          notes: detail.notes.trim() || undefined,
        };
      });
    }

    returnBorrow(
      returningRecord.id,
      returnCondition,
      returnNotes.trim() || undefined,
      damagedReportList.length > 0 ? damagedReportList : undefined
    );
    setReturningRecord(null);
    setReturnNotes('');
    setDamagedSelections({});
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return;
    try {
      setIsDeleting(true);
      await deleteBorrow(deletingRecord.id);
      setDeletingRecord(null);
    } catch (err) {
      console.error('Gagal menghapus ajuan peminjaman:', err);
    } finally {
      setIsDeleting(false);
    }
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-2xs shrink-0 cursor-pointer"
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
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Semua Peminjam (Guru & Murid)</option>
            <option value="Guru">Aktivitas Guru</option>
            <option value="Murid">Aktivitas Murid</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                {userMode === 'laboran' && <th className="px-4 py-3.5 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBorrows.length === 0 ? (
                <tr>
                  <td colSpan={userMode === 'laboran' ? 8 : 7} className="py-12 text-center text-slate-400">
                    Tidak ada riwayat peminjaman yang cocok.
                  </td>
                </tr>
              ) : (
                filteredBorrows.map((record) => {
                  const totalQty = record.items && record.items.length > 0
                    ? record.items.reduce((acc, cur) => acc + cur.quantity, 0)
                    : record.quantity;
                  return (
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
                        {record.items && record.items.length > 0 ? (
                          <div className="space-y-1">
                            {record.items.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-3">
                                <span>{it.equipmentName}</span>
                                <span className="font-mono font-bold text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                  {it.quantity} unit
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span>{record.equipmentName} ({record.quantity} unit)</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center font-mono font-bold tabular-nums text-slate-900">
                        {totalQty} unit
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
                            <Clock className="w-3 h-3 animate-spin" />
                            Sedang Dipinjam
                          </span>
                        )}
                        {record.status === 'Menunggu Persetujuan' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Menunggu Persetujuan
                          </span>
                        )}
                        {record.status === 'Kembali (Baik)' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Kembali (Baik)
                          </span>
                        )}
                        {record.status === 'Kembali (Rusak/Pecah)' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                              <AlertTriangle className="w-3 h-3" />
                              Kembali (Rusak)
                            </span>
                            {record.damagedItems && record.damagedItems.length > 0 && (
                              <div className="text-[10px] text-rose-600 font-medium">
                                {record.damagedItems.map((d, i) => (
                                  <div key={i} className="truncate max-w-[170px]" title={`${d.quantity}x ${d.equipmentName} (${d.damageType || 'Rusak'})`}>
                                    • {d.quantity}x {d.equipmentName}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {record.status === 'Ditolak' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Ditolak
                          </span>
                        )}
                      </td>
                      {userMode === 'laboran' && (
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {record.status === 'Menunggu Persetujuan' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => approveBorrow(record.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md transition-colors cursor-pointer text-[11px]"
                                >
                                  Setujui
                                </button>
                                <button
                                  type="button"
                                  onClick={() => rejectBorrow(record.id, 'Permohonan ditolak laboran')}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md transition-colors cursor-pointer text-[11px]"
                                >
                                  Tolak
                                </button>
                              </>
                            )}
                            {record.status === 'Dipinjam' && (
                              <button
                                type="button"
                                onClick={() => openReturnModal(record)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-colors cursor-pointer text-[11px]"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Pengembalian</span>
                              </button>
                            )}
                            {record.status !== 'Menunggu Persetujuan' && record.status !== 'Dipinjam' && (
                              <span className="text-slate-400 italic text-[11px]">Selesai</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setDeletingRecord(record)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer text-[11px] font-semibold border border-rose-200/80 hover:border-rose-300 ml-1"
                              title="Hapus Ajuan Peminjaman Alat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Return Equipment */}
      {returningRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-indigo-600" />
                <span>Verifikasi Pengembalian Alat</span>
              </h4>
              <button
                type="button"
                onClick={() => setReturningRecord(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{returningRecord.borrowerName}</span>
                  <span className="text-[11px] font-mono text-slate-500">ID: {returningRecord.idNumber}</span>
                </div>
                <div className="text-slate-700 font-medium text-[11px]">
                  Daftar Alat yang Dipinjam ({returningLoanItems.length} jenis alat):
                </div>
                <div className="space-y-1 pt-0.5">
                  {returningLoanItems.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200/70"
                    >
                      <span className="font-medium text-slate-800">{it.equipmentName}</span>
                      <span className="font-mono font-bold text-slate-700 text-[11px]">
                        {it.quantity} unit
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-slate-500 font-mono text-[11px] pt-1 border-t border-slate-200/60">
                  Jatuh Tempo: {returningRecord.returnDueDate}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kondisi Pengembalian *
                </label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value as any)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white font-semibold transition-colors ${
                    returnCondition === 'Kembali (Rusak/Pecah)'
                      ? 'border-rose-300 text-rose-800 bg-rose-50/30'
                      : 'border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="Kembali (Baik)">Kembali (Kondisi Baik & Lengkap)</option>
                  <option value="Kembali (Rusak/Pecah)">Kembali (Ada Kerusakan / Pecah / Hilang)</option>
                </select>
              </div>

              {/* Multi-tool Damaged Selection */}
              {returnCondition === 'Kembali (Rusak/Pecah)' && (
                <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/90 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Pilih Alat yang Mengalami Kerusakan:</span>
                    </div>
                    <span className="text-[10px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full font-semibold">
                      Bisa pilih &gt; 1 alat
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-tight">
                    Centang alat di bawah ini yang rusak/pecah/hilang, kemudian tentukan jumlah unit dan jenis kerusakannya:
                  </p>

                  <div className="space-y-2.5">
                    {returningLoanItems.map((item) => {
                      const detail = damagedSelections[item.equipmentId] || {
                        selected: false,
                        quantity: 1,
                        damageType: 'Pecah / Retak',
                        notes: '',
                      };

                      return (
                        <div
                          key={item.equipmentId}
                          className={`p-3 rounded-xl border transition-all ${
                            detail.selected
                              ? 'bg-white border-rose-400 shadow-xs ring-1 ring-rose-200'
                              : 'bg-white/80 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={detail.selected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setDamagedSelections((prev) => ({
                                  ...prev,
                                  [item.equipmentId]: {
                                    ...detail,
                                    selected: checked,
                                    quantity: detail.quantity || 1,
                                  },
                                }));
                              }}
                              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`font-bold text-xs ${
                                    detail.selected ? 'text-rose-900' : 'text-slate-800'
                                  }`}
                                >
                                  {item.equipmentName}
                                </span>
                                <span className="font-mono text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  Dipinjam: {item.quantity} unit
                                </span>
                              </div>
                            </div>
                          </label>

                          {detail.selected && (
                            <div className="mt-3 pt-2.5 border-t border-rose-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  Jumlah Unit Rusak (Maks: {item.quantity}) *
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={item.quantity}
                                  value={detail.quantity}
                                  onChange={(e) => {
                                    const val = Math.min(
                                      item.quantity,
                                      Math.max(1, parseInt(e.target.value) || 1)
                                    );
                                    setDamagedSelections((prev) => ({
                                      ...prev,
                                      [item.equipmentId]: {
                                        ...detail,
                                        quantity: val,
                                      },
                                    }));
                                  }}
                                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-rose-700 focus:outline-none focus:border-rose-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  Jenis Kerusakan
                                </label>
                                <select
                                  value={detail.damageType}
                                  onChange={(e) => {
                                    setDamagedSelections((prev) => ({
                                      ...prev,
                                      [item.equipmentId]: {
                                        ...detail,
                                        damageType: e.target.value,
                                      },
                                    }));
                                  }}
                                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-rose-500"
                                >
                                  <option value="Pecah / Retak">Pecah / Retak</option>
                                  <option value="Patah / Bengkok">Patah / Bengkok</option>
                                  <option value="Hilang / Tidak Kembali">Hilang / Tidak Kembali</option>
                                  <option value="Malfungsi / Rusak Total">Malfungsi / Rusak Total</option>
                                  <option value="Komponen Kurang">Komponen Kurang / Tidak Lengkap</option>
                                  <option value="Lainnya">Lainnya</option>
                                </select>
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                  Keterangan Tambahan Kerusakan (Opsional)
                                </label>
                                <input
                                  type="text"
                                  value={detail.notes}
                                  onChange={(e) => {
                                    setDamagedSelections((prev) => ({
                                      ...prev,
                                      [item.equipmentId]: {
                                        ...detail,
                                        notes: e.target.value,
                                      },
                                    }));
                                  }}
                                  placeholder="Contoh: Pecah saat dicuci di wastafel lab..."
                                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-[11px] focus:outline-none focus:border-rose-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Pengembalian Umum (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Catatan umum proses pengembalian oleh peminjam..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReturningRecord(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Konfirmasi Pengembalian</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Borrow Request */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-rose-600">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Hapus Ajuan Peminjaman Alat
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus data ajuan peminjaman alat berikut? Tindakan ini akan menghapus riwayat ajuan dari database.
              </p>

              <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{deletingRecord.borrowerName}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      deletingRecord.borrowerType === 'Guru'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {deletingRecord.borrowerType} - {deletingRecord.classOrDept}
                  </span>
                </div>
                <div className="text-slate-600">
                  <span className="font-medium text-slate-700">Alat: </span>
                  {deletingRecord.items && deletingRecord.items.length > 0
                    ? deletingRecord.items.map((it) => `${it.equipmentName} (${it.quantity} unit)`).join(', ')
                    : `${deletingRecord.equipmentName} (${deletingRecord.quantity} unit)`}
                </div>
                <div className="flex items-center justify-between text-slate-500 font-mono text-[11px] pt-1 border-t border-slate-200/60">
                  <span>Tgl Pinjam: {deletingRecord.borrowDate}</span>
                  <span className="font-semibold text-slate-700">Status: {deletingRecord.status}</span>
                </div>
              </div>

              {deletingRecord.status === 'Dipinjam' && (
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Catatan: Status saat ini adalah <strong>Sedang Dipinjam</strong>. Menghapus data ini akan otomatis mengembalikan kuantitas alat ke inventaris lab.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingRecord(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Borrow Request */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Buat Ajuan Peminjaman Alat
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Formulir peminjaman inventaris alat laboratorium sains
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jenis Peminjam *
                </label>
                <select
                  value={borrowerType}
                  onChange={(e) => handleBorrowerTypeChange(e.target.value as 'Murid' | 'Guru')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800"
                >
                  <option value="Murid">Siswa / Murid</option>
                  <option value="Guru">Guru / Staf Pengajar</option>
                </select>
              </div>

              {/* Searchable Combobox for Nama Peminjam */}
              <div className="relative" ref={comboboxRef}>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Peminjam (Ketik untuk cari atau pilih) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={borrowerName}
                    onChange={(e) => {
                      handleBorrowerChange(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder={`Ketik nama ${borrowerType === 'Murid' ? 'siswa' : 'guru'}...`}
                    className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <ChevronDown
                    className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer pointer-events-none"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  />
                </div>

                {isDropdownOpen && filteredBorrowers.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredBorrowers.map((p) => {
                      const name = p.name;
                      const sub = borrowerType === 'Murid' ? (p as any).classGroup : (p as any).subject;
                      const identifier = borrowerType === 'Murid' ? (p as any).nis : (p as any).nip;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectBorrower(name)}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs border-b border-slate-100 last:border-0 transition-colors"
                        >
                          <span className="font-bold text-slate-800">{name}</span>
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {sub} — {identifier}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tambah alat yang akan dipinjam */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    Tambah Alat yang Akan Dipinjam *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Alat</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {borrowItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex-1">
                        <select
                          value={item.equipmentId}
                          onChange={(e) => handleItemEqChange(index, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-xs"
                        >
                          {equipment.map((eq) => (
                            <option key={eq.id} value={eq.id}>
                              {eq.name} ({eq.category}) — Siap Pakai: {eq.goodCount} unit
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min={1}
                          max={20}
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemQtyChange(index, Number(e.target.value))}
                          placeholder="Jml"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-center font-bold text-xs"
                        />
                      </div>
                      {borrowItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus baris alat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Rencana Tanggal Pengembalian *
                </label>
                <input
                  type="date"
                  required
                  value={returnDueDate}
                  onChange={(e) => setReturnDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Keperluan / Judul Praktikum *
                </label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Contoh: Praktikum Kelompok Hukum Hooke"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Kelengkapan kabel, lensa, atau penutup..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
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
