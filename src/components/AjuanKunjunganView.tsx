import React, { useState } from 'react';
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
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { VisitRequest } from '../types';

export const AjuanKunjunganView: React.FC = () => {
  const { visits, addVisit, updateVisitStatus, userMode } = useLab();

  const [searchQuery, setSearchQuery] = useState('');
  const [labFilter, setLabFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisitForPrint, setSelectedVisitForPrint] = useState<VisitRequest | null>(null);

  // Form state
  const [teacherName, setTeacherName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [labType, setLabType] = useState<VisitRequest['labType']>('Lab Kimia');
  const [classGroup, setClassGroup] = useState('');
  const [studentCount, setStudentCount] = useState<number>(30);
  const [practicumTitle, setPracticumTitle] = useState('');
  const [practicumSubject, setPracticumSubject] = useState<VisitRequest['practicumSubject']>('Kimia');
  const [visitDate, setVisitDate] = useState('');
  const [sessionTime, setSessionTime] = useState('07.30 - 09.00 (Sesi 1)');
  const [specialRequirements, setSpecialRequirements] = useState('');

  const filteredVisits = visits.filter((v) => {
    const matchesSearch =
      v.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.practicumTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.classGroup.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLab = labFilter === 'all' || v.labType === labFilter;
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesLab && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName || !classGroup || !practicumTitle || !visitDate) {
      alert('Mohon lengkapi formulir pengajuan kunjungan');
      return;
    }

    const visitPayload: Omit<VisitRequest, 'id' | 'status' | 'createdAt'> = {
      teacherName,
      contactNumber: contactNumber || '0812-XXXX-XXXX',
      labType,
      classGroup,
      studentCount: Number(studentCount) || 30,
      practicumTitle,
      practicumSubject,
      visitDate,
      sessionTime,
    };
    if (specialRequirements.trim()) {
      visitPayload.specialRequirements = specialRequirements.trim();
    }

    addVisit(visitPayload);

    setIsModalOpen(false);
    // Reset form
    setTeacherName('');
    setClassGroup('');
    setPracticumTitle('');
    setVisitDate('');
    setSpecialRequirements('');
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
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-2xs shrink-0"
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
            placeholder="Cari guru, materi praktikum, kelas..."
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

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-800">{item.teacherName}</span>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.classGroup} ({item.studentCount} siswa)</span>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono tabular-nums">{item.visitDate}</span>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.sessionTime}</span>
                    </div>
                  </div>

                  {item.specialRequirements && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-medium text-slate-700">Kebutuhan Alat/Reagen:</span> {item.specialRequirements}
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

                  {/* Laboran verification buttons */}
                  {userMode === 'laboran' && item.status === 'Menunggu Persetujuan' && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const note = prompt('Catatan persetujuan dari Laboran (opsional):', 'Ruang lab dan alat siap digunakan');
                          updateVisitStatus(item.id, 'Disetujui', note || undefined);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Setujui
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const reason = prompt('Alasan penolakan / jadwal bentrok:', 'Jadwal bentrok dengan kelas lain');
                          if (reason) {
                            updateVisitStatus(item.id, 'Ditolak', reason);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md text-xs font-medium transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Tolak
                      </button>
                    </div>
                  )}

                  {/* Print Slip */}
                  <button
                    type="button"
                    onClick={() => setSelectedVisitForPrint(item)}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors mt-1"
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
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Guru / Penanggung Jawab *
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="Contoh: Ustadz Ahmad Fauzi, M.Pd"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

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
                    onChange={(e) => setPracticumSubject(e.target.value as VisitRequest['practicumSubject'])}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas / Rombongan Belajar *
                  </label>
                  <input
                    type="text"
                    required
                    value={classGroup}
                    onChange={(e) => setClassGroup(e.target.value)}
                    placeholder="Contoh: XI MIPA 1 (Putra)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Siswa (Orang) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={studentCount}
                    onChange={(e) => setStudentCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Praktikum *
                  </label>
                  <input
                    type="date"
                    required
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Sesi *
                  </label>
                  <select
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="07.30 - 09.00 (Sesi 1)">07.30 - 09.00 (Sesi 1)</option>
                    <option value="09.15 - 10.45 (Sesi 2)">09.15 - 10.45 (Sesi 2)</option>
                    <option value="11.00 - 12.00 (Sesi 3)">11.00 - 12.00 (Sesi 3)</option>
                    <option value="13.00 - 14.30 (Sesi 4)">13.00 - 14.30 (Sesi 4)</option>
                    <option value="15.30 - 17.00 (Ekstrakulikuler KIR)">15.30 - 17.00 (Ekstrakulikuler KIR)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kebutuhan Khusus / Persiapan Alat & Bahan Tambahan
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
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
                >
                  Kirim Ajuan
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
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
                <p className="font-bold text-sm text-slate-900">{selectedVisitForPrint.practicumTitle}</p>
                <p className="text-slate-600 font-medium">{selectedVisitForPrint.labType} · Mapel {selectedVisitForPrint.practicumSubject}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[11px]">Guru Pengampu:</span>
                  <span className="font-semibold text-slate-800">{selectedVisitForPrint.teacherName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Kelas & Siswa:</span>
                  <span className="font-semibold text-slate-800">{selectedVisitForPrint.classGroup} ({selectedVisitForPrint.studentCount} siswa)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tanggal Praktikum:</span>
                  <span className="font-semibold text-slate-800">{selectedVisitForPrint.visitDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Waktu Sesi:</span>
                  <span className="font-semibold text-slate-800">{selectedVisitForPrint.sessionTime}</span>
                </div>
              </div>

              {selectedVisitForPrint.specialRequirements && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Kebutuhan Khusus:</span>
                  <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">{selectedVisitForPrint.specialRequirements}</p>
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
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
