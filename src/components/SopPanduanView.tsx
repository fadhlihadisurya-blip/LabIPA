import React, { useState } from 'react';
import {
  BookOpen,
  ShieldAlert,
  Printer,
  CheckCircle2,
  FileCheck,
  Search,
  ExternalLink,
  Info,
  CheckSquare,
  Square,
  Plus,
  Edit3,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  Type,
  Loader2,
  ZoomIn,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { SOPItem, SOPStep } from '../types';
import { INITIAL_SOPS } from '../data/initialData';
import { processImageWithoutCrop } from '../utils/imageCompressor';
import { formatDate } from '../utils/dateUtils';

export const SopPanduanView: React.FC = () => {
  const { sopList, addSop, updateSop, deleteSop, userMode } = useLab();

  const [selectedSop, setSelectedSop] = useState<SOPItem>(sopList[0] || INITIAL_SOPS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal states for Add/Edit SOP
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSop, setEditingSop] = useState<SOPItem | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SOPItem['category']>('Keselamatan');
  const [summary, setSummary] = useState('');
  const [steps, setSteps] = useState<SOPStep[]>([{ type: 'text', content: '' }]);
  const [safetyText, setSafetyText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);

  // Interactive APD safety check list state
  const [checkedApd, setCheckedApd] = useState<{ [key: string]: boolean }>({
    jasLab: false,
    sepatu: false,
    rambut: false,
    goggles: false,
    masker: false,
  });

  const toggleApd = (key: string) => {
    setCheckedApd((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isAllApdChecked = Object.values(checkedApd).every(Boolean);

  const filteredSops = sopList.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    setEditingSop(null);
    setCode(`SOP-LAB-${String(sopList.length + 1).padStart(2, '0')}`);
    setTitle('');
    setCategory('Keselamatan');
    setSummary('');
    setSteps([{ type: 'text', content: '' }]);
    setSafetyText('');
    setImageUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (sop: SOPItem) => {
    setEditingSop(sop);
    setCode(sop.code);
    setTitle(sop.title);
    setCategory(sop.category);
    setSummary(sop.summary);

    const normalizedSteps: SOPStep[] = sop.steps.map((s: any) => {
      if (typeof s === 'string') {
        return { type: 'text', content: s };
      }
      return { type: s.type || 'text', content: s.content || '' };
    });
    setSteps(normalizedSteps.length > 0 ? normalizedSteps : [{ type: 'text', content: '' }]);

    setSafetyText(sop.safetyPoints.join('\n'));
    setImageUrl(sop.imageUrl || '');
    setIsModalOpen(true);
  };

  const handleStepTypeChange = (index: number, type: 'text' | 'image') => {
    const newSteps = [...steps];
    newSteps[index].type = type;
    newSteps[index].content = '';
    setSteps(newSteps);
  };

  const handleStepContentChange = (index: number, content: string) => {
    const newSteps = [...steps];
    newSteps[index].content = content;
    setSteps(newSteps);
  };

  const handleStepImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressing(true);
      // Sesuaikan ukuran tanpa crop dan tanpa kompresi buram (mempertahankan rasio aspek 100%)
      const processed = await processImageWithoutCrop(file, 1500);
      handleStepContentChange(index, processed);
    } catch (err) {
      console.error('Failed to process step image:', err);
      alert('Gagal memproses gambar. Mohon pilih format gambar JPG/JPEG/PNG yang valid.');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const addStepItem = () => {
    setSteps([...steps, { type: 'text', content: '' }]);
  };

  const removeStepItem = (index: number) => {
    if (steps.length === 1) {
      setSteps([{ type: 'text', content: '' }]);
      return;
    }
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressing(true);
      const processed = await processImageWithoutCrop(file, 1500);
      setImageUrl(processed);
    } catch (err) {
      console.error('Failed to process main image:', err);
      alert('Gagal memproses gambar. Mohon pilih format gambar JPG/JPEG/PNG yang valid.');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleSaveSop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim() || !summary.trim()) {
      alert('Mohon lengkapi kode, judul, dan ringkasan SOP');
      return;
    }

    const validSteps = steps.filter((s) => s.content.trim() !== '');
    if (validSteps.length === 0) {
      alert('Mohon masukkan minimal satu langkah pelaksanaan SOP (berupa teks atau gambar)');
      return;
    }

    setIsCompressing(true);
    try {
      // Pastikan ukuran data aman tanpa crop dan tanpa kompresi buram
      const processedSteps: SOPStep[] = await Promise.all(
        validSteps.map(async (step) => {
          if (step.type === 'image' && step.content.startsWith('data:image/') && step.content.length > 750 * 1024) {
            try {
              const comp = await processImageWithoutCrop(step.content, 1500);
              return { ...step, content: comp };
            } catch {
              return step;
            }
          }
          return step;
        })
      );

      let processedImageUrl = imageUrl.trim() || undefined;
      if (processedImageUrl && processedImageUrl.startsWith('data:image/') && processedImageUrl.length > 750 * 1024) {
        try {
          processedImageUrl = await processImageWithoutCrop(processedImageUrl, 1500);
        } catch {
          // keep original
        }
      }

      const safetyPoints = safetyText.split('\n').map((s) => s.trim()).filter(Boolean);

      // Verify total document size before sending to Firestore (Firestore limit: 1MB = 1,048,576 bytes)
      const totalPayload = JSON.stringify({
        code: code.trim(),
        title: title.trim(),
        category,
        summary: summary.trim(),
        steps: processedSteps,
        safetyPoints,
        imageUrl: processedImageUrl,
      });

      if (totalPayload.length > 850 * 1024) {
        alert(
          'Ukuran dokumen SOP terlalu besar untuk disimpan ke basis data Firestore. Mohon kurangi jumlah langkah berupa gambar atau gunakan gambar dengan dimensi yang lebih sesuai.'
        );
        setIsCompressing(false);
        return;
      }

      if (editingSop) {
        await updateSop(editingSop.id, {
          code: code.trim(),
          title: title.trim(),
          category,
          summary: summary.trim(),
          steps: processedSteps,
          safetyPoints,
          imageUrl: processedImageUrl,
        });
      } else {
        await addSop({
          code: code.trim(),
          title: title.trim(),
          category,
          summary: summary.trim(),
          steps: processedSteps,
          safetyPoints,
          lastUpdated: new Date().toISOString().split('T')[0],
          imageUrl: processedImageUrl,
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving SOP:', err);
      alert(`Terjadi kesalahan saat menyimpan SOP: ${err?.message || 'Gagal menyimpan ke server'}`);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDeleteSop = (sop: SOPItem) => {
    if (window.confirm(`Hapus dokumen SOP "${sop.code} - ${sop.title}"?`)) {
      deleteSop(sop.id);
      if (selectedSop?.id === sop.id) {
        const remaining = sopList.filter((s) => s.id !== sop.id);
        if (remaining.length > 0) setSelectedSop(remaining[0]);
      }
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Standar Operasional Prosedur (SOP) & Panduan Laboratorium
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pedoman keselamatan kerja, tata kelola instrumen presisi, dan regulasi keselamatan praktikan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userMode === 'laboran' && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah SOP Baru</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak SOP Terpilih</span>
          </button>
        </div>
      </div>

      {/* Interactive Safety APD Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 rounded-2xl p-5 text-white shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-blue-800/60">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              Pemeriksaan Kesiapan Praktikan
            </span>
            <h4 className="text-base font-bold text-white mt-0.5">
              Checklist Wajib APD Sebelum Memasuki Laboratorium IPA
            </h4>
          </div>
          {isAllApdChecked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Siap Masuk Laboratorium
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-full text-xs font-semibold">
              <Info className="w-4 h-4 text-amber-400" /> Lengkapi APD Sebelum Masuk
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-4 text-xs">
          <button
            type="button"
            onClick={() => toggleApd('jasLab')}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 cursor-pointer ${
              checkedApd.jasLab
                ? 'bg-blue-800/80 border-blue-400 text-white'
                : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
            }`}
          >
            {checkedApd.jasLab ? <CheckSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-white">Jas Lab Putih</p>
              <p className="text-[11px] text-blue-200/80">Kancing rapat</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => toggleApd('sepatu')}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 cursor-pointer ${
              checkedApd.sepatu
                ? 'bg-blue-800/80 border-blue-400 text-white'
                : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
            }`}
          >
            {checkedApd.sepatu ? <CheckSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-white">Sepatu Tertutup</p>
              <p className="text-[11px] text-blue-200/80">Bukan sandal</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => toggleApd('rambut')}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 cursor-pointer ${
              checkedApd.rambut
                ? 'bg-blue-800/80 border-blue-400 text-white'
                : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
            }`}
          >
            {checkedApd.rambut ? <CheckSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-white">Rambut / Jilbab</p>
              <p className="text-[11px] text-blue-200/80">Rapi & aman</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => toggleApd('goggles')}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 cursor-pointer ${
              checkedApd.goggles
                ? 'bg-blue-800/80 border-blue-400 text-white'
                : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
            }`}
          >
            {checkedApd.goggles ? <CheckSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-white">Kacamata Goggle</p>
              <p className="text-[11px] text-blue-200/80">Praktikum kimia</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => toggleApd('masker')}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 cursor-pointer ${
              checkedApd.masker
                ? 'bg-blue-800/80 border-blue-400 text-white'
                : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
            }`}
          >
            {checkedApd.masker ? <CheckSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-white">Sarung Tangan</p>
              <p className="text-[11px] text-blue-200/80">Zat korosif / B3</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Split: SOP List on Left (4 cols), SOP Reader on Right (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of SOP documents */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari dokumen SOP..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="all">Semua Kategori SOP</option>
              <option value="Keselamatan">Keselamatan</option>
              <option value="Peminjaman">Peminjaman</option>
              <option value="Pengelolaan B3">Pengelolaan B3</option>
              <option value="Instrumen">Instrumen</option>
            </select>
          </div>

          <div className="space-y-2">
            {filteredSops.map((sop) => {
              const isSelected = selectedSop?.id === sop.id;
              return (
                <button
                  key={sop.id}
                  type="button"
                  onClick={() => setSelectedSop(sop)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono font-semibold text-blue-600">{sop.code}</span>
                    <span className="text-slate-400">{sop.category}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                    {sop.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {sop.summary}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active SOP Detailed Document */}
        {selectedSop && (
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedSop.code}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono">
                    Revisi Terakhir: {formatDate(selectedSop.lastUpdated)}
                  </span>
                  {userMode === 'laboran' && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(selectedSop)}
                        className="p-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded text-slate-600 transition-colors cursor-pointer"
                        title="Edit SOP"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSop(selectedSop)}
                        className="p-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded text-slate-600 transition-colors cursor-pointer"
                        title="Hapus SOP"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                {selectedSop.title}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Kategori: <span className="font-semibold">{selectedSop.category}</span> · Diberlakukan untuk seluruh praktikum SMAIT As-Syifa.
              </p>
            </div>

            {/* Optional Image Illustration */}
            {selectedSop.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-white p-2">
                <img
                  src={selectedSop.imageUrl}
                  alt={selectedSop.title}
                  className="w-full h-auto max-h-[500px] object-contain rounded-lg block cursor-zoom-in"
                  onClick={() => setPreviewImage({ src: selectedSop.imageUrl!, title: selectedSop.title })}
                  title="Klik untuk melihat ukuran penuh"
                />
              </div>
            )}

            {/* Summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ringkasan & Tujuan Prosedur
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedSop.summary}
              </p>
            </div>

            {/* Step by step procedures supporting text or image */}
            <div>
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                Langkah-Langkah Pelaksanaan Standar:
              </h5>
              <div className="space-y-4">
                {selectedSop.steps.map((stepItem: any, index: number) => {
                  const isImage = typeof stepItem === 'object' && stepItem.type === 'image';
                  const content = typeof stepItem === 'string' ? stepItem : stepItem.content;
                  return (
                    <div key={index} className="flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-mono">
                        {index + 1}
                      </span>
                      <div className="flex-1 pt-0.5">
                        {isImage ? (
                          <div className="mt-1 rounded-xl overflow-hidden border border-slate-200 bg-white p-2 max-w-2xl shadow-2xs group relative">
                            <img
                              src={content}
                              alt={`Langkah ${index + 1}`}
                              className="w-full h-auto object-contain rounded-lg block cursor-zoom-in transition-transform"
                              onClick={() => setPreviewImage({ src: content, title: `Langkah #${index + 1}` })}
                              title="Klik untuk memperbesar gambar"
                            />
                            <button
                              type="button"
                              onClick={() => setPreviewImage({ src: content, title: `Langkah #${index + 1}` })}
                              className="absolute bottom-3 right-3 bg-slate-900/70 hover:bg-slate-900 text-white p-1.5 rounded-lg text-xs flex items-center gap-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                              <span>Lihat Penuh</span>
                            </button>
                          </div>
                        ) : (
                          <span>{content}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Critical Safety Points */}
            <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
              <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Poin Kritis Keselamatan & Hal yang Dilarang Keras:
              </h5>
              <ul className="space-y-1.5 text-xs text-amber-950 pl-5 list-disc">
                {selectedSop.safetyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>

            {/* Document Signature Sign-off footer */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between text-[11px] text-slate-400 gap-4">
              <div>
                <p>Disahkan oleh:</p>
                <p className="font-semibold text-slate-700 mt-1">Kepala Laboratorium IPA SMAIT As-Syifa</p>
              </div>
              <div>
                <p>Pelaksana Teknis:</p>
                <p className="font-semibold text-slate-700 mt-1">Laboran Fisika, Kimia & Biologi</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Tambah / Edit SOP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h4 className="font-bold text-slate-900 text-sm">
                {editingSop ? 'Edit Dokumen SOP & Panduan' : 'Tambah Dokumen SOP Baru'}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSop} className="py-4 space-y-4 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode SOP *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Contoh: SOP-LAB-05"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori SOP *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SOPItem['category'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Keselamatan">Keselamatan</option>
                    <option value="Peminjaman">Peminjaman</option>
                    <option value="Pengelolaan B3">Pengelolaan B3</option>
                    <option value="Instrumen">Instrumen</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul SOP / Panduan *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Prosedur Pengoperasian Spektrofotometer UV-Vis"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ringkasan & Tujuan Prosedur *
                </label>
                <textarea
                  required
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Deskripsi singkat mengenai tujuan dan ruang lingkup prosedur..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Optional Main Illustration Image */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gambar Utama Dokumen SOP (Opsional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer border border-slate-200 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Gambar Utama...</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </label>
                  {imageUrl ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-600 font-medium">Terlampir</span>
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Tidak ada</span>
                  )}
                </div>
                {imageUrl && (
                  <div className="mt-2 w-36 h-24 rounded-lg overflow-hidden border border-slate-200 bg-white p-1">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              {/* Langkah-Langkah Pelaksanaan dengan pilihan jenis Teks atau Gambar JPG/JPEG */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Langkah-Langkah Pelaksanaan (Pilihan Teks / Gambar JPG, JPEG, PNG) *
                  </label>
                  <button
                    type="button"
                    onClick={addStepItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Langkah
                  </button>
                </div>

                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 font-mono">
                          Langkah #{index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {/* Type selector: Text or Image */}
                          <div className="inline-flex rounded-lg p-0.5 bg-slate-200 text-xs">
                            <button
                              type="button"
                              onClick={() => handleStepTypeChange(index, 'text')}
                              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                step.type === 'text' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Teks
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStepTypeChange(index, 'image')}
                              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                step.type === 'image' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Gambar (JPG/PNG)
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeStepItem(index)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                            title="Hapus langkah ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {step.type === 'text' ? (
                        <textarea
                          rows={2}
                          value={step.content}
                          onChange={(e) => handleStepContentChange(index, e.target.value)}
                          placeholder="Tuliskan deskripsi langkah pelaksanaan..."
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer border border-slate-300 transition-colors shadow-2xs">
                              <Upload className="w-3.5 h-3.5 text-blue-600" />
                              <span>Pilih File JPG / JPEG / PNG...</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={(e) => handleStepImageUpload(index, e)}
                                className="sr-only"
                              />
                            </label>
                            {step.content ? (
                              <span className="text-xs text-emerald-700 font-medium">Gambar berhasil dilampirkan</span>
                            ) : (
                              <span className="text-xs text-slate-500">Belum ada file dipilih</span>
                            )}
                          </div>
                          {step.content && (
                            <div className="w-44 h-32 rounded-lg overflow-hidden border border-slate-200 bg-white p-1 shadow-2xs">
                              <img src={step.content} alt={`Langkah ${index + 1}`} className="w-full h-full object-contain" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Poin Kritis Keselamatan & Larangan (Tulis satu poin per baris)
                </label>
                <textarea
                  rows={3}
                  value={safetyText}
                  onChange={(e) => setSafetyText(e.target.value)}
                  placeholder="Jangan menyentuh lensa optik dengan tangan telanjang...&#10;Gunakan sarung tangan nitril..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCompressing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
                >
                  {isCompressing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isCompressing ? 'Memproses Gambar...' : editingSop ? 'Simpan Perubahan' : 'Tambah Dokumen SOP'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Modal Tampilan Penuh Tanpa Crop */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-4 shadow-2xl overflow-hidden flex flex-col items-center border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs font-bold text-slate-800">
              <span>{previewImage.title} (Rasio & Ukuran Utuh Tanpa Crop)</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 overflow-auto max-h-[75vh] flex items-center justify-center bg-slate-50 rounded-xl w-full">
              <img
                src={previewImage.src}
                alt={previewImage.title}
                className="max-w-full max-h-[70vh] object-contain block"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
