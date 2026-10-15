import React from 'react';
import {
  LayoutDashboard,
  BookMarked,
  FlaskConical,
  FilePlus2,
  Wrench,
  ClipboardList,
  BookOpen,
  ShieldAlert,
  User,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { LabSection } from '../types';
import schoolLogo from '../assets/images/school_logo.jpg';

const REMOTE_LOGO_URL =
  'https://scontent.fcgk18-2.fna.fbcdn.net/v/t39.30808-6/456953159_122110235786466281_3715696561021636894_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x2048&ctp=s2048x2048&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFHDynqZNCJK9dwqOLtXCbAcY1ESlaeRCZxjURKVp5EJr_M5yd4199uehcxxxN2rNWt-5Phg2KaEEgtC1Y-tMxw&_nc_ohc=7QE8dgevH9gQ7kNvwGYzEeh&_nc_oc=AdonSG_xUYJpRTShT_2HaDJzbeXOe_oAp4FNRW5egFdXDgQOv1jlnI_c4-UepH4prlY&_nc_zt=23&_nc_ht=scontent.fcgk18-2.fna&_nc_gid=TTNZjuzEDGmLQU3t8tXVoA&_nc_ss=7b2a8&oh=00_AQPIf_c_POtuvwVJujVm4pWzXxMZ4SEGc1QukAmkGq4Dnw&oe=6AD4E002';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

interface NavItem {
  id: LabSection;
  label: string;
  icon: React.ElementType;
  badgeCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const {
    activeSection,
    setActiveSection,
    userMode,
    toggleUserMode,
    laboranUser,
    setIsAuthModalOpen,
    visits,
    borrows,
    chemicalRequests,
  } = useLab();

  // Pending count indicators for laboran/admin
  const pendingVisits = visits.filter((v) => v.status === 'Menunggu Persetujuan').length;
  const pendingBorrows = borrows.filter((b) => b.status === 'Menunggu Persetujuan').length;
  const pendingChems = chemicalRequests.filter((c) => c.status === 'Menunggu Persetujuan').length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ajuan-kunjungan', label: 'Ajuan Kunjungan Lab', icon: BookMarked, badgeCount: pendingVisits },
    { id: 'bahan-kimia', label: 'Bahan Kimia', icon: FlaskConical },
    { id: 'ajuan-bahan', label: 'Ajuan Bahan Praktikum', icon: FilePlus2, badgeCount: pendingChems },
    { id: 'alat-lab', label: 'Alat Laboratorium', icon: Wrench },
    { id: 'ajuan-alat', label: 'Ajuan Alat', icon: ClipboardList, badgeCount: pendingBorrows },
    { id: 'sop', label: 'SOP & Panduan', icon: BookOpen },
    { id: 'msds', label: 'Database MSDS', icon: ShieldAlert },
    ...(userMode === 'laboran'
      ? [
          {
            id: 'database-guru-murid' as LabSection,
            label: 'Database Guru & Murid',
            icon: Users,
          },
        ]
      : []),
  ];

  const handleNavClick = (id: LabSection) => {
    setActiveSection(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-[#123985] text-white transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-xl md:shadow-none select-none`}
      >
        {/* Header / Brand lockup matching image.png */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-blue-900/50">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white shrink-0 overflow-hidden ring-2 ring-amber-400/40 shadow-xs">
            <img
              src={schoolLogo}
              alt="Logo Laboratorium IPA"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== REMOTE_LOGO_URL) {
                  target.src = REMOTE_LOGO_URL;
                } else {
                  target.style.display = 'none';
                }
              }}
            />
            {/* SVG Fallback icon */}
            <div className="absolute inset-0 -z-10 flex items-center justify-center bg-blue-900 text-amber-400 font-bold text-xs pointer-events-none">
              IPA
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold tracking-tight text-white leading-tight truncate">
              Laboratorium IPA
            </h1>
            <p className="text-[10px] font-semibold text-blue-200 leading-tight mt-0.5 tracking-wide">
              SMAIT As-Syifa Boarding School Wanareja
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left group ${
                  isActive
                    ? 'bg-blue-600/90 text-white shadow-xs font-semibold'
                    : 'text-blue-100/85 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-blue-200 group-hover:text-white'
                  }`}
                />
                <span className="truncate flex-1">{item.label}</span>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-900 font-bold shrink-0">
                    {item.badgeCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: Laboran Akses Button matching image.png */}
        <div className="p-4 border-t border-blue-900/40 bg-[#0e2f70]/50 space-y-2.5">
          <button
            type="button"
            onClick={() => {
              if (userMode === 'laboran') {
                toggleUserMode();
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all shadow-xs ${
              userMode === 'laboran'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/40'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {userMode === 'laboran' ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-200 shrink-0" />
                <span className="truncate">Laboran Aktif (Admin)</span>
              </>
            ) : (
              <>
                <User className="w-4 h-4 text-blue-200 shrink-0" />
                <span className="truncate">Laboran Akses</span>
              </>
            )}
          </button>

          <div className="text-[11px] text-blue-200/70 text-center flex items-center justify-center gap-1.5 pt-0.5">
            {userMode === 'laboran' ? (
              <span className="text-[11px] text-blue-200/80">
                Klik tombol di atas untuk beralih ke Portal Siswa/Guru
              </span>
            ) : (
              <span>Klik untuk masuk sebagai Laboran</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
