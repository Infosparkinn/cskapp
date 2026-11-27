import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Send, 
  Search, 
  Filter, 
  Building, 
  User, 
  Phone, 
  Calendar, 
  ArrowUpRight, 
  FileText, 
  MessageSquare, 
  Plus, 
  X, 
  TrendingDown,
  ShieldAlert,
  Bell
} from 'lucide-react';
import { dbService, getTodayDate, getCurrentTime } from '../../services/db';
import type { 
  UserProfile, 
  BranchId, 
  PaymentMode, 
  FeeInstallment, 
  FeePaymentRecord 
} from '../../types';

interface PendingFeesManagerProps {
  viewerRole: 'admin' | 'manager';
  currentBranchId?: BranchId;
  currentUserName?: string;
}

export const PendingFeesManager: React.FC<PendingFeesManagerProps> = ({
  viewerRole,
  currentBranchId,
  currentUserName
}) => {
  const [selectedBranch, setSelectedBranch] = useState<BranchId | 'all'>(
    viewerRole === 'admin' ? 'all' : (currentBranchId || 'all')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgingBracket, setSelectedAgingBracket] = useState<'all' | '7days' | '1to15' | '16to30' | '30plus'>('all');

  // Modals
  const [payingStudent, setPayingStudent] = useState<UserProfile | null>(null);
  const [payAmount, setPayAmount] = useState<number>(5000);
  const [payMode, setPayMode] = useState<PaymentMode>('upi');
  const [payNotes, setPayNotes] = useState('Installment fee collection');

  const [historyStudent, setHistoryStudent] = useState<UserProfile | null>(null);
  const [showReminderLogsModal, setShowReminderLogsModal] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  const branches = dbService.getBranches();

  // Aging data calculation
  const agingData = dbService.getPendingFeeAging(selectedBranch);
  const allStudents = dbService.getStudentList(selectedBranch);
  const reminderLogs = dbService.getFeeReminderLogs();

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Filter students
  const filteredStudents = allStudents.filter(stu => {
    if ((stu.pendingFees || 0) <= 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = stu.name.toLowerCase().includes(q);
      const matchPhone = stu.phone.includes(q);
      const matchCourse = (stu.courseName || '').toLowerCase().includes(q);
      const matchRoll = (stu.studentId || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCourse && !matchRoll) return false;
    }

    if (selectedAgingBracket !== 'all') {
      const in7 = agingData.dueIn7Days.some(d => d.student.id === stu.id);
      const in1to15 = agingData.overdue1to15Days.some(d => d.student.id === stu.id);
      const in16to30 = agingData.overdue16to30Days.some(d => d.student.id === stu.id);
      const in30plus = agingData.overdue30PlusDays.some(d => d.student.id === stu.id);

      if (selectedAgingBracket === '7days' && !in7) return false;
      if (selectedAgingBracket === '1to15' && !in1to15) return false;
      if (selectedAgingBracket === '16to30' && !in16to30) return false;
      if (selectedAgingBracket === '30plus' && !in30plus) return false;
    }

    return true;
  });

  const handleOpenPayment = (student: UserProfile) => {
    setPayingStudent(student);
    setPayAmount(student.pendingFees || 5000);
    setPayMode('upi');
    setPayNotes('Fee installment collection');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingStudent || payAmount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const res = dbService.recordFeePayment(
      payingStudent.id,
      Number(payAmount),
      payMode,
      currentUserName || 'Center Manager',
      payNotes.trim()
    );

    if (res) {
      showToast(`Recorded payment of ₹${payAmount.toLocaleString('en-IN')} for ${payingStudent.name}!`);
      setPayingStudent(null);
    }
  };

  const handleSendWhatsAppReminder = (student: UserProfile) => {
    const campus = student.branchName || 'CSK Academy';
    const message = dbService.generateWhatsAppReminderMessage(
      student.name,
      student.courseName || 'Tuition Course',
      student.pendingFees || 0,
      undefined,
      campus
    );

    // Log the reminder in system
    dbService.logFeeReminder({
      studentId: student.id,
      studentName: student.name,
      phone: student.phone,
      amountDue: student.pendingFees || 0,
      dueDate: getTodayDate(),
      channel: 'whatsapp',
      messageText: message,
      sentBy: currentUserName || 'Center Desk'
    });

    const cleanPhone = student.phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
    showToast(`WhatsApp reminder dispatched for ${student.name}!`);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 font-extrabold text-[10px] tracking-wide uppercase border border-emerald-400/30">
              Fee Recovery & Aging System
            </span>
            <span className="text-xs text-emerald-200/80">• Salem Multi-Campus</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Pending Fees & Automated Reminders</h2>
          <p className="text-xs text-emerald-200/80 mt-1">
            Monitor installment aging, record instant fee receipts, and send 1-click personalized WhatsApp fee reminder notices.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 self-start md:self-auto">
          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Total Outstanding Fees</span>
          <span className="text-2xl font-black text-white">
            ₹{agingData.totalPendingAmount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Aging Analysis Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Bracket 1: Due in 7 Days */}
        <button
          onClick={() => setSelectedAgingBracket(selectedAgingBracket === '7days' ? 'all' : '7days')}
          className={`p-4 rounded-3xl border text-left transition-all ${
            selectedAgingBracket === '7days' 
              ? 'bg-blue-50 border-blue-400 shadow-md ring-2 ring-blue-400' 
              : 'bg-white border-slate-100 hover:border-blue-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Due Soon (7 Days)</span>
            <div className="p-1.5 rounded-xl bg-blue-100 text-blue-700"><Clock className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-blue-900">{agingData.dueIn7Days.length}</div>
          <p className="text-[10px] text-blue-700 mt-1">Upcoming scheduled dues</p>
        </button>

        {/* Bracket 2: Overdue 1-15 Days */}
        <button
          onClick={() => setSelectedAgingBracket(selectedAgingBracket === '1to15' ? 'all' : '1to15')}
          className={`p-4 rounded-3xl border text-left transition-all ${
            selectedAgingBracket === '1to15' 
              ? 'bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-400' 
              : 'bg-white border-slate-100 hover:border-amber-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Overdue 1-15 Days</span>
            <div className="p-1.5 rounded-xl bg-amber-100 text-amber-800"><AlertTriangle className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-amber-800">{agingData.overdue1to15Days.length}</div>
          <p className="text-[10px] text-amber-700 mt-1">First reminder stage</p>
        </button>

        {/* Bracket 3: Overdue 16-30 Days */}
        <button
          onClick={() => setSelectedAgingBracket(selectedAgingBracket === '16to30' ? 'all' : '16to30')}
          className={`p-4 rounded-3xl border text-left transition-all ${
            selectedAgingBracket === '16to30' 
              ? 'bg-orange-50 border-orange-400 shadow-md ring-2 ring-orange-400' 
              : 'bg-white border-slate-100 hover:border-orange-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">Overdue 16-30 Days</span>
            <div className="p-1.5 rounded-xl bg-orange-100 text-orange-800"><TrendingDown className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-orange-800">{agingData.overdue16to30Days.length}</div>
          <p className="text-[10px] text-orange-700 mt-1">Escalated reminder stage</p>
        </button>

        {/* Bracket 4: Overdue >30 Days */}
        <button
          onClick={() => setSelectedAgingBracket(selectedAgingBracket === '30plus' ? 'all' : '30plus')}
          className={`p-4 rounded-3xl border text-left transition-all ${
            selectedAgingBracket === '30plus' 
              ? 'bg-rose-50 border-rose-400 shadow-md ring-2 ring-rose-400' 
              : 'bg-white border-slate-100 hover:border-rose-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Critical (&gt;30 Days)</span>
            <div className="p-1.5 rounded-xl bg-rose-100 text-rose-800"><ShieldAlert className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-rose-800">{agingData.overdue30PlusDays.length}</div>
          <p className="text-[10px] text-rose-700 mt-1">Requires manager intervention</p>
        </button>
      </div>

      {/* Filter and Search Bar */}
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
                <option value="all">All Salem Campuses</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                ))}
              </select>
            </div>
          )}

          {/* Aging Bracket Indicator */}
          {selectedAgingBracket !== 'all' && (
            <span className="bg-blue-100 text-blue-900 font-extrabold px-3 py-1 rounded-xl flex items-center gap-1">
              Filter: {selectedAgingBracket}
              <button onClick={() => setSelectedAgingBracket('all')} className="hover:text-blue-600"><X className="w-3 h-3" /></button>
            </span>
          )}

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search student name, roll no, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReminderLogsModal(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
            title="View all dispatched WhatsApp fee reminder notices"
          >
            <Bell className="w-3.5 h-3.5 text-slate-500" />
            <span>Reminder Logs ({reminderLogs.length})</span>
          </button>
          <span className="text-slate-500 font-bold">
            {filteredStudents.length} Students with balance fees
          </span>
        </div>
      </div>

      {/* Student Fees Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Student & Roll No</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Course Program</th>
                <th className="py-3 px-4">Total Fee</th>
                <th className="py-3 px-4">Paid Till Date</th>
                <th className="py-3 px-4">Pending Balance</th>
                <th className="py-3 px-4 text-right">Fee Recovery Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2 stroke-1" />
                    <p className="font-bold text-slate-700">No pending fee defaulters!</p>
                    <p className="text-[11px] text-slate-400">All students in this filter have completed their payments.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const branch = branches.find(b => b.id === student.branchId);
                  const isCritical = (student.pendingFees || 0) > 10000;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">{student.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                            {student.studentId || 'STU-NEW'}
                          </span>
                          {branch && (
                            <span className="text-[10px] text-slate-500">
                              • {branch.shortCode}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {student.phone}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {student.courseName || 'Certificate Course'}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        ₹{(student.totalFees || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        ₹{(student.paidFees || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`font-mono font-black text-sm px-2.5 py-1 rounded-xl ${
                          isCritical ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                        }`}>
                          ₹{(student.pendingFees || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click WhatsApp Reminder Button */}
                          <button
                            onClick={() => handleSendWhatsAppReminder(student)}
                            title="Send WhatsApp Fee Reminder"
                            className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Remind</span>
                          </button>

                          {/* Record Payment Button */}
                          <button
                            onClick={() => handleOpenPayment(student)}
                            title="Record Cash / UPI Payment"
                            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Pay</span>
                          </button>

                          {/* Payment History Ledger */}
                          <button
                            onClick={() => setHistoryStudent(student)}
                            title="View Receipts & History"
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
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

      {/* MODAL 1: RECORD FEE PAYMENT */}
      {payingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Cash & UPI Counter</span>
                <h3 className="font-black text-slate-900 text-base">Collect Fee: {payingStudent.name}</h3>
                <p className="text-xs text-slate-400 font-mono">Roll: {payingStudent.studentId} • Balance: ₹{payingStudent.pendingFees?.toLocaleString('en-IN')}</p>
              </div>
              <button 
                onClick={() => setPayingStudent(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="100"
                  max={payingStudent.pendingFees || 100000}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-black text-emerald-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMode('upi')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      payMode === 'upi' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    UPI Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMode('cash')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      payMode === 'cash' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Cash Collection
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Receipt Notes / UPI Reference</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. UPI Ref: 419201948210 / GPay"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-950">
                <span>Remaining Balance After Payment:</span>
                <span className="font-mono font-black text-sm">
                  ₹{Math.max(0, (payingStudent.pendingFees || 0) - payAmount).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingStudent(null)}
                  className="py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
                >
                  Save & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PAYMENT HISTORY LEDGER */}
      {historyStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase">Payment Ledger</span>
                <h3 className="font-black text-slate-900 text-base">{historyStudent.name}</h3>
                <p className="text-xs text-slate-400 font-mono">Roll: {historyStudent.studentId} • Course: {historyStudent.courseName}</p>
              </div>
              <button 
                onClick={() => setHistoryStudent(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Balance Summary */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block">Total Course Fee</span>
                <span className="font-mono font-black text-slate-800">₹{(historyStudent.totalFees || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-600 block">Paid Amount</span>
                <span className="font-mono font-black text-emerald-700">₹{(historyStudent.paidFees || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                <span className="text-[10px] font-bold text-rose-600 block">Remaining Balance</span>
                <span className="font-mono font-black text-rose-700">₹{(historyStudent.pendingFees || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Receipts List */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs">Previous Payment Receipts ({historyStudent.paymentHistory?.length || 0})</h4>
              
              {(!historyStudent.paymentHistory || historyStudent.paymentHistory.length === 0) ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No payment transactions recorded yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {historyStudent.paymentHistory.map((pay, i) => (
                    <div key={pay.id || i} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>₹{pay.amount.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {pay.paymentMode}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{pay.date} at {pay.time} • Collected by {pay.collectedBy}</p>
                        {pay.notes && <p className="text-[10px] text-slate-400 italic mt-0.5">{pay.notes}</p>}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Ref: {pay.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setHistoryStudent(null)}
                className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: FEE REMINDER LOGS */}
      {showReminderLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Audit & Dispatch History</span>
                <h3 className="font-black text-slate-900 text-base">WhatsApp Fee Reminder Logs</h3>
                <p className="text-xs text-slate-400">All automated and manual fee collection reminder notifications dispatched</p>
              </div>
              <button 
                onClick={() => setShowReminderLogsModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {reminderLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No fee reminder notices dispatched yet. Use the "Remind" button next to any pending student to send a notice!
                </div>
              ) : (
                reminderLogs.map(log => (
                  <div key={log.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900">{log.studentName}</span>
                      <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        ₹{log.amountDue.toLocaleString('en-IN')} Due
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>Phone: {log.phone}</span>
                      <span>• Channel: {log.channel.toUpperCase()}</span>
                      <span>• Dispatched by: {log.sentBy}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 font-mono whitespace-pre-line">
                      {log.messageText}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Sent on: {log.sentAt}</span>
                      <span className="font-mono">Ref: {log.id}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setShowReminderLogsModal(false)}
                className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
