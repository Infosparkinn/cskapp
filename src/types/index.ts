export type UserRole = 'admin' | 'manager' | 'staff' | 'student';

export type BranchId = 'dadagapatty' | 'kondalampatty' | 'ammapet' | 'new_bus_stand';

export interface Branch {
  id: BranchId;
  name: string;        // "CSK Academy" or "InfoSpark Innovation Pvt Ltd"
  location: string;    // "Dadagapatty, Salem"
  shortCode: string;   // "CSK-DDG", "CSK-KND", "CSK-AMP", "INF-NBS"
  fullName: string;    // "CSK Academy - Dadagapatty, Salem"
  address: string;
  phone: string;
}

export type StaffJobType = 'teaching' | 'telecalling' | 'project_work' | 'mixed';

export type PaymentMode = 'cash' | 'upi';

export interface FeePaymentRecord {
  id: string;
  amount: number;
  paymentMode: PaymentMode;
  collectedBy: string; // Name of staff or manager who collected
  date: string; // YYYY-MM-DD
  time: string; // e.g. 11:30 AM
  notes?: string; // UPI reference number / notes
  timestamp: number;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
  username?: string;
  password?: string;
  avatar?: string;
  createdAt: string;

  // Branch assignment
  branchId?: BranchId;
  branchName?: string;

  // Manager specific
  managerId?: string;

  // Staff specific
  staffId?: string;
  jobRole?: 'teaching' | 'telecalling' | 'both';
  qualification?: string;
  designation?: string;
  address?: string;

  // Student specific
  studentId?: string;
  occupation?: string; // e.g. Student, Working Professional, Job Seeker, Freelancer
  standard?: string;   // e.g. 10th, 12th, B.Tech 3rd Yr, BCA, Graduate, etc.
  courseId?: string;
  courseName?: string;
  batchTiming?: string;
  totalFees?: number;
  paidFees?: number;
  pendingFees?: number;
  feeStatus?: 'paid' | 'partial' | 'pending';
  lastPaymentMode?: PaymentMode;
  lastPaymentCollectedBy?: string;
  paymentHistory?: FeePaymentRecord[];
}

export interface StaffAttendance {
  id: string;
  staffId: string;
  staffName: string;
  branchId?: BranchId;
  date: string; // YYYY-MM-DD
  loginTime: string; // e.g. 09:30 AM
  logoutTime?: string; // e.g. 06:15 PM
  totalHours?: string;
  status: 'present' | 'half_day' | 'absent' | 'permission';
  hasPermission?: boolean;
  permissionHours?: number;
  permissionReason?: string;
  timestamp: number;
}

export type StaffPermissionType = 'morning_late' | 'evening_early' | 'mid_day' | 'emergency' | 'personal';

export interface StaffPermission {
  id: string;
  staffId: string;
  staffName: string;
  userRole?: 'staff' | 'manager';
  branchId?: BranchId;
  date: string; // YYYY-MM-DD
  permissionType: StaffPermissionType;
  startTime: string; // e.g. 09:30 AM
  endTime: string;   // e.g. 11:00 AM
  durationHours: number; // e.g. 1, 1.5, 2
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
  approvedBy?: string;
  timestamp: number;
}

export type LeaveType = 'casual' | 'sick' | 'emergency' | 'planned' | 'half_day';

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: 'staff' | 'manager';
  branchId?: BranchId;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalDays: number; // e.g. 1, 2, 0.5
  isHalfDay?: boolean;
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
  approvedBy?: string;
  appliedOn: string;
  timestamp: number;
}

export interface StudentAttendance {
  id: string;
  studentId: string;
  studentName: string;
  branchId?: BranchId;
  courseName: string;
  date: string; // YYYY-MM-DD
  inTime: string; // e.g. 10:00 AM
  outTime: string; // e.g. 12:30 PM
  topicCovered: string; // topic covered that day
  present: boolean;
  remarks?: string;
  timestamp: number;
}

export interface TelecallingReport {
  todayCalls: number;
  todayFollowUp: number;
  todayEnquiry: number;
  todayAdmission: number;
  notes?: string;
}

export interface TeachingReportItem {
  id: string;
  courseName: string;
  studentCount: number;
  studentNames: string[];
  topicCovered: string;
  projectWorkDetails?: string;
}

export interface DailyWorkReport {
  id: string;
  staffId: string;
  staffName: string;
  branchId?: BranchId;
  date: string; // YYYY-MM-DD
  reportType: 'teaching' | 'telecalling' | 'both';
  
  // Telecalling data
  telecalling?: TelecallingReport;

  // Teaching and Project Work data
  teachingItems?: TeachingReportItem[];

  // Total teaching done summary on that day (e.g. "AI-1, C/C++-2")
  totalTeachingSummary?: string;

  overallRemarks?: string;
  timestamp: number;
}

export interface ManagerDailyReport {
  id: string;
  managerId: string;
  managerName: string;
  branchId: BranchId;
  date: string; // YYYY-MM-DD
  noOfEnquiry: number;
  noOfAdmission: number;
  feesPendingAmount: number;
  feesPendingDetails?: string;
  totalStudentsInBranch: number;
  noOfAbsentStudents: number;
  noOfAbsentStaff?: number;
  notes?: string;
  timestamp: number;
}

