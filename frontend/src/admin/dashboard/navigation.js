import {
  BadgeCheck, BarChart3, BookOpen, Building2, CalendarDays, ClipboardCheck, Mail,
  FileBarChart, FileText, GraduationCap, LayoutDashboard, Microscope, Receipt, Settings,
  ShieldCheck, UserCog, Users, Wallet,
} from 'lucide-react'

export const navigationSections = [
  { label: 'Dashboard', items: [{ label: 'Overview', path: '/dashboard', icon: LayoutDashboard, description: 'KPI stats, active classes, fee collection ticker, and quick alerts.', roles: ['All roles'] }] },
  { label: 'Students', items: [
    { label: 'Admissions & inquiries', path: '/students/admissions', icon: ClipboardCheck, description: 'Manage inquiry pipeline, entrance tests, and registration forms.', roles: ['Admission Officer', 'Admin'] },
    { label: 'Website contact messages', path: '/contact/messages', icon: Mail, description: 'View and manage messages sent through the public landing page contact form.', roles: ['Admission Officer', 'Admin'] },
    { label: 'All students', path: '/students', icon: GraduationCap, description: 'Filter students by batch or track and perform bulk actions.', roles: ['Admin', 'Staff', 'Instructors'] },
    { label: 'Attendance', path: '/students/attendance', icon: CalendarDays, description: 'Review daily session check-ins, biometric logs, and absence alerts.', roles: ['Instructors', 'TAs', 'Admin'] },
    { label: 'Performance & gradebook', path: '/students/grades', icon: BarChart3, description: 'Manage lab scores, exams, GPA, and downloadable grade cards.', roles: ['Instructors', 'Academic Head'] },
    { label: 'Assignments & labs', path: '/students/submissions', icon: FileText, description: 'Review repositories, ZIP uploads, and code scoring rubrics.', roles: ['Instructors', 'TAs'] },
  ] },
  { label: 'Academics & courses', items: [
    { label: 'Courses & tracks', path: '/academics/courses', icon: BookOpen, description: 'Course catalog, prerequisites, syllabus builder, and tech stacks.', roles: ['Super Admin', 'Academic Head'] },
    { label: 'Landing page programs', path: '/academics/programs', icon: BookOpen, description: 'Create and edit the academic programs displayed on the public landing page.', roles: ['Super Admin', 'Academic Head'] },
    { label: 'Batches & cohorts', path: '/academics/batches', icon: Users, description: 'Manage cohort dates, shifts, mentors, and active enrollments.', roles: ['Admin', 'Academic Head'] },
    { label: 'Batch schedule', path: '/academics/batches/schedule', icon: CalendarDays, description: 'Coordinate batch timetables, sessions, and room assignments.', roles: ['Academic Head'] },
    { label: 'Lab & room allocation', path: '/academics/labs', icon: Microscope, description: 'Track PC terminals, rooms, network setup, and hardware status.', roles: ['Lab Admin', 'Staff'] },
    { label: 'Exams & certifications', path: '/academics/certifications', icon: BadgeCheck, description: 'Manage exams, verification, badges, and QR-code validation.', roles: ['Super Admin', 'Instructors'] },
  ] },
  { label: 'Teachers & instructors', items: [
    { label: 'Faculty directory', path: '/teachers', icon: Users, description: 'Manage teacher profiles, specializations, and contract rates.', roles: ['Super Admin', 'HR'] },
    { label: 'Team applications', path: '/team/applications', icon: ClipboardCheck, description: 'Review faculty, software house community, and internship applications and CVs.', roles: ['Super Admin', 'Admin', 'HR'] },
    { label: 'Workload & allocation', path: '/teachers/allocations', icon: UserCog, description: 'Resolve timetable conflicts and monitor lecture hours.', roles: ['Academic Head'] },
    { label: 'Faculty attendance', path: '/teachers/attendance', icon: ClipboardCheck, description: 'Track instructor attendance and attendance exceptions.', roles: ['Super Admin', 'HR'] },
    { label: 'Ratings & feedback', path: '/teachers/reviews', icon: BadgeCheck, description: 'Review instructor feedback, ratings, and improvement signals.', roles: ['Academic Head', 'HR'] },
  ] },
  { label: 'Fees & finance', items: [
    { label: 'Check Fees', path: '/fees', icon: Wallet, description: 'Monitor collections, outstanding balances, and finance KPIs.', roles: ['Accounts', 'Admin'] },
    { label: 'Invoices & vouchers', path: '/fees/invoices', icon: Receipt, description: 'Generate batch-wise fee challans, invoices, and recurring plans.', roles: ['Accounts', 'Admin'] },
    { label: 'Daily expenses', path: '/fees/expenses', icon: Wallet, description: 'Record institute spending, vendors, payment methods, and daily operating costs.', roles: ['Accounts', 'Admin', 'Super Admin'] },
    { label: 'Defaulters list', path: '/fees/defaulters', icon: FileText, description: 'Track due balances and dispatch SMS, email, or WhatsApp reminders.', roles: ['Accounts', 'Admin'] },
    { label: 'Scholarships & concessions', path: '/fees/scholarships', icon: BadgeCheck, description: 'Manage approved scholarships, discounts, and concessions.', roles: ['Admin', 'Accounts'] },
  ] },
  { label: 'Staff & HR', items: [
    { label: 'Staff directory', path: '/staff', icon: Users, description: 'Manage lab assistants, support, front desk, and other staff.', roles: ['HR', 'Super Admin'] },
    { label: 'Attendance & biometric', path: '/staff/attendance', icon: ClipboardCheck, description: 'Review staff attendance and biometric activity.', roles: ['HR', 'Admin'] },
    { label: 'Leave management', path: '/staff/leaves', icon: CalendarDays, description: 'Review leave requests, balances, and approvals.', roles: ['HR', 'Managers'] },
    { label: 'Payroll & salaries', path: '/staff/payroll', icon: Wallet, description: 'Prepare pay stubs, deductions, allowances, and bank payments.', roles: ['Super Admin', 'HR', 'Accounts'] },
  ] },
  { label: 'Reports & audit', items: [
    { label: 'Academic reports', path: '/reports/academics', icon: FileBarChart, description: 'Analyze courses, attendance, outcomes, and academic performance.', roles: ['Admin', 'Academic Head'] },
    { label: 'Financial reports', path: '/reports/financial', icon: BarChart3, description: 'Review revenue, collections, invoices, and outstanding balances.', roles: ['Accounts', 'Admin'] },
    { label: 'Retention reports', path: '/reports/retention', icon: FileText, description: 'Track student drop-off, retention, and cohort health.', roles: ['Admin', 'Academic Head'] },
  ] },
  { label: 'Settings & system', items: [
    { label: 'Institute profile', path: '/settings/profile', icon: Building2, description: 'Manage institute identity, contact details, and academic year.', roles: ['Super Admin'] },
    { label: 'Life at The Prime', path: '/settings/life-at-prime', icon: CalendarDays, description: 'Manage the public campus experience heading and categories.', roles: ['Super Admin'] },
    { label: 'Roles & permissions', path: '/settings/roles', icon: ShieldCheck, description: 'Manage create, read, update, and delete permissions per role.', roles: ['Super Admin'] },
    { label: 'Payment gateways & SMS API', path: '/settings/integrations', icon: Settings, description: 'Configure payment providers, SMS, email, and WhatsApp integrations.', roles: ['Super Admin'] },
    { label: 'Audit / activity logs', path: '/settings/logs', icon: FileText, description: 'Review logins, grade overrides, and manual fee status changes.', roles: ['Super Admin'] },
  ] },
]

export const navigationItems = navigationSections.flatMap((section) => section.items.map((item) => ({ ...item, section: section.label })))
export const itemByPath = Object.fromEntries(navigationItems.map((item) => [item.path, item]))
