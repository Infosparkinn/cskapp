// End-to-End Workflow Verification Script for CSK Academy & InfoSpark ERP/CRM
// Verifies all business lifecycle workflows in Node.js

// Polyfill localStorage & window for Node environment
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] ?? null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {}
};

import { dbService, getTodayDate, BRANCHES } from './src/services/db.js';

console.log('========================================================');
console.log('CSK ACADEMY & INFOSPARK ERP - END-TO-END WORKFLOW VERIFIER');
console.log('========================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

// STAGE 1: CRM & ADMISSIONS WORKFLOW
console.log('--- STAGE 1: CRM LEAD CAPTURE & PIPELINE ---');
const newLead = dbService.addLead({
  name: 'Anitha Ramesh',
  phone: '9842199881',
  email: 'anitha.test@gmail.com',
  courseName: 'Full Stack Web Development (MERN / Python)',
  branchId: 'dadagapatty',
  status: 'new',
  priority: 'hot',
  source: 'walk_in',
  assignedStaffId: 'usr-stf-1',
  assignedStaffName: 'Kavitha R',
  notes: 'Inquired about weekend batches',
  nextFollowUpDate: getTodayDate(),
  nextFollowUpTime: '04:00 PM'
});

assert(newLead && newLead.id, 'Lead successfully created in CRM');
assert(newLead.status === 'new', 'Lead is initially at "new" stage');

// Lead transition to counseling
const updatedLead = dbService.updateLead(newLead.id, {
  status: 'counseling',
  notes: 'Attended counseling with parents'
});
assert(updatedLead.status === 'counseling', 'Lead advanced to "In Counseling / Demo" stage');

// STAGE 2: 1-CLICK ENROLLMENT TO STUDENT
console.log('\n--- STAGE 2: 1-CLICK CONVERSION TO ENROLLED STUDENT ---');
const enrollResult = dbService.convertLeadToStudent(newLead.id, {
  standard: '12th Standard',
  batchTiming: 'Morning (10:00 AM - 12:30 PM)',
  totalFees: 30000, // Total Fee
  paidFees: 10000, // Initial Paid
  paymentMode: 'cash',
  collectedBy: 'Logesh Kannan'
});

assert(enrollResult !== null, 'Lead converted into student');
assert(enrollResult.student.role === 'student', 'Student profile created');
assert(enrollResult.student.studentId.startsWith('STU-'), 'Roll number assigned');
assert(enrollResult.student.paidFees === 10000, 'Initial payment recorded: ₹10,000');
assert(enrollResult.student.pendingFees === 20000, 'Pending balance calculated: ₹20,000');
assert(enrollResult.lead.status === 'enrolled', 'Lead status marked as enrolled');

// STAGE 3: PENDING FEES & RECOVERY WORKFLOW
console.log('\n--- STAGE 3: PENDING FEES & AGING RECOVERY ---');
const aging = dbService.getPendingFeeAging('dadagapatty');
assert(aging.totalPendingAmount >= 20000, 'Pending fee registered in aging system');

// Send WhatsApp Reminder
const reminderLog = dbService.logFeeReminder({
  studentId: enrollResult.student.id,
  studentName: enrollResult.student.name,
  phone: enrollResult.student.phone,
  amountDue: enrollResult.student.pendingFees,
  dueDate: getTodayDate(),
  channel: 'whatsapp',
  messageText: 'Dear Anitha, kindly pay your fee balance of Rs. 20,000.',
  sentBy: 'Anand'
});
assert(reminderLog && reminderLog.id, 'Fee reminder notice dispatched and logged');

// Collect 2nd Installment
const paymentRes = dbService.recordFeePayment(
  enrollResult.student.id,
  10000,
  'upi',
  'Anand',
  'UPI Ref: 48192019401'
);
assert(paymentRes !== null, 'Fee installment collected');
assert(paymentRes.student.paidFees === 20000, 'Student paid fees updated to ₹20,000');
assert(paymentRes.student.pendingFees === 10000, 'Student pending fees updated to ₹10,000');
assert(paymentRes.student.paymentHistory.length === 2, '2 Payment receipts logged in ledger');

// STAGE 4: SHIFT ATTENDANCE & PUNCH WORKFLOW
console.log('\n--- STAGE 4: SHIFT PUNCH WORKFLOW ---');
const todayStr = getTodayDate();
const checkIn = dbService.staffCheckIn('usr-stf-1', 'Kavitha R', 'dadagapatty');
assert(checkIn.loginTime !== undefined, 'Staff check-in recorded punch loginTime');

const checkOut = dbService.staffCheckOut('usr-stf-1');
assert(checkOut.logoutTime !== undefined, 'Staff check-out recorded punch logoutTime');
assert(checkOut.totalHours !== undefined, 'Shift duration computed');

// STAGE 5: OPERATING EXPENSES & MULTI-BRANCH P&L
console.log('\n--- STAGE 5: EXPENSES & PROFIT & LOSS WORKFLOW ---');
const exp = dbService.addExpense({
  title: 'Salem Office Electricity Bill',
  category: 'utilities',
  amount: 4500,
  date: todayStr,
  branchId: 'dadagapatty',
  paymentMode: 'bank_transfer',
  recordedBy: 'Anand'
});
assert(exp && exp.id, 'Branch operating expense logged');

const plSummary = dbService.getBranchPLSummary('dadagapatty', todayStr.slice(0, 7));
assert(plSummary.totalRevenue > 0, 'Total revenue dynamically calculated from student fee receipts');
assert(plSummary.totalExpenses >= 4500, 'Total expenses dynamically aggregated');
assert(typeof plSummary.netProfit === 'number', 'Net Profit calculated');
assert(typeof plSummary.profitMargin === 'string', 'Profit Margin computed as percentage');

// STAGE 6: STAFF PAYROLL WORKFLOW
console.log('\n--- STAGE 6: PAYROLL & SALARY DISBURSEMENT ---');
const salarySlip = dbService.generateSalarySlip('usr-stf-1', todayStr.slice(0, 7));
assert(salarySlip !== null, 'Monthly salary slip generated');
assert(salarySlip.baseSalary > 0, 'Base salary calculated from staff role');
assert(salarySlip.netPayable > 0, 'Net payable computed after attendance deductions');

// STAGE 7: CAMPUS NOTICE BOARD BROADCAST
console.log('\n--- STAGE 7: CAMPUS NOTICE BOARD BROADCAST ---');
const notice = dbService.addNotice({
  title: 'Semester Project Submissions',
  content: 'All final year batch students must submit project synopses by Friday.',
  priority: 'urgent',
  targetRole: 'all',
  branchId: 'all',
  postedBy: 'Headquarters Admin'
});
assert(notice && notice.id, 'Circular broadcast to all Salem campuses');
const activeNotices = dbService.getNotices('dadagapatty', 'student');
assert(activeNotices.some(n => n.id === notice.id), 'Circular accessible to branch students');

console.log('\n========================================================');
console.log(`WORKFLOW TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('========================================================');

if (failCount > 0) {
  process.exit(1);
}
