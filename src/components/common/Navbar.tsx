import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  GraduationCap, 
  LogOut, 
  UserCheck, 
  Shield, 
  MapPin, 
  ChevronDown, 
  Wifi, 
  Building2,
  Flame,
  Check,
  X
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const Navbar: React.FC<{ onOpenCloudModal?: () => void }> = ({ onOpenCloudModal }) => {
  const { 
    currentUser, 
    role, 
    logout, 
    loginAs, 
    allUsers, 
    currentBranch, 
    setCurrentBranch, 
    branches, 
    currentBranchDetails 
  } = useAuth();

  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);

  const getRoleBadge = (userRole?: string) => {
    switch (userRole) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-purple-200 shrink-0"><Shield className="w-2.5 h-2.5" /> Admin</span>;
      case 'manager':
        return <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-amber-300 shrink-0"><Shield className="w-2.5 h-2.5 text-amber-600" /> Manager</span>;
      case 'staff':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-emerald-200 shrink-0"><UserCheck className="w-2.5 h-2.5" /> Staff</span>;
      case 'student':
        return <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-blue-200 shrink-0"><GraduationCap className="w-2.5 h-2.5" /> Student</span>;
      default:
        return null;
    }
  };

  const currentBranchShort = currentBranch === 'all' 
    ? 'All 4 Branches' 
    : (currentBranchDetails?.shortCode || currentBranchDetails?.location || currentBranch);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand Crest & Title */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-md shadow-slate-900/20 shrink-0 border border-slate-200/80 bg-slate-900 flex items-center justify-center">
            <img 
              src={logoImg} 
              alt="CSK Academy Logo" 
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = './logo.png'; }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5 leading-none">
              <span className="font-black text-slate-900 text-xs sm:text-sm tracking-tight truncate">
                CSK Academy
              </span>
              <span className="text-slate-300 font-light hidden xs:inline">/</span>
              <span className="font-semibold text-blue-700 text-[11px] sm:text-xs truncate hidden xs:inline">
                InfoSpark
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 leading-none">
              <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
              <span className="truncate font-medium text-slate-600">Salem, TN</span>
              <span className="hidden md:inline-flex items-center gap-0.5 text-[9px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200 font-semibold ml-1">
                <Flame className="w-2.5 h-2.5 text-amber-500" /> Spark Cloud
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions: Branch Switcher + User Profile + Cloud */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Branch Filter Dropdown Pill */}
          <div className="relative">
            <button
              onClick={() => {
                setShowBranchMenu(!showBranchMenu);
                setShowSwitchMenu(false);
              }}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
              title="Select Branch"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate max-w-[75px] xs:max-w-[110px] sm:max-w-[160px] text-[11px] sm:text-xs font-bold text-slate-800">
                {currentBranchShort}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {showBranchMenu && (
              <>
                {/* Backdrop overlay on mobile */}
                <div 
                  className="fixed inset-0 z-40 bg-black/20 sm:hidden" 
                  onClick={() => setShowBranchMenu(false)} 
                />
                <div 
                  className="fixed sm:absolute top-14 sm:top-full left-3 right-3 sm:left-auto sm:right-0 mt-1 max-w-sm sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[80vh] overflow-y-auto"
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Salem Campuses ({branches.length})
                      </p>
                      <p className="text-[11px] text-slate-500">Filter data across branches</p>
                    </div>
                    <button 
                      onClick={() => setShowBranchMenu(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 sm:hidden"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Option: All branches */}
                  <button
                    onClick={() => {
                      setCurrentBranch('all');
                      setShowBranchMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between text-xs transition-colors ${
                      currentBranch === 'all' ? 'bg-blue-50/80 text-blue-800 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">All 4 Salem Campuses</p>
                        <p className="text-[10px] text-slate-400">Combined view across Salem</p>
                      </div>
                    </div>
                    {currentBranch === 'all' && <Check className="w-4 h-4 text-blue-600" />}
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  {/* Individual Salem Branches */}
                  {branches.map(b => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setCurrentBranch(b.id);
                        setShowBranchMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between text-xs transition-colors ${
                        currentBranch === b.id ? 'bg-blue-50/80 text-blue-800 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="font-bold text-slate-900 text-xs">{b.name}</p>
                        <p className="text-[11px] text-blue-700 font-medium">{b.location}</p>
                        <p className="text-[10px] text-slate-400 truncate">{b.address}</p>
                      </div>
                      {currentBranch === b.id && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Cloud Sync Button */}
          {onOpenCloudModal && (
            <button
              onClick={onOpenCloudModal}
              className="p-1.5 sm:p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl text-xs transition-colors border border-slate-200/80 bg-slate-50"
              title="Cloud Sync Active"
            >
              <Wifi className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            </button>
          )}

          {/* User Profile / Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSwitchMenu(!showSwitchMenu);
                setShowBranchMenu(false);
              }}
              className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors border border-slate-200"
              title="User Account"
            >
              <div className={`w-6 h-6 rounded-lg text-white flex items-center justify-center font-bold text-[11px] ${
                role === 'admin' ? 'bg-purple-600' : role === 'staff' ? 'bg-emerald-600' : 'bg-blue-600'
              }`}>
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <span className="hidden md:block max-w-[80px] truncate text-[11px] font-bold text-slate-800">
                {currentUser?.name}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-500 hidden sm:block" />
            </button>

            {showSwitchMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/20 sm:hidden" 
                  onClick={() => setShowSwitchMenu(false)} 
                />
                <div 
                  className="fixed sm:absolute top-14 sm:top-full left-3 right-3 sm:left-auto sm:right-0 mt-1 max-w-sm sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="font-extrabold text-slate-900 text-xs truncate">{currentUser?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {getRoleBadge(currentUser?.role)}
                      <span className="text-[10px] text-slate-500 font-medium truncate">
                        {currentBranchDetails?.name || 'All Campuses'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1.5 px-2">
                    <button
                      onClick={() => {
                        setShowSwitchMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Log Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
