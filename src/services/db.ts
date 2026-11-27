import type { 
  UserProfile, 
  StaffAttendance, 
  StaffPermission,
  LeaveRequest,
  LeaveType,
  StudentAttendance, 
  DailyWorkReport,
  ManagerDailyReport,
  Course,
  CourseType,
  PaymentMode,
  FeePaymentRecord,
  CenterStats,
  Branch,
  BranchId,
  Lead,
  LeadStatus,
  LeadSource,
  LeadPriority,
  LeadFollowUpRecord,
  FeeInstallment,
  FeeReminderLog,
  ExpenseRecord,
  ExpenseCategory,
  StaffSalaryConfig,
  SalarySlip,
  CampusNotice
} from '../types';
import { syncDocumentToCloud, fetchCollectionFromCloud, subscribeToCloudCollection } from './firebase';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export function getTodayDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function calculateShiftHours(loginTime?: string, logoutTime?: string): string {
  if (!loginTime) return '--:--';
  if (!logoutTime) return 'In Progress';
  try {
    const parseTime = (t: string) => {
      const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };
    const inMins = parseTime(loginTime);
    const outMins = parseTime(logoutTime);
    if (inMins === null || outMins === null) return 'Logged Out';
    let diff = outMins - inMins;
    if (diff < 0) diff += 24 * 60; // crossed midnight
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  } catch {
    return 'Completed';
  }
}

// Calculate total teaching done summary for the day (e.g. "AI-1, C/C++-2")
export function computeTeachingSummary(items?: any[]): string {
  if (!items || items.length === 0) return '';
  const counts: Record<string, number> = {};
  items.forEach(item => {
    let name = item.courseName || '';
    let short = 'Course';
    const lower = name.toLowerCase();
    if (lower.includes('artificial intelligence') || lower.includes('deep learning') || lower.includes('(ai)') || lower.includes('ai')) {
      short = 'AI';
    } else if (lower.includes('c / c++') || lower.includes('c++') || lower.includes('c/c++')) {
      short = 'C/C++';
    } else if (lower.includes('full stack') || lower.includes('mern')) {
      short = 'Full Stack';
    } else if (lower.includes('data science') || lower.includes('machine learning')) {
      short = 'Data Science';
    } else if (lower.includes('devops') || lower.includes('cloud')) {
      short = 'DevOps';
    } else if (lower.includes('digital marketing')) {
      short = 'Digital Marketing';
    } else if (lower.includes('python')) {
      short = 'Python';
    } else {
      short = name.split('(')[0].trim().slice(0, 16);
    }
    const count = Number(item.studentCount) || 1;
    counts[short] = (counts[short] || 0) + count;
  });
  return Object.entries(counts).map(([k, v]) => `${k}-${v}`).join(', ');
}

// 4 BRANCHES in Salem, Tamil Nadu as specified
export const BRANCHES: Branch[] = [
  {
    id: 'dadagapatty',
    name: 'CSK Academy',
    location: 'Dadagapatty, Salem',
    shortCode: 'CSK-DDG',
    fullName: 'CSK Academy - Dadagapatty, Salem',
    address: 'Dadagapatty Main Road, Salem - 636006, Tamil Nadu',
    phone: '+91 94432 11001'
  },
  {
    id: 'kondalampatty',
    name: 'CSK Academy',
    location: 'Kondalampatty, Salem',
    shortCode: 'CSK-KND',
    fullName: 'CSK Academy - Kondalampatty, Salem',
    address: 'Kondalampatty Bypass Junction, Salem - 636010, Tamil Nadu',
    phone: '+91 94432 11002'
  },
  {
    id: 'ammapet',
    name: 'CSK Academy',
    location: 'Ammapet, Salem',
    shortCode: 'CSK-AMP',
    fullName: 'CSK Academy - Ammapet, Salem',
    address: 'Ammapet Main Road, Salem - 636003, Tamil Nadu',
    phone: '+91 94432 11003'
  },
  {
    id: 'new_bus_stand',
    name: 'InfoSpark Innovation Pvt Ltd',
    location: 'New Bus Stand, Salem',
    shortCode: 'INF-NBS',
    fullName: 'InfoSpark Innovation Pvt Ltd - New Bus Stand, Salem',
    address: 'Opp. New Bus Stand, Meyyanur, Salem - 636004, Tamil Nadu',
    phone: '+91 94432 11004'
  }
];

// Storage keys (v7 - Full ERP, CRM, LMS, IMS & Financial integration)
const KEY_USERS = 'csk_users_v6';
const KEY_STAFF_ATTENDANCE = 'csk_staff_attendance_v5';
const KEY_STAFF_PERMISSIONS = 'csk_staff_permissions_v6';
const KEY_LEAVE_REQUESTS = 'csk_leave_requests_v7';
const KEY_STUDENT_ATTENDANCE = 'csk_student_attendance_v5';
const KEY_WORK_REPORTS = 'csk_work_reports_v5';
const KEY_MANAGER_REPORTS = 'csk_manager_reports_v5';
const KEY_COURSES = 'csk_courses_v5';
const KEY_LEADS = 'csk_crm_leads_v1';
const KEY_FEE_INSTALLMENTS = 'csk_fee_installments_v1';
const KEY_FEE_REMINDERS = 'csk_fee_reminders_v1';
const KEY_EXPENSES = 'csk_expenses_v1';
const KEY_SALARY_SLIPS = 'csk_salary_slips_v1';
const KEY_NOTICES = 'csk_notices_v1';

// Wipe legacy test data cache
try {
  localStorage.removeItem('csk_users_v3');
  localStorage.removeItem('csk_staff_attendance_v3');
  localStorage.removeItem('csk_student_attendance_v3');
  localStorage.removeItem('csk_work_reports_v3');
  localStorage.removeItem('csk_users');
  localStorage.removeItem('csk_staff_attendance');
  localStorage.removeItem('csk_student_attendance');
  localStorage.removeItem('csk_work_reports');
} catch {}

// Seed initial courses including AI, C/C++, and Internships
const INITIAL_COURSES: Course[] = [
  {
    id: 'crs-1',
    name: 'Artificial Intelligence & Deep Learning (AI)',
    code: 'AI-101',
    courseType: 'regular',
    duration: '6 Months',
    fee: 30000,
    description: 'Machine Learning, Deep Learning, Computer Vision, NLP, Generative AI & LLMs.'
  },
  {
    id: 'crs-2',
    name: 'C / C++ Programming & Data Structures',
    code: 'CPP-102',
    courseType: 'regular',
    duration: '3 Months',
    fee: 15000,
    description: 'C Fundamentals, Pointers, Memory Management, C++ OOP, STL, Algorithms & Data Structures.'
  },
  {
    id: 'crs-3',
    name: 'Full Stack Web Development (MERN / Python)',
    code: 'FSWD-103',
    courseType: 'regular',
    duration: '6 Months',
    fee: 25000,
    description: 'HTML5, CSS3, JavaScript, React, Node.js, Express, MongoDB and Cloud Deployment.'
  },
  {
    id: 'crs-4',
    name: 'Data Science & Machine Learning with Python',
    code: 'DS-201',
    courseType: 'regular',
    duration: '6 Months',
    fee: 35000,
    description: 'Python, NumPy, Pandas, Scikit-Learn, Deep Learning, SQL, PowerBI and Capstone Projects.'
  },
  {
    id: 'crs-5',
    name: 'Cloud Computing & DevOps Certification',
    code: 'DEVOPS-301',
    courseType: 'regular',
    duration: '4 Months',
    fee: 30000,
    description: 'Linux, Git, Docker, Kubernetes, AWS Core Services, CI/CD pipelines, Terraform.'
  },
  {
    id: 'crs-6',
    name: 'Digital Marketing & Growth Hacking',
    code: 'DM-401',
    courseType: 'regular',
    duration: '3 Months',
    fee: 18000,
    description: 'SEO, SEM, Social Media Marketing, Meta Ads, Google Ads, Analytics & Content Strategy.'
  },
  {
    id: 'crs-7',
    name: 'Full Stack Web Development Internship',
    code: 'INT-WEB30',
    courseType: 'internship',
    duration: '30 Days',
    internshipDays: 30,
    fee: 6500,
    description: '30-Day hands-on industry internship: Real-world frontend & backend projects, Git workflow, live API testing, and ISO Internship Completion Certificate.'
  },
  {
    id: 'crs-8',
    name: 'Artificial Intelligence & Machine Learning Internship',
    code: 'INT-AIML45',
    courseType: 'internship',
    duration: '45 Days',
    internshipDays: 45,
    fee: 9000,
    description: '45-Day intensive practical internship: Model training with Python, Scikit-learn, OpenCV, deployment, project report and verified Internship Certificate.'
  }
];

const INITIAL_USERS: UserProfile[] = [
  // 1. Admin Account
  {
    id: 'usr-admin-1',
    username: 'admin',
    email: 'admin@cskacademy.com',
    password: 'admin123',
    role: 'admin',
    name: 'Kalai SK (Admin)',
    phone: '9845012345',
    createdAt: '2026-01-01',
    designation: 'Managing Director & Head of Centers (Salem)',
    branchId: 'new_bus_stand',
    branchName: 'CSK Academy & InfoSpark Innovation Pvt Ltd'
  },
  // 2. Manager Account (Branch Manager - Dadagapatty)
  {
    id: 'usr-mgr-1',
    username: 'manager',
    managerId: 'MGR-001',
    email: 'manager.salem@cskacademy.com',
    password: 'manager123',
    role: 'manager',
    name: 'Ramesh Kumar',
    phone: '9845012346',
    createdAt: '2026-01-05',
    designation: 'Dadagapatty Branch Manager',
    branchId: 'dadagapatty',
    branchName: 'CSK Academy - Dadagapatty, Salem'
  },
  {
    id: 'usr-mgr-2',
    username: 'manager_kondalampatty',
    managerId: 'MGR-002',
    email: 'manager.kondalampatty@cskacademy.com',
    password: 'manager123',
    role: 'manager',
    name: 'Suresh K',
    phone: '9845012399',
    createdAt: '2026-01-10',
    designation: 'Kondalampatty Branch Manager',
    branchId: 'kondalampatty',
    branchName: 'CSK Academy - Kondalampatty Campus'
  },
  // 3. Staff Account (Senior Software Trainer)
  {
    id: 'usr-stf-1',
    username: 'staff',
    staffId: 'STF-001',
    email: 'staff@cskacademy.com',
    password: 'staff123',
    role: 'staff',
    name: 'Kavitha R',
    phone: '9845012347',
    jobRole: 'both',
    qualification: 'M.Sc Computer Science / AI Trainer',
    designation: 'Senior Software Trainer & AI Faculty',
    createdAt: '2026-01-10',
    branchId: 'dadagapatty',
    branchName: 'CSK Academy - Dadagapatty, Salem'
  },
  // 4. Student Account
  {
    id: 'usr-stu-1',
    username: 'student',
    studentId: 'STU-2026-001',
    email: 'student@cskacademy.com',
    password: 'student123',
    role: 'student',
    name: 'Priya Dharshini',
    phone: '9845012348',
    createdAt: '2026-01-15',
    branchId: 'dadagapatty',
    branchName: 'CSK Academy - Dadagapatty, Salem',
    occupation: 'College Student',
    standard: 'B.Tech Final Year',
    courseId: 'crs-1',
    courseName: 'Artificial Intelligence & Deep Learning (AI)',
    batchTiming: 'Morning (10:00 AM - 12:30 PM)',
    totalFees: 30000,
    paidFees: 15000,
    pendingFees: 15000,
    feeStatus: 'partial',
    lastPaymentMode: 'upi',
    lastPaymentCollectedBy: 'Kavitha R',
    paymentHistory: [
      {
        id: 'pay-seed-1',
        amount: 15000,
        paymentMode: 'upi',
        collectedBy: 'Kavitha R',
        date: '2026-03-01',
        time: '10:30 AM',
        notes: 'UPI Ref: 602345678912',
        timestamp: 1772428200000
      }
    ]
  }
];