export type CourseType = 'regular' | 'internship';

export interface Course {
  id: string;
  name: string;
  code: string;
  courseType?: CourseType; // 'regular' (default) or 'internship'
  duration: string;        // e.g. '3 Months' or '30 Days'
  internshipDays?: number; // e.g. 15, 30, 45, 60, 90 days when courseType === 'internship'
  fee: number;
  description: string;
  branchId?: BranchId; // specific Salem campus offering this course, or undefined for all
}

export interface CenterStats {
  totalStaff: number;
  totalStudents: number;
  todayPresentStaff: number;
  todayPresentStudents: number;
  totalPendingFees: number;
  totalCollectedFees: number;
  todayTotalCalls: number;
  todayTotalFollowUps: number;
  todayTotalEnquiries: number;
  todayTotalAdmissions: number;
}

// ==========================================
// 1. CRM & ADMISSION FOLLOW-UP TYPES
// ==========================================
export type LeadStatus = 'new' | 'contacted' | 'counseling' | 'follow_up' | 'enrolled' | 'lost';
export type LeadSource = 'walk_in' | 'phone_enquiry' | 'instagram_meta' | 'website' | 'referral' | 'pamphlet_camp';
export type LeadPriority = 'hot' | 'warm' | 'cold';

export interface LeadFollowUpRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. 11:30 AM
  remarks: string;
  counselorName: string;
  status: 'pending' | 'completed' | 'missed';
  timestamp: number;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  branchId: BranchId;
  courseId?: string;
  courseName?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assignedToStaffId?: string;
  assignedToStaffName?: string;
  nextFollowUpDate?: string; // YYYY-MM-DD
  nextFollowUpTime?: string; // e.g. 03:00 PM
  notes: string;
  followUps: LeadFollowUpRecord[];
  enrolledStudentId?: string;
  createdAt: string;
  updatedAt: string;
  timestamp: number;
}

// ==========================================
// 2. PENDING FEES & REMINDERS TYPES
// ==========================================
export interface FeeInstallment {
  id: string;
  studentId: string;
  studentName: string;
  branchId: BranchId;
  installmentNo: number;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  paidAmount: number;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  paidDate?: string;
  reminderCount: number;
  lastReminderSent?: string;
  notes?: string;
}

export interface FeeReminderLog {
  id: string;
  studentId: string;
  studentName: string;
  phone: string;
  amountDue: number;
  dueDate: string;
  channel: 'whatsapp' | 'sms' | 'call';
  messageText: string;
  sentBy: string;
  sentAt: string;
  timestamp: number;
}

// ==========================================
// 3. ACCOUNTING & EXPENSES TYPES
// ==========================================
export type ExpenseCategory = 
  | 'rent'
  | 'electricity_utilities'
  | 'internet_telecom'
  | 'hardware_maintenance'
  | 'marketing_ads'
  | 'stationery_print'
  | 'pantry_refreshments'
  | 'petty_cash'
  | 'salary'
  | 'other';

export interface ExpenseRecord {
  id: string;
  branchId: BranchId;
  category: ExpenseCategory;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMode: PaymentMode | 'bank_transfer';
  paidTo: string; // Vendor or person name
  invoiceNumber?: string;
  approvedBy: string;
  notes?: string;
  timestamp: number;
}

// ==========================================
// 4. PAYROLL & SALARY MANAGEMENT TYPES
// ==========================================
export interface StaffSalaryConfig {
  staffId: string;
  baseSalary: number;
  allowances: number;
  dailyRate?: number;
  allowedCasualLeaves: number;
  bankAccountNumber?: string;
  bankIfsc?: string;
  panNumber?: string;
}

export interface SalarySlip {
  id: string;
  staffId: string;
  staffName: string;
  branchId: BranchId;
  month: string; // YYYY-MM
  baseSalary: number;
  allowances: number;
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  deductions: number;
  deductionReason?: string;
  netPayable: number;
  status: 'draft' | 'approved' | 'paid';
  paymentMode?: PaymentMode | 'bank_transfer';
  paymentRef?: string;
  disbursedDate?: string;
  disbursedBy?: string;
  timestamp: number;
}

// ==========================================
// 5. LMS, IMS & ERP TYPES
// ==========================================
export interface SyllabusModule {
  id: string;
  courseId: string;
  moduleName: string;
  topics: string[];
  totalHours: number;
  order: number;
}

export interface StudyMaterial {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  fileType: 'pdf' | 'link' | 'video' | 'notes';
  url: string;
  uploadedBy: string;
  date: string;
  timestamp: number;
}

export interface InventoryItem {
  id: string;
  branchId: BranchId;
  itemName: string;
  category: 'pc_hardware' | 'furniture' | 'books_kits' | 'electronics' | 'office_supplies';
  serialNumber?: string;
  quantity: number;
  availableQuantity: number;
  condition: 'working' | 'maintenance' | 'scrap';
  purchaseDate?: string;
  assignedTo?: string;
  timestamp: number;
}

export interface CampusNotice {
  id: string;
  title: string;
  content: string;
  targetRole: 'all' | 'staff' | 'student' | 'manager';
  branchId: 'all' | BranchId;
  priority: 'info' | 'warning' | 'urgent';
  postedBy: string;
  date: string;
  expiresAt?: string;
  timestamp: number;
}
