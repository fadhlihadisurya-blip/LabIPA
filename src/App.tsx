/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LabProvider, useLab } from './context/LabContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AjuanKunjunganView } from './components/AjuanKunjunganView';
import { BahanKimiaView } from './components/BahanKimiaView';
import { AjuanBahanView } from './components/AjuanBahanView';
import { AlatLabView } from './components/AlatLabView';
import { AjuanAlatView } from './components/AjuanAlatView';
import { SopPanduanView } from './components/SopPanduanView';
import { MsdsDatabaseView } from './components/MsdsDatabaseView';
import { DatabaseGuruMuridView } from './components/DatabaseGuruMuridView';
import { LaboranAuthModal } from './components/LaboranAuthModal';

const MainLayout: React.FC = () => {
  const { activeSection } = useLab();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardView />;
      case 'ajuan-kunjungan':
        return <AjuanKunjunganView />;
      case 'bahan-kimia':
        return <BahanKimiaView />;
      case 'ajuan-bahan':
        return <AjuanBahanView />;
      case 'alat-lab':
        return <AlatLabView />;
      case 'ajuan-alat':
        return <AjuanAlatView />;
      case 'sop':
        return <SopPanduanView />;
      case 'msds':
        return <MsdsDatabaseView />;
      case 'database-guru-murid':
        return <DatabaseGuruMuridView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex">
      {/* Sidebar matching image.png */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0 min-h-screen">
        <Header onOpenMobileMenu={() => setIsMobileOpen(true)} />

        <main className="flex-1">
          {renderActiveView()}
        </main>

        {/* Quiet Footer */}
        <footer className="px-6 py-4 border-t border-slate-200/80 bg-white/70 text-slate-400 text-xs text-center flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SIMLAB IPA · Sistem Inventarisasi & Pengelolaan Laboratorium SMAIT As-Syifa Boarding School Wanareja</span>
          <span className="font-mono text-[11px] text-slate-400">Versi 2.4.0 · Standar GHS & Kemendikbud</span>
        </footer>
      </div>

      {/* Laboran Email & Password Authentication Modal */}
      <LaboranAuthModal />
    </div>
  );
};

export default function App() {
  return (
    <LabProvider>
      <MainLayout />
    </LabProvider>
  );
}