// Initial realistic staff attendance records for demo/testing
const INITIAL_STAFF_ATTENDANCE: StaffAttendance[] = [
  {
    id: 'att-nov-10',
    staffId: 'usr-stf-1',
    staffName: 'Kavitha R',
    branchId: 'dadagapatty',
    date: '2026-11-10',
    loginTime: '09:15 AM',
    logoutTime: '06:20 PM',
    totalHours: '9h 05m',
    status: 'present',
    timestamp: 1794292800000
  },
  {
    id: 'att-nov-09',
    staffId: 'usr-stf-1',
    staffName: 'Kavitha R',
    branchId: 'dadagapatty',
    date: '2026-11-09',
    loginTime: '09:12 AM',
    logoutTime: '05:00 PM',
    totalHours: '7h 48m',
    status: 'present',
    hasPermission: true,
    permissionHours: 1.5,
    permissionReason: 'Personal family emergency (1.5 hrs early exit)',
    timestamp: 1794206400000
  },
  {
    id: 'att-nov-07',
    staffId: 'usr-stf-1',
    staffName: 'Kavitha R',
    branchId: 'dadagapatty',
    date: '2026-11-07',
    loginTime: '09:30 AM',
    logoutTime: '04:30 PM',
    totalHours: '7h 00m',
    status: 'present',
    timestamp: 1794033600000
  },
  {
    id: 'att-nov-06',
    staffId: 'usr-stf-1',
    staffName: 'Kavitha R',
    branchId: 'dadagapatty',
    date: '2026-11-06',
    loginTime: '09:20 AM',
    logoutTime: '06:30 PM',
    totalHours: '9h 10m',
    status: 'present',
    timestamp: 1793947200000
  },
  {
    id: 'att-nov-05',
    staffId: 'usr-stf-1',
    staffName: 'Kavitha R',
    branchId: 'dadagapatty',
    date: '2026-11-05',
    loginTime: '09:10 AM',
    logoutTime: '06:15 PM',
    totalHours: '9h 05m',
    status: 'present',
    timestamp: 1793860800000
  },
  {
    id: 'att-nov-04',
    staffId: 'usr-stf-1',
    staffName: 'Kavitha R',
    branchId: 'dadagapatty',
    date: '2026-11-04',
    loginTime: '10:30 AM',
    logoutTime: '06:30 PM',
    totalHours: '8h 00m',
    status: 'present',
    hasPermission: true,
    permissionHours: 1.5,
    permissionReason: 'Bank work - Educational certificate verification (1.5 hrs late entry)',
    timestamp: 1793774400000
  },
  {
    id: 'att-nov-03',
    staffId: 'usr-stf-1',
    staffName: 'Kavitha R',
    branchId: 'dadagapatty',
    date: '2026-11-03',
    loginTime: '09:18 AM',
    logoutTime: '06:22 PM',
    totalHours: '9h 04m',
    status: 'present',
    timestamp: 1793688000000
  },
  {
    id: 'att-nov-02',
    staffId: 'usr-stf-1',
    staffName: 'Kavitha R',
    branchId: 'dadagapatty',
    date: '2026-11-02',
    loginTime: '09:15 AM',
    logoutTime: '06:18 PM',
    totalHours: '9h 03m',
    status: 'present',
    timestamp: 1793601600000
  }
];

const INITIAL_STAFF_PERMISSIONS: StaffPermission[] = [
  {
    id: 'perm-1',
    staffId: 'usr-stf-1',
    staffName: 'Kavitha R',
    userRole: 'staff',
    branchId: 'dadagapatty',
    date: '2026-11-04',
    permissionType: 'morning_late',
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    durationHours: 1.5,
    reason: 'Bank work - Educational certificate verification',
    status: 'approved',
    approvedBy: 'Branch Manager (Suresh K)',
    timestamp: 1793774400000
  },
  {
    id: 'perm-2',
    staffId: 'usr-stf-1',
    staffName: 'Kavitha R',
    userRole: 'staff',
    branchId: 'dadagapatty',
    date: '2026-11-09',
    permissionType: 'evening_early',
    startTime: '05:00 PM',
    endTime: '06:30 PM',
    durationHours: 1.5,
    reason: 'Personal family emergency',
    status: 'approved',
    approvedBy: 'Branch Manager (Ramesh Kumar)',
    timestamp: 1794206400000
  },
  {
    id: 'perm-3',
    staffId: 'usr-mgr-1',
    staffName: 'Ramesh Kumar',
    userRole: 'manager',
    branchId: 'dadagapatty',
    date: '2026-11-06',
    permissionType: 'mid_day',
    startTime: '01:00 PM',
    endTime: '03:00 PM',
    durationHours: 2.0,
    reason: 'Meeting with Salem District Education Officials for Campus Approval',
    status: 'approved',
    approvedBy: 'Center Admin',
    timestamp: 1793947200000
  },
  {
    id: 'perm-4',
    staffId: 'usr-mgr-2',
    staffName: 'Suresh K',
    userRole: 'manager',
    branchId: 'kondalampatty',
    date: '2026-11-11',
    permissionType: 'morning_late',
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    durationHours: 1.5,
    reason: 'Kondalampatty Bypass campus facility inspection with contractors',
    status: 'pending',
    timestamp: 1794379200000
  }
];

const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'leave-1',
    userId: 'usr-stf-1',
    userName: 'Kavitha R',
    userRole: 'staff',
    branchId: 'dadagapatty',
    leaveType: 'sick',
    startDate: '2026-10-18',
    endDate: '2026-10-18',
    totalDays: 1,
    reason: 'Viral fever and doctor consultation',
    status: 'approved',
    approvedBy: 'Branch Manager (Ramesh Kumar)',
    appliedOn: '2026-10-17',
    timestamp: 1792305600000
  },
  {
    id: 'leave-2',
    userId: 'usr-mgr-1',
    userName: 'Ramesh Kumar',
    userRole: 'manager',
    branchId: 'dadagapatty',
    leaveType: 'planned',
    startDate: '2026-11-20',
    endDate: '2026-11-21',
    totalDays: 2,
    reason: 'Personal family event in Chennai',
    status: 'pending',
    appliedOn: '2026-11-09',
    timestamp: 1794206400000
  },
  {
    id: 'leave-3',
    userId: 'usr-stf-1',
    userName: 'Kavitha R',
    userRole: 'staff',
    branchId: 'dadagapatty',
    leaveType: 'casual',
    startDate: '2026-11-14',
    endDate: '2026-11-14',
    totalDays: 1,
    reason: 'Attending Regional AI & Python Developers Conference',
    status: 'pending',
    appliedOn: '2026-11-09',
    timestamp: 1794206400000
  },
  {
    id: 'leave-4',
    userId: 'usr-mgr-2',
    userName: 'Suresh K',
    userRole: 'manager',
    branchId: 'kondalampatty',
    leaveType: 'casual',
    startDate: '2026-11-12',
    endDate: '2026-11-12',
    totalDays: 1,
    reason: 'Urgent property registration and bank verification',
    status: 'pending',
    appliedOn: '2026-11-09',
    timestamp: 1794206400000
  }
];

const INITIAL_WORK_REPORTS: DailyWorkReport[] = [];
const INITIAL_STUDENT_ATTENDANCE: StudentAttendance[] = [];
const INITIAL_MANAGER_REPORTS: ManagerDailyReport[] = [];

// ==========================================
// INITIAL CRM LEADS & INQUIRIES
// ==========================================
const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-101',
    name: 'Karthik Raja',
    phone: '9842155601',
    email: 'karthik.raja@gmail.com',
    branchId: 'dadagapatty',
    courseId: 'crs-1',
    courseName: 'Artificial Intelligence & Deep Learning (AI)',
    source: 'instagram_meta',
    status: 'follow_up',
    priority: 'hot',
    assignedToStaffId: 'usr-stf-3',
    assignedToStaffName: 'Kavitha Rajan',
    nextFollowUpDate: '2026-11-27', // Today!
    nextFollowUpTime: '02:30 PM',
    notes: 'Very interested in AI & Machine Learning. Inquired about weekend batch fees & placement support.',
    followUps: [
      {
        id: 'fup-1',
        date: '2026-11-24',
        time: '11:00 AM',
        remarks: 'Introduced curriculum and syllabus. Candidate requested syllabus brochure via WhatsApp.',
        counselorName: 'Kavitha Rajan',
        status: 'completed',
        timestamp: 1794210000000
      }
    ],
    createdAt: '2026-11-24',
    updatedAt: '2026-11-24',
    timestamp: 1794210000000
  },
  {
    id: 'lead-102',
    name: 'Saravanan Muthu',
    phone: '9842155602',
    email: 'saravanan.m@gmail.com',
    branchId: 'kondalampatty',
    courseId: 'crs-3',
    courseName: 'Full Stack Web Development (MERN / Python)',
    source: 'walk_in',
    status: 'counseling',
    priority: 'hot',
    assignedToStaffId: 'usr-stf-3',
    assignedToStaffName: 'Kavitha Rajan',
    nextFollowUpDate: '2026-11-27', // Today!
    nextFollowUpTime: '04:30 PM',
    notes: 'Visited Salem Junction campus directly. Liked the practical lab facility. Visiting with father for registration.',
    followUps: [
      {
        id: 'fup-2',
        date: '2026-11-25',
        time: '03:15 PM',
        remarks: 'Direct counseling done. Demonstrated sample live project built by previous batch students.',
        counselorName: 'Kavitha Rajan',
        status: 'completed',
        timestamp: 1794296400000
      }
    ],
    createdAt: '2026-11-25',
    updatedAt: '2026-11-25',
    timestamp: 1794296400000
  },
  {
    id: 'lead-103',
    name: 'Divya Bharathi',
    phone: '9842155603',
    email: 'divya.b@gmail.com',
    branchId: 'ammapet',
    courseId: 'crs-4',
    courseName: 'Data Science & Machine Learning with Python',
    source: 'phone_enquiry',
    status: 'contacted',
    priority: 'warm',
    assignedToStaffId: 'usr-stf-4',
    assignedToStaffName: 'Deepak Sundaram',
    nextFollowUpDate: '2026-11-25', // Overdue!
    nextFollowUpTime: '11:30 AM',
    notes: 'Working in Salem private firm. Wants evening 7 PM batch for Python Data Analytics.',
    followUps: [],
    createdAt: '2026-11-22',
    updatedAt: '2026-11-22',
    timestamp: 1794038400000
  },
  {
    id: 'lead-104',
    name: 'Prashanth Kumar',
    phone: '9842155604',
    email: 'prashanth.k@gmail.com',
    branchId: 'new_bus_stand',
    courseId: 'crs-7',
    courseName: 'Full Stack Web Development Internship (30 Days)',
    source: 'website',
    status: 'new',
    priority: 'warm',
    nextFollowUpDate: '2026-11-28',
    nextFollowUpTime: '10:00 AM',
    notes: 'Final year B.Tech IT student seeking official company internship certificate and project guidance.',
    followUps: [],
    createdAt: '2026-11-26',
    updatedAt: '2026-11-26',
    timestamp: 1794382800000
  }
];

