import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  Search,
  Plus,
  Download,
  Printer,
  Edit3,
  Trash2,
  Phone,
  Mail,
  FlaskConical,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Clock,
  Filter,
  Eye,
  ShieldCheck,
  Building2,
  Upload,
  FileUp,
  AlertCircle,
  Check,
  Fingerprint,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { Teacher, TeacherSubject, Student, BorrowRecord } from '../types';

export const TEACHER_SUBJECT_OPTIONS = [
  'PAI',
  'Bahasa Indonesia',
  'Matematika',
  'Fisika',
  'Kimia',
  'Biologi',
  'Sosiologi',
  'Ekonomi',
  'Sejarah',
  'Geografi',
  'Bahasa Inggris',
  'PJOK',
  'Informatika',
] as const;

export const STUDENT_CLASS_OPTIONS = [
  '10 Abu Bakar',
  '10 Umar',
  '10 Utsman',
  '10 Ali',
  '11 MIPA 1',
  '11 MIPA 2',
  '11 MIPA 3',
  '11 IPS',
  '12 MIPA 1',
  '12 MIPA 2',
  '12 MIPA 3',
  '12 IPS',
] as const;

// Robust CSV Parsing functions (supports comma and semicolon delimiters, and quoted strings)
function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): string[][] {
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }
  const rawLines = cleanText.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (rawLines.length === 0) return [];
  const firstLine = rawLines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';
  return rawLines.map((line) => parseCSVLine(line, delimiter));
}

