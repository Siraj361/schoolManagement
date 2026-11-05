# The Prime Admin Backend API Specification

This document defines the backend contract required by the current The Prime Institute admin frontend.

## 1. Current Status

The backend currently provides the Express app shell and MySQL/Sequelize connection only. The route, controller, service, and model folders are not implemented yet.

The frontend currently contains local demo state for dashboard records. The endpoints below are the contract to replace that local state with persistent backend data.

## 2. Base URL and Conventions

```text
Local API: http://localhost:5000/api/v1
Content-Type: application/json
Authentication: Authorization: Bearer <jwt>
```

Success response:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Readable error message",
    "fields": {}
  }
}
```

Use ISO 8601 timestamps in API responses. Monetary values must be stored as integer minor units in the database and returned with currency metadata.

```json
{
  "amountMinor": 4800000,
  "currency": "PKR",
  "displayAmount": "Rs 48,000"
}
```

## 3. Authentication and RBAC

### Auth endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | Login with email and password |
| POST | `/auth/refresh` | Refresh an access token |
| POST | `/auth/logout` | Revoke refresh token |
| GET | `/auth/me` | Return current user and permissions |

JWT claims should include `userId`, `instituteId`, and `role`.

### Roles

- `SUPER_ADMIN`: full institute access
- `ADMIN`: operational institute management
- `ACADEMIC_HEAD`: courses, batches, faculty allocation, academic reports
- `INSTRUCTOR`: assigned batches, attendance, submissions, grades
- `ACCOUNTS`: invoices, payments, defaulters, scholarships
- `CASHIER`: payment collection and receipts
- `HR`: faculty/staff, attendance, leaves, payroll
- `LAB_ADMIN`: labs, rooms, terminals
- `ADMISSION_OFFICER`: admissions and inquiries
- `STAFF`: permitted operational read/write actions

Every protected endpoint must apply both role and institute scope. A user must never read or mutate records belonging to another institute.

## 4. Route Architecture

### Dashboard

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/dashboard/overview` | KPIs, collection trend, attendance, admissions, sessions, assignment alerts |
| GET | `/dashboard/activity` | Recent cross-module activity |

### Academics and courses

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/academics/courses` | List courses and tracks |
| POST | `/academics/courses` | Create a course |
| GET | `/academics/courses/:courseId` | Course details |
| PATCH | `/academics/courses/:courseId` | Update a course |
| DELETE | `/academics/courses/:courseId` | Archive a course |
| GET | `/academics/courses/:courseId/curriculum` | List modules |
| POST | `/academics/courses/:courseId/curriculum` | Add a module |
| GET | `/academics/batches` | List batches/cohorts |
| POST | `/academics/batches` | Create a batch |
| PATCH | `/academics/batches/:batchId` | Update batch details |
| GET | `/academics/batches/schedule` | List sessions by date range |
| POST | `/academics/batches/schedule` | Create a timetable session |
| PATCH | `/academics/schedule/:sessionId` | Reschedule a session |
| GET | `/academics/labs` | List labs, rooms, and terminal capacity |
| POST | `/academics/labs` | Create a room or lab |
| PATCH | `/academics/labs/:labId` | Update room/network status |
| GET | `/academics/certifications` | List exams and certificate programs |
| POST | `/academics/certifications` | Create an exam/certification |
| POST | `/academics/certifications/:id/issue` | Issue certificates |
| GET | `/academics/certifications/verify/:certificateId` | Public certificate verification |

### Students

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/students` | Paginated/filterable student list |
| POST | `/students` | Register student without fee collection |
| GET | `/students/:studentId` | Student profile |
| PATCH | `/students/:studentId` | Update profile |
| POST | `/students/:studentId/photo` | Upload/replace student photo |
| GET | `/students/:studentId/id-card` | Return ID-card data and print metadata |
| GET | `/students/:studentId/id-card/qr` | Return QR verification payload |
| GET | `/students/admissions` | Admission inquiry pipeline |
| POST | `/students/admissions` | Create an inquiry |
| PATCH | `/students/admissions/:inquiryId` | Move inquiry stage |
| GET | `/students/attendance` | Daily attendance with filters |
| POST | `/students/attendance` | Mark attendance |
| POST | `/students/attendance/sync` | Sync biometric records |
| GET | `/students/submissions` | Assignment and lab submissions |
| POST | `/students/submissions/assignments` | Create an assignment for a batch |
| POST | `/students/submissions` | Create assignment submission |
| PATCH | `/students/submissions/:submissionId/review` | Add rubric score/review |
| GET | `/students/grades` | Gradebook records |
| POST | `/students/grades` | Add/update lab or exam grade |
| GET | `/students/:studentId/grade-card` | Generate grade card data |

