# Postman API Payloads

Base URL:

```text
http://localhost:5000/api/v1
```

## Postman Variables

```text
baseUrl = http://localhost:5000/api/v1
accessToken = paste-login-access-token-here
studentId = student-uuid
invoiceId = invoice-uuid
userId = user-uuid
```

For protected endpoints add:

```text
Authorization: Bearer {{accessToken}}
```

All JSON requests use:

```text
Content-Type: application/json
```

## 1. Authentication

### Login

```http
POST {{baseUrl}}/auth/login
```

Body, raw JSON:

```json
{
  "email": "admin@theprime.edu.pk",
  "password": "ChangeMe123!"
}
```

Save `data.accessToken` as `accessToken`. The seeded admin has role `SUPER_ADMIN`.

### Current user

```http
GET {{baseUrl}}/auth/me
Authorization: Bearer {{accessToken}}
```

### Verify JWT token

```http
GET {{baseUrl}}/auth/verify
Authorization: Bearer {{accessToken}}
```

Returns `valid: true` with the verified `userId`, `instituteId`, `role`, `iat`, and `exp` claims. Missing, expired, or modified tokens return `401 Unauthorized`.

### Logout and revoke token

```http
POST {{baseUrl}}/auth/logout
Authorization: Bearer {{accessToken}}
```

The current user's token is revoked immediately. A new login is required after logout.

### Update my profile

```http
PATCH {{baseUrl}}/auth/me
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data
```

Postman Body: `form-data`

```text
firstName: Siraj
lastName: Ahmed
email: siraj@example.com
avatar: profile.jpg (File, optional)
currentPassword: OldPassword123 (required only when changing password)
newPassword: NewPassword123 (optional)
```

The logged-in user can update only their own profile. Role, permissions, `instituteId`, and user ID cannot be changed through this endpoint.

## 2. Dashboard

### Overview

```http
GET {{baseUrl}}/dashboard/overview
Authorization: Bearer {{accessToken}}
```

## 3. Students

### List students

```http
GET {{baseUrl}}/students?search=Ahmed&limit=25&offset=0
Authorization: Bearer {{accessToken}}
```

### Register student with photo

```http
POST {{baseUrl}}/students
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data
```

Postman Body: `form-data`

| Key | Type | Example |
|---|---|---|
| `name` | Text | `Ahmed Khan` |
| `fatherName` | Text | `Muhammad Khan` |
| `courseName` | Text | `Full Stack Web Development` |
| `registrationDate` | Text | `2026-09-11` |
| `batchId` | Text, optional | `batch-uuid` |
| `photo` | File, optional | `student.jpg` |

Do not manually set the multipart boundary header. Postman sets it automatically.

The backend calculates `expiryDate` one year after `registrationDate` and does not create a fee invoice.

### Replace student photo

```http
POST {{baseUrl}}/students/{{studentId}}/photo
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data
```

Postman Body: `form-data`

```text
photo: student-new.jpg   (File)
```

### Verify student ID card

```http
GET {{baseUrl}}/public/verify/student/STU-1001?sig=verification-token
```

No authentication is required. The signed response exposes only public student verification data.

## 4. Finance

### Finance overview

```http
GET {{baseUrl}}/fees
Authorization: Bearer {{accessToken}}
```

### List invoices

```http
GET {{baseUrl}}/fees/invoices?status=PENDING&limit=25&offset=0
Authorization: Bearer {{accessToken}}
```

### Create invoice

```http
POST {{baseUrl}}/fees/invoices
Authorization: Bearer {{accessToken}}
```

Body, raw JSON:

```json
{
  "studentId": "{{studentId}}",
  "amountMinor": 4800000,
  "dueDate": "2026-09-30",
  "description": "September 2026 tuition fee"
}
```

`amountMinor` is PKR minor units. For this project, `4800000` represents Rs 48,000.

### Collect payment

```http
POST {{baseUrl}}/fees/collect
Authorization: Bearer {{accessToken}}
Idempotency-Key: payment-{{studentId}}-2026-09-11-01
```

Body, raw JSON:

```json
{
  "invoiceId": "{{invoiceId}}",
  "amountMinor": 4800000,
  "method": "CASH"
}
```

Allowed methods:

```text
CASH, BANK_TRANSFER, CARD, ONLINE
```

Repeating the same `Idempotency-Key` returns the original receipt and does not create a duplicate payment.

### List payments

```http
GET {{baseUrl}}/fees/payments?limit=50
Authorization: Bearer {{accessToken}}
```

### Defaulters

```http
GET {{baseUrl}}/fees/defaulters
Authorization: Bearer {{accessToken}}
```

### List scholarships

```http
GET {{baseUrl}}/fees/scholarships
Authorization: Bearer {{accessToken}}
```

