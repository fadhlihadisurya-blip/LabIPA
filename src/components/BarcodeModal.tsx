import React from 'react';
import { X, Printer, QrCode } from 'lucide-react';
import { Equipment } from '../types';

interface BarcodeModalProps {
  equipment: Equipment | null;
  onClose: () => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({ equipment, onClose }) => {
  if (!equipment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold text-slate-900 text-sm">
              Label Inventaris & Barcode Alat
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Label Card */}
        <div className="my-6 p-5 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center text-center">
          <div className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">
            LABORATORIUM IPA · SMAIT AS-SYIFA
          </div>

          <div className="text-sm font-bold text-slate-900 mt-1 max-w-[280px]">
            {equipment.name}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Kategori: {equipment.category} · Lokasi: {equipment.location}
          </div>

          {/* SVG Barcode Graphic */}
          <div className="my-4 py-2 px-4 bg-white rounded-md border border-slate-200 flex flex-col items-center shadow-2xs">
            <svg className="w-56 h-12" viewBox="0 0 200 45">
              {/* Simulated Code128 bar pattern */}
              <rect x="10" y="0" width="3" height="40" fill="#0f172a" />
              <rect x="15" y="0" width="1" height="40" fill="#0f172a" />
              <rect x="18" y="0" width="4" height="40" fill="#0f172a" />
              <rect x="25" y="0" width="2" height="40" fill="#0f172a" />
              <rect x="30" y="0" width="3" height="40" fill="#0f172a" />
              <rect x="35" y="0" width="1" height="40" fill="#0f172a" />
              <rect x="38" y="0" width="5" height="40" fill="#0f172a" />
              <rect x="46" y="0" width="2" height="40" fill="#0f172a" />
              <rect x="52" y="0" width="4" height="40" fill="#0f172a" />
              <rect x="58" y="0" width="1" height="40" fill="#0f172a" />
              <rect x="62" y="0" width="3" height="40" fill="#0f172a" />
              <rect x="68" y="0" width="2" height="40" fill="#0f172a" />
              <rect x="73" y="0" width="4" height="40" fill="#0f172a" />
              <rect x="80" y="0" width="2" height="40" fill="#0f172a" />
              <rect x="85" y="0" width="5" height="40" fill="#0f172a" />
              <rect x="94" y="0" width="1" height="40" fill="#0f172a" />
              <rect x="98" y="0" width="3" height="40" fill="#0f172a" />
              <rect x="104" y="0" width="4" height="40" fill="#0f172a" />
              <rect x="111" y="0" width="2" height="40" fill="#0f172a" />
              <rect x="116" y="0" width="3" height="40" fill="#0f172a" />
              <rect x="122" y="0" width="1" height="40" fill="#0f172a" />
              <rect x="126" y="0" width="5" height="40" fill="#0f172a" />
              <rect x="134" y="0" width="2" height="40" fill="#0f172a" />
              <rect x="139" y="0" width="3" height="40" fill="#0f172a" />
              <rect x="145" y="0" width="4" height="40" fill="#0f172a" />
              <rect x="152" y="0" width="2" height="40" fill="#0f172a" />
              <rect x="157" y="0" width="1" height="40" fill="#0f172a" />
              <rect x="162" y="0" width="4" height="40" fill="#0f172a" />
              <rect x="169" y="0" width="3" height="40" fill="#0f172a" />
              <rect x="175" y="0" width="2" height="40" fill="#0f172a" />
              <rect x="180" y="0" width="4" height="40" fill="#0f172a" />
              <rect x="187" y="0" width="2" height="40" fill="#0f172a" />
            </svg>
            <span className="font-mono font-bold text-xs text-slate-800 tracking-wider">
              *{equipment.code}*
            </span>
          </div>

          <div className="text-[10px] text-slate-400">
            Scan untuk cek status ketersediaan atau verifikasi pengembalian alat
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-mono">
            {equipment.totalCount} Unit Total
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Stiker Label
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
