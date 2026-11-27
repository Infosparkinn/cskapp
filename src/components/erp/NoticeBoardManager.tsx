import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Calendar, 
  Building, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  X,
  Users
} from 'lucide-react';
import { dbService, getTodayDate } from '../../services/db';
import type { CampusNotice, BranchId } from '../../types';

interface NoticeBoardManagerProps {
  viewerRole: 'admin' | 'manager' | 'staff' | 'student';
  currentBranchId?: BranchId;
  currentUserName?: string;
}

export const NoticeBoardManager: React.FC<NoticeBoardManagerProps> = ({
  viewerRole,
  currentBranchId,
  currentUserName
}) => {
  const [notices, setNotices] = useState<CampusNotice[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formBranch, setFormBranch] = useState<'all' | BranchId>(currentBranchId || 'all');
  const [formTargetRole, setFormTargetRole] = useState<'all' | 'staff' | 'student' | 'manager'>('all');
  const [formPriority, setFormPriority] = useState<'info' | 'warning' | 'urgent'>('info');

  const [notification, setNotification] = useState<string | null>(null);

  const branches = dbService.getBranches();

  const loadData = () => {
    const list = dbService.getNotices(currentBranchId || 'all', viewerRole);
    setNotices(list);
  };

  useEffect(() => {
    loadData();
    const handleDbChange = () => loadData();
    window.addEventListener('educenter-db-change', handleDbChange);
    return () => window.removeEventListener('educenter-db-change', handleDbChange);
  }, [currentBranchId, viewerRole]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAddNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert('Please enter notice title and details.');
      return;
    }

    dbService.addNotice({
      title: formTitle.trim(),
      content: formContent.trim(),
      branchId: formBranch,
      targetRole: formTargetRole,
      priority: formPriority,
      postedBy: currentUserName || (viewerRole === 'admin' ? 'Center Admin' : 'Branch Manager'),
      date: getTodayDate()
    });

    showToast(`Published campus notice: "${formTitle}"`);
    setShowAddModal(false);
    setFormTitle('');
    setFormContent('');
    loadData();
  };

  const handleDeleteNotice = (id: string, title: string) => {
    if (confirm(`Delete notice "${title}"?`)) {
      dbService.deleteNotice(id);
      showToast(`Deleted notice "${title}".`);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/30 text-sky-200 font-extrabold text-[10px] tracking-wide uppercase border border-sky-400/30">
              ERP Communications & Governance
            </span>
            <span className="text-xs text-sky-200/80">• Inter-Campus Circulars</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Institutional Notice Board & Circulars</h2>
          <p className="text-xs text-sky-200/80 mt-1">
            Publish academic schedules, holiday notices, exam dates, and official announcements across all Salem branches.
          </p>
        </div>

        {(viewerRole === 'admin' || viewerRole === 'manager') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="py-3 px-5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-sky-600/30 active:scale-95 transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Publish Announcement
          </button>
        )}
      </div>

      {/* Notices List */}
      <div className="space-y-3">
        {notices.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xs text-center text-slate-400 text-xs">
            <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
            <p className="font-bold text-slate-700">No active circulars at this moment.</p>
          </div>
        ) : (
          notices.map(notice => {
            const isUrgent = notice.priority === 'urgent';
            const isWarning = notice.priority === 'warning';

            return (
              <div 
                key={notice.id}
                className={`p-5 rounded-3xl border transition-all text-xs space-y-2.5 ${
                  isUrgent 
                    ? 'bg-rose-50/70 border-rose-200 shadow-xs' 
                    : isWarning 
                      ? 'bg-amber-50/70 border-amber-200 shadow-xs' 
                      : 'bg-white border-slate-100 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 ${
                      isUrgent 
                        ? 'bg-rose-600 text-white' 
                        : isWarning 
                          ? 'bg-amber-600 text-white' 
                          : 'bg-blue-100 text-blue-900'
                    }`}>
                      {isUrgent ? <AlertTriangle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                      {notice.priority}
                    </span>

                    <span className="font-bold text-slate-600 text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">
                      Branch: {notice.branchId === 'all' ? 'All Campuses' : notice.branchId}
                    </span>

                    <span className="font-bold text-slate-600 text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">
                      Target: {notice.targetRole === 'all' ? 'Everyone' : `${notice.targetRole}s`}
                    </span>
                  </div>

                  {(viewerRole === 'admin' || viewerRole === 'manager') && (
                    <button
                      onClick={() => handleDeleteNotice(notice.id, notice.title)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <h3 className="font-black text-slate-900 text-sm">{notice.title}</h3>
                  <p className="text-slate-700 font-medium mt-1 leading-relaxed whitespace-pre-line">
                    {notice.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
                  <span>Issued By: <strong>{notice.postedBy}</strong></span>
                  <span>Date: <strong>{notice.date}</strong></span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: PUBLISH NOTICE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-sky-100 text-sky-700">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Publish Campus Circular</h3>
                  <p className="text-xs text-slate-400">Post announcements to staff, managers & students</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNotice} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Circular Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deepavali Holidays Announcement / Semester Project Demo Schedule"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notice Content *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write complete circular details, timings, guidelines, and contact persons..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Campus</label>
                  <select
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden"
                  >
                    <option value="all">All Campuses</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={formTargetRole}
                    onChange={(e) => setFormTargetRole(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden"
                  >
                    <option value="all">All (Everyone)</option>
                    <option value="student">Students Only</option>
                    <option value="staff">Faculty Staff Only</option>
                    <option value="manager">Managers Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden"
                  >
                    <option value="info">General Info</option>
                    <option value="warning">Important Alert</option>
                    <option value="urgent">Urgent Notice</option>
                  </select>
                </div>
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
                  className="py-2.5 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black shadow-md shadow-sky-500/20 active:scale-95 cursor-pointer"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
