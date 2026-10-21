export type LabSection =
  | 'dashboard'
  | 'ajuan-kunjungan'
  | 'bahan-kimia'
  | 'ajuan-bahan'
  | 'alat-lab'
  | 'ajuan-alat'
  | 'sop'
  | 'msds'
  | 'database-guru-murid';

export type UserMode = 'portal-umum' | 'laboran';

export interface LaboranUser {
  email: string;
  name: string;
  role: string;
  nip?: string;
  isLoggedIn: boolean;
}

export type HazardType =
  | 'flammable'
  | 'corrosive'
  | 'toxic'
  | 'oxidizer'
  | 'irritant'
  | 'environmental'
  | 'safe';

export interface Chemical {
  id: string;
  code: string;
  name: string;
  formula: string;
  casNumber: string;
  form: 'Padat' | 'Cair' | 'Gas' | 'Indikator';
  stock: number;
  unit: 'gram' | 'kg' | 'mL' | 'L' | 'botol' | 'buah';
  minStock: number;
  location: string;
  hazards: HazardType[];
  expiryDate: string;
  notes?: string;
}

export interface Equipment {
  id: string;
  code: string;
  name: string;
  category:
    | 'Biokim Putra'
    | 'Fisika Putri'
    | 'Biokim Putri'
    | 'Kimia'
    | 'Fisika'
    | 'Biologi'
    | 'Umum';
  totalCount: number;
  goodCount: number;
  damagedCount: number;
  borrowedCount: number;
  location: string;
  brand?: string;
  specification?: string;
}

export interface BorrowItem {
  equipmentId: string;
  equipmentName: string;
  quantity: number;
}

export interface DamagedItemReport {
  equipmentId: string;
  equipmentName: string;
  quantity: number;
  damageType?: string;
  notes?: string;
}

export interface BorrowRecord {
  id: string;
  borrowerName: string;
  borrowerType: 'Guru' | 'Murid';
  idNumber: string; // NIP or NIS
  classOrDept: string;
  equipmentId: string;
  equipmentName: string;
  quantity: number;
  items?: BorrowItem[];
  damagedItems?: DamagedItemReport[];
  borrowDate: string; // YYYY-MM-DD
  returnDueDate: string; // YYYY-MM-DD
  actualReturnDate?: string;
  status:
    | 'Menunggu Persetujuan'
    | 'Dipinjam'
    | 'Kembali (Baik)'
    | 'Kembali (Rusak/Pecah)'
    | 'Ditolak';
  purpose: string;
  notes?: string;
}

export interface VisitRequest {
  id: string;
  visitorType?: 'Guru' | 'Murid';
  teacherName: string;
  contactNumber?: string;
  labType:
    | 'Biokim Putra'
    | 'Fisika Putri'
    | 'Biokim Putri'
    | 'Lab Kimia'
    | 'Lab Fisika'
    | 'Lab Biologi'
    | 'Lab IPA Terpadu';
  classGroup: string;
  studentCount?: number;
  practicumTitle: string;
  practicumSubject: 'Fisika' | 'Kimia' | 'Biologi' | 'Umum' | 'IPA Terpadu';
  visitDate: string;
  sessionTime: string;
  endDate?: string;
  endTime?: string;
  status: 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak' | 'Selesai';
  specialRequirements?: string;
  laboranNotes?: string;
  createdAt: string;
}

export interface ChemicalRequestItem {
  chemicalId: string;
  chemicalName: string;
  requestedAmount: number;
  unit: string;
}

export interface ChemicalRequest {
  id: string;
  teacherName: string;
  requesterType?: 'Guru' | 'Murid';
  classGroup?: string;
  practicumTitle: string;
  dateNeeded: string;
  items: ChemicalRequestItem[];
  status: 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak' | 'Selesai';
  notes?: string;
  createdAt: string;
}

export interface MSDSItem {
  id: string;
  chemicalName: string;
  formula: string;
  casNumber: string;
  hazardSignal: 'BAHAYA' | 'PERINGATAN' | 'HATI-HATI';
  hazards: HazardType[];
  hazardsDescription: string[];
  physicalProperties: {
    state: string;
    color: string;
    odor: string;
    boilingPoint?: string;
    meltingPoint?: string;
    density?: string;
  };
  firstAid: {
    eyes: string;
    skin: string;
    inhalation: string;
    ingestion: string;
  };
  firefighting: string;
  accidentalSpill: string;
  handlingStorage: string;
  requiredPpe: string[];
}

export interface SOPStep {
  type: 'text' | 'image';
  content: string;
}

export interface SOPItem {
  id: string;
  code: string;
  title: string;
  category: 'Keselamatan' | 'Peminjaman' | 'Pengelolaan B3' | 'Instrumen' | 'Kebersihan';
  summary: string;
  steps: SOPStep[] | string[];
  safetyPoints: string[];
  lastUpdated: string;
  imageUrl?: string;
}

export type TeacherSubject =
  | 'PAI'
  | 'Bahasa Indonesia'
  | 'Matematika'
  | 'Fisika'
  | 'Kimia'
  | 'Biologi'
  | 'Sosiologi'
  | 'Ekonomi'
  | 'Sejarah'
  | 'Geografi'
  | 'Bahasa Inggris'
  | 'PJOK'
  | 'Informatika'
  | 'IPA Terpadu';

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  subject: TeacherSubject | string;
  email: string;
  phone: string;
  status: 'Aktif' | 'Cuti' | 'Non-Aktif';
  totalVisits?: number;
  totalBorrow?: number;
  notes?: string;
  fingerprintStatus?: 'belum input' | 'Recorded';
}

export interface Student {
  id: string;
  nis: string;
  nisn?: string;
  name: string;
  classGroup: string;
  gender: 'L' | 'P';
  phone?: string;
  status: 'Aktif' | 'Alumni' | 'Pindah';
  notes?: string;
  roomLoanStatus?: 'Bebas' | 'Sedang Pinjam';
  roomLoanDetail?: string;
  fingerprintStatus?: 'belum input' | 'Recorded';
}