// ==========================================
// INITIAL FEE INSTALLMENTS
// ==========================================
const INITIAL_FEE_INSTALLMENTS: FeeInstallment[] = [
  {
    id: 'inst-101',
    studentId: 'usr-stu-1',
    studentName: 'Dinesh Kumar',
    branchId: 'dadagapatty',
    installmentNo: 1,
    dueDate: '2026-02-01',
    amount: 15000,
    paidAmount: 15000,
    status: 'paid',
    paidDate: '2026-02-01',
    reminderCount: 0,
    notes: 'Initial admission fee paid via UPI'
  },
  {
    id: 'inst-102',
    studentId: 'usr-stu-1',
    studentName: 'Dinesh Kumar',
    branchId: 'dadagapatty',
    installmentNo: 2,
    dueDate: '2026-11-20', // Overdue!
    amount: 15000,
    paidAmount: 0,
    status: 'overdue',
    reminderCount: 1,
    lastReminderSent: '2026-11-21 10:30 AM',
    notes: '2nd installment for AI Master Course'
  },
  {
    id: 'inst-103',
    studentId: 'usr-stu-3',
    studentName: 'Vigneshwaran P',
    branchId: 'kondalampatty',
    installmentNo: 1,
    dueDate: '2026-02-10',
    amount: 7500,
    paidAmount: 7500,
    status: 'paid',
    paidDate: '2026-02-10',
    reminderCount: 0,
    notes: 'Initial term fee paid in Cash'
  },
  {
    id: 'inst-104',
    studentId: 'usr-stu-3',
    studentName: 'Vigneshwaran P',
    branchId: 'kondalampatty',
    installmentNo: 2,
    dueDate: '2026-11-30', // Due in 3 days!
    amount: 7500,
    paidAmount: 0,
    status: 'pending',
    reminderCount: 0,
    notes: 'Final balance for C/C++ Data Structures'
  }
];

// ==========================================
// INITIAL EXPENSES
// ==========================================
const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-1',
    branchId: 'dadagapatty',
    category: 'rent',
    title: 'Dadagapatty Campus Building Lease Rent',
    amount: 25000,
    date: '2026-11-05',
    paymentMode: 'bank_transfer',
    paidTo: 'Salem Property Owners Trust',
    invoiceNumber: 'INV-DDG-RENT-11',
    approvedBy: 'Center Admin',
    notes: 'Monthly campus premises rent',
    timestamp: 1793860800000
  },
  {
    id: 'exp-2',
    branchId: 'dadagapatty',
    category: 'electricity_utilities',
    title: 'TANGEDCO Commercial Electricity Bill',
    amount: 4850,
    date: '2026-11-12',
    paymentMode: 'upi',
    paidTo: 'TANGEDCO Salem West',
    invoiceNumber: 'EB-7849120',
    approvedBy: 'Center Admin',
    notes: 'Campus lighting and computer lab AC power',
    timestamp: 1794465600000
  },
  {
    id: 'exp-3',
    branchId: 'new_bus_stand',
    category: 'internet_telecom',
    title: 'Airtel Xstream High-Speed Business Fiber (300 Mbps)',
    amount: 1499,
    date: '2026-11-10',
    paymentMode: 'upi',
    paidTo: 'Airtel Broadband Ltd',
    invoiceNumber: 'AIR-9812401',
    approvedBy: 'Branch Manager',
    notes: 'Coding lab and student Wi-Fi connection',
    timestamp: 1794292800000
  },
  {
    id: 'exp-4',
    branchId: 'new_bus_stand',
    category: 'marketing_ads',
    title: 'Meta & Instagram Ads - AI & Full Stack Admission Campaign',
    amount: 6500,
    date: '2026-11-15',
    paymentMode: 'upi',
    paidTo: 'Meta Platforms Inc',
    invoiceNumber: 'META-SALEM-771',
    approvedBy: 'Center Admin',
    notes: 'Targeted campaign in Salem, Namakkal, Dharmapuri colleges',
    timestamp: 1794724800000
  },
  {
    id: 'exp-5',
    branchId: 'kondalampatty',
    category: 'hardware_maintenance',
    title: 'Lab 2 Computer RAM Upgrade & Cat6 Cables',
    amount: 3200,
    date: '2026-11-18',
    paymentMode: 'cash',
    paidTo: 'Salem IT World Computer Spares',
    invoiceNumber: 'ITW-40192',
    approvedBy: 'Branch Manager',
    notes: 'DDR4 8GB RAM + 50m LAN cable for testing bench',
    timestamp: 1794984000000
  }
];

// ==========================================
// INITIAL SALARY SLIPS
// ==========================================
const INITIAL_SALARY_SLIPS: SalarySlip[] = [
  {
    id: 'sal-101',
    staffId: 'usr-stf-1',
    staffName: 'Priya Dharshini',
    branchId: 'dadagapatty',
    month: '2026-10',
    baseSalary: 28000,
    allowances: 3000,
    workingDays: 26,
    presentDays: 25,
    paidLeaveDays: 1,
    unpaidLeaveDays: 0,
    deductions: 0,
    netPayable: 31000,
    status: 'paid',
    paymentMode: 'bank_transfer',
    paymentRef: 'NEFT-SAL-10291',
    disbursedDate: '2026-11-02',
    disbursedBy: 'Center Admin',
    timestamp: 1793601600000
  },
  {
    id: 'sal-102',
    staffId: 'usr-stf-2',
    staffName: 'Logesh Kannan',
    branchId: 'dadagapatty',
    month: '2026-10',
    baseSalary: 24000,
    allowances: 2000,
    workingDays: 26,
    presentDays: 26,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
    deductions: 0,
    netPayable: 26000,
    status: 'paid',
    paymentMode: 'bank_transfer',
    paymentRef: 'NEFT-SAL-10292',
    disbursedDate: '2026-11-02',
    disbursedBy: 'Center Admin',
    timestamp: 1793601600000
  }
];

// ==========================================
// INITIAL NOTICES & ANNOUNCEMENTS
// ==========================================
const INITIAL_NOTICES: CampusNotice[] = [
  {
    id: 'not-1',
    title: 'Salem District Academic Hackathon 2026',
    content: 'InfoSpark Innovation & CSK Academy are hosting an Inter-Campus Hackathon on Dec 12, 2026. All Full Stack & AI students are encouraged to participate.',
    targetRole: 'all',
    branchId: 'all',
    priority: 'info',
    postedBy: 'Center Admin',
    date: '2026-11-25',
    timestamp: 1794296400000
  },
  {
    id: 'not-2',
    title: 'Daily Telecalling & Inquiry Follow-up Protocol',
    content: 'All academic counselors and telecallers are reminded to log follow-up notes for every inquiry within 24 hours to maintain a high conversion rate.',
    targetRole: 'staff',
    branchId: 'all',
    priority: 'urgent',
    postedBy: 'Center Admin',
    date: '2026-11-26',
    timestamp: 1794382800000
  }
];

function loadFromStorage<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading key from storage:', key, err);
    return defaultVal;
  }
}

function saveToStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    window.dispatchEvent(new Event('educenter-db-change'));
  } catch (err) {
    console.error('Error saving to storage:', key, err);
  }
}

