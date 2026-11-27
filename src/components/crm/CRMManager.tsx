import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Phone, 
  Plus, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  ArrowRight, 
  UserCheck, 
  GraduationCap, 
  TrendingUp, 
  Flame, 
  Zap, 
  Snowflake,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  Send,
  Building,
  Tag
} from 'lucide-react';
import { dbService, getTodayDate, getCurrentTime } from '../../services/db';
import type { 
  Lead, 
  LeadStatus, 
  LeadSource, 
  LeadPriority, 
  BranchId, 
  Course, 
  PaymentMode 
} from '../../types';

interface CRMManagerProps {
  viewerRole: 'admin' | 'manager' | 'staff';
  currentBranchId?: BranchId;
  currentUserId?: string;
  currentUserName?: string;
}

export const CRMManager: React.FC<CRMManagerProps> = ({
  viewerRole,
  currentBranchId,
  currentUserId,
  currentUserName
}) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<BranchId | 'all'>(
    viewerRole === 'admin' ? 'all' : (currentBranchId || 'all')
  );
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<LeadPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);

  // Add / Edit Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBranch, setFormBranch] = useState<BranchId>(currentBranchId || 'dadagapatty');
  const [formCourseId, setFormCourseId] = useState('');
  const [formSource, setFormSource] = useState<LeadSource>('phone_enquiry');
  const [formPriority, setFormPriority] = useState<LeadPriority>('hot');
  const [formStatus, setFormStatus] = useState<LeadStatus>('new');
  const [formNextDate, setFormNextDate] = useState(getTodayDate());
  const [formNextTime, setFormNextTime] = useState('11:00 AM');
  const [formNotes, setFormNotes] = useState('');

  // Follow-up Form State
  const [fupRemarks, setFupRemarks] = useState('');
  const [fupNextDate, setFupNextDate] = useState(getTodayDate());
  const [fupNextTime, setFupNextTime] = useState('11:30 AM');
  const [fupNewStatus, setFupNewStatus] = useState<LeadStatus>('follow_up');

  // Convert to Admission Form State
  const [convertCourseId, setConvertCourseId] = useState('');
  const [convertBatchTiming, setConvertBatchTiming] = useState('10:00 AM - 12:00 PM');
  const [convertTotalFees, setConvertTotalFees] = useState(25000);
  const [convertPaidFees, setConvertPaidFees] = useState(10000);
  const [convertPaymentMode, setConvertPaymentMode] = useState<PaymentMode>('upi');

  const [notification, setNotification] = useState<string | null>(null);

  const branches = dbService.getBranches();
  const courses = dbService.getCourses();

  const loadData = () => {
    const list = dbService.getLeads(selectedBranch, selectedStatus, searchQuery, selectedPriority);
    setLeads(list);
  };

  useEffect(() => {
    loadData();
    const handleDbChange = () => loadData();
    window.addEventListener('educenter-db-change', handleDbChange);
    return () => window.removeEventListener('educenter-db-change', handleDbChange);
  }, [selectedBranch, selectedStatus, selectedPriority, searchQuery]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Stats calculation
  const today = getTodayDate();
  const allLeads = dbService.getLeads(selectedBranch);
  const todayFollowUps = allLeads.filter(l => l.status !== 'enrolled' && l.status !== 'lost' && l.nextFollowUpDate === today);
  const overdueFollowUps = allLeads.filter(l => l.status !== 'enrolled' && l.status !== 'lost' && l.nextFollowUpDate && l.nextFollowUpDate < today);
  const enrolledCount = allLeads.filter(l => l.status === 'enrolled').length;

  // Handlers
  const handleOpenAddModal = (lead?: Lead) => {
    if (lead) {
      setEditingLead(lead);
      setFormName(lead.name);
      setFormPhone(lead.phone);
      setFormEmail(lead.email || '');
      setFormBranch(lead.branchId);
      setFormCourseId(lead.courseId || '');
      setFormSource(lead.source);
      setFormPriority(lead.priority);
      setFormStatus(lead.status);
      setFormNextDate(lead.nextFollowUpDate || getTodayDate());
      setFormNextTime(lead.nextFollowUpTime || '11:00 AM');
      setFormNotes(lead.notes);
    } else {
      setEditingLead(null);
      setFormName('');
      setFormPhone('');
      setFormEmail('');
      setFormBranch(currentBranchId || 'dadagapatty');
      setFormCourseId(courses[0]?.id || '');
      setFormSource('phone_enquiry');
      setFormPriority('hot');
      setFormStatus('new');
      setFormNextDate(getTodayDate());
      setFormNextTime('11:00 AM');
      setFormNotes('');
    }
    setShowAddModal(true);
  };

  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      alert('Please fill candidate name and mobile number.');
      return;
    }

    const selectedCrs = courses.find(c => c.id === formCourseId);

    if (editingLead) {
      dbService.updateLead(editingLead.id, {
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        branchId: formBranch,
        courseId: formCourseId || undefined,
        courseName: selectedCrs?.name || undefined,
        source: formSource,
        priority: formPriority,
        status: formStatus,
        nextFollowUpDate: formNextDate,
        nextFollowUpTime: formNextTime,
        notes: formNotes.trim()
      });
      showToast(`Updated lead: ${formName}`);
    } else {
      dbService.addLead({
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        branchId: formBranch,
        courseId: formCourseId || undefined,
        courseName: selectedCrs?.name || undefined,
        source: formSource,
        priority: formPriority,
        status: formStatus,
        assignedToStaffId: currentUserId,
        assignedToStaffName: currentUserName || 'Academic Counselor',
        nextFollowUpDate: formNextDate,
        nextFollowUpTime: formNextTime,
        notes: formNotes.trim()
      });
      showToast(`Added new inquiry: ${formName}`);
    }
    setShowAddModal(false);
    loadData();
  };

  const handleDeleteLead = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete lead "${name}"?`)) {
      dbService.deleteLead(id);
      showToast(`Deleted lead "${name}".`);
      loadData();
    }
  };

  const handleOpenFollowUp = (lead: Lead) => {
    setFollowUpLead(lead);
    setFupRemarks('');
    setFupNextDate(getTodayDate());
    setFupNextTime('11:30 AM');
    setFupNewStatus(lead.status === 'new' ? 'contacted' : lead.status);
  };

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpLead || !fupRemarks.trim()) {
      alert('Please enter follow-up conversation notes.');
      return;
    }

    dbService.addLeadFollowUp(
      followUpLead.id,
      {
        date: getTodayDate(),
        time: getCurrentTime(),
        remarks: fupRemarks.trim(),
        counselorName: currentUserName || 'Academic Counselor',
        status: 'completed'
      },
      fupNextDate,
      fupNextTime,
      fupNewStatus
    );

    showToast(`Logged follow-up for ${followUpLead.name}! Next reminder: ${fupNextDate}`);
    setFollowUpLead(null);
    loadData();
  };

  const handleOpenConvert = (lead: Lead) => {
    setConvertingLead(lead);
    const crs = courses.find(c => c.id === lead.courseId) || courses[0];
    setConvertCourseId(crs?.id || '');
    setConvertTotalFees(crs?.fee || 25000);
    setConvertPaidFees(Math.round((crs?.fee || 25000) * 0.5));
    setConvertBatchTiming('10:00 AM - 12:00 PM');
    setConvertPaymentMode('upi');
  };

  const handleConfirmConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLead) return;

    const res = dbService.convertLeadToStudent(convertingLead.id, {
      courseId: convertCourseId,
      batchTiming: convertBatchTiming,
      totalFees: Number(convertTotalFees),
      paidFees: Number(convertPaidFees),
      paymentMode: convertPaymentMode,
      collectedBy: currentUserName || 'Center Manager'
    });

    if (res) {
      showToast(`🎉 Congratulations! ${convertingLead.name} enrolled as Student (${res.student.studentId})!`);
      setConvertingLead(null);
      loadData();
    }
  };

  const openWhatsApp = (phone: string, leadName: string, courseName?: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(
      `Hello ${leadName}! Greetings from CSK Academy & InfoSpark Innovation Pvt Ltd (Salem). This is regarding your recent inquiry for ${courseName || 'our professional training programs'}. How can we assist you with batch timings and curriculum details today?`
    );
    window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank');
  };

  const getPriorityBadge = (p: LeadPriority) => {
    switch (p) {
      case 'hot':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200"><Flame className="w-3 h-3 text-rose-600 fill-rose-500" /> Hot</span>;
      case 'warm':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200"><Zap className="w-3 h-3 text-amber-600" /> Warm</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"><Snowflake className="w-3 h-3 text-blue-500" /> Cold</span>;
    }
  };

  const getStatusBadge = (st: LeadStatus) => {
    switch (st) {
      case 'enrolled':
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Enrolled</span>;
      case 'counseling':
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">Counseling</span>;
      case 'follow_up':
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">Follow-up</span>;
      case 'contacted':
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">Contacted</span>;
      case 'lost':
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">Dropped</span>;
      default:
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">New Lead</span>;
    }
  };

  // Pipeline stages for Board View
  const STAGES: { key: LeadStatus; label: string; color: string }[] = [
    { key: 'new', label: 'New Inquiries', color: 'border-amber-400 bg-amber-50/50' },
    { key: 'contacted', label: 'Contacted', color: 'border-cyan-400 bg-cyan-50/50' },
    { key: 'counseling', label: 'In Counseling / Demo', color: 'border-purple-400 bg-purple-50/50' },
    { key: 'follow_up', label: 'Follow-up Scheduled', color: 'border-blue-400 bg-blue-50/50' },
    { key: 'enrolled', label: 'Enrolled Admissions', color: 'border-emerald-400 bg-emerald-50/50' }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 font-extrabold text-[10px] tracking-wide uppercase border border-blue-400/30">
              Admission CRM & Telecalling
            </span>
            <span className="text-xs text-blue-200/80">• Salem Multi-Campus</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Candidate Leads & Follow-up Reminders</h2>
          <p className="text-xs text-blue-200/80 mt-1">
            Capture inquiries, set automated callback alerts, send WhatsApp brochures, and convert leads into admissions with 1-click.
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="self-start md:self-auto py-3 px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Lead / Inquiry
        </button>
      </div>

      {/* Live Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Inquiries</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600"><Users className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-slate-900">{allLeads.length}</div>
          <p className="text-[10px] text-slate-400 mt-1">Total inquiries across campuses</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Due Today</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700"><Calendar className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-amber-600">{todayFollowUps.length}</div>
          <p className="text-[10px] text-amber-700 font-semibold mt-1">Calls & follow-ups scheduled today</p>
          {todayFollowUps.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
        </div>

        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Overdue Alerts</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700"><AlertCircle className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-rose-600">{overdueFollowUps.length}</div>
          <p className="text-[10px] text-rose-600 font-semibold mt-1">Pending callback past due date</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Admissions Converted</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700"><GraduationCap className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{enrolledCount}</div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">Converted into active students</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
          {/* Branch filter for admin */}
          {viewerRole === 'admin' && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value as BranchId | 'all')}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden"
              >
                <option value="all">All Salem Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as LeadStatus | 'all')}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="new">New Inquiries</option>
              <option value="contacted">Contacted</option>
              <option value="counseling">In Counseling / Demo</option>
              <option value="follow_up">Follow-up Required</option>
              <option value="enrolled">Enrolled</option>
              <option value="lost">Dropped</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as LeadPriority | 'all')}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden"
            >
              <option value="all">All Priorities</option>
              <option value="hot">🔥 Hot Leads</option>
              <option value="warm">⚡ Warm Leads</option>
              <option value="cold">❄️ Cold Leads</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name, phone or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setViewMode('board')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              viewMode === 'board' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pipeline Board
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              viewMode === 'list' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Table View
          </button>
        </div>
      </div>

      {/* PIPELINE BOARD VIEW */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.status === stage.key);
            return (
              <div 
                key={stage.key}
                className={`p-3.5 rounded-3xl border-2 ${stage.color} flex flex-col min-w-[280px] max-h-[750px] shadow-xs`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                  <span className="font-extrabold text-slate-800 text-xs tracking-tight">{stage.label}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white font-mono font-black text-xs text-slate-700 shadow-xs">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {stageLeads.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium">
                      No leads in this stage
                    </div>
                  ) : (
                    stageLeads.map(lead => {
                      const isOverdue = lead.status !== 'enrolled' && lead.nextFollowUpDate && lead.nextFollowUpDate < today;
                      const isDueToday = lead.nextFollowUpDate === today;

                      return (
                        <div 
                          key={lead.id}
                          className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2.5 text-xs"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h4 className="font-black text-slate-900 text-sm leading-tight">{lead.name}</h4>
                              <p className="text-[11px] font-semibold text-blue-700 mt-0.5">{lead.courseName || 'General Inquiry'}</p>
                            </div>
                            {getPriorityBadge(lead.priority)}
                          </div>

                          <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="font-mono font-bold text-slate-800">{lead.phone}</span>
                          </div>

                          {/* Reminder Badge */}
                          {lead.nextFollowUpDate && lead.status !== 'enrolled' && (
                            <div className={`p-2 rounded-xl text-[10px] font-bold flex items-center justify-between ${
                              isOverdue 
                                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                : isDueToday 
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                                  : 'bg-slate-50 text-slate-600'
                            }`}>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {isOverdue ? 'Overdue Reminder' : isDueToday ? 'Today Reminder' : 'Next Call'}
                              </span>
                              <span>{lead.nextFollowUpDate} {lead.nextFollowUpTime}</span>
                            </div>
                          )}

                          {lead.notes && (
                            <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                              {lead.notes}
                            </p>
                          )}

                          {/* Card Actions */}
                          <div className="pt-1 flex items-center justify-between border-t border-slate-100 gap-1 flex-wrap">
                            <div className="flex items-center gap-1">
                              {/* 1-Click WhatsApp Button */}
                              <button
                                onClick={() => openWhatsApp(lead.phone, lead.name, lead.courseName)}
                                title="Send WhatsApp Message"
                                className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              {/* Call Phone Button */}
                              <a
                                href={`tel:${lead.phone}`}
                                title="Call candidate"
                                className="p-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>

                              {/* Log Follow-up */}
                              <button
                                onClick={() => handleOpenFollowUp(lead)}
                                title="Record Call & Follow-up Note"
                                className="p-1.5 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              {lead.status !== 'enrolled' ? (
                                <button
                                  onClick={() => handleOpenConvert(lead)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-[10px] flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                                >
                                  <GraduationCap className="w-3 h-3" /> Enroll
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3" /> Enrolled
                                </span>
                              )}

                              <button
                                onClick={() => handleOpenAddModal(lead)}
                                className="p-1 text-slate-400 hover:text-slate-600"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE / LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Target Course</th>
                  <th className="py-3 px-4">Campus Branch</th>
                  <th className="py-3 px-4">Priority & Status</th>
                  <th className="py-3 px-4">Next Reminder</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No leads found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  leads.map(lead => {
                    const isOverdue = lead.status !== 'enrolled' && lead.nextFollowUpDate && lead.nextFollowUpDate < today;
                    const isDueToday = lead.nextFollowUpDate === today;
                    const branch = branches.find(b => b.id === lead.branchId);

                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900">{lead.name}</div>
                          <div className="text-[10px] text-slate-400">Source: {lead.source.replace('_', ' ')}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {lead.phone}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {lead.courseName || 'Certificate Course'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                            {branch ? branch.shortCode : lead.branchId}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {getPriorityBadge(lead.priority)}
                            {getStatusBadge(lead.status)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {lead.nextFollowUpDate ? (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isOverdue ? 'bg-rose-100 text-rose-800' : isDueToday ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {lead.nextFollowUpDate} {lead.nextFollowUpTime}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openWhatsApp(lead.phone, lead.name, lead.courseName)}
                              title="Send WhatsApp"
                              className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenFollowUp(lead)}
                              title="Add Follow-up Note"
                              className="p-1.5 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </button>
                            {lead.status !== 'enrolled' && (
                              <button
                                onClick={() => handleOpenConvert(lead)}
                                className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-[10px]"
                              >
                                Enroll
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenAddModal(lead)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLead(lead.id, lead.name)}
                              className="p-1 text-rose-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT LEAD */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {editingLead ? 'Edit Lead / Inquiry' : 'Add New Candidate Inquiry'}
                  </h3>
                  <p className="text-xs text-slate-400">Capture lead details & schedule reminder</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Candidate Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Karthik Raja"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone (10-digit) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9842155601"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Campus Branch</label>
                  <select
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value as BranchId)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-blue-500"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Course</label>
                  <select
                    value={formCourseId}
                    onChange={(e) => setFormCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="">General Inquiry / Undecided</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value as LeadSource)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="walk_in">Walk-in</option>
                    <option value="phone_enquiry">Phone Call</option>
                    <option value="instagram_meta">Instagram / Meta</option>
                    <option value="website">Website</option>
                    <option value="referral">Friend Referral</option>
                    <option value="pamphlet_camp">College Camp</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as LeadPriority)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="hot">🔥 Hot Lead</option>
                    <option value="warm">⚡ Warm Lead</option>
                    <option value="cold">❄️ Cold Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as LeadStatus)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="counseling">Counseling</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="enrolled">Enrolled</option>
                    <option value="lost">Dropped</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                <div>
                  <label className="block font-bold text-blue-900 mb-1">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={formNextDate}
                    onChange={(e) => setFormNextDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl font-bold text-blue-950 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-blue-900 mb-1">Reminder Time</label>
                  <input
                    type="text"
                    value={formNextTime}
                    onChange={(e) => setFormNextTime(e.target.value)}
                    placeholder="e.g. 11:30 AM"
                    className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl font-bold text-blue-950 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Inquiries & Notes</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Student seeking weekend Python batch with placement guarantee..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
                >
                  {editingLead ? 'Save Changes' : 'Create Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG FOLLOW-UP NOTE */}
      {followUpLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase">Telecalling Log</span>
                <h3 className="font-black text-slate-900 text-base">Call Notes: {followUpLead.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{followUpLead.phone}</p>
              </div>
              <button 
                onClick={() => setFollowUpLead(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFollowUp} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Conversation Remarks *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Candidate attended counseling. Agreed to join this Saturday. Follow up tomorrow for fees."
                  value={fupRemarks}
                  onChange={(e) => setFupRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-purple-50/50 p-3 rounded-2xl border border-purple-100">
                <div>
                  <label className="block font-bold text-purple-900 mb-1">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={fupNextDate}
                    onChange={(e) => setFupNextDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl font-bold text-purple-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-purple-900 mb-1">Next Time</label>
                  <input
                    type="text"
                    value={fupNextTime}
                    onChange={(e) => setFupNextTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl font-bold text-purple-950"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Update Status</label>
                <select
                  value={fupNewStatus}
                  onChange={(e) => setFupNewStatus(e.target.value as LeadStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="contacted">Contacted</option>
                  <option value="counseling">In Counseling / Demo</option>
                  <option value="follow_up">Follow-up Required</option>
                  <option value="lost">Lost / Not Interested</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFollowUpLead(null)}
                  className="py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black shadow-md shadow-purple-500/20 active:scale-95 cursor-pointer"
                >
                  Save Call Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONVERT LEAD TO ADMISSION */}
      {convertingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Convert to Student Admission</h3>
                  <p className="text-xs text-slate-400">Generate student profile & installment schedule</p>
                </div>
              </div>
              <button 
                onClick={() => setConvertingLead(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs">
              <p className="font-extrabold text-emerald-950 text-sm">{convertingLead.name}</p>
              <p className="text-emerald-800 font-mono mt-0.5">{convertingLead.phone} • {convertingLead.email || 'No email'}</p>
            </div>

            <form onSubmit={handleConfirmConvert} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Selected Course Program</label>
                <select
                  value={convertCourseId}
                  onChange={(e) => {
                    setConvertCourseId(e.target.value);
                    const crs = courses.find(c => c.id === e.target.value);
                    if (crs) {
                      setConvertTotalFees(crs.fee);
                      setConvertPaidFees(Math.round(crs.fee * 0.5));
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (₹{c.fee.toLocaleString('en-IN')})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Batch Timing Slot</label>
                <input
                  type="text"
                  value={convertBatchTiming}
                  onChange={(e) => setConvertBatchTiming(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Agreed Fees (₹)</label>
                  <input
                    type="number"
                    value={convertTotalFees}
                    onChange={(e) => setConvertTotalFees(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Paid Amount (₹)</label>
                  <input
                    type="number"
                    value={convertPaidFees}
                    onChange={(e) => setConvertPaidFees(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">Pending Installment Balance:</span>
                <span className="text-sm font-extrabold text-rose-600">
                  ₹{Math.max(0, convertTotalFees - convertPaidFees).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Payment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConvertPaymentMode('upi')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      convertPaymentMode === 'upi' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    UPI Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setConvertPaymentMode('cash')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      convertPaymentMode === 'cash' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Cash Collection
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConvertingLead(null)}
                  className="py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
                >
                  Confirm & Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
