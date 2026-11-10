import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  PhoneCall, 
  BookOpen, 
  Users, 
  Filter, 
  Clock,
  CheckCircle,
  TrendingUp,
  Search,
  Building2,
  UserCheck,
  IdCard,
  Ticket
} from 'lucide-react';
import { dbService, getTodayDate, BRANCHES, downloadCSV } from '../../services/db';
import type { DailyWorkReport, StudentAttendance, ManagerDailyReport, BranchId, StaffAttendance } from '../../types';
import { LeavesPermissionsManager } from '../common/LeavesPermissionsManager';

export const ReportsViewer: React.FC<{ initialBranch?: BranchId | 'all'; initialMonth?: string }> = ({ 
  initialBranch = 'all',
  initialMonth = 'all'
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [selectedBranch, setSelectedBranch] = useState<BranchId | 'all'>(initialBranch);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [reportSection, setReportSection] = useState<'work_reports' | 'manager_reports' | 'staff_attendance' | 'student_attendance' | 'leaves_permissions'>('work_reports');
  const [dbVersion, setDbVersion] = useState(0);

  // Sync branch and month when parent changes
  useEffect(() => {
    setSelectedBranch(initialBranch);
  }, [initialBranch]);

  useEffect(() => {
    if (initialMonth) setSelectedMonth(initialMonth);
  }, [initialMonth]);

  // Live listener for new reports and attendance
  useEffect(() => {
    const handleDbChange = () => setDbVersion(v => v + 1);
    window.addEventListener('educenter-db-change', handleDbChange);
    return () => window.removeEventListener('educenter-db-change', handleDbChange);
  }, []);

  const staffList = dbService.getStaffList(selectedBranch);
  const workReports = dbService.getWorkReports(
    selectedDate ? selectedDate : undefined,
    selectedStaffId !== 'all' ? selectedStaffId : undefined,
    selectedBranch,
    selectedMonth !== 'all' ? selectedMonth : undefined
  );
  const managerReports = dbService.getManagerDailyReports(
    selectedDate ? selectedDate : undefined,
    undefined,
    selectedBranch,
    selectedMonth !== 'all' ? selectedMonth : undefined
  );
  const staffAttendance = dbService.getStaffAttendance(
    selectedDate ? selectedDate : undefined,
    selectedBranch,
    selectedMonth !== 'all' ? selectedMonth : undefined
  );
  const studentAttendance = dbService.getStudentAttendance(
    undefined,
    selectedDate ? selectedDate : undefined,
    selectedBranch,
    selectedMonth !== 'all' ? selectedMonth : undefined
  );

  // Totals for selected date & branch
  let totalCalls = 0;
  let totalFollowUp = 0;
  let totalEnquiries = 0;
  let totalAdmissions = 0;
  let totalTeachingSessions = 0;
  let totalStudentsTaught = 0;

  workReports.forEach(r => {
    if (r.telecalling) {
      totalCalls += r.telecalling.todayCalls || 0;
      totalFollowUp += r.telecalling.todayFollowUp || 0;
      totalEnquiries += r.telecalling.todayEnquiry || 0;
      totalAdmissions += r.telecalling.todayAdmission || 0;
    }
    if (r.teachingItems) {
      totalTeachingSessions += r.teachingItems.length;
      r.teachingItems.forEach(ti => {
        totalStudentsTaught += ti.studentCount || 0;
      });
    }
  });

  const exportWorkReportsCSV = () => {
    const headers = ['Report ID', 'Branch', 'Date', 'Staff Name', 'Job Type', 'Calls', 'Follow Up', 'Enquiry', 'Admission', 'Total Teaching Done', 'Teaching Details', 'Remarks'];
    const rows = workReports.map(r => {
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

    downloadCSV(
      `csk-staff-reports-${selectedBranch}-${selectedMonth || selectedDate || 'all'}.csv`,
      headers,
      rows
    );
  };

  const exportManagerReportsCSV = () => {
    const headers = ['Report ID', 'Branch', 'Date', 'Manager Name', 'Enquiries', 'Admissions', 'Fees Pending (Rs)', 'Pending Breakdown', 'Total Students', 'Absent Students', 'Absent Staff', 'Notes'];
    const rows = managerReports.map(r => {
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

    downloadCSV(
      `csk-manager-reports-${selectedBranch}-${selectedMonth || selectedDate || 'all'}.csv`,
      headers,
      rows
    );
  };

  const exportStaffAttendanceCSV = () => {
    const headers = [
      'Attendance ID',
      'Date',
      'Branch / Campus',
      'Full Name',
      'Role',
      'Staff / Manager ID',
      'Phone Number',
      'Shift Login Time',
      'Shift Logout Time',
      'Total Hours / Shift Log',
      'Attendance Status',
      'Permission Details'
    ];
    const rows = staffAttendance.map(a => {
      const u = dbService.getUserById(a.staffId);
      const b = BRANCHES.find(br => br.id === (a.branchId || u?.branchId));
      const isManager = u?.role === 'manager' || a.staffName.toLowerCase().includes('manager');
      const roleText = isManager ? 'Branch Manager' : (u?.designation || 'Staff / Faculty');
      const permText = a.hasPermission || a.permissionReason ? `Permission: ${a.permissionReason} (${a.permissionHours || 1.5} hrs)` : 'None';

      return [
        a.id,
        a.date,
        b?.fullName || 'CSK Academy',
        a.staffName,
        roleText,
        u?.staffId || u?.managerId || a.staffId,
        u?.phone || 'N/A',
        a.loginTime || '--:--',
        a.logoutTime || '--:--',
        a.totalHours || (a.status === 'present' ? 'Shift Active / Present' : 'Absent'),
        a.status === 'present' ? 'Present' : (a.status || 'Present'),
        permText
      ];
    });

    downloadCSV(
      `csk-staff-and-manager-attendance-${selectedBranch}-${selectedMonth || selectedDate || 'all'}.csv`,
      headers,
      rows
    );
  };

  const exportStudentAttendanceCSV = () => {
    const headers = ['Record ID', 'Branch', 'Date', 'Student Name', 'Course Name', 'In Time', 'Out Time', 'Topic Covered', 'Status', 'Remarks'];
    const rows = studentAttendance.map(a => {
      const b = BRANCHES.find(br => br.id === a.branchId);
      return [
        a.id,
        b?.fullName || 'Salem',
        a.date,
        a.studentName,
        a.courseName,
        a.inTime,
        a.outTime,
        a.topicCovered,
        a.present ? 'Present' : 'Absent',
        a.remarks || ''
      ];
    });

    downloadCSV(
      `csk-student-attendance-${selectedBranch}-${selectedDate || 'all'}.csv`,
      headers,
      rows
    );
  };

  return (
    <div className="space-y-5">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Section switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
            <button
              onClick={() => setReportSection('work_reports')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                reportSection === 'work_reports' 
                  ? 'bg-white text-blue-700 shadow-xs font-bold' 
                  : 'text-slate-600'
              }`}
            >
              Staff Daily Reports ({workReports.length})
            </button>
            <button
              onClick={() => setReportSection('manager_reports')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                reportSection === 'manager_reports' 
                  ? 'bg-white text-amber-800 shadow-xs font-bold' 
                  : 'text-slate-600'
              }`}
            >
              Manager Daily Reports ({managerReports.length})
            </button>
            <button
              onClick={() => setReportSection('staff_attendance')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                reportSection === 'staff_attendance' 
                  ? 'bg-white text-emerald-800 shadow-xs font-bold' 
                  : 'text-slate-600'
              }`}
            >
              Staff & Manager Attendance ({staffAttendance.length})
            </button>
            <button
              onClick={() => setReportSection('student_attendance')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                reportSection === 'student_attendance' 
                  ? 'bg-white text-blue-700 shadow-xs font-bold' 
                  : 'text-slate-600'
              }`}
            >
              Student Attendance Logs ({studentAttendance.length})
            </button>
            <button
              onClick={() => setReportSection('leaves_permissions')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                reportSection === 'leaves_permissions' 
                  ? 'bg-white text-purple-700 shadow-xs font-bold' 
                  : 'text-slate-600'
              }`}
            >
              Leaves & Permissions
            </button>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value as any)}
              className="bg-transparent outline-hidden font-semibold text-slate-800"
            >
              <option value="all">All 4 Salem Branches</option>
              {BRANCHES.map(b => (
                <option key={b.id} value={b.id}>{b.name} - {b.location}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-slate-500 font-medium">Month:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent outline-hidden font-bold text-slate-800"
            >
              <option value="all">All Months</option>
              <option value="2026-11">November 2026</option>
              <option value="2026-10">October 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent outline-hidden text-slate-800 font-semibold"
            />
            {selectedDate && (
              <button 
                onClick={() => setSelectedDate('')}
                className="text-[10px] text-slate-400 hover:text-slate-700 font-bold ml-1"
                title="Clear date filter"
              >
                Clear
              </button>
            )}
          </div>

          {/* Staff filter */}
          {reportSection === 'work_reports' && (
            <select
              value={selectedStaffId}
              onChange={e => setSelectedStaffId(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 outline-hidden font-medium"
            >
              <option value="all">All Staff ({staffList.length})</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.jobRole})</option>
              ))}
            </select>
          )}
        </div>

        {/* Export CSV button */}
        {reportSection !== 'leaves_permissions' && (
          <button
            onClick={
              reportSection === 'work_reports' 
                ? exportWorkReportsCSV 
                : reportSection === 'manager_reports' 
                  ? exportManagerReportsCSV 
                  : reportSection === 'staff_attendance'
                    ? exportStaffAttendanceCSV
                    : exportStudentAttendanceCSV
            }
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all shrink-0 self-end lg:self-auto cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              {reportSection === 'work_reports'
                ? 'Export Staff Reports CSV'
                : reportSection === 'manager_reports'
                  ? 'Export Manager Reports CSV'
                  : reportSection === 'staff_attendance'
                    ? 'Export Staff & Manager Attendance CSV'
                    : 'Export Student Attendance CSV'}
            </span>
          </button>
        )}
      </div>

      {/* Aggregate KPI ribbon for the selected filter */}
      {reportSection === 'work_reports' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Calls</p>
            <p className="text-xl font-extrabold text-blue-600 mt-0.5">{totalCalls}</p>
            <span className="text-[10px] text-slate-500">Telecalling</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
            <p className="text-[10px] uppercase font-bold text-slate-400">Follow-ups</p>
            <p className="text-xl font-extrabold text-amber-600 mt-0.5">{totalFollowUp}</p>
            <span className="text-[10px] text-slate-500">Scheduled</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
            <p className="text-[10px] uppercase font-bold text-slate-400">Enquiries</p>
            <p className="text-xl font-extrabold text-purple-600 mt-0.5">{totalEnquiries}</p>
            <span className="text-[10px] text-slate-500">Fresh Leads</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
            <p className="text-[10px] uppercase font-bold text-slate-400">Admissions</p>
            <p className="text-xl font-extrabold text-emerald-600 mt-0.5">{totalAdmissions}</p>
            <span className="text-[10px] text-slate-500">Enrolled Today</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
            <p className="text-[10px] uppercase font-bold text-slate-400">Classes Taught</p>
            <p className="text-xl font-extrabold text-indigo-600 mt-0.5">{totalTeachingSessions}</p>
            <span className="text-[10px] text-slate-500">Sessions</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
            <p className="text-[10px] uppercase font-bold text-slate-400">Students Attended</p>
            <p className="text-xl font-extrabold text-teal-600 mt-0.5">{totalStudentsTaught}</p>
            <span className="text-[10px] text-slate-500">In Class Lab</span>
          </div>
        </div>
      )}

      {/* Main List Table */}
      {reportSection === 'leaves_permissions' ? (
        <LeavesPermissionsManager viewerRole="admin" />
      ) : (
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
        {reportSection === 'work_reports' ? (
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Staff Daily Reports ({workReports.length} records)
              </h3>
              <span className="text-xs text-slate-400 font-semibold">{selectedDate || 'All Dates'}</span>
            </div>

            {workReports.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">No reports match the selected branch and date filter.</p>
            ) : (
              <div className="space-y-3">
                {workReports.map(report => {
                  const rBranch = BRANCHES.find(b => b.id === report.branchId);

                  return (
                    <div key={report.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                            {report.staffName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 text-sm">{report.staffName}</p>
                              {rBranch && (
                                <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                                  {rBranch.name} ({rBranch.location})
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500">{report.date}</p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 self-start sm:self-auto">
                          {report.reportType}
                        </span>
                      </div>

                      {/* Telecalling Box */}
                      {report.telecalling && (
                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-2">
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Telecalling Performance</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            <div className="bg-blue-50/50 p-2 rounded-lg">
                              <p className="text-[10px] text-slate-400">Calls</p>
                              <p className="text-base font-bold text-blue-700">{report.telecalling.todayCalls}</p>
                            </div>
                            <div className="bg-amber-50/50 p-2 rounded-lg">
                              <p className="text-[10px] text-slate-400">Follow-up</p>
                              <p className="text-base font-bold text-amber-700">{report.telecalling.todayFollowUp}</p>
                            </div>
                            <div className="bg-purple-50/50 p-2 rounded-lg">
                              <p className="text-[10px] text-slate-400">Enquiry</p>
                              <p className="text-base font-bold text-purple-700">{report.telecalling.todayEnquiry}</p>
                            </div>
                            <div className="bg-emerald-50/50 p-2 rounded-lg">
                              <p className="text-[10px] text-slate-400">Admission</p>
                              <p className="text-base font-bold text-emerald-700">{report.telecalling.todayAdmission}</p>
                            </div>
                          </div>
                          {report.telecalling.notes && (
                            <p className="text-[11px] text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg">
                              <span className="font-semibold text-slate-700">Notes:</span> {report.telecalling.notes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Total Teaching Done Summary */}
                      {report.totalTeachingSummary && (
                        <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs flex items-center justify-between">
                          <span className="font-extrabold text-emerald-950 text-xs">Total Teaching Done on that day:</span>
                          <span className="font-mono font-bold text-xs bg-white text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                            {report.totalTeachingSummary}
                          </span>
                        </div>
                      )}

                      {/* Teaching Classes Box */}
                      {report.teachingItems && (
                        <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Classes Taught ({report.teachingItems.length})</span>
                          </div>
                          {report.teachingItems.map((item, idx) => (
                            <div key={idx} className="p-2.5 bg-emerald-50/40 border border-emerald-100 rounded-xl text-xs space-y-1">
                              <div className="flex justify-between items-center font-bold text-emerald-900">
                                <span>{item.courseName}</span>
                                <span className="text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                  {item.studentCount} Students
                                </span>
                              </div>
                              {item.topicCovered && (
                                <p className="text-[11px] text-slate-700">
                                  <span className="font-semibold text-slate-800">Topic:</span> {item.topicCovered}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {report.overallRemarks && (
                        <p className="text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">Remarks:</span> {report.overallRemarks}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : reportSection === 'manager_reports' ? (
          /* Manager Daily Reports Table */
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Manager Daily Reports ({managerReports.length} records)
              </h3>
              <span className="text-xs text-slate-400 font-semibold">{selectedMonth !== 'all' ? selectedMonth : (selectedDate || 'All Dates')}</span>
            </div>

            {managerReports.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">No manager reports match the selected branch and month filter.</p>
            ) : (
              <div className="space-y-3">
                {managerReports.map(rep => {
                  const b = BRANCHES.find(br => br.id === rep.branchId);

                  return (
                    <div key={rep.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{rep.date}</span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            {b?.name} ({b?.location})
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          Manager: <strong className="text-slate-800">{rep.managerName}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                          <p className="text-[10px] text-blue-600 font-semibold">Total Students</p>
                          <p className="text-base font-black text-blue-800">{rep.totalStudentsInBranch}</p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-semibold">Enquiries</p>
                          <p className="text-base font-black text-amber-600">{rep.noOfEnquiry}</p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-semibold">Admissions</p>
                          <p className="text-base font-black text-emerald-600">{rep.noOfAdmission}</p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-semibold">Pending Fees</p>
                          <p className="text-sm font-black text-rose-600 font-mono">₹{rep.feesPendingAmount.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-semibold">Absent (Stu/Stf)</p>
                          <p className="text-sm font-bold text-slate-700">{rep.noOfAbsentStudents} / {rep.noOfAbsentStaff || 0}</p>
                        </div>
                      </div>

                      {rep.feesPendingDetails && (
                        <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-xs">
                          <span className="font-bold text-slate-800">Fees Pending Details:</span>
                          <p className="text-[11px] text-slate-600 mt-0.5">{rep.feesPendingDetails}</p>
                        </div>
                      )}

                      {rep.notes && (
                        <p className="text-[11px] text-slate-600 italic">
                          <strong className="not-italic text-slate-700 font-semibold">Manager Remarks:</strong> {rep.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : reportSection === 'staff_attendance' ? (
          /* Staff & Manager Shift Attendance Table */
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Staff & Manager Shift Attendance ({staffAttendance.length} records)
                </h3>
                <p className="text-xs text-slate-500">
                  Daily shift punch logs for all branch managers and teaching/telecalling staff
                </p>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{selectedMonth !== 'all' ? selectedMonth : (selectedDate || 'All Dates')}</span>
            </div>

            {staffAttendance.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">No staff or manager shift attendance logs for this branch and date.</p>
            ) : (
              <div className="space-y-3">
                {staffAttendance.map(att => {
                  const u = dbService.getUserById(att.staffId);
                  const sBranch = BRANCHES.find(b => b.id === (att.branchId || u?.branchId));
                  const isManager = u?.role === 'manager' || att.staffName.toLowerCase().includes('manager');

                  return (
                    <div key={att.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-sm">{att.staffName}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isManager ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-blue-100 text-blue-900 border border-blue-200'
                          }`}>
                            {isManager ? 'Branch Manager' : (u?.designation || 'Staff Faculty')}
                          </span>
                          {sBranch && (
                            <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                              {sBranch.name} ({sBranch.location})
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">• {att.date}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span className="font-mono">ID: {u?.staffId || u?.managerId || att.staffId}</span>
                          {u?.phone && <span>Phone: <strong className="text-slate-700 font-mono">{u.phone}</strong></span>}
                          {u?.email && <span>Email: <strong className="text-slate-700">{u.email}</strong></span>}
                        </div>

                        {(att.hasPermission || att.permissionReason) && (
                          <div className="mt-1 p-2 bg-purple-50 border border-purple-200/80 rounded-xl text-[11px] text-purple-900">
                            <strong>🎫 Permission Taken:</strong> {att.permissionReason} ({att.permissionHours || 1.5} hrs)
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 sm:text-right shrink-0">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-xs space-y-0.5">
                          <div className="flex sm:justify-end gap-2">
                            <span className="text-slate-400">Shift In:</span>
                            <span className="font-bold text-slate-800">{att.loginTime || '--:--'}</span>
                          </div>
                          <div className="flex sm:justify-end gap-2">
                            <span className="text-slate-400">Shift Out:</span>
                            <span className="font-bold text-slate-800">{att.logoutTime || '--:--'}</span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border shrink-0 ${
                          att.logoutTime 
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {att.logoutTime ? 'Shift Completed' : 'Shift Active / Present'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Student Attendance Table */
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Student Attendance Logs ({studentAttendance.length} records)
              </h3>
              <span className="text-xs text-slate-400 font-semibold">{selectedDate || 'All Dates'}</span>
            </div>

            {studentAttendance.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">No student attendance logs for this branch and date.</p>
            ) : (
              <div className="space-y-2.5">
                {studentAttendance.map(att => {
                  const sBranch = BRANCHES.find(b => b.id === att.branchId);

                  return (
                    <div key={att.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{att.studentName}</span>
                          {sBranch && (
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                              {sBranch.name} ({sBranch.location})
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500">• {att.date}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            att.present ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {att.present ? 'Present' : 'Absent'}
                          </span>
                        </div>
                        <p className="text-blue-700 font-semibold">{att.courseName}</p>
                        <p className="text-slate-600">
                          <span className="font-medium text-slate-800">Topic Covered:</span> {att.topicCovered}
                        </p>
                        {att.remarks && <p className="text-[10px] text-slate-400">{att.remarks}</p>}
                      </div>

                      <div className="text-left sm:text-right shrink-0 font-mono text-[11px] bg-white sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-slate-200">
                        <p>In: <span className="font-bold text-slate-800">{att.inTime}</span></p>
                        <p>Out: <span className="font-bold text-slate-800">{att.outTime}</span></p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
};
