import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  QrCode,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Download,
  X,
  Share2,
  Upload,
  FileSpreadsheet,
  Loader2,
  Check,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { Equipment } from '../types';
import { BarcodeModal } from './BarcodeModal';

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

export const getCategoryPrefix = (cat: Equipment['category']): string => {
  switch (cat) {
    case 'Biokim Putra':
      return 'ALT-BK-Putra-';
    case 'Fisika Putri':
      return 'ALT-Fis-Putri-';
    case 'Biokim Putri':
      return 'ALT-BK-Putri-';
    case 'Fisika':
      return 'ALT-Fis-';
    case 'Kimia':
      return 'ALT-Kim-';
    case 'Biologi':
      return 'ALT-Bio-';
    case 'Umum':
    default:
      return 'ALT-Umum-';
  }
};

export const getNextEquipmentCode = (
  cat: Equipment['category'],
  equipmentList: Equipment[]
): string => {
  const prefix = getCategoryPrefix(cat);
  const usedNumbers = new Set<number>();

  let categoryPattern: RegExp;
  switch (cat) {
    case 'Biokim Putra':
      categoryPattern = /^ALT[-_]?(?:BK[-_]?Putra|BKP|Biokim[-_]?Putra|BK[-_]?PA)[-_]?(\d+)/i;
      break;
    case 'Fisika Putri':
      categoryPattern = /^ALT[-_]?(?:Fis[-_]?Putri|FSP|Fisika[-_]?Putri|FIS[-_]?PI)[-_]?(\d+)/i;
      break;
    case 'Biokim Putri':
      categoryPattern = /^ALT[-_]?(?:BK[-_]?Putri|BKI|Biokim[-_]?Putri|BK[-_]?PI)[-_]?(\d+)/i;
      break;
    case 'Fisika':
      categoryPattern = /^ALT[-_]?Fis(?:ika)?[-_]?(\d+)/i;
      break;
    case 'Kimia':
      categoryPattern = /^ALT[-_]?Kim(?:ia)?[-_]?(\d+)/i;
      break;
    case 'Biologi':
      categoryPattern = /^ALT[-_]?Bio(?:logi)?[-_]?(\d+)/i;
      break;
    case 'Umum':
    default:
      categoryPattern = /^ALT[-_]?Umum[-_]?(\d+)/i;
      break;
  }

  equipmentList.forEach((eq) => {
    if (!eq.code) return;

    const patternMatch = eq.code.trim().match(categoryPattern);
    if (patternMatch) {
      const num = parseInt(patternMatch[1], 10);
      if (!isNaN(num) && num > 0) {
        usedNumbers.add(num);
      }
      return;
    }

    if (eq.category === cat) {
      const genericMatch = eq.code.trim().match(/(\d+)$/);
      if (genericMatch) {
        const num = parseInt(genericMatch[1], 10);
        if (!isNaN(num) && num > 0) {
          usedNumbers.add(num);
        }
      }
    }
  });

  let nextNum = 1;
  while (usedNumbers.has(nextNum)) {
    nextNum++;
  }

  const formattedNum = String(nextNum).padStart(3, '0');
  return `${prefix}${formattedNum}`;
};

