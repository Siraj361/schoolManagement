const CRUD_ACTIONS = ["read", "create", "update", "delete"];

const PERMISSION_MODULES = [
  ["module", "General module access"], ["dashboard", "Dashboard"], ["students", "Students"], ["students.admissions", "Admissions"],
  ["students.attendance", "Student attendance"], ["students.submissions", "Assignments & labs"], ["students.grades", "Gradebook"],
  ["academics", "Academics"], ["academics.courses", "Courses"], ["academics.programs", "Landing programs"], ["academics.batches", "Batches"],
  ["academics.batches.schedule", "Batch schedule"], ["academics.labs", "Labs & rooms"], ["academics.certifications", "Certifications"],
  ["teachers", "Teachers"], ["teachers.allocations", "Teacher allocations"], ["teachers.attendance", "Faculty attendance"], ["teachers.reviews", "Faculty reviews"], ["team.applications", "Team applications"], ["contact.messages", "Website contact messages"],
  ["fees", "Fees & finance"], ["fees.invoices", "Invoices"], ["fees.collect", "Fee collection"], ["fees.expenses", "Daily expenses"], ["fees.defaulters", "Defaulters"], ["fees.scholarships", "Scholarships"],
  ["staff", "Staff & HR"], ["staff.attendance", "Staff attendance"], ["staff.leaves", "Leave management"], ["staff.payroll", "Payroll"],
  ["reports", "Reports"], ["reports.academics", "Academic reports"], ["reports.financial", "Financial reports"], ["reports.retention", "Retention reports"],
  ["settings.profile", "Institute profile"], ["settings.permissions", "Roles & permissions"],
];

const modulePermissions = (modules) => modules.flatMap((module) => CRUD_ACTIONS.map((action) => `${module}.${action}`));
const ALL_PERMISSIONS = modulePermissions(PERMISSION_MODULES.map(([module]) => module));
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ["*"],
  ADMIN: modulePermissions(PERMISSION_MODULES.filter(([module]) => module !== "settings.permissions").map(([module]) => module)),
  ACADEMIC_HEAD: modulePermissions(["dashboard", "students", "students.attendance", "students.submissions", "students.grades", "academics", "academics.courses", "academics.programs", "academics.batches", "academics.batches.schedule", "academics.labs", "academics.certifications", "teachers", "teachers.allocations", "teachers.attendance", "teachers.reviews", "reports", "reports.academics"]),
  INSTRUCTOR: [],
  STUDENT: [],
  ACCOUNTS: modulePermissions(["dashboard", "fees", "fees.invoices", "fees.collect", "fees.expenses", "fees.defaulters", "fees.scholarships", "reports", "reports.financial"]),
  CASHIER: modulePermissions(["dashboard", "fees", "fees.collect", "fees.invoices"]),
  HR: modulePermissions(["dashboard", "teachers", "teachers.attendance", "teachers.reviews", "team.applications", "staff", "staff.attendance", "staff.leaves", "staff.payroll"]),
  LAB_ADMIN: modulePermissions(["dashboard", "academics.labs"]),
  ADMISSION_OFFICER: modulePermissions(["dashboard", "students", "students.admissions", "contact.messages"]),
  STAFF: modulePermissions(["dashboard", "students"]),
};
const PERMISSION_CATALOG = PERMISSION_MODULES.map(([module, label]) => ({ module, label, actions: CRUD_ACTIONS }));
const normalizePermissions = (permissions) => [...new Set((Array.isArray(permissions) ? permissions : []).flatMap((permission) => typeof permission === "string" && permission.endsWith(".write") ? [`${permission.slice(0, -6)}.create`, `${permission.slice(0, -6)}.update`] : permission))];

module.exports = { CRUD_ACTIONS, PERMISSION_MODULES, PERMISSION_CATALOG, ROLE_PERMISSIONS, ALL_PERMISSIONS, normalizePermissions };
