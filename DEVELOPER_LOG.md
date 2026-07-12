# TransitOps — Team Developer Log & Change Ledger

This document acts as the central coordinator for the 4-member hackathon team and records all changes made to the codebase by both team members and the AI assistant.

---

## 1. Team Assignments & File Ownership

| Member | Role | Responsibilities | Files Owned / Developed |
|---|---|---|---|
| **P1** | Backend – Core & Identity | Auth, Users, Roles, Vehicle Registry, Driver Management, Dashboard KPI aggregation | `backend/src/routes/auth.js`, `backend/src/routes/vehicles.js`, `backend/src/routes/drivers.js`, `backend/src/routes/dashboard.js`, `backend/src/models/User.js`, `backend/src/models/Vehicle.js`, `backend/src/models/Driver.js` |
| **P2** | Backend – Operations & Analytics | Trip lifecycle + cascade rules, Maintenance workflow, Fuel & Expense logging, Reports & Analytics, CSV export | `backend/src/routes/trips.js`, `backend/src/routes/maintenance.js`, `backend/src/routes/fuelLogs.js`, `backend/src/routes/expenses.js`, `backend/src/routes/reports.js`, `backend/src/models/Trip.js`, `backend/src/models/Maintenance.js`, `backend/src/models/FuelLog.js`, `backend/src/models/Expense.js` |
| **P3** | Frontend – Identity & Core Data | Login, Signup, App Shell Layout, Dashboard Screen, Vehicle Registry Screen, Driver Management Screen | `frontend/src/pages/Login.jsx`, `frontend/src/pages/Signup.jsx`, `frontend/src/pages/Dashboard.jsx`, `frontend/src/pages/Vehicles.jsx`, `frontend/src/pages/Drivers.jsx`, `frontend/src/context/AuthContext.jsx`, `frontend/src/components/Layout.jsx` |
| **P4** | Frontend – Operations | Trip Management Screen, Maintenance Screen, Fuel & Expense Screen, Reports & Analytics Screen (Recharts & CSV trigger) | `frontend/src/pages/Trips.jsx`, `frontend/src/pages/Maintenance.jsx`, `frontend/src/pages/Expenses.jsx`, `frontend/src/pages/Reports.jsx` |

---

## 2. Environment Configuration

### Backend
- **Port:** `5000` (API Base: `http://localhost:5000/api`)
- **DB:** MongoDB (`mongodb://127.0.0.1:27017/transitops`)
- **Key Files:** `backend/.env`, `backend/src/index.js`
- **Commands:**
  - Start Server: `npm run dev`
  - Seed DB: `npm run seed`

### Frontend
- **Port:** `5173` (Base: `http://localhost:5173`)
- **Key Files:** `frontend/.env`, `frontend/src/main.jsx`
- **Commands:**
  - Start Client: `npm run dev`
  - Build Assets: `npm run build`

---

## 3. Change Ledger (Update with Name/AI on each change)

Please record all manual or AI-assisted updates to the codebase below.

| Date / Time | Author | Component / Area | Description of Changes | Impacted Files |
|---|---|---|---|---|
| 2026-07-12 10:39 | **Antigravity (AI)** | Frontend Setup | Enabled Tailwind CSS Vite compilation & fixed syntax warning | `frontend/vite.config.js`, `frontend/src/index.css` |
| 2026-07-12 10:42 | **Antigravity (AI)** | Frontend Setup | Configured path aliases `@/*` and initialized shadcn/ui Nova preset | `frontend/jsconfig.json`, `frontend/vite.config.js` |
| 2026-07-12 10:43 | **Antigravity (AI)** | Frontend Setup | Installed Shadcn UI components (button, card, dialog, input, label, select, table, tabs, dropdown-menu) | `frontend/src/components/ui/*` |
| 2026-07-12 10:48 | **Antigravity (AI)** | Backend Setup | Initialized Node project, installed dependencies, configured database connection and index router | `backend/package.json`, `backend/.env`, `backend/src/index.js`, `backend/src/config/db.js` |
| 2026-07-12 10:50 | **Antigravity (AI)** | Backend Setup | Implemented all Mongoose Schemas (User, Vehicle, Driver, Trip, Maintenance, FuelLog, Expense) | `backend/src/models/*` |
| 2026-07-12 10:52 | **Antigravity (AI)** | Backend Setup | Created Authentication and Role-Based Access Control middleware | `backend/src/middleware/auth.js` |
| 2026-07-12 10:55 | **Antigravity (AI)** | Backend Setup | Built API route controllers matching all required end-to-end endpoints | `backend/src/routes/*` |
| 2026-07-12 10:58 | **Antigravity (AI)** | Backend Setup | Wrote sample database seeder script containing mock users, active/completed trips, and logs | `backend/src/seed.js` |
| 2026-07-12 11:02 | **Antigravity (AI)** | Frontend Code | Implemented Axios interceptor client and Global Auth Context for session persistence | `frontend/src/services/api.js`, `frontend/src/context/AuthContext.jsx` |
| 2026-07-12 11:05 | **Antigravity (AI)** | Frontend Code | Configured React Router routes, Protected Route guards, and layout sidebar navigation | `frontend/src/App.jsx`, `frontend/src/components/Layout.jsx` |
| 2026-07-12 11:10 | **Antigravity (AI)** | Frontend Code | Programmed complete page shells and interactive modals for all application screens | `frontend/src/pages/*` |
| 2026-07-12 11:20 | **Antigravity (AI)** | Git Config | Updated root .gitignore to ignore node_modules, dist and .env for both frontend and backend, while tracking .env.example and lockfiles | `.gitignore` |

---

## 4. Work Coordination Guidelines

1. **No Out-of-Scope Work:** Keep PDF generation, email reminders, and document uploads disabled. Stick strictly to the features listed in Section 5 of the Roadmap.
2. **Status Transitions:** Never write `vehicle.status = 'On Trip'` directly on the frontend. Invoke the `/dispatch` or `/complete` POST actions on the backend, and let the backend cascade the status changes.
3. **Avoid Conflicts:** Coordinate edits to shared folders like `/models` or shared config files before writing changes.
