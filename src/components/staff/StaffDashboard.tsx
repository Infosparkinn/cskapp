import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StaffAttendanceCard } from './StaffAttendanceCard';
import { StaffAttendanceView } from './StaffAttendanceView';
import { StaffDailyReportForm } from './StaffDailyReportForm';
import { 
  User, 
  Phone, 
  Mail, 
  Briefcase, 
  Award, 
  IdCard,
  Building2,
  GraduationCap,
  Sparkles,
  School,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ChevronDown,
  Plus,
  X,
  Check,
  Calendar,
  Ticket
} from 'lucide-react';
import { dbService, BRANCHES, getTodayDate } from '../../services/db';
import type { BranchId, UserProfile } from '../../types';

export const StaffDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeStaffTab, setActiveStaffTab] = useState<'work' | 'attendance' | 'students'>('work');
  
  // Branch-wise student view state
  const defaultBranch: BranchId = currentUser?.branchId || 'dadagapatty';
  const [viewBranch, setViewBranch] = useState<BranchId | 'all'>(defaultBranch);
  const [studentSearch, setStudentSearch] = useState('');

  if (!currentUser) return null;

  const branchObj = BRANCHES.find(b => b.id === currentUser.branchId);
  const studentsList = dbService.getStudentList(viewBranch);

  const [showAddModal, setShowAddModal] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    occupation: 'Student',
    standard: '12th Standard',
    courseName: 'Artificial Intelligence & Deep Learning (AI)',
    totalFees: 30000,
    paidFees: 5000,
    batchTiming: 'Morning (10:00 AM - 12:30 PM)',
    branchId: currentUser.branchId || 'dadagapatty'
  });

  const courses = dbService.getCourses(newStudent.branchId || currentUser.branchId);

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const studentBranch = BRANCHES.find(b => b.id === newStudent.branchId);
    const paid = Number(newStudent.paidFees) || 0;
    const pending = Math.max(0, Number(newStudent.totalFees) - paid);
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
      paidFees: paid,
      pendingFees: pending,
      feeStatus: pending === 0 ? 'paid' : (paid > 0 ? 'partial' : 'pending'),
      lastPaymentMode: paid > 0 ? 'cash' : undefined,
      lastPaymentCollectedBy: paid > 0 ? currentUser.name : undefined,
      paymentHistory: paid > 0 ? [{
        id: 'pay-init-' + Date.now(),
        amount: paid,
        paymentMode: 'cash',
        collectedBy: currentUser.name,
        date: getTodayDate(),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        notes: 'Initial admission fee payment',
        timestamp: Date.now()
      }] : [],
      branchId: newStudent.branchId as BranchId,
      branchName: studentBranch?.fullName || 'CSK Academy',
      studentId: 'STU-' + Math.floor(1000 + Math.random() * 9000),
      createdAt: getTodayDate()
    };
    dbService.saveUser(created);
    setCreateSuccess(`Student ${created.name} registered successfully!`);
    setTimeout(() => {
      setCreateSuccess(null);
      setShowAddModal(false);
      setNewStudent({
        name: '',
        email: '',
        phone: '',
        occupation: 'Student',
        standard: '12th Standard',
        courseName: courses[0]?.name || 'Artificial Intelligence & Deep Learning (AI)',
        totalFees: 25000,
        paidFees: 5000,
        batchTiming: 'Morning (10:00 AM - 12:30 PM)',
        branchId: currentUser.branchId || 'dadagapatty'
      });
    }, 1200);
  };

  const filteredStudents = studentsList.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.phone.includes(studentSearch) ||
    (s.courseName && s.courseName.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Staff Profile Header Card with Branch Information */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-2xl font-black shadow-inner">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">{currentUser.name}</h2>
                <span className="bg-emerald-400 text-emerald-950 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Staff
                </span>
                <span className="bg-amber-400 text-amber-950 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {branchObj?.name || 'CSK Academy'}
                </span>
              </div>
              <p className="text-blue-100 text-xs sm:text-sm font-medium mt-0.5">
                {currentUser.designation || 'Staff Faculty'} • <span className="text-amber-200">{branchObj?.location}</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-blue-200">
                <span className="flex items-center gap-1">
                  <IdCard className="w-3.5 h-3.5" /> ID: {currentUser.staffId || currentUser.id}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" /> Role: {currentUser.jobRole || 'Teaching & Telecalling'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick contact pills */}
          <div className="flex flex-col sm:items-end gap-1.5 text-xs text-blue-100 bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/15 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-semibold text-white">{branchObj?.fullName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-blue-200" />
              <span>{currentUser.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-200" />
              <span>{currentUser.email}</span>
            </div>
          </div>
        </div>

        {/* Tab switcher: Daily Work vs Attendance vs Branch Students */}
        <div className="relative z-10 mt-5 flex items-center gap-1 bg-white/10 p-1.5 rounded-2xl max-w-fit border border-white/15 flex-wrap">
          <button
            onClick={() => setActiveStaffTab('work')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeStaffTab === 'work' 
                ? 'bg-white text-blue-900 shadow-md' 
                : 'text-blue-100 hover:text-white'
            }`}
          >
            Daily Work & Shift Punch
          </button>
          <button
            onClick={() => setActiveStaffTab('attendance')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeStaffTab === 'attendance' 
                ? 'bg-white text-blue-900 shadow-md' 
                : 'text-blue-100 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            My Attendance & Permissions
          </button>
          <button
            onClick={() => setActiveStaffTab('students')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeStaffTab === 'students' 
                ? 'bg-white text-blue-900 shadow-md' 
                : 'text-blue-100 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Branch Students Directory ({studentsList.length})
          </button>
        </div>
      </div>

      {activeStaffTab === 'work' ? (
        /* Main Grid: Attendance & Work Report */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <StaffAttendanceCard 
              staffId={currentUser.id} 
              staffName={currentUser.name} 
              branchId={currentUser.branchId}
              onViewDetailedAttendance={() => setActiveStaffTab('attendance')}
            />

            {/* Branch Details Box */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Your Assigned Salem Campus</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1.5 text-slate-600">
                <p className="font-bold text-slate-900 text-sm">{branchObj?.name}</p>
                <p className="text-blue-700 font-semibold">{branchObj?.location}</p>
                <p className="text-[11px] text-slate-500">{branchObj?.address}</p>
                <p className="text-[11px] text-slate-500 font-mono">Branch Phone: {branchObj?.phone}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <StaffDailyReportForm 
              staffId={currentUser.id} 
              staffName={currentUser.name}
              defaultJobRole={currentUser.jobRole || 'both'}
              branchId={currentUser.branchId}
            />
          </div>
        </div>
      ) : activeStaffTab === 'attendance' ? (
        /* Dedicated Staff Attendance & Permissions Details */
        <StaffAttendanceView
          staffId={currentUser.id}
          staffName={currentUser.name}
          branchId={currentUser.branchId}
        />
      ) : (
        /* Branch-wise Student Details View for Staff */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search branch students..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50"
              />
            </div>

            {/* Actions & Branch Selector for Staff */}
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" /> Register New Student
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Branch:</span>
                <select
                  value={viewBranch}
                  onChange={e => setViewBranch(e.target.value as any)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Salem Branches</option>
                  {BRANCHES.map(b => (
                    <option key={b.id} value={b.id}>{b.name} - {b.location}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Student Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 text-xs">
                No students found for this branch filter.
              </div>
            ) : (
              filteredStudents.map(student => {
                const stuBranch = BRANCHES.find(b => b.id === student.branchId);
                const attList = dbService.getStudentAttendance(student.id);

                return (
                  <div key={student.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{student.name}</h4>
                          <p className="text-[11px] text-slate-500">{student.studentId}</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {stuBranch?.name || 'Branch'}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Campus:</span>
                        <span className="font-bold text-slate-800">{stuBranch?.location || 'Salem'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Occupation:</span>
                        <span className="font-semibold text-slate-800">{student.occupation || 'Student'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Standard / Class:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[140px] text-right">{student.standard || '12th'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Course:</span>
                        <span className="font-semibold text-blue-700 truncate max-w-[150px] text-right">{student.courseName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <span className="font-mono text-slate-800">{student.phone}</span>
                      </div>
                    </div>

                    {/* Fees summary */}
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="text-slate-500">Fees Status:</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                        (student.pendingFees || 0) === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {(student.pendingFees || 0) === 0 ? 'Paid' : `₹${student.pendingFees?.toLocaleString()} Due`}
                      </span>
                    </div>

                    {/* Attendance count */}
                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span>Attended: {attList.length} Sessions</span>
                      <span className="text-blue-600 font-medium">Batch: {student.batchTiming || 'Regular'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Register Student Modal for Staff */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-blue-50 text-blue-600">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Register New Student</h3>
                  <p className="text-xs text-slate-500">Student enrollment & course assignment</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{createSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-3.5 mt-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karthik Raja"
                  value={newStudent.name}
                  onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
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
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="student@example.com"
                    value={newStudent.email}
                    onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Occupation</label>
                  <select
                    value={newStudent.occupation}
                    onChange={e => setNewStudent({ ...newStudent, occupation: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
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
                    placeholder="e.g. 12th Standard / B.E CSE"
                    value={newStudent.standard}
                    onChange={e => setNewStudent({ ...newStudent, standard: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Salem Campus *</label>
                  <select
                    value={newStudent.branchId}
                    onChange={e => {
                      const nextBranch = e.target.value as BranchId;
                      const nextCourses = dbService.getCourses(nextBranch);
                      const sel = nextCourses[0];
                      setNewStudent({ 
                        ...newStudent, 
                        branchId: nextBranch,
                        courseName: sel ? sel.name : newStudent.courseName,
                        totalFees: sel ? sel.fee : newStudent.totalFees
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-white font-medium"
                  >
                    {BRANCHES.map(b => (
                      <option key={b.id} value={b.id}>{b.name} - {b.location}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Timing</label>
                  <select
                    value={newStudent.batchTiming}
                    onChange={e => setNewStudent({ ...newStudent, batchTiming: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
                  >
                    <option value="Morning (10:00 AM - 12:30 PM)">Morning (10:00 AM - 12:30 PM)</option>
                    <option value="Afternoon (02:00 PM - 04:30 PM)">Afternoon (02:00 PM - 04:30 PM)</option>
                    <option value="Evening (05:00 PM - 07:30 PM)">Evening (05:00 PM - 07:30 PM)</option>
                    <option value="Weekend Special Batch">Weekend Special Batch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enrolled Course (Offered at selected Campus) *
                </label>
                <select
                  value={newStudent.courseName}
                  onChange={e => {
                    const c = courses.find(crs => crs.name === e.target.value);
                    setNewStudent({ 
                      ...newStudent, 
                      courseName: e.target.value,
                      totalFees: c?.fee || newStudent.totalFees
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-white font-medium"
                >
                  {courses.map(crs => (
                    <option key={crs.id} value={crs.name}>
                      {crs.courseType === 'internship' ? `[Internship - ${crs.duration}] ` : ''}{crs.name} ({crs.code ? `${crs.code} - ` : ''}₹{crs.fee.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Course Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newStudent.totalFees}
                    onChange={e => setNewStudent({ ...newStudent, totalFees: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newStudent.paidFees}
                    onChange={e => setNewStudent({ ...newStudent, paidFees: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-white font-bold text-emerald-700"
                  />
                </div>
                <div className="col-span-2 text-right text-xs font-bold text-slate-600">
                  Pending Balance: <span className="text-rose-600">₹{Math.max(0, newStudent.totalFees - newStudent.paidFees).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save & Register Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