### Create scholarship

```http
POST {{baseUrl}}/fees/scholarships
Authorization: Bearer {{accessToken}}
```

Body, raw JSON:

```json
{
  "studentId": "{{studentId}}",
  "type": "PERCENTAGE",
  "percentage": 25,
  "validFrom": "2026-09-01",
  "validUntil": "2027-08-31"
}
```

For a fixed concession:

```json
{
  "studentId": "{{studentId}}",
  "type": "FIXED",
  "amountMinor": 500000,
  "validFrom": "2026-09-01",
  "validUntil": "2027-08-31"
}
```

## 5. Super Admin Users and Permissions

These endpoints require a `SUPER_ADMIN` token.

### List users

```http
GET {{baseUrl}}/settings/users
Authorization: Bearer {{accessToken}}
```

### Create user with profile image

```http
POST {{baseUrl}}/settings/users
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data
```

Postman Body: `form-data`

| Key | Type | Example |
|---|---|---|
| `firstName` | Text | `Ali` |
| `lastName` | Text | `Khan` |
| `email` | Text | `ali@theprime.edu.pk` |
| `password` | Text | `StrongPass123` |
| `role` | Text | `ADMIN` |
| `avatar` | File, optional | `ali.jpg` |

Allowed roles:

```text
ADMIN, ACADEMIC_HEAD, INSTRUCTOR, ACCOUNTS, CASHIER,
HR, LAB_ADMIN, ADMISSION_OFFICER, STAFF
```

### List role permissions

```http
GET {{baseUrl}}/settings/roles
Authorization: Bearer {{accessToken}}
```

### Update role permissions

```http
PUT {{baseUrl}}/settings/roles/ACCOUNTS
Authorization: Bearer {{accessToken}}
```

Body, raw JSON:

```json
{
  "permissions": [
    "dashboard.read",
    "fees.read",
    "fees.write",
    "reports.financial"
  ]
}
```

### Get one user's effective permissions

```http
GET {{baseUrl}}/settings/users/{{userId}}/access
Authorization: Bearer {{accessToken}}
```

### Update one user's permissions

```http
PUT {{baseUrl}}/settings/users/{{userId}}/access
Authorization: Bearer {{accessToken}}
```

Body, raw JSON:

```json
{
  "permissions": [
    "dashboard.read",
    "students.read",
    "students.attendance"
  ]
}
```

## 6. Generic Sidebar Module APIs

These endpoints are available for the current sidebar workspaces:

```text
academics-courses
academics-batches
academics-batches-schedule
academics-labs
academics-certifications
students-admissions
students-attendance
students-submissions
students-grades
teachers
teachers-allocations
teachers-attendance
teachers-reviews
staff
staff-attendance
staff-leaves
staff-payroll
reports-academics
reports-financial
reports-retention
settings-profile
settings-integrations
settings-logs
```

### List module records

```http
GET {{baseUrl}}/modules/academics-courses?search=Web&limit=100
Authorization: Bearer {{accessToken}}
```

Replace `academics-courses` with any module key above.

### Create module record

```http
POST {{baseUrl}}/modules/academics-courses
Authorization: Bearer {{accessToken}}
```

Body, raw JSON:

```json
{
  "name": "Full Stack Web Development",
  "details": {
    "durationMonths": 12,
    "delivery": "On campus"
  },
  "status": "ACTIVE",
  "owner": "Academic office"
}
```

### Update module record

```http
PATCH {{baseUrl}}/modules/academics-courses/{{recordId}}
Authorization: Bearer {{accessToken}}
```

Body, raw JSON:

```json
{
  "name": "Full Stack Web Development - Updated",
  "status": "ACTIVE",
  "details": {
    "durationMonths": 12
  }
}
```

## Permission Names

```text
dashboard.read
students.read
students.write
students.attendance
students.submissions
students.grades
students.admissions
teachers.read
staff.read
staff.write
academics.labs
fees.read
fees.write
fees.collect
reports.read
reports.academics
reports.financial
settings.profile
settings.permissions
module.read
module.write
```

`SUPER_ADMIN` bypasses permission checks and has complete access. Never send `passwordHash` in a request or response; passwords are hashed by the backend.

## Local Setup

If the database was created before numeric user IDs were enabled, run this one-time migration before creating new users:

```powershell
cd backend
npm run migrate:user-ids
```

It converts existing `users.id` values to sequential integers (`1`, `2`, `3`) and updates user references in batches, payments, and audit logs. Back up the database before running it.

```powershell
cd backend
npm install
npm run seed
npm run dev
```

The default seeded Super Admin is:

```text
Email: admin@theprime.edu.pk
Password: ChangeMe123!
```