### Teachers and instructors

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/teachers` | Faculty directory |
| POST | `/teachers` | Add instructor |
| PATCH | `/teachers/:teacherId` | Update instructor |
|  |  | Instructor compensation accepts `compensationType` (`FIXED` or `PERCENTAGE`), `fixedSalary`, and `percentage`. Percentage earnings are calculated from collected payments for students in the instructor's assigned batches. |
| GET | `/teachers/allocations` | Teaching workload and conflicts |
| POST | `/teachers/allocations` | Allocate batch/session |
| GET | `/teachers/attendance` | Faculty attendance |
| POST | `/teachers/attendance` | Mark faculty attendance |
| GET | `/teachers/reviews` | Ratings and feedback |
| POST | `/teachers/reviews` | Submit feedback |

### Fees and finance

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/fees` | Finance overview KPIs |
| GET | `/fees/invoices` | List invoices and vouchers |
| POST | `/fees/invoices` | Create invoice |
| GET | `/fees/invoices/:invoiceId` | Invoice details |
| PATCH | `/fees/invoices/:invoiceId` | Update invoice status |
| POST | `/fees/collect` | Record payment and issue receipt |
| GET | `/fees/payments` | Payment history |
| GET | `/fees/defaulters` | Students with outstanding balances |
| POST | `/fees/defaulters/reminders` | Send payment reminders |
| GET | `/fees/scholarships` | Scholarship/concession list |
| POST | `/fees/scholarships` | Create concession |
| PATCH | `/fees/scholarships/:id` | Approve/update concession |

Payment creation must be idempotent using an `Idempotency-Key` header. A duplicate request must return the original receipt instead of creating a second payment.

### Staff and HR

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/staff` | Staff directory |
| POST | `/staff` | Add non-teaching staff |
| GET | `/staff/attendance` | Staff attendance and biometric records |
| POST | `/staff/attendance` | Mark staff attendance |
| GET | `/staff/leaves` | Leave requests |
| POST | `/staff/leaves` | Create leave request |
| PATCH | `/staff/leaves/:id` | Approve/reject leave |
| GET | `/staff/payroll` | Payroll records |
| POST | `/staff/payroll` | Create payroll run |

### Reports and audit

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/reports/academics` | Academic performance report |
| GET | `/reports/financial` | Financial report |
| GET | `/reports/retention` | Drop-off and retention report |
| GET | `/settings/logs` | Audit/activity logs |

