import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LMSManager } from '../lms/LMSManager';
import { NoticeBoardManager } from '../erp/NoticeBoardManager';
import { 
  GraduationCap, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  Calendar, 
  BookOpen, 
  Briefcase, 
  School, 
  Phone, 
  Mail, 
  AlertCircle,
  FileText,
  Plus,
  Layers,
  Bell
} from 'lucide-react';
import { dbService, getTodayDate, getCurrentTime } from '../../services/db';
import type { StudentAttendance } from '../../types';

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'fees_attendance' | 'lms' | 'notices'>('fees_attendance');
  const [attendanceList, setAttendanceList] = useState<StudentAttendance[]>([]);
  const [todayDate, setTodayDate] = useState(getTodayDate());
  
  // Mark attendance form state
  const [inTime, setInTime] = useState('09:30 AM');
  const [outTime, setOutTime] = useState('12:00 PM');
  const [topicCovered, setTopicCovered] = useState('');
  const [isPresent, setIsPresent] = useState(true);
  const [notes, setNotes] = useState('');
  const [markedSuccess, setMarkedSuccess] = useState<string | null>(null);

  const refreshAttendance = () => {
    if (currentUser) {
      const records = dbService.getStudentAttendance(currentUser.id);
      setAttendanceList(records);
    }
  };

  useEffect(() => {
    refreshAttendance();
    const handleDbChange = () => refreshAttendance();
    window.addEventListener('educenter-db-change', handleDbChange);
    return () => window.removeEventListener('educenter-db-change', handleDbChange);
  }, [currentUser]);

  if (!currentUser) return null;

  const totalFee = currentUser.totalFees !== undefined ? currentUser.totalFees : 0;
  const paidFee = currentUser.paidFees || 0;
  const pendingFee = currentUser.pendingFees !== undefined ? currentUser.pendingFees : Math.max(0, totalFee - paidFee);
  const paidPercent = totalFee > 0 ? Math.min(100, Math.round((paidFee / totalFee) * 100)) : 100;

  // Find if today already marked
  const todayRecord = attendanceList.find(a => a.date === todayDate);

  const handleMarkAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    dbService.markStudentAttendance({
      studentId: currentUser.id,
      studentName: currentUser.name,
      courseName: currentUser.courseName || 'Registered Course',
      date: todayDate,
      inTime,
      outTime,
      topicCovered: topicCovered.trim() || 'Daily Course Module Lab & Lecture',
      present: isPresent,
      remarks: notes.trim() || undefined
    });

    setMarkedSuccess(`Attendance marked for ${todayDate} successfully!`);
    refreshAttendance();
    setTimeout(() => setMarkedSuccess(null), 3000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Student Profile & Details Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-blue-600/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-2xl font-black shadow-inner">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">{currentUser.name}</h2>
                <span className="bg-sky-200 text-sky-900 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Student Portal
                </span>
                <span className="bg-amber-300 text-amber-950 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  {currentUser.branchName || 'Salem Branch'}
                </span>
              </div>
              <p className="text-blue-100 text-xs sm:text-sm font-medium mt-0.5">
                {currentUser.courseName || 'Web Development & Modern Technologies'}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-blue-100">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {currentUser.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {currentUser.email}
                </span>
              </div>
            </div>
          </div>

          {/* Student Status Badge Box */}
          <div className="grid grid-cols-2 gap-2 w-full md:w-auto bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-xs">
            <div>
              <p className="text-blue-200 text-[10px] font-semibold uppercase">Occupation</p>
              <p className="font-bold text-white flex items-center gap-1 mt-0.5">
                <Briefcase className="w-3.5 h-3.5 text-sky-300" />
                {currentUser.occupation || 'Student'}
              </p>
            </div>
            <div>
              <p className="text-blue-200 text-[10px] font-semibold uppercase">Standard / Class</p>
              <p className="font-bold text-white flex items-center gap-1 mt-0.5 truncate">
                <School className="w-3.5 h-3.5 text-sky-300" />
                {currentUser.standard || '12th Standard'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab switcher for Students */}
        <div className="relative z-10 mt-5 flex items-center gap-1 bg-white/10 p-1.5 rounded-2xl max-w-fit border border-white/15">
          <button
            onClick={() => setActiveTab('fees_attendance')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'fees_attendance' 
                ? 'bg-white text-blue-900 shadow-md' 
                : 'text-blue-100 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Fees & Attendance
          </button>
          <button
            onClick={() => setActiveTab('lms')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'lms' 
                ? 'bg-white text-blue-900 shadow-md' 
                : 'text-blue-100 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Course Syllabus & Materials
          </button>
          <button
            onClick={() => setActiveTab('notices')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'notices' 
                ? 'bg-white text-blue-900 shadow-md' 
                : 'text-blue-100 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" /> Campus Notices
          </button>
        </div>
      </div>

      {activeTab === 'lms' ? (
        <LMSManager />
      ) : activeTab === 'notices' ? (
        <NoticeBoardManager viewerRole="student" currentBranchId={currentUser.branchId} currentUserName={currentUser.name} />
      ) : (
        /* Main Grid: Fees Card & Attendance System */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col: Fees & Course Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Fees Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Course Fees Details</h3>
                  <p className="text-xs text-slate-400">Payment & Pending Summary</p>
                </div>
              </div>

              <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                pendingFee === 0 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {pendingFee === 0 ? 'Fully Paid' : 'Fee Due'}
              </span>
            </div>

            {/* Fees Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Fees</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">₹{totalFee.toLocaleString()}</p>
                <span className="text-[10px] text-slate-500">Course Total</span>
              </div>

              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-700 uppercase">Amount Paid</p>
                <p className="text-lg font-black text-emerald-700 mt-0.5">₹{paidFee.toLocaleString()}</p>
                <span className="text-[10px] text-emerald-600 font-medium">{paidPercent}% completed</span>
              </div>
            </div>

            {/* Pending Fees Highlight Box */}
            <div className={`p-4 rounded-2xl border ${
              pendingFee > 0 
                ? 'bg-rose-50/70 border-rose-200 text-rose-900' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide">
                    {pendingFee > 0 ? 'Pending Fees Due' : 'All Dues Cleared!'}
                  </p>
                  <p className="text-2xl font-black mt-1">₹{pendingFee.toLocaleString()}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${pendingFee > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                  {pendingFee > 0 ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${paidPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Paid: ₹{paidFee.toLocaleString()}</span>
                  <span>Pending: ₹{pendingFee.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Course Information Details */}
            <div className="pt-2 text-xs space-y-2 border-t border-slate-100">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" /> Enrolled Course Details
              </p>
              <div className="bg-slate-50 p-3 rounded-2xl space-y-1.5 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Course:</span>
                  <span className="font-bold text-slate-800 text-right">{currentUser.courseName || 'Full Stack Web'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Student ID:</span>
                  <span className="font-mono font-semibold text-slate-800">{currentUser.studentId || currentUser.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Batch Timing:</span>
                  <span className="font-semibold text-slate-800">{currentUser.batchTiming || 'Morning Batch'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right col: Attendance Marking & Topic Covered History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mark Attendance Form */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Put Attendance</h3>
                  <p className="text-xs text-slate-400">Record in-time, out-time and topic covered that day</p>
                </div>
              </div>

              {todayRecord ? (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" /> Present Today
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  Not Recorded Yet
                </span>
              )}
            </div>

            {markedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{markedSuccess}</span>
              </div>
            )}

            <form onSubmit={handleMarkAttendance} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={todayDate}
                    onChange={e => setTodayDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
                    required
                  />
                </div>

                {/* In Time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">In Time</label>
                  <input
                    type="text"
                    value={inTime}
                    placeholder="e.g. 10:00 AM"
                    onChange={e => setInTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-white font-mono"
                    required
                  />
                </div>

                {/* Out Time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Out Time</label>
                  <input
                    type="text"
                    value={outTime}
                    placeholder="e.g. 12:30 PM"
                    onChange={e => setOutTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Topic Covered that Day */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Topic Covered That Day
                </label>
                <input
                  type="text"
                  placeholder="e.g. JavaScript Arrays, React Props & State, Node.js APIs"
                  value={topicCovered}
                  onChange={e => setTopicCovered(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-white font-medium"
                  required
                />
              </div>

              {/* Status Radio */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-700">Attendance:</span>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="presentStatus"
                    checked={isPresent === true}
                    onChange={() => setIsPresent(true)}
                    className="accent-emerald-600"
                  />
                  <span>Present</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="presentStatus"
                    checked={isPresent === false}
                    onChange={() => setIsPresent(false)}
                    className="accent-red-600"
                  />
                  <span>Absent</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all"
              >
                <CheckCircle className="w-4 h-4" /> Save Today's Attendance & Topic
              </button>
            </form>
          </div>

          {/* Past Attendance Logs & Topics Covered */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-sm">Attendance & Topics History</h4>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{attendanceList.length} Sessions</span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {attendanceList.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No attendance logged yet.</p>
              ) : (
                attendanceList.map(record => (
                  <div key={record.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{record.date}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          record.present ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {record.present ? 'Present' : 'Absent'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-blue-700">
                        Topic: {record.topicCovered}
                      </p>
                      {record.remarks && (
                        <p className="text-[11px] text-slate-500">{record.remarks}</p>
                      )}
                    </div>

                    <div className="text-left sm:text-right text-[11px] text-slate-500 shrink-0 font-mono bg-white sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-slate-100">
                      <p>In: <span className="font-bold text-slate-800">{record.inTime}</span></p>
                      <p>Out: <span className="font-bold text-slate-800">{record.outTime}</span></p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
