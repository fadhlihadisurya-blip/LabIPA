import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  LabSection,
  UserMode,
  LaboranUser,
  Chemical,
  Equipment,
  BorrowRecord,
  VisitRequest,
  ChemicalRequest,
  MSDSItem,
  SOPItem,
  Teacher,
  Student,
} from '../types';
import {
  INITIAL_CHEMICALS,
  INITIAL_EQUIPMENT,
  INITIAL_BORROWS,
  INITIAL_VISITS,
  INITIAL_CHEMICAL_REQUESTS,
  INITIAL_MSDS,
  INITIAL_SOPS,
  INITIAL_TEACHERS,
  INITIAL_STUDENTS,
} from '../data/initialData';

interface LabContextType {
  activeSection: LabSection;
  setActiveSection: (section: LabSection) => void;
  userMode: UserMode;
  setUserMode: (mode: UserMode) => void;
  toggleUserMode: () => void;

  currentUser: FirebaseUser | null;
  signInGoogle: () => Promise<void>;
  signOutGoogle: () => Promise<void>;
  isFirebaseConnected: boolean;
  laboranUser: LaboranUser;
  loginAsLaboran: (email?: string, name?: string) => void;
  logoutLaboran: () => void;
  loginWithEmailPassword: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  registerWithEmailPassword: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ success: boolean; error?: string }>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  chemicals: Chemical[];
  addChemical: (item: Omit<Chemical, 'id'>) => Promise<void>;
  updateChemical: (id: string, item: Partial<Chemical>) => Promise<void>;
  adjustChemicalStock: (id: string, delta: number, note?: string) => Promise<void>;
  deleteChemical: (id: string) => Promise<void>;

  equipment: Equipment[];
  addEquipment: (item: Omit<Equipment, 'id'>) => Promise<void>;
  updateEquipment: (id: string, item: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;

  borrows: BorrowRecord[];
  addBorrow: (item: Omit<BorrowRecord, 'id' | 'borrowDate'>) => Promise<void>;
  approveBorrow: (id: string) => Promise<void>;
  returnBorrow: (
    id: string,
    condition: 'Kembali (Baik)' | 'Kembali (Rusak/Pecah)',
    notes?: string
  ) => Promise<void>;
  rejectBorrow: (id: string, reason?: string) => Promise<void>;

  visits: VisitRequest[];
  addVisit: (item: Omit<VisitRequest, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateVisitStatus: (
    id: string,
    status: VisitRequest['status'],
    laboranNotes?: string
  ) => Promise<void>;

  chemicalRequests: ChemicalRequest[];
  addChemicalRequest: (
    item: Omit<ChemicalRequest, 'id' | 'status' | 'createdAt'>
  ) => Promise<void>;
  approveChemicalRequest: (id: string) => Promise<void>;
  rejectChemicalRequest: (id: string, reason?: string) => Promise<void>;

  msdsList: MSDSItem[];
  sopList: SOPItem[];

  teachers: Teacher[];
  addTeacher: (item: Omit<Teacher, 'id'>) => Promise<void>;
  updateTeacher: (id: string, item: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;

  students: Student[];
  addStudent: (item: Omit<Student, 'id'>) => Promise<void>;
  updateStudent: (id: string, item: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  resetToDefaultData: () => Promise<void>;
  clearCurrentMonthBorrows: () => Promise<void>;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

const DEFAULT_LABORAN: LaboranUser = {
  email: 'fadhlihadisurya@gmail.com',
  name: 'Fadhli Hadi Surya',
  role: 'Kepala Laboran IPA SMAIT As-Syifa',
  nip: '198904122014021003',
  isLoggedIn: true,
};

export const LabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<LabSection>('dashboard');
  const [userMode, setUserMode] = useState<UserMode>('laboran');
  const [laboranUser, setLaboranUser] = useState<LaboranUser>(DEFAULT_LABORAN);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [chemicals, setChemicals] = useState<Chemical[]>(INITIAL_CHEMICALS);
  const [equipment, setEquipment] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [borrows, setBorrows] = useState<BorrowRecord[]>(INITIAL_BORROWS);
  const [visits, setVisits] = useState<VisitRequest[]>(INITIAL_VISITS);
  const [chemicalRequests, setChemicalRequests] = useState<ChemicalRequest[]>(
    INITIAL_CHEMICAL_REQUESTS
  );

  const [msdsList] = useState<MSDSItem[]>(INITIAL_MSDS);
  const [sopList] = useState<SOPItem[]>(INITIAL_SOPS);

  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);

  // Monitor Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email) {
        setLaboranUser({
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          role: 'Kepala Laboran IPA SMAIT As-Syifa',
          nip: '198904122014021003',
          isLoggedIn: true,
        });
        setUserMode('laboran');
      }
    });
    return () => unsubscribe();
  }, []);

  // Test Firestore Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        setIsFirebaseConnected(true);
      } catch (error) {
        console.warn('Firestore connection check completed (running in offline/resilient mode):', error);
        setIsFirebaseConnected(false);
      }
    }
    testConnection();
  }, []);

  // Real-time synchronization with Firestore
  useEffect(() => {
    // 1. Chemicals listener & seed
    const unsubChem = onSnapshot(
      collection(db, 'chemicals'),
      async (snapshot) => {
        if (snapshot.empty) {
          // Auto-seed initial chemicals if empty in Firestore
          for (const item of INITIAL_CHEMICALS) {
            try {
              await setDoc(doc(db, 'chemicals', item.id), item);
            } catch (err) {
              console.warn('Seeding chemical failed:', err);
            }
          }
        } else {
          const list: Chemical[] = [];
          snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as Chemical));
          setChemicals(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'chemicals');
      }
    );

    // 2. Equipment listener & seed
    const unsubEq = onSnapshot(
      collection(db, 'equipment'),
      async (snapshot) => {
        if (snapshot.empty) {
          for (const item of INITIAL_EQUIPMENT) {
            try {
              await setDoc(doc(db, 'equipment', item.id), item);
            } catch (err) {
              console.warn('Seeding equipment failed:', err);
            }
          }
        } else {
          const list: Equipment[] = [];
          snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as Equipment));
          setEquipment(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'equipment');
      }
    );

    // 3. Borrows listener & seed
    const unsubBorrows = onSnapshot(
      collection(db, 'borrows'),
      async (snapshot) => {
        if (snapshot.empty) {
          for (const item of INITIAL_BORROWS) {
            try {
              await setDoc(doc(db, 'borrows', item.id), item);
            } catch (err) {
              console.warn('Seeding borrow failed:', err);
            }
          }
        } else {
          const list: BorrowRecord[] = [];
          snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as BorrowRecord));
          setBorrows(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'borrows');
      }
    );

    // 4. Visits listener & seed
    const unsubVisits = onSnapshot(
      collection(db, 'visits'),
      async (snapshot) => {
        if (snapshot.empty) {
          for (const item of INITIAL_VISITS) {
            try {
              await setDoc(doc(db, 'visits', item.id), item);
            } catch (err) {
              console.warn('Seeding visit failed:', err);
            }
          }
        } else {
          const list: VisitRequest[] = [];
          snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as VisitRequest));
          setVisits(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'visits');
      }
    );

    // 5. Chemical Requests listener & seed
    const unsubChemReq = onSnapshot(
      collection(db, 'chemical_requests'),
      async (snapshot) => {
        if (snapshot.empty) {
          for (const item of INITIAL_CHEMICAL_REQUESTS) {
            try {
              await setDoc(doc(db, 'chemical_requests', item.id), item);
            } catch (err) {
              console.warn('Seeding chemical request failed:', err);
            }
          }
        } else {
          const list: ChemicalRequest[] = [];
          snapshot.forEach((d) =>
            list.push({ ...d.data(), id: d.id } as ChemicalRequest)
          );
          setChemicalRequests(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'chemical_requests');
      }
    );

    // 6. Teachers listener & seed
    const unsubTeachers = onSnapshot(
      collection(db, 'teachers'),
      async (snapshot) => {
        if (snapshot.empty) {
          for (const item of INITIAL_TEACHERS) {
            try {
              await setDoc(doc(db, 'teachers', item.id), item);
            } catch (err) {
              console.warn('Seeding teachers failed:', err);
            }
          }
        } else {
          const list: Teacher[] = [];
          snapshot.forEach((d) =>
            list.push({ ...d.data(), id: d.id } as Teacher)
          );
          setTeachers(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'teachers');
      }
    );

    // 7. Students listener & seed
    const unsubStudents = onSnapshot(
      collection(db, 'students'),
      async (snapshot) => {
        if (snapshot.empty) {
          for (const item of INITIAL_STUDENTS) {
            try {
              await setDoc(doc(db, 'students', item.id), item);
            } catch (err) {
              console.warn('Seeding students failed:', err);
            }
          }
        } else {
          const list: Student[] = [];
          snapshot.forEach((d) =>
            list.push({ ...d.data(), id: d.id } as Student)
          );
          setStudents(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'students');
      }
    );

    return () => {
      unsubChem();
      unsubEq();
      unsubBorrows();
      unsubVisits();
      unsubChemReq();
      unsubTeachers();
      unsubStudents();
    };
  }, []);

  const toggleUserMode = () => {
    setUserMode((prev) => {
      const nextMode = prev === 'portal-umum' ? 'laboran' : 'portal-umum';
      if (nextMode === 'portal-umum' && activeSection === 'database-guru-murid') {
        setActiveSection('dashboard');
      }
      return nextMode;
    });
  };

  const signInGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setUserMode('laboran');
    } catch (err) {
      console.error('Google sign-in error:', err);
    }
  };

  const loginAsLaboran = (
    email: string = 'fadhlihadisurya@gmail.com',
    name: string = 'Fadhli Hadi Surya'
  ) => {
    setLaboranUser({
      email,
      name,
      role: 'Kepala Laboran IPA SMAIT As-Syifa',
      nip: '198904122014021003',
      isLoggedIn: true,
    });
    setUserMode('laboran');
  };

  const logoutLaboran = () => {
    setLaboranUser((prev) => ({ ...prev, isLoggedIn: false }));
    setUserMode('portal-umum');
    if (activeSection === 'database-guru-murid') {
      setActiveSection('dashboard');
    }
  };

  const loginWithEmailPassword = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setLaboranUser({
        email: user.email || email,
        name: user.displayName || (email.toLowerCase().includes('fadhli') ? 'Fadhli Hadi Surya' : email.split('@')[0]),
        role: 'Kepala Laboran IPA (Email/Password Auth)',
        nip: '198904122014021003',
        isLoggedIn: true,
      });
      setUserMode('laboran');
      return { success: true };
    } catch (err: any) {
      console.error('Email login error:', err);
      let errorMsg = 'Gagal masuk. Periksa kembali email dan kata sandi Anda.';
      if (err.code === 'auth/operation-not-allowed') {
        errorMsg = 'Metode Email/Password belum diaktifkan di Firebase Console (Authentication > Sign-in method > Email/Password).';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Email atau kata sandi tidak cocok. Pastikan email dan kata sandi yang dimasukkan sudah benar.';
      } else if (err.code === 'auth/wrong-password') {
        errorMsg = 'Kata sandi salah. Silakan coba kembali.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Format email tidak valid.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    }
  };

  const registerWithEmailPassword = async (
    email: string,
    password: string,
    name: string = 'Fadhli Hadi Surya'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (name) {
        try {
          await updateProfile(user, { displayName: name });
        } catch (_) {}
      }
      setLaboranUser({
        email: user.email || email,
        name: name || user.displayName || email.split('@')[0],
        role: 'Kepala Laboran IPA (Email/Password Auth)',
        nip: '198904122014021003',
        isLoggedIn: true,
      });
      setUserMode('laboran');
      return { success: true };
    } catch (err: any) {
      console.error('Email register error:', err);
      let errorMsg = 'Gagal mendaftarkan akun laboran.';
      if (err.code === 'auth/operation-not-allowed') {
        errorMsg = 'Metode Email/Password belum diaktifkan di Firebase Console (Authentication > Sign-in method > Email/Password).';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'Email ini sudah terdaftar. Silakan pilih tab Masuk (Login) menggunakan kata sandi Anda.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Kata sandi terlalu pendek. Gunakan minimal 6 karakter.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    }
  };

  const signOutGoogle = async () => {
    try {
      await signOut(auth);
      logoutLaboran();
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  // Helper to ensure no undefined fields are passed to Firestore
  const cleanFirestoreData = <T extends Record<string, any>>(data: T): T => {
    const clean: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          clean[key] = cleanFirestoreData(value);
        } else {
          clean[key] = value;
        }
      }
    }
    return clean;
  };

  // Chemical Actions
  const addChemical = async (item: Omit<Chemical, 'id'>) => {
    const id = `ch-${Date.now()}`;
    const newChem: Chemical = { ...item, id };
    try {
      await setDoc(doc(db, 'chemicals', id), cleanFirestoreData(newChem));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chemicals/${id}`);
    }
  };

  const updateChemical = async (id: string, updates: Partial<Chemical>) => {
    try {
      await updateDoc(doc(db, 'chemicals', id), cleanFirestoreData(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chemicals/${id}`);
    }
  };

  const adjustChemicalStock = async (id: string, delta: number) => {
    const target = chemicals.find((c) => c.id === id);
    if (!target) return;
    const newStock = Math.max(0, target.stock + delta);
    try {
      await updateDoc(doc(db, 'chemicals', id), { stock: newStock });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chemicals/${id}`);
    }
  };

  const deleteChemical = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'chemicals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `chemicals/${id}`);
    }
  };

  // Equipment Actions
  const addEquipment = async (item: Omit<Equipment, 'id'>) => {
    const id = `eq-${Date.now()}`;
    const newEq: Equipment = { ...item, id };
    try {
      await setDoc(doc(db, 'equipment', id), cleanFirestoreData(newEq));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `equipment/${id}`);
    }
  };

  const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
    try {
      await updateDoc(doc(db, 'equipment', id), cleanFirestoreData(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `equipment/${id}`);
    }
  };

  const deleteEquipment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'equipment', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `equipment/${id}`);
    }
  };

  // Borrow Actions
  const addBorrow = async (item: Omit<BorrowRecord, 'id' | 'borrowDate'>) => {
    const id = `br-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const newBorrow: BorrowRecord = { ...item, id, borrowDate: today };
    try {
      await setDoc(doc(db, 'borrows', id), cleanFirestoreData(newBorrow));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `borrows/${id}`);
    }
  };

  const approveBorrow = async (id: string) => {
    const target = borrows.find((b) => b.id === id);
    if (!target) return;

    try {
      await updateDoc(doc(db, 'borrows', id), { status: 'Dipinjam' });

      // decrement good count & increment borrowed count
      const eqTarget = equipment.find((e) => e.id === target.equipmentId);
      if (eqTarget) {
        await updateDoc(doc(db, 'equipment', eqTarget.id), {
          goodCount: Math.max(0, eqTarget.goodCount - target.quantity),
          borrowedCount: eqTarget.borrowedCount + target.quantity,
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `borrows/${id}`);
    }
  };

  const returnBorrow = async (
    id: string,
    condition: 'Kembali (Baik)' | 'Kembali (Rusak/Pecah)',
    notes?: string
  ) => {
    const target = borrows.find((b) => b.id === id);
    if (!target) return;
    const today = new Date().toISOString().split('T')[0];

    try {
      const updates: Record<string, any> = {
        status: condition,
        actualReturnDate: today,
      };
      if (notes && notes.trim()) {
        updates.notes = `${target.notes || ''} [Pengembalian: ${notes.trim()}]`.trim();
      } else if (target.notes) {
        updates.notes = target.notes;
      }

      await updateDoc(doc(db, 'borrows', id), cleanFirestoreData(updates));

      const eqTarget = equipment.find((e) => e.id === target.equipmentId);
      if (eqTarget) {
        if (condition === 'Kembali (Baik)') {
          await updateDoc(doc(db, 'equipment', eqTarget.id), {
            borrowedCount: Math.max(0, eqTarget.borrowedCount - target.quantity),
            goodCount: eqTarget.goodCount + target.quantity,
          });
        } else {
          await updateDoc(doc(db, 'equipment', eqTarget.id), {
            borrowedCount: Math.max(0, eqTarget.borrowedCount - target.quantity),
            damagedCount: eqTarget.damagedCount + target.quantity,
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `borrows/${id}`);
    }
  };

  const rejectBorrow = async (id: string, reason?: string) => {
    const target = borrows.find((b) => b.id === id);
    if (!target) return;

    try {
      const updates: Record<string, any> = {
        status: 'Ditolak',
      };
      if (reason && reason.trim()) {
        updates.notes = `${target.notes || ''} [Alasan Penolakan: ${reason.trim()}]`.trim();
      } else if (target.notes) {
        updates.notes = target.notes;
      }

      await updateDoc(doc(db, 'borrows', id), cleanFirestoreData(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `borrows/${id}`);
    }
  };

  // Visit Actions
  const addVisit = async (item: Omit<VisitRequest, 'id' | 'status' | 'createdAt'>) => {
    const id = `vr-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const newVisit: VisitRequest = {
      ...item,
      id,
      status: 'Menunggu Persetujuan',
      createdAt: today,
    };
    try {
      await setDoc(doc(db, 'visits', id), cleanFirestoreData(newVisit));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `visits/${id}`);
    }
  };

  const updateVisitStatus = async (
    id: string,
    status: VisitRequest['status'],
    laboranNotes?: string
  ) => {
    try {
      const updates: Record<string, any> = { status };
      if (laboranNotes !== undefined && laboranNotes.trim() !== '') {
        updates.laboranNotes = laboranNotes.trim();
      }
      await updateDoc(doc(db, 'visits', id), cleanFirestoreData(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `visits/${id}`);
    }
  };

  // Chemical Request Actions
  const addChemicalRequest = async (
    item: Omit<ChemicalRequest, 'id' | 'status' | 'createdAt'>
  ) => {
    const id = `cr-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const newReq: ChemicalRequest = {
      ...item,
      id,
      status: 'Menunggu Persetujuan',
      createdAt: today,
    };
    try {
      await setDoc(doc(db, 'chemical_requests', id), cleanFirestoreData(newReq));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chemical_requests/${id}`);
    }
  };

  const approveChemicalRequest = async (id: string) => {
    const target = chemicalRequests.find((r) => r.id === id);
    if (!target) return;

    try {
      await updateDoc(doc(db, 'chemical_requests', id), { status: 'Disetujui' });

      // Automatically deduct chemical stock in Firestore
      for (const item of target.items) {
        const chem = chemicals.find((c) => c.id === item.chemicalId);
        if (chem) {
          const newStock = Math.max(0, chem.stock - item.requestedAmount);
          await updateDoc(doc(db, 'chemicals', chem.id), { stock: newStock });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chemical_requests/${id}`);
    }
  };

  const rejectChemicalRequest = async (id: string, reason?: string) => {
    const target = chemicalRequests.find((r) => r.id === id);
    if (!target) return;

    try {
      const updates: Record<string, any> = {
        status: 'Ditolak',
      };
      if (reason && reason.trim()) {
        updates.notes = `${target.notes || ''} [Penolakan: ${reason.trim()}]`.trim();
      } else if (target.notes) {
        updates.notes = target.notes;
      }
      await updateDoc(doc(db, 'chemical_requests', id), cleanFirestoreData(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chemical_requests/${id}`);
    }
  };

  const addTeacher = async (item: Omit<Teacher, 'id'>) => {
    const newId = `tch-${Date.now()}`;
    const newTeacher: Teacher = { ...item, id: newId };
    setTeachers((prev) => [newTeacher, ...prev]);
    try {
      await setDoc(doc(db, 'teachers', newId), cleanFirestoreData(newTeacher));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `teachers/${newId}`);
    }
  };

  const updateTeacher = async (id: string, updates: Partial<Teacher>) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    try {
      await updateDoc(doc(db, 'teachers', id), cleanFirestoreData(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `teachers/${id}`);
    }
  };

  const deleteTeacher = async (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteDoc(doc(db, 'teachers', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `teachers/${id}`);
    }
  };

  const addStudent = async (item: Omit<Student, 'id'>) => {
    const newId = `std-${Date.now()}`;
    const newStudent: Student = { ...item, id: newId };
    setStudents((prev) => [newStudent, ...prev]);
    try {
      await setDoc(doc(db, 'students', newId), cleanFirestoreData(newStudent));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `students/${newId}`);
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    try {
      await updateDoc(doc(db, 'students', id), cleanFirestoreData(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${id}`);
    }
  };

  const deleteStudent = async (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `students/${id}`);
    }
  };

  const resetToDefaultData = async () => {
    for (const c of INITIAL_CHEMICALS) {
      await setDoc(doc(db, 'chemicals', c.id), c);
    }
    for (const e of INITIAL_EQUIPMENT) {
      await setDoc(doc(db, 'equipment', e.id), e);
    }
    for (const b of INITIAL_BORROWS) {
      await setDoc(doc(db, 'borrows', b.id), b);
    }
    for (const v of INITIAL_VISITS) {
      await setDoc(doc(db, 'visits', v.id), v);
    }
    for (const cr of INITIAL_CHEMICAL_REQUESTS) {
      await setDoc(doc(db, 'chemical_requests', cr.id), cr);
    }
    for (const t of INITIAL_TEACHERS) {
      await setDoc(doc(db, 'teachers', t.id), t);
    }
    for (const s of INITIAL_STUDENTS) {
      await setDoc(doc(db, 'students', s.id), s);
    }
  };

  const clearCurrentMonthBorrows = async () => {
    const currentMonth = '2026-10';
    for (const b of borrows) {
      if (b.borrowDate.startsWith(currentMonth)) {
        await deleteDoc(doc(db, 'borrows', b.id));
      }
    }
  };

  return (
    <LabContext.Provider
      value={{
        activeSection,
        setActiveSection,
        userMode,
        setUserMode,
        toggleUserMode,
        currentUser,
        laboranUser,
        loginAsLaboran,
        logoutLaboran,
        loginWithEmailPassword,
        registerWithEmailPassword,
        isAuthModalOpen,
        setIsAuthModalOpen,
        signInGoogle,
        signOutGoogle,
        isFirebaseConnected,
        chemicals,
        addChemical,
        updateChemical,
        adjustChemicalStock,
        deleteChemical,
        equipment,
        addEquipment,
        updateEquipment,
        deleteEquipment,
        borrows,
        addBorrow,
        approveBorrow,
        returnBorrow,
        rejectBorrow,
        visits,
        addVisit,
        updateVisitStatus,
        chemicalRequests,
        addChemicalRequest,
        approveChemicalRequest,
        rejectChemicalRequest,
        msdsList,
        sopList,
        teachers,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        resetToDefaultData,
        clearCurrentMonthBorrows,
      }}
    >
      {children}
    </LabContext.Provider>
  );
};

export const useLab = () => {
  const context = useContext(LabContext);
  if (!context) {
    throw new Error('useLab must be used within a LabProvider');
  }
  return context;
};
