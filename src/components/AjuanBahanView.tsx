import React, { useState, useEffect, useRef } from 'react';
import {
  FilePlus2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  FlaskConical,
  Trash2,
  X,
  Check,
  GraduationCap,
  User,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { ChemicalRequest, ChemicalRequestItem } from '../types';
import { formatDate } from '../utils/dateUtils';

export const AjuanBahanView: React.FC = () => {
  const {
    chemicalRequests,
    addChemicalRequest,
    approveChemicalRequest,
    rejectChemicalRequest,
    chemicals,
    userMode,
    teachers,
    students,
  } = useLab();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [requesterType, setRequesterType] = useState<'Guru' | 'Murid'>('Guru');
  const [teacherName, setTeacherName] = useState('');
  const [practicumTitle, setPracticumTitle] = useState('');
  const [dateNeeded, setDateNeeded] = useState('');
  const [notes, setNotes] = useState('');
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

  // Filtered teachers/students for combobox
  const filteredTeachers = teachers.filter((t) => {
    if (!teacherName) return true;
    const q = teacherName.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      (t.nip && t.nip.includes(q))
    );
  });

  const filteredStudents = students.filter((s) => {
    if (!teacherName) return true;
    const q = teacherName.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.classGroup && s.classGroup.toLowerCase().includes(q)) ||
      (s.nis && s.nis.toLowerCase().includes(q))
    );
  });

  const matchedTeacher = teachers.find(
    (t) => t.name.toLowerCase() === teacherName.trim().toLowerCase()
  );
  const matchedStudent = students.find(
    (s) => s.name.toLowerCase() === teacherName.trim().toLowerCase()
  );

  // Items selection
  const [requestedItems, setRequestedItems] = useState<ChemicalRequestItem[]>([
    {
      chemicalId: chemicals[0]?.id || '',
      chemicalName: chemicals[0]?.name || '',
      requestedAmount: 100,
      unit: chemicals[0]?.unit || 'mL',
    },
  ]);

  const filteredRequests = chemicalRequests.filter((r) => {
    const matchesSearch =
      r.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.practicumTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.classGroup ? r.classGroup.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      (r.requesterType && r.requesterType.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '') || b.id.localeCompare(a.id));

  const handleAddItemRow = () => {
    const firstChem = chemicals[0];
    if (firstChem) {
      setRequestedItems([
        ...requestedItems,
        {
          chemicalId: firstChem.id,
          chemicalName: firstChem.name,
          requestedAmount: 50,
          unit: firstChem.unit,
        },
      ]);
    }
  };

  const handleRemoveItemRow = (index: number) => {
    setRequestedItems(requestedItems.filter((_, i) => i !== index));
  };

  const handleItemChemChange = (index: number, chemicalId: string) => {
    const targetChem = chemicals.find((c) => c.id === chemicalId);
    if (!targetChem) return;

    setRequestedItems(
      requestedItems.map((item, i) =>
        i === index
          ? {
              ...item,
              chemicalId: targetChem.id,
              chemicalName: targetChem.name,
              unit: targetChem.unit,
            }
          : item
      )
    );
  };

  const handleItemAmountChange = (index: number, amount: number) => {
    setRequestedItems(
      requestedItems.map((item, i) =>
        i === index ? { ...item, requestedAmount: Number(amount) || 0 } : item
      )
    );
  };

  const handleRequesterTypeChange = (type: 'Guru' | 'Murid') => {
    setRequesterType(type);
    setTeacherName('');
    setIsDropdownOpen(false);
  };

  const handleSelectPerson = (name: string) => {
    setTeacherName(name);
    setIsDropdownOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !practicumTitle.trim() || !dateNeeded) {
      alert('Mohon lengkapi nama pemohon, judul praktikum, dan tanggal dibutuhkan');
      return;
    }

    if (requestedItems.length === 0) {
      alert('Mohon pilih minimal satu bahan yang diminta');
      return;
    }

    const calculatedClassGroup =
      requesterType === 'Murid'
        ? matchedStudent?.classGroup || '-'
        : matchedTeacher
        ? `Guru ${matchedTeacher.subject}`
        : '-';

    const requestPayload: Omit<ChemicalRequest, 'id' | 'status' | 'createdAt'> = {
      teacherName: teacherName.trim(),
      requesterType,
      classGroup: calculatedClassGroup,
      practicumTitle: practicumTitle.trim(),
      dateNeeded,
      items: requestedItems,
    };
    if (notes.trim()) {
      requestPayload.notes = notes.trim();
    }

    addChemicalRequest(requestPayload);

    setIsModalOpen(false);
    // Reset form
    setRequesterType('Guru');
    setTeacherName('');
    setPracticumTitle('');
    setDateNeeded('');
    setNotes('');
    setIsDropdownOpen(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Ajuan Bahan & Reagen Praktikum
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengajuan kebutuhan zat kimia habis pakai untuk praktikum kelas dan karya ilmiah.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ajukan Bahan Praktikum</span>
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
            placeholder="Cari guru, judul praktikum, kelas..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
        >
          <option value="all">Semua Status</option>
          <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
          <option value="Disetujui">Disetujui</option>
          <option value="Ditolak">Ditolak</option>
        </select>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="py-16 text-center">
            <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium text-sm">Belum ada pengajuan bahan praktikum</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan tombol ajukan bahan di atas untuk membuat permintaan baru.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      {req.practicumTitle}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                      {req.requesterType === 'Murid' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <User className="w-2.5 h-2.5 text-emerald-600" /> Murid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <GraduationCap className="w-2.5 h-2.5 text-blue-600" /> Guru
                        </span>
                      )}
                      <span className="font-semibold text-slate-900">{req.teacherName}</span>
                      {req.classGroup && req.classGroup !== '-' && (
                        <span className="text-slate-500">({req.classGroup})</span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      Dibutuhkan: <span className="font-mono font-medium">{formatDate(req.dateNeeded)}</span>
                    </span>
                  </div>

                  {/* Chemical items breakdown */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                    <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Rincian Bahan yang Diminta:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {req.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between shadow-2xs"
                        >
                          <span className="text-slate-800 font-medium truncate mr-2" title={item.chemicalName}>
                            {item.chemicalName}
                          </span>
                          <span className="font-mono font-bold text-blue-600 tabular-nums shrink-0">
                            {item.requestedAmount} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {req.notes && (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700">Keterangan:</span> {req.notes}
                    </p>
                  )}
                </div>

                {/* Status & Laboran Actions */}
                <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end shrink-0">
                  {req.status === 'Disetujui' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Disetujui (Stok Dipotong)
                    </span>
                  )}
                  {req.status === 'Menunggu Persetujuan' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> Menunggu Laboran
                    </span>
                  )}
                  {req.status === 'Ditolak' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                      <XCircle className="w-3.5 h-3.5 text-red-600" /> Ditolak
                    </span>
                  )}

                  {/* Laboran action */}
                  {userMode === 'laboran' && req.status === 'Menunggu Persetujuan' && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Setujui pengajuan bahan untuk ${req.teacherName}? Sistem akan secara otomatis mengurangi kuantitas bahan dari stok inventaris.`
                            )
                          ) {
                            approveChemicalRequest(req.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-colors shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Setujui & Potong Stok</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const reason = prompt('Alasan penolakan / stok reagen tidak mencukupi:');
                          if (reason) rejectChemicalRequest(req.id, reason);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md text-xs font-semibold transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Tolak
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Ajukan Bahan Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-blue-600" />
                  Permohonan Pengambilan Bahan Kimia Praktikum
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pengajuan kebutuhan zat & reagen praktikum laboratorium IPA
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Radio Pilihan Guru atau Murid */}
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pilihan Pemohon Bahan <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-xl cursor-pointer text-xs font-semibold transition-all border ${
                      requesterType === 'Guru'
                        ? 'bg-blue-50/90 text-blue-700 border-blue-400 shadow-2xs ring-2 ring-blue-500/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <input
                      type="radio"
                      name="requesterType"
                      value="Guru"
                      checked={requesterType === 'Guru'}
                      onChange={() => handleRequesterTypeChange('Guru')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Guru IPA</span>
                  </label>

                  <label
                    className={`flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-xl cursor-pointer text-xs font-semibold transition-all border ${
                      requesterType === 'Murid'
                        ? 'bg-emerald-50/90 text-emerald-700 border-emerald-400 shadow-2xs ring-2 ring-emerald-500/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <input
                      type="radio"
                      name="requesterType"
                      value="Murid"
                      checked={requesterType === 'Murid'}
                      onChange={() => handleRequesterTypeChange('Murid')}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <User className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Murid / Siswa</span>
                  </label>
                </div>
              </div>

              {/* Data Pemohon: Searchable Dropdown / Combobox */}
              <div className="relative" ref={comboboxRef}>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {requesterType === 'Guru' ? 'Nama Guru Pembimbing *' : 'Nama Siswa / Murid *'}
                  <span className="text-slate-400 font-normal ml-1.5">
                    (bisa pilih dari dropdown atau ketik langsung untuk mencari)
                  </span>
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>

                  <input
                    type="text"
                    required
                    value={teacherName}
                    onFocus={() => setIsDropdownOpen(true)}
                    onClick={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setTeacherName(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    placeholder={
                      requesterType === 'Guru'
                        ? 'Pilih atau ketik nama guru IPA...'
                        : 'Pilih atau ketik nama siswa / rombel...'
                    }
                    className="w-full pl-9 pr-16 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder:text-slate-400 font-medium shadow-2xs transition-all"
                  />

                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                    {teacherName && (
                      <button
                        type="button"
                        onClick={() => {
                          setTeacherName('');
                          setIsDropdownOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                        title="Hapus teks"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="p-1.5 text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                      title="Buka daftar pilihan"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isDropdownOpen ? 'rotate-180 text-blue-600' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Dropdown Menu Popover */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1.5 bg-slate-50/90 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between sticky top-0 z-10 backdrop-blur-xs">
                      <span>
                        Daftar {requesterType === 'Guru' ? 'Guru IPA' : 'Siswa Terdaftar'}
                      </span>
                      <span>
                        {requesterType === 'Guru'
                          ? `${filteredTeachers.length} Guru`
                          : `${filteredStudents.length} Siswa`}
                      </span>
                    </div>

                    {requesterType === 'Guru' ? (
                      filteredTeachers.length > 0 ? (
                        filteredTeachers.map((t) => {
                          const isSelected = t.name.toLowerCase() === teacherName.toLowerCase();
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => handleSelectPerson(t.name)}
                              className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-blue-50/80 transition-colors ${
                                isSelected ? 'bg-blue-50/90 text-blue-900 font-semibold' : 'text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <GraduationCap
                                  className={`w-4 h-4 shrink-0 ${
                                    isSelected ? 'text-blue-600' : 'text-slate-400'
                                  }`}
                                />
                                <div className="truncate">
                                  <p className="font-semibold text-slate-900 truncate">{t.name}</p>
                                  <p className="text-[11px] text-slate-500">
                                    Guru {t.subject} {t.nip ? `· NIP: ${t.nip}` : ''}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-3 text-xs text-slate-500 text-center">
                          Tidak ditemukan guru dengan kata kunci "{teacherName}".
                          <br />
                          <span className="text-[11px] text-slate-400">
                            Nama yang diketik akan tetap digunakan sebagai pemohon.
                          </span>
                        </div>
                      )
                    ) : (
                      filteredStudents.length > 0 ? (
                        filteredStudents.map((s) => {
                          const isSelected = s.name.toLowerCase() === teacherName.toLowerCase();
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleSelectPerson(s.name)}
                              className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-emerald-50/80 transition-colors ${
                                isSelected
                                  ? 'bg-emerald-50/90 text-emerald-900 font-semibold'
                                  : 'text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <User
                                  className={`w-4 h-4 shrink-0 ${
                                    isSelected ? 'text-emerald-600' : 'text-slate-400'
                                  }`}
                                />
                                <div className="truncate">
                                  <p className="font-semibold text-slate-900 truncate">{s.name}</p>
                                  <p className="text-[11px] text-slate-500">
                                    Kelas <span className="font-medium text-emerald-700">{s.classGroup}</span>
                                    {s.nis ? ` · NIS: ${s.nis}` : ''}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-3 text-xs text-slate-500 text-center">
                          Tidak ditemukan murid dengan kata kunci "{teacherName}".
                          <br />
                          <span className="text-[11px] text-slate-400">
                            Nama yang diketik akan tetap digunakan sebagai pemohon.
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Status Validasi / Info Terpilih dari Database */}
                {matchedTeacher && requesterType === 'Guru' && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-blue-700 bg-blue-50/80 px-2.5 py-1.5 rounded-lg border border-blue-200/60 font-medium animate-in fade-in duration-150">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>
                      Terpilih dari Database Guru: <b>{matchedTeacher.name}</b> (Guru {matchedTeacher.subject})
                    </span>
                  </div>
                )}

                {matchedStudent && requesterType === 'Murid' && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200/60 font-medium animate-in fade-in duration-150">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Terpilih dari Database Siswa: <b>{matchedStudent.name}</b> · Kelas <b>{matchedStudent.classGroup}</b>
                      {matchedStudent.nis ? ` (NIS: ${matchedStudent.nis})` : ''}
                    </span>
                  </div>
                )}

                {!matchedTeacher && !matchedStudent && teacherName.trim() && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      Nama pemohon: <b>{teacherName}</b>
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Judul Percobaan / Praktikum *
                  </label>
                  <input
                    type="text"
                    required
                    value={practicumTitle}
                    onChange={(e) => setPracticumTitle(e.target.value)}
                    placeholder="Contoh: Reaksi Pembentukan Endapan & Kelarutan"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Tanggal Dibutuhkan * <span className="text-[10px] text-slate-400 font-normal">(dd-mm-yyyy)</span>
                    </label>
                    {dateNeeded && (
                      <span className="text-[10px] font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        {formatDate(dateNeeded)}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    required
                    value={dateNeeded}
                    onChange={(e) => setDateNeeded(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Chemical items picker */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-800">
                    Daftar Bahan & Takaran yang Dibutuhkan *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris Bahan
                  </button>
                </div>

                <div className="space-y-2">
                  {requestedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <select
                        value={item.chemicalId}
                        onChange={(e) => handleItemChemChange(idx, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {chemicals.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.category ? `[${c.category}]` : ''} (Stok: {c.stock} {c.unit})
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1 w-32">
                        <input
                          type="number"
                          min={1}
                          required
                          value={item.requestedAmount}
                          onChange={(e) => handleItemAmountChange(idx, Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono tabular-nums text-right"
                        />
                        <span className="text-xs text-slate-500 w-10 shrink-0 font-medium">
                          {item.unit}
                        </span>
                      </div>

                      {requestedItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan untuk Laboran
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Mohon disediakan di botol tetes berlabel..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  Kirim Pengajuan Bahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