export const DatabaseGuruMuridView: React.FC = () => {
  const {
    teachers,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    borrows,
    visits,
  } = useLab();

  const [activeTab, setActiveTab] = useState<'guru' | 'murid'>('guru');

  // Search & Filter States for Guru
  const [teacherSearch, setTeacherSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<string>('all');

  // Search & Filter States for Murid
  const [studentSearch, setStudentSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [studentBorrowFilter, setStudentBorrowFilter] = useState<string>('all');
  const [studentRoomFilter, setStudentRoomFilter] = useState<string>('all');

  // Modal States
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Student active borrows inspect modal
  const [inspectStudentBorrows, setInspectStudentBorrows] = useState<{
    student: Student;
    activeBorrows: BorrowRecord[];
  } | null>(null);

  // Student room loan inspect modal
  const [inspectStudentRoom, setInspectStudentRoom] = useState<{
    student: Student;
    roomDetail: string;
  } | null>(null);

  // CSV Import States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTarget, setImportTarget] = useState<'guru' | 'murid'>('guru');
  const [importFileName, setImportFileName] = useState('');
  const [parsedTeachers, setParsedTeachers] = useState<
    Array<{ name: string; subject: string; notes?: string }>
  >([]);
  const [parsedStudents, setParsedStudents] = useState<
    Array<{
      name: string;
      nis: string;
      classGroup: string;
      gender: 'L' | 'P';
      status: 'Aktif' | 'Alumni' | 'Pindah';
    }>
  >([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccessMessage, setImportSuccessMessage] = useState('');

  // Form states for Teacher
  const [teacherName, setTeacherName] = useState('');
  const [teacherNip, setTeacherNip] = useState('');
  const [teacherSubject, setTeacherSubject] = useState<Teacher['subject']>('Kimia');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherStatus, setTeacherStatus] = useState<Teacher['status']>('Aktif');
  const [teacherNotes, setTeacherNotes] = useState('');

  // Form states for Student (NISN, no HP, and Catatan removed per requirement)
  const [studentName, setStudentName] = useState('');
  const [studentNis, setStudentNis] = useState('');
  const [studentClass, setStudentClass] = useState<string>(STUDENT_CLASS_OPTIONS[0]);
  const [studentGender, setStudentGender] = useState<'L' | 'P'>('L');
  const [studentStatus, setStudentStatus] = useState<Student['status']>('Aktif');
  const [studentRoomLoanStatus, setStudentRoomLoanStatus] = useState<'Bebas' | 'Sedang Pinjam'>('Bebas');
  const [studentRoomLoanDetail, setStudentRoomLoanDetail] = useState('');

  // Helper for student active borrows
  const getStudentActiveBorrows = (studentNameStr: string) => {
    return borrows.filter(
      (b) =>
        b.borrowerName.toLowerCase().trim() === studentNameStr.toLowerCase().trim() &&
        b.status === 'Dipinjam'
    );
  };

  // Helper for teacher active borrows
  const getTeacherActiveBorrows = (teacherNameStr: string) => {
    return borrows.filter(
      (b) =>
        b.borrowerName.toLowerCase().trim() === teacherNameStr.toLowerCase().trim() &&
        b.status === 'Dipinjam'
    );
  };

  // Helper for student room loan status
  const getStudentRoomLoan = (student: Student) => {
    if (student.roomLoanStatus === 'Sedang Pinjam') {
      return {
        isBorrowing: true,
        detail: student.roomLoanDetail || 'Ruang Lab IPA',
      };
    }
    if (student.roomLoanStatus === 'Bebas') {
      return {
        isBorrowing: false,
        detail: '',
      };
    }
    // Fallback: check if student's class matches an approved lab visit
    const activeVisit = visits.find(
      (v) =>
        v.status === 'Disetujui' &&
        (v.classGroup.toLowerCase().includes(student.classGroup.toLowerCase()) ||
          student.classGroup.toLowerCase().includes(v.classGroup.toLowerCase()))
    );
    if (activeVisit) {
      return {
        isBorrowing: true,
        detail: `${activeVisit.labType} (${activeVisit.practicumTitle || activeVisit.sessionTime})`,
      };
    }
    return {
      isBorrowing: false,
      detail: '',
    };
  };

  // Helper for teacher visits count
  const getTeacherVisitsCount = (tName: string) => {
    return visits.filter(
      (v) => v.teacherName.toLowerCase().includes(tName.toLowerCase())
    ).length;
  };

  // Filtered teachers
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.subject.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(teacherSearch.toLowerCase())) ||
      t.nip.toLowerCase().includes(teacherSearch.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || t.subject === subjectFilter;
    const matchesStatus = teacherStatusFilter === 'all' || t.status === teacherStatusFilter;
    return matchesSearch && matchesSubject && matchesStatus;
  });

  // Filtered students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.nis.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.nisn ? s.nisn.toLowerCase().includes(studentSearch.toLowerCase()) : false) ||
      s.classGroup.toLowerCase().includes(studentSearch.toLowerCase());

    const matchesClass =
      classFilter === 'all'
        ? true
        : classFilter === 'X' || classFilter === '10'
        ? (s.classGroup.startsWith('10') || (s.classGroup.startsWith('X') && !s.classGroup.startsWith('XI') && !s.classGroup.startsWith('XII')))
        : classFilter === 'XI' || classFilter === '11'
        ? (s.classGroup.startsWith('11') || s.classGroup.startsWith('XI'))
        : classFilter === 'XII' || classFilter === '12'
        ? (s.classGroup.startsWith('12') || s.classGroup.startsWith('XII'))
        : s.classGroup === classFilter;

    const activeBorrows = getStudentActiveBorrows(s.name);
    const matchesBorrow =
      studentBorrowFilter === 'all'
        ? true
        : studentBorrowFilter === 'borrowing'
        ? activeBorrows.length > 0
        : activeBorrows.length === 0;

    const roomLoan = getStudentRoomLoan(s);
    const matchesRoom =
      studentRoomFilter === 'all'
        ? true
        : studentRoomFilter === 'borrowing'
        ? roomLoan.isBorrowing
        : !roomLoan.isBorrowing;

    return matchesSearch && matchesClass && matchesBorrow && matchesRoom;
  });

  // Open Teacher Modal
  const openAddTeacherModal = () => {
    setEditingTeacher(null);
    setTeacherName('');
    setTeacherNip('');
    setTeacherSubject('Kimia');
    setTeacherEmail('');
    setTeacherPhone('');
    setTeacherStatus('Aktif');
    setTeacherNotes('');
    setIsTeacherModalOpen(true);
  };

  const openEditTeacherModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setTeacherName(teacher.name);
    setTeacherNip(teacher.nip);
    setTeacherSubject(teacher.subject);
    setTeacherEmail(teacher.email);
    setTeacherPhone(teacher.phone);
    setTeacherStatus(teacher.status);
    setTeacherNotes(teacher.notes || '');
    setIsTeacherModalOpen(true);
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) {
      alert('Mohon isi nama lengkap guru.');
      return;
    }

    const finalNip = teacherNip.trim() || `199${Math.floor(10000000000000 + Math.random() * 90000000000000)}`;

    if (editingTeacher) {
      await updateTeacher(editingTeacher.id, {
        name: teacherName.trim(),
        nip: finalNip,
        subject: teacherSubject,
        email: teacherEmail,
        phone: teacherPhone,
        status: teacherStatus,
        notes: teacherNotes.trim(),
      });
    } else {
      await addTeacher({
        name: teacherName.trim(),
        nip: finalNip,
        subject: teacherSubject,
        email: teacherEmail || `${finalNip}@assyifa.sch.id`,
        phone: teacherPhone || '0812-XXXX-XXXX',
        status: teacherStatus,
        notes: teacherNotes.trim(),
        totalVisits: 0,
        totalBorrow: 0,
      });
    }
    setIsTeacherModalOpen(false);
  };

  // Open Student Modal
  const openAddStudentModal = () => {
    setEditingStudent(null);
    setStudentName('');
    setStudentNis('');
    setStudentClass(STUDENT_CLASS_OPTIONS[0]);
    setStudentGender('L');
    setStudentStatus('Aktif');
    setStudentRoomLoanStatus('Bebas');
    setStudentRoomLoanDetail('');
    setIsStudentModalOpen(true);
  };

  const openEditStudentModal = (student: Student) => {
    setEditingStudent(student);
    setStudentName(student.name);
    setStudentNis(student.nis);
    setStudentClass(student.classGroup || STUDENT_CLASS_OPTIONS[0]);
    setStudentGender(student.gender);
    setStudentStatus(student.status);
    setStudentRoomLoanStatus(student.roomLoanStatus || 'Bebas');
    setStudentRoomLoanDetail(student.roomLoanDetail || '');
    setIsStudentModalOpen(true);
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert('Mohon isi nama lengkap siswa.');
      return;
    }

    const finalNis = studentNis.trim() || `${Math.floor(212210000 + Math.random() * 90000)}`;

    if (editingStudent) {
      await updateStudent(editingStudent.id, {
        name: studentName.trim(),
        nis: finalNis,
        classGroup: studentClass.trim(),
        gender: studentGender,
        status: studentStatus,
        roomLoanStatus: studentRoomLoanStatus,
        roomLoanDetail: studentRoomLoanStatus === 'Sedang Pinjam' ? studentRoomLoanDetail.trim() : '',
      });
    } else {
      await addStudent({
        name: studentName.trim(),
        nis: finalNis,
        classGroup: studentClass.trim(),
        gender: studentGender,
        status: studentStatus,
        roomLoanStatus: studentRoomLoanStatus,
        roomLoanDetail: studentRoomLoanStatus === 'Sedang Pinjam' ? studentRoomLoanDetail.trim() : '',
      });
    }
    setIsStudentModalOpen(false);
  };

  // Export CSV
  const exportTeachersCSV = () => {
    const headers = ['No', 'Nama Lengkap', 'Mata Pelajaran', 'Catatan Tambahan'];
    const rows = filteredTeachers.map((t, idx) => [
      idx + 1,
      `"${t.name}"`,
      `"${t.subject}"`,
      `"${t.notes || '-'}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Database_Guru_IPA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportStudentsCSV = () => {
    const headers = [
      'No',
      'Nama Siswa',
      'NIS',
      'Kelas',
      'Jenis Kelamin',
      'Status Siswa',
    ];
    const rows = filteredStudents.map((s, idx) => {
      return [
        idx + 1,
        `"${s.name}"`,
        `"${s.nis}"`,
        `"${s.classGroup}"`,
        s.gender,
        `"${s.status || 'Aktif'}"`,
      ];
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Database_Murid_Sains_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download sample CSV templates for Guru & Murid
  const downloadTeacherTemplateCSV = () => {
    const csvContent =
      '\uFEFF' +
      [
        'Nama Lengkap,Mata Pelajaran,Catatan Tambahan',
        '"Ustadzah Maryam, S.Pd",Kimia,"Koordinator Praktikum Kimia"',
        '"Ustadz Fatih Pratama, S.Si",Fisika,"Pembina OSN Fisika"',
        '"Ustadzah Nur Halimah, S.Pd",Biologi,"Pengampu Biologi Kelas 10 & 11"',
        '"Ustadz Rahmat Hidayat, S.Kom",Informatika,"Pembina Lab Komputer"',
        '"Ustadz Abdullah, Lc",PAI,"Guru Pendidikan Agama Islam"',
      ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Import_Guru.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadStudentTemplateCSV = () => {
    const csvContent =
      '\uFEFF' +
      [
        'Nama Siswa,NIS,Kelas,Jenis Kelamin,Status Siswa',
        '"Ahmad Fauzi","212210001","10 Abu Bakar","L","Aktif"',
        '"Fatimah Azzahra","212210002","10 Umar","P","Aktif"',
        '"Muhammad Zaki","212210003","11 MIPA 1","L","Aktif"',
        '"Nurul Izzah","212210004","11 MIPA 2","P","Aktif"',
        '"Raihan Pratama","212210005","12 MIPA 1","L","Aktif"',
        '"Siti Aisyah","212210006","12 IPS","P","Aktif"',
      ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Import_Murid.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse uploaded CSV file
  const handleCSVFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportError('');
    setImportSuccessMessage('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) {
          setImportError('File CSV kosong.');
          return;
        }

        const rows = parseCSV(text);
        if (rows.length === 0) {
          setImportError('File CSV tidak memiliki baris data.');
          return;
        }

        if (importTarget === 'guru') {
          // Detect headers
          const headerRow = rows[0].map((h) => h.toLowerCase().trim());
          const hasHeader = headerRow.some(
            (h) =>
              h.includes('nama') ||
              h.includes('guru') ||
              h.includes('mapel') ||
              h.includes('pelajaran') ||
              h.includes('subject')
          );

          let nameIdx = 0;
          let subjectIdx = 1;
          let notesIdx = 2;

          if (hasHeader) {
            headerRow.forEach((h, idx) => {
              if (h.includes('nama') || h.includes('guru')) nameIdx = idx;
              else if (
                h.includes('mapel') ||
                h.includes('pelajaran') ||
                h.includes('subject')
              )
                subjectIdx = idx;
              else if (
                h.includes('catatan') ||
                h.includes('note') ||
                h.includes('keterangan')
              )
                notesIdx = idx;
            });
          }

          const dataRows = hasHeader ? rows.slice(1) : rows;
          const parsed: Array<{ name: string; subject: string; notes?: string }> = [];

          for (const row of dataRows) {
            if (!row || row.length === 0) continue;
            const name = (row[nameIdx] || '').trim().replace(/^["']|["']$/g, '');
            if (!name) continue;

            let subject = (row[subjectIdx] || '').trim().replace(/^["']|["']$/g, '');
            const matchedSubject = TEACHER_SUBJECT_OPTIONS.find(
              (s) => s.toLowerCase() === subject.toLowerCase()
            );
            if (matchedSubject) {
              subject = matchedSubject;
            } else if (!subject) {
              subject = 'Kimia';
            }

            const notes =
              notesIdx < row.length
                ? (row[notesIdx] || '').trim().replace(/^["']|["']$/g, '')
                : undefined;

            parsed.push({
              name,
              subject,
              notes: notes || undefined,
            });
          }

          if (parsed.length === 0) {
            setImportError('Tidak ada data guru valid yang ditemukan dalam file CSV.');
          }
          setParsedTeachers(parsed);
        } else {
          // Target Murid
          const headerRow = rows[0].map((h) => h.toLowerCase().trim());
          const hasHeader = headerRow.some(
            (h) =>
              h.includes('nama') ||
              h.includes('siswa') ||
              h.includes('murid') ||
              h.includes('nis') ||
              h.includes('kelas') ||
              h.includes('rombel')
          );

          let nameIdx = 0;
          let nisIdx = 1;
          let classIdx = 2;
          let genderIdx = 3;
          let statusIdx = 4;

          if (hasHeader) {
            headerRow.forEach((h, idx) => {
              if (h === 'nama siswa' || h === 'nama' || h === 'siswa' || h === 'murid') {
                nameIdx = idx;
              } else if (h === 'nis' || h === 'nomor induk' || h === 'nisn') {
                nisIdx = idx;
              } else if (h === 'kelas' || h === 'rombel' || h === 'class') {
                classIdx = idx;
              } else if (h === 'jenis kelamin' || h === 'kelamin' || h === 'gender' || h === 'jk') {
                genderIdx = idx;
              } else if (h === 'status siswa' || h === 'status') {
                statusIdx = idx;
              }
            });
          }

          const dataRows = hasHeader ? rows.slice(1) : rows;
          const parsed: Array<{
            name: string;
            nis: string;
            classGroup: string;
            gender: 'L' | 'P';
            status: 'Aktif' | 'Alumni' | 'Pindah';
          }> = [];

          for (const row of dataRows) {
            if (!row || row.length === 0) continue;
            const name = (row[nameIdx] || '').trim().replace(/^["']|["']$/g, '');
            if (!name) continue;

            const nis = (row[nisIdx] || '').trim().replace(/^["']|["']$/g, '') || `21221${Math.floor(1000 + Math.random() * 9000)}`;

            let classGroup = (row[classIdx] || '').trim().replace(/^["']|["']$/g, '');
            const matchedClass = STUDENT_CLASS_OPTIONS.find(
              (c) => c.toLowerCase() === classGroup.toLowerCase()
            );
            if (matchedClass) {
              classGroup = matchedClass;
            } else if (!classGroup) {
              classGroup = '10 Abu Bakar';
            }

            const rawGender = (row[genderIdx] || '').trim().toUpperCase();
            const gender: 'L' | 'P' =
              rawGender.startsWith('P') ||
              rawGender.includes('WANITA') ||
              rawGender.includes('PEREMPUAN')
                ? 'P'
                : 'L';

            const rawStatus = (row[statusIdx] || '').trim().toLowerCase();
            const status: 'Aktif' | 'Alumni' | 'Pindah' =
              rawStatus.includes('alumni') ? 'Alumni' : rawStatus.includes('pindah') ? 'Pindah' : 'Aktif';

            parsed.push({
              name,
              nis,
              classGroup,
              gender,
              status,
            });
          }

          if (parsed.length === 0) {
            setImportError('Tidak ada data murid valid yang ditemukan dalam file CSV.');
          }
          setParsedStudents(parsed);
        }
      } catch (err: any) {
        setImportError(`Gagal membaca file CSV: ${err?.message || err}`);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Execute import into Firestore
  const handleExecuteImport = async () => {
    setIsImporting(true);
    setImportError('');
    setImportSuccessMessage('');
    try {
      if (importTarget === 'guru') {
        if (parsedTeachers.length === 0) {
          setImportError('Tidak ada data guru yang siap diimpor.');
          setIsImporting(false);
          return;
        }

        let count = 0;
        for (const t of parsedTeachers) {
          const generatedNip = `199${Math.floor(
            10000000000000 + Math.random() * 90000000000000
          )}`;
          await addTeacher({
            name: t.name,
            nip: generatedNip,
            subject: t.subject as TeacherSubject,
            email: `${generatedNip}@assyifa.sch.id`,
            phone: '0812-XXXX-XXXX',
            status: 'Aktif',
            notes: t.notes || '',
            totalVisits: 0,
            totalBorrow: 0,
          });
          count++;
        }
        setImportSuccessMessage(`Sukses mengimpor ${count} data Guru ke database!`);
        setParsedTeachers([]);
        setImportFileName('');
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportSuccessMessage('');
        }, 1500);
      } else {
        if (parsedStudents.length === 0) {
          setImportError('Tidak ada data murid yang siap diimpor.');
          setIsImporting(false);
          return;
        }

        let count = 0;
        for (const s of parsedStudents) {
          await addStudent({
            name: s.name,
            nis: s.nis,
            classGroup: s.classGroup,
            gender: s.gender,
            status: s.status,
            roomLoanStatus: 'Bebas',
            roomLoanDetail: '',
          });
          count++;
        }
        setImportSuccessMessage(`Sukses mengimpor ${count} data Murid ke database!`);
        setParsedStudents([]);
        setImportFileName('');
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportSuccessMessage('');
        }, 1500);
      }
    } catch (err: any) {
      setImportError(`Gagal menyimpan ke database: ${err?.message || err}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Color helpers
  const getSubjectColorBadge = (subject: Teacher['subject']) => {
    switch (subject) {
      case 'Kimia':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Fisika':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Biologi':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'IPA Terpadu':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PAI':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Bahasa Indonesia':
      case 'Bahasa Inggris':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Matematika':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Informatika':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Sosiologi':
      case 'Geografi':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Ekonomi':
      case 'Sejarah':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PJOK':
        return 'bg-lime-100 text-lime-800 border-lime-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>MODUL KHUSUS LABORAN (ADMIN)</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Database Guru & Murid
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data terpadu pengajar IPA dan siswa praktikan Laboratorium IPA SMAIT As-Syifa.
          </p>
        </div>

        {/* Global Export, Import & Print Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setImportTarget(activeTab);
              setImportFileName('');
              setParsedTeachers([]);
              setParsedStudents([]);
              setImportError('');
              setImportSuccessMessage('');
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 shadow-2xs transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Import CSV</span>
          </button>
          <button
            type="button"
            onClick={activeTab === 'guru' ? exportTeachersCSV : exportStudentsCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-2xs transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak / Print</span>
          </button>
          <button
            type="button"
            onClick={activeTab === 'guru' ? openAddTeacherModal : openAddStudentModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'guru' ? 'Tambah Guru Baru' : 'Tambah Murid Baru'}</span>
          </button>
        </div>
      </div>


      {/* Main Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('guru')}
          className={`flex items-center gap-2.5 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'guru'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Data Guru</span>
          <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 font-mono">
            {teachers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('murid')}
          className={`flex items-center gap-2.5 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'murid'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Data Murid / Siswa</span>
          <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800 font-mono">
            {students.length}
          </span>
        </button>
      </div>

      {/* TAB 1: DATA GURU IPA */}
      {activeTab === 'guru' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Cari nama guru, mata pelajaran, atau catatan tambahan..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
              {teacherSearch && (
                <button
                  type="button"
                  onClick={() => setTeacherSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Filter className="w-3.5 h-3.5" />
                <span>Mapel:</span>
              </div>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="all">Semua Mata Pelajaran ({teachers.length})</option>
                {TEACHER_SUBJECT_OPTIONS.map((subj) => {
                  const count = teachers.filter((t) => t.subject === subj).length;
                  return (
                    <option key={subj} value={subj}>
                      {subj} {count > 0 ? `(${count})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Teacher List Ke Bawah */}
          {filteredTeachers.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/90 text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Tidak ada data guru yang cocok</p>
              <p className="text-xs text-slate-400">
                Coba ubah kata kunci pencarian atau sesuaikan filter mata pelajaran.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              {/* Header List Ke Bawah */}
              <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3.5 bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold items-center">
                <div className="col-span-1 text-center">No</div>
                <div className="col-span-3">Nama Lengkap</div>
                <div className="col-span-2">Mata Pelajaran</div>
                <div className="col-span-2">Status Pinjaman Alat</div>
                <div className="col-span-3">Biometrik Fingerprint</div>
                <div className="col-span-1 text-right">Aksi</div>
              </div>

              {/* List Items Ke Bawah */}
              <div className="divide-y divide-slate-100">
                {filteredTeachers.map((teacher, index) => {
                  const teacherBorrows = getTeacherActiveBorrows(teacher.name);
                  return (
                    <div
                      key={teacher.id}
                      className="p-4 sm:px-6 sm:py-4 hover:bg-blue-50/30 transition-colors flex flex-col sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center text-xs group"
                    >
                      {/* Kolom No */}
                      <div className="hidden sm:block sm:col-span-1 text-center font-mono font-semibold text-slate-400">
                        {index + 1}
                      </div>

                      {/* Kolom Nama Lengkap */}
                      <div className="sm:col-span-3 flex items-center justify-between sm:justify-start gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="sm:hidden font-mono text-[11px] font-bold text-slate-400 w-5">
                            #{index + 1}
                          </span>
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
                            {teacher.name.replace(/^(Ustadzah|Ustadz|Pak|Bu)\s+/i, '').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                              {teacher.name}
                            </h4>
                            <span className="sm:hidden text-[10px] font-medium text-slate-500 block mt-0.5">
                              {teacher.subject}
                            </span>
                          </div>
                        </div>

                        {/* Mobile Actions */}
                        <div className="flex sm:hidden items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditTeacherModal(teacher)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Data Guru"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus data guru ${teacher.name}?`)) {
                                deleteTeacher(teacher.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Data Guru"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Kolom Mata Pelajaran */}
                      <div className="mt-2 sm:mt-0 sm:col-span-2">
                        <span
                          className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-md border ${getSubjectColorBadge(
                            teacher.subject
                          )}`}
                        >
                          {teacher.subject}
                        </span>
                      </div>

                      {/* Kolom Status Pinjaman Alat */}
                      <div className="mt-2 sm:mt-0 sm:col-span-2">
                        <div className="sm:hidden text-[10px] font-semibold text-slate-500 mb-0.5">
                          Status Pinjaman Alat:
                        </div>
                        {teacherBorrows.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Sedang Pinjam ({teacherBorrows.length} Alat)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Bebas Pinjaman</span>
                          </span>
                        )}
                      </div>

                      {/* Kolom Biometrik Fingerprint */}
                      <div className="mt-2 sm:mt-0 sm:col-span-3">
                        <div className="sm:hidden text-[10px] font-semibold text-slate-500 mb-0.5">
                          Biometrik Fingerprint:
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextStatus = teacher.fingerprintStatus === 'Recorded' ? 'belum input' : 'Recorded';
                            updateTeacher(teacher.id, { fingerprintStatus: nextStatus });
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                            teacher.fingerprintStatus === 'Recorded'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                          }`}
                          title="Klik untuk mengubah status rekam fingerprint"
                        >
                          <Fingerprint className="w-3.5 h-3.5 shrink-0" />
                          <span>{teacher.fingerprintStatus === 'Recorded' ? 'Recorded' : 'belum input'}</span>
                        </button>
                      </div>

                      {/* Kolom Aksi (Desktop) */}
                      <div className="hidden sm:flex sm:col-span-1 items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditTeacherModal(teacher)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Data Guru"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus data guru ${teacher.name}?`)) {
                              deleteTeacher(teacher.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Data Guru"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DATA MURID / SISWA */}
      {activeTab === 'murid' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Cari nama murid, NIS, NISN, atau kelas..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
              {studentSearch && (
                <button
                  type="button"
                  onClick={() => setStudentSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="all">Semua Kelas ({students.length})</option>
                {STUDENT_CLASS_OPTIONS.map((c) => {
                  const count = students.filter((s) => s.classGroup === c).length;
                  return (
                    <option key={c} value={c}>
                      {c} {count > 0 ? `(${count})` : ''}
                    </option>
                  );
                })}
              </select>

              <select
                value={studentBorrowFilter}
                onChange={(e) => setStudentBorrowFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white font-medium ml-1 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Status Alat</option>
                <option value="borrowing">Sedang Pinjam Alat</option>
                <option value="free">Bebas Pinjam Alat</option>
              </select>

              <select
                value={studentRoomFilter}
                onChange={(e) => setStudentRoomFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Status Ruangan</option>
                <option value="borrowing">Sedang Pinjam Ruangan</option>
                <option value="free">Bebas Pinjam Ruangan</option>
              </select>
            </div>
          </div>

          {/* Student Table View */}
          {filteredStudents.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/90 text-slate-400 space-y-2">
              <GraduationCap className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Tidak ada data siswa yang cocok</p>
              <p className="text-xs text-slate-400">
                Silakan sesuaikan kata kunci pencarian atau filter kelas.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-700 uppercase text-[11px] tracking-wider font-bold">
                    <tr>
                      <th className="px-5 py-3.5">Nama Siswa</th>
                      <th className="px-5 py-3.5">Kelas</th>
                      <th className="px-5 py-3.5">Gender</th>
                      <th className="px-5 py-3.5">Status Pinjaman Alat</th>
                      <th className="px-5 py-3.5">Biometrik Fingerprint</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredStudents.map((student) => {
                      const activeBorrows = getStudentActiveBorrows(student.name);
                      const roomLoan = getStudentRoomLoan(student);
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Nama Siswa */}
                          <td className="px-5 py-3.5 font-semibold text-slate-900">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg ${
                                  student.gender === 'L'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-pink-100 text-pink-700'
                                } font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs`}
                              >
                                {student.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 text-sm block truncate max-w-[220px]">
                                  {student.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  NIS: {student.nis}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Kelas */}
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                              {student.classGroup}
                            </span>
                          </td>

                          {/* Gender */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold font-mono ${
                                student.gender === 'L'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                  : 'bg-pink-50 text-pink-700 border border-pink-100'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  student.gender === 'L' ? 'bg-blue-500' : 'bg-pink-500'
                                }`}
                              ></span>
                              {student.gender}
                            </span>
                          </td>

                          {/* Status Pinjaman Alat */}
                          <td className="px-5 py-3.5">
                            {activeBorrows.length > 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setInspectStudentBorrows({
                                    student,
                                    activeBorrows,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
                                title="Klik untuk melihat detail alat yang dipinjam"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Sedang Pinjam ({activeBorrows.length} Alat)</span>
                                <Eye className="w-3.5 h-3.5 ml-0.5 text-amber-700" />
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Bebas Pinjaman</span>
                              </span>
                            )}
                          </td>

                          {/* Biometrik Fingerprint */}
                          <td className="px-5 py-3.5">
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = student.fingerprintStatus === 'Recorded' ? 'belum input' : 'Recorded';
                                updateStudent(student.id, { fingerprintStatus: nextStatus });
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                                student.fingerprintStatus === 'Recorded'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                              }`}
                              title="Klik untuk mengubah status rekam fingerprint"
                            >
                              <Fingerprint className="w-3.5 h-3.5 shrink-0" />
                              <span>{student.fingerprintStatus === 'Recorded' ? 'Recorded' : 'belum input'}</span>
                            </button>
                          </td>

                          {/* Aksi */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEditStudentModal(student)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Data Siswa"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Hapus data siswa ${student.name}?`)) {
                                    deleteStudent(student.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Data Siswa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Tambah / Edit Guru */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Sistem Inventarisasi & Pengelolaan Laboratorium IPA
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTeacherSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Contoh: Ustadzah Nurul Hidayah, S.Si"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={teacherSubject}
                  onChange={(e) => setTeacherSubject(e.target.value as TeacherSubject)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  <option value="PAI">PAI</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="Matematika">Matematika</option>
                  <option value="Fisika">Fisika</option>
                  <option value="Kimia">Kimia</option>
                  <option value="Biologi">Biologi</option>
                  <option value="Sosiologi">Sosiologi</option>
                  <option value="Ekonomi">Ekonomi</option>
                  <option value="Sejarah">Sejarah</option>
                  <option value="Geografi">Geografi</option>
                  <option value="Bahasa Inggris">Bahasa Inggris</option>
                  <option value="PJOK">PJOK</option>
                  <option value="Informatika">Informatika</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={teacherNotes}
                  onChange={(e) => setTeacherNotes(e.target.value)}
                  placeholder="Misal: Koordinator Praktikum Biologi, Pembina OSN, dsb."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {editingTeacher ? 'Simpan Perubahan' : 'Tambah Guru Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit Siswa */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {editingStudent ? 'Edit Data Murid' : 'Tambah Murid Baru'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Data Praktikan Laboratorium IPA
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Contoh: Muhammad Farhan Al-Ghifari"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NIS (Nomor Induk Siswa) *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentNis}
                    onChange={(e) => setStudentNis(e.target.value)}
                    placeholder="Contoh: 212210045"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kelas *
                  </label>
                  <select
                    required
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-slate-800"
                  >
                    {STUDENT_CLASS_OPTIONS.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                    {editingStudent && !STUDENT_CLASS_OPTIONS.includes(studentClass as any) && (
                      <option value={studentClass}>{studentClass} (Lainnya)</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={studentGender}
                    onChange={(e) => setStudentGender(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="L">Laki-laki (Ikhwan)</option>
                    <option value="P">Perempuan (Akhwat)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Siswa
                  </label>
                  <select
                    value={studentStatus}
                    onChange={(e) => setStudentStatus(e.target.value as Student['status'])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Alumni">Alumni</option>
                    <option value="Pindah">Pindah</option>
                  </select>
                </div>
              </div>



              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Tambah Murid Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail Peminjaman Aktif Siswa */}
      {inspectStudentBorrows && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Peminjaman Aktif: {inspectStudentBorrows.student.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Kelas: {inspectStudentBorrows.student.classGroup} · NIS: {inspectStudentBorrows.student.nis}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectStudentBorrows(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 font-medium">
                Daftar alat laboratorium yang saat ini berstatus sedang dipinjam:
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {inspectStudentBorrows.activeBorrows.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-slate-900">{b.equipmentName}</span>
                      <span className="font-mono text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                        {b.quantity} Unit
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-3">
                      <span>Pinjam: {b.borrowDate}</span>
                      <span className="text-red-700 font-semibold">Tenggat: {b.returnDueDate}</span>
                    </div>
                    {b.purpose && (
                      <p className="text-[11px] text-slate-500 italic">
                        Keperluan: "{b.purpose}"
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectStudentBorrows(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Detail Peminjaman Ruangan Siswa */}
      {inspectStudentRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Peminjaman Ruangan: {inspectStudentRoom.student.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Kelas: {inspectStudentRoom.student.classGroup} · NIS: {inspectStudentRoom.student.nis}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectStudentRoom(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-purple-50/80 border border-purple-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                    Ruangan & Agenda Lab
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 text-[10px] font-bold">
                    Aktif Dipinjam
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {inspectStudentRoom.roomDetail}
                </p>
                <div className="text-xs text-slate-600 pt-2 border-t border-purple-200/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Siswa Praktikan:</span>
                    <span className="font-semibold text-slate-800">
                      {inspectStudentRoom.student.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Kelas:</span>
                    <span className="font-semibold text-slate-800">
                      {inspectStudentRoom.student.classGroup}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Gender:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {inspectStudentRoom.student.gender}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const st = inspectStudentRoom.student;
                    setInspectStudentRoom(null);
                    openEditStudentModal(st);
                  }}
                  className="px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                >
                  Ubah Status Pinjaman Ruangan
                </button>
                <button
                  type="button"
                  onClick={() => setInspectStudentRoom(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Import CSV Guru & Murid */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    Import Data CSV {importTarget === 'guru' ? 'Guru' : 'Murid'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Tambahkan banyak data sekaligus secara instan ke sistem database
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedTeachers([]);
                  setParsedStudents([]);
                  setImportFileName('');
                  setImportError('');
                  setImportSuccessMessage('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto py-4 space-y-4 text-xs pr-1 flex-1">
              {/* Target Switcher */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setImportTarget('guru');
                    setParsedTeachers([]);
                    setParsedStudents([]);
                    setImportFileName('');
                    setImportError('');
                  }}
                  className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    importTarget === 'guru'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Import Data Guru</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImportTarget('murid');
                    setParsedTeachers([]);
                    setParsedStudents([]);
                    setImportFileName('');
                    setImportError('');
                  }}
                  className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    importTarget === 'murid'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Import Data Murid / Siswa</span>
                </button>
              </div>

              {/* Template CSV Download & Format Guide */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-blue-900 text-xs">
                      Format Kolom File CSV ({importTarget === 'guru' ? 'Guru' : 'Murid'}):
                    </span>
                    <p className="text-[11px] text-blue-800 mt-0.5">
                      {importTarget === 'guru' ? (
                        <>
                          Header: <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900">Nama Lengkap</span>,{' '}
                          <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900">Mata Pelajaran</span>,{' '}
                          <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900">Catatan Tambahan (opsional)</span>
                        </>
                      ) : (
                        <>
                          Header: <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900">Nama Siswa</span>,{' '}
                          <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900">NIS</span>,{' '}
                          <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900">Kelas</span>,{' '}
                          <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900">Jenis kelamin</span>,{' '}
                          <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900">Status Siswa</span>
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={importTarget === 'guru' ? downloadTeacherTemplateCSV : downloadStudentTemplateCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-100 border border-blue-300 text-blue-700 rounded-lg text-xs font-semibold shadow-2xs shrink-0 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Template CSV</span>
                  </button>
                </div>
                <div className="text-[10px] text-blue-600/90 italic">
                  * Didukung pemisah koma (,) maupun titik-koma (;) dari ekspor Excel.
                </div>
              </div>

              {/* File Upload Box */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Pilih File CSV:
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/30 rounded-xl p-5 text-center transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    id="csv-file-input"
                    className="hidden"
                    onChange={handleCSVFileUpload}
                  />
                  <label htmlFor="csv-file-input" className="cursor-pointer block">
                    <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <span className="text-xs font-bold text-blue-600 hover:text-blue-700">
                      Klik untuk memilih file CSV
                    </span>
                    <span className="text-xs text-slate-500"> atau drag and drop ke sini</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Maksimal ukuran file 5 MB (.csv)
                    </p>
                  </label>
                </div>

                {importFileName && (
                  <div className="mt-2 flex items-center justify-between p-2.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                    <div className="flex items-center gap-2 truncate">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{importFileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImportFileName('');
                        setParsedTeachers([]);
                        setParsedStudents([]);
                        setImportError('');
                        setImportSuccessMessage('');
                      }}
                      className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {importError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Success Alert */}
              {importSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="font-semibold">{importSuccessMessage}</span>
                </div>
              )}

              {/* Preview Table */}
              {importTarget === 'guru' && parsedTeachers.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Pratinjau Data Guru ({parsedTeachers.length} Baris Siap Diimpor)
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="p-2 w-10 text-center">No</th>
                          <th className="p-2">Nama Lengkap</th>
                          <th className="p-2">Mata Pelajaran</th>
                          <th className="p-2">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedTeachers.slice(0, 10).map((t, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 text-center text-slate-400">{i + 1}</td>
                            <td className="p-2 font-semibold text-slate-800">{t.name}</td>
                            <td className="p-2">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getSubjectColorBadge(
                                  t.subject
                                )}`}
                              >
                                {t.subject}
                              </span>
                            </td>
                            <td className="p-2 text-slate-500 truncate max-w-xs">
                              {t.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedTeachers.length > 10 && (
                    <p className="text-[11px] text-slate-500 text-center italic">
                      ...dan {parsedTeachers.length - 10} baris data guru lainnya siap diproses.
                    </p>
                  )}
                </div>
              )}

              {importTarget === 'murid' && parsedStudents.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Pratinjau Data Murid ({parsedStudents.length} Baris Siap Diimpor)
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="p-2 w-10 text-center">No</th>
                          <th className="p-2">Nama Siswa</th>
                          <th className="p-2">NIS</th>
                          <th className="p-2">Kelas</th>
                          <th className="p-2">Jenis Kelamin</th>
                          <th className="p-2">Status Siswa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedStudents.slice(0, 10).map((s, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 text-center text-slate-400">{i + 1}</td>
                            <td className="p-2 font-semibold text-slate-800">{s.name}</td>
                            <td className="p-2 font-mono text-slate-600">{s.nis}</td>
                            <td className="p-2">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                {s.classGroup}
                              </span>
                            </td>
                            <td className="p-2">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  s.gender === 'L'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {s.gender}
                              </span>
                            </td>
                            <td className="p-2 font-medium text-slate-700">
                              {s.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedStudents.length > 10 && (
                    <p className="text-[11px] text-slate-500 text-center italic">
                      ...dan {parsedStudents.length - 10} baris data murid lainnya siap diproses.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedTeachers([]);
                  setParsedStudents([]);
                  setImportFileName('');
                  setImportError('');
                  setImportSuccessMessage('');
                }}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer text-xs transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={
                  isImporting ||
                  (importTarget === 'guru'
                    ? parsedTeachers.length === 0
                    : parsedStudents.length === 0)
                }
                onClick={handleExecuteImport}
                className={`px-5 py-2 font-bold text-white rounded-xl shadow-xs text-xs flex items-center gap-2 cursor-pointer transition-all ${
                  isImporting ||
                  (importTarget === 'guru'
                    ? parsedTeachers.length === 0
                    : parsedStudents.length === 0)
                    ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {isImporting
                    ? 'Sedang Mengimpor...'
                    : importTarget === 'guru'
                    ? `Mulai Import (${parsedTeachers.length} Guru)`
                    : `Mulai Import (${parsedStudents.length} Murid)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
