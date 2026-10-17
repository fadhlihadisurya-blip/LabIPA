import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Users,
  Check,
  X,
  Printer,
  CalendarCheck,
  ChevronDown,
  GraduationCap,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { VisitRequest } from '../types';

export const START_TIME_OPTIONS = [
  '07.00',
  '07.30',
  '08.00',
  '08.30',
  '09.00',
  '09.30',
  '10.00',
  '10.30',
  '11.00',
  '11.30',
  '12.00',
  '12.30',
  '13.00',
  '13.30',
  '14.00',
  '14.30',
  '15.00',
  '15.30',
  '16.00',
  '16.30',
  '17.00',
  '17.30',
  '18.00',
  '18.30',
  '19.00',
  '19.30',
  '20.00',
  '20.30',
  '21.00',
  '21.30',
  '22.00',
];

export const AjuanKunjunganView: React.FC = () => {
  const { visits, addVisit, updateVisitStatus, deleteVisit, userMode, teachers, students } = useLab();

  const [searchQuery, setSearchQuery] = useState('');
  const [labFilter, setLabFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisitForPrint, setSelectedVisitForPrint] = useState<VisitRequest | null>(null);

  // Form state
  const [visitorType, setVisitorType] = useState<'Guru' | 'Murid'>('Guru');
  const [visitorName, setVisitorName] = useState('');
  const [labType, setLabType] = useState<VisitRequest['labType']>('Lab Kimia');
  const [classGroup, setClassGroup] = useState('');
  const [studentCount, setStudentCount] = useState<number>(30);
  const [practicumTitle, setPracticumTitle] = useState('');
  const [practicumSubject, setPracticumSubject] = useState<VisitRequest['practicumSubject']>('Kimia');
  const [visitDate, setVisitDate] = useState('');
  const [sessionTime, setSessionTime] = useState<string>('07.00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState<string>('08.30');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [isKbm, setIsKbm] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Close combobox when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVisitorTypeChange = (type: 'Guru' | 'Murid') => {
    setVisitorType(type);
    setVisitorName('');
    setClassGroup('');
    setIsDropdownOpen(false);
    setFormError(null);
  };

  // Filter visitors from teachers or students database
  const filteredVisitors =
    visitorType === 'Guru'
      ? teachers.filter((t) => {
          if (!visitorName) return true;
          const q = visitorName.toLowerCase();
          return (
            t.name.toLowerCase().includes(q) ||
            (t.subject && t.subject.toLowerCase().includes(q)) ||
            (t.nip && t.nip.toLowerCase().includes(q))
          );
        })
      : students.filter((s) => {
          if (!visitorName) return true;
          const q = visitorName.toLowerCase();
          return (
            s.name.toLowerCase().includes(q) ||
            (s.classGroup && s.classGroup.toLowerCase().includes(q)) ||
            (s.nis && s.nis.toLowerCase().includes(q))
          );
        });

  const handleSelectVisitor = (name: string, extra?: string) => {
    setVisitorName(name);
    if (visitorType === 'Murid') {
      const student = students.find((s) => s.name.toLowerCase() === name.toLowerCase());
      if (student) {
        setClassGroup(student.classGroup || 'Siswa Mandiri');
      } else if (extra) {
        setClassGroup(extra);
      } else {
        setClassGroup('Siswa Mandiri');
      }
    } else {
      const teacher = teachers.find((t) => t.name.toLowerCase() === name.toLowerCase());
      if (teacher && teacher.subject) {
        if (/kimia/i.test(teacher.subject)) {
          setPracticumSubject('Kimia');
          setLabType('Lab Kimia');
        } else if (/fisika/i.test(teacher.subject)) {
          setPracticumSubject('Fisika');
          setLabType('Lab Fisika');
        } else if (/biologi/i.test(teacher.subject)) {
          setPracticumSubject('Biologi');
          setLabType('Lab Biologi');
        } else if (/ipa/i.test(teacher.subject)) {
          setPracticumSubject('IPA Terpadu');
          setLabType('Lab IPA Terpadu');
        }
      }
    }
    setIsDropdownOpen(false);
    setFormError(null);
  };

  const handleVisitDateChange = (val: string) => {
    setVisitDate(val);
    if (!endDate || endDate < val) {
      setEndDate(val);
    }
  };

  const openModal = () => {
    setVisitorType('Guru');
    setVisitorName('');
    setIsKbm(true);
    setClassGroup('');
    setStudentCount(30);
    setPracticumTitle('');
    setPracticumSubject('Kimia');
    setLabType('Lab Kimia');
    setVisitDate('');
    setEndDate('');
    setSessionTime('07.00');
    setEndTime('08.30');
    setSpecialRequirements('');
    setFormError(null);
    setIsDropdownOpen(false);
    setIsModalOpen(true);
  };

  const filteredVisits = visits.filter((v) => {
    const matchesSearch =
      v.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.practicumTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.classGroup && v.classGroup.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLab = labFilter === 'all' || v.labType === labFilter;
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesLab && matchesStatus;
  }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '') || b.id.localeCompare(a.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) {
      setFormError(`Mohon pilih atau masukkan Nama ${visitorType}`);
      return;
    }
    if (visitorType === 'Guru' && isKbm && !classGroup.trim()) {
      setFormError('Mohon masukkan Kelas / Rombongan Belajar yang diajar');
      return;
    }
    if (!practicumTitle.trim()) {
      setFormError('Mohon isi Judul Praktikum / Topik Percobaan');
      return;
    }
    if (!visitDate) {
      setFormError('Mohon tentukan Tanggal Peminjaman');
      return;
    }

    const finalEndDate = endDate || visitDate;
    if (finalEndDate < visitDate) {
      setFormError('Tanggal Selesai tidak boleh lebih awal dari Tanggal Peminjaman');
      return;
    }

    const formattedTime = sessionTime.includes('WIB') ? sessionTime : `${sessionTime} WIB`;
    const formattedEndTime = endTime.includes('WIB') ? endTime : `${endTime} WIB`;

    const visitPayload: Omit<VisitRequest, 'id' | 'status' | 'createdAt'> = {
      visitorType,
      teacherName: visitorName.trim(),
      labType,
      classGroup: visitorType === 'Guru' ? (isKbm ? classGroup.trim() : 'Non-KBM / Guru') : (classGroup.trim() || 'Siswa Mandiri'),
      studentCount: visitorType === 'Guru' ? (isKbm ? (Number(studentCount) || 30) : 0) : 1,
      practicumTitle: practicumTitle.trim(),
      practicumSubject,
      visitDate,
      sessionTime: formattedTime,
      endDate: finalEndDate,
      endTime: formattedEndTime,
    };
    if (specialRequirements.trim()) {
      visitPayload.specialRequirements = specialRequirements.trim();
    }

    addVisit(visitPayload);

    setIsModalOpen(false);
    // Reset form
    setVisitorName('');
    setClassGroup('');
    setPracticumTitle('');
    setVisitDate('');
    setEndDate('');
    setSpecialRequirements('');
    setFormError(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Jadwal & Pengajuan Kunjungan Laboratorium
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Reservasi penggunaan ruang Lab Fisika, Lab Kimia, Lab Biologi, dan Lab IPA Terpadu.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-2xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajukan Kunjungan Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari guru/murid, materi praktikum, kelas..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={labFilter}
            onChange={(e) => setLabFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Ruang Lab</option>
            <option value="Lab Kimia">Lab Kimia</option>
            <option value="Lab Fisika">Lab Fisika</option>
            <option value="Lab Biologi">Lab Biologi</option>
            <option value="Lab IPA Terpadu">Lab IPA Terpadu</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Ditolak">Ditolak</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* List of Visit Requests */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredVisits.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium text-sm">Tidak ada jadwal kunjungan ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredVisits.map((item) => (
              <div
                key={item.id}
                className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      {item.practicumTitle}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {item.labType}
                    </span>
                    <span className="text-xs text-slate-500">
                      Mapel: {item.practicumSubject}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800">{item.teacherName}</span>
                      {item.visitorType && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            item.visitorType === 'Murid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {item.visitorType}
                        </span>
                      )}
                    </div>
                    {item.classGroup &&
                      item.classGroup !== '-' &&
                      item.classGroup !== 'Guru Pengampu' && (
                        <>
                          <span>·</span>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {item.classGroup}
                              {item.visitorType !== 'Murid' && item.studentCount && item.studentCount > 0
                                ? ` (${item.studentCount} siswa)`
                                : ''}
                            </span>
                          </div>
                        </>
                      )}
                    <span>·</span>
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Tgl Peminjaman:{' '}
                        <strong className="font-mono tabular-nums text-slate-700">
                          {item.visitDate}
                          {item.endDate && item.endDate !== item.visitDate ? ` s/d ${item.endDate}` : ''}
                        </strong>
                      </span>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Jam:{' '}
                        <strong className="font-mono text-slate-700">
                          {item.sessionTime}
                          {item.endTime ? ` - ${item.endTime}` : ''}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {item.specialRequirements && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-medium text-slate-700">Kebutuhan Alat/Reagen:</span>{' '}
                      {item.specialRequirements}
                    </p>
                  )}

                  {item.laboranNotes && (
                    <p className="text-xs text-emerald-700 bg-emerald-50/80 p-2 rounded-lg border border-emerald-100">
                      <span className="font-medium">Catatan Laboran:</span> {item.laboranNotes}
                    </p>
                  )}
                </div>

                {/* Status & Laboran Actions */}
                <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end shrink-0">
                  <div className="flex items-center gap-1.5">
                    {item.status === 'Disetujui' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Disetujui
                      </span>
                    )}
                    {item.status === 'Menunggu Persetujuan' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> Menunggu Persetujuan
                      </span>
                    )}
                    {item.status === 'Ditolak' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                        <XCircle className="w-3.5 h-3.5 text-red-600" /> Ditolak
                      </span>
                    )}
                    {item.status === 'Selesai' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                        Selesai
                      </span>
                    )}
                  </div>

                  {/* Laboran verification and management buttons */}
                  {userMode === 'laboran' && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {item.status === 'Menunggu Persetujuan' && (
                        <button
                          type="button"
                          onClick={() => {
                            const note = prompt(
                              'Catatan persetujuan dari Laboran (opsional):',
                              'Ruang lab dan alat siap digunakan'
                            );
                            updateVisitStatus(item.id, 'Disetujui', note || undefined);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Setujui
                        </button>
                      )}

                      {item.status !== 'Ditolak' && item.status !== 'Selesai' && (
                        <button
                          type="button"
                          onClick={() => {
                            const reason = prompt(
                              'Alasan penolakan / pembatalan ajuan:',
                              'Jadwal bentrok atau kegiatan lab dibatalkan'
                            );
                            if (reason !== null) {
                              updateVisitStatus(item.id, 'Ditolak', reason || 'Ditolak oleh Laboran');
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md text-xs font-medium transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Tolak
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Hapus ajuan kunjungan "${item.practicumTitle}" (${item.teacherName})?`)) {
                            deleteVisit(item.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-500" /> Hapus
                      </button>
                    </div>
                  )}

                  {/* Print Slip */}
                  <button
                    type="button"
                    onClick={() => setSelectedVisitForPrint(item)}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors mt-1 cursor-pointer"
                  >
                    <Printer className="w-3 h-3" /> Cetak Bukti Jadwal
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Buat Ajuan Kunjungan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Formulir Ajuan Kunjungan Laboratorium IPA
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center justify-between">
                <span>{formError}</span>
                <button
                  type="button"
                  onClick={() => setFormError(null)}
                  className="text-red-400 hover:text-red-700 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Tipe Pengunjung dan Nama dari Database Guru / Murid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipe Pengunjung *
                  </label>
                  <select
                    value={visitorType}
                    onChange={(e) => handleVisitorTypeChange(e.target.value as 'Guru' | 'Murid')}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Guru">Guru / Staf Pengajar</option>
                    <option value="Murid">Murid / Siswa</option>
                  </select>
                </div>

                {/* Searchable Combobox for Nama Guru / Murid */}
                <div className="relative" ref={comboboxRef}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {visitorType === 'Guru' ? 'Nama Guru *' : 'Nama Murid *'} (Ketik atau pilih)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={visitorName}
                      onChange={(e) => {
                        setVisitorName(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder={`Ketik nama ${visitorType === 'Guru' ? 'guru' : 'siswa'}...`}
                      className="w-full px-3 py-2 pr-8 text-xs border border-slate-300 rounded-lg font-semibold bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {isDropdownOpen && filteredVisitors.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {filteredVisitors.map((p) => {
                        const name = p.name;
                        const sub =
                          visitorType === 'Murid'
                            ? (p as any).classGroup
                            : (p as any).subject;
                        const identifier =
                          visitorType === 'Murid'
                            ? (p as any).nis
                            : (p as any).nip;
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleSelectVisitor(name, sub)}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs border-b border-slate-100 last:border-0 transition-colors"
                          >
                            <span className="font-bold text-slate-800">{name}</span>
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {sub} {identifier ? `— ${identifier}` : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Lab Tujuan & Mata Pelajaran */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lab Tujuan *
                  </label>
                  <select
                    value={labType}
                    onChange={(e) => setLabType(e.target.value as VisitRequest['labType'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Lab Kimia">Lab Kimia</option>
                    <option value="Lab Fisika">Lab Fisika</option>
                    <option value="Lab Biologi">Lab Biologi</option>
                    <option value="Lab IPA Terpadu">Lab IPA Terpadu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Pelajaran *
                  </label>
                  <select
                    value={practicumSubject}
                    onChange={(e) =>
                      setPracticumSubject(e.target.value as VisitRequest['practicumSubject'])
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Kimia">Kimia</option>
                    <option value="Fisika">Fisika</option>
                    <option value="Biologi">Biologi</option>
                    <option value="IPA Terpadu">IPA Terpadu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Praktikum / Topik Percobaan *
                </label>
                <input
                  type="text"
                  required
                  value={practicumTitle}
                  onChange={(e) => setPracticumTitle(e.target.value)}
                  placeholder="Contoh: Pengujian Larutan Elektrolit & Non-Elektrolit"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Kelas & Jumlah Siswa: HANYA MUNCUL JIKA PENGUNJUNG ADALAH GURU */}
              {visitorType === 'Guru' && (
                <div className="space-y-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 pb-1 border-b border-blue-100/60">
                    <input
                      type="checkbox"
                      id="kbmCheckbox"
                      checked={isKbm}
                      onChange={(e) => setIsKbm(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="kbmCheckbox" className="text-xs font-bold text-slate-800 cursor-pointer">
                      KBM (Kegiatan Belajar Mengajar)
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kelas / Rombongan Belajar {isKbm ? '*' : ''}
                      </label>
                      <input
                        type="text"
                        required={isKbm}
                        disabled={!isKbm}
                        value={isKbm ? classGroup : ''}
                        onChange={(e) => setClassGroup(e.target.value)}
                        placeholder={isKbm ? "Contoh: XI MIPA 1 (Putra)" : "Non-KBM"}
                        className={`w-full px-3 py-2 text-xs border border-slate-300 rounded-lg ${
                          !isKbm ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-800'
                        } focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Jumlah Siswa (Orang) {isKbm ? '*' : ''}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        disabled={!isKbm}
                        value={isKbm ? studentCount : 0}
                        onChange={(e) => setStudentCount(Number(e.target.value))}
                        className={`w-full px-3 py-2 text-xs border border-slate-300 rounded-lg ${
                          !isKbm ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-800'
                        } focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tanggal Peminjaman & Jam Mulai */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Peminjaman *
                  </label>
                  <input
                    type="date"
                    required
                    value={visitDate}
                    onChange={(e) => handleVisitDateChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Mulai *
                  </label>
                  <select
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {START_TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time} WIB
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Waktu mulai sesi dari 07.00 s/d 22.00
                  </p>
                </div>
              </div>

              {/* Tanggal Selesai & Jam Selesai */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Selesai *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    min={visitDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Selesai *
                  </label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {START_TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time} WIB
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Waktu selesai sesi kunjungan / praktikum
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kebutuhan Khusus / Persiapan Alat & Bahan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="Misal: Mohon disiapkan 8 set bejana kaca, kabel penghubung, larutan garam 10%..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs cursor-pointer"
                >
                  Kirim Ajuan Kunjungan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slip Modal / Print Viewer */}
      {selectedVisitForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                Bukti Jadwal Reservasi Laboratorium IPA
              </h4>
              <button
                type="button"
                onClick={() => setSelectedVisitForPrint(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
                <p className="font-bold text-sm text-slate-900">
                  {selectedVisitForPrint.practicumTitle}
                </p>
                <p className="text-slate-600 font-medium">
                  {selectedVisitForPrint.labType} · Mapel {selectedVisitForPrint.practicumSubject}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    {selectedVisitForPrint.visitorType === 'Murid'
                      ? 'Nama Siswa/Peminjam:'
                      : 'Guru Pengampu:'}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedVisitForPrint.teacherName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    {selectedVisitForPrint.visitorType === 'Murid' ? 'Kelas Siswa:' : 'Rombel / Kelas:'}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedVisitForPrint.classGroup}
                    {selectedVisitForPrint.visitorType !== 'Murid' &&
                    selectedVisitForPrint.studentCount &&
                    selectedVisitForPrint.studentCount > 0
                      ? ` (${selectedVisitForPrint.studentCount} siswa)`
                      : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tanggal Peminjaman:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedVisitForPrint.visitDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tanggal Selesai:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedVisitForPrint.endDate || selectedVisitForPrint.visitDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Jam Mulai:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedVisitForPrint.sessionTime}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Jam Selesai:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedVisitForPrint.endTime || '-'}
                  </span>
                </div>
              </div>

              {selectedVisitForPrint.specialRequirements && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Kebutuhan Khusus:</span>
                  <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                    {selectedVisitForPrint.specialRequirements}
                  </p>
                </div>
              )}

              <div className="pt-2 text-center text-slate-400 text-[11px]">
                Laboratorium IPA SMAIT As-Syifa · Verifikasi Sistem SIMLAB
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Lembar Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
