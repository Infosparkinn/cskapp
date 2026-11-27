import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  Calendar, 
  Building, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Filter, 
  CheckCircle2, 
  X,
  CreditCard,
  FileText
} from 'lucide-react';
import { dbService, getTodayDate, getCurrentTime } from '../../services/db';
import type { 
  ExpenseRecord, 
  ExpenseCategory, 
  BranchId, 
  PaymentMode 
} from '../../types';

interface ExpenseManagerProps {
  viewerRole: 'admin' | 'manager';
  currentBranchId?: BranchId;
  currentUserName?: string;
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  viewerRole,
  currentBranchId,
  currentUserName
}) => {
  const [selectedBranch, setSelectedBranch] = useState<BranchId | 'all'>(
    viewerRole === 'admin' ? 'all' : (currentBranchId || 'all')
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(getTodayDate().substring(0, 7)); // YYYY-MM
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState<number>(1500);
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('petty_cash');
  const [formBranch, setFormBranch] = useState<BranchId>(currentBranchId || 'dadagapatty');
  const [formDate, setFormDate] = useState(getTodayDate());
  const [formPaymentMode, setFormPaymentMode] = useState<PaymentMode | 'bank_transfer'>('upi');
  const [formPaidTo, setFormPaidTo] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  const branches = dbService.getBranches();

  const loadData = () => {
    const list = dbService.getExpenses(selectedBranch, selectedMonth, selectedCategory);
    setExpenses(list);
  };

  useEffect(() => {
    loadData();
    const handleDbChange = () => loadData();
    window.addEventListener('educenter-db-change', handleDbChange);
    return () => window.removeEventListener('educenter-db-change', handleDbChange);
  }, [selectedBranch, selectedMonth, selectedCategory]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // P&L calculation
  const plSummary = dbService.getBranchPLSummary(selectedBranch, selectedMonth);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || formAmount <= 0) {
      alert('Please enter a valid expense title and amount.');
      return;
    }

    dbService.addExpense({
      branchId: formBranch,
      category: formCategory,
      title: formTitle.trim(),
      amount: Number(formAmount),
      date: formDate,
      paymentMode: formPaymentMode,
      paidTo: formPaidTo.trim() || 'Vendor',
      invoiceNumber: formInvoiceNumber.trim() || undefined,
      approvedBy: currentUserName || (viewerRole === 'admin' ? 'Center Admin' : 'Branch Manager'),
      notes: formNotes.trim() || undefined
    });

    showToast(`Expense recorded: ₹${formAmount} for ${formTitle}`);
    setShowAddModal(false);
    setFormTitle('');
    setFormAmount(1500);
    setFormPaidTo('');
    setFormInvoiceNumber('');
    setFormNotes('');
    loadData();
  };

  const handleDeleteExpense = (id: string, title: string) => {
    if (confirm(`Delete expense record "${title}"?`)) {
      dbService.deleteExpense(id);
      showToast(`Deleted expense "${title}".`);
      loadData();
    }
  };

  const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
    rent: '🏢 Campus Rent',
    electricity_utilities: '⚡ Electricity & Power',
    internet_telecom: '🌐 Wi-Fi & Internet',
    hardware_maintenance: '🖥️ Lab Hardware',
    marketing_ads: '📢 Ads & Marketing',
    stationery_print: '📄 Printing & Stationery',
    pantry_refreshments: '☕ Pantry & Refreshments',
    petty_cash: '💵 Daily Petty Cash',
    salary: '💳 Staff Salary',
    other: '📦 General / Other'
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-extrabold text-[10px] tracking-wide uppercase border border-indigo-400/30">
              Institutional Accounting
            </span>
            <span className="text-xs text-indigo-200/80">• Multi-Branch P&L Ledger</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Operating Expenses & Profit-Loss Summary</h2>
          <p className="text-xs text-indigo-200/80 mt-1">
            Track campus rents, electricity, internet, advertising, hardware maintenance, and daily petty cash against student fee revenue.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Record New Expense
        </button>
      </div>

      {/* P&L Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Fee Revenue */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fee Collections (Revenue)</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ₹{plSummary.totalRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-emerald-600 mt-1 font-semibold">Student tuition inflows</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Expenses (Outflow)</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700"><TrendingDown className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-rose-700">
            ₹{plSummary.totalExpenses.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-rose-600 mt-1 font-semibold">Rent, bills, marketing & supplies</p>
        </div>

        {/* Net Operating Profit */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net Operating Surplus</span>
            <div className={`p-2 rounded-xl ${plSummary.netProfit >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${plSummary.netProfit >= 0 ? 'text-blue-900' : 'text-rose-700'}`}>
            ₹{plSummary.netProfit.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">Net profit after all campus costs</p>
        </div>

        {/* Operating Margin */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Operating Margin</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700"><PieChart className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-purple-900">
            {plSummary.profitMargin}%
          </div>
          <p className="text-[10px] text-purple-700 mt-1 font-semibold">Financial operating health</p>
        </div>
      </div>

      {/* Filter Bar */}
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

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ExpenseCategory | 'all')}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden"
            >
              <option value="all">All Expense Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                <option key={cat} value={cat}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <span className="font-bold text-slate-500">
          {expenses.length} Records in selected period
        </span>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Expense Title & Vendor</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Campus</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Mode & Invoice</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No expense records found for this period.
                  </td>
                </tr>
              ) : (
                expenses.map(exp => {
                  const branch = branches.find(b => b.id === exp.branchId);

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">{exp.title}</div>
                        <div className="text-[10px] text-slate-400">Paid to: {exp.paidTo} • Approved by: {exp.approvedBy}</div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {CATEGORY_LABELS[exp.category] || exp.category}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        {branch ? branch.shortCode : exp.branchId}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {exp.date}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-extrabold uppercase text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                          {exp.paymentMode}
                        </span>
                        {exp.invoiceNumber && (
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                            #{exp.invoiceNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-black text-rose-700 text-sm">
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp.id, exp.title)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD EXPENSE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Record Operating Expense</h3>
                  <p className="text-xs text-slate-400">Log campus bills, maintenance & petty cash</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Lab AC Gas Refill / TANGEDCO EB Bill"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-black text-rose-700 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-indigo-500"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                      <option key={cat} value={cat}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Campus Branch</label>
                  <select
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value as BranchId)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-indigo-500"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Paid To (Vendor / Person)</label>
                  <input
                    type="text"
                    placeholder="e.g. Airtel Broadband / Landlord"
                    value={formPaidTo}
                    onChange={(e) => setFormPaidTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice / Bill Number</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-99"
                    value={formInvoiceNumber}
                    onChange={(e) => setFormInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormPaymentMode('upi')}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                      formPaymentMode === 'upi' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPaymentMode('cash')}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                      formPaymentMode === 'cash' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPaymentMode('bank_transfer')}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                      formPaymentMode === 'bank_transfer' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Bank / NEFT
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or context..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
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
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
                >
                  Save Expense Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
