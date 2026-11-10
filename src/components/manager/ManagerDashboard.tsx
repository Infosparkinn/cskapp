import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StaffAttendanceCard } from '../staff/StaffAttendanceCard';
import { 
  Building2, 
  Users, 
  UserCheck, 
  GraduationCap, 
  Plus, 
  X, 
  Check, 
  Calendar, 
  PhoneCall, 
  CreditCard, 
  AlertCircle, 
  Clock, 
  FileText, 
  TrendingUp, 
  Save, 
  Search, 
  BookOpen, 
  Briefcase, 
  IdCard, 
  Mail, 
  Phone, 
  Trash2,
  Download,
  Edit3,
  CheckCircle,
  Banknote,
  QrCode,
  Smartphone,
  Ticket
} from 'lucide-react';
import { LeavesPermissionsManager } from '../common/LeavesPermissionsManager';
import { dbService, getTodayDate, BRANCHES, downloadCSV } from '../../services/db';
import type { BranchId, UserProfile, ManagerDailyReport, Course, CourseType, PaymentMode, FeePaymentRecord } from '../../types';

export const ManagerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'daily_report' | 'staff_management' | 'courses' | 'students' | 'leave_permission'>('daily_report');

  const defaultBranch: BranchId = currentUser?.branchId || 'dadagapatty';
  const branchObj = BRANCHES.find(b => b.id === defaultBranch);

  const [dbVersion, setDbVersion] = useState(0);

  useEffect(() => {
    const handleDbChange = () => setDbVersion(v => v + 1);
    window.addEventListener('educenter-db-change', handleDbChange);
    return () => window.removeEventListener('educenter-db-change', handleDbChange);
  }, []);

  // Live branch counts
  const branchStudents = dbService.getStudentList(defaultBranch);
  const branchStaff = dbService.getStaffList(defaultBranch);
  const todayDate = getTodayDate();
  const todayStaffAttendance = dbService.getStaffAttendance(todayDate, defaultBranch);
  const todayStudentAttendance = dbService.getStudentAttendance(undefined, todayDate, defaultBranch);
  const todayStaffReports = dbService.getWorkReports(todayDate, undefined, defaultBranch);

  // Live branch leaves and permissions
  const branchLeaves = dbService.getLeaves(undefined, defaultBranch, undefined, 'staff');
  const branchPerms = dbService.getStaffPermissions(undefined, undefined, defaultBranch, 'staff');
  const branchPendingLeaves = branchLeaves.filter(l => l.status === 'pending').length;
  const branchPendingPerms = branchPerms.filter(p => p.status === 'pending').length;
  const totalBranchPending = branchPendingLeaves + branchPendingPerms;

  // Compute pending fees in this branch
  let calculatedPendingFees = 0;
  let calculatedCollectedFees = 0;
  branchStudents.forEach(s => {
    calculatedPendingFees += (s.pendingFees || 0);
    calculatedCollectedFees += (s.paidFees || 0);
  });

  // Calculate default absent counts
  const absentStudentsCount = Math.max(0, branchStudents.length - todayStudentAttendance.filter(a => a.present).length);
  const absentStaffCount = Math.max(0, branchStaff.length - todayStaffAttendance.filter(a => a.status === 'present').length);

  // Manager Daily Report Form State
  const [reportDate, setReportDate] = useState(todayDate);
  const [noOfEnquiry, setNoOfEnquiry] = useState<number>(5);
  const [noOfAdmission, setNoOfAdmission] = useState<number>(1);
  const [feesPendingAmount, setFeesPendingAmount] = useState<number>(calculatedPendingFees);
  const [feesPendingDetails, setFeesPendingDetails] = useState<string>('');
  const [totalStudentsInBranch, setTotalStudentsInBranch] = useState<number>(branchStudents.length);
  const [noOfAbsentStudents, setNoOfAbsentStudents] = useState<number>(absentStudentsCount);
  const [noOfAbsentStaff, setNoOfAbsentStaff] = useState<number>(absentStaffCount);
  const [managerNotes, setManagerNotes] = useState<string>('');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Update feesPendingAmount if calculatedPendingFees updates and not touched
  useEffect(() => {
    if (feesPendingAmount === 0 && calculatedPendingFees > 0) {
      setFeesPendingAmount(calculatedPendingFees);
    }
    if (totalStudentsInBranch === 0 && branchStudents.length > 0) {
      setTotalStudentsInBranch(branchStudents.length);
    }
    if (noOfAbsentStudents === 0 && absentStudentsCount > 0) {
      setNoOfAbsentStudents(absentStudentsCount);
    }
    if (noOfAbsentStaff === 0 && absentStaffCount > 0) {
      setNoOfAbsentStaff(absentStaffCount);
    }
  }, [calculatedPendingFees, branchStudents.length, absentStudentsCount, absentStaffCount]);

  // Manager Daily Reports History
  const managerReports = dbService.getManagerDailyReports(undefined, currentUser?.id, defaultBranch);

  // Staff Creation State ("manager is create staff")
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffCreateSuccess, setStaffCreateSuccess] = useState<string | null>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    jobRole: 'both' as 'teaching' | 'telecalling' | 'both',
    designation: 'Faculty Trainer & Counselor',
    qualification: 'MCA / B.Tech / M.Sc'
  });

  // Branch Courses State ("option for manager to add course detail offered in the branch")
  const branchCourses = dbService.getCourses(defaultBranch);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [courseCreateSuccess, setCourseCreateSuccess] = useState<string | null>(null);
  const [courseSearch, setCourseSearch] = useState('');
  const [newCourse, setNewCourse] = useState({
    name: '',
    code: '',
    courseType: 'regular' as CourseType,
    duration: '3 Months',
    internshipDays: 30,
    fee: 15000,
    description: ''
  });

  // Course Edit Modal State ("all course create should be editable like i can alter whever manager can")
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseEditSuccess, setCourseEditSuccess] = useState<string | null>(null);

  const handleCreateCourse = (e: React.FormEvent) => {
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
      branchId: defaultBranch
    });

    setCourseCreateSuccess(`${isInternship ? 'Internship' : 'Course'} "${newCourse.name}" added successfully to ${branchObj?.name}!`);
    setTimeout(() => {
      setCourseCreateSuccess(null);
      setShowAddCourseModal(false);
      setNewCourse({
        name: '',
        code: '',
        courseType: 'regular',
        duration: '3 Months',
        internshipDays: 30,
        fee: 15000,
        description: ''
      });
    }, 1200);
  };

  const handleUpdateCourse = (e: React.FormEvent) => {
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
      branchId: editingCourse.branchId || defaultBranch
    });

    setCourseEditSuccess(`Course "${editingCourse.name}" updated successfully!`);
    setTimeout(() => {
      setCourseEditSuccess(null);
      setEditingCourse(null);
    }, 1200);
  };

  const handleDeleteCourse = (courseId: string, courseName: string) => {
    if (window.confirm(`Are you sure you want to remove course "${courseName}"?`)) {
      dbService.deleteCourse(courseId);
    }
  };

  // Student Admission State ("which is selected when student admitted")
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentCreateSuccess, setStudentCreateSuccess] = useState<string | null>(null);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    occupation: 'Student',
    standard: '12th Standard',
    courseName: branchCourses[0]?.name || 'Artificial Intelligence & Deep Learning (AI)',
    totalFees: branchCourses[0]?.fee || 25000,
    paidFees: 5000,
    batchTiming: 'Morning (10:00 AM - 12:30 PM)',
    branchId: defaultBranch
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const pending = Math.max(0, Number(newStudent.totalFees) - Number(newStudent.paidFees));
    const created: UserProfile = {
      id: 'stu-' + Date.now(),
      role: 'student',
      name: newStudent.name.trim(),
      email: newStudent.email.trim() || `student.${Date.now()}@cskacademy.com`,
      phone: newStudent.phone.trim(),
      occupation: newStudent.occupation,
      standard: newStudent.standard,
      courseName: newStudent.courseName,
      batchTiming: newStudent.batchTiming,
      totalFees: Number(newStudent.totalFees) || 0,
      paidFees: Number(newStudent.paidFees) || 0,
      pendingFees: pending,
      feeStatus: pending === 0 ? 'paid' : (Number(newStudent.paidFees) > 0 ? 'partial' : 'pending'),
      branchId: defaultBranch,
      branchName: branchObj?.fullName || 'CSK Academy',
      studentId: 'STU-' + Math.floor(1000 + Math.random() * 9000),
      createdAt: new Date().toISOString().split('T')[0]
    };
    dbService.saveUser(created);
    setStudentCreateSuccess(`Student ${created.name} registered successfully!`);
    setTimeout(() => {
      setStudentCreateSuccess(null);
      setShowAddStudentModal(false);
      setNewStudent({
        name: '',
        email: '',
        phone: '',
        occupation: 'Student',
        standard: '12th Standard',
        courseName: branchCourses[0]?.name || 'Artificial Intelligence & Deep Learning (AI)',
        totalFees: branchCourses[0]?.fee || 25000,
        paidFees: 5000,
        batchTiming: 'Morning (10:00 AM - 12:30 PM)',
        branchId: defaultBranch
      });
    }, 1200);
  };

  // Student Search
  const [studentSearch, setStudentSearch] = useState('');

  // Student Fee Collection Modal State ("update fee detail that a student paid after joining")
  const [paymentStudent, setPaymentStudent] = useState<UserProfile | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [paymentStaff, setPaymentStaff] = useState<string>(currentUser?.name || '');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Student Edit Details & Timing Modal State ("batch timing shoud be editable")
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    courseName: '',
    batchTiming: 'Morning (10:00 AM - 12:30 PM)',
    customBatchTiming: '',
    totalFees: 25000,
    occupation: 'Student',
    standard: '12th Standard'
  });
  const [editSuccessMessage, setEditSuccessMessage] = useState<string | null>(null);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentStudent) return;
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) return;

    dbService.updateStudentFees(paymentStudent.id, amount, {
      paymentMode,
      collectedBy: paymentStaff.trim() || currentUser?.name || 'Branch Manager',
      notes: paymentNotes.trim()
    });
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      setPaymentStudent(null);
      setPaymentAmount('');
      setPaymentNotes('');
    }, 1200);
  };

  const handleOpenEditStudent = (student: UserProfile) => {
    const standardBatches = [
      'Morning (10:00 AM - 12:30 PM)',
      'Afternoon (02:00 PM - 04:30 PM)',
      'Evening (05:00 PM - 07:30 PM)',
      'Weekend Special Batch'
    ];
    const isStandard = standardBatches.includes(student.batchTiming || '');

    setEditingStudent(student);
    setEditForm({
      name: student.name,
      phone: student.phone,
      email: student.email || '',
      courseName: student.courseName || branchCourses[0]?.name || '',
      batchTiming: isStandard ? (student.batchTiming || 'Morning (10:00 AM - 12:30 PM)') : 'custom',
      customBatchTiming: isStandard ? '' : (student.batchTiming || ''),
      totalFees: student.totalFees || 25000,
      occupation: student.occupation || 'Student',
      standard: student.standard || '12th Standard'
    });
    setEditSuccessMessage(null);
  };

  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const finalBatchTiming = editForm.batchTiming === 'custom'
      ? (editForm.customBatchTiming.trim() || 'Custom Timing')
      : editForm.batchTiming;

    const total = Number(editForm.totalFees) || 0;
    const paid = editingStudent.paidFees || 0;
    const pending = Math.max(0, total - paid);

    const updated: UserProfile = {
      ...editingStudent,
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
      courseName: editForm.courseName,
      batchTiming: finalBatchTiming,
      totalFees: total,
      pendingFees: pending,
      feeStatus: pending === 0 ? 'paid' : (paid > 0 ? 'partial' : 'pending'),
      occupation: editForm.occupation,
      standard: editForm.standard
    };

    dbService.saveUser(updated);
    setEditSuccessMessage(`Student ${updated.name}'s details & batch timing updated successfully!`);
    setTimeout(() => {
      setEditSuccessMessage(null);
      setEditingStudent(null);
    }, 1200);
  };

  const exportBranchStudentsCSV = () => {
    const headers = [
      'Student ID',
      'Full Name',
      'Branch / Campus',
      'Course Name',
      'Batch Timing',
      'Phone Number',
      'Email',
      'Standard / Grade',
      'Occupation',
      'Total Fees (Rs)',
      'Paid Fees (Rs)',
      'Pending Fees (Rs)',
      'Fee Status',
      'Last Payment Mode',
      'Collected By Staff',
      'Payment Transactions Count',
      'Admission Date'
    ];
    const rows = branchStudents.map(s => {
      const pending = s.pendingFees !== undefined ? s.pendingFees : Math.max(0, (s.totalFees || 0) - (s.paidFees || 0));
      const statusText = pending === 0 ? 'Paid / Clear' : (s.paidFees || 0) > 0 ? 'Partial Pending' : 'Fully Pending';
      return [
        s.studentId || s.id,
        s.name,
        branchObj?.fullName || 'CSK Academy',
        s.courseName || 'N/A',
        s.batchTiming || 'Morning (10:00 AM - 12:30 PM)',
        s.phone,
        s.email || 'N/A',
        s.standard || 'N/A',
        s.occupation || 'Student',
        s.totalFees || 0,
        s.paidFees || 0,
        pending,
        statusText,
        s.lastPaymentMode ? s.lastPaymentMode.toUpperCase() : 'N/A',
        s.lastPaymentCollectedBy || 'N/A',
        s.paymentHistory ? s.paymentHistory.length : ((s.paidFees || 0) > 0 ? 1 : 0),
        s.createdAt || 'N/A'
      ];
    });

    downloadCSV(
      `csk-${branchObj?.shortCode || 'branch'}-students-${getTodayDate()}.csv`,
      headers,
      rows
    );
  };

  const handleSubmitManagerReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    dbService.saveManagerDailyReport({
      managerId: currentUser.id,
      managerName: currentUser.name,
      branchId: defaultBranch,
      date: reportDate,
      noOfEnquiry: Number(noOfEnquiry) || 0,
      noOfAdmission: Number(noOfAdmission) || 0,
      feesPendingAmount: Number(feesPendingAmount) || 0,
      feesPendingDetails: feesPendingDetails.trim() || undefined,
      totalStudentsInBranch: Number(totalStudentsInBranch) || branchStudents.length,
      noOfAbsentStudents: Number(noOfAbsentStudents) || 0,
      noOfAbsentStaff: Number(noOfAbsentStaff) || 0,
      notes: managerNotes.trim() || undefined
    });

    setSubmittedMessage('Manager Daily Work Report submitted and synced branch-wise!');
    setTimeout(() => {
      setSubmittedMessage(null);
    }, 2500);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const createdStaff: UserProfile = {
      id: 'stf-' + Date.now(),
      role: 'staff',
      name: newStaff.name.trim(),
      email: newStaff.email.trim() || `staff.${Date.now()}@cskacademy.com`,
      phone: newStaff.phone.trim(),
      jobRole: newStaff.jobRole,
      designation: newStaff.designation.trim(),
      qualification: newStaff.qualification.trim(),
      branchId: defaultBranch,
      branchName: branchObj?.fullName || 'CSK Academy',
      staffId: 'STF-' + Math.floor(100 + Math.random() * 900),
      createdAt: new Date().toISOString().split('T')[0]
    };

    dbService.saveUser(createdStaff);
    setStaffCreateSuccess(`Staff ${createdStaff.name} created successfully! They can now log in.`);
    setTimeout(() => {
      setStaffCreateSuccess(null);
      setShowAddStaffModal(false);
      setNewStaff({
        name: '',
        email: '',
        phone: '',
        jobRole: 'both',
        designation: 'Faculty Trainer & Counselor',
        qualification: 'MCA / B.Tech / M.Sc'
      });
    }, 1200);
  };

  if (!currentUser) return null;

  const filteredStaff = branchStaff.filter(s =>
    s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.phone.includes(staffSearch) ||
    s.email.toLowerCase().includes(staffSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-28 sm:pb-24">
      {/* Manager Profile Header Card */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-amber-900/10 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-2xl font-black shadow-inner">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">{currentUser.name}</h2>
                <span className="bg-amber-300 text-amber-950 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                  Branch Manager
                </span>
                <span className="bg-white/20 text-white border border-white/30 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-amber-200" />
                  {branchObj?.name} ({branchObj?.shortCode})
                </span>
              </div>
              <p className="text-amber-100 text-xs sm:text-sm font-medium mt-0.5">
                {currentUser.designation || 'Branch Operations Manager'} • <span className="text-amber-200">{branchObj?.location}</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-amber-100">
                <span className="flex items-center gap-1 font-mono">
                  <IdCard className="w-3.5 h-3.5" /> ID: {currentUser.managerId || currentUser.id}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {currentUser.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {currentUser.email}
                </span>
              </div>
            </div>
          </div>

          {/* Quick branch KPI badge */}
          <div className="grid grid-cols-2 gap-2 bg-black/20 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-xs w-full md:w-auto">
            <div>
              <p className="text-amber-200 text-[10px] font-semibold uppercase">Branch Staff</p>
              <p className="text-base font-bold text-white mt-0.5">{branchStaff.length} Members</p>
            </div>
            <div>
              <p className="text-amber-200 text-[10px] font-semibold uppercase">Total Students</p>
              <p className="text-base font-bold text-white mt-0.5">{branchStudents.length} Enrolled</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="relative z-10 mt-5 flex items-center gap-1 bg-black/20 p-1.5 rounded-2xl max-w-fit border border-white/15 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('daily_report')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'daily_report'
                ? 'bg-white text-amber-900 shadow-md'
                : 'text-amber-100 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Manager Daily Report
          </button>
          <button
            onClick={() => setActiveTab('staff_management')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'staff_management'
                ? 'bg-white text-amber-900 shadow-md'
                : 'text-amber-100 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Staff Management ({branchStaff.length})
          </button>
          <button
            onClick={() => setActiveTab('leave_permission')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'leave_permission'
                ? 'bg-white text-amber-900 shadow-md'
                : 'text-amber-100 hover:text-white'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            Leaves & Permissions
            {totalBranchPending > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                {totalBranchPending}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'courses'
                ? 'bg-white text-amber-900 shadow-md'
                : 'text-amber-100 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Branch Courses ({branchCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-white text-amber-900 shadow-md'
                : 'text-amber-100 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Branch Students & Fees ({branchStudents.length})
          </button>
        </div>
      </div>

      {/* TAB 1: MANAGER DAILY WORK REPORT */}
      {activeTab === 'daily_report' && (
        <div className="space-y-6">
          {/* Leaves & Permissions Quick Access Banner for Manager */}
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-4 sm:p-5 text-white border border-purple-500/20 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 border border-purple-400/30 rounded-2xl text-purple-300 shrink-0">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-sm text-white">Branch Leaves & Permissions</h4>
                  {totalBranchPending > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950">
                      {totalBranchPending} Staff Request{totalBranchPending > 1 ? 's' : ''} Pending Review
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Up to Date
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-purple-200/80 mt-0.5">
                  Review & approve branch staff leaves or apply for your manager personal leaves and shift permissions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('leave_permission')}
                className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Open Leaves & Permissions →</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left col: Manager Shift Attendance Card & Branch Stats Summary */}
          <div className="lg:col-span-1 space-y-6">
            <StaffAttendanceCard
              staffId={currentUser.id}
              staffName={currentUser.name}
              branchId={defaultBranch}
            />

            {/* Live Branch Real-Time Overview */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  {branchObj?.name} Status
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {branchObj?.location}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-semibold">Total Students</p>
                  <p className="text-base font-bold text-slate-800">{branchStudents.length}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-semibold">Staff Today</p>
                  <p className="text-base font-bold text-emerald-700">
                    {todayStaffAttendance.filter(a => a.status === 'present').length} / {branchStaff.length}
                  </p>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <p className="text-[10px] text-emerald-700 font-semibold">Fees Collected</p>
                  <p className="text-sm font-bold text-emerald-800">₹{calculatedCollectedFees.toLocaleString()}</p>
                </div>
                <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                  <p className="text-[10px] text-rose-700 font-semibold">Fees Due</p>
                  <p className="text-sm font-bold text-rose-800">₹{calculatedPendingFees.toLocaleString()}</p>
                </div>
              </div>

              {/* Staff Teaching Done on that day summary */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-700">Staff Teaching Done Today:</p>
                {todayStaffReports.filter(r => r.totalTeachingSummary).length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No teaching reports submitted today yet.</p>
                ) : (
                  todayStaffReports.filter(r => r.totalTeachingSummary).map(r => (
                    <div key={r.id} className="p-2 bg-emerald-50/70 rounded-xl border border-emerald-100 text-[11px] flex items-center justify-between">
                      <span className="font-semibold text-slate-700">{r.staffName}:</span>
                      <span className="font-mono font-bold text-emerald-800">{r.totalTeachingSummary}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right col: Manager Daily Report Form & History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Manager Daily Work Report</h3>
                    <p className="text-xs text-slate-400">Branch admissions, enquiries, pending fees & absentees</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  {branchObj?.name}
                </span>
              </div>

              {submittedMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{submittedMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmitManagerReport} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Report Date</label>
                    <input
                      type="date"
                      required
                      value={reportDate}
                      onChange={e => setReportDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Salem Branch</label>
                    <input
                      type="text"
                      disabled
                      value={`${branchObj?.name} - ${branchObj?.location}`}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-600 font-medium"
                    />
                  </div>
                </div>

                {/* 1. No of Enquiry & No of Admission */}
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100">
                  {/* No of Enquiry */}
                  <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-2xs">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">No. of Enquiry</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={noOfEnquiry}
                        onChange={e => setNoOfEnquiry(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-xl font-black text-amber-700 bg-transparent outline-hidden"
                      />
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => setNoOfEnquiry(c => c + 1)}
                          className="w-5 h-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[9px] font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => setNoOfEnquiry(c => Math.max(0, c - 1))}
                          className="w-5 h-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[9px] font-bold flex items-center justify-center"
                        >
                          -
                        </button>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">Fresh leads today</span>
                  </div>

                  {/* No of Admission */}
                  <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-2xs">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">No. of Admission</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={noOfAdmission}
                        onChange={e => setNoOfAdmission(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-xl font-black text-emerald-700 bg-transparent outline-hidden"
                      />
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => setNoOfAdmission(c => c + 1)}
                          className="w-5 h-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[9px] font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => setNoOfAdmission(c => Math.max(0, c - 1))}
                          className="w-5 h-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[9px] font-bold flex items-center justify-center"
                        >
                          -
                        </button>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">New enrollments today</span>
                  </div>
                </div>

                {/* 2. Fees Pending Details & Total Students */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">Fees Pending Details (₹)</label>
                        <button
                          type="button"
                          onClick={() => setFeesPendingAmount(calculatedPendingFees)}
                          className="text-[10px] text-blue-600 hover:underline font-semibold"
                        >
                          Auto-fill: ₹{calculatedPendingFees.toLocaleString()}
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={feesPendingAmount}
                        onChange={e => setFeesPendingAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden bg-white font-bold text-rose-700 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">Total Students in Branch</label>
                        <button
                          type="button"
                          onClick={() => setTotalStudentsInBranch(branchStudents.length)}
                          className="text-[10px] text-blue-600 hover:underline font-semibold"
                        >
                          Auto: {branchStudents.length}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={totalStudentsInBranch}
                          onChange={e => setTotalStudentsInBranch(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden bg-white font-bold text-blue-800 font-mono"
                          required
                        />
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => setTotalStudentsInBranch(c => c + 1)}
                            className="w-5 h-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[9px] font-bold flex items-center justify-center"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => setTotalStudentsInBranch(c => Math.max(0, c - 1))}
                            className="w-5 h-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[9px] font-bold flex items-center justify-center"
                          >
                            -
                          </button>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">Total enrolled students in branch</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Fees Pending Breakdown / Follow-up Notes
                    </label>
                    <textarea
                      rows={2}
                      value={feesPendingDetails}
                      onChange={e => setFeesPendingDetails(e.target.value)}
                      placeholder="e.g. ₹20,000 due from Python batch; 3 students committed to pay second installment by Friday."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden bg-white"
                    />
                  </div>
                </div>

                {/* 3. No. of Absent (Students & Staff) */}
                <div className="grid grid-cols-2 gap-3 bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100">
                  <div>
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      No. of Absent Students Today
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={noOfAbsentStudents}
                      onChange={e => setNoOfAbsentStudents(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-xs border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-hidden bg-white font-bold text-rose-700"
                    />
                    <span className="text-[10px] text-rose-500">Unattended today</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      No. of Absent Staff Today
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={noOfAbsentStaff}
                      onChange={e => setNoOfAbsentStaff(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-xs border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-hidden bg-white font-bold text-rose-700"
                    />
                    <span className="text-[10px] text-rose-500">Staff on leave</span>
                  </div>
                </div>

                {/* 4. Manager Remarks */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Manager Overall Remarks & Operations Log
                  </label>
                  <textarea
                    rows={2}
                    value={managerNotes}
                    onChange={e => setManagerNotes(e.target.value)}
                    placeholder="e.g. Conducted daily review with teaching staff. All morning batches completed on schedule. Center infrastructure in good order."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all"
                >
                  <Save className="w-4 h-4" /> Save & Submit Manager Daily Report
                </button>
              </form>
            </div>

            {/* History of Manager Daily Reports */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <h4 className="font-bold text-slate-900 text-sm">Past Manager Daily Reports</h4>
                </div>
                <span className="text-xs text-slate-400 font-semibold">{managerReports.length} Reports</span>
              </div>

              {managerReports.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No manager reports submitted yet.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {managerReports.map(rep => (
                    <div key={rep.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{rep.date}</span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            {branchObj?.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          By: {rep.managerName}
                        </span>
                      </div>

                      {/* Metrics 5-grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                        <div className="bg-white p-2 rounded-xl border border-blue-100">
                          <p className="text-[10px] text-blue-600 font-semibold">Total Students</p>
                          <p className="text-sm font-bold text-blue-800">{rep.totalStudentsInBranch}</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-medium">Enquiries</p>
                          <p className="text-sm font-bold text-amber-600">{rep.noOfEnquiry}</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-medium">Admissions</p>
                          <p className="text-sm font-bold text-emerald-600">{rep.noOfAdmission}</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-medium">Pending Fees</p>
                          <p className="text-xs font-bold text-rose-600 font-mono">₹{rep.feesPendingAmount.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-medium">Absent (Stu/Stf)</p>
                          <p className="text-xs font-bold text-slate-700">{rep.noOfAbsentStudents} / {rep.noOfAbsentStaff || 0}</p>
                        </div>
                      </div>

                      {rep.feesPendingDetails && (
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-100">
                          <span className="font-semibold text-slate-800">Pending Fees Breakdown:</span> {rep.feesPendingDetails}
                        </p>
                      )}

                      {rep.notes && (
                        <p className="text-[11px] text-slate-500 italic">
                          <span className="font-medium text-slate-700 not-italic">Notes:</span> {rep.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* TAB 2: STAFF MANAGEMENT ("manager create staff") */}
      {activeTab === 'staff_management' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff by name or phone..."
                value={staffSearch}
                onChange={e => setStaffSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden bg-slate-50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('leave_permission')}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                <Ticket className="w-4 h-4" /> Staff Leaves & Permissions
                {totalBranchPending > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                    {totalBranchPending}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowAddStaffModal(true)}
                className="flex-1 sm:flex-none px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Staff Member
              </button>
            </div>
          </div>

          {/* Staff members list */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 text-xs">
                No staff members created yet in this branch. Click <strong>Add Staff Member</strong> above to create one.
              </div>
            ) : (
              filteredStaff.map(staff => {
                const todayAtt = todayStaffAttendance.find(a => a.staffId === staff.id);
                const staffRep = todayStaffReports.find(r => r.staffId === staff.id);

                return (
                  <div key={staff.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{staff.name}</h4>
                          <p className="text-[11px] text-slate-400">{staff.staffId || staff.id}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        todayAtt?.loginTime
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {todayAtt?.loginTime ? 'Checked In' : 'Not Checked In'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1 text-slate-600">
                      <p className="flex justify-between">
                        <span className="text-slate-400">Role:</span>
                        <span className="font-semibold text-slate-800 capitalize">
                          {staff.jobRole === 'telecalling' ? 'Telecalling' : staff.jobRole === 'teaching' ? 'Teaching' : 'Teaching & Telecalling'}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400">Designation:</span>
                        <span className="font-medium text-slate-800 truncate max-w-[150px]">{staff.designation || 'Faculty'}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <span className="font-mono text-slate-800">{staff.phone}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400">Email:</span>
                        <span className="text-slate-800 truncate max-w-[160px]">{staff.email}</span>
                      </p>
                    </div>

                    {/* Today's Shift Times */}
                    <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 text-[11px] flex justify-between items-center font-mono">
                      <span>In: <strong className="text-slate-800">{todayAtt?.loginTime || '--:--'}</strong></span>
                      <span>Out: <strong className="text-slate-800">{todayAtt?.logoutTime || '--:--'}</strong></span>
                    </div>

                    {/* Total teaching summary */}
                    {staffRep?.totalTeachingSummary && (
                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] space-y-0.5">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase">Teaching Today:</span>
                        <p className="font-mono font-bold text-emerald-900">{staffRep.totalTeachingSummary}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BRANCH COURSES ("option for manager to add course detail offered in the branch") */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-amber-50 text-amber-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Courses Offered at {branchObj?.name}</h3>
                  <p className="text-xs text-slate-500">
                    Courses managed here appear in student admission dropdowns and auto-calculate student fees.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search branch courses..."
                  value={courseSearch}
                  onChange={e => setCourseSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden bg-slate-50 focus:bg-white w-48 sm:w-60"
                />
              </div>

              <button
                onClick={() => setShowAddCourseModal(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Add Branch Course
              </button>
            </div>
          </div>

          {/* Courses List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branchCourses
              .filter(c =>
                c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
                (c.code && c.code.toLowerCase().includes(courseSearch.toLowerCase())) ||
                c.description.toLowerCase().includes(courseSearch.toLowerCase())
              )
              .map(crs => (
                <div
                  key={crs.id}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3.5 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-block bg-amber-100 text-amber-900 text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-full">
                            {crs.code || 'CRS'}
                          </span>
                          {crs.courseType === 'internship' ? (
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
                          title="Edit / Alter Course"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(crs.id, crs.name)}
                          title="Remove Course"
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-3">{crs.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {crs.duration || '3 Months'}
                      </span>
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 font-mono text-xs">
                        ₹{crs.fee.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Campus:</span>
                      <span className="font-medium text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded-md">
                        {crs.branchId ? `${branchObj?.name} (${branchObj?.shortCode})` : 'All Salem Campuses'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: BRANCH STUDENTS & FEES */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-slate-900 text-base">Students Enrolled at {branchObj?.name}</h3>
              <p className="text-xs text-slate-500">
                Manage student batch timings, update fee payments received, and export records
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student, course, phone..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden bg-slate-50 focus:bg-white w-48 sm:w-60"
                />
              </div>

              {/* Total Pending Pill */}
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100 font-mono">
                Due: ₹{calculatedPendingFees.toLocaleString()}
              </span>

              {/* Export CSV Button */}
              <button
                onClick={exportBranchStudentsCSV}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border border-slate-200 cursor-pointer"
                title="Export branch students to CSV"
              >
                <Download className="w-4 h-4 text-slate-600" /> Export CSV
              </button>

              {/* Register Student Button */}
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Register Student
              </button>
            </div>
          </div>

          {/* Students Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branchStudents.filter(s =>
              s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
              s.phone.includes(studentSearch) ||
              (s.courseName && s.courseName.toLowerCase().includes(studentSearch.toLowerCase())) ||
              (s.studentId && s.studentId.toLowerCase().includes(studentSearch.toLowerCase()))
            ).length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 text-xs">
                No students found in this branch matching your search.
              </div>
            ) : (
              branchStudents
                .filter(s =>
                  s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                  s.phone.includes(studentSearch) ||
                  (s.courseName && s.courseName.toLowerCase().includes(studentSearch.toLowerCase())) ||
                  (s.studentId && s.studentId.toLowerCase().includes(studentSearch.toLowerCase()))
                )
                .map(student => {
                  const total = student.totalFees || 0;
                  const paid = student.paidFees || 0;
                  const pending = student.pendingFees !== undefined ? student.pendingFees : Math.max(0, total - paid);

                  return (
                    <div
                      key={student.id}
                      className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3.5"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-700 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                              {student.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-slate-900 text-sm truncate">{student.name}</h4>
                              <p className="text-[11px] text-slate-400 font-mono">{student.studentId || student.id}</p>
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                            pending === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {pending === 0 ? 'Fees Clear' : `₹${pending.toLocaleString()} Due`}
                          </span>
                        </div>

                        {/* Batch Timing Pill (Highlighted & Editable) */}
                        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span className="font-semibold text-amber-950 truncate">
                              {student.batchTiming || 'Morning (10:00 AM - 12:30 PM)'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleOpenEditStudent(student)}
                            title="Edit Batch Timing"
                            className="text-[10px] font-bold text-amber-800 hover:underline shrink-0 ml-1.5 cursor-pointer"
                          >
                            Change
                          </button>
                        </div>

                        {/* Student Details */}
                        <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1.5 text-slate-600">
                          <p className="flex justify-between items-center">
                            <span className="text-slate-400">Course:</span>
                            <span className="font-semibold text-blue-700 truncate max-w-[170px] text-right">
                              {student.courseName}
                            </span>
                          </p>
                          <p className="flex justify-between items-center">
                            <span className="text-slate-400">Phone:</span>
                            <span className="font-mono text-slate-800">{student.phone}</span>
                          </p>
                          {student.email && (
                            <p className="flex justify-between items-center">
                              <span className="text-slate-400">Email:</span>
                              <span className="text-slate-700 truncate max-w-[170px]">{student.email}</span>
                            </p>
                          )}
                          <p className="flex justify-between items-center">
                            <span className="text-slate-400">Occupation / Std:</span>
                            <span className="text-slate-700 truncate max-w-[170px]">
                              {student.occupation || 'Student'} • {student.standard || 'General'}
                            </span>
                          </p>
                        </div>

                        {/* Fee Progress Bar */}
                        <div className="p-3 bg-white border border-slate-100 rounded-2xl space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Fees Paid:</span>
                            <span className="font-mono font-bold text-slate-800">
                              ₹{paid.toLocaleString()} / ₹{total.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (paid / (total || 1)) * 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[11px] pt-0.5">
                            <span className="text-slate-400">Remaining Balance:</span>
                            <span className={`font-mono font-extrabold ${pending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              ₹{pending.toLocaleString()}
                            </span>
                          </div>

                          {student.lastPaymentMode && (
                            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-600">
                              <span className="flex items-center gap-1 font-semibold">
                                {student.lastPaymentMode === 'upi' ? (
                                  <span className="text-blue-700 font-bold flex items-center gap-0.5"><Smartphone className="w-3 h-3" /> UPI</span>
                                ) : (
                                  <span className="text-emerald-700 font-bold flex items-center gap-0.5"><Banknote className="w-3 h-3" /> Cash</span>
                                )}
                              </span>
                              {student.lastPaymentCollectedBy && (
                                <span className="text-slate-400">Staff: <strong className="text-slate-700">{student.lastPaymentCollectedBy}</strong></span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons Footer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <button
                          onClick={() => setPaymentStudent(student)}
                          className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{pending > 0 ? '+ Collect Fee' : 'Update Fee'}</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditStudent(student)}
                          className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="Edit Student Details & Batch Timing"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* CREATE STAFF MODAL ("manager is create staff") */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-amber-50 text-amber-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Add Staff Member</h3>
                  <p className="text-xs text-slate-500">Create teaching or telecalling staff for {branchObj?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {staffCreateSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{staffCreateSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3.5 mt-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Natarajan"
                  value={newStaff.name}
                  onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={newStaff.phone}
                    onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="priya.staff@cskacademy.com"
                    value={newStaff.email}
                    onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Job Role</label>
                  <select
                    value={newStaff.jobRole}
                    onChange={e => setNewStaff({ ...newStaff, jobRole: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden bg-white font-medium"
                  >
                    <option value="both">Both (Teaching & Telecalling)</option>
                    <option value="teaching">Teaching & Project Work Only</option>
                    <option value="telecalling">Telecalling & Counseling Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="Senior Faculty Trainer"
                    value={newStaff.designation}
                    onChange={e => setNewStaff({ ...newStaff, designation: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Campus</label>
                <input
                  type="text"
                  disabled
                  value={`${branchObj?.name} - ${branchObj?.location}`}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-600 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save & Create Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD BRANCH COURSE MODAL ("option for manager to add course detail offered in the branch") */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-amber-50 text-amber-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Add Branch Course / Internship</h3>
                  <p className="text-xs text-slate-500">Add course or internship offered at {branchObj?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCourseModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {courseCreateSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{courseCreateSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateCourse} className="space-y-3.5 mt-3 overflow-y-auto pr-1 flex-1">
              {/* Course Type Selector ("1 is regular and another is internship") */}
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
                  placeholder={newCourse.courseType === 'internship' ? "e.g. Python & AI Industrial Internship" : "e.g. Master in Python Full Stack & AI"}
                  value={newCourse.name}
                  onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    placeholder={newCourse.courseType === 'internship' ? "e.g. INT-PY30" : "e.g. PY-201, AI-102"}
                    value={newCourse.code}
                    onChange={e => setNewCourse({ ...newCourse, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-mono uppercase"
                  />
                </div>

                {/* Duration: Days for Internship, Months/Weeks for Regular */}
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
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden bg-white"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Program Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="25000"
                    value={newCourse.fee}
                    onChange={e => setNewCourse({ ...newCourse, fee: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-mono font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Offering</label>
                  <input
                    type="text"
                    disabled
                    value={`${branchObj?.name} - ${branchObj?.location}`}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Description / Key Syllabus</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Python, Django, REST APIs, PostgreSQL, React, Docker, and Capstone Project."
                  value={newCourse.description}
                  onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save {newCourse.courseType === 'internship' ? 'Internship' : 'Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COURSE MODAL ("make all course create should be editable like i can alter whever manager can") */}
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
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {courseEditSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{courseEditSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCourse} className="space-y-3.5 mt-3 overflow-y-auto pr-1 flex-1">
              {/* Course Type Selector */}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Program Fee (₹) *</label>
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
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
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

      {/* REGISTER STUDENT MODAL ("which is selected when student admitted") */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-amber-50 text-amber-600">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Admit New Student</h3>
                  <p className="text-xs text-slate-500">Register student for {branchObj?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {studentCreateSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{studentCreateSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-3.5 mt-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muthu Kumar"
                  value={newStudent.name}
                  onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={newStudent.phone}
                    onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="muthu@gmail.com"
                    value={newStudent.email}
                    onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Occupation</label>
                  <select
                    value={newStudent.occupation}
                    onChange={e => setNewStudent({ ...newStudent, occupation: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden bg-white"
                  >
                    <option value="Student">Student (School / College)</option>
                    <option value="Working Professional">Working Professional</option>
                    <option value="Job Seeker">Job Seeker</option>
                    <option value="Freelancer">Freelancer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Standard / Grade</label>
                  <input
                    type="text"
                    placeholder="e.g. 12th Standard / B.E"
                    value={newStudent.standard}
                    onChange={e => setNewStudent({ ...newStudent, standard: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              {/* COURSE OFFERED IN BRANCH WITH AUTO-FILLED FEE */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Offered at {branchObj?.shortCode} *
                </label>
                <select
                  value={newStudent.courseName}
                  onChange={e => {
                    const sel = branchCourses.find(c => c.name === e.target.value);
                    setNewStudent({
                      ...newStudent,
                      courseName: e.target.value,
                      totalFees: sel ? sel.fee : newStudent.totalFees
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden bg-white font-medium text-slate-800"
                >
                  {branchCourses.map(crs => (
                    <option key={crs.id} value={crs.name}>
                      {crs.name} ({crs.code ? `${crs.code} - ` : ''}₹{crs.fee.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Campus</label>
                  <input
                    type="text"
                    disabled
                    value={`${branchObj?.name} - ${branchObj?.location}`}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Timing</label>
                  <select
                    value={newStudent.batchTiming}
                    onChange={e => setNewStudent({ ...newStudent, batchTiming: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden bg-white"
                  >
                    <option value="Morning (10:00 AM - 12:30 PM)">Morning (10:00 AM - 12:30 PM)</option>
                    <option value="Afternoon (02:00 PM - 04:30 PM)">Afternoon (02:00 PM - 04:30 PM)</option>
                    <option value="Evening (05:00 PM - 07:30 PM)">Evening (05:00 PM - 07:30 PM)</option>
                    <option value="Weekend Special Batch">Weekend Special Batch</option>
                  </select>
                </div>
              </div>

              {/* Course Fees and Live Pending Fees */}
              <div className="grid grid-cols-2 gap-3 bg-amber-50/60 p-3 rounded-2xl border border-amber-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Course Fee (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newStudent.totalFees}
                    onChange={e => setNewStudent({ ...newStudent, totalFees: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Paid (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newStudent.paidFees}
                    onChange={e => setNewStudent({ ...newStudent, paidFees: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-mono font-bold text-emerald-700"
                  />
                </div>
                <div className="col-span-2 pt-1 flex items-center justify-between text-xs border-t border-amber-200/50">
                  <span className="text-slate-600 font-medium">Pending Balance:</span>
                  <span className="font-mono font-extrabold text-rose-700">
                    ₹{Math.max(0, Number(newStudent.totalFees) - Number(newStudent.paidFees)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Register & Admit Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE / COLLECT STUDENT FEE MODAL */}
      {paymentStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Record Student Fee Payment</h3>
                  <p className="text-xs text-slate-500">{paymentStudent.name} • {paymentStudent.studentId || paymentStudent.id}</p>
                </div>
              </div>
              <button
                onClick={() => setPaymentStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentSuccess ? (
              <div className="py-8 text-center space-y-2.5">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                <p className="font-extrabold text-slate-900 text-base">Fee Payment Recorded Successfully!</p>
                <p className="text-xs text-slate-500">Student pending balance and branch fee records have been updated.</p>
              </div>
            ) : (
              <form onSubmit={handleRecordPayment} className="space-y-3.5 mt-3 overflow-y-auto pr-1 flex-1">
                <div className="bg-slate-50 p-3.5 rounded-2xl text-xs space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Enrolled Course:</span>
                    <span className="font-bold text-slate-800 text-right truncate max-w-[200px]">{paymentStudent.courseName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Course Fee:</span>
                    <span className="font-mono font-bold text-slate-800">₹{(paymentStudent.totalFees || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Previously Paid:</span>
                    <span className="font-mono font-bold text-emerald-700">₹{(paymentStudent.paidFees || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-rose-600 font-bold">Current Pending Due:</span>
                    <span className="font-mono font-extrabold text-rose-700 text-sm">
                      ₹{(paymentStudent.pendingFees !== undefined ? paymentStudent.pendingFees : Math.max(0, (paymentStudent.totalFees || 0) - (paymentStudent.paidFees || 0))).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Amount Received Now (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={paymentStudent.pendingFees || paymentStudent.totalFees || 999999}
                    required
                    placeholder="Enter amount paid"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono font-bold text-emerald-800"
                    autoFocus
                  />
                </div>

                {/* Quick preset buttons */}
                <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                  <span className="text-[11px] text-slate-400">Quick fill:</span>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount('2000')}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono font-semibold cursor-pointer"
                  >
                    +₹2,000
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount('5000')}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono font-semibold cursor-pointer"
                  >
                    +₹5,000
                  </button>
                  {paymentStudent.pendingFees && paymentStudent.pendingFees > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(String(paymentStudent.pendingFees))}
                      className="px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-mono font-bold border border-emerald-200 cursor-pointer"
                    >
                      Clear Full Balance (₹{paymentStudent.pendingFees.toLocaleString()})
                    </button>
                  )}
                </div>

                {/* Payment Mode Selector ("is it payed via upi or cash") */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Method *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('cash')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        paymentMode === 'cash'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-2 ring-emerald-500/20'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span>💵 Cash Payment</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('upi')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        paymentMode === 'upi'
                          ? 'bg-blue-50 text-blue-900 border-blue-300 ring-2 ring-blue-500/20'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-blue-600" />
                      <span>📱 UPI (GPay / PhonePe / QR)</span>
                    </button>
                  </div>
                </div>

                {/* If UPI, reference note */}
                {paymentMode === 'upi' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">UPI Transaction Reference / App (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. GPay / PhonePe Ref #429810..."
                      value={paymentNotes}
                      onChange={e => setPaymentNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-blue-200 bg-blue-50/30 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                    />
                  </div>
                )}

                {/* Staff who collected ("name of the staff collected details") */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cash / Fee Collected By (Staff Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter staff faculty name who received cash/UPI"
                    value={paymentStaff}
                    onChange={e => setPaymentStaff(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium text-slate-800"
                  />
                  {branchStaff.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400">Quick select:</span>
                      {currentUser?.name && (
                        <button
                          type="button"
                          onClick={() => setPaymentStaff(currentUser.name)}
                          className="px-2 py-0.5 text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md font-bold cursor-pointer"
                        >
                          Self ({currentUser.name})
                        </button>
                      )}
                      {branchStaff.map(st => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setPaymentStaff(st.name)}
                          className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium cursor-pointer"
                        >
                          {st.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live Preview */}
                {parseFloat(paymentAmount) > 0 && (
                  <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-emerald-800">New Total Paid:</span>
                      <span className="font-mono font-bold text-emerald-900">
                        ₹{Math.min(paymentStudent.totalFees || 0, (paymentStudent.paidFees || 0) + (parseFloat(paymentAmount) || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Remaining Balance:</span>
                      <span className="font-mono font-bold text-rose-700">
                        ₹{Math.max(0, (paymentStudent.totalFees || 0) - ((paymentStudent.paidFees || 0) + (parseFloat(paymentAmount) || 0))).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-emerald-200/60 text-[11px]">
                      <span className="text-slate-500">Method & Staff:</span>
                      <span className="font-semibold text-slate-800">
                        {paymentMode.toUpperCase()} • Collected by {paymentStaff || 'Staff'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Past Payment Records for this Student */}
                {paymentStudent.paymentHistory && paymentStudent.paymentHistory.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Previous Payment Installments</span>
                      <span className="text-[10px] font-mono text-slate-400 font-normal">({paymentStudent.paymentHistory.length} recorded)</span>
                    </h4>
                    <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                      {paymentStudent.paymentHistory.map(rec => (
                        <div key={rec.id} className="p-2 bg-slate-50 rounded-xl text-[11px] border border-slate-100 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase ${rec.paymentMode === 'upi' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {rec.paymentMode}
                              </span>
                              <span className="font-mono font-bold text-slate-800">₹{rec.amount.toLocaleString()}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {rec.date} {rec.time} • Staff: <strong className="text-slate-700">{rec.collectedBy}</strong>
                              {rec.notes ? ` (${rec.notes})` : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2 shrink-0 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPaymentStudent(null)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Confirm & Record Payment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: LEAVES & PERMISSIONS MANAGEMENT */}
      {activeTab === 'leave_permission' && (
        <LeavesPermissionsManager
          viewerRole="manager"
          managerBranchId={defaultBranch}
          currentUserId={currentUser?.id}
          currentUserName={currentUser?.name}
        />
      )}

      {/* EDIT STUDENT & BATCH TIMING MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-amber-50 text-amber-600">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Edit Student Details & Timing</h3>
                  <p className="text-xs text-slate-500">{editingStudent.name} • {editingStudent.studentId || editingStudent.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editSuccessMessage && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{editSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditStudent} className="space-y-3.5 mt-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              {/* BATCH TIMING (EDITABLE) */}
              <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100 space-y-2">
                <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> Batch Timing (Editable) *
                </label>
                <select
                  value={editForm.batchTiming}
                  onChange={e => setEditForm({ ...editForm, batchTiming: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden bg-white font-medium text-slate-800"
                >
                  <option value="Morning (10:00 AM - 12:30 PM)">Morning (10:00 AM - 12:30 PM)</option>
                  <option value="Afternoon (02:00 PM - 04:30 PM)">Afternoon (02:00 PM - 04:30 PM)</option>
                  <option value="Evening (05:00 PM - 07:30 PM)">Evening (05:00 PM - 07:30 PM)</option>
                  <option value="Weekend Special Batch">Weekend Special Batch</option>
                  <option value="custom">Custom Timing (Enter Manually)...</option>
                </select>

                {editForm.batchTiming === 'custom' && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Enter Custom Timing:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 07:30 AM - 09:30 AM (Fast-Track)"
                      value={editForm.customBatchTiming}
                      onChange={e => setEditForm({ ...editForm, customBatchTiming: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden bg-white font-medium"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Enrolled</label>
                <select
                  value={editForm.courseName}
                  onChange={e => {
                    const sel = branchCourses.find(c => c.name === e.target.value);
                    setEditForm({
                      ...editForm,
                      courseName: e.target.value,
                      totalFees: sel ? sel.fee : editForm.totalFees
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden bg-white font-medium text-slate-800"
                >
                  {branchCourses.map(c => (
                    <option key={c.id} value={c.name}>{c.name} (₹{c.fee.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Course Fee (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.totalFees}
                    onChange={e => setEditForm({ ...editForm, totalFees: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Standard / Qualification</label>
                  <input
                    type="text"
                    value={editForm.standard}
                    onChange={e => setEditForm({ ...editForm, standard: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 shrink-0 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
