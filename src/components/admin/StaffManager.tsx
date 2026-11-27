import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Phone, 
  Mail, 
  Award, 
  Briefcase, 
  Clock, 
  Calendar, 
  CheckCircle, 
  X, 
  BookOpen, 
  PhoneCall,
  IdCard,
  ChevronRight,
  Building2
} from 'lucide-react';
import { dbService, getTodayDate, BRANCHES } from '../../services/db';
import type { UserProfile, StaffAttendance, DailyWorkReport, BranchId } from '../../types';

export const StaffManager: React.FC<{ initialBranch?: BranchId | 'all' }> = ({ initialBranch = 'all' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teaching' | 'telecalling' | 'both'>('all');
  const [branchFilter, setBranchFilter] = useState<BranchId | 'all'>(initialBranch);
  const [selectedStaff, setSelectedStaff] = useState<UserProfile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dbVersion, setDbVersion] = useState(0);

  // Sync branch filter when parent active branch changes
  useEffect(() => {
    setBranchFilter(initialBranch);
  }, [initialBranch]);

  // Live listener for check-ins, cloud syncs, and staff updates
  useEffect(() => {
    const handleDbChange = () => setDbVersion(v => v + 1);
    window.addEventListener('educenter-db-change', handleDbChange);
    return () => window.removeEventListener('educenter-db-change', handleDbChange);
  }, []);

  // New staff form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'teaching' | 'telecalling' | 'both'>('teaching');
  const [newBranch, setNewBranch] = useState<BranchId>('dadagapatty');
  const [newDesignation, setNewDesignation] = useState('');
  const [newQualification, setNewQualification] = useState('');

  const staffList = dbService.getStaffList(branchFilter);
  const today = getTodayDate();
  // Get all attendance for today so matching by staffId is 100% reliable
  const todayAttendance = dbService.getStaffAttendance(today);
  const allReports = dbService.getWorkReports(undefined, undefined);

  const filteredStaff = staffList.filter(staff => {
    const matchesSearch = 
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.phone.includes(searchQuery) ||
      (staff.staffId && staff.staffId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = 
      roleFilter === 'all' || 
      staff.jobRole === roleFilter || 
      (roleFilter === 'teaching' && staff.jobRole === 'both') ||
      (roleFilter === 'telecalling' && staff.jobRole === 'both');

    return matchesSearch && matchesRole;
  });

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const branchObj = BRANCHES.find(b => b.id === newBranch);
    const newStaff: UserProfile = {
      id: 'usr-staff-' + Date.now(),
      email: newEmail.trim(),
      role: 'staff',
      name: newName.trim(),
      phone: newPhone.trim(),
      staffId: `${branchObj?.shortCode || 'STF'}-${Math.floor(10 + Math.random() * 90)}`,
      jobRole: newRole,
      branchId: newBranch,
      branchName: branchObj?.fullName,
      designation: newDesignation.trim() || 'Staff Faculty',
      qualification: newQualification.trim() || 'Graduate',
      createdAt: getTodayDate()
    };

    dbService.saveUser(newStaff);
    setShowAddModal(false);
    // Reset form
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewDesignation('');
    setNewQualification('');
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar with Branch Filter */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full lg:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name, ID, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Branch filter dropdown */}
        <div className="flex items-center gap-1.5 w-full lg:w-auto">
          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <select
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 outline-hidden focus:ring-2 focus:ring-blue-500 w-full lg:w-auto"
          >
            <option value="all">All 4 Salem Branches</option>
            {BRANCHES.map(b => (
              <option key={b.id} value={b.id}>{b.name} - {b.location}</option>
            ))}
          </select>
        </div>

        {/* Role Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              roleFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Roles ({staffList.length})
          </button>
          <button
            onClick={() => setRoleFilter('teaching')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              roleFilter === 'teaching' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3 h-3 text-emerald-600" /> Teaching
          </button>
          <button
            onClick={() => setRoleFilter('telecalling')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              roleFilter === 'telecalling' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PhoneCall className="w-3 h-3 text-blue-600" /> Telecalling
          </button>
        </div>

        {/* Add Staff Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full lg:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 text-xs">
            No staff found matching the selected branch or role filter.
          </div>
        ) : (
          filteredStaff.map(staff => {
            const att = todayAttendance.find(a => a.staffId === staff.id);
            const reports = allReports.filter(r => r.staffId === staff.id);
            const latestReport = reports[0];
            const staffBranch = BRANCHES.find(b => b.id === staff.branchId);

            return (
              <div
                key={staff.id}
                onClick={() => setSelectedStaff(staff)}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{staff.name}</h4>
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

                  {/* Branch Pill */}
                  <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px]">
                    <Building2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span className="font-bold text-amber-900">{staffBranch?.name}</span>
                    <span className="text-amber-700">• {staffBranch?.location}</span>
                  </div>

                  {/* Details summary */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Staff ID:</span>
                      <span className="font-mono font-semibold text-slate-800">{staff.staffId || 'STF-101'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-mono font-medium text-slate-800">{staff.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[150px]">{staff.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Qualification:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[140px]">{staff.qualification || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Today's Attendance status */}
                  <div className="mt-3 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] text-slate-600">Today:</span>
                    </div>
                    {att ? (
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        In: {att.loginTime} {att.logoutTime ? `| Out: ${att.logoutTime}` : '(Active)'}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-amber-600">
                        Not Checked In
                      </span>
                    )}
                  </div>

                  {/* Latest work report snapshot */}
                  {latestReport?.telecalling && (
                    <div className="mt-2 text-[10px] text-slate-500 bg-blue-50/60 p-2 rounded-xl flex items-center justify-between">
                      <span className="font-semibold text-blue-900">Calls: {latestReport.telecalling.todayCalls}</span>
                      <span>Follow-up: {latestReport.telecalling.todayFollowUp}</span>
                      <span className="text-emerald-700 font-bold">Admn: {latestReport.telecalling.todayAdmission}</span>
                    </div>
                  )}
                  {latestReport?.teachingItems && latestReport.teachingItems.length > 0 && (
                    <div className="mt-2 text-[10px] text-slate-500 bg-emerald-50/60 p-2 rounded-xl">
                      <p className="font-semibold text-emerald-900 truncate">
                        Taught: {latestReport.teachingItems[0]?.topicCovered || 'N/A'}
                      </p>
                      <p className="text-[9px] text-emerald-700">
                        Students: {latestReport.teachingItems[0]?.studentCount || 0} {latestReport.teachingItems[0]?.studentNames && Array.isArray(latestReport.teachingItems[0].studentNames) && latestReport.teachingItems[0].studentNames.length > 0 ? `(${latestReport.teachingItems[0].studentNames.slice(0, 2).join(', ')})` : ''}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold">
                  <span>View Branch Profile & Reports</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Staff Detail Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                  {selectedStaff.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedStaff.name}</h3>
                  <p className="text-xs text-slate-500">{selectedStaff.designation} • ID: {selectedStaff.staffId}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStaff(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1 mt-3 space-y-4">
              {/* Profile info */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs bg-slate-50 p-3 sm:p-3.5 rounded-2xl">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Assigned Campus</p>
                  <p className="font-bold text-blue-800">{selectedStaff.branchName || 'Salem'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Job Role</p>
                  <p className="font-medium text-slate-800 capitalize">{selectedStaff.jobRole}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Email</p>
                  <p className="font-medium text-slate-800 truncate">{selectedStaff.email}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Phone</p>
                  <p className="font-medium text-slate-800">{selectedStaff.phone}</p>
                </div>
              </div>

              {/* Submitted Reports by this staff */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Work Reports Submitted ({allReports.filter(r => r.staffId === selectedStaff.id).length})
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {allReports.filter(r => r.staffId === selectedStaff.id).length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">No reports filed yet.</p>
                  ) : (
                    allReports
                      .filter(r => r.staffId === selectedStaff.id)
                      .map(rep => (
                        <div key={rep.id} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{rep.date}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 capitalize">
                              {rep.reportType}
                            </span>
                          </div>
                          {rep.telecalling && (
                            <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                              Calls: <span className="font-bold text-blue-600">{rep.telecalling.todayCalls}</span> | 
                              Follow-up: <span className="font-bold text-amber-600">{rep.telecalling.todayFollowUp}</span> | 
                              Enquiry: <span className="font-bold text-purple-600">{rep.telecalling.todayEnquiry}</span> | 
                              Admissions: <span className="font-bold text-emerald-600">{rep.telecalling.todayAdmission}</span>
                            </div>
                          )}
                          {rep.teachingItems && rep.teachingItems.map((item, idx) => (
                            <div key={idx} className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                              <p className="font-bold text-emerald-800">{item.courseName}</p>
                              <p>Students ({item.studentCount || 0}): {item.studentNames && Array.isArray(item.studentNames) ? item.studentNames.join(', ') : 'N/A'}</p>
                              <p className="text-slate-500">Topic: {item.topicCovered}</p>
                            </div>
                          ))}
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedStaff(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900 text-base">Add New Staff Member</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="mt-3 space-y-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Salem Branch</label>
                <select
                  value={newBranch}
                  onChange={e => setNewBranch(e.target.value as BranchId)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-white font-semibold text-blue-900"
                >
                  {BRANCHES.map(b => (
                    <option key={b.id} value={b.id}>{b.name} - {b.location}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="staff@cskacademy.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Job Role</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
                >
                  <option value="teaching">Teaching & Project Work</option>
                  <option value="telecalling">Telecalling & Admissions</option>
                  <option value="both">Both (Teaching & Telecalling)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Faculty"
                    value={newDesignation}
                    onChange={e => setNewDesignation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech / MCA"
                    value={newQualification}
                    onChange={e => setNewQualification(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
