import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Plus,
  Search,
  AlertTriangle,
  Flame,
  Skull,
  Biohazard,
  ShieldCheck,
  Download,
  Edit2,
  Trash2,
  ArrowUpDown,
  BookOpen,
  X,
  FileText,
  RotateCcw,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { Chemical, HazardType } from '../types';

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

function parseHazards(raw: string): HazardType[] {
  if (!raw || !raw.trim()) return ['safe'];
  const tokens = raw.toLowerCase().split(/[,;/|]+/).map((t) => t.trim()).filter(Boolean);
  const hazards = new Set<HazardType>();

  for (const token of tokens) {
    if (token.includes('flam') || token.includes('bakar') || token.includes('api')) {
      hazards.add('flammable');
    } else if (token.includes('koros') || token.includes('corros')) {
      hazards.add('corrosive');
    } else if (token.includes('racun') || token.includes('toxic') || token.includes('b3')) {
      hazards.add('toxic');
    } else if (token.includes('oksid') || token.includes('oxid')) {
      hazards.add('oxidizer');
    } else if (token.includes('irit') || token.includes('irrit')) {
      hazards.add('irritant');
    } else if (token.includes('lingk') || token.includes('env') || token.includes('bio')) {
      hazards.add('environmental');
    } else if (token.includes('aman') || token.includes('safe') || token.includes('non-b3')) {
      hazards.add('safe');
    }
  }

  if (hazards.size === 0) return ['safe'];
  if (hazards.size > 1 && hazards.has('safe')) {
    hazards.delete('safe');
  }
  return Array.from(hazards);
}

function parseChemicalForm(raw: string): Chemical['form'] {
  const lower = (raw || '').toLowerCase().trim();
  if (
    lower.includes('padat') ||
    lower.includes('solid') ||
    lower.includes('bubuk') ||
    lower.includes('kristal') ||
    lower.includes('powder')
  ) {
    return 'Padat';
  }
  if (lower.includes('gas')) {
    return 'Gas';
  }
  if (
    lower.includes('indikator') ||
    lower.includes('indicator') ||
    lower.includes('pewarna')
  ) {
    return 'Indikator';
  }
  return 'Cair';
}

function parseChemicalUnit(raw: string, chemForm: Chemical['form']): Chemical['unit'] {
  const lower = (raw || '').toLowerCase().trim();
  if (lower === 'g' || lower === 'gram' || lower === 'gr') return 'gram';
  if (lower === 'kg' || lower === 'kilogram') return 'kg';
  if (lower === 'ml' || lower === 'mililiter' || lower === 'cc') return 'mL';
  if (lower === 'l' || lower === 'liter' || lower === 'ltr') return 'L';
  if (lower.includes('botol') || lower.includes('btl')) return 'botol';
  if (lower.includes('buah') || lower.includes('pcs') || lower.includes('unit')) return 'buah';
  return chemForm === 'Padat' ? 'gram' : 'mL';
}

/**
 * Menghasilkan Kode Bahan dengan format BHM-KIM-xxx
 * di mana xxx dimulai dari angka terkecil yang belum terpakai (001, 002, ...)
 */
export const getNextChemicalCode = (chemicalList: Chemical[]): string => {
  const usedNumbers = new Set<number>();
  const pattern = /^BHM[-_]?KIM[-_]?(\d+)/i;

  chemicalList.forEach((c) => {
    if (!c.code) return;
    const match = c.code.trim().match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0) {
        usedNumbers.add(num);
      }
      return;
    }
    const genericMatch = c.code.trim().match(/(\d+)$/);
    if (genericMatch) {
      const num = parseInt(genericMatch[1], 10);
      if (!isNaN(num) && num > 0) {
        usedNumbers.add(num);
      }
    }
  });

  let nextNum = 1;
  while (usedNumbers.has(nextNum)) {
    nextNum++;
  }

  const formattedNum = String(nextNum).padStart(3, '0');
  return `BHM-KIM-${formattedNum}`;
};

