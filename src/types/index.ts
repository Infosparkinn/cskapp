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