export const AlatLabView: React.FC = () => {
  const { equipment, addEquipment, updateEquipment, deleteEquipment, setActiveSection, userMode } = useLab();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [selectedBarcodeEq, setSelectedBarcodeEq] = useState<Equipment | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);

  // CSV Import States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [parsedEquipment, setParsedEquipment] = useState<Omit<Equipment, 'id'>[]>([]);
  const [importError, setImportError] = useState('');
  const [importSuccessMessage, setImportSuccessMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Form states
  const [category, setCategory] = useState<Equipment['category']>('Biokim Putra');
  const [code, setCode] = useState(() => getNextEquipmentCode('Biokim Putra', equipment));
  const [name, setName] = useState('');
  const [totalCount, setTotalCount] = useState<number>(10);
  const [goodCount, setGoodCount] = useState<number>(10);
  const [damagedCount, setDamagedCount] = useState<number>(0);
  const [location, setLocation] = useState('Lemari Lab Biokim Putra');
  const [brand, setBrand] = useState('');
  const [specification, setSpecification] = useState('');

  const handleCategoryChange = (newCat: Equipment['category']) => {
    setCategory(newCat);
    setCode(getNextEquipmentCode(newCat, equipment));
    if (!location || location.startsWith('Lemari Lab')) {
      setLocation(`Lemari Lab ${newCat}`);
    }
  };

  const openAddModal = () => {
    const defaultCat: Equipment['category'] = 'Biokim Putra';
    setCategory(defaultCat);
    setCode(getNextEquipmentCode(defaultCat, equipment));
    setName('');
    setTotalCount(10);
    setGoodCount(10);
    setDamagedCount(0);
    setLocation('Lemari Lab Biokim Putra');
    setBrand('');
    setSpecification('');
    setIsAddModalOpen(true);
  };

  const filteredEquipment = equipment.filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (eq.brand && eq.brand.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || eq.category === categoryFilter;
    const matchesCondition =
      conditionFilter === 'all'
        ? true
        : conditionFilter === 'damaged'
        ? eq.damagedCount > 0
        : conditionFilter === 'borrowed'
        ? eq.borrowedCount > 0
        : eq.goodCount > 0;

    return matchesSearch && matchesCategory && matchesCondition;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      alert('Mohon isi nama dan kode alat');
      return;
    }

    const total = Number(totalCount) || 1;
    const good = Number(goodCount) || total;
    const damaged = Number(damagedCount) || 0;

    const eqPayload: Omit<Equipment, 'id'> = {
      code,
      name,
      category,
      totalCount: total,
      goodCount: good,
      damagedCount: damaged,
      borrowedCount: 0,
      location: location || 'Rak Laboratorium',
    };
    if (brand.trim()) {
      eqPayload.brand = brand.trim();
    }
    if (specification.trim()) {
      eqPayload.specification = specification.trim();
    }

    addEquipment(eqPayload);

    setIsAddModalOpen(false);
    // Reset form
    setName('');
    setBrand('');
    setSpecification('');
  };

  const handleEditCategoryChange = (newCat: Equipment['category']) => {
    if (!editingEq) return;
    const otherEquipment = equipment.filter((e) => e.id !== editingEq.id);
    const newNextCode = getNextEquipmentCode(newCat, otherEquipment);
    const oldPrefix = getCategoryPrefix(editingEq.category);
    const shouldUpdateCode = !editingEq.code || editingEq.code.startsWith(oldPrefix);

    setEditingEq({
      ...editingEq,
      category: newCat,
      code: shouldUpdateCode ? newNextCode : editingEq.code,
      location:
        !editingEq.location || editingEq.location.startsWith('Lemari Lab')
          ? `Lemari Lab ${newCat}`
          : editingEq.location,
    });
  };

  const handleRegenerateEditCode = () => {
    if (!editingEq) return;
    const otherEquipment = equipment.filter((e) => e.id !== editingEq.id);
    const nextCode = getNextEquipmentCode(editingEq.category, otherEquipment);
    setEditingEq({
      ...editingEq,
      code: nextCode,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEq) return;

    if (!editingEq.name.trim() || !editingEq.code.trim()) {
      alert('Mohon isi nama dan kode alat');
      return;
    }

    const isDuplicate = equipment.some(
      (eq) => eq.id !== editingEq.id && eq.code.trim().toLowerCase() === editingEq.code.trim().toLowerCase()
    );
    if (isDuplicate) {
      alert(`Kode alat "${editingEq.code}" sudah digunakan oleh instrumen lain. Mohon gunakan kode yang unik.`);
      return;
    }

    const total = Number(editingEq.totalCount) || 0;
    const good = Number(editingEq.goodCount) || 0;
    const damaged = Number(editingEq.damagedCount) || 0;

    updateEquipment(editingEq.id, {
      code: editingEq.code.trim(),
      name: editingEq.name.trim(),
      category: editingEq.category,
      totalCount: total,
      goodCount: good,
      damagedCount: damaged,
      location: editingEq.location?.trim() || 'Rak Laboratorium',
      brand: editingEq.brand ? editingEq.brand.trim() : '',
      specification: editingEq.specification ? editingEq.specification.trim() : '',
    });

    setEditingEq(null);
  };

  const exportEquipmentCsv = () => {
    const headers = ['Kode Alat', 'Nama Alat', 'Kategori', 'Total Unit', 'Kondisi Baik', 'Rusak', 'Dipinjam', 'Lokasi', 'Merk'];
    const rows = filteredEquipment.map((eq) => [
      eq.code,
      `"${eq.name}"`,
      eq.category,
      eq.totalCount,
      eq.goodCount,
      eq.damagedCount,
      eq.borrowedCount,
      `"${eq.location}"`,
      `"${eq.brand || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventaris_Alat_Lab_IPA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadEquipmentTemplateCSV = () => {
    const csvContent =
      '\uFEFF' +
      [
        'Kode Alat,Nama Alat,Kategori,Total Unit,Kondisi Baik,Rusak,Lokasi,Merk,Spesifikasi',
        'ALT-BK-Putra-001,"Buret Bening 50ml",Biokim Putra,20,19,1,"Rak Kaca Lab Biokim Putra","Pyrex","Kran PTFE Teflon"',
        'ALT-Fis-Putri-001,"Garputala dan Kotak Resonansi",Fisika Putri,12,12,0,"Lemari Lab Fisika Putri","Pudak","Frekuensi 440 Hz"',
        'ALT-BK-Putri-001,"Model Kerangka Tubuh Manusia",Biokim Putri,4,4,0,"Sudut Anatomi Lab Biokim Putri","Torso Media","Tinggi 170cm bahan PVC"',
      ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Import_Alat_Laboratorium.csv');
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
            h.includes('alat') ||
            h.includes('kode') ||
            h.includes('kategori') ||
            h.includes('total')
        );

        let codeIdx = -1;
        let nameIdx = -1;
        let categoryIdx = -1;
        let totalCountIdx = -1;
        let goodCountIdx = -1;
        let damagedCountIdx = -1;
        let locationIdx = -1;
        let brandIdx = -1;
        let specIdx = -1;

        if (hasHeader) {
          headerRow.forEach((h, idx) => {
            if (h.includes('kode') || h.includes('code')) codeIdx = idx;
            else if (
              h.includes('nama') ||
              h.includes('name') ||
              h.includes('alat') ||
              h.includes('instrumen')
            )
              nameIdx = idx;
            else if (h.includes('kategori') || h.includes('category') || h.includes('lab'))
              categoryIdx = idx;
            else if (
              h.includes('total') ||
              h.includes('jumlah') ||
              h.includes('qty') ||
              h.includes('unit')
            )
              totalCountIdx = idx;
            else if (h.includes('baik') || h.includes('good')) goodCountIdx = idx;
            else if (h.includes('rusak') || h.includes('damaged')) damagedCountIdx = idx;
            else if (
              h.includes('lokasi') ||
              h.includes('location') ||
              h.includes('rak') ||
              h.includes('lemari')
            )
              locationIdx = idx;
            else if (h.includes('merk') || h.includes('brand')) brandIdx = idx;
            else if (
              h.includes('spek') ||
              h.includes('spesifikasi') ||
              h.includes('spec') ||
              h.includes('detail')
            )
              specIdx = idx;
          });
        }

        // Defaults if not mapped
        if (codeIdx === -1) codeIdx = 0;
        if (nameIdx === -1) nameIdx = 1;
        if (categoryIdx === -1) categoryIdx = 2;
        if (totalCountIdx === -1) totalCountIdx = 3;
        if (goodCountIdx === -1) goodCountIdx = 4;
        if (damagedCountIdx === -1) damagedCountIdx = 5;
        if (locationIdx === -1) locationIdx = 6;
        if (brandIdx === -1) brandIdx = 7;
        if (specIdx === -1) specIdx = 8;

        const dataRows = hasHeader ? rows.slice(1) : rows;
        const parsed: Omit<Equipment, 'id'>[] = [];
        const runningEquipmentList = [...equipment];

        for (const row of dataRows) {
          if (!row || row.length === 0) continue;
          const rawName = (row[nameIdx] || '').trim().replace(/^["']|["']$/g, '');
          if (!rawName) continue;

          // Parse Category
          const rawCategory = (row[categoryIdx] || '').trim().replace(/^["']|["']$/g, '');
          let cat: Equipment['category'] = 'Umum';
          if (/fisika/i.test(rawCategory)) cat = 'Fisika';
          else if (/kimia/i.test(rawCategory)) cat = 'Kimia';
          else if (/biologi/i.test(rawCategory)) cat = 'Biologi';
          else if (/umum/i.test(rawCategory)) cat = 'Umum';
          else {
            const rawCode = (row[codeIdx] || '').trim();
            if (/fis/i.test(rawCode)) cat = 'Fisika';
            else if (/kim/i.test(rawCode)) cat = 'Kimia';
            else if (/bio/i.test(rawCode)) cat = 'Biologi';
          }

          // Parse or generate Code
          let itemCode = (row[codeIdx] || '').trim().replace(/^["']|["']$/g, '');
          if (!itemCode) {
            itemCode = getNextEquipmentCode(cat, runningEquipmentList);
          }

          const total = Math.max(1, parseInt(row[totalCountIdx] || '1', 10) || 1);
          const damaged = Math.max(0, parseInt(row[damagedCountIdx] || '0', 10) || 0);
          const parsedGood = parseInt(row[goodCountIdx] || '', 10);
          const good = isNaN(parsedGood)
            ? Math.max(0, total - damaged)
            : Math.min(total, Math.max(0, parsedGood));

          const rawLoc = (row[locationIdx] || '').trim().replace(/^["']|["']$/g, '');
          const loc = rawLoc || `Lemari Lab ${cat}`;

          const rawBrand =
            brandIdx < row.length
              ? (row[brandIdx] || '').trim().replace(/^["']|["']$/g, '')
              : '';
          const rawSpec =
            specIdx < row.length
              ? (row[specIdx] || '').trim().replace(/^["']|["']$/g, '')
              : '';

          const newItem: Omit<Equipment, 'id'> = {
            code: itemCode,
            name: rawName,
            category: cat,
            totalCount: total,
            goodCount: good,
            damagedCount: damaged,
            borrowedCount: 0,
            location: loc,
            brand: rawBrand || undefined,
            specification: rawSpec || undefined,
          };

          parsed.push(newItem);
          runningEquipmentList.push({ ...newItem, id: `temp-${parsed.length}` });
        }

        if (parsed.length === 0) {
          setImportError('Tidak ada baris data alat yang valid ditemukan dalam file CSV.');
        } else {
          setParsedEquipment(parsed);
        }
      } catch (err: any) {
        setImportError(`Gagal membaca file CSV: ${err?.message || 'Format tidak valid'}`);
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteImport = async () => {
    if (parsedEquipment.length === 0) return;
    setIsImporting(true);
    setImportError('');
    try {
      for (let i = 0; i < parsedEquipment.length; i++) {
        const item = parsedEquipment[i];
        await addEquipment(item);
      }
      setImportSuccessMessage(
        `Berhasil mengimpor ${parsedEquipment.length} data alat laboratorium ke database!`
      );
      setTimeout(() => {
        setIsImportModalOpen(false);
        setParsedEquipment([]);
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

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Inventaris Alat & Instrumen Laboratorium IPA
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen alat praktikum Fisika, Kimia, Biologi: kondisi fisik, stok siap pakai, dan barcode identifikasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userMode === 'laboran' && (
            <button
              type="button"
              onClick={() => {
                setIsImportModalOpen(true);
                setParsedEquipment([]);
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
            onClick={exportEquipmentCsv}
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
              <span>Tambah Alat Baru</span>
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
            placeholder="Cari nama alat, kode, merk..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Kategori</option>
            <option value="Biokim Putra">Biokim Putra</option>
            <option value="Fisika Putri">Fisika Putri</option>
            <option value="Biokim Putri">Biokim Putri</option>
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Kondisi</option>
            <option value="available">Siap Digunakan (Baik &gt; 0)</option>
            <option value="damaged">Ada Unit Rusak</option>
            <option value="borrowed">Sedang Dipinjam</option>
          </select>
        </div>
      </div>

      {/* Table Equipment */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Kode & Nama Alat</th>
                <th className="px-3 py-3.5">Kategori</th>
                <th className="px-3 py-3.5">Merk / Spesifikasi</th>
                <th className="px-4 py-3.5 text-center">Total</th>
                <th className="px-4 py-3.5 text-center">Siap Pakai (Baik)</th>
                <th className="px-4 py-3.5 text-center">Rusak</th>
                <th className="px-4 py-3.5 text-center">Dipinjam</th>
                <th className="px-4 py-3.5">Lokasi Rak</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada alat laboratorium yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 text-xs">{eq.name}</div>
                      <div className="text-[11px] font-mono text-blue-600">{eq.code}</div>
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          eq.category === 'Biokim Putra'
                            ? 'bg-blue-50 text-blue-700'
                            : eq.category === 'Fisika Putri'
                            ? 'bg-purple-50 text-purple-700'
                            : eq.category === 'Biokim Putri'
                            ? 'bg-emerald-50 text-emerald-700'
                            : eq.category === 'Biologi'
                            ? 'bg-emerald-50 text-emerald-700'
                            : eq.category === 'Fisika'
                            ? 'bg-blue-50 text-blue-700'
                            : eq.category === 'Kimia'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {eq.category}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-[11px] text-slate-600 max-w-[200px] truncate" title={eq.specification || eq.brand}>
                      <span className="font-medium text-slate-800">{eq.brand || '-'}</span>
                      {eq.specification && <p className="text-slate-400 truncate">{eq.specification}</p>}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-900 tabular-nums">
                      {eq.totalCount}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-600 tabular-nums">
                      {eq.goodCount}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono tabular-nums">
                      {eq.damagedCount > 0 ? (
                        <span className="text-red-600 font-semibold">{eq.damagedCount}</span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono tabular-nums">
                      {eq.borrowedCount > 0 ? (
                        <span className="text-blue-600 font-semibold">{eq.borrowedCount}</span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-[11px] max-w-[140px] truncate" title={eq.location}>
                      {eq.location}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Barcode label print */}
                        <button
                          type="button"
                          onClick={() => setSelectedBarcodeEq(eq)}
                          className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Cetak Barcode / Label Inventaris"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        {/* Laboran edit & delete */}
                        {userMode === 'laboran' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditingEq({ ...eq })}
                              className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              title="Edit Alat"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Hapus alat ${eq.name}?`)) {
                                  deleteEquipment(eq.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
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

      {/* Barcode Modal */}
      <BarcodeModal
        equipment={selectedBarcodeEq}
        onClose={() => setSelectedBarcodeEq(null)}
      />

      {/* Modal Tambah Alat Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                Tambah Instrumen / Alat Lab Baru
              </h4>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Lab *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value as Equipment['category'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Biokim Putra">Biokim Putra</option>
                    <option value="Fisika Putri">Fisika Putri</option>
                    <option value="Biokim Putri">Biokim Putri</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Format kode: <span className="font-mono font-semibold text-slate-600">{getCategoryPrefix(category)}xxx</span>
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Kode Alat *
                    </label>
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono font-medium">
                      Terkecil Otomatis
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={getNextEquipmentCode(category, equipment)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold text-blue-700 border border-slate-300 rounded-lg bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Nomor terkecil yang belum digunakan pada kategori {category}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Alat *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Neraca Ohaus 311g / Catu Daya Lab"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Unit *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={totalCount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTotalCount(val);
                      setGoodCount(val);
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kondisi Baik
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={goodCount}
                    onChange={(e) => setGoodCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rusak
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={damagedCount}
                    onChange={(e) => setDamagedCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Merk / Brand
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Contoh: Pudak / Olympus"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Rak / Lemari
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Contoh: Lemari Kaca A2"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Spesifikasi Teknis
                </label>
                <textarea
                  rows={2}
                  value={specification}
                  onChange={(e) => setSpecification(e.target.value)}
                  placeholder="Detail ukuran, kapasitas, ketelitian atau voltase..."
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
                  Simpan Alat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Alat */}
      {editingEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                Edit Data Alat: {editingEq.code}
              </h4>
              <button
                type="button"
                onClick={() => setEditingEq(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Lab *
                  </label>
                  <select
                    value={editingEq.category}
                    onChange={(e) => handleEditCategoryChange(e.target.value as Equipment['category'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Biokim Putra">Biokim Putra</option>
                    <option value="Fisika Putri">Fisika Putri</option>
                    <option value="Biokim Putri">Biokim Putri</option>
                    {!['Biokim Putra', 'Fisika Putri', 'Biokim Putri'].includes(editingEq.category) && (
                      <option value={editingEq.category}>{editingEq.category}</option>
                    )}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Format kode: <span className="font-mono font-semibold text-slate-600">{getCategoryPrefix(editingEq.category)}xxx</span>
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Kode Alat *
                    </label>
                    <button
                      type="button"
                      onClick={handleRegenerateEditCode}
                      className="text-[10px] text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded font-mono font-medium transition-colors"
                      title="Klik untuk membuat nomor urut terkecil otomatis"
                    >
                      Terkecil Otomatis ↺
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={editingEq.code}
                    onChange={(e) => setEditingEq({ ...editingEq, code: e.target.value })}
                    placeholder={getNextEquipmentCode(editingEq.category, equipment.filter(e => e.id !== editingEq.id))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold text-blue-700 border border-slate-300 rounded-lg bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Nomor terkecil yang belum digunakan pada kategori {editingEq.category}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Alat *
                </label>
                <input
                  type="text"
                  required
                  value={editingEq.name}
                  onChange={(e) => setEditingEq({ ...editingEq, name: e.target.value })}
                  placeholder="Contoh: Neraca Ohaus 311g / Catu Daya Lab"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Unit *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingEq.totalCount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditingEq({ ...editingEq, totalCount: val });
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kondisi Baik
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingEq.goodCount}
                    onChange={(e) => setEditingEq({ ...editingEq, goodCount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rusak
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingEq.damagedCount}
                    onChange={(e) => setEditingEq({ ...editingEq, damagedCount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Merk / Brand
                  </label>
                  <input
                    type="text"
                    value={editingEq.brand || ''}
                    onChange={(e) => setEditingEq({ ...editingEq, brand: e.target.value })}
                    placeholder="Contoh: Pudak / Olympus"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Rak / Lemari
                  </label>
                  <input
                    type="text"
                    value={editingEq.location}
                    onChange={(e) => setEditingEq({ ...editingEq, location: e.target.value })}
                    placeholder="Contoh: Lemari Kaca A2"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Spesifikasi Teknis
                </label>
                <textarea
                  rows={2}
                  value={editingEq.specification || ''}
                  onChange={(e) => setEditingEq({ ...editingEq, specification: e.target.value })}
                  placeholder="Detail ukuran, kapasitas, ketelitian atau voltase..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEq(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import CSV Alat Laboratorium */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Import Data Alat Laboratorium
                  </h4>
                  <p className="text-xs text-slate-500">
                    Unggah daftar alat praktikum secara massal via file CSV (.csv)
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
                    Template Format CSV Alat
                  </div>
                  <p className="text-[11px] text-blue-700">
                    Gunakan template resmi agar susunan kolom sesuai dengan sistem inventaris lab.
                  </p>
                  <p className="text-[10px] text-blue-600 font-mono">
                    Kolom: Kode Alat, Nama Alat, Kategori, Total Unit, Kondisi Baik, Rusak, Lokasi, Merk, Spesifikasi
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadEquipmentTemplateCSV}
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
                      <span className="text-blue-700 font-mono">{importFileName}</span>
                    ) : (
                      'Klik untuk memilih file CSV dari komputer Anda'
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Mendukung separator koma (,) maupun titik koma (;)
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
              {parsedEquipment.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">
                        Pratinjau Data Alat Siap Diimpor
                      </span>
                      <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                        {parsedEquipment.length} alat terdeteksi
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 italic">
                      Periksa data sebelum disimpan
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="py-2 px-2.5">No</th>
                          <th className="py-2 px-2.5">Kode Alat</th>
                          <th className="py-2 px-2.5">Nama Alat</th>
                          <th className="py-2 px-2.5">Kategori</th>
                          <th className="py-2 px-2 text-center">Total</th>
                          <th className="py-2 px-2 text-center">Baik</th>
                          <th className="py-2 px-2 text-center">Rusak</th>
                          <th className="py-2 px-2.5">Lokasi</th>
                          <th className="py-2 px-2.5">Merk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {parsedEquipment.map((eq, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 px-2.5 font-mono text-[10px] text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-2.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                              {eq.code}
                            </td>
                            <td className="py-2 px-2.5 font-medium text-slate-900 max-w-[160px] truncate" title={eq.name}>
                              {eq.name}
                            </td>
                            <td className="py-2 px-2.5 whitespace-nowrap">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                  eq.category === 'Fisika'
                                    ? 'bg-blue-100 text-blue-700'
                                    : eq.category === 'Kimia'
                                    ? 'bg-amber-100 text-amber-700'
                                    : eq.category === 'Biologi'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}
                              >
                                {eq.category}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center font-mono font-bold text-slate-800">
                              {eq.totalCount}
                            </td>
                            <td className="py-2 px-2 text-center font-mono font-semibold text-emerald-600">
                              {eq.goodCount}
                            </td>
                            <td className="py-2 px-2 text-center font-mono font-semibold text-rose-600">
                              {eq.damagedCount}
                            </td>
                            <td className="py-2 px-2.5 text-slate-600 truncate max-w-[120px]" title={eq.location}>
                              {eq.location}
                            </td>
                            <td className="py-2 px-2.5 text-slate-500 truncate max-w-[100px]" title={eq.brand}>
                              {eq.brand || '-'}
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
                {parsedEquipment.length > 0
                  ? `${parsedEquipment.length} alat siap ditambahkan ke database`
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
                  disabled={parsedEquipment.length === 0 || isImporting}
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
                      <span>Import {parsedEquipment.length} Alat ke Database</span>
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
