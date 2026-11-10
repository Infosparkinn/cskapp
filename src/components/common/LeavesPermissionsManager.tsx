import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Ticket, 
  Palmtree, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  X, 
  Check, 
  Filter, 
  Download, 
  User, 
  Briefcase, 
  Building2, 
  ShieldCheck, 
  ChevronRight,
  Sparkles,
  CheckCheck
} from 'lucide-react';
import { dbService, getTodayDate, BRANCHES, downloadCSV } from '../../services/db';
import type { BranchId, LeaveRequest, LeaveType, StaffPermission, StaffPermissionType } from '../../types';

interface LeavesPermissionsManagerProps {
  viewerRole: 'admin' | 'manager';
  managerBranchId?: BranchId;
  currentUserId?: string;
  currentUserName?: string;
}

export const LeavesPermissionsManager: React.FC<LeavesPermissionsManagerProps> = ({
  viewerRole,
  managerBranchId,
  currentUserId,
  currentUserName
}) => {
  const currentMonth = getTodayDate().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedBranch, setSelectedBranch] = useState<BranchId | 'all'>(
    viewerRole === 'manager' && managerBranchId ? managerBranchId : 'all'
  );
  const [selectedRole, setSelectedRole] = useState<'all' | 'staff' | 'manager'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [activeTab, setActiveTab] = useState<'leaves' | 'permissions'>('leaves');

  // Manager specific sub-mode: My requests vs Branch Staff requests
  const [managerViewMode, setManagerViewMode] = useState<'staff_requests' | 'my_requests'>(
    viewerRole === 'manager' ? 'staff_requests' : 'staff_requests'
  );

  // Modals state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New Leave Form
  const [leaveApplicantId, setLeaveApplicantId] = useState(currentUserId || '');
  const [leaveType, setLeaveType] = useState<LeaveType>('casual');
  const [leaveStartDate, setLeaveStartDate] = useState(getTodayDate());
  const [leaveEndDate, setLeaveEndDate] = useState(getTodayDate());
  const [leaveDays, setLeaveDays] = useState(1);
  const [leaveReason, setLeaveReason] = useState('');

  // New Permission Form
  const [permApplicantId, setPermApplicantId] = useState(currentUserId || '');
  const [permDate, setPermDate] = useState(getTodayDate());
  const [permType, setPermType] = useState<StaffPermissionType>('morning_late');
  const [permStartTime, setPermStartTime] = useState('09:30 AM');
  const [permEndTime, setPermEndTime] = useState('11:00 AM');
  const [permDuration, setPermDuration] = useState('1.5');
  const [permReason, setPermReason] = useState('');

  // Data fetching
  const [leavesList, setLeavesList] = useState<LeaveRequest[]>([]);
  const [permissionsList, setPermissionsList] = useState<StaffPermission[]>([]);

  const loadData = () => {
    // If manager is viewing "My requests", filter strictly by currentUserId
    const filterUserId = (viewerRole === 'manager' && managerViewMode === 'my_requests') 
      ? currentUserId 
      : undefined;

    const filterBranch = (viewerRole === 'manager' && managerViewMode === 'staff_requests') 
      ? (managerBranchId || selectedBranch) 
      : (viewerRole === 'admin' ? selectedBranch : undefined);

    const filterRole = (viewerRole === 'manager' && managerViewMode === 'staff_requests')
      ? 'staff'
      : (viewerRole === 'manager' && managerViewMode === 'my_requests')
        ? 'manager'
        : selectedRole;

    let leaves = dbService.getLeaves(filterUserId, filterBranch, selectedMonth !== 'all' ? selectedMonth : undefined, filterRole);
    let perms = dbService.getStaffPermissions(filterUserId, selectedMonth !== 'all' ? selectedMonth : undefined, filterBranch, filterRole);

    if (selectedStatus !== 'all') {
      leaves = leaves.filter(l => l.status === selectedStatus);
      perms = perms.filter(p => p.status === selectedStatus);
    }

    setLeavesList(leaves);
    setPermissionsList(perms);
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedBranch, selectedRole, selectedStatus, managerViewMode]);

  useEffect(() => {
    const handleDbChange = () => loadData();
    window.addEventListener('educenter-db-change', handleDbChange);
    return () => window.removeEventListener('educenter-db-change', handleDbChange);
  }, [selectedMonth, selectedBranch, selectedRole, selectedStatus, managerViewMode]);

  // List of all staff and managers for dropdowns
  const allUsers = dbService.getUsers().filter(u => u.role === 'staff' || u.role === 'manager');
  const selectableUsers = viewerRole === 'manager' 
    ? allUsers.filter(u => u.branchId === managerBranchId || u.id === currentUserId)
    : allUsers;

  // Approval check:
  // - Admin only can approve/reject for branch managers
  // - For staff, both branch manager and admin can approve
  const canApprove = (targetRole?: 'staff' | 'manager') => {
    if (targetRole === 'manager') {
      return viewerRole === 'admin';
    }
    return viewerRole === 'admin' || viewerRole === 'manager';
  };

  // Approve / Reject Handlers
  // Rule: Admin only can approve for branch manager; For staff, both manager and admin can approve.
  // Rule: Remove "(Anand)" when approved by admin -> always "Center Admin"
  const handleApproveLeave = (id: string, targetRole?: 'staff' | 'manager') => {
    if (targetRole === 'manager' && viewerRole !== 'admin') {
      alert('Branch Manager leave requests can only be approved by the Center Admin.');
      return;
    }
    const approverText = viewerRole === 'admin' ? 'Center Admin' : 'Branch Manager';
    dbService.updateLeaveStatus(id, 'approved', approverText);
    setActionSuccess('Leave request approved successfully!');
    loadData();
    window.dispatchEvent(new Event('educenter-db-change'));
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleRejectLeave = (id: string, targetRole?: 'staff' | 'manager') => {
    if (targetRole === 'manager' && viewerRole !== 'admin') {
      alert('Branch Manager leave requests can only be rejected by the Center Admin.');
      return;
    }
    const approverText = viewerRole === 'admin' ? 'Center Admin' : 'Branch Manager';
    dbService.updateLeaveStatus(id, 'rejected', approverText);
    setActionSuccess('Leave request marked as rejected.');
    loadData();
    window.dispatchEvent(new Event('educenter-db-change'));
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleApprovePerm = (id: string, targetRole?: 'staff' | 'manager') => {
    if (targetRole === 'manager' && viewerRole !== 'admin') {
      alert('Branch Manager permission requests can only be approved by the Center Admin.');
      return;
    }
    const approverText = viewerRole === 'admin' ? 'Center Admin' : 'Branch Manager';
    dbService.updateStaffPermissionStatus(id, 'approved', approverText);
    setActionSuccess('Permission approved successfully!');
    loadData();
    window.dispatchEvent(new Event('educenter-db-change'));
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleRejectPerm = (id: string, targetRole?: 'staff' | 'manager') => {
    if (targetRole === 'manager' && viewerRole !== 'admin') {
      alert('Branch Manager permission requests can only be rejected by the Center Admin.');
      return;
    }
    const approverText = viewerRole === 'admin' ? 'Center Admin' : 'Branch Manager';
    dbService.updateStaffPermissionStatus(id, 'rejected', approverText);
    setActionSuccess('Permission marked as rejected.');
    loadData();
    window.dispatchEvent(new Event('educenter-db-change'));
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Submit New Leave
  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = dbService.getUserById(leaveApplicantId || currentUserId || '');
    if (!targetUser) {
      alert('Please select an applicant.');
      return;
    }

    const isManagerApplicant = targetUser.role === 'manager';
    // When Admin creates, it is pre-approved by Center Admin. When Manager or Staff applies, it is PENDING!
    const initialStatus = viewerRole === 'admin' ? 'approved' : 'pending';
    const approvedByText = viewerRole === 'admin' ? 'Center Admin' : undefined;

    dbService.addLeave({
      userId: targetUser.id,
      userName: targetUser.name,
      userRole: isManagerApplicant ? 'manager' : 'staff',
      branchId: targetUser.branchId || managerBranchId,
      leaveType,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      totalDays: Number(leaveDays) || 1,
      reason: leaveReason.trim() || 'Personal Leave',
      status: initialStatus,
      approvedBy: approvedByText
    });

    setActionSuccess(
      isManagerApplicant && viewerRole === 'manager'
        ? 'Manager leave request submitted! Awaiting Center Admin approval.'
        : `Leave for ${targetUser.name} submitted successfully!`
    );
    setShowLeaveModal(false);
    setLeaveReason('');
    loadData();
    window.dispatchEvent(new Event('educenter-db-change'));
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // Submit New Permission
  const handleCreatePermission = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = dbService.getUserById(permApplicantId || currentUserId || '');
    if (!targetUser) {
      alert('Please select an applicant.');
      return;
    }

    const isManagerApplicant = targetUser.role === 'manager';
    // When Admin creates, it is pre-approved by Center Admin. When Manager or Staff applies, it is PENDING!
    const initialStatus = viewerRole === 'admin' ? 'approved' : 'pending';
    const approvedByText = viewerRole === 'admin' ? 'Center Admin' : undefined;

    dbService.addStaffPermission({
      staffId: targetUser.id,
      staffName: targetUser.name,
      userRole: isManagerApplicant ? 'manager' : 'staff',
      branchId: targetUser.branchId || managerBranchId,
      date: permDate,
      permissionType: permType,
      startTime: permStartTime,
      endTime: permEndTime,
      durationHours: parseFloat(permDuration) || 1,
      reason: permReason.trim() || 'General Permission',
      status: initialStatus,
      approvedBy: approvedByText
    });

    setActionSuccess(
      isManagerApplicant && viewerRole === 'manager'
        ? 'Manager permission request submitted! Awaiting Center Admin approval.'
        : `Permission for ${targetUser.name} logged successfully!`
    );
    setShowPermissionModal(false);
    setPermReason('');
    loadData();
    window.dispatchEvent(new Event('educenter-db-change'));
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (activeTab === 'leaves') {
      const headers = ['Leave ID', 'Applicant Name', 'Role', 'Branch', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status', 'Approved By', 'Applied Date'];
      const rows = leavesList.map(l => {
        const b = BRANCHES.find(br => br.id === l.branchId);
        return [
          l.id,
          l.userName,
          l.userRole === 'manager' ? 'Branch Manager' : 'Staff Faculty',
          b?.fullName || 'Salem',
          l.leaveType.toUpperCase(),
          l.startDate,
          l.endDate,
          l.totalDays,
          `"${l.reason.replace(/"/g, '""')}"`,
          l.status.toUpperCase(),
          l.approvedBy || 'Pending',
          l.appliedOn
        ];
      });
      downloadCSV(`csk-leaves-${selectedBranch}-${selectedMonth || 'all'}.csv`, headers, rows);
    } else {
      const headers = ['Permission ID', 'Name', 'Role', 'Branch', 'Date', 'Type', 'Start Time', 'End Time', 'Duration (Hrs)', 'Reason', 'Status', 'Approved By'];
      const rows = permissionsList.map(p => {
        const b = BRANCHES.find(br => br.id === p.branchId);
        return [
          p.id,
          p.staffName,
          p.userRole === 'manager' ? 'Branch Manager' : 'Staff Faculty',
          b?.fullName || 'Salem',
          p.date,
          p.permissionType.toUpperCase(),
          p.startTime,
          p.endTime,
          p.durationHours,
          `"${p.reason.replace(/"/g, '""')}"`,
          p.status.toUpperCase(),
          p.approvedBy || 'Pending'
        ];
      });
      downloadCSV(`csk-permissions-${selectedBranch}-${selectedMonth || 'all'}.csv`, headers, rows);
    }
  };

  // Compute Pending Count
  const pendingLeavesCount = leavesList.filter(l => l.status === 'pending').length;
  const pendingPermsCount = permissionsList.filter(p => p.status === 'pending').length;
  const totalPending = pendingLeavesCount + pendingPermsCount;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-purple-500/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
                {viewerRole === 'admin' ? 'Executive Administration' : 'Branch Management Portal'}
              </span>
              <span className="text-xs text-blue-200 font-medium">
                • Salem Multi-Campus Leave & Permission Control
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
              Staff & Manager Leaves & Permissions
            </h2>
            <p className="text-xs md:text-sm text-blue-200/80 mt-1 max-w-2xl">
              Monitor, approve, and record daily permissions and planned leaves across all campus staff and managers.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setLeaveApplicantId(currentUserId || '');
                setShowLeaveModal(true);
              }}
              className="py-2.5 px-3.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Apply Leave
            </button>

            <button
              onClick={() => {
                setPermApplicantId(currentUserId || '');
                setShowPermissionModal(true);
              }}
              className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Request Permission
            </button>

            <button
              onClick={handleExportCSV}
              className="py-2.5 px-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 border border-white/20 transition-all"
              title="Download CSV report"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center justify-between gap-2 shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="p-1 text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Manager Sub-Toggle (Staff Requests vs My Personal Requests) */}
      {viewerRole === 'manager' && (
        <div className="bg-white p-2 rounded-2xl border border-slate-200 flex items-center gap-2 max-w-fit shadow-xs">
          <button
            onClick={() => setManagerViewMode('staff_requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              managerViewMode === 'staff_requests'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Branch Staff Requests & Approvals
          </button>
          <button
            onClick={() => setManagerViewMode('my_requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              managerViewMode === 'my_requests'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            My Manager Leaves & Permissions
          </button>
        </div>
      )}

      {/* 4 Stat KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Leaves</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Palmtree className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-purple-900">{leavesList.length}</span>
              <span className="text-xs font-bold text-slate-500">Applications</span>
            </div>
            <p className="mt-1 text-[11px] text-purple-700 font-semibold">
              {leavesList.reduce((acc, l) => acc + (Number(l.totalDays) || 1), 0)} Total Days Taken
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Permissions</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-blue-900">{permissionsList.length}</span>
              <span className="text-xs font-bold text-slate-500">Availed</span>
            </div>
            <p className="mt-1 text-[11px] text-blue-700 font-semibold">
              {permissionsList.reduce((acc, p) => acc + (Number(p.durationHours) || 0), 0)} Total Hours
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Actions</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-700">{totalPending}</span>
              <span className="text-xs font-bold text-slate-500">Awaiting Approval</span>
            </div>
            <p className="mt-1 text-[11px] text-amber-700 font-semibold">
              {pendingLeavesCount} Leaves • {pendingPermsCount} Permissions
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved Total</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-800">
                {leavesList.filter(l => l.status === 'approved').length + permissionsList.filter(p => p.status === 'approved').length}
              </span>
              <span className="text-xs font-bold text-slate-500">Approved</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-700 font-semibold">
              Active Authorized Records
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Branch filter (Admin or overview) */}
          {viewerRole === 'admin' && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value as BranchId | 'all')}
                className="bg-transparent font-bold text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="all">All 4 Salem Campuses</option>
                {BRANCHES.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                ))}
              </select>
            </div>
          )}

          {/* Role filter (Admin) */}
          {viewerRole === 'admin' && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'all' | 'staff' | 'manager')}
                className="bg-transparent font-bold text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="all">All Roles (Staff & Managers)</option>
                <option value="manager">Branch Managers Only</option>
                <option value="staff">Teaching & Telecalling Staff</option>
              </select>
            </div>
          )}

          {/* Month filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-hidden cursor-pointer"
            >
              <option value={currentMonth}>Current Month ({currentMonth})</option>
              <option value="2026-10">October 2026</option>
              <option value="all">All Months</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-transparent font-bold text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Approvals Only ({totalPending})</option>
              <option value="approved">Approved Only</option>
              <option value="rejected">Rejected Only</option>
            </select>
          </div>
        </div>

        {/* Tab switcher: Leaves vs Permissions */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'leaves'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palmtree className="w-3.5 h-3.5" />
            Leave Records ({leavesList.length})
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'permissions'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            Permission Records ({permissionsList.length})
          </button>
        </div>
      </div>

      {/* SECTION 1: LEAVE APPLICATIONS TABLE */}
      {activeTab === 'leaves' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Staff & Manager Leave Applications ({leavesList.length} records)
              </h3>
              <p className="text-xs text-slate-400">
                Full-day and planned leave requests with approval workflow
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
              {selectedMonth === 'all' ? 'All Months' : selectedMonth}
            </span>
          </div>

          {leavesList.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Palmtree className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
              <p className="text-xs">No leave applications found for the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leavesList.map(leave => {
                const b = BRANCHES.find(br => br.id === leave.branchId);
                const isManager = leave.userRole === 'manager';

                return (
                  <div
                    key={leave.id}
                    className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm">{leave.userName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isManager 
                            ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}>
                          {isManager ? 'Branch Manager' : 'Staff Faculty'}
                        </span>
                        {b && (
                          <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                            {b.name} ({b.location})
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 uppercase">
                          {leave.leaveType} Leave
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          leave.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : leave.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800 animate-pulse'
                        }`}>
                          {leave.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                        <span className="font-semibold text-purple-900">
                          {leave.startDate === leave.endDate 
                            ? `Date: ${leave.startDate}` 
                            : `Dates: ${leave.startDate} to ${leave.endDate}`}
                        </span>
                        <span>•</span>
                        <span className="font-bold text-slate-700">Total: {leave.totalDays} Day(s)</span>
                        <span>•</span>
                        <span className="text-slate-400">Applied: {leave.appliedOn}</span>
                      </div>

                      <p className="text-slate-800 font-medium bg-white p-2.5 rounded-xl border border-slate-200/70 text-xs">
                        <span className="font-bold text-slate-600">Reason:</span> {leave.reason}
                      </p>

                      {leave.approvedBy && (
                        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Authorized By: {leave.approvedBy}
                        </p>
                      )}
                    </div>

                    {/* Actions: Approve / Reject for Admin or Manager */}
                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-slate-400">Ref: {leave.id}</span>
                      
                      {leave.status === 'pending' ? (
                        canApprove(leave.userRole) ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleApproveLeave(leave.id, leave.userRole)}
                              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleRejectLeave(leave.id, leave.userRole)}
                              className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> Awaiting Admin Approval
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">
                          Decision recorded
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: PERMISSION RECORDS TABLE */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Staff & Manager Permission Records ({permissionsList.length} records)
              </h3>
              <p className="text-xs text-slate-400">
                1 - 2 hour late arrivals, early exits, and mid-shift leaves
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
              {selectedMonth === 'all' ? 'All Months' : selectedMonth}
            </span>
          </div>

          {permissionsList.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Ticket className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
              <p className="text-xs">No permissions found for the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {permissionsList.map(perm => {
                const b = BRANCHES.find(br => br.id === perm.branchId);
                const isManager = perm.userRole === 'manager';

                return (
                  <div
                    key={perm.id}
                    className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm">{perm.staffName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isManager 
                            ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}>
                          {isManager ? 'Branch Manager' : 'Staff Faculty'}
                        </span>
                        {b && (
                          <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                            {b.name} ({b.location})
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 capitalize">
                          {perm.permissionType.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {perm.durationHours} Hours Duration
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          perm.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : perm.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800 animate-pulse'
                        }`}>
                          {perm.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-medium">Date: <strong>{perm.date}</strong> • Window: <strong>{perm.startTime}</strong> to <strong>{perm.endTime}</strong></span>
                      </div>

                      <p className="text-slate-800 font-medium bg-white p-2.5 rounded-xl border border-slate-200/70 text-xs">
                        <span className="font-bold text-slate-600">Reason:</span> {perm.reason}
                      </p>

                      {perm.approvedBy && (
                        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Authorized By: {perm.approvedBy}
                        </p>
                      )}
                    </div>

                    {/* Actions: Approve / Reject for Admin or Manager */}
                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-slate-400">Ref: {perm.id}</span>
                      
                      {perm.status === 'pending' ? (
                        canApprove(perm.userRole) ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleApprovePerm(perm.id, perm.userRole)}
                              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleRejectPerm(perm.id, perm.userRole)}
                              className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> Awaiting Admin Approval
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">
                          Decision recorded
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: APPLY LEAVE */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <Palmtree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Record / Apply Staff & Manager Leave</h3>
                  <p className="text-xs text-slate-500">Submit casual, sick, or planned leave</p>
                </div>
              </div>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Applicant Name</label>
                <select
                  value={leaveApplicantId}
                  onChange={(e) => setLeaveApplicantId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-purple-500"
                  required
                >
                  {selectableUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === 'manager' ? 'Branch Manager' : 'Staff'} • {u.branchName || 'Salem'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-purple-500"
                  >
                    <option value="casual">Casual Leave (CL)</option>
                    <option value="sick">Sick / Medical Leave (SL)</option>
                    <option value="planned">Planned Family Leave</option>
                    <option value="emergency">Emergency Leave</option>
                    <option value="half_day">Half Day Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Days</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    max="30"
                    value={leaveDays}
                    onChange={(e) => setLeaveDays(parseFloat(e.target.value) || 1)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Leave <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Attending family function / Doctor appointment..."
                  rows={3}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-purple-500 text-xs"
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
                  className="py-2.5 px-5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20"
                >
                  Save & Log Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APPLY PERMISSION */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Record / Apply Staff & Manager Permission</h3>
                  <p className="text-xs text-slate-500">Record late entry, early exit, or mid-shift permission</p>
                </div>
              </div>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePermission} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Applicant Name</label>
                <select
                  value={permApplicantId}
                  onChange={(e) => setPermApplicantId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  required
                >
                  {selectableUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === 'manager' ? 'Branch Manager' : 'Staff'} • {u.branchName || 'Salem'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={permDate}
                    onChange={(e) => setPermDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Permission Type</label>
                  <select
                    value={permType}
                    onChange={(e) => setPermType(e.target.value as StaffPermissionType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="morning_late">Morning Late Arrival (1 - 2 hrs)</option>
                    <option value="evening_early">Evening Early Departure (1 - 2 hrs)</option>
                    <option value="mid_day">Mid-Day Outing (1 - 2 hrs)</option>
                    <option value="emergency">Emergency Work</option>
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    value={permEndTime}
                    onChange={(e) => setPermEndTime(e.target.value)}
                    placeholder="11:00 AM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Hours)</label>
                  <select
                    value={permDuration}
                    onChange={(e) => setPermDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-900 focus:outline-hidden focus:border-emerald-500"
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
                  Reason / Purpose <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={permReason}
                  onChange={(e) => setPermReason(e.target.value)}
                  placeholder="e.g. Government office verification / Medical visit..."
                  rows={3}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500 text-xs"
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
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
                >
                  Save & Log Permission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