### Settings and system

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/settings/profile` | Institute profile |
| PATCH | `/settings/profile` | Update institute profile |
| GET | `/settings/roles` | Role/permission matrix |
| PUT | `/settings/roles/:roleId` | Update role permissions |
| GET | `/settings/integrations` | Integration status |
| POST | `/settings/integrations` | Configure gateway/SMS/email/WhatsApp |
| PATCH | `/settings/integrations/:id` | Update integration |

## 5. Core Database Models

### Institute

`id`, `name`, `shortName`, `logoUrl`, `email`, `phone`, `address`, `facebookUrl`, `instagramUrl`, `linkedinUrl`, `yearsOfExcellence`, `academicYear`, `timezone`, `createdAt`, `updatedAt`

### User

`id`, `instituteId`, `roleId`, `firstName`, `lastName`, `email`, `passwordHash`, `status`, `lastLoginAt`, timestamps

### Student

`id`, `instituteId`, `studentCode`, `name`, `fatherName`, `photoUrl`, `courseId`, `batchId`, `registrationDate`, `expiryDate`, `status`, timestamps

Registration must not require a fee. `expiryDate` is calculated as one year after `registrationDate`.

### Course and Batch

Course: `id`, `instituteId`, `name`, `slug`, `description`, `status`, `durationMonths`

Batch: `id`, `courseId`, `name`, `shift`, `startDate`, `endDate`, `mentorId`, `capacity`, `status`

### Student ID card verification

Store no sensitive data inside a QR code. Use a signed verification URL:

```text
https://app.theprime.edu.pk/verify/student/STU-1025?sig=<signature>
```

`GET /public/verify/student/:studentCode` should return only:

```json
{
  "success": true,
  "data": {
    "valid": true,
    "institute": "The Prime Institute of Science & Technology",
    "studentCode": "STU-1025",
    "name": "Student Name",
    "course": "Web Development",
    "registrationDate": "2026-09-11",
    "expiryDate": "2027-09-11",
    "status": "ACTIVE"
  }
}
```

### Attendance

`Attendance`: `id`, `instituteId`, `studentId`, `batchId`, `date`, `checkInAt`, `method`, `status`, `markedBy`

Statuses: `PRESENT`, `LATE`, `ABSENT`, `EXCUSED`.

### Assignment and gradebook

Assignment: `id`, `courseId`, `batchId`, `title`, `rubricJson`, `dueDate`

Submission: `id`, `assignmentId`, `studentId`, `sourceType`, `repositoryUrl`, `fileUrl`, `submittedAt`, `reviewStatus`, `score`, `reviewerId`, `feedback`

Grade: `id`, `studentId`, `courseId`, `batchId`, `assessmentType`, `assessmentId`, `score`, `maxScore`, `grade`, `gpa`, `gradedBy`

### Finance

Invoice: `id`, `instituteId`, `studentId`, `invoiceNumber`, `amountMinor`, `dueDate`, `status`, `description`

Payment: `id`, `invoiceId`, `studentId`, `receiptNumber`, `amountMinor`, `currency`, `method`, `paidAt`, `idempotencyKey`, `receivedBy`

Scholarship: `id`, `studentId`, `type`, `amountMinor`, `percentage`, `approvedBy`, `validFrom`, `validUntil`, `status`

### Audit log

`AuditLog`: `id`, `instituteId`, `actorId`, `action`, `entityType`, `entityId`, `beforeJson`, `afterJson`, `ipAddress`, `createdAt`

Write an audit log for profile changes, permission changes, grade overrides, invoice status changes, payments, attendance corrections, and certificate issuance.

## 6. Student Registration Workflow

1. Validate authenticated admin role and institute scope.
2. Validate name, father name, course, registration date, and optional photo.
3. Store photo in object storage and save only `photoUrl`.
4. Calculate `expiryDate = registrationDate + 1 year`.
5. Generate a unique student code such as `STU-1025`.
6. Create the student in a transaction.
7. Create a signed ID-card verification token/record.
8. Return the student profile, ID-card data, and verification URL.
9. Do not create an invoice or payment during registration.

## 7. Finance Payment Workflow

1. Validate invoice ownership and outstanding amount.
2. Require `Idempotency-Key`.
3. Lock the invoice row inside a database transaction.
4. Reject payment if invoice is already fully paid.
5. Create payment and receipt number.
6. Update invoice status to `PAID`, `PARTIAL`, or `OVERDUE`.
7. Write an audit log.
8. Return receipt data and updated balance.

## 8. Security Requirements

- Hash passwords with bcrypt or Argon2.
- Use short-lived access tokens and refresh-token rotation.
- Validate all body, query, and route parameters.
- Enforce institute ownership on every query.
- Rate-limit login, payment, OTP, and reminder endpoints.
- Never expose password hashes, internal storage paths, or raw integration secrets.
- Encrypt integration credentials at rest.
- Verify QR signatures server-side.
- Restrict file uploads by MIME type, size, and malware scanning.
- Use transactions for registration, payments, grading changes, payroll, and permission updates.

## 9. Suggested Backend Structure

```text
backend/src/
  app.js
  config/
    database.js
  middleware/
    auth.js
    authorize.js
    validate.js
    errorHandler.js
  models/
    index.js
    Institute.js
    User.js
    Role.js
    Student.js
    Course.js
    Batch.js
    Attendance.js
    Assignment.js
    Submission.js
    Grade.js
    Invoice.js
    Payment.js
    Scholarship.js
    AuditLog.js
  routes/
    auth.routes.js
    dashboard.routes.js
    academics.routes.js
    students.routes.js
    teachers.routes.js
    finance.routes.js
    staff.routes.js
    reports.routes.js
    settings.routes.js
  controllers/
  services/
    idCard.service.js
    qrVerification.service.js
    payment.service.js
    audit.service.js
    notification.service.js
```

## 10. Recommended Implementation Order

1. Database models and migrations.
2. Auth, JWT middleware, institute scoping, and RBAC.
3. Institute profile and student registration.
4. Student photo storage and signed QR verification.
5. Courses, batches, labs, and schedule APIs.
6. Attendance, assignments, gradebook, and certificates.
7. Invoices, payments, receipts, defaulters, and scholarships.
8. Faculty and HR modules.
9. Reports and audit logs.
10. Replace frontend demo state with API hooks and add integration tests.

## 11. Frontend Integration Notes

The current frontend routes are:

```text
/dashboard
/academics/*
/students/*
/teachers/*
/fees/*
/staff/*
/reports/*
/settings/*
```

The current UI contains demo records for many pages. Replace those records with API calls while preserving the existing response shapes where practical. Loading, empty, validation, permission-denied, and server-error states should be added to every page before production release.
