import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  PhoneCall, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  BarChart3, 
  FileText, 
  Globe, 
  BookOpen, 
  UserCheck, 
  Sparkles,
  ArrowRight,
  Building2,
  MapPin,
  Calendar,
  Search,
  Phone,
  Mail,
  IdCard,
  Briefcase,
  Download,
  X,
  Check,
  Plus,
  Trash2,
  Edit3,
  Filter,
  Ticket
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { StaffManager } from './StaffManager';
import { StudentManager } from './StudentManager';
import { ReportsViewer } from './ReportsViewer';
import { ManagerManager } from './ManagerManager';
import { LeavesPermissionsManager } from '../common/LeavesPermissionsManager';
import { dbService, getTodayDate, BRANCHES, downloadCSV } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import type { CenterStats, BranchId, Course, CourseType } from '../../types';

interface AdminDashboardProps {
  onOpenCloudModal: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenCloudModal }) => {
  const { currentBranch, setCurrentBranch } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'managers' | 'staff' | 'students' | 'courses' | 'leaves_permissions' | 'reports'>('overview');
  const [overviewDirectoryTab, setOverviewDirectoryTab] = useState<'staff' | 'students'>('staff');
  const [directorySearch, setDirectorySearch] = useState('');
  const [stats, setStats] = useState<CenterStats>(dbService.getStats(currentBranch, selectedMonth !== 'all' ? selectedMonth : undefined));

  // Leaves & Permissions Executive Overview Stats
  const branchFilter = currentBranch as BranchId | 'all';
  const allOverviewLeaves = dbService.getLeaves(undefined, branchFilter, selectedMonth !== 'all' ? selectedMonth : undefined, 'all');
  const allOverviewPerms = dbService.getStaffPermissions(undefined, selectedMonth !== 'all' ? selectedMonth : undefined, branchFilter, 'all');
  const pendingLeavesCount = allOverviewLeaves.filter(l => l.status === 'pending').length;
  const pendingPermsCount = allOverviewPerms.filter(p => p.status === 'pending').length;

  // Courses & Internships Management State ("all course create should be editable like i can alter whever manager can")
  const allCourses = dbService.getCourses(currentBranch);
  const [courseSearch, setCourseSearch] = useState('');
  const [courseTypeFilter, setCourseTypeFilter] = useState<'all' | 'regular' | 'internship'>('all');
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseSuccessMsg, setCourseSuccessMsg] = useState<string | null>(null);

  const [newCourse, setNewCourse] = useState({
    name: '',
    code: '',
    courseType: 'regular' as CourseType,
    duration: '3 Months',
    internshipDays: 30,
    fee: 15000,
    description: '',
    branchId: undefined as BranchId | undefined
  });

  const handleAdminCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.name.trim()) return;

    const isInternship = newCourse.courseType === 'internship';
    const finalDuration = isInternship 
      ? `${newCourse.internshipDays || 30} Days` 
      : (newCourse.duration.trim() || '3 Months');

    dbService.saveCourse({
      name: newCourse.name.trim(),
      code: newCourse.code.trim() || undefined,
      courseType: newCourse.courseType,
      duration: finalDuration,
      internshipDays: isInternship ? (Number(newCourse.internshipDays) || 30) : undefined,
      fee: Number(newCourse.fee) || 0,
      description: newCourse.description.trim() || '',
      branchId: newCourse.branchId
    });

    setCourseSuccessMsg(`Course "${newCourse.name}" created successfully!`);
    setTimeout(() => {
      setCourseSuccessMsg(null);
      setShowAddCourseModal(false);
      setNewCourse({
        name: '',
        code: '',
        courseType: 'regular',
        duration: '3 Months',
        internshipDays: 30,
        fee: 15000,
        description: '',
        branchId: undefined
      });
    }, 1200);
  };

  const handleAdminUpdateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editingCourse.name.trim()) return;

    const isInternship = editingCourse.courseType === 'internship';
    const finalDuration = isInternship 
      ? `${editingCourse.internshipDays || 30} Days` 
      : (editingCourse.duration.trim() || '3 Months');

    dbService.saveCourse({
      id: editingCourse.id,
      name: editingCourse.name.trim(),
      code: editingCourse.code?.trim() || undefined,
      courseType: editingCourse.courseType || 'regular',
      duration: finalDuration,
      internshipDays: isInternship ? (Number(editingCourse.internshipDays) || 30) : undefined,
      fee: Number(editingCourse.fee) || 0,
      description: editingCourse.description?.trim() || '',
      branchId: editingCourse.branchId
    });

    setCourseSuccessMsg(`Course "${editingCourse.name}" updated successfully!`);
    setTimeout(() => {
      setCourseSuccessMsg(null);
      setEditingCourse(null);
    }, 1200);
  };

  const handleAdminDeleteCourse = (courseId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete course "${name}"?`)) {
      dbService.deleteCourse(courseId);
    }
  };

  const handleExportCourses = () => {
    const list = dbService.getCourses(currentBranch);
    const headers = [
      'Course ID', 'Course Code', 'Course Title', 'Program Type', 'Duration',
      'Duration (Days)', 'Fee (Rs)', 'Campus Allocation', 'Description'
    ];
    const rows = list.map(c => {
      const b = BRANCHES.find(br => br.id === c.branchId);
      return [
        c.id,
        c.code || 'N/A',
        c.name,
        c.courseType === 'internship' ? 'Internship' : 'Regular Course',
        c.duration || '3 Months',
        c.internshipDays || (c.courseType === 'internship' ? c.duration : 'N/A'),
        c.fee || 0,
        b?.fullName || 'All Salem Campuses',
        c.description || 'N/A'
      ];
    });
    downloadCSV(`csk-courses-internships-${currentBranch}-${getTodayDate()}.csv`, headers, rows);
  };

  useEffect(() => {
    setStats(dbService.getStats(currentBranch, selectedMonth !== 'all' ? selectedMonth : undefined));
    const handleDbChange = () => {
      setStats(dbService.getStats(currentBranch, selectedMonth !== 'all' ? selectedMonth : undefined));
    };
    window.addEventListener('educenter-db-change', handleDbChange);
    return () => window.removeEventListener('educenter-db-change', handleDbChange);
  }, [currentBranch, selectedMonth]);

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const activeBranchObj = BRANCHES.find(b => b.id === currentBranch);
  const allStaff = dbService.getStaffList(currentBranch);
  const allStudents = dbService.getStudentList(currentBranch);
  const todayStaffAttendance = dbService.getStaffAttendance(getTodayDate(), currentBranch);
  const todayStudentAttendance = dbService.getStudentAttendance(undefined, getTodayDate(), currentBranch);
  const todayStaffReports = dbService.getWorkReports(getTodayDate(), undefined, currentBranch);

  const [showExportModal, setShowExportModal] = useState(false);

  const handleExportStudents = () => {
    const list = dbService.getStudentList(currentBranch);
    const headers = [
      'Student ID', 'Full Name', 'Campus / Branch', 'Course Name', 'Batch Timing',
      'Phone Number', 'Email', 'Standard / Grade', 'Occupation',
      'Total Fees (Rs)', 'Paid Fees (Rs)', 'Pending Fees (Rs)', 'Fee Status',
      'Last Payment Mode', 'Collected By Staff', 'Payment Transactions Count', 'Admission Date'
    ];
    const rows = list.map(s => {
      const b = BRANCHES.find(br => br.id === s.branchId);
      const total = s.totalFees || 0;
      const paid = s.paidFees || 0;
      const pending = s.pendingFees !== undefined ? s.pendingFees : Math.max(0, total - paid);
      const statusText = pending === 0 ? 'Paid / Clear' : paid > 0 ? 'Partial Pending' : 'Fully Pending';
      return [
        s.studentId || s.id,
        s.name,
        b?.fullName || s.branchName || 'Salem',
        s.courseName || 'N/A',
        s.batchTiming || 'Morning (10:00 AM - 12:30 PM)',
        s.phone,
        s.email || 'N/A',
        s.standard || 'N/A',
        s.occupation || 'Student',
        total,
        paid,
        pending,
        statusText,
        s.lastPaymentMode ? s.lastPaymentMode.toUpperCase() : 'N/A',
        s.lastPaymentCollectedBy || 'N/A',
        s.paymentHistory ? s.paymentHistory.length : (paid > 0 ? 1 : 0),
        s.createdAt || 'N/A'
      ];
    });
    downloadCSV(`csk-students-${currentBranch}-${getTodayDate()}.csv`, headers, rows);
  };

  const handleExportStaffAttendance = () => {
    const list = dbService.getStaffAttendance(undefined, currentBranch, selectedMonth !== 'all' ? selectedMonth : undefined);
    const branchFilter = currentBranch as BranchId | 'all';
    const leavesList = dbService.getLeaves(undefined, branchFilter, selectedMonth !== 'all' ? selectedMonth : undefined, 'all');
    const permissionsList = dbService.getStaffPermissions(undefined, selectedMonth !== 'all' ? selectedMonth : undefined, branchFilter, 'all');

    const headers = [
      'Attendance ID', 'Date', 'Branch / Campus', 'Full Name', 'Role',
      'Staff / Manager ID', 'Phone Number', 'Shift Login Time', 'Shift Logout Time',
      'Total Hours / Shift Log', 'Attendance Status', 'Permission Details',
      'Leave Details', 'Leave Category', 'Leave Status', 'Leave Days'
    ];

    const punchedRows = list.map(a => {
      const u = dbService.getUserById(a.staffId);
      const b = BRANCHES.find(br => br.id === (a.branchId || u?.branchId));
      const isManager = u?.role === 'manager' || a.staffName.toLowerCase().includes('manager');

      const perm = permissionsList.find(p => 
        (p.staffId === a.staffId || p.staffName.toLowerCase() === a.staffName.toLowerCase()) && 
        p.date === a.date
      );
      const permText = perm 
        ? `${perm.permissionType.replace('_', ' ')} (${perm.durationHours} hrs: ${perm.startTime} - ${perm.endTime}) - ${perm.reason} [${perm.status}]`
        : (a.hasPermission || a.permissionReason ? `Permission: ${a.permissionReason} (${a.permissionHours || 1.5} hrs)` : 'None');

      const leave = leavesList.find(l => 
        (l.userId === a.staffId || l.userName.toLowerCase() === a.staffName.toLowerCase()) && 
        (a.date >= l.startDate && a.date <= l.endDate)
      );

      const leaveDetails = leave 
        ? `${leave.leaveType.toUpperCase()} Leave (${leave.totalDays} day${leave.totalDays > 1 ? 's' : ''}${leave.isHalfDay ? ' - Half Day' : ''}): ${leave.reason}`
        : 'None';
      const leaveType = leave ? `${leave.leaveType.toUpperCase()} LEAVE` : 'None';
      const leaveStatus = leave ? leave.status.toUpperCase() : 'N/A';
      const leaveDays = leave ? leave.totalDays : 0;

      let attStatus = a.status === 'present' ? 'Present' : (a.status || 'Present');
      if (leave) {
        attStatus = leave.isHalfDay ? 'Half-Day Leave' : 'Present (Leave on Record)';
      }

      return [
        a.id,
        a.date,
        b?.fullName || 'CSK Academy',
        a.staffName,
        isManager ? 'Branch Manager' : (u?.designation || 'Staff / Faculty'),
        u?.staffId || u?.managerId || a.staffId,
        u?.phone || 'N/A',
        a.loginTime || '--:--',
        a.logoutTime || '--:--',
        a.totalHours || (a.status === 'present' ? 'Shift Active / Present' : 'Absent'),
        attStatus,
        permText,
        leaveDetails,
        leaveType,
        leaveStatus,
        leaveDays
      ];
    });

    // Also include any approved/pending leaves that did not have a punch record on that date
    const leaveRows: (string | number)[][] = [];
    leavesList.forEach(l => {
      const leaveDate = l.startDate;
      const alreadyPunched = list.some(a => 
        (a.staffId === l.userId || a.staffName.toLowerCase() === l.userName.toLowerCase()) && 
        a.date === leaveDate
      );
      if (!alreadyPunched) {
        const u = dbService.getUserById(l.userId);
        const b = BRANCHES.find(br => br.id === (l.branchId || u?.branchId));
        const roleText = l.userRole === 'manager' ? 'Branch Manager' : (u?.designation || 'Staff / Faculty');

        leaveRows.push([
          `LEAVE-${l.id}`,
          leaveDate,
          b?.fullName || 'CSK Academy',
          l.userName,
          roleText,
          u?.staffId || u?.managerId || l.userId,
          u?.phone || 'N/A',
          '--:--',
          '--:--',
          '0.0 hrs (On Leave)',
          l.isHalfDay ? 'Half-Day Leave' : 'On Leave',
          'None',
          `${l.leaveType.toUpperCase()} Leave (${l.totalDays} day${l.totalDays > 1 ? 's' : ''}${l.isHalfDay ? ' - Half Day' : ''}): ${l.reason}`,
          `${l.leaveType.toUpperCase()} LEAVE`,
          l.status.toUpperCase(),
          l.totalDays
        ]);
      }
    });

    const rows = [...punchedRows, ...leaveRows];
    downloadCSV(`csk-staff-and-manager-attendance-${currentBranch}-${selectedMonth || 'all'}.csv`, headers, rows);
  };

  const handleExportWorkReports = () => {
    const list = dbService.getWorkReports(undefined, undefined, currentBranch, selectedMonth !== 'all' ? selectedMonth : undefined);
    const headers = ['Report ID', 'Branch', 'Date', 'Staff Name', 'Job Type', 'Calls', 'Follow Up', 'Enquiry', 'Admission', 'Total Teaching Done', 'Teaching Details', 'Remarks'];
    const rows = list.map(r => {
      const b = BRANCHES.find(br => br.id === r.branchId);
      const teachDetails = r.teachingItems 
        ? r.teachingItems.map(ti => `${ti.courseName} (${ti.studentCount} students: ${ti.studentNames.join(';')}) - Topic: ${ti.topicCovered}`).join(' | ')
        : 'N/A';
      return [
        r.id,
        b?.fullName || 'Salem',
        r.date,
        r.staffName,
        r.reportType,
        r.telecalling?.todayCalls || 0,
        r.telecalling?.todayFollowUp || 0,
        r.telecalling?.todayEnquiry || 0,
        r.telecalling?.todayAdmission || 0,
        r.totalTeachingSummary || 'N/A',
        teachDetails,
        r.overallRemarks || ''
      ];
    });
    downloadCSV(`csk-staff-work-reports-${currentBranch}-${selectedMonth || 'all'}.csv`, headers, rows);
  };

  const handleExportManagerReports = () => {
    const list = dbService.getManagerDailyReports(undefined, undefined, currentBranch, selectedMonth !== 'all' ? selectedMonth : undefined);
    const headers = ['Report ID', 'Branch', 'Date', 'Manager Name', 'Enquiries', 'Admissions', 'Fees Pending (Rs)', 'Pending Breakdown', 'Total Students', 'Absent Students', 'Absent Staff', 'Notes'];
    const rows = list.map(r => {
      const b = BRANCHES.find(br => br.id === r.branchId);
      return [
        r.id,
        b?.fullName || 'Salem',
        r.date,
        r.managerName,
        r.noOfEnquiry,
        r.noOfAdmission,
        r.feesPendingAmount,
        r.feesPendingDetails || '',
        r.totalStudentsInBranch,
        r.noOfAbsentStudents,
        r.noOfAbsentStaff || 0,
        r.notes || ''
      ];
    });
    downloadCSV(`csk-manager-reports-${currentBranch}-${selectedMonth || 'all'}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner with Salem Branches Hub */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-slate-950/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                Headquarters Administration
              </span>
              <span className="text-amber-300 text-xs font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Salem, Tamil Nadu
              </span>
              <span className="text-slate-400 text-xs font-medium">• {todayStr}</span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1 flex items-center gap-2 flex-wrap">
              <span>CSK Academy & InfoSpark Innovation Pvt Ltd</span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-0.5 max-w-2xl">
              Centralized branch-wise control for Dadagapatty, Kondalampatty, Ammapet, and New Bus Stand campuses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCloudModal}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-2 backdrop-blur-sm border border-white/10 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Internet Sync Active</span>
            </button>
          </div>
        </div>

        {/* 4 SALEM BRANCHES QUICK SELECTOR RIBBON & MONTH FILTER */}
        <div className="relative z-10 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              Switch Active Branch View:
            </p>

            {/* Month-wise filter */}
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-xs self-start sm:self-auto">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-slate-300 font-medium">Month Filter:</span>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white font-bold outline-hidden cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Months (Overall)</option>
                <option value="2026-11" className="bg-slate-900 text-white">November 2026 (Current)</option>
                <option value="2026-10" className="bg-slate-900 text-white">October 2026</option>
                <option value="2026-09" className="bg-slate-900 text-white">September 2026</option>
                <option value="2026-08" className="bg-slate-900 text-white">August 2026</option>
              </select>
            </div>
          </div>

          <div className="flex sm:grid sm:grid-cols-5 gap-2 overflow-x-auto no-scrollbar pb-1">
            {/* All Branches */}
            <button
              onClick={() => setCurrentBranch('all')}
              className={`p-2.5 rounded-2xl text-left border transition-all shrink-0 w-36 sm:w-auto ${
                currentBranch === 'all'
                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30 font-bold'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
              }`}
            >
              <p className="text-xs font-extrabold truncate">All 4 Branches</p>
              <p className="text-[10px] text-slate-300 truncate">Combined View</p>
            </button>

            {/* 4 Salem branches */}
            {BRANCHES.map(b => (
              <button
                key={b.id}
                onClick={() => setCurrentBranch(b.id)}
                className={`p-2.5 rounded-2xl text-left border transition-all shrink-0 w-36 sm:w-auto ${
                  currentBranch === b.id
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30 font-bold'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                }`}
              >
                <p className="text-xs font-extrabold truncate">{b.name}</p>
                <p className="text-[10px] text-slate-300 truncate">{b.location}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main Tab Navigation Pill Bar */}
        <div className="relative z-10 mt-4 sm:mt-5 flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 bg-white/5 p-1 rounded-2xl border border-white/10 max-w-full sm:max-w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'overview' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('managers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'managers' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Branch Managers
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'staff' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Staff
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'students' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" /> Students & Fees
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'courses' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Courses & Internships
          </button>
          <button
            onClick={() => setActiveTab('leaves_permissions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'leaves_permissions' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" /> Leaves & Permissions
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'reports' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Daily Reports
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Active Branch Status Pill */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">
                Current Filter: {currentBranch === 'all' ? 'All 4 Salem Branches Combined' : activeBranchObj?.fullName}
              </span>
            </div>
            {activeBranchObj && (
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                {activeBranchObj.phone}
              </span>
            )}
          </div>

          {/* Main Stat Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Staff Members"
              value={stats.totalStaff}
              subtitle={`${stats.todayPresentStaff} present today`}
              icon={<Users className="w-6 h-6" />}
              color="blue"
              onClick={() => setActiveTab('staff')}
            />
            <StatCard
              title="Enrolled Students"
              value={stats.totalStudents}
              subtitle={`${stats.todayPresentStudents} marked present`}
              icon={<GraduationCap className="w-6 h-6" />}
              color="indigo"
              onClick={() => setActiveTab('students')}
            />
            <StatCard
              title="Today Calls Made"
              value={stats.todayTotalCalls}
              subtitle={`${stats.todayTotalFollowUps} Follow-up • ${stats.todayTotalAdmissions} Admn`}
              icon={<PhoneCall className="w-6 h-6" />}
              color="amber"
              onClick={() => setActiveTab('reports')}
            />
            <StatCard
              title="Pending Fees"
              value={`₹${stats.totalPendingFees.toLocaleString()}`}
              subtitle={`Collected: ₹${stats.totalCollectedFees.toLocaleString()}`}
              icon={<CreditCard className="w-6 h-6" />}
              color="rose"
              onClick={() => setActiveTab('students')}
            />
          </div>

          {/* Executive Leaves & Permissions Control Banner */}
          <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-3xl p-5 text-white border border-purple-500/20 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-purple-500/20 border border-purple-400/30 rounded-2xl text-purple-300">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-base text-white">Staff & Manager Leaves & Permissions Portal</h4>
                  {pendingLeavesCount + pendingPermsCount > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wide animate-pulse">
                      {pendingLeavesCount + pendingPermsCount} Action Required
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wide">
                      All Approved
                    </span>
                  )}
                </div>
                <p className="text-xs text-purple-200/80 mt-1">
                  Active in {selectedMonth !== 'all' ? selectedMonth : 'all months'}: <strong>{allOverviewLeaves.length} leaves</strong> ({allOverviewLeaves.reduce((a, b) => a + (Number(b.totalDays) || 1), 0)} days) • <strong>{allOverviewPerms.length} permissions</strong> ({allOverviewPerms.reduce((a, b) => a + (Number(b.durationHours) || 0), 0)} hrs) across branch managers & staff.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
              <button
                onClick={() => setActiveTab('leaves_permissions')}
                className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
              >
                <span>Manage Staff & Manager Leaves →</span>
              </button>
            </div>
          </div>

          {/* 4 Salem Branches Snapshot Cards */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              Salem Branches Performance Overview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {BRANCHES.map(b => {
                const bStats = dbService.getStats(b.id);
                const isSelected = currentBranch === b.id;

                return (
                  <div
                    key={b.id}
                    onClick={() => setCurrentBranch(b.id)}
                    className={`bg-white rounded-3xl p-4 border transition-all cursor-pointer ${
                      isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{b.name}</h4>
                        <p className="text-[11px] font-semibold text-blue-600">{b.location}</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                        {b.shortCode}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <p className="text-[10px] text-slate-400">Staff</p>
                        <p className="font-bold text-slate-800 text-sm">{bStats.totalStaff}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <p className="text-[10px] text-slate-400">Students</p>
                        <p className="font-bold text-slate-800 text-sm">{bStats.totalStudents}</p>
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-500 flex justify-between items-center pt-2 border-t border-slate-100">
                      <span>Pending: <strong className="text-rose-600">₹{bStats.totalPendingFees.toLocaleString()}</strong></span>
                      <span className="text-blue-600 font-bold">{isSelected ? '✓ Selected' : 'Filter →'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance highlights banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Telecalling snapshot */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Telecalling Performance</h3>
                    <p className="text-xs text-slate-400">Calls & admissions pipeline</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  View Reports <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Today Calls</p>
                  <p className="text-xl font-black text-blue-700 mt-1">{stats.todayTotalCalls}</p>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Follow-up</p>
                  <p className="text-xl font-black text-amber-700 mt-1">{stats.todayTotalFollowUps}</p>
                </div>
                <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Enquiries</p>
                  <p className="text-xl font-black text-purple-700 mt-1">{stats.todayTotalEnquiries}</p>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Admissions</p>
                  <p className="text-xl font-black text-emerald-700 mt-1">{stats.todayTotalAdmissions}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Center Status */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Quick Management Actions</h3>
                    <p className="text-xs text-slate-400">Direct shortcuts to tasks</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setActiveTab('staff')}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-left transition-colors"
                  >
                    <p className="font-bold text-slate-800">Filter Staff</p>
                    <p className="text-[11px] text-slate-500">Branch & Job Types</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('students')}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-left transition-colors"
                  >
                    <p className="font-bold text-slate-800">Student Fees Due</p>
                    <p className="text-[11px] text-slate-500">Collect & update fees</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('courses')}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-left transition-colors cursor-pointer"
                  >
                    <p className="font-bold text-slate-800">Courses & Internships</p>
                    <p className="text-[11px] text-slate-500">Edit curriculum & days</p>
                  </button>

                  <button
                    onClick={() => setShowExportModal(true)}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-left transition-colors cursor-pointer"
                  >
                    <p className="font-bold text-slate-800">Export CSV Data</p>
                    <p className="text-[11px] text-slate-500">Download reports & attendance</p>
                  </button>

                  <button
                    onClick={onOpenCloudModal}
                    className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left transition-colors"
                  >
                    <p className="font-bold text-emerald-900">Cloud Sync Active</p>
                    <p className="text-[11px] text-emerald-700">Access from anywhere</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* ALL STAFF AND STUDENT DETAILS MASTER DIRECTORY */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>All Staff & Student Details Directory</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Full profiles, attendance punch, fee status, and work summaries for {currentBranch === 'all' ? 'all 4 Salem campuses' : activeBranchObj?.fullName}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, phone, course..."
                    value={directorySearch}
                    onChange={e => setDirectorySearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50 focus:bg-white w-48 sm:w-60"
                  />
                </div>

                {/* Switcher Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setOverviewDirectoryTab('staff')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      overviewDirectoryTab === 'staff'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" /> Staff ({allStaff.length})
                  </button>
                  <button
                    onClick={() => setOverviewDirectoryTab('students')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      overviewDirectoryTab === 'students'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" /> Students ({allStudents.length})
                  </button>
                </div>

                {/* Direct Export CSV Button */}
                <button
                  onClick={overviewDirectoryTab === 'staff' ? handleExportStaffAttendance : handleExportStudents}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  title="Export directory records to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* TAB 1: ALL STAFF DETAILS */}
            {overviewDirectoryTab === 'staff' && (
              <div className="space-y-3">
                {allStaff.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl">
                    No staff members created for this campus yet. Create staff using Manager login or the Staff tab above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allStaff
                      .filter(s =>
                        s.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
                        s.phone.includes(directorySearch) ||
                        s.email.toLowerCase().includes(directorySearch.toLowerCase()) ||
                        (s.staffId && s.staffId.toLowerCase().includes(directorySearch.toLowerCase()))
                      )
                      .map(staff => {
                        const staffBranch = BRANCHES.find(b => b.id === staff.branchId);
                        const att = todayStaffAttendance.find(a => a.staffId === staff.id);
                        const rep = todayStaffReports.find(r => r.staffId === staff.id);

                        return (
                          <div
                            key={staff.id}
                            className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                                    {staff.name.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">{staff.name}</h4>
                                    <p className="text-[11px] text-slate-500">{staff.designation || 'Staff Faculty'}</p>
                                  </div>
                                </div>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  staff.jobRole === 'telecalling'
                                    ? 'bg-blue-100 text-blue-700'
                                    : staff.jobRole === 'teaching'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {staff.jobRole}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px]">
                                <Building2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                <span className="font-bold text-amber-900">{staffBranch?.name}</span>
                                <span className="text-amber-700">• {staffBranch?.location}</span>
                              </div>

                              <div className="bg-white p-3 rounded-xl border border-slate-200/60 text-xs space-y-1.5">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Staff ID:</span>
                                  <span className="font-mono font-bold text-slate-800">{staff.staffId || staff.id}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Phone:</span>
                                  <span className="font-mono font-medium text-slate-800">{staff.phone}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Email:</span>
                                  <span className="font-medium text-slate-800 truncate max-w-[160px]">{staff.email}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Qualification:</span>
                                  <span className="font-medium text-slate-800 truncate max-w-[150px]">{staff.qualification || 'N/A'}</span>
                                </div>
                              </div>

                              <div className="p-2.5 rounded-xl border border-slate-200/60 bg-white text-xs space-y-1">
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="text-slate-500 font-medium">Today's Attendance:</span>
                                  {att ? (
                                    <span className="font-bold text-emerald-700">
                                      In: {att.loginTime} {att.logoutTime ? `| Out: ${att.logoutTime}` : '(Active)'}
                                    </span>
                                  ) : (
                                    <span className="font-medium text-amber-600">Not Checked In</span>
                                  )}
                                </div>
                                {rep?.totalTeachingSummary && (
                                  <div className="pt-1 border-t border-slate-100 flex justify-between items-center text-[11px]">
                                    <span className="text-emerald-800 font-semibold">Teaching Today:</span>
                                    <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                      {rep.totalTeachingSummary}
                                    </span>
                                  </div>
                                )}
                                {rep?.telecalling && (
                                  <div className="pt-1 border-t border-slate-100 flex justify-between items-center text-[11px]">
                                    <span className="text-blue-800 font-semibold">Telecalling Calls:</span>
                                    <span className="font-mono font-bold text-blue-900">
                                      {rep.telecalling.todayCalls} Calls ({rep.telecalling.todayAdmission} Admn)
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => setActiveTab('staff')}
                              className="mt-3 w-full py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-blue-600 transition-colors flex items-center justify-center gap-1"
                            >
                              Manage Staff Full Profile <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ALL STUDENT DETAILS */}
            {overviewDirectoryTab === 'students' && (
              <div className="space-y-3">
                {allStudents.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl">
                    No students registered for this campus yet. Staff or Managers can admit students with branch courses.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allStudents
                      .filter(s =>
                        s.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
                        s.phone.includes(directorySearch) ||
                        (s.courseName && s.courseName.toLowerCase().includes(directorySearch.toLowerCase())) ||
                        (s.studentId && s.studentId.toLowerCase().includes(directorySearch.toLowerCase()))
                      )
                      .map(student => {
                        const studentBranch = BRANCHES.find(b => b.id === student.branchId);
                        const total = student.totalFees || 0;
                        const paid = student.paidFees || 0;
                        const pending = student.pendingFees !== undefined ? student.pendingFees : Math.max(0, total - paid);
                        const todayAtt = todayStudentAttendance.find(a => a.studentId === student.id);

                        return (
                          <div
                            key={student.id}
                            className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                                    {student.name.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">{student.name}</h4>
                                    <p className="text-[11px] text-slate-500">{student.studentId || student.id}</p>
                                  </div>
                                </div>
                                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                                  pending === 0
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {pending === 0 ? 'Paid' : `₹${pending.toLocaleString()} Due`}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200/80 rounded-xl text-[11px]">
                                <Building2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                <span className="font-bold text-blue-900">{studentBranch?.name}</span>
                                <span className="text-blue-700">• {studentBranch?.location}</span>
                              </div>

                              <div className="bg-white p-3 rounded-xl border border-slate-200/60 text-xs space-y-1.5">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Enrolled Course:</span>
                                  <span className="font-bold text-blue-800 truncate max-w-[170px] text-right">{student.courseName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Grade / Standard:</span>
                                  <span className="font-medium text-slate-800">{student.standard || student.occupation || 'Student'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Phone:</span>
                                  <span className="font-mono font-medium text-slate-800">{student.phone}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Batch Timing:</span>
                                  <span className="font-medium text-slate-700 truncate max-w-[160px]">{student.batchTiming || 'Morning Batch'}</span>
                                </div>
                              </div>

                              {/* Fee progress */}
                              <div className="bg-white p-3 rounded-xl border border-slate-200/60 text-xs space-y-1.5">
                                <div className="flex justify-between text-slate-600 font-medium text-[11px]">
                                  <span>Fee Paid / Total:</span>
                                  <span className="font-bold font-mono text-slate-900">
                                    ₹{paid.toLocaleString()} / ₹{total.toLocaleString()}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-blue-600 h-1.5 rounded-full"
                                    style={{ width: `${Math.min(100, (paid / (total || 1)) * 100)}%` }}
                                  ></div>
                                </div>
                                <div className="flex justify-between items-center pt-1 text-[11px]">
                                  <span className={`font-bold ${pending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    Pending: ₹{pending.toLocaleString()}
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                    Status: {student.feeStatus || 'pending'}
                                  </span>
                                </div>
                              </div>

                              <div className="p-2 rounded-xl border border-slate-200/60 bg-white text-[11px] flex items-center justify-between">
                                <span className="text-slate-500 font-medium">Today's Attendance:</span>
                                {todayAtt ? (
                                  <span className="font-semibold text-emerald-700">
                                    Present ({todayAtt.topicCovered || 'Module'})
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Not Marked</span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => setActiveTab('students')}
                              className="mt-3 w-full py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-blue-600 transition-colors flex items-center justify-center gap-1"
                            >
                              Collect Fee & View Student →
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BRANCH MANAGERS TAB */}
      {activeTab === 'managers' && (
        <ManagerManager selectedBranch={currentBranch} selectedMonth={selectedMonth} />
      )}

      {/* STAFF MANAGEMENT TAB */}
      {activeTab === 'staff' && <StaffManager initialBranch={currentBranch} />}

      {/* STUDENT MANAGEMENT TAB */}
      {activeTab === 'students' && <StudentManager initialBranch={currentBranch} />}

      {/* LEAVES & PERMISSIONS MANAGEMENT TAB */}
      {activeTab === 'leaves_permissions' && (
        <LeavesPermissionsManager viewerRole="admin" />
      )}

      {/* REPORTS VIEWER TAB */}
      {activeTab === 'reports' && (
        <ReportsViewer initialBranch={currentBranch} initialMonth={selectedMonth} />
      )}

      {/* COURSES & INTERNSHIPS MANAGEMENT TAB ("make all course create should be editable like i can alter whever manager can") */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Course & Internship Curriculum
                </h3>
                <p className="text-xs text-slate-500">
                  Manage standard technical courses and practical internships (in days) across all Salem campuses.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExportCourses}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Export Course Directory to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setShowAddCourseModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create Course / Internship</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500">Type:</span>
                <button
                  onClick={() => setCourseTypeFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    courseTypeFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({allCourses.length})
                </button>
                <button
                  onClick={() => setCourseTypeFilter('regular')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    courseTypeFilter === 'regular'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  📘 Regular Courses ({allCourses.filter(c => c.courseType !== 'internship').length})
                </button>
                <button
                  onClick={() => setCourseTypeFilter('internship')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    courseTypeFilter === 'internship'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  💼 Internships ({allCourses.filter(c => c.courseType === 'internship').length})
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search title, code, keywords..."
                  value={courseSearch}
                  onChange={e => setCourseSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50 focus:bg-white w-full sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* Courses & Internships Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCourses
              .filter(c => {
                const matchesType = 
                  courseTypeFilter === 'all' || 
                  (courseTypeFilter === 'internship' ? c.courseType === 'internship' : c.courseType !== 'internship');
                const matchesSearch = 
                  c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
                  (c.code && c.code.toLowerCase().includes(courseSearch.toLowerCase())) ||
                  c.description.toLowerCase().includes(courseSearch.toLowerCase());
                return matchesType && matchesSearch;
              })
              .map(crs => {
                const b = BRANCHES.find(br => br.id === crs.branchId);
                const isInternship = crs.courseType === 'internship';

                return (
                  <div
                    key={crs.id}
                    className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3.5 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-block bg-slate-100 text-slate-800 text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-full">
                              {crs.code || 'CRS'}
                            </span>
                            {isInternship ? (
                              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <Briefcase className="w-3 h-3 text-purple-600" />
                                Internship ({crs.internshipDays ? `${crs.internshipDays} Days` : crs.duration})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <BookOpen className="w-3 h-3 text-blue-600" />
                                Regular Course
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{crs.name}</h4>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditingCourse({ ...crs })}
                            title="Edit / Alter Course (Admin)"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0 cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAdminDeleteCourse(crs.id, crs.name)}
                            title="Delete Course"
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-3">{crs.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600 text-[11px] font-semibold">
                          <Clock className={`w-3.5 h-3.5 ${isInternship ? 'text-purple-600' : 'text-blue-600'}`} />
                          {crs.duration || '3 Months'}
                        </span>
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 font-mono text-xs">
                          ₹{crs.fee.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Campus:</span>
                        <span className="font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          {b ? `${b.name} (${b.shortCode})` : 'All Salem Campuses'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ADMIN ADD COURSE MODAL */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-blue-50 text-blue-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Create Course or Internship</h3>
                  <p className="text-xs text-slate-500">Configure program offering across Salem branches</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCourseModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {courseSuccessMsg && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{courseSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleAdminCreateCourse} className="space-y-3.5 mt-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Program / Course Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCourse({ ...newCourse, courseType: 'regular', duration: '3 Months' })}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      newCourse.courseType === 'regular'
                        ? 'bg-blue-50 text-blue-800 border-blue-300 ring-2 ring-blue-500/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>📘 Regular Course</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCourse({ ...newCourse, courseType: 'internship', internshipDays: 30, duration: '30 Days' })}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      newCourse.courseType === 'internship'
                        ? 'bg-purple-50 text-purple-800 border-purple-300 ring-2 ring-purple-500/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                    <span>💼 Internship (in Days)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {newCourse.courseType === 'internship' ? 'Internship Title *' : 'Course Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={newCourse.courseType === 'internship' ? "e.g. Full Stack & AI Industrial Internship" : "e.g. Master in Python Full Stack & AI"}
                  value={newCourse.name}
                  onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    placeholder={newCourse.courseType === 'internship' ? "e.g. INT-FS30" : "e.g. PY-201, AI-102"}
                    value={newCourse.code}
                    onChange={e => setNewCourse({ ...newCourse, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden font-mono uppercase"
                  />
                </div>

                {newCourse.courseType === 'internship' ? (
                  <div>
                    <label className="block text-xs font-semibold text-purple-800 mb-1">Internship Duration (Days) *</label>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        {[15, 30, 45, 60, 90, 120].map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setNewCourse({ ...newCourse, internshipDays: d, duration: `${d} Days` })}
                            className={`px-2 py-0.5 text-[10px] rounded-lg font-mono font-bold transition-all ${
                              newCourse.internshipDays === d
                                ? 'bg-purple-600 text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {d}d
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min={1}
                        required
                        placeholder="Number of days e.g. 30"
                        value={newCourse.internshipDays || ''}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setNewCourse({ ...newCourse, internshipDays: val, duration: `${val} Days` });
                        }}
                        className="w-full px-3 py-1.5 text-xs border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden font-mono font-bold text-purple-900 bg-purple-50/40"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                    <select
                      value={newCourse.duration}
                      onChange={e => setNewCourse({ ...newCourse, duration: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
                    >
                      <option value="1 Month">1 Month</option>
                      <option value="2 Months">2 Months</option>
                      <option value="3 Months">3 Months</option>
                      <option value="4 Months">4 Months</option>
                      <option value="6 Months">6 Months</option>
                      <option value="1 Year">1 Year</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="25000"
                    value={newCourse.fee}
                    onChange={e => setNewCourse({ ...newCourse, fee: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden font-mono font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Offering</label>
                  <select
                    value={newCourse.branchId || ''}
                    onChange={e => setNewCourse({ ...newCourse, branchId: (e.target.value as BranchId) || undefined })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
                  >
                    <option value="">All Salem Campuses</option>
                    {BRANCHES.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Description / Key Syllabus</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Python, Django, REST APIs, PostgreSQL, React, Docker, and Capstone Project."
                  value={newCourse.description}
                  onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN EDIT COURSE MODAL ("make all course create should be editable like i can alter whever manager can") */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-blue-50 text-blue-600">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Edit / Alter Course Details</h3>
                  <p className="text-xs text-slate-500">{editingCourse.name} ({editingCourse.code || 'CRS'})</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCourse(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {courseSuccessMsg && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{courseSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleAdminUpdateCourse} className="space-y-3.5 mt-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Program / Course Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCourse({ ...editingCourse, courseType: 'regular', duration: editingCourse.duration || '3 Months' })}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      editingCourse.courseType !== 'internship'
                        ? 'bg-blue-50 text-blue-800 border-blue-300 ring-2 ring-blue-500/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>📘 Regular Course</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCourse({ ...editingCourse, courseType: 'internship', internshipDays: editingCourse.internshipDays || 30, duration: `${editingCourse.internshipDays || 30} Days` })}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      editingCourse.courseType === 'internship'
                        ? 'bg-purple-50 text-purple-800 border-purple-300 ring-2 ring-purple-500/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                    <span>💼 Internship (in Days)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Internship Title *</label>
                <input
                  type="text"
                  required
                  value={editingCourse.name}
                  onChange={e => setEditingCourse({ ...editingCourse, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    value={editingCourse.code || ''}
                    onChange={e => setEditingCourse({ ...editingCourse, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden font-mono uppercase"
                  />
                </div>

                {editingCourse.courseType === 'internship' ? (
                  <div>
                    <label className="block text-xs font-semibold text-purple-800 mb-1">Internship Duration (Days) *</label>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        {[15, 30, 45, 60, 90, 120].map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setEditingCourse({ ...editingCourse, internshipDays: d, duration: `${d} Days` })}
                            className={`px-2 py-0.5 text-[10px] rounded-lg font-mono font-bold transition-all ${
                              editingCourse.internshipDays === d
                                ? 'bg-purple-600 text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {d}d
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min={1}
                        required
                        value={editingCourse.internshipDays || ''}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setEditingCourse({ ...editingCourse, internshipDays: val, duration: `${val} Days` });
                        }}
                        className="w-full px-3 py-1.5 text-xs border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden font-mono font-bold text-purple-900 bg-purple-50/40"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                    <input
                      type="text"
                      value={editingCourse.duration}
                      onChange={e => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                      placeholder="e.g. 3 Months, 6 Months"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingCourse.fee}
                    onChange={e => setEditingCourse({ ...editingCourse, fee: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden font-mono font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Allocation</label>
                  <select
                    value={editingCourse.branchId || ''}
                    onChange={e => setEditingCourse({ ...editingCourse, branchId: (e.target.value as BranchId) || undefined })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
                  >
                    <option value="">All Salem Campuses</option>
                    {BRANCHES.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Key Syllabus</label>
                <textarea
                  rows={3}
                  value={editingCourse.description || ''}
                  onChange={e => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save Course Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPORT CENTER MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Export CSV Center</h3>
                  <p className="text-xs text-slate-500">
                    {currentBranch === 'all' ? 'All 4 Salem Campuses Combined' : activeBranchObj?.fullName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mt-4 overflow-y-auto pr-1 flex-1 text-xs">
              <button
                onClick={() => { handleExportStudents(); setShowExportModal(false); }}
                className="w-full p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl text-left flex items-center justify-between group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-blue-700">Student Details CSV</p>
                    <p className="text-[11px] text-slate-500">Batch timing, fees, phone, enrollment info ({allStudents.length} students)</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </button>

              <button
                onClick={() => { handleExportStaffAttendance(); setShowExportModal(false); }}
                className="w-full p-3.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-2xl text-left flex items-center justify-between group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-emerald-700">Staff & Manager Attendance CSV</p>
                    <p className="text-[11px] text-slate-500">Shift login/logout punch times and duration logs</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
              </button>

              <button
                onClick={() => { handleExportWorkReports(); setShowExportModal(false); }}
                className="w-full p-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl text-left flex items-center justify-between group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-indigo-700">Staff Daily Work Reports CSV</p>
                    <p className="text-[11px] text-slate-500">Teaching summaries (AI-1, C/C++-2), telecalling metrics</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
              </button>

              <button
                onClick={() => { handleExportManagerReports(); setShowExportModal(false); }}
                className="w-full p-3.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-2xl text-left flex items-center justify-between group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-amber-700">Manager Daily Reports CSV</p>
                    <p className="text-[11px] text-slate-500">Branch admissions, enquiries, pending fees & absentees</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-600 shrink-0" />
              </button>

              <button
                onClick={() => { handleExportCourses(); setShowExportModal(false); }}
                className="w-full p-3.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-2xl text-left flex items-center justify-between group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-purple-700">Courses & Internships CSV</p>
                    <p className="text-[11px] text-slate-500">Course titles, codes, regular duration & internship days, fees</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-purple-600 shrink-0" />
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
