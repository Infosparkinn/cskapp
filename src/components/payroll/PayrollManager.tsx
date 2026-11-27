import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Users, 
  Calendar, 
  Building, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Plus, 
  X, 
  Send,
  Printer,
  TrendingUp,
  AlertCircle,
  Edit2,
  Calculator,
  Check
} from 'lucide-react';
import { dbService, getTodayDate, getCurrentTime } from '../../services/db';
import type { 
  SalarySlip, 
  UserProfile, 
  BranchId, 
  PaymentMode 
} from '../../types';

interface PayrollManagerProps {
  viewerRole: 'admin' | 'manager';
  currentBranchId?: BranchId;
  currentUserName?: string;
}

export const PayrollManager: React.FC<PayrollManagerProps> = ({
  viewerRole,
  currentBranchId,
  currentUserName
}) => {
  const [selectedBranch, setSelectedBranch] = useState<BranchId | 'all'>(
    viewerRole === 'admin' ? 'all' : (currentBranchId || 'all')
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(getTodayDate().substring(0, 7)); // YYYY-MM
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [activeSlipModal, setActiveSlipModal] = useState<SalarySlip | null>(null);
  const [disbursingSlip, setDisbursingSlip] = useState<SalarySlip | null>(null);

  // Disbursement Form
  const [disburseMode, setDisburseMode] = useState<PaymentMode | 'bank_transfer'>('bank_transfer');
  const [disburseRef, setDisburseRef] = useState('');

  // Enter / Edit Staff Payroll Form State
  const [showEditPayrollModal, setShowEditPayrollModal] = useState(false);
  const [editingSlipId, setEditingSlipId] = useState<string | undefined>(undefined);
  const [payrollForm, setPayrollForm] = useState({
    staffId: '',
    month: selectedMonth,
    baseSalary: 25000,
    allowances: 2000,
    bonus: 0,
    workingDays: 26,
    presentDays: 24,
    paidLeaveDays: 1,
    unpaidLeaveDays: 1,
    deductions: 962,
    otherDeductions: 0,
    deductionReason: '',
    status: 'approved' as 'draft' | 'approved' | 'paid',
    paymentMode: 'bank_transfer' as PaymentMode | 'bank_transfer',
    paymentRef: ''
  });

  const [notification, setNotification] = useState<string | null>(null);

  const branches = dbService.getBranches();
  const allStaff = dbService.getStaffList(selectedBranch);

  const loadData = () => {
    const list = dbService.getSalarySlips(undefined, selectedMonth, selectedBranch);
    setSlips(list);
  };

  useEffect(() => {
    loadData();
    const handleDbChange = () => loadData();
    window.addEventListener('educenter-db-change', handleDbChange);
    return () => window.removeEventListener('educenter-db-change', handleDbChange);
  }, [selectedBranch, selectedMonth]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Calculations
  let totalDisbursed = 0;
  let totalPending = 0;
  slips.forEach(s => {
    if (s.status === 'paid') totalDisbursed += s.netPayable;
    else totalPending += s.netPayable;
  });

  const openEnterPayrollModal = (staff?: UserProfile, existingSlip?: SalarySlip) => {
    const targetStaff = staff || (allStaff.length > 0 ? allStaff[0] : null);
    if (!targetStaff) {
      showToast('No faculty staff members registered yet.');
      return;
    }

    const slip = existingSlip || slips.find(s => s.staffId === targetStaff.id && s.month === selectedMonth);

    if (slip) {
      setEditingSlipId(slip.id);
      setPayrollForm({
        staffId: targetStaff.id,
        month: slip.month,
        baseSalary: slip.baseSalary,
        allowances: slip.allowances || 0,
        bonus: 0,
        workingDays: slip.workingDays || 26,
        presentDays: slip.presentDays || 24,
        paidLeaveDays: slip.paidLeaveDays || 1,
        unpaidLeaveDays: slip.unpaidLeaveDays || 0,
        deductions: slip.deductions || 0,
        otherDeductions: 0,
        deductionReason: slip.deductionReason || '',
        status: slip.status,
        paymentMode: slip.paymentMode || 'bank_transfer',
        paymentRef: slip.paymentRef || ''
      });
    } else {
      const basePay = targetStaff.jobRole === 'both' ? 28000 : targetStaff.jobRole === 'teaching' ? 24000 : 20000;
      const att = dbService.getStaffAttendance(undefined, targetStaff.branchId, selectedMonth).filter(a => a.staffId === targetStaff.id);
      const presentCount = att.filter(a => a.status === 'present').length;
      const workingDays = 26;
      const estimatedPresent = Math.min(workingDays, Math.max(22, presentCount > 0 ? presentCount : 24));
      const unpaid = Math.max(0, workingDays - estimatedPresent - 1);
      const dailyRate = Math.round(basePay / workingDays);
      const leaveDeduction = unpaid * dailyRate;

      setEditingSlipId(undefined);
      setPayrollForm({
        staffId: targetStaff.id,
        month: selectedMonth,
        baseSalary: basePay,
        allowances: 2000,
        bonus: 0,
        workingDays: workingDays,
        presentDays: estimatedPresent,
        paidLeaveDays: 1,
        unpaidLeaveDays: unpaid,
        deductions: leaveDeduction,
        otherDeductions: 0,
        deductionReason: unpaid > 0 ? `${unpaid} unpaid leave day(s)` : '',
        status: 'approved',
        paymentMode: 'bank_transfer',
        paymentRef: ''
      });
    }
    setShowEditPayrollModal(true);
  };

  const handleStaffChangeInModal = (newStaffId: string) => {
    const targetStaff = allStaff.find(s => s.id === newStaffId);
    if (!targetStaff) return;
    openEnterPayrollModal(targetStaff);
  };

  const handleSavePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = allStaff.find(s => s.id === payrollForm.staffId);
    if (!staff) {
      showToast('Please select a valid staff member.');
      return;
    }

    const totalDeductions = Number(payrollForm.deductions) + Number(payrollForm.otherDeductions);
    const grossEarnings = Number(payrollForm.baseSalary) + Number(payrollForm.allowances) + Number(payrollForm.bonus);
    const net = Math.max(0, grossEarnings - totalDeductions);

    const saved = dbService.saveSalarySlip({
      id: editingSlipId,
      staffId: staff.id,
      staffName: staff.name,
      branchId: staff.branchId || 'dadagapatty',
      month: payrollForm.month,
      baseSalary: Number(payrollForm.baseSalary) || 0,
      allowances: (Number(payrollForm.allowances) || 0) + (Number(payrollForm.bonus) || 0),
      workingDays: Number(payrollForm.workingDays) || 26,
      presentDays: Number(payrollForm.presentDays) || 0,
      paidLeaveDays: Number(payrollForm.paidLeaveDays) || 0,
      unpaidLeaveDays: Number(payrollForm.unpaidLeaveDays) || 0,
      deductions: totalDeductions,
      deductionReason: payrollForm.deductionReason.trim() || (totalDeductions > 0 ? `${payrollForm.unpaidLeaveDays} leave days deducted` : undefined),
      netPayable: net,
      status: payrollForm.status,
      paymentMode: payrollForm.status === 'paid' ? payrollForm.paymentMode : undefined,
      paymentRef: payrollForm.status === 'paid' ? (payrollForm.paymentRef.trim() || `TXN-${Date.now().toString().slice(-6)}`) : undefined,
      disbursedDate: payrollForm.status === 'paid' ? getTodayDate() : undefined,
      disbursedBy: payrollForm.status === 'paid' ? (currentUserName || 'Center Admin') : undefined
    });

    if (saved) {
      showToast(`Payroll saved for ${staff.name} (${payrollForm.month})! Net: ₹${net.toLocaleString('en-IN')}`);
      setShowEditPayrollModal(false);
      loadData();
    }
  };

  const handleGenerateSlip = (staffId: string) => {
    const newSlip = dbService.generateSalarySlip(staffId, selectedMonth);
    if (newSlip) {
      showToast(`Generated salary slip for ${newSlip.staffName} (${selectedMonth})`);
      loadData();
    }
  };

  const handleGenerateAllSlips = () => {
    let count = 0;
    allStaff.forEach(stf => {
      const slip = dbService.generateSalarySlip(stf.id, selectedMonth);
      if (slip) count++;
    });
    showToast(`Generated ${count} monthly salary slips for ${selectedMonth}!`);
    loadData();
  };

  const handleConfirmDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disbursingSlip) return;

    dbService.updateSalarySlipStatus(
      disbursingSlip.id,
      'paid',
      disburseRef.trim() || `TXN-${Date.now().toString().slice(-6)}`,
      disburseMode,
      currentUserName || 'Center Admin'
    );

    showToast(`Salary disbursed for ${disbursingSlip.staffName}! Net: ₹${disbursingSlip.netPayable.toLocaleString('en-IN')}`);
    setDisbursingSlip(null);
    setDisburseRef('');
    loadData();
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 font-extrabold text-[10px] tracking-wide uppercase border border-purple-400/30">
              HR & Payroll Engine
            </span>
            <span className="text-xs text-purple-200/80">• Attendance & Leave Linked</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Staff Salary & Payroll Management</h2>
          <p className="text-xs text-purple-200/80 mt-1">
            Automate monthly salary calculations with attendance-based leave deductions, generate printable pay slips, and track disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <button
            onClick={() => openEnterPayrollModal()}
            className="py-3 px-4 sm:px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Enter Staff Payroll
          </button>
          <button
            onClick={handleGenerateAllSlips}
            className="py-3 px-4 sm:px-5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4" /> Auto-Calculate All
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Faculty Staff</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700"><Users className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-slate-900">{allStaff.length}</div>
          <p className="text-[10px] text-slate-400 mt-1">Teaching & counseling staff</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Total Payroll Budget</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-purple-900">
            ₹{(totalDisbursed + totalPending).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-purple-700 mt-1">Net salary liability for {selectedMonth}</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Disbursed (Paid)</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ₹{totalDisbursed.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-emerald-600 mt-1 font-semibold">Salaries already transferred</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Disbursement</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700"><Clock className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-amber-700">
            ₹{totalPending.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-amber-700 mt-1 font-semibold">Ready for payment release</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
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

          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden"
            />
          </div>
        </div>

        <span className="font-bold text-slate-500">
          Showing {allStaff.length} Faculty Members
        </span>
      </div>

      {/* Staff Salary Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Faculty Staff</th>
                <th className="py-3 px-4">Campus & Role</th>
                <th className="py-3 px-4">Base + Allowances</th>
                <th className="py-3 px-4">Attendance (Working/Present)</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Payable</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allStaff.map(staff => {
                const slip = slips.find(s => s.staffId === staff.id);
                const branch = branches.find(b => b.id === staff.branchId);

                return (
                  <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 text-sm">{staff.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{staff.staffId || 'STF-FAC'} • {staff.phone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{staff.designation || 'Faculty'}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{branch ? branch.shortCode : staff.branchId} • {staff.jobRole || 'teaching'}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {slip ? (
                        <div>
                          <span>₹{slip.baseSalary.toLocaleString('en-IN')}</span>
                          {slip.allowances > 0 && <span className="text-[10px] text-emerald-600 block">+ ₹{slip.allowances.toLocaleString('en-IN')} allow.</span>}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not calculated</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {slip ? (
                        <div className="font-medium text-slate-700">
                          <span className="font-bold text-slate-900">{slip.presentDays}</span> / {slip.workingDays} Days
                          {slip.unpaidLeaveDays > 0 && (
                            <span className="text-[10px] text-rose-600 block">({slip.unpaidLeaveDays} unpaid leave)</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                      {slip ? (
                        slip.deductions > 0 ? `- ₹${slip.deductions.toLocaleString('en-IN')}` : '₹0'
                      ) : (
                        '--'
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {slip ? (
                        <span className="font-mono font-black text-sm text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                          ₹{slip.netPayable.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {slip ? (
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          slip.status === 'paid' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {slip.status}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Pending Slip</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {slip ? (
                          <>
                            {slip.status !== 'paid' && (
                              <button
                                onClick={() => setDisbursingSlip(slip)}
                                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                Disburse
                              </button>
                            )}
                            <button
                              onClick={() => openEnterPayrollModal(staff, slip)}
                              title="Edit / Adjust Staff Payroll"
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setActiveSlipModal(slip)}
                              title="View & Print Pay Slip"
                              className="p-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEnterPayrollModal(staff)}
                              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Enter Payroll
                            </button>
                            <button
                              onClick={() => handleGenerateSlip(staff.id)}
                              title="Auto-calculate based on attendance benchmark"
                              className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer"
                            >
                              <Calculator className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: DISBURSE SALARY */}
      {disbursingSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase">Bank & UPI Transfer</span>
                <h3 className="font-black text-slate-900 text-base">Disburse: {disbursingSlip.staffName}</h3>
                <p className="text-xs text-slate-400">Month: {disbursingSlip.month} • Net: ₹{disbursingSlip.netPayable.toLocaleString('en-IN')}</p>
              </div>
              <button 
                onClick={() => setDisbursingSlip(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDisbursement} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Disbursement Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDisburseMode('bank_transfer')}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                      disburseMode === 'bank_transfer' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    NEFT / IMPS
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisburseMode('upi')}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                      disburseMode === 'upi' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    UPI Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisburseMode('cash')}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                      disburseMode === 'cash' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Cash
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Transaction Ref / Cheque No *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR-202611094819 / GPay Ref"
                  value={disburseRef}
                  onChange={(e) => setDisburseRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between text-xs font-bold text-purple-950">
                <span>Total Amount Disbursed:</span>
                <span className="font-mono font-black text-base text-purple-900">
                  ₹{disbursingSlip.netPayable.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDisbursingSlip(null)}
                  className="py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black shadow-md shadow-purple-500/20 active:scale-95 cursor-pointer"
                >
                  Confirm & Mark as Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINTABLE SALARY SLIP VIEW */}
      {activeSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Monthly Salary Pay Slip</h3>
                  <p className="text-xs text-slate-400">Pay Period: {activeSlipModal.month}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveSlipModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pay Slip Card */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4 text-xs font-sans">
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="font-black text-slate-900 text-sm tracking-tight">CSK ACADEMY & INFOSPARK INNOVATION</h2>
                  <p className="text-[10px] text-slate-500">Salem Campuses, Tamil Nadu • HR & Payroll Division</p>
                </div>
                <span className="font-mono text-[10px] font-bold text-slate-400">Slip #{activeSlipModal.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Employee Name</span>
                  <span className="font-extrabold text-slate-900 text-sm">{activeSlipModal.staffName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Month & Year</span>
                  <span className="font-bold">{activeSlipModal.month}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Working Days / Present</span>
                  <span className="font-bold">{activeSlipModal.presentDays} of {activeSlipModal.workingDays} Days</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Status</span>
                  <span className="font-bold uppercase text-emerald-700">{activeSlipModal.status}</span>
                </div>
              </div>

              {/* Earnings & Deductions Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="grid grid-cols-2 bg-slate-100 p-2 font-bold text-[10px] text-slate-600 uppercase">
                  <span>Earnings Breakdown</span>
                  <span className="text-right">Amount (₹)</span>
                </div>
                <div className="p-3 space-y-2 border-b border-slate-100">
                  <div className="flex justify-between">
                    <span>Basic Monthly Salary</span>
                    <span className="font-mono font-bold">₹{activeSlipModal.baseSalary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Performance & Travel Allowances</span>
                    <span className="font-mono font-bold">+ ₹{activeSlipModal.allowances.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 bg-slate-100 p-2 font-bold text-[10px] text-slate-600 uppercase">
                  <span>Deductions</span>
                  <span className="text-right">Amount (₹)</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between text-rose-700 font-semibold">
                    <span>Leave & Unapproved Absence Deductions</span>
                    <span className="font-mono font-bold">- ₹{activeSlipModal.deductions.toLocaleString('en-IN')}</span>
                  </div>
                  {activeSlipModal.deductionReason && (
                    <p className="text-[10px] text-slate-400 italic">{activeSlipModal.deductionReason}</p>
                  )}
                </div>
              </div>

              {/* Net Payable */}
              <div className="p-3 bg-purple-100/70 rounded-xl flex items-center justify-between text-purple-950 font-bold">
                <span className="text-sm">Net Salary Disbursed:</span>
                <span className="font-mono font-black text-lg text-purple-900">
                  ₹{activeSlipModal.netPayable.toLocaleString('en-IN')}
                </span>
              </div>

              {activeSlipModal.paymentRef && (
                <div className="text-[10px] text-slate-500 font-mono text-center">
                  Paid via {activeSlipModal.paymentMode} • Ref: {activeSlipModal.paymentRef} on {activeSlipModal.disbursedDate}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Pay Slip
              </button>
              <button
                onClick={() => setActiveSlipModal(null)}
                className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ENTER / EDIT STAFF PAYROLL */}
      {showEditPayrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Payroll Entry & Salary Setup</span>
                <h3 className="font-black text-slate-900 text-base">
                  {editingSlipId ? 'Edit / Adjust Staff Payroll' : 'Enter New Staff Payroll'}
                </h3>
                <p className="text-xs text-slate-400">Configure base earnings, allowances, attendance days, and custom deductions.</p>
              </div>
              <button 
                onClick={() => setShowEditPayrollModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayroll} className="space-y-4 text-xs">
              {/* Staff Member & Month */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Faculty Staff *</label>
                  <select
                    value={payrollForm.staffId}
                    onChange={(e) => handleStaffChangeInModal(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-purple-500"
                  >
                    <option value="" disabled>-- Select Staff Member --</option>
                    {allStaff.map(stf => (
                      <option key={stf.id} value={stf.id}>
                        {stf.name} ({stf.designation || stf.jobRole || 'Faculty'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payroll Month *</label>
                  <input
                    type="month"
                    required
                    value={payrollForm.month}
                    onChange={(e) => setPayrollForm({ ...payrollForm, month: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-extrabold uppercase text-purple-900 block tracking-wide">
                  1. Monthly Earnings Breakdown
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Base Salary (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={payrollForm.baseSalary}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const unpaidDeduction = payrollForm.workingDays > 0 
                          ? Math.round(payrollForm.unpaidLeaveDays * (val / payrollForm.workingDays))
                          : 0;
                        setPayrollForm({ ...payrollForm, baseSalary: val, deductions: unpaidDeduction });
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">HRA & Allowances (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={payrollForm.allowances}
                      onChange={(e) => setPayrollForm({ ...payrollForm, allowances: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-emerald-800 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Incentive / Bonus (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={payrollForm.bonus}
                      onChange={(e) => setPayrollForm({ ...payrollForm, bonus: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-emerald-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-medium flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span>Gross Monthly Earnings:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{(Number(payrollForm.baseSalary) + Number(payrollForm.allowances) + Number(payrollForm.bonus)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Attendance & Working Days */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
                <span className="text-[11px] font-extrabold uppercase text-blue-900 block tracking-wide">
                  2. Working Days & Attendance
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Total Days</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={payrollForm.workingDays}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const unpaid = Math.max(0, val - payrollForm.presentDays - payrollForm.paidLeaveDays);
                        const ded = val > 0 ? Math.round(unpaid * (payrollForm.baseSalary / val)) : 0;
                        setPayrollForm({ ...payrollForm, workingDays: val, unpaidLeaveDays: unpaid, deductions: ded });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-center text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Present</label>
                    <input
                      type="number"
                      min="0"
                      max={payrollForm.workingDays}
                      value={payrollForm.presentDays}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const unpaid = Math.max(0, payrollForm.workingDays - val - payrollForm.paidLeaveDays);
                        const ded = payrollForm.workingDays > 0 ? Math.round(unpaid * (payrollForm.baseSalary / payrollForm.workingDays)) : 0;
                        setPayrollForm({ ...payrollForm, presentDays: val, unpaidLeaveDays: unpaid, deductions: ded });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-center text-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Paid Leave</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={payrollForm.paidLeaveDays}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const unpaid = Math.max(0, payrollForm.workingDays - payrollForm.presentDays - val);
                        const ded = payrollForm.workingDays > 0 ? Math.round(unpaid * (payrollForm.baseSalary / payrollForm.workingDays)) : 0;
                        setPayrollForm({ ...payrollForm, paidLeaveDays: val, unpaidLeaveDays: unpaid, deductions: ded });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-center text-blue-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Unpaid Leave</label>
                    <input
                      type="number"
                      min="0"
                      max={payrollForm.workingDays}
                      value={payrollForm.unpaidLeaveDays}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const ded = payrollForm.workingDays > 0 ? Math.round(val * (payrollForm.baseSalary / payrollForm.workingDays)) : 0;
                        setPayrollForm({ ...payrollForm, unpaidLeaveDays: val, deductions: ded });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-center text-rose-800"
                    />
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-3">
                <span className="text-[11px] font-extrabold uppercase text-rose-900 block tracking-wide">
                  3. Deductions & Adjustments
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Leave Deductions (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={payrollForm.deductions}
                      onChange={(e) => setPayrollForm({ ...payrollForm, deductions: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-rose-800 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Advance / TDS / PF (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={payrollForm.otherDeductions}
                      onChange={(e) => setPayrollForm({ ...payrollForm, otherDeductions: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-rose-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Deduction Reason / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 day unpaid leave + Rs. 500 salary advance"
                    value={payrollForm.deductionReason}
                    onChange={(e) => setPayrollForm({ ...payrollForm, deductionReason: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Live Net Salary Summary */}
              {(() => {
                const totalDed = Number(payrollForm.deductions) + Number(payrollForm.otherDeductions);
                const gross = Number(payrollForm.baseSalary) + Number(payrollForm.allowances) + Number(payrollForm.bonus);
                const net = Math.max(0, gross - totalDed);
                return (
                  <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl flex items-center justify-between shadow-md">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-purple-300 block">Total Net Salary Payable</span>
                      <p className="text-[11px] text-purple-200 mt-0.5">Gross ₹{gross.toLocaleString('en-IN')} - Deductions ₹{totalDed.toLocaleString('en-IN')}</p>
                    </div>
                    <span className="font-mono font-black text-2xl text-amber-300">
                      ₹{net.toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })()}

              {/* Status & Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Disbursement Status</label>
                  <select
                    value={payrollForm.status}
                    onChange={(e) => setPayrollForm({ ...payrollForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden"
                  >
                    <option value="approved">Approved (Pending Transfer)</option>
                    <option value="paid">Mark as Disbursed (Already Paid)</option>
                    <option value="draft">Draft (Under Review)</option>
                  </select>
                </div>

                {payrollForm.status === 'paid' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Mode & Ref</label>
                    <div className="flex gap-1.5">
                      <select
                        value={payrollForm.paymentMode}
                        onChange={(e) => setPayrollForm({ ...payrollForm, paymentMode: e.target.value as any })}
                        className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                      >
                        <option value="bank_transfer">NEFT/IMPS</option>
                        <option value="upi">UPI</option>
                        <option value="cash">Cash</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Txn Ref No..."
                        value={payrollForm.paymentRef}
                        onChange={(e) => setPayrollForm({ ...payrollForm, paymentRef: e.target.value })}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditPayrollModal(false)}
                  className="py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black shadow-md shadow-purple-600/20 active:scale-95 cursor-pointer"
                >
                  Save & Issue Pay Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
