/**
 * CSK Academy & InfoSpark Innovation Pvt Ltd
 * Automated Google Sheet Generator Script
 * 
 * HOW TO USE IN GOOGLE SHEETS:
 * 1. Go to https://sheets.new in your browser (opens a new Google Sheet)
 * 2. Click "Extensions" menu -> "Apps Script"
 * 3. Delete any text in the editor and PASTE this entire script
 * 4. Click the "Save" (disk icon) and click "Run" (▶ button)
 * 5. Grant permissions if prompted (Click Advanced -> Go to Untitled project)
 * 6. Return to your Google Sheet — All 6 tabs with colors & sample data will be created instantly!
 */

function setupCSKAcademyDataCollectionSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.rename("CSK Academy & InfoSpark - Data Collection & Update Template");

  // Helper colors
  const NAVY = "#1E3A8A";
  const EMERALD = "#065F46";
  const PURPLE = "#581C87";
  const BLUE = "#1E40AF";
  const SLATE = "#334155";
  const WHITE = "#FFFFFF";
  const GRAY_BG = "#F8FAFC";

  // 1. INSTRUCTIONS SHEET
  let introSheet = ss.getSheetByName("📋 Instructions");
  if (!introSheet) introSheet = ss.insertSheet("📋 Instructions", 0);
  introSheet.clear();
  introSheet.setTabColor(NAVY);
  
  const introData = [
    ["CSK ACADEMY & INFOSPARK INNOVATION - DATA COLLECTION TEMPLATE", ""],
    ["Use this Google Sheet to collect or update details for Center Admins, Branch Managers, Faculty, and Students.", ""],
    ["", ""],
    ["KEY GUIDELINE", "EXPLANATION"],
    ["Dedicated Tabs", "Check the tabs below: Admins, Branch Managers, Staff & Faculty, Students & Enrolments."],
    ["Mandatory Columns", "Columns with an asterisk (*) are compulsory for mobile app login & record keeping."],
    ["Valid Branch IDs", "Must match exactly: 'dadagapatty' | 'kondalampatty' | 'ammapet' | 'new_bus_stand'"],
    ["Branch 1 (Dadagapatty)", "dadagapatty -> CSK Academy (Dadagapatty Main Road, Salem - 636006)"],
    ["Branch 2 (Kondalampatty)", "kondalampatty -> CSK Academy (Salem Junction / Kondalampatty Bypass, Salem - 636010)"],
    ["Branch 3 (Ammapet)", "ammapet -> CSK Academy (Ammapet Main Road, Salem - 636003)"],
    ["Branch 4 (New Bus Stand)", "new_bus_stand -> InfoSpark Innovation Pvt Ltd (Opp. New Bus Stand, Meyyanur, Salem - 636004)"],
    ["Staff Job Roles", "Must be one of: 'teaching' | 'telecalling' | 'both'"],
    ["Student Fee Status", "Must be one of: 'paid' | 'partial' | 'pending'"],
    ["Student Payment Mode", "Must be: 'cash' | 'upi'"]
  ];
  introSheet.getRange(1, 1, introData.length, 2).setValues(introData);
  introSheet.getRange("A1").setFontSize(14).setFontWeight("bold").setFontColor(NAVY);
  introSheet.getRange("A4:B4").setBackground(NAVY).setFontColor(WHITE).setFontWeight("bold");
  introSheet.setColumnWidth(1, 240);
  introSheet.setColumnWidth(2, 600);

  // 2. ADMIN SHEET
  let adminSheet = ss.getSheetByName("🛡️ Center Admins");
  if (!adminSheet) adminSheet = ss.insertSheet("🛡️ Center Admins", 1);
  adminSheet.clear();
  adminSheet.setTabColor(NAVY);
  const adminHeaders = [["User ID", "Full Name *", "Login Username *", "Password *", "Mobile Phone *", "Email Address", "Designation", "Assigned Branch ID *", "Branch Full Name", "Notes"]];
  const adminRows = [
    ["usr-admin-1", "Kalai SK", "admin", "admin123", "9845012345", "admin@cskacademy.com", "Managing Director & Head of Centers", "new_bus_stand", "CSK Academy & InfoSpark Innovation Pvt Ltd", "Head Office Admin"],
    ["usr-admin-2", "Anand", "anand_admin", "admin456", "9845012349", "anand@cskacademy.com", "Center Director & Academic Head", "dadagapatty", "CSK Academy - Dadagapatty, Salem", "Academic Lead"]
  ];
  adminSheet.getRange(1, 1, 1, adminHeaders[0].length).setValues(adminHeaders).setBackground(NAVY).setFontColor(WHITE).setFontWeight("bold");
  adminSheet.getRange(2, 1, adminRows.length, adminRows[0].length).setValues(adminRows);
  adminSheet.setFrozenRows(1);

  // 3. MANAGERS SHEET
  let mgrSheet = ss.getSheetByName("🏢 Branch Managers");
  if (!mgrSheet) mgrSheet = ss.insertSheet("🏢 Branch Managers", 2);
  mgrSheet.clear();
  mgrSheet.setTabColor(EMERALD);
  const mgrHeaders = [["User ID", "Manager Code *", "Full Name *", "Login Username *", "Password *", "Mobile Phone *", "Email Address", "Assigned Branch ID *", "Branch Full Name", "Designation", "Joining Date", "Status"]];
  const mgrRows = [
    ["usr-mgr-1", "MGR-001", "Ramesh Kumar", "manager", "manager123", "9845012346", "manager.salem@cskacademy.com", "dadagapatty", "CSK Academy - Dadagapatty, Salem", "Dadagapatty Branch Manager", "2026-01-05", "active"],
    ["usr-mgr-2", "MGR-002", "Suresh Balan", "manager_kondalampatty", "manager123", "9845012351", "suresh.knd@cskacademy.com", "kondalampatty", "CSK Academy - Kondalampatty, Salem", "Salem Junction Branch Manager", "2026-01-10", "active"],
    ["usr-mgr-3", "MGR-003", "Venkatesh S", "manager_ammapet", "manager123", "9845012352", "venkat.amp@cskacademy.com", "ammapet", "CSK Academy - Ammapet, Salem", "Ammapet Campus Manager", "2026-01-15", "active"],
    ["usr-mgr-4", "MGR-004", "Manikandan R", "manager_newbusstand", "manager123", "9845012353", "mani.nbs@infospark.com", "new_bus_stand", "InfoSpark Innovation Pvt Ltd - New Bus Stand", "Tech Operations Manager", "2026-01-20", "active"]
  ];
  mgrSheet.getRange(1, 1, 1, mgrHeaders[0].length).setValues(mgrHeaders).setBackground(EMERALD).setFontColor(WHITE).setFontWeight("bold");
  mgrSheet.getRange(2, 1, mgrRows.length, mgrRows[0].length).setValues(mgrRows);
  mgrSheet.setFrozenRows(1);

  // 4. STAFF SHEET
  let staffSheet = ss.getSheetByName("👨‍🏫 Staff & Faculty");
  if (!staffSheet) staffSheet = ss.insertSheet("👨‍🏫 Staff & Faculty", 3);
  staffSheet.clear();
  staffSheet.setTabColor(PURPLE);
  const staffHeaders = [["User ID", "Staff Code *", "Full Name *", "Login Username *", "Password *", "Mobile Phone *", "Email Address", "Job Role (teaching/telecalling/both) *", "Designation *", "Qualification", "Assigned Branch ID *", "Branch Full Name", "Address", "Joining Date", "Status"]];
  const staffRows = [
    ["usr-stf-1", "STF-001", "Priya Dharshini", "priya_salem", "staff123", "9845012347", "priya.faculty@cskacademy.com", "both", "Senior AI & Python Faculty", "M.E. Computer Science", "dadagapatty", "CSK Academy - Dadagapatty, Salem", "Dadagapatty, Salem", "2026-01-10", "active"],
    ["usr-stf-2", "STF-002", "Logesh Kannan", "logesh_salem", "staff123", "9845012348", "logesh.faculty@cskacademy.com", "teaching", "Full Stack Web & C/C++ Mentor", "B.Tech IT", "dadagapatty", "CSK Academy - Dadagapatty, Salem", "Gugai, Salem", "2026-01-15", "active"],
    ["usr-stf-3", "STF-003", "Kavitha Rajan", "kavitha_telecall", "staff123", "9845012361", "kavitha.call@cskacademy.com", "telecalling", "Lead Academic Counselor & Telecaller", "MBA", "kondalampatty", "CSK Academy - Kondalampatty, Salem", "Kondalampatty, Salem", "2026-02-01", "active"],
    ["usr-stf-4", "STF-004", "Deepak Sundaram", "deepak_amp", "staff123", "9845012362", "deepak.mentor@cskacademy.com", "teaching", "Data Science & Cloud Trainer", "MCA", "ammapet", "CSK Academy - Ammapet, Salem", "Ammapet, Salem", "2026-02-05", "active"],
    ["usr-stf-5", "STF-005", "Anitha Mohan", "anitha_nbs", "staff123", "9845012363", "anitha.mentor@infospark.com", "both", "Software Developer & Project Lead", "M.Tech CSE", "new_bus_stand", "InfoSpark Innovation Pvt Ltd - New Bus Stand", "Alagapuram, Salem", "2026-02-10", "active"]
  ];
  staffSheet.getRange(1, 1, 1, staffHeaders[0].length).setValues(staffHeaders).setBackground(PURPLE).setFontColor(WHITE).setFontWeight("bold");
  staffSheet.getRange(2, 1, staffRows.length, staffRows[0].length).setValues(staffRows);
  staffSheet.setFrozenRows(1);

  // 5. STUDENTS SHEET
  let stuSheet = ss.getSheetByName("🎓 Students & Enrolments");
  if (!stuSheet) stuSheet = ss.insertSheet("🎓 Students & Enrolments", 4);
  stuSheet.clear();
  stuSheet.setTabColor(BLUE);
  const stuHeaders = [["User ID", "Student Roll *", "Full Name *", "Login Username *", "Password *", "Mobile Phone *", "Email Address", "Assigned Branch ID *", "Branch Full Name", "Occupation", "Standard / Degree", "Enrolled Course ID *", "Course Name *", "Batch Timing", "Total Fees (Rs) *", "Paid Fees (Rs) *", "Pending Fees (Rs)", "Fee Status (paid/partial/pending) *", "Payment Mode (cash/upi)", "Enrolment Date"]];
  const stuRows = [
    ["usr-stu-1", "STU-001", "Dinesh Kumar", "dinesh2026", "student123", "9845012371", "dinesh.stu@gmail.com", "dadagapatty", "CSK Academy - Dadagapatty, Salem", "College Student", "B.Tech CSE 3rd Yr", "crs-1", "Artificial Intelligence & Deep Learning (AI)", "10:00 AM - 12:00 PM", 30000, 15000, 15000, "partial", "upi", "2026-02-01"],
    ["usr-stu-2", "STU-002", "Sneha Prakash", "sneha2026", "student123", "9845012372", "sneha.stu@gmail.com", "dadagapatty", "CSK Academy - Dadagapatty, Salem", "Job Seeker", "B.E. ECE Graduate", "crs-3", "Full Stack Web Development (MERN / Python)", "02:00 PM - 04:00 PM", 25000, 25000, 0, "paid", "upi", "2026-02-05"],
    ["usr-stu-3", "STU-003", "Vigneshwaran P", "vicky2026", "student123", "9845012373", "vicky.stu@gmail.com", "kondalampatty", "CSK Academy - Kondalampatty, Salem", "College Student", "BCA 2nd Year", "crs-2", "C / C++ Programming & Data Structures", "05:30 PM - 07:00 PM", 15000, 7500, 7500, "partial", "cash", "2026-02-10"],
    ["usr-stu-4", "STU-004", "Pavithra M", "pavi2026", "student123", "9845012374", "pavi.stu@gmail.com", "ammapet", "CSK Academy - Ammapet, Salem", "Working Professional", "B.Sc Maths", "crs-4", "Data Science & Machine Learning with Python", "07:00 PM - 08:30 PM", 35000, 35000, 0, "paid", "upi", "2026-02-12"],
    ["usr-stu-5", "STU-005", "Mohammed Farhan", "farhan2026", "student123", "9845012375", "farhan.stu@gmail.com", "new_bus_stand", "InfoSpark Innovation Pvt Ltd - New Bus Stand", "College Student", "B.Tech IT Final Year", "crs-7", "Full Stack Web Development Internship (30 Days)", "11:00 AM - 01:00 PM", 6500, 6500, 0, "paid", "upi", "2026-02-15"]
  ];
  stuSheet.getRange(1, 1, 1, stuHeaders[0].length).setValues(stuHeaders).setBackground(BLUE).setFontColor(WHITE).setFontWeight("bold");
  stuSheet.getRange(2, 1, stuRows.length, stuRows[0].length).setValues(stuRows);
  stuSheet.setFrozenRows(1);

  // 6. REFERENCE SHEET
  let refSheet = ss.getSheetByName("🏛️ Branches & Courses");
  if (!refSheet) refSheet = ss.insertSheet("🏛️ Branches & Courses", 5);
  refSheet.clear();
  refSheet.setTabColor(SLATE);
  const refData = [
    ["BRANCH REFERENCE", "", "", ""],
    ["Branch ID", "Branch Name", "Location", "Phone"],
    ["dadagapatty", "CSK Academy", "Dadagapatty Main Road, Salem - 636006", "+91 94432 11001"],
    ["kondalampatty", "CSK Academy", "Kondalampatty Bypass Junction, Salem - 636010", "+91 94432 11002"],
    ["ammapet", "CSK Academy", "Ammapet Main Road, Salem - 636003", "+91 94432 11003"],
    ["new_bus_stand", "InfoSpark Innovation Pvt Ltd", "Opp. New Bus Stand, Meyyanur, Salem - 636004", "+91 94432 11004"],
    ["", "", "", ""],
    ["COURSE REFERENCE", "", "", ""],
    ["Course ID", "Course Code", "Course Name", "Standard Fee (Rs)"],
    ["crs-1", "AI-101", "Artificial Intelligence & Deep Learning (AI)", "30000"],
    ["crs-2", "CPP-102", "C / C++ Programming & Data Structures", "15000"],
    ["crs-3", "FSWD-103", "Full Stack Web Development (MERN / Python)", "25000"],
    ["crs-4", "DS-201", "Data Science & Machine Learning with Python", "35000"],
    ["crs-5", "DEVOPS-301", "Cloud Computing & DevOps Certification", "30000"],
    ["crs-6", "DM-401", "Digital Marketing & Growth Hacking", "18000"],
    ["crs-7", "INT-WEB30", "Full Stack Web Development Internship (30 Days)", "6500"],
    ["crs-8", "INT-AIML45", "Artificial Intelligence & Machine Learning Internship (45 Days)", "9000"]
  ];
  refSheet.getRange(1, 1, refData.length, 4).setValues(refData);
  refSheet.getRange("A1").setFontWeight("bold").setFontColor(SLATE).setFontSize(12);
  refSheet.getRange("A2:D2").setBackground(SLATE).setFontColor(WHITE).setFontWeight("bold");
  refSheet.getRange("A8").setFontWeight("bold").setFontColor(SLATE).setFontSize(12);
  refSheet.getRange("A9:D9").setBackground(SLATE).setFontColor(WHITE).setFontWeight("bold");

  // Auto-resize columns on all sheets
  const sheets = [adminSheet, mgrSheet, staffSheet, stuSheet, refSheet];
  sheets.forEach(sh => {
    sh.autoResizeColumns(1, sh.getLastColumn());
  });

  SpreadsheetApp.getUi().alert("✅ CSK Academy & InfoSpark Data Collection Template initialized successfully with all 6 tabs!");
}
