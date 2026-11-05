# Student Fee SaaS

Professional school fee management dashboard.

## Project structure

- `frontend/` React + Vite dashboard
- `backend/` Express + Sequelize API

## Backend documentation

- [Admin API specification](backend/docs/ADMIN_API_SPEC.md) - route contract, RBAC, database models, student ID/QR verification, finance workflows, audit logs, and implementation order.

## Run locally

```powershell
cd frontend
npm install
npm run dev
```

In another terminal:

```powershell
cd backend
npm install
npm run dev
```

The initial institute/admin bootstrap command does not create or modify courses:

```powershell
cd backend
npm run seed
```

Manage landing-page program data from **Admin → Academics & courses → Landing page programs**. Program records are stored in the `programs` database table and returned by `/api/v1/institutes/public`; adding a program does not require running a seed command. Set `PUBLIC_INSTITUTE_EMAIL` in the backend environment to the institute shown on the landing page (`theprimeinstitutehyd@gmail.com` by default); programs, courses, and active instructors are all scoped to this institute. The bootstrap command only initializes an institute and administrator; it does not seed programs.
