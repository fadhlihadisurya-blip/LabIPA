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
  BorrowItem,
  DamagedItemReport,
  VisitRequest,
  ChemicalRequest,
  MSDSItem,
  SOPItem,
  Teacher,
  Student,
} from '../types';
import { formatDate } from '../utils/dateUtils';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}
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
  addEquipment: (item: Omit<Equipment, 'id'>, customId?: string) => Promise<void>;
  updateEquipment: (id: string, item: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;

  borrows: BorrowRecord[];
  addBorrow: (item: Omit<BorrowRecord, 'id' | 'borrowDate'>) => Promise<void>;
  approveBorrow: (id: string) => Promise<void>;
  returnBorrow: (
    id: string,
    condition: 'Kembali (Baik)' | 'Kembali (Rusak/Pecah)',
    notes?: string,
    damagedItems?: DamagedItemReport[]
  ) => Promise<void>;
  rejectBorrow: (id: string, reason?: string) => Promise<void>;
  deleteBorrow: (id: string) => Promise<void>;

  visits: VisitRequest[];
  addVisit: (item: Omit<VisitRequest, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateVisitStatus: (
    id: string,
    status: VisitRequest['status'],
    laboranNotes?: string
  ) => Promise<void>;
  deleteVisit: (id: string) => Promise<void>;

  chemicalRequests: ChemicalRequest[];
  addChemicalRequest: (
    item: Omit<ChemicalRequest, 'id' | 'status' | 'createdAt'>
  ) => Promise<void>;
  approveChemicalRequest: (id: string) => Promise<void>;
  rejectChemicalRequest: (id: string, reason?: string) => Promise<void>;

  msdsList: MSDSItem[];
  sopList: SOPItem[];
  addSop: (item: Omit<SOPItem, 'id'>) => Promise<void>;
  updateSop: (id: string, item: Partial<SOPItem>) => Promise<void>;
  deleteSop: (id: string) => Promise<void>;

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

  telegramConfig: TelegramConfig;
  updateTelegramConfig: (config: TelegramConfig) => void;
  sendTelegramMessage: (message: string) => Promise<boolean>;
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
  const [userMode, setUserMode] = useState<UserMode>('portal-umum');
  const [laboranUser, setLaboranUser] = useState<LaboranUser>(DEFAULT_LABORAN);

  // 5 minutes inactivity timeout for laboran mode
  useEffect(() => {
    if (userMode !== 'laboran') return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 5 minutes = 300,000 ms
      timeoutId = setTimeout(() => {
        logoutLaboran();
      }, 5 * 60 * 1000);
    };

    resetTimer();

    const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [userMode]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => {
    const saved = localStorage.getItem('simlab_telegram_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return { botToken: '', chatId: '', enabled: false };
  });

  const updateTelegramConfig = (config: TelegramConfig) => {
    setTelegramConfig(config);
    localStorage.setItem('simlab_telegram_config', JSON.stringify(config));
  };

  const sendTelegramMessage = async (message: string): Promise<boolean> => {
    try {
      // 1. Direct Telegram API call if configured on client side
      if (telegramConfig.enabled && telegramConfig.botToken && telegramConfig.chatId) {
        try {
          const telegramUrl = `https://api.telegram.org/bot${telegramConfig.botToken.trim()}/sendMessage`;
          const res = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramConfig.chatId.trim(),
              text: message,
              parse_mode: 'HTML',
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.ok) return true;
          }
        } catch {
          // If direct fetch fails, proceed to /api/telegram fallback
        }
      }

      // 2. Fallback to /api/telegram (backend serverless or dev middleware)
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          botToken: telegramConfig.botToken ? telegramConfig.botToken.trim() : undefined,
          chatId: telegramConfig.chatId ? telegramConfig.chatId.trim() : undefined,
        }),
      });

      if (!res.ok) {
        return false;
      }

      const text = await res.text();
      if (!text || text.trim() === '') {
        return false;
      }

      try {
        const data = JSON.parse(text);
        return data.success === true;
      } catch {
        return false;
      }
    } catch (err) {
      console.warn('Telegram notification not sent (network or configuration):', err);
      return false;
    }
  };

  const [chemicals, setChemicals] = useState<Chemical[]>(INITIAL_CHEMICALS);
  const [equipment, setEquipment] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [borrows, setBorrows] = useState<BorrowRecord[]>(INITIAL_BORROWS);
  const [visits, setVisits] = useState<VisitRequest[]>(INITIAL_VISITS);
  const [chemicalRequests, setChemicalRequests] = useState<ChemicalRequest[]>(
    INITIAL_CHEMICAL_REQUESTS
  );

  const [msdsList] = useState<MSDSItem[]>(INITIAL_MSDS);
  const [sopList, setSopList] = useState<SOPItem[]>(INITIAL_SOPS);

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

    // 8. SOPs listener & seed
    const unsubSops = onSnapshot(
      collection(db, 'sops'),
      async (snapshot) => {
        if (snapshot.empty) {
          for (const item of INITIAL_SOPS) {
            try {
              await setDoc(doc(db, 'sops', item.id), item);
            } catch (err) {
              console.warn('Seeding sops failed:', err);
            }
          }
        } else {
          const list: SOPItem[] = [];
          snapshot.forEach((d) =>
            list.push({ ...d.data(), id: d.id } as SOPItem)
          );
          setSopList(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'sops');
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
      unsubSops();
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
  const addEquipment = async (item: Omit<Equipment, 'id'>, customId?: string) => {
    const id = customId || `eq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
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
    const newBorrow: BorrowRecord = {
      ...item,
      id,
      borrowDate: formatDate(today),
      returnDueDate: formatDate(item.returnDueDate),
    };
    try {
      await setDoc(doc(db, 'borrows', id), cleanFirestoreData(newBorrow));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `borrows/${id}`);
      return;
    }

    try {
      await sendTelegramMessage(
        `🔔 <b>AJUAN PEMINJAMAN ALAT LAB BARU</b>\n\n` +
        `👤 Peminjam: <b>${newBorrow.borrowerName}</b> (${newBorrow.borrowerType})\n` +
        `📦 Alat: <b>${newBorrow.equipmentName}</b> (Jumlah: ${newBorrow.quantity})\n` +
        `🏢 Kelas/Dept: ${newBorrow.classOrDept}\n` +
        `📅 Rencana Kembali: ${formatDate(newBorrow.returnDueDate)}\n` +
        `🎯 Keperluan: ${newBorrow.purpose}`
      );
    } catch {
      // Non-blocking notification
    }
  };

  const approveBorrow = async (id: string) => {
    const target = borrows.find((b) => b.id === id);
    if (!target) return;

    try {
      await updateDoc(doc(db, 'borrows', id), { status: 'Dipinjam' });

      // decrement good count & increment borrowed count
      const loanItems: BorrowItem[] =
        target.items && target.items.length > 0
          ? target.items
          : [
              {
                equipmentId: target.equipmentId,
                equipmentName: target.equipmentName,
                quantity: target.quantity,
              },
            ];

      for (const item of loanItems) {
        const eqTarget = equipment.find((e) => e.id === item.equipmentId);
        if (eqTarget) {
          await updateDoc(doc(db, 'equipment', eqTarget.id), {
            goodCount: Math.max(0, eqTarget.goodCount - item.quantity),
            borrowedCount: eqTarget.borrowedCount + item.quantity,
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `borrows/${id}`);
    }
  };

  const returnBorrow = async (
    id: string,
    condition: 'Kembali (Baik)' | 'Kembali (Rusak/Pecah)',
    notes?: string,
    damagedItems?: DamagedItemReport[]
  ) => {
    const target = borrows.find((b) => b.id === id);
    if (!target) return;
    const today = new Date().toISOString().split('T')[0];

    try {
      const updates: Record<string, any> = {
        status: condition,
        actualReturnDate: formatDate(today),
      };

      if (damagedItems && damagedItems.length > 0) {
        updates.damagedItems = damagedItems;
      }

      let combinedNotes = target.notes || '';
      if (condition === 'Kembali (Rusak/Pecah)' && damagedItems && damagedItems.length > 0) {
        const damageSummary = damagedItems
          .map((d) => `${d.quantity}x ${d.equipmentName}${d.damageType ? ` (${d.damageType})` : ''}`)
          .join(', ');
        combinedNotes = `${combinedNotes} [Kerusakan: ${damageSummary}]`.trim();
      }
      if (notes && notes.trim()) {
        combinedNotes = `${combinedNotes} [Pengembalian: ${notes.trim()}]`.trim();
      }
      if (combinedNotes) {
        updates.notes = combinedNotes;
      }

      await updateDoc(doc(db, 'borrows', id), cleanFirestoreData(updates));

      const loanItems: BorrowItem[] =
        target.items && target.items.length > 0
          ? target.items
          : [
              {
                equipmentId: target.equipmentId,
                equipmentName: target.equipmentName,
                quantity: target.quantity,
              },
            ];

      for (const item of loanItems) {
        const eqTarget = equipment.find((e) => e.id === item.equipmentId);
        if (eqTarget) {
          const dmgRecord =
            condition === 'Kembali (Rusak/Pecah)'
              ? damagedItems?.find((d) => d.equipmentId === item.equipmentId)
              : undefined;

          const damagedQty = dmgRecord
            ? Math.min(item.quantity, dmgRecord.quantity)
            : condition === 'Kembali (Rusak/Pecah)' && (!damagedItems || damagedItems.length === 0)
            ? item.quantity
            : 0;
          const goodQty = Math.max(0, item.quantity - damagedQty);

          await updateDoc(doc(db, 'equipment', eqTarget.id), {
            borrowedCount: Math.max(0, eqTarget.borrowedCount - item.quantity),
            goodCount: eqTarget.goodCount + goodQty,
            damagedCount: eqTarget.damagedCount + damagedQty,
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

  const deleteBorrow = async (id: string) => {
    const target = borrows.find((b) => b.id === id);
    setBorrows((prev) => prev.filter((b) => b.id !== id));
    try {
      if (target && target.status === 'Dipinjam') {
        if (target.items && target.items.length > 0) {
          for (const item of target.items) {
            const eqTarget = equipment.find((e) => e.id === item.equipmentId);
            if (eqTarget) {
              await updateDoc(doc(db, 'equipment', eqTarget.id), {
                borrowedCount: Math.max(0, eqTarget.borrowedCount - item.quantity),
                goodCount: eqTarget.goodCount + item.quantity,
              });
            }
          }
        } else {
          const eqTarget = equipment.find((e) => e.id === target.equipmentId);
          if (eqTarget) {
            await updateDoc(doc(db, 'equipment', eqTarget.id), {
              borrowedCount: Math.max(0, eqTarget.borrowedCount - target.quantity),
              goodCount: eqTarget.goodCount + target.quantity,
            });
          }
        }
      }
      await deleteDoc(doc(db, 'borrows', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `borrows/${id}`);
    }
  };

  // Visit Actions
  const addVisit = async (item: Omit<VisitRequest, 'id' | 'status' | 'createdAt'>) => {
    const id = `vr-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const newVisit: VisitRequest = {
      ...item,
      id,
      visitDate: formatDate(item.visitDate),
      endDate: formatDate(item.endDate || item.visitDate),
      status: 'Menunggu Persetujuan',
      createdAt: formatDate(today),
    };
    try {
      await setDoc(doc(db, 'visits', id), cleanFirestoreData(newVisit));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `visits/${id}`);
      return;
    }

    try {
      const formatTime = (timeStr?: string, defaultVal = '07.00 WIB') => {
        if (!timeStr || timeStr === '-') return defaultVal;
        const trimmed = timeStr.trim();
        return trimmed.toUpperCase().includes('WIB') ? trimmed : `${trimmed} WIB`;
      };

      const startDate = formatDate(newVisit.visitDate || today);
      const endDate = formatDate(newVisit.endDate || newVisit.visitDate || startDate);
      const startTime = formatTime(newVisit.sessionTime, '07.00 WIB');
      const endTime = formatTime(newVisit.endTime, '08.30 WIB');

      const classDisplay =
        newVisit.studentCount && newVisit.studentCount > 0
          ? `${newVisit.classGroup} (${newVisit.studentCount} siswa)`
          : newVisit.classGroup;

      await sendTelegramMessage(
        `🔔 <b>AJUAN KUNJUNGAN LABORATORIUM BARU</b>\n\n` +
        `👤 Pengunjung: <b>${newVisit.teacherName}</b> (${newVisit.visitorType || 'Guru'})\n` +
        `🔬 Lab: <b>${newVisit.labType}</b>\n` +
        `📚 Mapel: <b>${newVisit.practicumSubject}</b>\n` +
        `📝 Topik: ${newVisit.practicumTitle}\n` +
        `📅 Tanggal: ${startDate} (${startTime}) s/d ${endDate} (${endTime})\n` +
        `🏢 Kelas/Rombel: ${classDisplay}`
      );
    } catch {
      // Non-blocking notification
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

  const deleteVisit = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'visits', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `visits/${id}`);
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
      dateNeeded: formatDate(item.dateNeeded),
      status: 'Menunggu Persetujuan',
      createdAt: formatDate(today),
    };
    try {
      await setDoc(doc(db, 'chemical_requests', id), cleanFirestoreData(newReq));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chemical_requests/${id}`);
      return;
    }

    try {
      const itemsSummary = newReq.items.map(i => `- ${i.chemicalName}: ${i.requestedAmount} ${i.unit}`).join('\n');
      await sendTelegramMessage(
        `🔔 <b>AJUAN BAHAN PRAKTIKUM BARU</b>\n\n` +
        `👤 Pemohon: <b>${newReq.teacherName}</b>\n` +
        `📝 Praktikum: ${newReq.practicumTitle}\n` +
        `📅 Tanggal Butuh: ${formatDate(newReq.dateNeeded)}\n\n` +
        `🧪 <b>Daftar Bahan:</b>\n${itemsSummary}`
      );
    } catch {
      // Non-blocking notification
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

  const addSop = async (item: Omit<SOPItem, 'id'>) => {
    const id = `sop-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const newSop: SOPItem = {
      ...item,
      id,
      lastUpdated: formatDate(today),
    };
    setSopList((prev) => [...prev, newSop]);
    try {
      await setDoc(doc(db, 'sops', id), cleanFirestoreData(newSop));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `sops/${id}`);
    }
  };

  const updateSop = async (id: string, updates: Partial<SOPItem>) => {
    const today = new Date().toISOString().split('T')[0];
    const formattedToday = formatDate(today);
    setSopList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates, lastUpdated: formattedToday } : s))
    );
    try {
      await updateDoc(doc(db, 'sops', id), cleanFirestoreData({ ...updates, lastUpdated: formattedToday }));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sops/${id}`);
    }
  };

  const deleteSop = async (id: string) => {
    setSopList((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, 'sops', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sops/${id}`);
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
      if (b.borrowDate && (b.borrowDate.includes(currentMonth) || b.borrowDate.endsWith('10-2026'))) {
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
        deleteBorrow,
        visits,
        addVisit,
        updateVisitStatus,
        deleteVisit,
        chemicalRequests,
        addChemicalRequest,
        approveChemicalRequest,
        rejectChemicalRequest,
        msdsList,
        sopList,
        addSop,
        updateSop,
        deleteSop,
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
        telegramConfig,
        updateTelegramConfig,
        sendTelegramMessage,
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