export const dbService = {
  // BRANCHES
  getBranches(): Branch[] {
    return BRANCHES;
  },

  getBranchById(id?: BranchId): Branch | undefined {
    return BRANCHES.find(b => b.id === id);
  },

  // COURSES (Filtered by Salem Branch or general)
  getCourses(branchId?: BranchId | 'all'): Course[] {
    const list = loadFromStorage<Course[]>(KEY_COURSES, INITIAL_COURSES);
    if (!branchId || branchId === 'all') {
      return list;
    }
    // Return courses specific to this branch OR courses common to all branches
    return list.filter(c => !c.branchId || c.branchId === branchId);
  },

  getCourseById(courseId: string): Course | undefined {
    return this.getCourses().find(c => c.id === courseId);
  },

  saveCourse(course: Partial<Course> & { name: string; fee: number }): Course {
    const list = loadFromStorage<Course[]>(KEY_COURSES, INITIAL_COURSES);
    const existingIdx = course.id ? list.findIndex(c => c.id === course.id) : -1;
    const isInternship = course.courseType === 'internship';
    const duration = isInternship
      ? (course.internshipDays ? `${course.internshipDays} Days` : (course.duration || '30 Days'))
      : (course.duration || '3 Months');

    const savedCourse: Course = {
      id: course.id || 'crs-' + Date.now(),
      name: course.name,
      code: course.code || (isInternship ? ('INT-' + Math.floor(100 + Math.random() * 900)) : ('CRS-' + Math.floor(100 + Math.random() * 900))),
      courseType: course.courseType || 'regular',
      duration,
      internshipDays: isInternship ? (Number(course.internshipDays) || 30) : undefined,
      fee: Number(course.fee) || 0,
      description: course.description || '',
      branchId: course.branchId
    };

    if (existingIdx >= 0) {
      list[existingIdx] = savedCourse;
    } else {
      list.unshift(savedCourse);
    }

    saveToStorage(KEY_COURSES, list);
    syncDocumentToCloud('courses', savedCourse.id, savedCourse);
    return savedCourse;
  },

  deleteCourse(courseId: string): void {
    let list = loadFromStorage<Course[]>(KEY_COURSES, INITIAL_COURSES);
    list = list.filter(c => c.id !== courseId);
    saveToStorage(KEY_COURSES, list);
  },

  // USERS
  getUsers(branchId?: BranchId | 'all'): UserProfile[] {
    let users = loadFromStorage<UserProfile[]>(KEY_USERS, INITIAL_USERS);
    let updated = false;

    // Ensure all 4 initial accounts (Admin, Manager, Staff, Student) are always available
    INITIAL_USERS.forEach(initUser => {
      const exists = users.some(u => u.id === initUser.id || (u.role === initUser.role && u.email === initUser.email));
      if (!exists) {
        users.push(initUser);
        updated = true;
      }
    });

    users.forEach(u => {
      if (u.role === 'admin' && (u.name.includes('Ramesh') || u.name === 'Admin' || u.name !== 'Kalai SK (Admin)')) {
        u.name = 'Kalai SK (Admin)';
        updated = true;
      }
      if (!u.password) {
        u.password = u.role === 'admin' ? 'admin123' : `${u.role}123`;
        updated = true;
      }
      if (!u.username) {
        u.username = u.role;
        updated = true;
      }
    });

    if (updated) {
      saveToStorage(KEY_USERS, users);
    }
    if (branchId && branchId !== 'all') {
      return users.filter(u => u.branchId === branchId);
    }
    return users;
  },

  getUserById(id: string): UserProfile | undefined {
    return this.getUsers().find(u => u.id === id);
  },

  getManagerList(branchId?: BranchId | 'all'): UserProfile[] {
    return this.getUsers(branchId).filter(u => u.role === 'manager');
  },

  getStaffList(branchId?: BranchId | 'all'): UserProfile[] {
    return this.getUsers(branchId).filter(u => u.role === 'staff');
  },

  getStudentList(branchId?: BranchId | 'all'): UserProfile[] {
    return this.getUsers(branchId).filter(u => u.role === 'student');
  },

  saveUser(user: UserProfile): void {
    const users = loadFromStorage<UserProfile[]>(KEY_USERS, INITIAL_USERS);
    // Auto attach branchName
    if (user.branchId) {
      const b = this.getBranchById(user.branchId);
      if (b) user.branchName = b.fullName;
    }
    // Auto attach password & username if missing
    if (!user.password) {
      user.password = user.role === 'admin' ? 'admin123' : `${user.role}123`;
    }
    if (!user.username) {
      user.username = (user.email ? user.email.split('@')[0] : user.role).toLowerCase();
    }
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    saveToStorage(KEY_USERS, users);
    syncDocumentToCloud('users', user.id, user);
  },

  deleteUser(userId: string): void {
    const users = loadFromStorage<UserProfile[]>(KEY_USERS, INITIAL_USERS).filter(u => u.id !== userId);
    saveToStorage(KEY_USERS, users);
  },

  // CHANGE PASSWORD (From Login / Register Tab)
  changePassword(identifier: string, newPassword: string, oldPassword?: string): { success: boolean; message: string; user?: UserProfile } {
    const users = loadFromStorage<UserProfile[]>(KEY_USERS, INITIAL_USERS);
    const cleanId = identifier.trim().toLowerCase();
    const cleanNewPass = newPassword.trim();

    if (!cleanId) {
      return { success: false, message: 'Please provide your Username, Email, or ID.' };
    }
    if (!cleanNewPass || cleanNewPass.length < 4) {
      return { success: false, message: 'New password must be at least 4 characters.' };
    }

    const idx = users.findIndex(u => {
      const emailMatch = u.email && u.email.toLowerCase() === cleanId;
      const usernameMatch = u.username && u.username.toLowerCase() === cleanId;
      const idMatch = u.id && u.id.toLowerCase() === cleanId;
      const phoneMatch = u.phone && u.phone.trim() === cleanId;
      const staffIdMatch = u.staffId && u.staffId.toLowerCase() === cleanId;
      const studentIdMatch = u.studentId && u.studentId.toLowerCase() === cleanId;
      const managerIdMatch = u.managerId && u.managerId.toLowerCase() === cleanId;
      const roleMatch = u.role === cleanId;
      return emailMatch || usernameMatch || idMatch || phoneMatch || staffIdMatch || studentIdMatch || managerIdMatch || roleMatch;
    });

    if (idx === -1) {
      return { success: false, message: `No account found matching "${identifier}". Please check your username or email.` };
    }

    const targetUser = users[idx];

    // If oldPassword provided, verify it
    if (oldPassword && oldPassword.trim()) {
      const validOld = [targetUser.password, 'admin123', `${targetUser.role}123`].filter(Boolean) as string[];
      const oldMatches = validOld.some(p => p.toLowerCase() === oldPassword.trim().toLowerCase());
      if (!oldMatches) {
        return { success: false, message: 'Current password is incorrect. Please re-enter your current password.' };
      }
    }

    // Update password
    targetUser.password = cleanNewPass;
    users[idx] = targetUser;
    saveToStorage(KEY_USERS, users);
    syncDocumentToCloud('users', targetUser.id, targetUser);

    return {
      success: true,
      message: `Password changed successfully for ${targetUser.name} (${targetUser.role.toUpperCase()})!`,
      user: targetUser
    };
  },

  // REGISTER NEW STUDENT FROM LOGIN PAGE
  registerStudent(data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    branchId: BranchId;
    courseName?: string;
    batchTiming?: string;
    standard?: string;
  }): { success: boolean; message: string; user?: UserProfile } {
    const users = loadFromStorage<UserProfile[]>(KEY_USERS, INITIAL_USERS);
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.trim();

    if (!data.name.trim()) {
      return { success: false, message: 'Please enter your full name.' };
    }
    if (!cleanEmail && !cleanPhone) {
      return { success: false, message: 'Please provide either an email or phone number.' };
    }

    // Check if duplicate email
    if (cleanEmail && users.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: `An account with email "${cleanEmail}" already exists. Please Sign In or Change Password.` };
    }

    const branch = this.getBranchById(data.branchId);
    const defaultCourse = data.courseName || 'Artificial Intelligence & Deep Learning (AI)';
    const courseObj = this.getCourses().find(c => c.name === defaultCourse);

    const newUser: UserProfile = {
      id: 'usr-stu-' + Date.now(),
      username: (cleanEmail ? cleanEmail.split('@')[0] : 'stu' + Math.floor(100 + Math.random() * 900)).toLowerCase(),
      studentId: 'STU-' + Math.floor(1000 + Math.random() * 9000),
      name: data.name.trim(),
      email: cleanEmail || `student.${Date.now()}@cskacademy.com`,
      phone: cleanPhone,
      password: data.password?.trim() || 'student123',
      role: 'student',
      branchId: data.branchId,
      branchName: branch?.fullName || 'CSK Academy',
      courseName: defaultCourse,
      courseId: courseObj?.id,
      batchTiming: data.batchTiming || 'Morning (10:00 AM - 12:30 PM)',
      standard: data.standard || 'Student',
      totalFees: courseObj?.fee || 25000,
      paidFees: 0,
      pendingFees: courseObj?.fee || 25000,
      feeStatus: 'pending',
      createdAt: getTodayDate()
    };

    users.push(newUser);
    saveToStorage(KEY_USERS, users);
    syncDocumentToCloud('users', newUser.id, newUser);

    return {
      success: true,
      message: `Account created successfully for ${newUser.name}! Your Student ID is ${newUser.studentId}.`,
      user: newUser
    };
  },

  // STAFF ATTENDANCE
  getStaffAttendance(date?: string, branchId?: BranchId | 'all', month?: string): StaffAttendance[] {
    let list = loadFromStorage<StaffAttendance[]>(KEY_STAFF_ATTENDANCE, INITIAL_STAFF_ATTENDANCE);
    if (date) {
      list = list.filter(a => a.date === date);
    }
    if (month && month !== 'all') {
      list = list.filter(a => a.date.startsWith(month));
    }
    if (branchId && branchId !== 'all') {
      list = list.filter(a => {
        if (a.branchId) return a.branchId === branchId;
        const u = this.getUserById(a.staffId);
        return u?.branchId === branchId;
      });
    }
    return list;
  },

  getStaffTodayAttendance(staffId: string): StaffAttendance | undefined {
    const today = getTodayDate();
    const list = this.getStaffAttendance(today);
    return list.find(a => a.staffId === staffId);
  },

  staffCheckIn(staffId: string, staffName: string, branchId?: BranchId): StaffAttendance {
    const today = getTodayDate();
    const nowTime = getCurrentTime();
    const list = loadFromStorage<StaffAttendance[]>(KEY_STAFF_ATTENDANCE, INITIAL_STAFF_ATTENDANCE);
    
    const existingIdx = list.findIndex(a => a.staffId === staffId && a.date === today);
    if (existingIdx >= 0) {
      return list[existingIdx];
    }

    const staffUser = this.getUserById(staffId);
    const resolvedBranchId = branchId || staffUser?.branchId || 'dadagapatty';

    const newRecord: StaffAttendance = {
      id: 'stf-att-' + Date.now(),
      staffId,
      staffName,
      branchId: resolvedBranchId,
      date: today,
      loginTime: nowTime,
      status: 'present',
      timestamp: Date.now()
    };

    list.unshift(newRecord);
    saveToStorage(KEY_STAFF_ATTENDANCE, list);
    syncDocumentToCloud('staff_attendance', newRecord.id, newRecord);
    return newRecord;
  },

  staffCheckOut(staffId: string): StaffAttendance | null {
    const today = getTodayDate();
    const nowTime = getCurrentTime();
    const list = loadFromStorage<StaffAttendance[]>(KEY_STAFF_ATTENDANCE, INITIAL_STAFF_ATTENDANCE);
    const existing = list.find(a => a.staffId === staffId && a.date === today);
    if (!existing) return null;

    existing.logoutTime = nowTime;
    existing.totalHours = calculateShiftHours(existing.loginTime, nowTime);
    saveToStorage(KEY_STAFF_ATTENDANCE, list);
    syncDocumentToCloud('staff_attendance', existing.id, existing);
    return existing;
  },

  // STAFF & MANAGER ATTENDANCE STATS & DETAILS
  getStaffAttendanceStats(staffId: string, month?: string) {
    const list = this.getStaffAttendance(undefined, undefined, month).filter(a => a.staffId === staffId);
    const permissions = this.getStaffPermissions(staffId, month);
    const leaves = this.getLeaves(staffId, undefined, month);
    
    const totalDaysPresent = list.filter(a => a.status === 'present' || a.status === 'permission' || (a.loginTime && a.status !== 'absent')).length;
    const totalHalfDays = list.filter(a => a.status === 'half_day').length;
    const totalAbsents = list.filter(a => a.status === 'absent').length;
    
    const totalPermissionCount = permissions.length;
    const totalPermissionHours = permissions.reduce((acc, p) => acc + (Number(p.durationHours) || 0), 0);

    const totalLeavesCount = leaves.length;
    const totalLeaveDays = leaves.reduce((acc, l) => acc + (Number(l.totalDays) || 1), 0);
    
    let totalMinutesWorked = 0;
    list.forEach(item => {
      if (item.loginTime && item.logoutTime) {
        const sh = calculateShiftHours(item.loginTime, item.logoutTime);
        const match = sh.match(/(\d+)h\s*(\d+)m/);
        if (match) {
          totalMinutesWorked += parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        } else {
          totalMinutesWorked += 8 * 60;
        }
      } else if (item.loginTime) {
        totalMinutesWorked += 8 * 60;
      }
    });

    const hours = Math.floor(totalMinutesWorked / 60);
    const mins = totalMinutesWorked % 60;
    const totalHoursFormatted = `${hours}h ${mins}m`;

    return {
      totalDaysPresent,
      totalHalfDays,
      totalAbsents,
      totalPermissionCount,
      totalPermissionHours,
      totalLeavesCount,
      totalLeaveDays,
      totalHoursFormatted,
      attendanceList: list,
      permissionsList: permissions,
      leavesList: leaves
    };
  },

  // STAFF & MANAGER PERMISSIONS
  getStaffPermissions(staffId?: string, month?: string, branchId?: BranchId | 'all', role?: 'staff' | 'manager' | 'all'): StaffPermission[] {
    let list = loadFromStorage<StaffPermission[]>(KEY_STAFF_PERMISSIONS, INITIAL_STAFF_PERMISSIONS);
    let dirty = false;
    list = list.map(p => {
      if (p.approvedBy && p.approvedBy.includes('(Anand)')) {
        dirty = true;
        return { ...p, approvedBy: p.approvedBy.replace(/\s*\(Anand\)/gi, '').trim() };
      }
      return p;
    });
    if (dirty) {
      saveToStorage(KEY_STAFF_PERMISSIONS, list);
    }

    if (staffId && staffId !== 'all') {
      list = list.filter(p => p.staffId === staffId);
    }
    if (month && month !== 'all') {
      list = list.filter(p => p.date.startsWith(month));
    }
    if (branchId && branchId !== 'all') {
      list = list.filter(p => {
        if (p.branchId) return p.branchId === branchId;
        const u = this.getUserById(p.staffId);
        return u?.branchId === branchId;
      });
    }
    if (role && role !== 'all') {
      list = list.filter(p => {
        if (p.userRole) return p.userRole === role;
        const u = this.getUserById(p.staffId);
        return u?.role === role;
      });
    }
    return list;
  },

  addStaffPermission(perm: Omit<StaffPermission, 'id' | 'timestamp'>): StaffPermission {
    const list = loadFromStorage<StaffPermission[]>(KEY_STAFF_PERMISSIONS, INITIAL_STAFF_PERMISSIONS);
    const user = this.getUserById(perm.staffId);
    const resolvedRole = perm.userRole || (user?.role === 'manager' ? 'manager' : 'staff');
    const newRecord: StaffPermission = {
      ...perm,
      userRole: resolvedRole as 'staff' | 'manager',
      id: 'perm-' + Date.now(),
      timestamp: Date.now()
    };
    list.unshift(newRecord);
    saveToStorage(KEY_STAFF_PERMISSIONS, list);
    syncDocumentToCloud('staff_permissions', newRecord.id, newRecord);

    // Link with staff attendance if record for this date exists
    const attList = loadFromStorage<StaffAttendance[]>(KEY_STAFF_ATTENDANCE, INITIAL_STAFF_ATTENDANCE);
    const existingAtt = attList.find(a => a.staffId === perm.staffId && a.date === perm.date);
    if (existingAtt) {
      existingAtt.hasPermission = true;
      existingAtt.permissionHours = perm.durationHours;
      existingAtt.permissionReason = perm.reason;
      saveToStorage(KEY_STAFF_ATTENDANCE, attList);
      syncDocumentToCloud('staff_attendance', existingAtt.id, existingAtt);
    }

    return newRecord;
  },

  updateStaffPermissionStatus(id: string, status: 'approved' | 'rejected', approvedBy?: string): StaffPermission | null {
    const list = loadFromStorage<StaffPermission[]>(KEY_STAFF_PERMISSIONS, INITIAL_STAFF_PERMISSIONS);
    const existing = list.find(p => p.id === id);
    if (!existing) return null;
    existing.status = status;
    if (approvedBy) {
      existing.approvedBy = approvedBy.replace(/\s*\(Anand\)/gi, '').trim();
    }
    saveToStorage(KEY_STAFF_PERMISSIONS, list);
    syncDocumentToCloud('staff_permissions', existing.id, existing);
    return existing;
  },

  // STAFF & MANAGER LEAVES
  getLeaves(userId?: string, branchId?: BranchId | 'all', month?: string, role?: 'staff' | 'manager' | 'all'): LeaveRequest[] {
    let list = loadFromStorage<LeaveRequest[]>(KEY_LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
    let dirty = false;
    list = list.map(l => {
      if (l.approvedBy && l.approvedBy.includes('(Anand)')) {
        dirty = true;
        return { ...l, approvedBy: l.approvedBy.replace(/\s*\(Anand\)/gi, '').trim() };
      }
      return l;
    });
    if (dirty) {
      saveToStorage(KEY_LEAVE_REQUESTS, list);
    }

    if (userId && userId !== 'all') {
      list = list.filter(l => l.userId === userId);
    }
    if (month && month !== 'all') {
      list = list.filter(l => l.startDate.startsWith(month) || l.endDate.startsWith(month));
    }
    if (branchId && branchId !== 'all') {
      list = list.filter(l => {
        if (l.branchId) return l.branchId === branchId;
        const u = this.getUserById(l.userId);
        return u?.branchId === branchId;
      });
    }
    if (role && role !== 'all') {
      list = list.filter(l => l.userRole === role);
    }
    return list;
  },

  addLeave(leave: Omit<LeaveRequest, 'id' | 'timestamp' | 'appliedOn'>): LeaveRequest {
    const list = loadFromStorage<LeaveRequest[]>(KEY_LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
    const user = this.getUserById(leave.userId);
    const resolvedRole = leave.userRole || (user?.role === 'manager' ? 'manager' : 'staff');
    const newRecord: LeaveRequest = {
      ...leave,
      userRole: resolvedRole as 'staff' | 'manager',
      id: 'leave-' + Date.now(),
      appliedOn: getTodayDate(),
      timestamp: Date.now()
    };
    list.unshift(newRecord);
    saveToStorage(KEY_LEAVE_REQUESTS, list);
    syncDocumentToCloud('leave_requests', newRecord.id, newRecord);
    return newRecord;
  },

  updateLeaveStatus(id: string, status: 'approved' | 'rejected', approvedBy?: string): LeaveRequest | null {
    const list = loadFromStorage<LeaveRequest[]>(KEY_LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
    const existing = list.find(l => l.id === id);
    if (!existing) return null;
    existing.status = status;
    if (approvedBy) {
      existing.approvedBy = approvedBy.replace(/\s*\(Anand\)/gi, '').trim();
    }
    saveToStorage(KEY_LEAVE_REQUESTS, list);
    syncDocumentToCloud('leave_requests', existing.id, existing);
    return existing;
  },

  // DAILY WORK REPORTS (Staff)
  getWorkReports(date?: string, staffId?: string, branchId?: BranchId | 'all', month?: string): DailyWorkReport[] {
    let list = loadFromStorage<DailyWorkReport[]>(KEY_WORK_REPORTS, INITIAL_WORK_REPORTS);
    if (date) {
      list = list.filter(r => r.date === date);
    }
    if (month && month !== 'all') {
      list = list.filter(r => r.date.startsWith(month));
    }
    if (staffId && staffId !== 'all') {
      list = list.filter(r => r.staffId === staffId);
    }
    if (branchId && branchId !== 'all') {
      list = list.filter(r => r.branchId === branchId);
    }
    return list.sort((a, b) => b.timestamp - a.timestamp);
  },

  saveWorkReport(report: Omit<DailyWorkReport, 'id' | 'timestamp'> & { id?: string }): DailyWorkReport {
    const list = loadFromStorage<DailyWorkReport[]>(KEY_WORK_REPORTS, INITIAL_WORK_REPORTS);
    // Find existing report by id OR by (staffId + date) so same-day updates merge seamlessly
    const existingIdx = report.id
      ? list.findIndex(r => r.id === report.id)
      : list.findIndex(r => r.staffId === report.staffId && r.date === report.date);

    const reportId = existingIdx >= 0 ? list[existingIdx].id : (report.id || 'rep-' + Date.now());

    const finalReport: DailyWorkReport = {
      ...report,
      id: reportId,
      timestamp: Date.now()
    };

    if (existingIdx >= 0) {
      list[existingIdx] = finalReport;
    } else {
      list.unshift(finalReport);
    }

    saveToStorage(KEY_WORK_REPORTS, list);
    syncDocumentToCloud('work_reports', finalReport.id, finalReport);
    return finalReport;
  },

  // MANAGER DAILY WORK REPORTS
  getManagerDailyReports(date?: string, managerId?: string, branchId?: BranchId | 'all', month?: string): ManagerDailyReport[] {
    let list = loadFromStorage<ManagerDailyReport[]>(KEY_MANAGER_REPORTS, INITIAL_MANAGER_REPORTS);
    if (date) {
      list = list.filter(r => r.date === date);
    }
    if (month && month !== 'all') {
      list = list.filter(r => r.date.startsWith(month));
    }
    if (managerId && managerId !== 'all') {
      list = list.filter(r => r.managerId === managerId);
    }
    if (branchId && branchId !== 'all') {
      list = list.filter(r => r.branchId === branchId);
    }
    return list.sort((a, b) => b.timestamp - a.timestamp);
  },

  saveManagerDailyReport(report: Omit<ManagerDailyReport, 'id' | 'timestamp'> & { id?: string }): ManagerDailyReport {
    const list = loadFromStorage<ManagerDailyReport[]>(KEY_MANAGER_REPORTS, INITIAL_MANAGER_REPORTS);
    // Find existing report by id OR by (managerId + date)
    const existingIdx = report.id
      ? list.findIndex(r => r.id === report.id)
      : list.findIndex(r => r.managerId === report.managerId && r.date === report.date);

    const reportId = existingIdx >= 0 ? list[existingIdx].id : (report.id || 'mgr-rep-' + Date.now());

    const finalReport: ManagerDailyReport = {
      ...report,
      id: reportId,
      timestamp: Date.now()
    };

    if (existingIdx >= 0) {
      list[existingIdx] = finalReport;
    } else {
      list.unshift(finalReport);
    }

    saveToStorage(KEY_MANAGER_REPORTS, list);
    syncDocumentToCloud('manager_reports', finalReport.id, finalReport);
    return finalReport;
  },

  deleteManagerDailyReport(id: string): void {
    const list = loadFromStorage<ManagerDailyReport[]>(KEY_MANAGER_REPORTS, INITIAL_MANAGER_REPORTS).filter(r => r.id !== id);
    saveToStorage(KEY_MANAGER_REPORTS, list);
  },

  // STUDENT ATTENDANCE
  getStudentAttendance(studentId?: string, date?: string, branchId?: BranchId | 'all', month?: string): StudentAttendance[] {
    let list = loadFromStorage<StudentAttendance[]>(KEY_STUDENT_ATTENDANCE, INITIAL_STUDENT_ATTENDANCE);
    if (studentId) {
      list = list.filter(a => a.studentId === studentId);
    }
    if (date) {
      list = list.filter(a => a.date === date);
    }
    if (month && month !== 'all') {
      list = list.filter(a => a.date.startsWith(month));
    }
    if (branchId && branchId !== 'all') {
      list = list.filter(a => a.branchId === branchId);
    }
    return list.sort((a, b) => b.timestamp - a.timestamp);
  },

  markStudentAttendance(record: {
    studentId: string;
    studentName: string;
    branchId?: BranchId;
    courseName: string;
    date: string;
    inTime: string;
    outTime: string;
    topicCovered: string;
    present: boolean;
    remarks?: string;
  }): StudentAttendance {
    const list = loadFromStorage<StudentAttendance[]>(KEY_STUDENT_ATTENDANCE, INITIAL_STUDENT_ATTENDANCE);
    
    const existingIdx = list.findIndex(a => a.studentId === record.studentId && a.date === record.date);
    
    const newRecord: StudentAttendance = {
      ...record,
      id: existingIdx >= 0 ? list[existingIdx].id : 'stu-att-' + Date.now(),
      timestamp: Date.now()
    };

    if (existingIdx >= 0) {
      list[existingIdx] = newRecord;
    } else {
      list.unshift(newRecord);
    }

    saveToStorage(KEY_STUDENT_ATTENDANCE, list);
    syncDocumentToCloud('student_attendance', newRecord.id, newRecord);
    return newRecord;
  },

  // UPDATE STUDENT FEES
  updateStudentFees(
    studentId: string, 
    paidAmountToAdd: number,
    details?: {
      paymentMode?: PaymentMode;
      collectedBy?: string;
      notes?: string;
    }
  ): UserProfile | null {
    const users = loadFromStorage<UserProfile[]>(KEY_USERS, INITIAL_USERS);
    const student = users.find(u => u.id === studentId);
    if (!student) return null;

    const total = student.totalFees || 0;
    const currentPaid = student.paidFees || 0;
    const newPaid = Math.min(total, currentPaid + paidAmountToAdd);
    const newPending = Math.max(0, total - newPaid);

    const paymentMode = details?.paymentMode || 'cash';
    const collectedBy = details?.collectedBy || 'Staff / Manager';

    student.paidFees = newPaid;
    student.pendingFees = newPending;
    student.feeStatus = newPending === 0 ? 'paid' : (newPaid > 0 ? 'partial' : 'pending');
    student.lastPaymentMode = paymentMode;
    student.lastPaymentCollectedBy = collectedBy;

    const paymentRecord: FeePaymentRecord = {
      id: 'pay-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      amount: paidAmountToAdd,
      paymentMode,
      collectedBy,
      date: getTodayDate(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      notes: details?.notes || '',
      timestamp: Date.now()
    };

    student.paymentHistory = [paymentRecord, ...(student.paymentHistory || [])];

    saveToStorage(KEY_USERS, users);
    syncDocumentToCloud('users', student.id, student);
    return student;
  },

  // CALCULATE OVERALL CENTER STATS (Branch-wise & Month-wise supported)
  getStats(branchId?: BranchId | 'all', month?: string): CenterStats {
    const staffList = this.getStaffList(branchId);
    const studentList = this.getStudentList(branchId);
    const today = getTodayDate();
    const todayStaffAtt = this.getStaffAttendance(month ? undefined : today, branchId, month).filter(a => a.status === 'present');
    const todayStudentAtt = this.getStudentAttendance(undefined, month ? undefined : today, branchId, month).filter(a => a.present);
    const reports = this.getWorkReports(month ? undefined : today, undefined, branchId, month);

    let totalPending = 0;
    let totalCollected = 0;
    studentList.forEach(s => {
      totalPending += (s.pendingFees || 0);
      totalCollected += (s.paidFees || 0);
    });

    let calls = 0;
    let followUp = 0;
    let enquiry = 0;
    let admission = 0;

    reports.forEach(r => {
      if (r.telecalling) {
        calls += r.telecalling.todayCalls || 0;
        followUp += r.telecalling.todayFollowUp || 0;
        enquiry += r.telecalling.todayEnquiry || 0;
        admission += r.telecalling.todayAdmission || 0;
      }
    });

    return {
      totalStaff: staffList.length,
      totalStudents: studentList.length,
      todayPresentStaff: todayStaffAtt.length,
      todayPresentStudents: todayStudentAtt.length,
      totalPendingFees: totalPending,
      totalCollectedFees: totalCollected,
      todayTotalCalls: calls,
      todayTotalFollowUps: followUp,
      todayTotalEnquiries: enquiry,
      todayTotalAdmissions: admission
    };
  },

  // FETCH AND MERGE ALL CLOUD DATA
  async syncWithCloud(): Promise<boolean> {
    try {
      const cloudUsers = await fetchCollectionFromCloud('users');
      if (cloudUsers && cloudUsers.length > 0) {
        saveToStorage(KEY_USERS, cloudUsers);
      } else {
        // First-time cloud setup: Seed users up to Firestore so all phones get them
        const localUsers = this.getUsers();
        for (const u of localUsers) {
          syncDocumentToCloud('users', u.id, u);
        }
      }
      const cloudStaffAtt = await fetchCollectionFromCloud('staff_attendance');
      if (cloudStaffAtt && cloudStaffAtt.length > 0) {
        saveToStorage(KEY_STAFF_ATTENDANCE, cloudStaffAtt);
      }
      const cloudStaffPerms = await fetchCollectionFromCloud('staff_permissions');
      if (cloudStaffPerms && cloudStaffPerms.length > 0) {
        saveToStorage(KEY_STAFF_PERMISSIONS, cloudStaffPerms);
      }
      const cloudLeaves = await fetchCollectionFromCloud('leave_requests');
      if (cloudLeaves && cloudLeaves.length > 0) {
        saveToStorage(KEY_LEAVE_REQUESTS, cloudLeaves);
      }
      const cloudStudentAtt = await fetchCollectionFromCloud('student_attendance');
      if (cloudStudentAtt && cloudStudentAtt.length > 0) {
        saveToStorage(KEY_STUDENT_ATTENDANCE, cloudStudentAtt);
      }
      const cloudReports = await fetchCollectionFromCloud('work_reports');
      if (cloudReports && cloudReports.length > 0) {
        saveToStorage(KEY_WORK_REPORTS, cloudReports);
      }
      const cloudManagerReports = await fetchCollectionFromCloud('manager_reports');
      if (cloudManagerReports && cloudManagerReports.length > 0) {
        saveToStorage(KEY_MANAGER_REPORTS, cloudManagerReports);
      }
      const cloudCourses = await fetchCollectionFromCloud('courses');
      if (cloudCourses && cloudCourses.length > 0) {
        saveToStorage(KEY_COURSES, cloudCourses);
      } else {
        const localCourses = this.getCourses();
        for (const c of localCourses) {
          syncDocumentToCloud('courses', c.id, c);
        }
      }
      window.dispatchEvent(new Event('educenter-db-change'));
      return true;
    } catch {
      return false;
    }
  },

  // ==========================================
  // 1. CRM LEADS & ADMISSION FOLLOW-UP
  // ==========================================
  getLeads(branchId?: BranchId | 'all', status?: LeadStatus | 'all', search?: string, priority?: LeadPriority | 'all'): Lead[] {
    let list = loadFromStorage<Lead[]>(KEY_LEADS, INITIAL_LEADS);
    if (branchId && branchId !== 'all') {
      list = list.filter(l => l.branchId === branchId);
    }
    if (status && status !== 'all') {
      list = list.filter(l => l.status === status);
    }
    if (priority && priority !== 'all') {
      list = list.filter(l => l.priority === priority);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.phone.includes(q) || 
        (l.courseName && l.courseName.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => b.timestamp - a.timestamp);
  },

  getLeadById(id: string): Lead | undefined {
    return this.getLeads().find(l => l.id === id);
  },

  addLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'timestamp' | 'followUps'>): Lead {
    const list = loadFromStorage<Lead[]>(KEY_LEADS, INITIAL_LEADS);
    const today = getTodayDate();
    const newLead: Lead = {
      ...lead,
      id: `lead-${Date.now()}`,
      followUps: [],
      createdAt: today,
      updatedAt: today,
      timestamp: Date.now()
    };
    list.unshift(newLead);
    saveToStorage(KEY_LEADS, list);
    syncDocumentToCloud('crm_leads', newLead.id, newLead);
    return newLead;
  },

  updateLead(id: string, updates: Partial<Lead>): Lead | null {
    const list = loadFromStorage<Lead[]>(KEY_LEADS, INITIAL_LEADS);
    const idx = list.findIndex(l => l.id === id);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      ...updates,
      updatedAt: getTodayDate()
    };
    saveToStorage(KEY_LEADS, list);
    syncDocumentToCloud('crm_leads', list[idx].id, list[idx]);
    return list[idx];
  },

  deleteLead(id: string): boolean {
    let list = loadFromStorage<Lead[]>(KEY_LEADS, INITIAL_LEADS);
    const initialLen = list.length;
    list = list.filter(l => l.id !== id);
    if (list.length !== initialLen) {
      saveToStorage(KEY_LEADS, list);
      return true;
    }
    return false;
  },

  addLeadFollowUp(leadId: string, followUp: Omit<LeadFollowUpRecord, 'id' | 'timestamp'>, nextDate?: string, nextTime?: string, newStatus?: LeadStatus): Lead | null {
    const list = loadFromStorage<Lead[]>(KEY_LEADS, INITIAL_LEADS);
    const lead = list.find(l => l.id === leadId);
    if (!lead) return null;
    const newFup: LeadFollowUpRecord = {
      ...followUp,
      id: `fup-${Date.now()}`,
      timestamp: Date.now()
    };
    if (!lead.followUps) lead.followUps = [];
    lead.followUps.unshift(newFup);
    if (nextDate) lead.nextFollowUpDate = nextDate;
    if (nextTime) lead.nextFollowUpTime = nextTime;
    if (newStatus) lead.status = newStatus;
    lead.updatedAt = getTodayDate();

    saveToStorage(KEY_LEADS, list);
    syncDocumentToCloud('crm_leads', lead.id, lead);
    return lead;
  },

  getTodayFollowUps(branchId?: BranchId | 'all'): Lead[] {
    const today = getTodayDate();
    let leads = this.getLeads(branchId);
    return leads.filter(l => l.status !== 'enrolled' && l.status !== 'lost' && l.nextFollowUpDate === today);
  },

  getOverdueFollowUps(branchId?: BranchId | 'all'): Lead[] {
    const today = getTodayDate();
    let leads = this.getLeads(branchId);
    return leads.filter(l => l.status !== 'enrolled' && l.status !== 'lost' && l.nextFollowUpDate && l.nextFollowUpDate < today);
  },

  convertLeadToStudent(leadId: string, studentData: { 
    courseId: string; 
    batchTiming?: string; 
    totalFees: number; 
    paidFees: number; 
    paymentMode: PaymentMode;
    collectedBy?: string;
  }): { student: UserProfile; lead: Lead } | null {
    const lead = this.getLeadById(leadId);
    if (!lead) return null;

    const course = this.getCourseById(studentData.courseId);
    const branch = this.getBranchById(lead.branchId);
    const pendingAmount = Math.max(0, studentData.totalFees - studentData.paidFees);
    const feeStatus = pendingAmount === 0 ? 'paid' : studentData.paidFees > 0 ? 'partial' : 'pending';

    const cleanUsername = lead.name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(100 + Math.random() * 900);
    const studentUser: UserProfile = {
      id: `usr-stu-${Date.now()}`,
      studentId: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: lead.name,
      phone: lead.phone,
      email: lead.email || `${cleanUsername}@cskacademy.com`,
      username: cleanUsername,
      password: 'student123',
      role: 'student',
      branchId: lead.branchId,
      branchName: branch ? `${branch.name} - ${branch.location}` : undefined,
      courseId: studentData.courseId,
      courseName: course?.name || lead.courseName || 'Certificate Course',
      batchTiming: studentData.batchTiming || '10:00 AM - 12:00 PM',
      totalFees: studentData.totalFees,
      paidFees: studentData.paidFees,
      pendingFees: pendingAmount,
      feeStatus: feeStatus,
      lastPaymentMode: studentData.paymentMode,
      lastPaymentCollectedBy: studentData.collectedBy || 'Branch Manager',
      createdAt: getTodayDate(),
      paymentHistory: studentData.paidFees > 0 ? [
        {
          id: `pay-${Date.now()}`,
          amount: studentData.paidFees,
          paymentMode: studentData.paymentMode,
          collectedBy: studentData.collectedBy || 'Branch Manager',
          date: getTodayDate(),
          time: getCurrentTime(),
          notes: 'Initial admission fee payment',
          timestamp: Date.now()
        }
      ] : []
    };

    // Save student
    const users = loadFromStorage<UserProfile[]>(KEY_USERS, INITIAL_USERS);
    users.unshift(studentUser);
    saveToStorage(KEY_USERS, users);
    syncDocumentToCloud('users', studentUser.id, studentUser);

    // If there is pending fee, create installment 2 automatically
    if (pendingAmount > 0) {
      const nextMonthDate = new Date();
      nextMonthDate.setDate(nextMonthDate.getDate() + 30);
      const dueDate = nextMonthDate.toISOString().split('T')[0];
      this.addFeeInstallment({
        studentId: studentUser.id,
        studentName: studentUser.name,
        branchId: studentUser.branchId || lead.branchId,
        installmentNo: 2,
        dueDate: dueDate,
        amount: pendingAmount,
        paidAmount: 0,
        status: 'pending',
        reminderCount: 0,
        notes: `Balance fee for ${studentUser.courseName}`
      });
    }

    // Mark lead as enrolled
    const updatedLead = this.updateLead(leadId, {
      status: 'enrolled',
      enrolledStudentId: studentUser.id,
      notes: `${lead.notes}\n[Enrolled as Student ${studentUser.studentId} on ${getTodayDate()}]`
    });

    return { student: studentUser, lead: updatedLead || lead };
  },

  // ==========================================
  // 2. PENDING FEES & INSTALLMENTS
  // ==========================================
  getFeeInstallments(studentId?: string, branchId?: BranchId | 'all', status?: string): FeeInstallment[] {
    let list = loadFromStorage<FeeInstallment[]>(KEY_FEE_INSTALLMENTS, INITIAL_FEE_INSTALLMENTS);
    if (studentId && studentId !== 'all') {
      list = list.filter(i => i.studentId === studentId);
    }
    if (branchId && branchId !== 'all') {
      list = list.filter(i => i.branchId === branchId);
    }
    if (status && status !== 'all') {
      list = list.filter(i => i.status === status);
    }
    return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  },

  addFeeInstallment(installment: Omit<FeeInstallment, 'id'>): FeeInstallment {
    const list = loadFromStorage<FeeInstallment[]>(KEY_FEE_INSTALLMENTS, INITIAL_FEE_INSTALLMENTS);
    const newInst: FeeInstallment = {
      ...installment,
      id: `inst-${Date.now()}`
    };
    list.push(newInst);
    saveToStorage(KEY_FEE_INSTALLMENTS, list);
    syncDocumentToCloud('fee_installments', newInst.id, newInst);
    return newInst;
  },

  updateFeeInstallment(id: string, updates: Partial<FeeInstallment>): FeeInstallment | null {
    const list = loadFromStorage<FeeInstallment[]>(KEY_FEE_INSTALLMENTS, INITIAL_FEE_INSTALLMENTS);
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    saveToStorage(KEY_FEE_INSTALLMENTS, list);
    syncDocumentToCloud('fee_installments', list[idx].id, list[idx]);
    return list[idx];
  },

  recordFeePayment(
    studentId: string, 
    amount: number, 
    paymentMode: PaymentMode, 
    collectedBy: string, 
    notes?: string, 
    installmentId?: string
  ): { student: UserProfile; record: FeePaymentRecord } | null {
    const users = loadFromStorage<UserProfile[]>(KEY_USERS, INITIAL_USERS);
    const student = users.find(u => u.id === studentId);
    if (!student) return null;

    const paymentRecord: FeePaymentRecord = {
      id: `pay-${Date.now()}`,
      amount: amount,
      paymentMode: paymentMode,
      collectedBy: collectedBy,
      date: getTodayDate(),
      time: getCurrentTime(),
      notes: notes || 'Fee installment payment',
      timestamp: Date.now()
    };

    if (!student.paymentHistory) student.paymentHistory = [];
    student.paymentHistory.push(paymentRecord);
    student.paidFees = (student.paidFees || 0) + amount;
    student.pendingFees = Math.max(0, (student.totalFees || 0) - student.paidFees);
    student.feeStatus = student.pendingFees === 0 ? 'paid' : 'partial';
    student.lastPaymentMode = paymentMode;
    student.lastPaymentCollectedBy = collectedBy;

    saveToStorage(KEY_USERS, users);
    syncDocumentToCloud('users', student.id, student);

    // If installmentId was provided, update that installment
    if (installmentId) {
      const installments = loadFromStorage<FeeInstallment[]>(KEY_FEE_INSTALLMENTS, INITIAL_FEE_INSTALLMENTS);
      const inst = installments.find(i => i.id === installmentId);
      if (inst) {
        inst.paidAmount = (inst.paidAmount || 0) + amount;
        inst.status = inst.paidAmount >= inst.amount ? 'paid' : 'partial';
        inst.paidDate = getTodayDate();
        saveToStorage(KEY_FEE_INSTALLMENTS, installments);
        syncDocumentToCloud('fee_installments', inst.id, inst);
      }
    }

    return { student, record: paymentRecord };
  },

  logFeeReminder(reminder: Omit<FeeReminderLog, 'id' | 'timestamp' | 'sentAt'>): FeeReminderLog {
    const list = loadFromStorage<FeeReminderLog[]>(KEY_FEE_REMINDERS, []);
    const newLog: FeeReminderLog = {
      ...reminder,
      id: `frem-${Date.now()}`,
      sentAt: `${getTodayDate()} ${getCurrentTime()}`,
      timestamp: Date.now()
    };
    list.unshift(newLog);
    saveToStorage(KEY_FEE_REMINDERS, list);
    syncDocumentToCloud('fee_reminders', newLog.id, newLog);
    return newLog;
  },

  getFeeReminderLogs(studentId?: string): FeeReminderLog[] {
    let list = loadFromStorage<FeeReminderLog[]>(KEY_FEE_REMINDERS, []);
    if (studentId && studentId !== 'all') {
      list = list.filter(l => l.studentId === studentId);
    }
    return list;
  },

  generateWhatsAppReminderMessage(studentName: string, courseName: string, pendingAmount: number, dueDate?: string, branchName?: string): string {
    const campus = branchName || 'CSK Academy & InfoSpark';
    const dueTxt = dueDate ? `on or before *${dueDate}*` : 'at your earliest convenience';
    return `Dear *${studentName}*,\n\nGreetings from *${campus}*! 🎓\n\nThis is a friendly reminder regarding your tuition balance of *₹${pendingAmount.toLocaleString('en-IN')}* for *${courseName}*, scheduled ${dueTxt}.\n\nYou can pay online via UPI or visit the branch office directly. For any questions or assistance, please reply to this message.\n\nThank you,\nAccount Desk, ${campus}\nPhone: +91 94432 11001`;
  },

  getPendingFeeAging(branchId?: BranchId | 'all') {
    const students = this.getStudentList(branchId);
    const today = new Date(getTodayDate()).getTime();

    let totalPendingAmount = 0;
    const studentsWithDues = students.filter(s => (s.pendingFees || 0) > 0);
    studentsWithDues.forEach(s => totalPendingAmount += (s.pendingFees || 0));

    const installments = this.getFeeInstallments(undefined, branchId, 'pending').concat(
      this.getFeeInstallments(undefined, branchId, 'overdue')
    );

    const dueIn7Days: any[] = [];
    const overdue1to15Days: any[] = [];
    const overdue16to30Days: any[] = [];
    const overdue30PlusDays: any[] = [];

    studentsWithDues.forEach(stu => {
      const inst = installments.find(i => i.studentId === stu.id);
      const dueDateStr = inst?.dueDate || stu.createdAt || getTodayDate();
      const dueTime = new Date(dueDateStr).getTime();
      const diffDays = Math.floor((today - dueTime) / (1000 * 60 * 60 * 24));

      const entry = {
        student: stu,
        pending: stu.pendingFees || 0,
        course: stu.courseName || 'Course',
        branchId: stu.branchId || 'dadagapatty',
        dueDate: dueDateStr,
        overdueDays: diffDays
      };

      if (diffDays < 0 && Math.abs(diffDays) <= 7) {
        dueIn7Days.push(entry);
      } else if (diffDays >= 0 && diffDays <= 15) {
        overdue1to15Days.push(entry);
      } else if (diffDays > 15 && diffDays <= 30) {
        overdue16to30Days.push(entry);
      } else if (diffDays > 30) {
        overdue30PlusDays.push(entry);
      } else {
        dueIn7Days.push(entry);
      }
    });

    return {
      totalPendingAmount,
      totalStudentsWithDues: studentsWithDues.length,
      dueIn7Days,
      overdue1to15Days,
      overdue16to30Days,
      overdue30PlusDays
    };
  },

  // ==========================================
  // 3. ACCOUNTING & EXPENSES
  // ==========================================
  getExpenses(branchId?: BranchId | 'all', month?: string, category?: string): ExpenseRecord[] {
    let list = loadFromStorage<ExpenseRecord[]>(KEY_EXPENSES, INITIAL_EXPENSES);
    if (branchId && branchId !== 'all') {
      list = list.filter(e => e.branchId === branchId);
    }
    if (month && month !== 'all') {
      list = list.filter(e => e.date.startsWith(month));
    }
    if (category && category !== 'all') {
      list = list.filter(e => e.category === category);
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addExpense(expense: Omit<ExpenseRecord, 'id' | 'timestamp'>): ExpenseRecord {
    const list = loadFromStorage<ExpenseRecord[]>(KEY_EXPENSES, INITIAL_EXPENSES);
    const newExp: ExpenseRecord = {
      ...expense,
      id: `exp-${Date.now()}`,
      timestamp: Date.now()
    };
    list.unshift(newExp);
    saveToStorage(KEY_EXPENSES, list);
    syncDocumentToCloud('expenses', newExp.id, newExp);
    return newExp;
  },

  deleteExpense(id: string): boolean {
    let list = loadFromStorage<ExpenseRecord[]>(KEY_EXPENSES, INITIAL_EXPENSES);
    const initialLen = list.length;
    list = list.filter(e => e.id !== id);
    if (list.length !== initialLen) {
      saveToStorage(KEY_EXPENSES, list);
      return true;
    }
    return false;
  },

  getBranchPLSummary(branchId?: BranchId | 'all', month?: string) {
    // 1. Calculate revenue from student fees collected
    const students = this.getStudentList(branchId);
    let totalRevenue = 0;
    students.forEach(s => {
      if (s.paymentHistory) {
        s.paymentHistory.forEach(p => {
          if (!month || month === 'all' || p.date.startsWith(month)) {
            totalRevenue += (p.amount || 0);
          }
        });
      }
    });

    // 2. Calculate expenses
    const expenses = this.getExpenses(branchId, month);
    let totalExpenses = 0;
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(e => {
      totalExpenses += (e.amount || 0);
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (e.amount || 0);
    });

    const netProfit = totalRevenue - totalExpenses;
    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      categoryTotals,
      profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0'
    };
  },

  // ==========================================
  // 4. PAYROLL & SALARY
  // ==========================================
  getSalarySlips(staffId?: string, month?: string, branchId?: BranchId | 'all'): SalarySlip[] {
    let list = loadFromStorage<SalarySlip[]>(KEY_SALARY_SLIPS, INITIAL_SALARY_SLIPS);
    if (staffId && staffId !== 'all') {
      list = list.filter(s => s.staffId === staffId);
    }
    if (month && month !== 'all') {
      list = list.filter(s => s.month === month);
    }
    if (branchId && branchId !== 'all') {
      list = list.filter(s => s.branchId === branchId);
    }
    return list.sort((a, b) => b.timestamp - a.timestamp);
  },

  generateSalarySlip(staffId: string, month: string): SalarySlip | null {
    const user = this.getUserById(staffId);
    if (!user || user.role !== 'staff') return null;

    // Check if slip already exists for this staff and month
    const list = loadFromStorage<SalarySlip[]>(KEY_SALARY_SLIPS, INITIAL_SALARY_SLIPS);
    const existing = list.find(s => s.staffId === staffId && s.month === month);
    if (existing) return existing;

    // Base salary benchmark based on faculty type
    const basePay = user.jobRole === 'both' ? 28000 : user.jobRole === 'teaching' ? 24000 : 20000;
    const allowances = 2000;

    // Count present days and unpaid leaves from attendance and leaves records
    const attendance = this.getStaffAttendance(staffId, month);
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const halfDayCount = attendance.filter(a => a.status === 'half_day').length;

    const workingDays = 26;
    const estimatedPresent = Math.min(workingDays, Math.max(22, presentCount + halfDayCount * 0.5));
    const unpaidDays = Math.max(0, workingDays - estimatedPresent - 1); // 1 casual leave allowed
    const dailyRate = Math.round(basePay / workingDays);
    const deductions = unpaidDays * dailyRate;
    const netPayable = Math.max(0, basePay + allowances - deductions);

    const newSlip: SalarySlip = {
      id: `sal-${Date.now()}`,
      staffId: user.id,
      staffName: user.name,
      branchId: user.branchId || 'dadagapatty',
      month: month,
      baseSalary: basePay,
      allowances: allowances,
      workingDays: workingDays,
      presentDays: Math.round(estimatedPresent),
      paidLeaveDays: 1,
      unpaidLeaveDays: unpaidDays,
      deductions: deductions,
      deductionReason: unpaidDays > 0 ? `${unpaidDays} unpaid leave day(s) deducted` : undefined,
      netPayable: netPayable,
      status: 'approved',
      timestamp: Date.now()
    };

    list.unshift(newSlip);
    saveToStorage(KEY_SALARY_SLIPS, list);
    syncDocumentToCloud('salary_slips', newSlip.id, newSlip);
    return newSlip;
  },

  updateSalarySlipStatus(id: string, status: 'approved' | 'paid', paymentRef?: string, paymentMode?: PaymentMode | 'bank_transfer', disbursedBy?: string): SalarySlip | null {
    const list = loadFromStorage<SalarySlip[]>(KEY_SALARY_SLIPS, INITIAL_SALARY_SLIPS);
    const slip = list.find(s => s.id === id);
    if (!slip) return null;
    slip.status = status;
    if (paymentRef) slip.paymentRef = paymentRef;
    if (paymentMode) slip.paymentMode = paymentMode;
    if (disbursedBy) slip.disbursedBy = disbursedBy;
    if (status === 'paid') slip.disbursedDate = getTodayDate();

    saveToStorage(KEY_SALARY_SLIPS, list);
    syncDocumentToCloud('salary_slips', slip.id, slip);
    return slip;
  },

  // ==========================================
  // 5. NOTICES & ANNOUNCEMENTS
  // ==========================================
  getNotices(branchId?: BranchId | 'all', targetRole?: string): CampusNotice[] {
    let list = loadFromStorage<CampusNotice[]>(KEY_NOTICES, INITIAL_NOTICES);
    if (branchId && branchId !== 'all') {
      list = list.filter(n => n.branchId === 'all' || n.branchId === branchId);
    }
    if (targetRole && targetRole !== 'all') {
      list = list.filter(n => n.targetRole === 'all' || n.targetRole === targetRole);
    }
    return list.sort((a, b) => b.timestamp - a.timestamp);
  },

  addNotice(notice: Omit<CampusNotice, 'id' | 'timestamp'>): CampusNotice {
    const list = loadFromStorage<CampusNotice[]>(KEY_NOTICES, INITIAL_NOTICES);
    const newNotice: CampusNotice = {
      ...notice,
      id: `not-${Date.now()}`,
      timestamp: Date.now()
    };
    list.unshift(newNotice);
    saveToStorage(KEY_NOTICES, list);
    syncDocumentToCloud('campus_notices', newNotice.id, newNotice);
    return newNotice;
  },

  deleteNotice(id: string): boolean {
    let list = loadFromStorage<CampusNotice[]>(KEY_NOTICES, INITIAL_NOTICES);
    const initialLen = list.length;
    list = list.filter(n => n.id !== id);
    if (list.length !== initialLen) {
      saveToStorage(KEY_NOTICES, list);
      return true;
    }
    return false;
  },

  // REAL-TIME FIRESTORE MULTI-DEVICE SYNC
  initCloudListeners(): () => void {
    const unsubUsers = subscribeToCloudCollection('users', (cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        localStorage.setItem(KEY_USERS, JSON.stringify(cloudUsers));
        window.dispatchEvent(new Event('educenter-db-change'));
      }
    });

    const unsubStaffAtt = subscribeToCloudCollection('staff_attendance', (cloudStaffAtt) => {
      if (cloudStaffAtt && cloudStaffAtt.length > 0) {
        localStorage.setItem(KEY_STAFF_ATTENDANCE, JSON.stringify(cloudStaffAtt));
        window.dispatchEvent(new Event('educenter-db-change'));
      }
    });

    const unsubStaffPerms = subscribeToCloudCollection('staff_permissions', (cloudStaffPerms) => {
      if (cloudStaffPerms && cloudStaffPerms.length > 0) {
        localStorage.setItem(KEY_STAFF_PERMISSIONS, JSON.stringify(cloudStaffPerms));
        window.dispatchEvent(new Event('educenter-db-change'));
      }
    });

    const unsubLeaves = subscribeToCloudCollection('leave_requests', (cloudLeaves) => {
      if (cloudLeaves && cloudLeaves.length > 0) {
        localStorage.setItem(KEY_LEAVE_REQUESTS, JSON.stringify(cloudLeaves));
        window.dispatchEvent(new Event('educenter-db-change'));
      }
    });

    const unsubStudentAtt = subscribeToCloudCollection('student_attendance', (cloudStudentAtt) => {
      if (cloudStudentAtt && cloudStudentAtt.length > 0) {
        localStorage.setItem(KEY_STUDENT_ATTENDANCE, JSON.stringify(cloudStudentAtt));
        window.dispatchEvent(new Event('educenter-db-change'));
      }
    });

    const unsubReports = subscribeToCloudCollection('work_reports', (cloudReports) => {
      if (cloudReports && cloudReports.length > 0) {
        localStorage.setItem(KEY_WORK_REPORTS, JSON.stringify(cloudReports));
        window.dispatchEvent(new Event('educenter-db-change'));
      }
    });

    const unsubManagerReports = subscribeToCloudCollection('manager_reports', (cloudMgrReports) => {
      if (cloudMgrReports && cloudMgrReports.length > 0) {
        localStorage.setItem(KEY_MANAGER_REPORTS, JSON.stringify(cloudMgrReports));
        window.dispatchEvent(new Event('educenter-db-change'));
      }
    });

    const unsubCourses = subscribeToCloudCollection('courses', (cloudCourses) => {
      if (cloudCourses && cloudCourses.length > 0) {
        localStorage.setItem(KEY_COURSES, JSON.stringify(cloudCourses));
        window.dispatchEvent(new Event('educenter-db-change'));
      }
    });

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubStaffAtt) unsubStaffAtt();
      if (unsubStudentAtt) unsubStudentAtt();
      if (unsubReports) unsubReports();
      if (unsubManagerReports) unsubManagerReports();
      if (unsubCourses) unsubCourses();
    };
  },

  // Reset to default seed data
  resetToSeed(): void {
    localStorage.setItem(KEY_USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(KEY_STAFF_ATTENDANCE, JSON.stringify(INITIAL_STAFF_ATTENDANCE));
    localStorage.setItem(KEY_WORK_REPORTS, JSON.stringify(INITIAL_WORK_REPORTS));
    localStorage.setItem(KEY_MANAGER_REPORTS, JSON.stringify(INITIAL_MANAGER_REPORTS));
    localStorage.setItem(KEY_STUDENT_ATTENDANCE, JSON.stringify(INITIAL_STUDENT_ATTENDANCE));
    localStorage.setItem(KEY_COURSES, JSON.stringify(INITIAL_COURSES));
    localStorage.setItem(KEY_LEADS, JSON.stringify(INITIAL_LEADS));
    localStorage.setItem(KEY_FEE_INSTALLMENTS, JSON.stringify(INITIAL_FEE_INSTALLMENTS));
    localStorage.setItem(KEY_EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    localStorage.setItem(KEY_SALARY_SLIPS, JSON.stringify(INITIAL_SALARY_SLIPS));
    localStorage.setItem(KEY_NOTICES, JSON.stringify(INITIAL_NOTICES));
    window.dispatchEvent(new Event('educenter-db-change'));
  }
};

export interface CSVExportEventDetail {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  csvContent: string;
  totalRows: number;
}

export function convertToCSV(headers: string[], rows: (string | number)[][]): string {
  const csvRows = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(row =>
      row.map(val => {
        const str = val === null || val === undefined ? '' : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    )
  ];
  return '\uFEFF' + csvRows.join('\r\n');
}

/**
 * Universally downloads, shares, or exports CSV across:
 * - Native Android APK (via Capacitor Filesystem + Native Share Sheet)
 * - Mobile Browsers (via Web Share API)
 * - Desktop Browsers (via HTML5 Blob Download)
 * - Dispatches 'csk-csv-downloaded' event so the in-app modal can provide Preview & Copy to Clipboard
 */
export async function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]): Promise<void> {
  const csvContent = convertToCSV(headers, rows);

  // Dispatch event for in-app preview & clipboard modal
  if (typeof window !== 'undefined') {
    const event = new CustomEvent<CSVExportEventDetail>('csk-csv-downloaded', {
      detail: {
        filename,
        headers,
        rows,
        csvContent,
        totalRows: rows.length
      }
    });
    window.dispatchEvent(event);
  }

  // 1. CAPACITOR NATIVE ANDROID / IOS PLATFORM
  if (Capacitor.isNativePlatform()) {
    try {
      const fileResult = await Filesystem.writeFile({
        path: filename,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      await Share.share({
        title: filename,
        text: `CSK Academy CSV Report: ${filename} (${rows.length} rows)`,
        url: fileResult.uri,
        dialogTitle: `Export & Save ${filename}`
      });
      return;
    } catch (nativeErr) {
      console.warn('Native Capacitor share failed, falling back to web download:', nativeErr);
    }
  }

  // 2. MOBILE WEB BROWSER WITH NAVIGATOR.SHARE
  if (typeof navigator !== 'undefined' && navigator.canShare) {
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const file = new File([blob], filename, { type: 'text/csv;charset=utf-8;' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
          text: `CSK Academy Report: ${filename}`
        });
        return;
      }
    } catch (shareErr) {
      console.warn('navigator.share failed or dismissed:', shareErr);
    }
  }

  // 3. DESKTOP / STANDARD BROWSER BLOB DOWNLOAD
  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.setAttribute('target', '_blank');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (err) {
    console.error('Blob download failed:', err);
  }
}
