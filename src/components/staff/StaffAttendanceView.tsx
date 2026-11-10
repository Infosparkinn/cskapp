import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  X, 
  Check, 
  Filter, 
  Ticket, 
  Briefcase, 
  UserCheck, 
  FileText, 
  ShieldCheck, 
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Plane,
  HeartPulse,
  Sun
} from 'lucide-react';
import { dbService, getTodayDate, getCurrentTime, BRANCHES } from '../../services/db';
import type { StaffAttendance, StaffPermission, StaffPermissionType, LeaveRequest, LeaveType, BranchId } from '../../types';

interface StaffAttendanceViewProps {
  staffId: string;
  staffName: string;
  branchId?: BranchId;
}

export const StaffAttendanceView: React.FC<StaffAttendanceViewProps> = ({
  staffId,
  staffName,
  branchId
}) => {
  const currentMonth = getTodayDate().substring(0, 7); // e.g. "2026-11"
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'permissions' | 'leaves'>('attendance');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New permission form state
  const [permDate, setPermDate] = useState(getTodayDate());
  const [permType, setPermType] = useState<StaffPermissionType>('morning_late');
  const [permStartTime, setPermStartTime] = useState('09:30 AM');
  const [permEndTime, setPermEndTime] = useState('11:00 AM');
  const [permDuration, setPermDuration] = useState('1.5');
  const [permReason, setPermReason] = useState('');

  // New leave form state
  const [leaveType, setLeaveType] = useState<LeaveType>('casual');
  const [leaveStartDate, setLeaveStartDate] = useState(getTodayDate());
  const [leaveEndDate, setLeaveEndDate] = useState(getTodayDate());
  const [leaveIsHalfDay, setLeaveIsHalfDay] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');

  // Live data state
  const [stats, setStats] = useState(() => dbService.getStaffAttendanceStats(staffId, selectedMonth !== 'all' ? selectedMonth : undefined));

  const refreshData = () => {
    setStats(dbService.getStaffAttendanceStats(staffId, selectedMonth !== 'all' ? selectedMonth : undefined));
  };

  useEffect(() => {
    refreshData();
  }, [staffId, selectedMonth]);

  useEffect(() => {
    const handleDbChange = () => refreshData();
    window.addEventListener('educenter-db-change', handleDbChange);
    return () => window.removeEventListener('educenter-db-change', handleDbChange);
  }, [staffId, selectedMonth]);

  // Compute days between dates
  const calculateLeaveDays = () => {
    if (leaveIsHalfDay) return 0.5;
    if (!leaveStartDate || !leaveEndDate) return 1;
    const start = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);
    if (end < start) return 1;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleApplyPermission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permReason.trim()) {
      alert('Please enter a reason for the permission.');
      return;
    }

    const durationNum = parseFloat(permDuration) || 1;

    dbService.addStaffPermission({
      staffId,
      staffName,
      userRole: 'staff',
      branchId,
      date: permDate,
      permissionType: permType,
      startTime: permStartTime,
      endTime: permEndTime,
      durationHours: durationNum,
      reason: permReason.trim(),
      status: 'pending'
    });

    setSuccessMessage(`Permission request for ${permDate} (${durationNum} hrs) submitted successfully!`);
    setShowPermissionModal(false);
    setPermReason('');
    refreshData();
    window.dispatchEvent(new Event('educenter-db-change'));

    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      alert('Please specify the reason for your leave.');
      return;
    }

    const computedDays = calculateLeaveDays();

    dbService.addLeave({
      userId: staffId,
      userName: staffName,
      userRole: 'staff',
      branchId,
      leaveType,
      startDate: leaveStartDate,
      endDate: leaveIsHalfDay ? leaveStartDate : leaveEndDate,
      totalDays: computedDays,
      isHalfDay: leaveIsHalfDay,
      reason: leaveReason.trim(),
      status: 'pending'
    });

    setSuccessMessage(`Leave application (${computedDays} day${computedDays > 1 ? 's' : ''}) submitted successfully!`);
    setShowLeaveModal(false);
    setLeaveReason('');
    refreshData();
    window.dispatchEvent(new Event('educenter-db-change'));

    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const branchObj = BRANCHES.find(b => b.id === branchId);

  // Quick preset helper
  const applyPreset = (type: StaffPermissionType, start: string, end: string, dur: string, defaultReason: string) => {
    setPermType(type);
    setPermStartTime(start);
    setPermEndTime(end);
    setPermDuration(dur);
    setPermReason(defaultReason);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner & Month Filter */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-500/30 text-blue-200 border border-blue-400/30">
                Staff Shift & Attendance Hub
              </span>
              {branchObj && (
                <span className="text-xs text-blue-200/80 font-medium">
                  • {branchObj.location}
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {staffName}'s Attendance & Leaves
            </h2>
            <p className="text-xs md:text-sm text-blue-200/80 mt-1 max-w-xl">
              Track how many days you were present, total shift hours, leave history, and monthly permissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Filter Selector */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/15 flex items-center gap-2 text-xs">
              <Filter className="w-4 h-4 text-blue-300 shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white font-bold outline-hidden cursor-pointer"
              >
                <option value={currentMonth} className="text-slate-900">Current Month ({currentMonth})</option>
                <option value="2026-10" className="text-slate-900">October 2026 (2026-10)</option>
                <option value="all" className="text-slate-900">All Months (Overall)</option>
              </select>
            </div>

            {/* Request Permission Button */}
            <button
              onClick={() => setShowPermissionModal(true)}
              className="py-2.5 px-3.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/25 transition-all"
            >
              <Ticket className="w-4 h-4" />
              Request Permission
            </button>

            {/* Apply Leave Button */}
            <button
              onClick={() => setShowLeaveModal(true)}
              className="py-2.5 px-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              Apply Leave
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center justify-between gap-2 shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="p-1 text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Days Present */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Days Present</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{stats.totalDaysPresent}</span>
              <span className="text-xs font-bold text-slate-500">Days</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
              <Check className="w-3 h-3" />
              <span>Verified Attendance</span>
            </div>
          </div>
        </div>

        {/* Total Shift Hours */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Hours</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-blue-700">{stats.totalHoursFormatted}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Punch In to Punch Out
            </p>
          </div>
        </div>

        {/* Permissions Taken */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Permissions</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-purple-700">{stats.totalPermissionCount}</span>
              <span className="text-xs font-bold text-slate-500">Availed</span>
            </div>
            <p className="mt-1 text-[11px] text-purple-700 font-semibold">
              {stats.totalPermissionHours} Hours Total
            </p>
          </div>
        </div>

        {/* Leaves Taken */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Leaves Taken</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-700">{stats.totalLeaveDays ?? 0}</span>
              <span className="text-xs font-bold text-slate-500">Days</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {stats.totalLeavesCount ?? 0} Applications ({stats.totalHalfDays} Half-Days)
            </p>
          </div>
        </div>
      </div>

      {/* Sub Tabs: Shift Attendance vs Permission Details vs Leave Applications */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`flex items-center gap-2 py-2 px-4 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'attendance'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Shift Attendance Logs ({stats.attendanceList.length})
        </button>

        <button
          onClick={() => setActiveSubTab('permissions')}
          className={`flex items-center gap-2 py-2 px-4 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'permissions'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Ticket className="w-4 h-4" />
          Permission Details ({stats.permissionsList.length})
        </button>

        <button
          onClick={() => setActiveSubTab('leaves')}
          className={`flex items-center gap-2 py-2 px-4 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'leaves'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Leave Applications ({stats.leavesList?.length || 0})
        </button>
      </div>

      {/* VIEW 1: ATTENDANCE LOGS */}
      {activeSubTab === 'attendance' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Detailed Shift & Attendance Logs
              </h3>
              <p className="text-xs text-slate-400">
                Daily login and logout timestamps with verified shift hours
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
              {selectedMonth === 'all' ? 'All Months' : selectedMonth}
            </span>
          </div>

          {stats.attendanceList.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
              <p className="text-xs">No attendance logged for {selectedMonth}.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.attendanceList.map((record) => {
                const matchingPerm = stats.permissionsList.find(p => p.date === record.date);

                return (
                  <div 
                    key={record.id}
                    className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm">{record.date}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 capitalize">
                          {record.status}
                        </span>
                        {record.hasPermission || matchingPerm ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
                            <Ticket className="w-3 h-3" />
                            Permission Availed
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <Check className="w-3.5 h-3.5" /> In: {record.loginTime}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-700 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> Out: {record.logoutTime || 'Shift Active'}
                        </span>
                        <span>•</span>
                        <span className="text-blue-700 font-bold">
                          Hours: {record.totalHours || 'Calculating...'}
                        </span>
                      </div>

                      {(record.permissionReason || matchingPerm?.reason) && (
                        <div className="mt-1 p-2 bg-purple-50/80 border border-purple-100 rounded-xl text-[11px] text-purple-900">
                          <strong className="font-bold">Permission Note:</strong> {record.permissionReason || matchingPerm?.reason} ({record.permissionHours || matchingPerm?.durationHours} hrs)
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-slate-400">
                        Punch ID: {record.id.substring(0, 14)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PERMISSION DETAILS */}
      {activeSubTab === 'permissions' && (
        <div className="space-y-4">
          {/* Policy Banner */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 rounded-3xl flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600 text-white shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs text-purple-950 space-y-1">
              <h4 className="font-extrabold text-sm text-purple-900">CSK Academy Staff Permission Policy</h4>
              <p className="text-slate-600 leading-relaxed">
                Staff members are eligible for up to <strong>2 permissions per calendar month</strong> (maximum 2 hours per session) for personal/medical errands. Manager and Admin review all permissions.
              </p>
              <div className="pt-1 flex items-center gap-3 text-[11px] font-bold text-purple-800">
                <span>Monthly Quota: 2 Permissions</span>
                <span>•</span>
                <span>Used This Month: {stats.totalPermissionCount}</span>
                <span>•</span>
                <span>Available: {Math.max(0, 2 - stats.totalPermissionCount)} Remaining</span>
              </div>
            </div>
          </div>

          {/* Permission Log List */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Permission History & Requests
                </h3>
                <p className="text-xs text-slate-400">
                  Breakdown of availed time slots, reasons, and approval status
                </p>
              </div>

              <button
                onClick={() => setShowPermissionModal(true)}
                className="py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Request Permission
              </button>
            </div>

            {stats.permissionsList.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Ticket className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                <p className="text-xs">No permissions availed in {selectedMonth}.</p>
                <button
                  onClick={() => setShowPermissionModal(true)}
                  className="mt-3 text-xs font-bold text-purple-600 hover:text-purple-800 underline"
                >
                  Need a permission? Request one here
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.permissionsList.map((perm) => (
                  <div
                    key={perm.id}
                    className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm">{perm.date}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 capitalize">
                          {perm.permissionType.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {perm.durationHours} Hours Duration
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          perm.status === 'approved' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : perm.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                        } capitalize`}>
                          {perm.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        <span className="font-medium">Time Window: <strong>{perm.startTime}</strong> to <strong>{perm.endTime}</strong></span>
                      </div>

                      <p className="text-slate-800 font-medium bg-white p-2.5 rounded-xl border border-slate-200/70 text-xs">
                        <span className="font-bold text-slate-600">Reason / Purpose:</span> {perm.reason}
                      </p>

                      {perm.approvedBy && (
                        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Reviewer: {perm.approvedBy}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-slate-400">
                        Ref: {perm.id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: LEAVE APPLICATIONS */}
      {activeSubTab === 'leaves' && (
        <div className="space-y-4">
          {/* Leave Policies Banner */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-3xl flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shrink-0 mt-0.5">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="text-xs text-emerald-950 space-y-1">
              <h4 className="font-extrabold text-sm text-emerald-900">CSK Academy Leave Guidelines</h4>
              <p className="text-slate-600 leading-relaxed">
                Staff can apply for <strong>Casual, Sick, Emergency, Planned, or Half-Day</strong> leaves. Once submitted, your Branch Manager and Admin will be notified to review and approve your application.
              </p>
              <div className="pt-1 flex items-center gap-3 text-[11px] font-bold text-emerald-800">
                <span>Total Leaves Logged: {stats.totalLeavesCount ?? 0}</span>
                <span>•</span>
                <span>Total Leave Days: {stats.totalLeaveDays ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Leave Applications List */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Leave Applications History
                </h3>
                <p className="text-xs text-slate-400">
                  Status of past and upcoming leave applications
                </p>
              </div>

              <button
                onClick={() => setShowLeaveModal(true)}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Apply Leave
              </button>
            </div>

            {(!stats.leavesList || stats.leavesList.length === 0) ? (
              <div className="py-12 text-center text-slate-400">
                <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                <p className="text-xs">No leave applications for {selectedMonth}.</p>
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-800 underline"
                >
                  Need to take leave? Apply here
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.leavesList.map((leave) => (
                  <div
                    key={leave.id}
                    className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {leave.startDate} {leave.endDate !== leave.startDate ? `to ${leave.endDate}` : ''}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 capitalize">
                          {leave.leaveType.replace('_', ' ')} Leave
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                          {leave.totalDays} Day{leave.totalDays > 1 ? 's' : ''} {leave.isHalfDay ? '(Half-Day)' : ''}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          leave.status === 'approved' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : leave.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                        } capitalize`}>
                          {leave.status}
                        </span>
                      </div>

                      <p className="text-slate-800 font-medium bg-white p-2.5 rounded-xl border border-slate-200/70 text-xs">
                        <span className="font-bold text-slate-600">Reason:</span> {leave.reason}
                      </p>

                      {leave.reviewedBy && (
                        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Reviewed by: {leave.reviewedBy}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-slate-400">
                        Ref: {leave.id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: APPLY / RECORD PERMISSION */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Request Staff Permission</h3>
                  <p className="text-xs text-slate-500">Record late arrival, early exit, or mid-shift permission</p>
                </div>
              </div>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2">Quick Presets (Click to Auto-fill):</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('morning_late', '09:00 AM', '10:30 AM', '1.5', 'Bank work / Document verification')}
                  className="p-2 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 rounded-xl text-[11px] text-left transition-colors"
                >
                  <p className="font-bold text-purple-900">Morning Late</p>
                  <span className="text-slate-500">1.5 hrs (Bank)</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('evening_early', '05:00 PM', '06:30 PM', '1.5', 'Personal family errand')}
                  className="p-2 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 rounded-xl text-[11px] text-left transition-colors"
                >
                  <p className="font-bold text-purple-900">Early Exit</p>
                  <span className="text-slate-500">1.5 hrs (Personal)</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('mid_day', '01:00 PM', '02:30 PM', '1.5', 'Medical clinic consultation')}
                  className="p-2 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 rounded-xl text-[11px] text-left transition-colors"
                >
                  <p className="font-bold text-purple-900">Mid-Shift</p>
                  <span className="text-slate-500">1.5 hrs (Clinic)</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleApplyPermission} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={permDate}
                    onChange={(e) => setPermDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Permission Type</label>
                  <select
                    value={permType}
                    onChange={(e) => setPermType(e.target.value as StaffPermissionType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-purple-500"
                  >
                    <option value="morning_late">Morning Late Arrival (1 - 2 hrs)</option>
                    <option value="evening_early">Evening Early Departure (1 - 2 hrs)</option>
                    <option value="mid_day">Mid-Day Outing (1 - 2 hrs)</option>
                    <option value="emergency">Emergency Situation</option>
                    <option value="personal">Personal Urgent Work</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={permStartTime}
                    onChange={(e) => setPermStartTime(e.target.value)}
                    placeholder="09:30 AM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    value={permEndTime}
                    onChange={(e) => setPermEndTime(e.target.value)}
                    placeholder="11:00 AM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration</label>
                  <select
                    value={permDuration}
                    onChange={(e) => setPermDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-purple-900 focus:outline-hidden focus:border-purple-500"
                  >
                    <option value="0.5">0.5 Hour (30m)</option>
                    <option value="1">1.0 Hour</option>
                    <option value="1.5">1.5 Hours</option>
                    <option value="2">2.0 Hours (Max)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Permission <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={permReason}
                  onChange={(e) => setPermReason(e.target.value)}
                  placeholder="e.g. Bank visit for Aadhaar link or personal appointment..."
                  rows={3}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-purple-500 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPermissionModal(false)}
                  className="py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20"
                >
                  Submit Permission Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APPLY FOR LEAVE */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Apply for Leave</h3>
                  <p className="text-xs text-slate-500">Submit formal leave application for manager & admin approval</p>
                </div>
              </div>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Leave Category</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="casual">Casual Leave (CL)</option>
                    <option value="sick">Sick Leave (SL)</option>
                    <option value="emergency">Emergency Leave</option>
                    <option value="planned">Planned Vacation / Festival</option>
                    <option value="half_day">Half-Day Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Leave Type</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={leaveIsHalfDay}
                      onChange={(e) => setLeaveIsHalfDay(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                    <span className="font-bold text-slate-700">Is Half-Day Leave</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => {
                      setLeaveStartDate(e.target.value);
                      if (!leaveIsHalfDay && leaveEndDate < e.target.value) {
                        setLeaveEndDate(e.target.value);
                      }
                    }}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                {!leaveIsHalfDay ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={leaveEndDate}
                      onChange={(e) => setLeaveEndDate(e.target.value)}
                      min={leaveStartDate}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Session</label>
                    <div className="px-3 py-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl font-bold">
                      Half Day (0.5 Day)
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-semibold">Calculated Duration:</span>
                <span className="text-sm font-extrabold text-emerald-700">
                  {calculateLeaveDays()} Day{calculateLeaveDays() > 1 ? 's' : ''}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Leave <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Provide a clear reason for the leave application..."
                  rows={3}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
                >
                  Submit Leave Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