export const BahanKimiaView: React.FC = () => {
  const { chemicals, addChemical, updateChemical, adjustChemicalStock, deleteChemical, setActiveSection, userMode } = useLab();

  const [searchQuery, setSearchQuery] = useState('');
  const [hazardFilter, setHazardFilter] = useState<string>('all');
  const [formFilter, setFormFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustingChem, setAdjustingChem] = useState<Chemical | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [chemicalToDelete, setChemicalToDelete] = useState<Chemical | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // CSV Import States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [parsedChemicals, setParsedChemicals] = useState<Omit<Chemical, 'id'>[]>([]);
  const [importError, setImportError] = useState('');
  const [importSuccessMessage, setImportSuccessMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // New chemical form state - otomatis terisi kode terkecil BHM-KIM-xxx yang belum terpakai
  const [code, setCode] = useState(() => getNextChemicalCode(chemicals));
  const [name, setName] = useState('');
  const [formula, setFormula] = useState('');
  const [casNumber, setCasNumber] = useState('');
  const [form, setForm] = useState<Chemical['form']>('Cair');
  const [stock, setStock] = useState<number>(500);
  const [unit, setUnit] = useState<Chemical['unit']>('mL');
  const [minStock, setMinStock] = useState<number>(100);
  const [location, setLocation] = useState('Lemari Asam B3');
  const [selectedHazards, setSelectedHazards] = useState<HazardType[]>(['corrosive']);
  const [expiryDate, setExpiryDate] = useState('2028-12-31');
  const [notes, setNotes] = useState('');

  // Sinkronkan kode terkecil yang belum terpakai saat data chemicals diperbarui
  useEffect(() => {
    if (!isAddModalOpen) {
      setCode(getNextChemicalCode(chemicals));
    }
  }, [chemicals, isAddModalOpen]);

  const openAddModal = () => {
    setCode(getNextChemicalCode(chemicals));
    setName('');
    setFormula('');
    setCasNumber('');
    setForm('Cair');
    setStock(500);
    setUnit('mL');
    setMinStock(100);
    setLocation('Lemari Asam B3');
    setSelectedHazards(['corrosive']);
    setExpiryDate('2028-12-31');
    setNotes('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const filteredChemicals = chemicals.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.casNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesForm = formFilter === 'all' || c.form === formFilter;
    const matchesHazard = hazardFilter === 'all' || c.hazards.includes(hazardFilter as HazardType);

    return matchesSearch && matchesForm && matchesHazard;
  });

  const handleHazardToggle = (hazard: HazardType) => {
    if (selectedHazards.includes(hazard)) {
      setSelectedHazards(selectedHazards.filter((h) => h !== hazard));
    } else {
      setSelectedHazards([...selectedHazards, hazard]);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !formula.trim()) {
      setFormError('Mohon isi nama bahan kimia dan rumus kimia.');
      return;
    }
    if (!code.trim()) {
      setFormError('Mohon isi kode bahan kimia.');
      return;
    }

    const newChemicalPayload: Omit<Chemical, 'id'> = {
      code: code.trim(),
      name: name.trim(),
      formula: formula.trim(),
      casNumber: casNumber.trim() || '-',
      form,
      stock: Number(stock) || 0,
      unit,
      minStock: Number(minStock) || 50,
      location: location.trim() || 'Rak Laboratorium',
      hazards: selectedHazards.length > 0 ? selectedHazards : ['safe'],
      expiryDate: expiryDate || '2028-01-01',
    };
    if (notes.trim()) {
      newChemicalPayload.notes = notes.trim();
    }

    addChemical(newChemicalPayload);

    setIsAddModalOpen(false);
    // Reset form
    setName('');
    setFormula('');
    setCasNumber('');
    setNotes('');
    setFormError(null);
  };

  const handleStockAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingChem) return;

    const delta = adjustType === 'add' ? Number(adjustAmount) : -Number(adjustAmount);
    adjustChemicalStock(adjustingChem.id, delta);
    setAdjustingChem(null);
  };

  const exportCsv = () => {
    const headers = [
      'Kode Bahan',
      'Nama Bahan',
      'Rumus Kimia',
      'No CAS',
      'Wujud',
      'Stok',
      'Satuan',
      'Batas Min',
      'Lokasi',
      'Kadaluarsa',
      'Bahaya',
      'Catatan',
    ];
    const rows = filteredChemicals.map((c) => [
      c.code,
      `"${c.name}"`,
      `"${c.formula}"`,
      c.casNumber,
      c.form,
      c.stock,
      c.unit,
      c.minStock,
      `"${c.location}"`,
      c.expiryDate,
      `"${c.hazards.join(', ')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Inventaris_Bahan_Kimia_IPA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadChemicalTemplateCSV = () => {
    const csvContent =
      '\uFEFF' +
      [
        'Kode Bahan,Nama Bahan,Rumus Kimia,No CAS,Wujud,Stok,Satuan,Batas Min,Lokasi,Kadaluarsa,Bahaya,Catatan',
        'BHM-KIM-012,"Asam Klorida (HCl) 37%",HCl,7647-01-0,Cair,1000,mL,250,"Lemari Asam B3",2028-12-31,korosif,"Simpan di lemari berventilasi khusus"',
        'BHM-KIM-013,"Natrium Hidroksida (NaOH) Pelet",NaOH,1310-73-2,Padat,500,gram,100,"Rak Basa Padat",2029-06-30,korosif,"Higroskopis, tutup rapat"',
        'BHM-KIM-014,"Etanol (C2H5OH) 96%",C2H5OH,64-17-5,Cair,2000,mL,500,"Lemari Flammable",2027-10-15,"flammable, irritant","Jauhkan dari percikan api"',
        'BHM-KIM-015,"Indikator Fenolftalein (PP) 1%",C20H14O4,77-09-8,Indikator,250,mL,50,"Rak Indikator & Pewarna",2029-12-31,safe,"Tray larutan indikator praktikum"',
      ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Import_Bahan_Kimia_Lab_IPA.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

        // Header detection
        const headerRow = rows[0].map((h) => h.toLowerCase().trim());
        const hasHeader = headerRow.some(
          (h) =>
            h.includes('nama') ||
            h.includes('bahan') ||
            h.includes('kode') ||
            h.includes('rumus') ||
            h.includes('formula') ||
            h.includes('stok')
        );

        let codeIdx = -1;
        let nameIdx = -1;
        let formulaIdx = -1;
        let casIdx = -1;
        let formIdx = -1;
        let stockIdx = -1;
        let unitIdx = -1;
        let minStockIdx = -1;
        let locationIdx = -1;
        let expiryIdx = -1;
        let hazardIdx = -1;
        let notesIdx = -1;

        if (hasHeader) {
          headerRow.forEach((h, idx) => {
            if (h.includes('kode') || h.includes('code')) codeIdx = idx;
            else if (h.includes('nama') || h.includes('name') || h.includes('reagen')) nameIdx = idx;
            else if (h.includes('rumus') || h.includes('formula')) formulaIdx = idx;
            else if (h.includes('cas')) casIdx = idx;
            else if (h.includes('wujud') || h.includes('bentuk') || h.includes('form')) formIdx = idx;
            else if (h.includes('stok') || h.includes('stock') || h.includes('jumlah') || h.includes('qty')) stockIdx = idx;
            else if (h.includes('satuan') || h.includes('unit')) unitIdx = idx;
            else if (h.includes('min') || h.includes('batas')) minStockIdx = idx;
            else if (
              h.includes('lokasi') ||
              h.includes('location') ||
              h.includes('simpan') ||
              h.includes('rak') ||
              h.includes('lemari')
            )
              locationIdx = idx;
            else if (h.includes('kadaluarsa') || h.includes('expire') || h.includes('tgl') || h.includes('date'))
              expiryIdx = idx;
            else if (h.includes('bahaya') || h.includes('hazard') || h.includes('b3')) hazardIdx = idx;
            else if (h.includes('catatan') || h.includes('note') || h.includes('ket')) notesIdx = idx;
          });
        }

        // Positional fallback if columns are not found in header
        if (codeIdx === -1) codeIdx = 0;
        if (nameIdx === -1) nameIdx = 1;
        if (formulaIdx === -1) formulaIdx = 2;
        if (casIdx === -1) casIdx = 3;
        if (formIdx === -1) formIdx = 4;
        if (stockIdx === -1) stockIdx = 5;
        if (unitIdx === -1) unitIdx = 6;
        if (minStockIdx === -1) minStockIdx = 7;
        if (locationIdx === -1) locationIdx = 8;
        if (expiryIdx === -1) expiryIdx = 9;
        if (hazardIdx === -1) hazardIdx = 10;
        if (notesIdx === -1) notesIdx = 11;

        const dataRows = hasHeader ? rows.slice(1) : rows;
        const parsed: Omit<Chemical, 'id'>[] = [];
        const runningChemicalList = [...chemicals];

        for (const row of dataRows) {
          if (!row || row.length === 0) continue;
          const rawName = (row[nameIdx] || '').trim().replace(/^["']|["']$/g, '');
          if (!rawName) continue;

          const rawFormula = (row[formulaIdx] || '').trim().replace(/^["']|["']$/g, '') || '-';
          const rawCas = (row[casIdx] || '').trim().replace(/^["']|["']$/g, '') || '-';
          const parsedForm = parseChemicalForm(row[formIdx] || '');
          const parsedUnit = parseChemicalUnit(row[unitIdx] || '', parsedForm);
          const parsedStock = Math.max(0, parseFloat(row[stockIdx] || '0') || 0);
          const parsedMinStock = Math.max(0, parseFloat(row[minStockIdx] || '50') || 50);
          const rawLoc = (row[locationIdx] || '').trim().replace(/^["']|["']$/g, '') || 'Lemari Reagen B3';
          const rawExpiry = (row[expiryIdx] || '').trim().replace(/^["']|["']$/g, '') || '2028-12-31';
          const parsedHazards = parseHazards(row[hazardIdx] || '');
          const rawNotes = notesIdx < row.length ? (row[notesIdx] || '').trim().replace(/^["']|["']$/g, '') : '';

          // Code logic: use provided code or generate next smallest unused code
          let itemCode = (row[codeIdx] || '').trim().replace(/^["']|["']$/g, '');
          if (!itemCode) {
            itemCode = getNextChemicalCode(runningChemicalList);
          }

          const newChem: Omit<Chemical, 'id'> = {
            code: itemCode,
            name: rawName,
            formula: rawFormula,
            casNumber: rawCas,
            form: parsedForm,
            stock: parsedStock,
            unit: parsedUnit,
            minStock: parsedMinStock,
            location: rawLoc,
            hazards: parsedHazards,
            expiryDate: rawExpiry,
            notes: rawNotes || undefined,
          };

          parsed.push(newChem);
          runningChemicalList.push({ ...newChem, id: `temp-${parsed.length}` });
        }

        if (parsed.length === 0) {
          setImportError('Tidak ada baris data bahan kimia yang valid ditemukan dalam file CSV.');
        } else {
          setParsedChemicals(parsed);
        }
      } catch (err: any) {
        setImportError(`Gagal membaca file CSV: ${err?.message || 'Format tidak valid'}`);
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteImport = async () => {
    if (parsedChemicals.length === 0) return;
    setIsImporting(true);
    setImportError('');
    try {
      for (let i = 0; i < parsedChemicals.length; i++) {
        const item = parsedChemicals[i];
        await addChemical(item);
      }
      setImportSuccessMessage(
        `Berhasil mengimpor ${parsedChemicals.length} data reagen/bahan kimia ke database!`
      );
      setTimeout(() => {
        setIsImportModalOpen(false);
        setParsedChemicals([]);
        setImportFileName('');
        setImportSuccessMessage('');
        setIsImporting(false);
      }, 1500);
    } catch (err: any) {
      setImportError(
        `Terjadi kesalahan saat menyimpan data: ${err?.message || 'Error tidak diketahui'}`
      );
      setIsImporting(false);
    }
  };

  const renderHazardBadge = (hazard: HazardType) => {
    switch (hazard) {
      case 'flammable':
        return (
          <span key={hazard} className="inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            <Flame className="w-3 h-3 text-amber-600" /> Flammable
          </span>
        );
      case 'corrosive':
        return (
          <span key={hazard} className="inline-flex items-center gap-0.5 text-[11px] font-medium text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-600" /> Korosif
          </span>
        );
      case 'toxic':
        return (
          <span key={hazard} className="inline-flex items-center gap-0.5 text-[11px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
            <Skull className="w-3 h-3 text-purple-600" /> Beracun
          </span>
        );
      case 'oxidizer':
        return (
          <span key={hazard} className="inline-flex items-center gap-0.5 text-[11px] font-medium text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
            Oksidator
          </span>
        );
      case 'environmental':
        return (
          <span key={hazard} className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            <Biohazard className="w-3 h-3 text-emerald-600" /> Bahaya Lingkungan
          </span>
        );
      case 'irritant':
        return (
          <span key={hazard} className="inline-flex items-center gap-0.5 text-[11px] font-medium text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">
            Iritan
          </span>
        );
      case 'safe':
        return (
          <span key={hazard} className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
            <ShieldCheck className="w-3 h-3 text-slate-500" /> Non-B3
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Inventarisasi Reagen & Bahan Kimia Laboratorium
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan stok bahan habis pakai, simbol bahaya GHS B3, lokasi lemari reagen, dan kadaluarsa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userMode === 'laboran' && (
            <button
              type="button"
              onClick={() => {
                setIsImportModalOpen(true);
                setParsedChemicals([]);
                setImportFileName('');
                setImportError('');
                setImportSuccessMessage('');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Import CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>

          {userMode === 'laboran' && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Bahan Kimia</span>
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
            placeholder="Cari nama, rumus (HCl), kode, CAS..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={formFilter}
            onChange={(e) => setFormFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Wujud</option>
            <option value="Cair">Cair</option>
            <option value="Padat">Padat</option>
            <option value="Indikator">Indikator</option>
            <option value="Gas">Gas</option>
          </select>

          <select
            value={hazardFilter}
            onChange={(e) => setHazardFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Tingkat Bahaya</option>
            <option value="corrosive">Korosif</option>
            <option value="flammable">Flammable (Mudah Terbakar)</option>
            <option value="toxic">Beracun / Toxic</option>
            <option value="oxidizer">Oksidator</option>
            <option value="safe">Non-B3 / Aman</option>
          </select>
        </div>
      </div>

      {/* Chemicals Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Kode & Bahan Kimia</th>
                <th className="px-3 py-3.5">Rumus / CAS</th>
                <th className="px-3 py-3.5">Wujud</th>
                <th className="px-4 py-3.5 text-right">Stok Fisik</th>
                <th className="px-4 py-3.5">Bahaya GHS</th>
                <th className="px-4 py-3.5">Lokasi Simpan</th>
                <th className="px-4 py-3.5">Kadaluarsa</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChemicals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada bahan kimia yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredChemicals.map((c) => {
                  const isLowStock = c.stock <= c.minStock;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 text-xs">{c.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{c.code}</div>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-medium text-slate-800">{c.formula}</span>
                        <div className="text-[11px] text-slate-400">CAS: {c.casNumber}</div>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="text-slate-600 font-medium">{c.form}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="font-mono font-bold tabular-nums text-slate-900">
                          {c.stock.toLocaleString('id-ID')} {c.unit}
                        </div>
                        {isLowStock ? (
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1 py-0.2 rounded inline-block">
                            Stok Menipis (min {c.minStock})
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">min {c.minStock} {c.unit}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {c.hazards.map((h) => renderHazardBadge(h))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 text-[11px] max-w-[150px] truncate" title={c.location}>
                        {c.location}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono tabular-nums text-[11px] text-slate-500">
                        {c.expiryDate}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Stock adjustment button */}
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingChem(c);
                              setAdjustAmount(100);
                              setAdjustType('add');
                            }}
                            className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Sesuaikan Stok (+/-)"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick link to MSDS */}
                          <button
                            type="button"
                            onClick={() => setActiveSection('msds')}
                            className="p-1 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Lihat MSDS Lembar Keselamatan"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setChemicalToDelete(c)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Hapus Bahan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Penyesuaian Stok */}
      {adjustingChem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                Sesuaikan Stok Reagen
              </h4>
              <button
                type="button"
                onClick={() => setAdjustingChem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustSubmit} className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-800">{adjustingChem.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Stok saat ini: {adjustingChem.stock} {adjustingChem.unit}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                    adjustType === 'add'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  + Tambah (Masuk)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('subtract')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                    adjustType === 'subtract'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  - Kurangi (Pakai)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah ({adjustingChem.unit})
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustingChem(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Bahan Kimia Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                Tambah Reagen / Bahan Kimia Baru
              </h4>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
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

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Kode Bahan *
                    </label>
                    <button
                      type="button"
                      onClick={() => setCode(getNextChemicalCode(chemicals))}
                      className="text-[10px] text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded font-mono font-medium transition-colors flex items-center gap-1"
                      title="Klik untuk reset ke nomor terkecil yang belum terpakai"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Terkecil Otomatis</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={getNextChemicalCode(chemicals)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold text-blue-700 border border-slate-300 rounded-lg bg-slate-50/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Format: <span className="font-mono font-semibold text-slate-600">BHM-KIM-xxx</span> (nomor terkecil yang belum terpakai)
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor CAS
                  </label>
                  <input
                    type="text"
                    value={casNumber}
                    onChange={(e) => setCasNumber(e.target.value)}
                    placeholder="Contoh: 7647-01-0"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Opsional untuk rujukan MSDS keselamatan
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Bahan *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Asam Nitrat (HNO3) 65%"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rumus Kimia *
                  </label>
                  <input
                    type="text"
                    required
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    placeholder="Contoh: HNO3"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wujud
                  </label>
                  <select
                    value={form}
                    onChange={(e) => setForm(e.target.value as Chemical['form'])}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="Cair">Cair</option>
                    <option value="Padat">Padat</option>
                    <option value="Indikator">Indikator</option>
                    <option value="Gas">Gas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as Chemical['unit'])}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="mL">mL</option>
                    <option value="L">L</option>
                    <option value="gram">gram</option>
                    <option value="kg">kg</option>
                    <option value="botol">botol</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Penyimpanan
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Contoh: Lemari Asam B3"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batas Minimum Stok
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Klasifikasi Bahaya (GHS)
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['corrosive', 'flammable', 'toxic', 'oxidizer', 'irritant', 'environmental', 'safe'] as HazardType[]).map((hz) => (
                    <button
                      key={hz}
                      type="button"
                      onClick={() => handleHazardToggle(hz)}
                      className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                        selectedHazards.includes(hz)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {hz}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Kadaluarsa
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Penanganan Khusus
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instruksi APD atau bahaya spesifik..."
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
                  Simpan Reagen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Reagen */}
      {chemicalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                Hapus Reagen / Bahan Kimia
              </h4>
              <button
                type="button"
                onClick={() => setChemicalToDelete(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600">
                Apakah Anda yakin ingin menghapus bahan kimia berikut dari inventaris laboratorium?
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="font-mono font-bold text-blue-700">{chemicalToDelete.code}</div>
                <div className="font-bold text-slate-800">{chemicalToDelete.name}</div>
                <div className="text-slate-500 font-mono">
                  {chemicalToDelete.formula} • Stok: {chemicalToDelete.stock} {chemicalToDelete.unit}
                </div>
              </div>
              <p className="text-[11px] text-red-600">
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setChemicalToDelete(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteChemical(chemicalToDelete.id);
                  setChemicalToDelete(null);
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
              >
                Ya, Hapus Bahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import CSV Bahan Kimia */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Import Data Reagen & Bahan Kimia
                  </h4>
                  <p className="text-xs text-slate-500">
                    Unggah inventaris bahan kimia laboratorium secara massal via file CSV (.csv)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-1 text-xs">
              {/* Template download card */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-blue-900 text-xs">
                    Template Format CSV Bahan Kimia
                  </div>
                  <p className="text-[11px] text-blue-700">
                    Gunakan template resmi agar susunan kolom sesuai dengan sistem inventaris lab.
                  </p>
                  <p className="text-[10px] text-blue-600 font-mono">
                    Kolom: Kode Bahan, Nama Bahan, Rumus Kimia, No CAS, Wujud, Stok, Satuan, Batas Min, Lokasi, Kadaluarsa, Bahaya, Catatan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadChemicalTemplateCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 shadow-2xs transition-all shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Unduh Template CSV</span>
                </button>
              </div>

              {/* Upload area */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 text-xs">
                  Pilih File CSV (.csv) *
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 rounded-xl p-5 text-center transition-all">
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-700 mb-0.5">
                    {importFileName ? (
                      <span className="text-blue-700 font-mono font-bold">{importFileName}</span>
                    ) : (
                      'Klik untuk memilih file CSV dari komputer Anda'
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Mendukung separator koma (,) maupun titik koma (;). Jika kode bahan dikosongkan, kode otomatis BHM-KIM-xxx akan dibuatkan.
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih File CSV</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleCSVFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Alert Error */}
              {importError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <div className="flex-1 font-medium">{importError}</div>
                </div>
              )}

              {/* Alert Success */}
              {importSuccessMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="font-semibold">{importSuccessMessage}</div>
                </div>
              )}

              {/* Preview Table */}
              {parsedChemicals.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">
                        Pratinjau Data Bahan Kimia Siap Diimpor
                      </span>
                      <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                        {parsedChemicals.length} bahan terdeteksi
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 italic">
                      Periksa data sebelum disimpan ke database
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="py-2 px-2.5">No</th>
                          <th className="py-2 px-2.5">Kode Bahan</th>
                          <th className="py-2 px-2.5">Nama Bahan</th>
                          <th className="py-2 px-2.5">Rumus</th>
                          <th className="py-2 px-2.5">Wujud</th>
                          <th className="py-2 px-2.5 text-right">Stok</th>
                          <th className="py-2 px-2.5">Bahaya</th>
                          <th className="py-2 px-2.5">Lokasi</th>
                          <th className="py-2 px-2.5">Kadaluarsa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {parsedChemicals.map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 px-2.5 font-mono text-[10px] text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-2.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                              {c.code}
                            </td>
                            <td className="py-2 px-2.5 font-medium text-slate-900 max-w-[150px] truncate" title={c.name}>
                              {c.name}
                            </td>
                            <td className="py-2 px-2.5 font-mono text-slate-600 whitespace-nowrap">
                              {c.formula}
                            </td>
                            <td className="py-2 px-2.5 whitespace-nowrap">
                              <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                {c.form}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                              {c.stock.toLocaleString('id-ID')} {c.unit}
                            </td>
                            <td className="py-2 px-2.5">
                              <div className="flex flex-wrap gap-1 max-w-[180px]">
                                {c.hazards.map((h) => renderHazardBadge(h))}
                              </div>
                            </td>
                            <td className="py-2 px-2.5 text-slate-600 truncate max-w-[120px]" title={c.location}>
                              {c.location}
                            </td>
                            <td className="py-2 px-2.5 font-mono tabular-nums text-[11px] text-slate-500 whitespace-nowrap">
                              {c.expiryDate}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <span className="text-[11px] text-slate-500">
                {parsedChemicals.length > 0
                  ? `${parsedChemicals.length} reagen siap ditambahkan ke database`
                  : 'Pilih file CSV untuk melihat pratinjau'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={isImporting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={parsedChemicals.length === 0 || isImporting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sedang Mengimpor...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import {parsedChemicals.length} Bahan ke Database</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
